import { create } from 'zustand';
import { Device, Alert, NetworkConnection, LayerKPI, DependencyPath } from '../types/network';
import { devices as initialDevices, connections as initialConnections, layerKPIs as initialKPIs, dependencyPaths as initialDependencyPaths } from '../data/mockData';
import { archiveAlerts } from '../services/AlertHistoryDB';

interface NetworkState {
    devices: Device[];
    alerts: Alert[];
    connections: NetworkConnection[];
    layerKPIs: LayerKPI[];
    dependencyPaths: DependencyPath[];
    /** Device IDs currently under an injected fault — simulation must not overwrite these. */
    faultedDeviceIds: Set<string>;

    // Actions
    setDevices: (devices: Device[]) => void;
    updateDevice: (id: string, updates: Partial<Device>) => void;
    setAlerts: (alerts: Alert[]) => void;
    addAlert: (alert: Alert) => void;
    removeAlertsForDevice: (deviceName: string) => void;
    setConnections: (connections: NetworkConnection[]) => void;
    addDevice: (device: Device) => void;
    addConnection: (connection: NetworkConnection) => void;
    resetSystem: () => void;
    injectFault: (type: 'l1' | 'l7') => void;
}

// Helper to clone avoiding mutation in simulated scenarios
const cloneDevices = (source: Device[]) => source.map(d => ({
    ...d,
    metrics: {
        ...d.metrics,
        l1: { ...d.metrics.l1 },
        l2: { ...d.metrics.l2 },
        l3: { ...d.metrics.l3 },
        l4: { ...d.metrics.l4 },
        l5: { ...d.metrics.l5 },
        l6: { ...d.metrics.l6 },
        l7: { ...d.metrics.l7 },
    }
}));

const cloneConnections = (source: NetworkConnection[]) => source.map(c => ({ ...c }));

/**
 * Derive alerts from actual device metrics and connection states.
 * Replaces hardcoded mock alerts — every alert now reflects real topology data.
 */
function deriveAlertsFromState(devices: Device[], connections: NetworkConnection[]): Alert[] {
    const out: Alert[] = [];
    const now = new Date();

    for (const d of devices) {
        if (d.status === 'healthy') continue;
        const m = d.metrics;
        const sev: Alert['severity'] = d.status === 'critical' ? 'critical' : 'medium';

        // Pick primary fault layer (lowest OSI layer first)
        if ((m.l1.temperature || 0) > 60) {
            out.push({ id: `derived-${d.id}-l1`, severity: sev, layer: 'L1', device: d.name, message: `Temperature elevated (${Math.round(m.l1.temperature || 0)}°C)`, timestamp: now });
        } else if ((m.l1.opticalRxPower ?? 0) < -28 && m.l1.opticalRxPower !== undefined) {
            out.push({ id: `derived-${d.id}-l1`, severity: sev, layer: 'L1', device: d.name, message: `Optical RX power degraded (${(m.l1.opticalRxPower || 0).toFixed(1)} dBm)`, timestamp: now });
        }

        if ((m.l2.crcErrors || 0) > 50) {
            out.push({ id: `derived-${d.id}-l2`, severity: sev, layer: 'L2', device: d.name, message: `CRC error storm (${Math.round(m.l2.crcErrors || 0)} errors)`, timestamp: now });
        } else if ((m.l2.crcErrors || 0) > 10) {
            out.push({ id: `derived-${d.id}-l2`, severity: sev, layer: 'L2', device: d.name, message: `Elevated CRC errors (${Math.round(m.l2.crcErrors || 0)})`, timestamp: now });
        }

        if ((m.l3.packetLoss || 0) > 5) {
            out.push({ id: `derived-${d.id}-l3`, severity: sev, layer: 'L3', device: d.name, message: `High packet loss (${(m.l3.packetLoss || 0).toFixed(1)}%)`, timestamp: now });
        } else if ((m.l3.packetLoss || 0) > 1.5) {
            out.push({ id: `derived-${d.id}-l3`, severity: sev, layer: 'L3', device: d.name, message: `Packet loss detected (${(m.l3.packetLoss || 0).toFixed(1)}%)`, timestamp: now });
        }

        if ((m.l4.jitter || 0) > 30) {
            out.push({ id: `derived-${d.id}-l4`, severity: 'medium', layer: 'L4', device: d.name, message: `Elevated jitter (${Math.round(m.l4.jitter || 0)}ms)`, timestamp: now });
        } else if ((m.l4.tcpRetransmissions || 0) > 1) {
            out.push({ id: `derived-${d.id}-l4`, severity: 'medium', layer: 'L4', device: d.name, message: `TCP retransmissions elevated (${(m.l4.tcpRetransmissions || 0).toFixed(1)}%)`, timestamp: now });
        }

        if ((m.l7.appLatency || 0) > 500) {
            out.push({ id: `derived-${d.id}-l7`, severity: sev, layer: 'L7', device: d.name, message: `Application latency critical (${Math.round(m.l7.appLatency || 0)}ms)`, timestamp: now });
        } else if ((m.l7.appLatency || 0) > 200) {
            out.push({ id: `derived-${d.id}-l7`, severity: 'medium', layer: 'L7', device: d.name, message: `Application response slow (${Math.round(m.l7.appLatency || 0)}ms)`, timestamp: now });
        }
    }

    // Connection-level alerts
    for (const c of connections) {
        if (c.status === 'healthy') continue;
        const src = devices.find(dd => dd.id === c.source);
        const tgt = devices.find(dd => dd.id === c.target);
        const srcName = src?.name || c.source;
        const tgtName = tgt?.name || c.target;

        if (c.status === 'down') {
            out.push({ id: `derived-${c.id}-link`, severity: 'critical', layer: 'L1', device: srcName, message: `Link down: ${srcName} → ${tgtName}`, timestamp: now });
        } else if (c.status === 'degraded') {
            out.push({ id: `derived-${c.id}-link`, severity: 'medium', layer: 'L2', device: srcName, message: `Link degraded: ${srcName} → ${tgtName} (latency ${c.latency}ms)`, timestamp: now });
        }
    }

    return out;
}

