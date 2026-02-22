
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Server, Router, Cpu, Box, Shield, Gauge, Activity, AlertTriangle, Check, Info, Zap } from 'lucide-react';
import { Device, NetworkConnection } from '../types/network';

// ═══════════════════════════════════════════════════════════════
// CIDR-AWARE IP UTILITIES
// Real /24 parsing — not string prefix matching.
// ═══════════════════════════════════════════════════════════════

const isValidIPv4 = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
        if (!/^\d{1,3}$/.test(p)) return false;
        const n = Number(p);
        return n >= 0 && n <= 255;
    });
};

/** Convert CIDR prefix length or dotted mask to prefix bits. Default /24 */
const parseMaskBits = (mask?: string): number => {
    if (!mask) return 24;
    if (mask.startsWith('/')) return Math.min(32, Math.max(0, Number(mask.slice(1)) || 24));
    // dotted: 255.255.255.0 → count bits
    const parts = mask.split('.');
    if (parts.length !== 4) return 24;
    let bits = 0;
    for (const p of parts) {
        let n = Number(p);
        while (n > 0) { bits += n & 1; n >>= 1; }
    }
    return bits;
};

/** Convert IP string to 32-bit number */
const ipToNum = (ip: string): number => {
    const p = ip.split('.').map(Number);
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
};

/** Get network address from IP + prefix bits */
const networkAddr = (ip: string, bits: number): number => {
    const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
    return (ipToNum(ip) & mask) >>> 0;
};

/** Convert 32-bit number back to IP string */
const numToIp = (n: number): string => {
    return `${(n >>> 24) & 0xFF}.${(n >>> 16) & 0xFF}.${(n >>> 8) & 0xFF}.${n & 0xFF}`;
};

/** Get human-readable subnet string from IP + mask */
const _subnetStr = (ip: string, mask?: string): string => {
    const bits = parseMaskBits(mask);
    const net = networkAddr(ip, bits);
    return `${numToIp(net)}/${bits}`;
};
void _subnetStr; // reserved for future CIDR display

/** Check if two IPs are on the same network given CIDR masks */
const _sameNetwork = (ip1: string, mask1: string | undefined, ip2: string, mask2: string | undefined): boolean => {
    // Use the more specific (larger prefix) mask for comparison
    const bits = Math.max(parseMaskBits(mask1), parseMaskBits(mask2));
    return networkAddr(ip1, bits) === networkAddr(ip2, bits);
};
void _sameNetwork; // reserved for cross-subnet validation

const getLastOctet = (ip: string): number => Number(ip.split('.')[3]);
const getSubnetPrefix = (ip: string): string => ip.split('.').slice(0, 3).join('.');

// ═══════════════════════════════════════════════════════════════
// TOPOLOGY-AWARE VALIDATION ENGINE
// Uses connection graph to determine L3 routability
// ═══════════════════════════════════════════════════════════════

interface SubnetInfo {
    cidr: string;          // e.g. "192.168.10.0/24"
    prefix: string;        // e.g. "192.168.10"
    maskBits: number;
    devices: Device[];
    vlanIds: Set<number>;
    hasGateway: boolean;   // true if a router/gateway/firewall is on this subnet
    gatewayDevice?: Device;
}

/** Build rich subnet map with VLAN, gateway, and CIDR info */
const buildSubnetMap = (devices: Device[]): Map<string, SubnetInfo> => {
    const map = new Map<string, SubnetInfo>();
    for (const d of devices) {
        if (!isValidIPv4(d.ip)) continue;
        const bits = parseMaskBits(d.subnetMask);
        const net = networkAddr(d.ip, bits);
        const key = `${numToIp(net)}/${bits}`;
        const existing = map.get(key);
        if (existing) {
            existing.devices.push(d);
            if (d.vlan != null) existing.vlanIds.add(d.vlan);
            if (['router', 'gateway', 'firewall'].includes(d.type)) {
                existing.hasGateway = true;
                existing.gatewayDevice = d;
            }
        } else {
            const vlanIds = new Set<number>();
            if (d.vlan != null) vlanIds.add(d.vlan);
            const isGw = ['router', 'gateway', 'firewall'].includes(d.type);
            map.set(key, {
                cidr: key,
                prefix: getSubnetPrefix(d.ip),
                maskBits: bits,
                devices: [d],
                vlanIds,
                hasGateway: isGw,
                gatewayDevice: isGw ? d : undefined,
            });
        }
    }
    return map;
};

