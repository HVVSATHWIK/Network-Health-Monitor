import { useState, useEffect } from 'react'; // Added useEffect
import { SmartFailureEvent } from '../types/network';
import {
    AlertOctagon,
    Activity,
    Shield,
    Clock,
    MapPin,
    ChevronDown,
    ChevronUp,
    ChevronRight, // Added ChevronRight
    Network,
    Database,
    Layers,
    Search,     // Added for Evidence
    FileText,
    Bot
} from 'lucide-react';

export interface AIMonitoringEvent {
    id: string;
    timestamp: number;
    status: 'success' | 'quota_limited' | 'error';
    layer: string;
    device: string;
    detail: string;
}

interface SmartLogPanelProps {
    logs: SmartFailureEvent[];
    aiTimeline?: AIMonitoringEvent[];
}

// Helper functions (extracted for reuse)
const getLayerColor = (layer: string) => {
    switch (layer) {
        case 'L1': return 'text-red-400 bg-red-950/50 border-red-900';
        case 'L2': return 'text-orange-400 bg-orange-950/50 border-orange-900';
        case 'L3': return 'text-yellow-400 bg-yellow-950/50 border-yellow-900';
        case 'L4': return 'text-blue-400 bg-blue-950/50 border-blue-900';
        case 'L7': return 'text-purple-400 bg-purple-950/50 border-purple-900';
        default: return 'text-slate-400 bg-slate-900 border-slate-700';
    }
};

