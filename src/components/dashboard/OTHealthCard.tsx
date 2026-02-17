import { Activity, AlertTriangle, Clock } from 'lucide-react';

export interface OTHealthCardProps {
    timeRangeLabel?: string;
    timeRangeValue?: string;
}

export function OTHealthCard({ timeRangeLabel = "Last 10 min", timeRangeValue = "10m" }: OTHealthCardProps) {
    // Simulate different data based on time range
    let avgCycle = 38;
    let sparklineData = [20, 15, 12, 18, 35, 42, 38, 45, 30, 38, 40, 36, 38];
    let missedCycles = "3.5/min";

    if (timeRangeValue === '6h' || timeRangeValue === '12h' || timeRangeValue === '24h') {
        avgCycle = 45;
        sparklineData = [40, 35, 42, 48, 35, 32, 38, 55, 60, 48, 40, 46, 50];
        missedCycles = "4.2/min";
    } else if (['2d', '3d', '1w', '1mo'].includes(timeRangeValue)) {
        avgCycle = 52;
        sparklineData = [10, 80, 20, 90, 30, 85, 40, 70, 50, 60, 60, 50, 55];
        missedCycles = "12/hour";
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    OT Health: Lion-M PLC Node A
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">DEGRADED</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Avg Cycle ({timeRangeLabel})</div>
                    <div className="text-3xl font-mono font-bold text-yellow-400 flex items-center gap-2">
                        {avgCycle} ms <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-col justify-end">
                    {/* Mock Sparkline */}
                    <div className="h-10 flex items-end gap-[2px] opacity-70">
                        {sparklineData.map((h, i) => (
                            <div key={i} className="w-1.5 bg-purple-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
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
                    <span className="text-slate-200 font-mono">10 ms</span>
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
                        <span className="text-white font-mono">3</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Jitter (std):</span>
                        <span className="text-white font-mono">9 ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