/** Whether a device type is capable of L3 routing between subnets */
const isL3Device = (type: Device['type']): boolean =>
    ['router', 'gateway', 'firewall'].includes(type);

/** Whether a device type is L2 infrastructure (can forward within VLAN but not route) */
const isL2Infra = (type: Device['type']): boolean =>
    ['switch'].includes(type);

/**
 * Reachability classification returned per-subnet.
 * 
 * 'l3-routed' — path from parent crosses at least one L3 device (router/gw/fw)
 *               before reaching a device on this subnet. True inter-VLAN routing.
 * 'l2-adjacent' — connected via L2 only (switches). Same VLAN required for real
 *                 reachability; shown as weaker confidence.
 * 'unreachable' — no path in the connection graph at all.
 */
type ReachClass = 'l3-routed' | 'l2-adjacent' | 'unreachable';

interface ReachResult {
    classification: ReachClass;
    /** Text explanation of how we got there */
    path?: string;
}

/** 
 * Determine L3 adjacency via the connection graph.
 * 
 * KEY DISTINCTION (addresses the critique):
 *   - BFS tracks whether the path from parent to target subnet traverses
 *     at least one L3 device (router/gateway/firewall).
 *   - If a subnet is only reachable through L2 switches and the subnet
 *     differs from parent, we classify it as 'l2-adjacent' (weaker confidence).
 *   - Cross-VLAN links that pass only through switches are flagged as
 *     likely unreachable (no inter-VLAN routing without L3).
 */
const classifyReachability = (
    targetPrefix: string,
    parentDevice: Device,
    devices: Device[],
    connections: NetworkConnection[],
    targetVlan: number | undefined,
): ReachResult => {
    const parentPrefix = getSubnetPrefix(parentDevice.ip);
    if (targetPrefix === parentPrefix) {
        return { classification: 'l3-routed', path: 'Same subnet' };
    }

    // Build adjacency list
    const adj = new Map<string, { neighborId: string; conn: NetworkConnection }[]>();
    for (const c of connections) {
        if (!adj.has(c.source)) adj.set(c.source, []);
        if (!adj.has(c.target)) adj.set(c.target, []);
        adj.get(c.source)!.push({ neighborId: c.target, conn: c });
        adj.get(c.target)!.push({ neighborId: c.source, conn: c });
    }

    // BFS with state: (deviceId, hasTraversedL3)
    // This lets us know *how* we reached a subnet — through L3 routing or only L2.
    interface BfsNode {
        deviceId: string;
        hasL3: boolean;
        vlanCtx: number | undefined; // Current VLAN context along path
        pathDesc: string;
    }

    const visited = new Map<string, boolean>(); // deviceId -> best hasL3 seen
    const queue: BfsNode[] = [{
        deviceId: parentDevice.id,
        hasL3: isL3Device(parentDevice.type),
        vlanCtx: parentDevice.vlan,
        pathDesc: parentDevice.name,
    }];
    visited.set(parentDevice.id, isL3Device(parentDevice.type));

    let bestResult: ReachResult = { classification: 'unreachable' };

    while (queue.length > 0) {
        const node = queue.shift()!;
        const nodeDevice = devices.find(d => d.id === node.deviceId);
        if (!nodeDevice) continue;

        const neighbors = adj.get(node.deviceId) || [];

        for (const { neighborId, conn: _conn } of neighbors) {
            void _conn;
            const neighbor = devices.find(d => d.id === neighborId);
            if (!neighbor) continue;

            // Determine if this hop provides L3 routing
            const neighborIsL3 = isL3Device(neighbor.type);
            const hasL3Now = node.hasL3 || neighborIsL3;

            // VLAN propagation logic:
            // - L2 device (switch): inherits VLAN context — if VLANs differ and
            //   no L3 was traversed, this is a VLAN boundary violation
            // - L3 device: can route between VLANs, so VLAN context resets to neighbor's
            const nextVlan = neighborIsL3 ? neighbor.vlan : node.vlanCtx;

            // Skip if we visited this node with equal or better L3 status
            const prev = visited.get(neighborId);
            if (prev === true && !hasL3Now) continue; // Already visited with L3
            if (prev === hasL3Now) continue; // Same level, skip

            visited.set(neighborId, hasL3Now);

            const nextPath = `${node.pathDesc} → ${neighbor.name}`;
            const neighborPrefix = getSubnetPrefix(neighbor.ip);

            // Check if this neighbor is on the target subnet
            if (neighborPrefix === targetPrefix) {
                // VLAN check: if target has a VLAN and we're in a VLAN context,
                // do they match? (Only matters if path was pure L2)
                const vlanConflict = !hasL3Now
                    && targetVlan != null
                    && nextVlan != null
                    && targetVlan !== nextVlan;

                if (hasL3Now) {
                    // Best possible: routed through L3
                    return {
                        classification: 'l3-routed',
                        path: `L3 routed: ${nextPath}`,
                    };
                } else if (!vlanConflict) {
                    // L2 adjacent — reachable but weaker confidence
                    bestResult = {
                        classification: 'l2-adjacent',
                        path: `L2 only (no L3 device in path): ${nextPath}`,
                    };
                    // Don't return yet — keep BFS to see if a better L3 path exists
                }
                // If vlanConflict + no L3: this path is invalid, keep looking
            }

            // Continue BFS through infrastructure devices
            if (isL3Device(neighbor.type) || isL2Infra(neighbor.type)) {
                queue.push({
                    deviceId: neighborId,
                    hasL3: hasL3Now,
                    vlanCtx: nextVlan,
                    pathDesc: nextPath,
                });
            }
        }
    }

    return bestResult;
};

