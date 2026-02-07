import { ArrowUp, Server, Video, AlertCircle } from 'lucide-react';

export function NetworkLoadCard() {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Network Load — Hirschmann BOBCAT (Port 4)
                </h3>
            </div>

            <div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-400">Port Utilization</span>
                    <span className="text-lg font-bold text-red-400 flex items-center gap-1">
                        82% <ArrowUp className="w-4 h-4" />
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-red-500 w-[82%] relative">
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px]">
                    <span className="text-slate-500">Queue Drops: <span className="text-red-400 font-mono">12/sec</span></span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Burst Pattern (Likely IT)
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
                        <span className="font-mono text-amber-400">30%</span>
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
