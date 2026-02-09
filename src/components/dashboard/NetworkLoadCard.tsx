import { ArrowUp, Server, Video, AlertCircle } from 'lucide-react';

export interface NetworkLoadCardProps {
    timeRangeLabel?: string;
    timeRangeValue?: string;
}

export function NetworkLoadCard({ timeRangeLabel = "Last 10 min", timeRangeValue = "10m" }: NetworkLoadCardProps) {
    let utilization = 82;
    let burstPattern = "Burst Pattern (Likely IT)";
    let topTalker1 = 30;

    // Simulate data changes based on time range
    if (timeRangeValue === '6h' || timeRangeValue === '12h' || timeRangeValue === '24h') {
        utilization = 65;
        burstPattern = "Sustained High Load";
        topTalker1 = 45;
    } else if (['2d', '3d', '1w', '1mo'].includes(timeRangeValue)) {
        utilization = 55;
        burstPattern = "Normal Periodic";
        topTalker1 = 28;
    }
    return (
        <div className="relative bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Network Load — Hirschmann BOBCAT (Port 4)
                </h3>
            </div>

            {/* Added time label at top right or similar if needed, or just near sections. 
                For now I will not force it into the header structure unless I redesign it. 
                I'll allow the prop to be used if I add it later, but typically the parent filter is enough. 
                However, to satisfy the plan, I'll add a small indicator. */}
            <div className="absolute top-4 right-4 text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
                {timeRangeLabel}
            </div>

            <div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-400">Port Utilization</span>
                    <span className={`text-lg font-bold flex items-center gap-1 ${utilization > 80 ? 'text-red-400' : 'text-blue-400'}`}>
                        {utilization}% <ArrowUp className="w-4 h-4" />
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r relative ${utilization > 80 ? 'from-blue-500 to-red-500' : 'from-blue-600 to-blue-400'}`}
                        style={{ width: `${utilization}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px]">
                    <span className="text-slate-500">Queue Drops: <span className="text-red-400 font-mono">12/sec</span></span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {burstPattern}
                    </span>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400">Top Talkers (by Bytes)</div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs p-1.5 bg-slate-800/50 rounded">
                        <div className="flex items-center gap-2">
                            <Server className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-200">BackupServer01</span>
                        </div>
                        <span className="font-mono text-amber-400">{topTalker1}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 bg-slate-800/50 rounded">
                        <div className="flex items-center gap-2">
                            <Video className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-200">VideoStreams</span>
                        </div>
                        <span className="font-mono text-blue-400">18%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 bg-slate-800/50 rounded">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-200">Unknown (Ext)</span>
                        </div>
                        <span className="font-mono text-slate-400">5%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