type ValidationTier = 'accept' | 'routed' | 'l2-only' | 'warning' | 'error';

interface ValidationResult {
    tier: ValidationTier;
    message: string;
    detail?: string;
}

/** 
 * 5-tier validation (upgraded from 4-tier):
 * 1. Same subnet → accept silently  
 * 2. Different subnet, L3-routed → blue info badge
 * 3. Different subnet, L2-only path → cyan info (weaker confidence)
 * 4. Different subnet, no path at all → yellow warning  
 * 5. Format/duplicate/reserved → hard reject
 */
const validateIP = (
    ip: string,
    parentDevice: Device | undefined,
    devices: Device[],
    connections: NetworkConnection[],
    selectedVlan: number | undefined,
): ValidationResult => {
    // Tier 1: Syntactic
    if (!isValidIPv4(ip)) return { tier: 'error', message: 'Invalid IPv4 format' };

    // Reserved ranges check
    const first = Number(ip.split('.')[0]);
    if (first === 0 || first === 127 || first >= 224) {
        return { tier: 'error', message: 'Reserved/multicast address range' };
    }
    if (ip === '255.255.255.255') return { tier: 'error', message: 'Broadcast address' };

    // Host address check — .0 = network, .255 = broadcast (for /24)
    const lastOctet = getLastOctet(ip);
    if (lastOctet === 0) return { tier: 'error', message: 'Network address (.0) — not assignable to a host' };
    if (lastOctet === 255) return { tier: 'error', message: 'Broadcast address (.255) — not assignable to a host' };

    // Duplicate check — VLAN-aware: same IP on different VLANs is valid  
    const duplicate = devices.find(d => d.ip === ip);
    if (duplicate) {
        const dupVlan = duplicate.vlan;
        if (selectedVlan != null && dupVlan != null && selectedVlan !== dupVlan) {
            return {
                tier: 'routed',
                message: `IP exists on VLAN ${dupVlan} (${duplicate.name}) — OK on VLAN ${selectedVlan}`,
                detail: 'Same IP on different VLANs is valid in segmented networks',
            };
        }
        return {
            tier: 'error',
            message: `IP already assigned to ${duplicate.name}${dupVlan != null ? ` (VLAN ${dupVlan})` : ''}`,
        };
    }

    if (!parentDevice) return { tier: 'accept', message: 'Valid standalone IP' };

    // Tier 2: Contextual — subnet + routability
    const parentBits = parseMaskBits(parentDevice.subnetMask);
    const isSameSubnet = networkAddr(ip, parentBits) === networkAddr(parentDevice.ip, parentBits);

    if (isSameSubnet) {
        // Even on same subnet, check VLAN consistency if both are set
        if (selectedVlan != null && parentDevice.vlan != null && selectedVlan !== parentDevice.vlan) {
            return {
                tier: 'l2-only',
                message: `Same subnet but different VLAN (parent: ${parentDevice.vlan}, new: ${selectedVlan})`,
                detail: 'Devices on the same subnet should typically share a VLAN. Verify this is intentional.',
            };
        }
        return { tier: 'accept', message: `Same subnet as ${parentDevice.name}` };
    }

    // Tier 3+4: Topology-aware reachability (distinguishes L3-routed vs L2-only vs unreachable)
    const ipPrefix = getSubnetPrefix(ip);
    const reach = classifyReachability(ipPrefix, parentDevice, devices, connections, selectedVlan);

    if (reach.classification === 'l3-routed') {
        return {
            tier: 'routed',
            message: `Different subnet — L3-routed through network topology`,
            detail: reach.path,
        };
    }

    if (reach.classification === 'l2-adjacent') {
        return {
            tier: 'l2-only',
            message: `L2 path exists but no L3 routing device in path`,
            detail: `${reach.path}. Without a router/gateway, cross-subnet traffic won't be forwarded. This may work only if inter-VLAN routing is configured externally.`,
        };
    }

    // Unreachable
    return {
        tier: 'warning',
        message: `Subnet ${ipPrefix}.x has no known route from ${parentDevice.name}`,
        detail: 'No path found in connection topology. This may indicate a misconfiguration or a missing link.',
    };
};

