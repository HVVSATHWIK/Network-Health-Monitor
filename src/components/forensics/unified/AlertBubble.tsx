import { ShieldAlert, Terminal, Activity, Bot } from 'lucide-react';
import { Alert } from '../../../types/network';

interface AlertBubbleProps {
    alert: Alert;
    onAnalyze: () => void;
}

export const AlertBubble: React.FC<AlertBubbleProps> = ({ alert, onAnalyze }) => {
    const isCritical = alert.severity === 'critical';
    const isWarning = alert.severity === 'high' || alert.severity === 'medium';

    // Simulated title/desc if not present in legacy alert type
    const title = alert.title || `${alert.layer} Anomaly Detected`;
    const description = alert.message;

    return (
        <div className="group flex gap-5 pl-2 animate-in slide-in-from-bottom-2 duration-500 mb-6">

            {/* 1. Avatar Column */}
            <div className="flex flex-col items-center gap-2 pt-1">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105 ${isCritical
                        ? 'border-alert-critical/30 bg-alert-critical/10 text-alert-critical shadow-alert-critical/10'
                        : isWarning
                            ? 'border-alert-warning/30 bg-alert-warning/10 text-alert-warning shadow-alert-warning/10'
                            : 'border-alert-info/30 bg-alert-info/10 text-alert-info'
                    }`}>
                    {isCritical ? <ShieldAlert className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                </div>
                {/* Timeline connector (visual only, can hide for last item via CSS if needed) */}
                <div className="h-full w-px bg-gunmetal-800 group-last:hidden min-h-[50px]" />
            </div>

            {/* 2. Content Column */}
            <div className="flex max-w-3xl flex-1 flex-col items-start gap-3 pb-2">

                {/* The Bubble Container */}
                <div className="relative w-full overflow-hidden rounded-2xl rounded-tl-none border border-gunmetal-700 bg-gunmetal-800/50 p-5 shadow-sm transition-all hover:border-gunmetal-600 hover:bg-gunmetal-800 hover:shadow-md">

                    {/* Header: Title & Time */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-gunmetal-100 text-base tracking-tight">{title}</span>
                            <span className="text-xs font-mono text-gunmetal-500 mt-0.5">
                                {new Date(alert.timestamp).toLocaleTimeString()} • {alert.source || 'Automated Monitor'}
                            </span>
                        </div>
                        {isCritical && (
                            <span className="inline-flex items-center rounded-md bg-alert-critical/10 px-2 py-1 text-xs font-medium text-alert-critical ring-1 ring-inset ring-alert-critical/20 uppercase">
                                Critical
                            </span>
                        )}
                    </div>

                    {/* Narrative Description */}
                    <p className="text-sm text-gunmetal-300 leading-relaxed max-w-prose">
                        {description}
                    </p>

                    {/* 
               Agent Steps: Visualizing the automated work done BEFORE human intervention.
             */}
                    {alert.agentSteps && alert.agentSteps.length > 0 && (
                        <div className="mt-5 space-y-3 rounded-xl border border-gunmetal-700/50 bg-gunmetal-900/30 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gunmetal-500">
                                <Bot className="h-3.5 w-3.5" />
                                <span>Automated Defense Log</span>
                            </div>
                            <div className="space-y-2">
                                {alert.agentSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs text-gunmetal-400">
                                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-alert-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="font-mono">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Rail */}
                <div className="flex items-center gap-3 pl-1">
                    <button
                        onClick={onAnalyze}
                        className="flex items-center gap-2 rounded-lg bg-alert-info px-4 py-2 text-xs font-bold text-white shadow-lg shadow-alert-info/20 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Terminal className="h-4 w-4" />
                        Analyze Stream
                    </button>
                    <button className="flex items-center gap-2 rounded-lg border border-gunmetal-700 bg-transparent px-4 py-2 text-xs font-medium text-gunmetal-400 hover:border-gunmetal-600 hover:text-gunmetal-200 transition-colors">
                        Mark False Positive
                    </button>
                </div>
            </div>
        </div>
    );
};
