import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Device } from '../../types/network';

export interface OTHealthCardProps {
    timeRangeLabel?: string;
    timeRangeValue?: string;
    device?: Device;
}

export function OTHealthCard({ timeRangeLabel = "Last 10 min", device }: OTHealthCardProps) {
    // Derive all values from the actual PLC device data
    const name = device?.name ?? 'Lion-M PLC Node A';
    const status = device?.status ?? 'healthy';
    const appLatency = device?.metrics.l7.appLatency ?? 5;
    const jitter = device?.metrics.l4.jitter ?? 0;
    const sessionResets = device?.metrics.l5.sessionResets ?? 0;
    const tcpRetrans = device?.metrics.l4.tcpRetransmissions ?? 0;

    // Expected cycle time for a PLC is ~10ms
    const expectedCycle = 10;
    // Avg cycle derived from actual app latency (which represents response time)
    const avgCycle = Math.round(Math.max(expectedCycle, appLatency * 0.15 + expectedCycle));

    const isDegraded = status === 'warning' || status === 'critical';
    const isHealthy = status === 'healthy';

    // Missed cycles: high latency = more missed cycles
    const missedCyclesPerMin = isDegraded
        ? Math.round(appLatency / 80 * 10) / 10
        : Math.round(tcpRetrans * 5 * 10) / 10;
    const missedCycles = missedCyclesPerMin > 60 ? `${Math.round(missedCyclesPerMin / 60)}/hour` : `${missedCyclesPerMin}/min`;

    // Timeouts derived from session resets
    const timeouts = sessionResets;

    // Sparkline: generate from metrics (deterministic)
    const sparklineData = Array.from({ length: 13 }, (_, i) => {
        const base = isDegraded ? 40 : 15;
        const wave = Math.sin(i * 0.9 + jitter * 0.1) * 20;
        const spike = (i === 5 || i === 8) && isDegraded ? 25 : 0;
        return Math.max(5, Math.min(95, Math.round(base + wave + spike)));
    });

    const statusBadge = status === 'critical'
        ? { label: 'CRITICAL', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
        : status === 'warning'
            ? { label: 'DEGRADED', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
            : { label: 'HEALTHY', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };

    const valueColor = isHealthy ? 'text-emerald-400' : status === 'critical' ? 'text-red-400' : 'text-yellow-400';

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    OT Health: {name}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>{statusBadge.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Avg Cycle ({timeRangeLabel})</div>
                    <div className={`text-3xl font-mono font-bold ${valueColor} flex items-center gap-2`}>
                        {avgCycle} ms {isDegraded ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                </div>
                <div className="flex flex-col justify-end">
                    <div className="h-10 flex items-end gap-[2px] opacity-70">
                        {sparklineData.map((h, i) => (
                            <div key={i} className={`w-1.5 ${isDegraded ? 'bg-yellow-500' : 'bg-purple-500'} rounded-t-sm`} style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="text-[10px] text-right text-purple-400 mt-1">{timeRangeLabel}</div>
                </div>
            </div>

            <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Expected Cycle:
                    </span>
                    <span className="text-slate-200 font-mono">{expectedCycle} ms</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-3">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Missed cycles:</span>
                        <span className="text-white font-mono">{missedCycles}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Timeouts (5m):</span>
                        <span className="text-white font-mono">{timeouts}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Jitter (std):</span>
                        <span className="text-white font-mono">{Math.round(jitter)} ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