const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Sub-component for individual Log Logic
const LogCard = ({ log, isExpanded, onToggle }: { log: SmartFailureEvent, isExpanded: boolean, onToggle: () => void }) => {
    const [showDetails, setShowDetails] = useState(false);
    const layerStyle = getLayerColor(log.osiLayer);

    // Reset details view when collapsed
    useEffect(() => {
        if (!isExpanded) {
            setShowDetails(false);
        }
    }, [isExpanded]);

    return (
        <div
            className={`rounded-lg border transition-all duration-300 ${isExpanded
                ? 'bg-slate-800/80 border-purple-500/30 shadow-lg ring-1 ring-purple-500/20'
                : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
        >
            {/* Header (Always Visible) */}
            <div
                onClick={onToggle}
                className="p-4 cursor-pointer flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    {/* Layer Badge */}
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${layerStyle}`}>
                        <span className="text-xs font-bold opacity-70">OSI</span>
                        <span className="text-lg font-bold leading-none">{log.osiLayer}</span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                                {log.failureType}
                            </span>
                            {log.confidenceScore > 0.8 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-800">
                                    {Math.round(log.confidenceScore * 100)}% CONFIDENCE
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {log.originDeviceName} ({log.originPort || 'Device'})
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(log.startTime)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-xs text-slate-500">Impact</span>
                            <span className="text-xs font-medium text-slate-300">{log.impact.impactedDeviceIds.length} Devices</span>
                        </div>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default">
                    <div className="h-px bg-slate-700/50 mb-6" />

                    {/* 1. Concise TL;DR (Always Visible) */}
                    <div className="mb-6 bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 relative overflow-hidden flex items-start gap-3">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                        <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">TL;DR Analysis</div>
                            <p className="text-sm font-medium text-amber-100/90 leading-relaxed">
                                {log.summary}
                            </p>
                        </div>
                    </div>

                    {/* 2. Causal Chain (Always Visible) */}
                    <div className="mb-8">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <Network className="w-4 h-4" /> Causal Chain Analysis
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 relative">
                            {/* Root Cause */}
                            <div className="flex-1 bg-red-950/20 border border-red-900/50 rounded-lg p-3 relative group">
                                <div className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-bold text-red-400 border border-red-900 uppercase tracking-wider">Root Cause</div>
                                <div className="text-xs font-bold text-red-300 mb-1">{log.failureChain.rootCause.device}</div>
                                <div className="text-sm text-slate-300">{log.failureChain.rootCause.description}</div>
                                <div className="mt-2 text-[10px] font-mono text-slate-500">{log.failureChain.rootCause.layer} Infrastructure</div>
                            </div>

                            <div className="hidden md:flex items-center justify-center text-slate-600">
                                <ChevronRight className="w-6 h-6 text-slate-600" />
                            </div>

                            {/* Propagation */}
                            {log.failureChain.propagation.map((prop, idx) => (
                                <div key={idx} className="flex-1 bg-orange-950/10 border border-orange-900/30 rounded-lg p-3 relative">
                                    <div className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-bold text-orange-400 border border-orange-900 uppercase tracking-wider">Propagation</div>
                                    <div className="text-xs font-bold text-orange-300 mb-1">{prop.device}</div>
                                    <div className="text-sm text-slate-300">{prop.description}</div>
                                    <div className="mt-2 text-[10px] font-mono text-slate-500">{prop.layer} Layer</div>
                                </div>
                            ))}

                            <div className="hidden md:flex items-center justify-center text-slate-600">
                                <ChevronRight className="w-6 h-6 text-slate-600" />
                            </div>

                            {/* Symptoms */}
                            <div className="flex-1 bg-purple-950/10 border border-purple-900/30 rounded-lg p-3 relative">
                                <div className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-bold text-purple-400 border border-purple-900 uppercase tracking-wider">Symptoms</div>
                                <div className="space-y-2">
                                    {log.failureChain.symptoms.map((sym, idx) => (
                                        <div key={idx}>
                                            <div className="text-xs font-bold text-purple-300">{sym.device}</div>
                                            <div className="text-sm text-slate-300">{sym.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Impact & Actions (Always Visible) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Impact Assessment */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Impact Assessment
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Technical</div>
                                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                                        {log.impact.technical.map((imp, idx) => <li key={idx}>{imp}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Operational</div>
                                    <ul className="list-disc list-inside text-xs text-orange-300 space-y-1">
                                        {log.impact.operational.map((imp, idx) => <li key={idx}>{imp}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 h-full">
                            <div className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Recommended Actions
                            </div>
                            <div className="space-y-3">
                                {log.recommendedActions.map((action, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="min-w-[16px] h-[16px] rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="text-xs text-blue-100">{action}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Progressive Disclosure Toggle */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 bg-slate-900/30 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-lg transition-all mb-2"
                    >
                        {showDetails ? (
                            <>Hide Investigation Details <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>View Investigation Details <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>

                    {/* 5. Hidden Details: Narrative, Confidence, Timeline, Evidence */}
                    {showDetails && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-800 mt-2">
                            {/* Narrative & Confidence (Left) */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Narrative */}
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><FileText className="w-3 h-3" /> Narrative Diagnosis</div>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded border border-slate-700/50">
                                        {log.rootCauseExplanation}
                                    </p>
                                </div>

                                {/* Confidence */}
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-bold text-slate-500 uppercase">AI Confidence</div>
                                        <div className="text-xl font-bold text-green-400">{Math.round(log.confidenceScore * 100)}%</div>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(log.confidenceBreakdown).map(([factor, score]) => (
                                            <div key={factor} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${score > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.abs(score) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-6 text-right font-mono text-slate-300">{score > 0 ? '+' : ''}{score}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ruled Out */}
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Ruled Out Hypotheses
                                    </div>
                                    <ul className="space-y-2">
                                        {log.ruledOutCauses.map((cause, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                                                <span className="text-green-500 font-bold">✓</span>
                                                <span className="line-through opacity-70">{cause}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Timeline & Evidence (Right) */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Timeline */}
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-3">Incident Micro-Timeline</div>
                                    <div className="relative pl-4 border-l border-slate-800 space-y-4">
                                        {log.timeline.map((event, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${event.type === 'critical' ? 'bg-red-500' :
                                                    event.type === 'completion' ? 'bg-green-500' : 'bg-slate-500'
                                                    }`} />
                                                <div className="text-[10px] text-slate-500 font-mono mb-0.5">
                                                    {formatTime(event.timestamp)}
                                                </div>
                                                <div className={`text-xs ${event.type === 'critical' ? 'text-red-300' : 'text-slate-300'}`}>
                                                    {event.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Evidence (New) */}
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Search className="w-3 h-3" /> Supporting Evidence
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {log.evidence && Object.entries(log.evidence.keyMetrics || {}).map(([key, value]) => (
                                            <div key={key} className="bg-slate-950 p-3 rounded border border-slate-800">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">{key}</div>
                                                <div className="text-lg font-mono font-bold text-white">{value}</div>
                                            </div>
                                        ))}
                                        {log.evidence?.alertCount !== undefined && (
                                            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Alert Count</div>
                                                <div className="text-lg font-mono font-bold text-white">{log.evidence.alertCount}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function SmartLogPanel({ logs, aiTimeline = [] }: SmartLogPanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(logs[0]?.id || null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="h-full bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white tracking-wide">System Logic Logs</h2>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                    Correlated Diagnostic Events: {logs.length}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {aiTimeline.length > 0 && (
                    <div id="ai-monitoring-timeline" className="bg-slate-950/40 border border-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-sm font-semibold text-slate-200">AI Monitoring Timeline</h3>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">Entries: {aiTimeline.length}</span>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                            {[...aiTimeline].reverse().map((event) => {
                                const statusStyle = event.status === 'success'
                                    ? 'text-emerald-300 border-emerald-800/40 bg-emerald-900/10'
                                    : event.status === 'quota_limited'
                                        ? 'text-amber-300 border-amber-800/40 bg-amber-900/10'
                                        : 'text-red-300 border-red-800/40 bg-red-900/10';

                                return (
                                    <div key={event.id} className={`rounded border px-3 py-2 ${statusStyle}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-[10px] font-mono uppercase tracking-widest">{event.status.replace('_', ' ')}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-200">{event.layer} · {event.device}</div>
                                        <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">{event.detail}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {logs.map((log) => (
                    <LogCard
                        key={log.id}
                        log={log}
                        isExpanded={expandedId === log.id}
                        onToggle={() => toggleExpand(log.id)}
                    />
                ))}
            </div>
        </div>
    );
}