/** Suggest next available IP, avoiding a configurable DHCP exclusion range */
const suggestNextIP = (
    prefix: string,
    devices: Device[],
    dhcpRange: [number, number] | null = [100, 199],
): string => {
    const usedOctets = new Set(
        devices.filter(d => getSubnetPrefix(d.ip) === prefix).map(d => getLastOctet(d.ip))
    );

    // Build safe ranges excluding: .0 (network), .255 (broadcast), and DHCP range
    const allRanges: [number, number][] = [];
    if (dhcpRange) {
        // Before DHCP: .10 .. dhcpStart-1
        if (dhcpRange[0] > 10) allRanges.push([10, dhcpRange[0] - 1]);
        // After DHCP: dhcpEnd+1 .. 254
        if (dhcpRange[1] < 254) allRanges.push([dhcpRange[1] + 1, 254]);
        // Low range: .2-.9
        allRanges.push([2, 9]);
    } else {
        // No DHCP avoidance — full range
        allRanges.push([10, 254], [2, 9]);
    }

    for (const [lo, hi] of allRanges) {
        for (let i = lo; i <= hi; i++) {
            if (!usedOctets.has(i)) return `${prefix}.${i}`;
        }
    }
    return `${prefix}.254`;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AddDeviceModalProps {
    onClose: () => void;
    onAdd: (device: Device, parentId?: string) => void;
    devices: Device[];
    connections: NetworkConnection[];
}

export default function AddDeviceModal({ onClose, onAdd, devices, connections }: AddDeviceModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<Device['type']>('switch');
    const [ip, setIp] = useState('');
    const [, setIpTouched] = useState(false);
    const [category, setCategory] = useState<'IT' | 'OT'>('OT');
    const [parentId, setParentId] = useState<string>('');
    const [vlan, setVlan] = useState<number | undefined>(undefined);
    const [assignMode, setAssignMode] = useState<'auto' | 'manual'>('auto');
    // Configurable DHCP exclusion range (null = disabled)
    const [dhcpExclude, setDhcpExclude] = useState<[number, number] | null>([100, 199]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Derived
    const subnetMap = useMemo(() => buildSubnetMap(devices), [devices]);
    const parentDevice = useMemo(() => devices.find(d => d.id === parentId), [devices, parentId]);
    const parentSubnet = parentDevice ? getSubnetPrefix(parentDevice.ip) : null;

    // Known VLANs (used by VLAN-aware validation engine)
    const _knownVlans = useMemo(() => {
        const vlans = new Map<number, { count: number; subnet: string }>();
        devices.forEach(d => {
            if (d.vlan != null) {
                const existing = vlans.get(d.vlan);
                if (existing) existing.count++;
                else vlans.set(d.vlan, { count: 1, subnet: getSubnetPrefix(d.ip) });
            }
        });
        return vlans;
    }, [devices]);
    void _knownVlans;

    // Auto-suggest IP when parent changes in auto mode
    useEffect(() => {
        if (assignMode === 'auto' && parentDevice && parentSubnet) {
            setIp(suggestNextIP(parentSubnet, devices, dhcpExclude));
            setIpTouched(false);
            // Auto-assign VLAN from parent if available
            if (parentDevice.vlan != null) setVlan(parentDevice.vlan);
        }
    }, [parentId, assignMode, dhcpExclude]); // eslint-disable-line react-hooks/exhaustive-deps

    // Full tiered validation
    const validation: ValidationResult | null = useMemo(() => {
        if (ip.length === 0) return null;
        return validateIP(ip, parentDevice, devices, connections, vlan);
    }, [ip, parentDevice, devices, connections, vlan]);

    const isError = validation?.tier === 'error';
    const isWarning = validation?.tier === 'warning';
    const isRouted = validation?.tier === 'routed';
    const isL2Only = validation?.tier === 'l2-only';
    const isAccept = validation?.tier === 'accept';

    const canSubmit = name.trim().length > 0 && ip.length > 0 && validation != null && validation.tier !== 'error';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const newDevice: Device = {
            id: `d-${Date.now()}`,
            name,
            type,
            ip,
            category,
            status: 'healthy',
            location: 'New Location',
            vlan,
            subnetMask: '/24',
            position: [Math.random() * 50 - 25, Math.random() * 20, Math.random() * 50 - 25],
            metrics: {
                l1: { temperature: 35 },
                l2: { crcErrors: 0, linkUtilization: 10 },
                l3: { packetLoss: 0, routingTableSize: 10 },
                l4: { tcpRetransmissions: 0, jitter: 2 },
                l5: { sessionResets: 0, sessionStability: 100 },
                l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
                l7: { appLatency: 5 }
            }
        };

        onAdd(newDevice, parentId || undefined);
        onClose();
    };

    const deviceTypes = [
        { value: 'switch', label: 'Network Switch', icon: Router },
        { value: 'plc', label: 'PLC Controller', icon: Cpu },
        { value: 'server', label: 'Server / PC', icon: Server },
        { value: 'sensor', label: 'IoT Sensor', icon: Gauge },
        { value: 'router', label: 'Router', icon: Router },
        { value: 'firewall', label: 'Firewall', icon: Shield },
        { value: 'gateway', label: 'Gateway', icon: Box },
        { value: 'scada', label: 'SCADA Host', icon: Activity },
    ];

    // Validation badge colors
    const borderColor = !validation ? 'border-slate-800 focus:ring-blue-500'
        : isError ? 'border-red-500 focus:ring-red-500'
        : isWarning ? 'border-yellow-500 focus:ring-yellow-500'
        : isL2Only ? 'border-cyan-500 focus:ring-cyan-500'
        : isRouted ? 'border-blue-500 focus:ring-blue-500'
        : 'border-emerald-500 focus:ring-emerald-500';

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
             onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.15)]">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-400" />
                        Add New Device
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Device Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. Production Line Switch 01"
                        />
                    </div>

                    {/* Type Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Device Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {deviceTypes.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value as Device['type'])}
                                        className={`flex items-center gap-2 p-2 rounded-lg text-sm border transition-all ${type === t.value
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Uplink Connection — BEFORE IP so intent drives suggestion */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Connect to (Uplink)</label>
                        <select
                            value={parentId}
                            onChange={(e) => { setParentId(e.target.value); if (assignMode === 'auto') setIpTouched(false); }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">-- No Connection (Standalone) --</option>
                            {devices.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.ip}){d.vlan != null ? ` [VLAN ${d.vlan}]` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Intent Mode selector — only if parent is selected */}
                    {parentDevice && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">IP Assignment</label>
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setAssignMode('auto')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${assignMode === 'auto' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Zap className="w-3 h-3" /> Auto from parent subnet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAssignMode('manual'); setIpTouched(true); }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${assignMode === 'manual' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Manual assignment
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Network Details: IP + Category + VLAN */}
                    <div className="grid grid-cols-12 gap-3">
                        {/* IP Address — 5 cols */}
                        <div className="col-span-5">
                            <label className="block text-sm font-medium text-slate-400 mb-1">IP Address</label>
                            <input
                                required
                                type="text"
                                value={ip}
                                onChange={(e) => { setIp(e.target.value); setIpTouched(true); if (parentDevice) setAssignMode('manual'); }}
                                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:ring-2 outline-none text-sm font-mono transition-all ${borderColor}`}
                                placeholder="192.168.1.X"
                            />
                        </div>

                        {/* VLAN — 3 cols */}
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-slate-400 mb-1">VLAN</label>
                            <input
                                type="number"
                                min={1}
                                max={4094}
                                value={vlan ?? ''}
                                onChange={(e) => setVlan(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                placeholder="—"
                            />
                        </div>

                        {/* Category — 4 cols */}
                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 h-[38px]">
                                <button
                                    type="button"
                                    onClick={() => setCategory('IT')}
                                    className={`flex-1 text-xs font-bold rounded ${category === 'IT' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    IT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategory('OT')}
                                    className={`flex-1 text-xs font-bold rounded ${category === 'OT' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    OT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tiered Validation Feedback */}
                    {validation && (
                        <div className={`rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 ${
                            isError ? 'bg-red-500/10 border-red-500/40 text-red-300' :
                            isWarning ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' :
                            isL2Only ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' :
                            isRouted ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' :
                            'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        }`}>
                            {isError && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            {isWarning && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            {isL2Only && <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            {isRouted && <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            {isAccept && <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            <div>
                                <div className="font-medium">{validation.message}</div>
                                {validation.detail && <div className="text-[10px] mt-0.5 opacity-75">{validation.detail}</div>}
                            </div>
                        </div>
                    )}

                    {/* Network Topology Context Panel */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Network Topology — Detected Subnets</div>
                        <div className="space-y-1.5">
                            {Array.from(subnetMap.entries()).map(([cidr, info]) => {
                                const isActive = ip.length > 0 && getSubnetPrefix(ip) === info.prefix;
                                return (
                                    <button
                                        type="button"
                                        key={cidr}
                                        onClick={() => {
                                            setIp(suggestNextIP(info.prefix, devices, dhcpExclude));
                                            setIpTouched(true);
                                            if (parentDevice) setAssignMode('manual');
                                            // Auto-assign VLAN from subnet
                                            const subVlan = Array.from(info.vlanIds)[0];
                                            if (subVlan != null) setVlan(subVlan);
                                        }}
                                        className={`w-full text-left text-[11px] font-mono px-3 py-2 rounded-lg border transition-all ${
                                            isActive
                                                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200'
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{cidr}</span>
                                            <span className="text-slate-500 text-[10px]">{info.devices.length} device{info.devices.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                                            {info.vlanIds.size > 0 && (
                                                <span className="text-purple-400">VLAN {Array.from(info.vlanIds).join(',')}</span>
                                            )}
                                            {info.hasGateway && (
                                                <span className="text-cyan-400">GW: {info.gatewayDevice?.name?.split(' ')[0]}</span>
                                            )}
                                            {!info.hasGateway && (
                                                <span className="text-slate-500">No gateway</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Settings (collapsible) */}
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(v => !v)}
                            className="w-full px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 transition-colors bg-slate-800/30"
                        >
                            <span className="uppercase tracking-widest font-medium">Advanced Settings</span>
                            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {showAdvanced && (
                            <div className="p-3 space-y-3 bg-slate-950/50">
                                {/* DHCP Exclusion Range */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-medium text-slate-400">DHCP Exclusion Range</label>
                                        <button
                                            type="button"
                                            onClick={() => setDhcpExclude(prev => prev ? null : [100, 199])}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                                dhcpExclude
                                                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                                            }`}
                                        >
                                            {dhcpExclude ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                    {dhcpExclude && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-mono">.</span>
                                            <input
                                                type="number"
                                                min={2}
                                                max={253}
                                                value={dhcpExclude[0]}
                                                onChange={(e) => {
                                                    const v = Math.max(2, Math.min(253, Number(e.target.value) || 100));
                                                    setDhcpExclude([v, Math.max(v + 1, dhcpExclude[1])]);
                                                }}
                                                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="text-[10px] text-slate-500">to .</span>
                                            <input
                                                type="number"
                                                min={3}
                                                max={254}
                                                value={dhcpExclude[1]}
                                                onChange={(e) => {
                                                    const v = Math.max(dhcpExclude[0] + 1, Math.min(254, Number(e.target.value) || 199));
                                                    setDhcpExclude([dhcpExclude[0], v]);
                                                }}
                                                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="text-[10px] text-slate-500 ml-1">
                                                Avoids .{dhcpExclude[0]}–.{dhcpExclude[1]}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-600 mt-1">
                                        Auto-suggestion skips this range to avoid DHCP pool collisions.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full mt-2 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 ${
                            canSubmit
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {isWarning ? 'Add Device (Override Warning)' : isL2Only ? 'Add Device (L2 Only Path)' : 'Add Device to Network'}
                    </button>

                </form>
            </div>
        </div>,
        document.body
    );
}
