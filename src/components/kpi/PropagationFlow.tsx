import { propagationChain } from '../../data/kpiMockData';

const PropagationFlow = () => {
    const tone = (status: string) => {
        if (status === 'critical') return { dot: 'bg-alert-critical', text: 'text-alert-critical', ring: 'ring-alert-critical/30' };
        if (status === 'warning') return { dot: 'bg-alert-warning', text: 'text-alert-warning', ring: 'ring-alert-warning/30' };
        return { dot: 'bg-alert-success', text: 'text-alert-success', ring: 'ring-alert-success/30' };
    };

    return (
        <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 rounded-xl p-6 h-full flex flex-col relative overflow-hidden ring-1 ring-white/5">
            <div className="mb-4">
                <h3 className="text-gunmetal-100 font-sans font-bold text-lg tracking-tight">Propagation Flow</h3>
                <p className="text-gunmetal-400 text-xs">Digital-twin schematic of root-cause propagation</p>
            </div>

            <div className="flex-1 relative">
                {/* Schematic bus + taps */}
                <svg
                    className="absolute inset-0"
                    viewBox="0 0 1000 220"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <line x1="70" y1="120" x2="930" y2="120" stroke="currentColor" className="text-gunmetal-600" strokeWidth="2" opacity="0.7" />
                    {propagationChain.map((node, idx) => {
                        const x = propagationChain.length === 1 ? 500 : 70 + (860 * idx) / (propagationChain.length - 1);
                        const strokeClass = node.status === 'critical'
                            ? 'text-alert-critical'
                            : node.status === 'warning'
                                ? 'text-alert-warning'
                                : 'text-alert-success';
                        return (
                            <g key={node.id}>
                                <circle cx={x} cy="120" r="8" fill="currentColor" className="text-gunmetal-950" />
                                <circle cx={x} cy="120" r="8" fill="none" stroke="currentColor" className={strokeClass} strokeWidth="2" />
                                <line x1={x} y1="120" x2={x} y2="70" stroke="currentColor" className="text-gunmetal-500" strokeWidth="1" opacity="0.6" />
                            </g>
                        );
                    })}
                </svg>

                {/* Compact modules */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                    {propagationChain.map((node) => {
                        const t = tone(node.status);
                        return (
                            <div key={node.id} className={`rounded-lg border border-gunmetal-700/70 bg-gunmetal-950/35 p-4 ring-1 ${t.ring}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-gunmetal-400">{node.layer}</span>
                                        </div>
                                        <div className="mt-1 text-gunmetal-100 font-sans font-bold tracking-tight truncate">{node.name}</div>
                                    </div>
                                    <span className={`text-[10px] font-mono uppercase tracking-widest ${t.text}`}>{node.status}</span>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="text-[10px] font-mono text-gunmetal-200">
                                        <span className="text-gunmetal-500">Link</span> <span className="tabular-nums">direct</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-gunmetal-200">
                                        <span className="text-gunmetal-500">Latency</span> <span className="tabular-nums">{node.latency ?? 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PropagationFlow;
