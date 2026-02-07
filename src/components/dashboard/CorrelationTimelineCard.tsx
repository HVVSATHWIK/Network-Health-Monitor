import { Bot, AlertCircle, ArrowRight, GitMerge } from 'lucide-react';

export function CorrelationTimelineCard() {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="font-semibold text-slate-200 text-sm">Correlation Timeline & Impact</h3>
                <span className="text-[10px] text-slate-500">Live</span>
            </div>

            {/* Mock Timeline Visualization */}
            <div className="relative h-24 w-full mb-4 bg-slate-900/40 rounded border border-slate-800/50 overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-800/30">
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                </div>

                {/* OT Response Line (Purple) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d="M0,80 L20,80 L40,75 L60,40 L80,30 L100,35 L120,80 L140,80 L160,20 L180,10 L200,80 L220,80 L240,80 L260,80 L280,80 L300,75" fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Switch Util Line (Blue) */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d="M0,90 L20,90 L40,85 L60,60 L80,50 L100,55 L120,90 L140,90 L160,30 L180,20 L200,90 L220,90 L240,90 L260,90 L280,90 L300,85" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" className="opacity-60" />
                </svg>

                {/* Event Marker */}
                <div className="absolute left-[55%] top-0 bottom-0 w-px bg-yellow-500/50 border-r border-yellow-500 border-dashed"></div>
                <div className="absolute left-[55%] top-1 -translate-x-1/2 text-[8px] bg-yellow-900/80 text-yellow-200 px-1 rounded">Backup Start</div>
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <GitMerge className="w-3 h-3 text-purple-400" />
                    <span>Temporal Overlap: <span className="text-white font-mono">0.92</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>Path Overlap: <span className="text-white font-mono">TRUE</span></span>
                </div>
            </div>

            {/* AI Insight Section */}
            <div className="mt-auto bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                        <div className="text-xs font-bold text-purple-200">NetMonit AI Insight</div>
                        <div className="text-[11px] text-slate-300 leading-tight mt-1">
                            Finding: OT degradation coincides with <span className="text-amber-300">non-cyclic IT bursts</span> on the same switch.
                        </div>
                    </div>
                </div>

                <div className="pl-6 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400">Impact:</span>
                        <span className="text-red-300 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> PLC cycles missed
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400">Confidence:</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[87%]"></div>
                        </div>
                        <span className="text-red-400">87%</span>
                    </div>

                    <button className="w-full mt-2 flex items-center justify-between bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-[10px] px-2 py-1.5 rounded transition-colors group">
                        <span>Rec: Defer BackupServer01 job</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
