import { ArrowRight, Clock, Activity } from 'lucide-react';
import { propagationChain } from '../../data/kpiMockData';

const PropagationFlow = () => {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">

            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-slate-200 font-semibold text-lg">Propagation Flow</h3>
                <p className="text-slate-400 text-xs">Root Cause Analysis Chain</p>
            </div>

            {/* Grid background effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* Main Flow Container */}
            <div className="flex-grow flex items-center justify-center w-full z-0 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-0 min-w-[600px] px-8">

                    {propagationChain.map((node, index) => {
                        const isLast = index === propagationChain.length - 1;

                        return (
                            <div key={node.id} className="contents">
                                {/* Node Card */}
                                <div className="relative group">
                                    {/* Connection Indicator (Input) */}
                                    {index > 0 && (
                                        <div className="absolute top-1/2 -left-3 w-3 h-3 bg-slate-800 border-2 border-slate-600 rounded-full z-20 transform -translate-y-1/2 group-hover:border-blue-500 transition-colors"></div>
                                    )}

                                    {/* Connection Indicator (Output) */}
                                    {!isLast && (
                                        <div className="absolute top-1/2 -right-3 w-3 h-3 bg-slate-800 border-2 border-slate-600 rounded-full z-20 transform -translate-y-1/2 group-hover:border-blue-500 transition-colors"></div>
                                    )}

                                    <div className={`
                                relative p-5 w-56 rounded-xl border-l-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
                                ${node.status === 'critical' ? 'bg-gradient-to-br from-red-950/40 to-slate-900 border-l-red-500 border-t border-r border-b border-t-slate-700 border-r-slate-700 border-b-slate-700' :
                                            node.status === 'warning' ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-l-amber-500 border-t border-r border-b border-t-slate-700 border-r-slate-700 border-b-slate-700' :
                                                'bg-slate-800 border-l-emerald-500 border-t border-r border-b border-t-slate-700 border-r-slate-700 border-b-slate-700'}
                            `}>
                                        {/* Header Badge */}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${node.status === 'critical' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' :
                                                    node.status === 'warning' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40' :
                                                        'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                                                }`}>
                                                {node.status}
                                            </span>
                                            {index === 0 && (
                                                <span className="flex h-3 w-3 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-white font-bold text-lg leading-tight mb-1">{node.name}</h4>
                                        <p className="text-xs text-slate-400 font-mono mb-4">{node.layer}</p>

                                        {/* Footer Metrics */}
                                        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400" title="Time Since Impact">
                                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                <span>{node.latency}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto" title="Propagation Type">
                                                <Activity className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Direct</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Connector */}
                                {!isLast && (
                                    <div className="flex-grow min-w-[60px] flex flex-col items-center justify-center relative -mx-1 px-2">
                                        {/* Line */}
                                        <div className="h-0.5 w-full bg-slate-600 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-blue-500 animate-progress-line"></div>
                                        </div>

                                        {/* Time/Latency Label */}
                                        <div className="absolute -top-3 bg-slate-900 border border-slate-700 text-[10px] text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                                            {node.latency === 'Now' ? '< 1s' : '0.5s'}
                                        </div>

                                        <ArrowRight className="w-4 h-4 text-slate-500 absolute right-0 -mt-[1px]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend / Footer */}
            <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Critical Fault</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Risk Warning</span>
                </div>
            </div>

        </div>
    );
};

export default PropagationFlow;