export const useNetworkStore = create<NetworkState>((set) => ({
    devices: cloneDevices(initialDevices),
    alerts: deriveAlertsFromState(initialDevices, initialConnections),
    connections: cloneConnections(initialConnections),
    layerKPIs: [...initialKPIs],
    dependencyPaths: [...initialDependencyPaths],
    faultedDeviceIds: new Set(),

    setDevices: (devices) => set({ devices }),
    updateDevice: (id, updates) => set((state) => ({
        devices: state.devices.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
    setAlerts: (alerts) => set({ alerts }),
    addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
    removeAlertsForDevice: (deviceName) => set((state) => {
        const removed = state.alerts.filter(a => a.device === deviceName);
        if (removed.length > 0) void archiveAlerts(removed);
        return { alerts: state.alerts.filter(a => a.device !== deviceName) };
    }),
    setConnections: (connections) => set({ connections }),
    addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
    addConnection: (connection) => set((state) => ({ connections: [...state.connections, connection] })),

    resetSystem: () => {
        const freshDevices = cloneDevices(initialDevices);
        const freshConnections = cloneConnections(initialConnections);
        // Archive any active alerts before clearing
        const currentAlerts = useNetworkStore.getState().alerts;
        if (currentAlerts.length > 0) void archiveAlerts(currentAlerts);
        set({
            devices: freshDevices,
            alerts: deriveAlertsFromState(freshDevices, freshConnections),
            connections: freshConnections,
            layerKPIs: [...initialKPIs],
            faultedDeviceIds: new Set(),
        });
    },

    injectFault: (type: 'l1' | 'l7') => {
        // Replicate App.tsx logic: Reset to initial then apply fault.
        const baseDevices = cloneDevices(initialDevices);
        const baseConnections = cloneConnections(initialConnections);
        const now = Date.now();

        if (type === 'l1') {
            const nextDevices = baseDevices.map((d): Device => {
                if (d.id === 'd10') {
                    return {
                        ...d,
                        status: 'critical',
                        metrics: {
                            ...d.metrics,
                            l1: { ...d.metrics.l1, temperature: 78, opticalRxPower: -32 },
                            l2: { ...d.metrics.l2, crcErrors: 980, linkUtilization: 0, macFlapping: true },
                            l3: { ...d.metrics.l3, packetLoss: 18.5 },
                            l4: { ...d.metrics.l4, tcpRetransmissions: 0.12, jitter: 85 },
                            l5: { ...d.metrics.l5, sessionResets: 28, sessionStability: 82.1 },
                            l7: { ...d.metrics.l7, appLatency: 1200, protocolAnomaly: true }
                        }
                    };
                }

                if (d.id === 'd5') {
                    return {
                        ...d,
                        status: 'warning',
                        metrics: {
                            ...d.metrics,
                            l3: { ...d.metrics.l3, packetLoss: 3.6 },
                            l4: { ...d.metrics.l4, tcpRetransmissions: 0.08, jitter: 42 },
                            l5: { ...d.metrics.l5, sessionResets: 7, sessionStability: 94.1 },
                            l7: { ...d.metrics.l7, appLatency: 1400, protocolAnomaly: true }
                        }
                    };
                }

                if (d.id === 'd3') {
                    return {
                        ...d,
                        status: 'critical',
                        metrics: {
                            ...d.metrics,
                            l3: { ...d.metrics.l3, packetLoss: 9.2 },
                            l4: { ...d.metrics.l4, tcpRetransmissions: 0.14, jitter: 65 },
                            l5: { ...d.metrics.l5, sessionResets: 16, sessionStability: 78.4 },
                            l7: { ...d.metrics.l7, appLatency: 3200, protocolAnomaly: true }
                        }
                    };
                }

                if (d.id === 'd6' || d.id === 'd7') {
                    return {
                        ...d,
                        status: 'warning',
                        metrics: {
                            ...d.metrics,
                            l2: { ...d.metrics.l2, crcErrors: Math.max(d.metrics.l2.crcErrors, 12) },
                            l3: { ...d.metrics.l3, packetLoss: Math.max(d.metrics.l3.packetLoss, 4.8) },
                            l7: { ...d.metrics.l7, appLatency: Math.max(d.metrics.l7.appLatency, 220), protocolAnomaly: true }
                        }
                    };
                }

                if (d.id === 'd1') {
                    return {
                        ...d,
                        status: 'warning',
                        metrics: {
                            ...d.metrics,
                            l3: { ...d.metrics.l3, packetLoss: 2.4, routingTableSize: d.metrics.l3.routingTableSize + 40 },
                            l4: { ...d.metrics.l4, tcpRetransmissions: 0.04, jitter: 18 },
                        }
                    };
                }

                return d;
            });

            const nextConnections = baseConnections.map((c): NetworkConnection => {
                if (c.id === 'c2') return { ...c, status: 'down', latency: 0, bandwidth: 0 };
                if (c.id === 'c7' || c.id === 'c8' || c.id === 'c9') return { ...c, status: 'down', latency: 0, bandwidth: 0 };
                if (c.id === 'c3') return { ...c, status: 'degraded', latency: 14, bandwidth: Math.max(120, Math.round(c.bandwidth * 0.6)) };
                return c;
            });

            const simAlerts: Alert[] = [
                {
                    id: `sim-l1-${now}-a`,
                    severity: 'critical',
                    layer: 'L1',
                    device: 'Hirschmann BOBCAT Switch',
                    message: 'Fiber link down on Port 4 (Optical RX < -30 dBm); physical disconnect suspected',
                    timestamp: new Date(),
                    aiCorrelation: 'Primary fault likely at L1. Expect secondary symptoms at L3 (loss) and L4 (timeouts) across OT cells.'
                },
                {
                    id: `sim-l1-${now}-b`,
                    severity: 'high',
                    layer: 'L2',
                    device: 'Hirschmann BOBCAT Switch',
                    message: 'CRC error storm and MAC flapping detected; unstable physical medium',
                    timestamp: new Date(),
                    aiCorrelation: 'L2 anomalies coincide with L1 optical power drop; treat L3 alarms as downstream effects.'
                },
                {
                    id: `sim-l1-${now}-c`,
                    severity: 'high',
                    layer: 'L3',
                    device: 'Hirschmann DRAGON MACH4x00',
                    message: 'Packet loss spike and route churn observed for Zone A/Zone B subnets',
                    timestamp: new Date(),
                    aiCorrelation: 'This can look like routing/firewall issues, but correlation points back to edge physical instability.'
                },
                {
                    id: `sim-l1-${now}-d`,
                    severity: 'high',
                    layer: 'L4',
                    device: 'Lion-M PLC Node A',
                    message: 'TCP retransmissions and timeouts rising; control-loop reliability degraded',
                    timestamp: new Date(),
                    aiCorrelation: 'Transport reliability degradation aligns with L1/L2 faults upstream of the PLC segment.'
                },
                {
                    id: `sim-l1-${now}-e`,
                    severity: 'high',
                    layer: 'L7',
                    device: 'SCADA Control Loop',
                    message: 'SCADA command latency elevated; intermittent protocol anomalies',
                    timestamp: new Date(),
                    aiCorrelation: 'Application symptoms are secondary. Mitigate by restoring physical link and validating switch port optics.'
                }
            ];

            // Combine handcrafted sim alerts with derived alerts for non-sim devices
            const derivedL1 = deriveAlertsFromState(nextDevices, nextConnections)
                .filter(a => !simAlerts.some(sa => sa.device === a.device));
            set({
                devices: nextDevices,
                connections: nextConnections,
                alerts: [...simAlerts, ...derivedL1],
                faultedDeviceIds: new Set(['d10', 'd5', 'd3', 'd6', 'd7', 'd1']),
            });

        } else if (type === 'l7') {
            const nextDevices = baseDevices.map((d): Device => {
                if (d.id === 'd5') {
                    return {
                        ...d,
                        status: 'warning',
                        metrics: {
                            ...d.metrics,
                            l4: { ...d.metrics.l4, tcpRetransmissions: 0.06, jitter: 12 },
                            l5: { ...d.metrics.l5, sessionResets: 12, sessionStability: 93.8 },
                            l6: { ...d.metrics.l6, tlsHandshakeFailures: 6, encryptionOverheadMs: 7 },
                            l7: { ...d.metrics.l7, appLatency: 5200, protocolAnomaly: true },
                        }
                    };
                }

                if (d.id === 'd3' || d.id === 'd4') {
                    return {
                        ...d,
                        status: 'warning',
                        metrics: {
                            ...d.metrics,
                            l4: { ...d.metrics.l4, tcpRetransmissions: Math.max(d.metrics.l4.tcpRetransmissions, 0.05), jitter: Math.max(d.metrics.l4.jitter, 22) },
                            l5: { ...d.metrics.l5, sessionResets: Math.max(d.metrics.l5.sessionResets, 5), sessionStability: Math.min(d.metrics.l5.sessionStability, 95.5) },
                            l7: { ...d.metrics.l7, appLatency: Math.max(d.metrics.l7.appLatency, 900) }
                        }
                    };
                }

                return d;
            });

            const nextConnections = baseConnections.map((c): NetworkConnection => {
                if (c.id === 'c7') return { ...c, status: 'degraded', latency: 120, bandwidth: Math.max(80, Math.round(c.bandwidth * 0.4)) };
                return c;
            });

            const simAlerts: Alert[] = [
                {
                    id: `sim-l7-${now}-a`,
                    severity: 'high',
                    layer: 'L7',
                    device: 'SCADA Control Loop',
                    message: 'Response time > 5000ms; command acknowledgements delayed',
                    timestamp: new Date(),
                    aiCorrelation: 'L1–L3 telemetry remains nominal; likely application/service-side contention or overloaded control runtime.'
                },
                {
                    id: `sim-l7-${now}-b`,
                    severity: 'medium',
                    layer: 'L5',
                    device: 'SCADA Control Loop',
                    message: 'Session instability: frequent reconnects observed',
                    timestamp: new Date(),
                    aiCorrelation: 'Sessions reset due to delayed responses rather than transport loss. Validate SCADA service health and thread saturation.'
                },
                {
                    id: `sim-l7-${now}-c`,
                    severity: 'medium',
                    layer: 'L4',
                    device: 'Lion-M PLC Node A',
                    message: 'Transport retries increasing (client-side timeouts)',
                    timestamp: new Date(),
                    aiCorrelation: 'Retries driven by slow application responses; lower layers are stable (no L1/L2 error storm).'
                }
            ];

            // Combine handcrafted sim alerts with derived alerts for non-sim devices
            const derivedL7 = deriveAlertsFromState(nextDevices, nextConnections)
                .filter(a => !simAlerts.some(sa => sa.device === a.device));
            set({
                devices: nextDevices,
                connections: nextConnections,
                alerts: [...simAlerts, ...derivedL7],
                faultedDeviceIds: new Set(['d5', 'd3', 'd4']),
            });
        }
    }
}));
