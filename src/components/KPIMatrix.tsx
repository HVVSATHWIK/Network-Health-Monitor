import { Device } from '../types/network';
import { Activity, X, Server } from 'lucide-react';

interface KPIMatrixProps {
    devices: Device[];
    onClose: () => void;
}

export default function KPIMatrix({ devices, onClose }: KPIMatrixProps) {

    const formatNumber = (value: number, digits = 1) => {
        if (!Number.isFinite(value)) return '—';
        return value.toFixed(digits);
    };

    const formatInt = (value: number) => {
        if (!Number.isFinite(value)) return '—';
        return Math.round(value).toString();
    };

    const formatPercent = (value: number, digits = 1) => {
        if (!Number.isFinite(value)) return '—';
        return `${value.toFixed(digits)}%`;
    };

    // Helper to determine cell color based on thresholds
    const getStatusColor = (val: number, type: 'crc' | 'temp' | 'jitter' | 'latency' | 'power' | 'loss' | 'routes' | 'resets' | 'stability' | 'tls' | 'overhead') => {
        if (type === 'crc') return val > 10 ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : (val > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50' : 'text-slate-400');
        if (type === 'temp') return val > 70 ? 'text-red-500' : (val > 55 ? 'text-amber-500' : 'text-slate-200');
        if (type === 'jitter') return val > 30 ? 'text-red-500' : (val > 10 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'latency') return val > 200 ? 'bg-red-500/10 text-red-500 border border-red-500/50' : (val > 100 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50' : 'bg-slate-800/50 text-emerald-400 border border-emerald-500/20');
        if (type === 'power') return val < -25 ? 'text-red-500' : (val < -20 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'loss') return val > 1 ? 'text-red-500' : (val > 0.2 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'routes') return val > 500 ? 'text-amber-500' : 'text-slate-400';
        if (type === 'resets') return val > 10 ? 'text-red-500' : (val > 2 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'stability') return val < 95 ? 'text-red-500' : (val < 98 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'tls') return val > 5 ? 'text-red-500' : (val > 1 ? 'text-amber-500' : 'text-slate-400');
        if (type === 'overhead') return val > 10 ? 'text-red-500' : (val > 4 ? 'text-amber-500' : 'text-slate-400');
        return 'text-slate-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto overflow-x-hidden">
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-7xl h-[85dvh] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <Activity className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Full-Stack KPI Matrix</h2>
                            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">Cross-Layer Telemetry Correlation Engine</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                {/* Matrix Grid */}
                <div className="flex-1 overflow-auto bg-[#0B0F17]">
                    <div className="min-w-[1450px]">
                        <div className="grid grid-cols-[280px_170px_130px_160px_170px_170px_180px_170px] sticky top-0 z-10 bg-[#0B0F17]/95 backdrop-blur border-b border-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                            <div className="sticky left-0 z-20 bg-[#0B0F17]/95 p-4 pl-6 flex items-center gap-2 border-r border-white/5">
                                <Server className="w-3 h-3" /> Asset Identity
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-blue-400 bg-blue-500/5">
                                Layer 1 (Physical)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-emerald-400 bg-emerald-500/5">
                                Layer 2 (Data Link)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-cyan-400 bg-cyan-500/5">
                                Layer 3 (Network)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-orange-400 bg-orange-500/5">
                                Layer 4 (Transport)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-sky-400 bg-sky-500/5">
                                Layer 5 (Session)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-fuchsia-400 bg-fuchsia-500/5">
                                Layer 6 (Presentation)
                            </div>
                            <div className="p-4 text-center border-l border-white/5 text-purple-400 bg-purple-500/5">
                                Layer 7 (Application)
                            </div>
                        </div>

                        <div className="divide-y divide-white/5">
                            {devices.map(device => (
                                <div key={device.id} className="grid grid-cols-[280px_170px_130px_160px_170px_170px_180px_170px] hover:bg-white/[0.02] transition-colors group">

                                    {/* Asset Info */}
                                    <div className="sticky left-0 z-10 bg-[#0B0F17] group-hover:bg-[#111826] p-4 pl-6 flex flex-col justify-center border-r border-white/5 transition-colors">
                                        <div className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">{device.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-white/5">{device.id.toUpperCase()}</span>
                                            <span className="text-[10px] text-slate-500 capitalize">{device.type}</span>
                                        </div>
                                    </div>

                                    {/* L1 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center gap-1.5">
                                        <span className={`text-sm font-mono font-bold tabular-nums ${getStatusColor(device.metrics.l1.temperature, 'temp')}`}>
                                            {formatNumber(device.metrics.l1.temperature, 1)}°C
                                        </span>
                                        {device.metrics.l1.opticalRxPower && (
                                            <span className={`text-xs font-mono opacity-80 tabular-nums ${getStatusColor(device.metrics.l1.opticalRxPower, 'power')}`}>
                                                {formatNumber(device.metrics.l1.opticalRxPower, 1)} dBm
                                            </span>
                                        )}
                                    </div>

                                    {/* L2 Metric Cell (CRC) */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center">
                                        <div className={`px-3 py-1 rounded-md font-mono font-bold text-sm ${getStatusColor(device.metrics.l2.crcErrors, 'crc')}`}>
                                            {device.metrics.l2.crcErrors > 0 ? `CRC: ${formatInt(device.metrics.l2.crcErrors)}` : 'OK'}
                                        </div>
                                    </div>

                                    {/* L3 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Loss</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l3.packetLoss, 'loss')}`}>{formatPercent(device.metrics.l3.packetLoss, 2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Routes</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l3.routingTableSize, 'routes')}`}>{formatInt(device.metrics.l3.routingTableSize)}</span>
                                        </div>
                                    </div>

                                    {/* L4 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Retx</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l4.tcpRetransmissions * 100, 'jitter')}`}>{formatPercent(device.metrics.l4.tcpRetransmissions, 2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Jitter</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l4.jitter, 'jitter')}`}>{formatNumber(device.metrics.l4.jitter, 1)}ms</span>
                                        </div>
                                    </div>

                                    {/* L5 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Stability</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l5.sessionStability, 'stability')}`}>{formatPercent(device.metrics.l5.sessionStability, 1)}</span>
                                        </div>
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Resets</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l5.sessionResets, 'resets')}`}>{formatInt(device.metrics.l5.sessionResets)}/hr</span>
                                        </div>
                                    </div>

                                    {/* L6 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">TLS Fail</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l6.tlsHandshakeFailures, 'tls')}`}>{formatInt(device.metrics.l6.tlsHandshakeFailures)}/hr</span>
                                        </div>
                                        <div className="flex items-center justify-between w-full text-xs">
                                            <span className="text-slate-500">Overhead</span>
                                            <span className={`font-mono tabular-nums ${getStatusColor(device.metrics.l6.encryptionOverheadMs, 'overhead')}`}>{formatNumber(device.metrics.l6.encryptionOverheadMs, 1)}ms</span>
                                        </div>
                                    </div>

                                    {/* L7 Metric Cell */}
                                    <div className="p-4 border-l border-white/5 flex flex-col justify-center">
                                        <div className={`px-4 py-1.5 rounded-lg font-mono font-bold text-sm tabular-nums inline-flex w-fit ${getStatusColor(device.metrics.l7.appLatency, 'latency')}`}>
                                            {formatNumber(device.metrics.l7.appLatency, 1)}ms
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="bg-slate-900/90 border-t border-white/5 p-3 flex gap-8 text-[10px] uppercase tracking-wider text-slate-500 justify-center font-bold">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> Critical</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Warning</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Nominal</div>
                </div>
            </div>
        </div>
    );
}
