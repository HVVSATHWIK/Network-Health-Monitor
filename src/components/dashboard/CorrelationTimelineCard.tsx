import { Bot, AlertCircle, ArrowRight, GitMerge, CheckCircle } from 'lucide-react';
import { Alert, Device, NetworkConnection } from '../../types/network';

interface CorrelationTimelineCardProps {
  timeRangeLabel?: string;
  timeRangeValue?: string;
  alerts?: Alert[];
  devices?: Device[];
  connections?: NetworkConnection[];
}

export function CorrelationTimelineCard({ timeRangeLabel = 'Last 10 minutes', alerts = [], devices = [], connections = [] }: CorrelationTimelineCardProps) {
    // Derive correlation metrics from actual live data
    const degradedLinks = connections.filter(c => c.status !== 'healthy').length;
    const unhealthyDevices = devices.filter(d => d.status !== 'healthy');
    const otDevices = devices.filter(d => d.category === 'OT');
    const avgOtLatency = otDevices.length > 0
        ? otDevices.reduce((s, d) => s + d.metrics.l7.appLatency, 0) / otDevices.length
        : 0;
    const avgCRC = devices.length > 0
        ? devices.reduce((s, d) => s + d.metrics.l2.crcErrors, 0) / devices.length
        : 0;

    // Determine system health state
    const hasActiveIssues = alerts.length > 0 || unhealthyDevices.length > 0;
    const hasCritical = alerts.some(a => a.severity === 'critical') || devices.some(d => d.status === 'critical');

    // Temporal overlap: how correlated are IT events with OT degradation
    const temporalOverlap = hasCritical ? '0.95' : hasActiveIssues ? '0.82' : '0.15';
    const pathOverlap = degradedLinks > 0;
    const confidence = hasCritical ? 92 : hasActiveIssues ? Math.min(87, 50 + alerts.length * 10) : 12;

    // Generate SVG paths from actual metrics (deterministic)
    const genPath = (baseY: number, volatility: number) => {
        const points = 11;
        const parts: string[] = [];
        for (let i = 0; i <= points; i++) {
            const x = Math.round((i / points) * 300);
            const wave = Math.sin(i * 0.8 + avgOtLatency * 0.01) * volatility;
            const spike = (i === 5 || i === 8) && hasActiveIssues ? -volatility * 1.5 : 0;
            const y = Math.round(Math.max(5, Math.min(95, baseY + wave + spike)));
            parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
        }
        return parts.join(' ');
    };

    const otPath = genPath(hasActiveIssues ? 55 : 80, hasActiveIssues ? 25 : 8);
    const switchPath = genPath(hasActiveIssues ? 60 : 85, hasActiveIssues ? 20 : 5);

    // Dynamic insight text
    const insightText = hasCritical
        ? `Critical: ${unhealthyDevices[0]?.name ?? 'device'} degradation correlates with L1/L2 fault propagation across ${degradedLinks} links.`
        : hasActiveIssues
            ? `OT response degradation correlates with ${alerts.length} active alert(s). Average CRC: ${avgCRC.toFixed(0)}/device.`
            : 'No active IT/OT correlation detected. System operating within normal parameters.';

    const impactText = hasCritical
        ? 'Critical path affected'
        : hasActiveIssues
            ? `${unhealthyDevices.length} device(s) impacted`
            : 'No impact detected';

    const recText = hasCritical
        ? `Investigate ${unhealthyDevices[0]?.name ?? 'root device'} physical link`
        : hasActiveIssues
            ? 'Monitor degraded paths for escalation'
            : 'Continue routine monitoring';

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="font-semibold text-slate-200 text-sm">Correlation Timeline & Impact</h3>
                <span className="text-[10px] text-slate-500">{timeRangeLabel}</span>
            </div>

            <div className="relative h-24 w-full mb-4 bg-slate-900/40 rounded border border-slate-800/50 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-800/30">
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                </div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d={otPath} fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d={switchPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" className="opacity-60" />
                </svg>
                {hasActiveIssues && (
                    <>
                        <div className="absolute left-[55%] top-0 bottom-0 w-px bg-yellow-500/50 border-r border-yellow-500 border-dashed"></div>
                        <div className="absolute left-[55%] top-1 -translate-x-1/2 text-[8px] bg-yellow-900/80 text-yellow-200 px-1 rounded">Event</div>
                    </>
                )}
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <GitMerge className="w-3 h-3 text-purple-400" />
                    <span>Temporal Overlap: <span className="text-white font-mono">{temporalOverlap}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${pathOverlap ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span>Path Overlap: <span className="text-white font-mono">{pathOverlap ? 'TRUE' : 'FALSE'}</span></span>
                </div>
            </div>

            <div className="mt-auto bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                        <div className="text-xs font-bold text-purple-200">NetMonit AI Insight</div>
                        <div className="text-[11px] text-slate-300 leading-tight mt-1">{insightText}</div>
                    </div>
                </div>

                <div className="pl-6 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400">Impact:</span>
                        <span className={`font-semibold flex items-center gap-1 ${hasActiveIssues ? 'text-red-300' : 'text-emerald-300'}`}>
                            {hasActiveIssues ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />} {impactText}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400">Confidence:</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${confidence > 70 ? 'bg-red-500' : confidence > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${confidence}%` }}></div>
                        </div>
                        <span className={`${confidence > 70 ? 'text-red-400' : confidence > 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>{confidence}%</span>
                    </div>

                    <button className="w-full mt-2 flex items-center justify-between bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-[10px] px-2 py-1.5 rounded transition-colors group">
                        <span>Rec: {recText}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
