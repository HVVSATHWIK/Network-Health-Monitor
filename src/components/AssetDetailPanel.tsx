import { Device, NetworkConnection } from '../types/network';
import {
    Activity,
    X,
    Zap,
    Shield,
    Cpu,
    Thermometer,
    Clock,
    Wifi,
    ArrowRightLeft,
    AlertTriangle,
    CheckCircle,
    Server,
    Router,
    Box,
    Share2
} from 'lucide-react';

interface AssetDetailPanelProps {
    device: Device;
    connections: NetworkConnection[];
    devices: Device[]; // All devices for resolving names in dependency tree
    onClose: () => void;
    onInjectFault?: (id: string) => void;
}

export default function AssetDetailPanel({
    device,
    connections,
    devices,
    onClose,
    onInjectFault
}: AssetDetailPanelProps) {

    // Find connected peers
    const upstream = connections
        .filter(c => c.target === device.id)
        .map(c => devices.find(d => d.id === c.source))
        .filter(Boolean) as Device[];

    const downstream = connections
        .filter(c => c.source === device.id)
        .map(c => devices.find(d => d.id === c.target))
        .filter(Boolean) as Device[];

    // Determine styles based on status
    const statusStyles = {
        healthy: {
            color: 'text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-500/50',
            glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
            gradient: 'from-emerald-900/50 to-emerald-950/30'
        },
        warning: {
            color: 'text-amber-400',
            bg: 'bg-amber-500',
            border: 'border-amber-500/50',
            glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
            gradient: 'from-amber-900/50 to-amber-950/30'
        },
        critical: {
            color: 'text-red-400',
            bg: 'bg-red-500',
            border: 'border-red-500/50',
            glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
            gradient: 'from-red-900/50 to-red-950/30'
        },
        offline: {
            color: 'text-slate-400',
            bg: 'bg-slate-500',
            border: 'border-slate-500/50',
            glow: 'shadow-none',
            gradient: 'from-slate-800 to-slate-900'
        }
    }[device.status];

    // Helper for metrics rendering
    const MetricCard = ({ icon: Icon, label, value, unit, trend }: any) => (
        <div className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl flex flex-col gap-1 backdrop-blur-sm hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white font-mono">{value}</span>
                <span className="text-xs text-slate-500">{unit}</span>
            </div>
            {trend && (
                <div className={`text-[10px] ${trend > 0 ? 'text-red-400' : 'text-emerald-400'} flex items-center`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs avg
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">

            {/* HEADER WITH CONTEXTUAL GLOW */}
            <div className={`relative p-6 rounded-t-2xl border-b ${statusStyles.border} bg-gradient-to-br ${statusStyles.gradient}`}>

                {/* Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 ${statusStyles.glow}`}>
                        {device.type === 'plc' && <Cpu className={`w-8 h-8 ${statusStyles.color}`} />}
                        {device.type === 'switch' && <Router className={`w-8 h-8 ${statusStyles.color}`} />}
                        {device.type === 'server' && <Server className={`w-8 h-8 ${statusStyles.color}`} />}
                        {!['plc', 'switch', 'server'].includes(device.type) && <Box className={`w-8 h-8 ${statusStyles.color}`} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-black/30 border border-white/10 ${statusStyles.color} uppercase`}>
                                {device.type}
                            </span>
                            <span className="text-slate-400 text-xs font-mono">{device.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{device.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                            <div className={`w-2 h-2 rounded-full ${statusStyles.bg} animate-pulse`} />
                            <span className="uppercase font-semibold tracking-wide">{device.status}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{device.ip}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/30 backdrop-blur-xl">

                {/* KEY PERFORMANCE METRICS */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Live Telemetry
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard
                            icon={ArrowRightLeft}
                            label="Latency"
                            value={device.metrics.l7.appLatency}
                            unit="ms"
                            trend={device.status === 'healthy' ? -5 : 24}
                        />
                        <MetricCard
                            icon={Wifi}
                            label="Packet Loss"
                            value={device.metrics.l3.packetLoss.toFixed(1)}
                            unit="%"
                            trend={device.metrics.l3.packetLoss > 1 ? 15 : 0}
                        />
                        <MetricCard
                            icon={Thermometer}
                            label="Temp"
                            value={device.metrics.l1.temperature}
                            unit="°C"
                        />
                        <MetricCard
                            icon={Clock}
                            label="Uptime"
                            value="99.9"
                            unit="%"
                        />
                    </div>
                </section>

                {/* DEPENDENCY VISUALIZATION */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Connectivity Map
                    </h3>
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">

                        {/* UPSTREAM */}
                        {upstream.length > 0 && (
                            <div className="mb-4 relative">
                                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-slate-800 -z-10"></div>
                                <div className="text-xs text-slate-500 mb-2 pl-1">Upstream (Source)</div>
                                <div className="space-y-2">
                                    {upstream.map(dev => (
                                        <div key={dev.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer">
                                            <div className={`w-2 h-2 rounded-full ${dev.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium text-slate-200">{dev.name}</span>
                                            <span className="text-[10px] text-slate-500 ml-auto">{dev.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CURRENT NODE (Center) */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-blue-500/30 shadow-lg relative my-4">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                            <span className="text-sm font-bold text-blue-100">{device.name}</span>
                            <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">THIS DEVICE</span>
                        </div>

                        {/* DOWNSTREAM */}
                        {downstream.length > 0 && (
                            <div className="mt-4 relative">
                                <div className="absolute left-6 top-0 bottom-8 w-0.5 bg-slate-800 -z-10"></div>
                                <div className="space-y-2">
                                    {downstream.map(dev => (
                                        <div key={dev.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer/50">
                                            <div className={`w-2 h-2 rounded-full ${dev.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium text-slate-200">{dev.name}</span>
                                            <span className="text-[10px] text-slate-500 ml-auto">{dev.type}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-500 mt-2 pl-1">Downstream (Consumers)</div>
                            </div>
                        )}

                        {upstream.length === 0 && downstream.length === 0 && (
                            <div className="text-center py-4 text-slate-500 italic text-sm">
                                No active connections detected.
                            </div>
                        )}
                    </div>
                </section>

                {/* ROLE & IMPACT RADIUS (NEW SECTION) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* ROLE IN DATA FLOW */}
                    <section className="bg-slate-950/30 rounded-xl p-4 border border-slate-800/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Box className="w-4 h-4 text-purple-400" /> Role in Process
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-slate-900 p-1.5 rounded text-blue-400">
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Consumes</div>
                                    <div className="text-sm text-slate-300">
                                        {device.type === 'plc' ? 'Raw Sensor Data' :
                                            device.type === 'switch' ? 'L2/L3 Packets' :
                                                device.type === 'server' ? 'Aggregated Telemetry' : 'Physical Signals'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-slate-900 p-1.5 rounded text-purple-400">
                                    <Cpu className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Processes</div>
                                    <div className="text-sm text-slate-300">
                                        {device.type === 'plc' ? 'Cyclic Control Logic (10ms)' :
                                            device.type === 'switch' ? 'VLAN Tagging & Routing' :
                                                device.type === 'server' ? 'Data Analytics & Storage' : 'Analog-to-Digital Conversion'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-slate-900 p-1.5 rounded text-emerald-400">
                                    <Share2 className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Produces</div>
                                    <div className="text-sm text-slate-300">
                                        {device.type === 'plc' ? 'Actuator Commands' :
                                            device.type === 'switch' ? 'Filtered Traffic Streams' :
                                                device.type === 'server' ? 'Dashboards & Alerts' : 'Digital I/O Streams'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/50">
                            <div className="text-[10px] text-slate-500 font-mono mb-1">DATA PATHWAY</div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <span>{device.type === 'sensor' ? 'Physical' : 'Edge'}</span>
                                <span className="text-slate-600">→</span>
                                <span className="text-blue-300 bg-blue-900/20 px-1.5 rounded">{device.name}</span>
                                <span className="text-slate-600">→</span>
                                <span>{device.type === 'server' ? 'User' : 'Core'}</span>
                            </div>
                        </div>
                    </section>

                    {/* IMPACT RADIUS */}
                    <section className="bg-slate-950/30 rounded-xl p-4 border border-slate-800/50 relative overflow-hidden">
                        {/* Background Hazard Pattern */}
                        <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                            <AlertTriangle className="w-24 h-24" />
                        </div>

                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-400" /> Impact Radius
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Affected Assets</div>
                                {downstream.length > 0 ? (
                                    <ul className="space-y-1">
                                        {downstream.map(d => (
                                            <li key={d.id} className="flex items-center gap-2 text-xs text-slate-300">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                                {d.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-xs text-slate-500 italic">End-device (No downstream dependents)</div>
                                )}
                            </div>

                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Business Impact</div>
                                <ul className="grid grid-cols-1 gap-1">
                                    {['Missed Production Cycles', 'Data Latency Spike'].map((impact, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-orange-200/80 bg-orange-900/10 px-2 py-1 rounded border border-orange-500/10">
                                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                                            {impact}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                </div>

                {/* ACTIONS */}
                <section>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onInjectFault?.(device.id)}
                            className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 flex flex-col items-center gap-2"
                        >
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Simulate Fault
                        </button>
                        <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            Isolate Device
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
