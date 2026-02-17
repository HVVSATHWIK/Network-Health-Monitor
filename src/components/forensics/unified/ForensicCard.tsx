import { X, Maximize2, Download, ShieldCheck, Cpu, Globe, Search } from 'lucide-react';
import { ForensicTerminal } from './ForensicTerminal';
import { Alert, Device } from '../../../types/network';
import { useEffect, useMemo, useState } from 'react';
import { analyzeWithMultiAgents, ForensicReport } from '../../../utils/aiLogic';

interface ForensicCardProps {
    alert: Alert;
    device?: Device;
    devices: Device[];
    onClose: () => void;
}

export const ForensicCard: React.FC<ForensicCardProps> = ({ alert, device, devices, onClose }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [report, setReport] = useState<ForensicReport | null>(null);
    const [analysisText, setAnalysisText] = useState<string | null>(null);
    const [grepPattern, setGrepPattern] = useState('error|refused|fail');

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setIsAnalyzing(true);
            setReport(null);
            setAnalysisText(null);

            const query = `Analyze this ${alert.layer} alert and provide root cause and remediation: ${alert.message}`;

            try {
                const res = await analyzeWithMultiAgents(query, null, [alert], devices, () => { });
                if (cancelled) return;

                if (typeof res === 'string') {
                    setAnalysisText(res);
                } else {
                    setReport(res);
                }
            } catch {
                if (cancelled) return;
                setAnalysisText('Analysis failed to run.');
            } finally {
                if (!cancelled) setIsAnalyzing(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [alert, devices]);

    const severityBadge = useMemo(() => {
        switch (report?.criticality ?? 'low') {
            case 'extreme':
                return { bg: 'bg-alert-critical/10', text: 'text-alert-critical', border: 'border-alert-critical/20' };
            case 'high':
                return { bg: 'bg-alert-warning/10', text: 'text-alert-warning', border: 'border-alert-warning/20' };
            case 'medium':
                return { bg: 'bg-alert-info/10', text: 'text-alert-info', border: 'border-alert-info/20' };
            default:
                return { bg: 'bg-alert-success/10', text: 'text-alert-success', border: 'border-alert-success/20' };
        }
    }, [report?.criticality]);

    const terminalText = useMemo(() => {
        const levelForAlert = (() => {
            if (alert.severity === 'critical') return 'ERROR';
            if (alert.severity === 'high') return 'ERROR';
            if (alert.severity === 'medium') return 'WARN';
            return 'INFO';
        })();

        const levelForStep = (status: string) => {
            if (status === 'failed') return 'ERROR';
            if (status === 'running') return 'INFO';
            if (status === 'pending') return 'INFO';
            return 'INFO';
        };

        if (isAnalyzing) {
            const now = new Date();
            const ts = now.toLocaleTimeString();
            return `[${ts}] COORDINATOR: Opening investigation for ${alert.id.slice(0, 8)}
[${ts}] ${levelForAlert}: Alert layer=${alert.layer} severity=${alert.severity} device="${alert.device}" msg="${alert.message}"
[${ts}] PIPELINE: Running multi-agent correlation...
[${ts}] PIPELINE: Awaiting findings...
`;
        }

        if (analysisText) {
            const ts = new Date().toLocaleTimeString();
            return `[${ts}] COORDINATOR: Analysis summary
[${ts}] ${analysisText}
`;
        }

        if (!report) return undefined;

        const lines: string[] = [];
        report.chainOfThought.forEach((step) => {
            const ts = new Date(step.timestamp).toLocaleTimeString();
            const status = step.status.toUpperCase();
            const lvl = levelForStep(step.status);
            const maybeFail = step.status === 'failed' ? ' FAIL' : '';
            lines.push(`[${ts}] ${lvl}${maybeFail}: ${step.agent} ${step.action} -> ${status}${step.result ? ` (${step.result})` : ''}`);
        });
        lines.push(`[${new Date().toLocaleTimeString()}] ${report.criticality === 'extreme' || report.criticality === 'high' ? 'ERROR' : 'INFO'}: SUMMARY ${report.summary}`);
        return lines.join('\n') + '\n';
    }, [alert.device, alert.id, alert.layer, alert.message, alert.severity, analysisText, isAnalyzing, report]);

    return (
        <div className="w-full overflow-hidden rounded-xl border border-gunmetal-600 bg-gunmetal-800 shadow-2xl ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-300 my-8">

            {/* 1. Forensic Header Toolbar */}
            <div className="flex items-center justify-between border-b border-gunmetal-700 bg-gunmetal-900 px-4 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded bg-alert-critical/10 px-3 py-1 text-xs font-bold text-alert-critical border border-alert-critical/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        <div className="h-2 w-2 rounded-full bg-alert-critical animate-pulse" />
                        LIVE INVESTIGATION
                    </div>
                    <div className="h-4 w-px bg-gunmetal-700" />
                    <span className="text-sm font-medium text-gunmetal-100 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gunmetal-500" />
                        {alert.target_ip || 'Unknown Host'}
                    </span>
                    <span className="text-xs text-gunmetal-500 font-mono">Session ID: {alert.id.slice(0, 8)}</span>
                </div>

                <div className="flex items-center gap-1">
                    <button className="rounded p-2 text-gunmetal-400 hover:bg-gunmetal-800 hover:text-white transition-colors" title="Download PCAP">
                        <Download className="h-4 w-4" />
                    </button>
                    <button className="rounded p-2 text-gunmetal-400 hover:bg-gunmetal-800 hover:text-white transition-colors" title="Fullscreen">
                        <Maximize2 className="h-4 w-4" />
                    </button>
                    <button onClick={onClose} className="rounded p-2 text-gunmetal-400 hover:bg-alert-critical/20 hover:text-alert-critical transition-colors" title="Close Investigation">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* 2. Split Pane Layout (Terminal vs Context) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 h-[500px]">

                {/* Left: Terminal Stream (75% Width) */}
                <div className="lg:col-span-9 border-r border-gunmetal-700 bg-terminal-bg relative flex flex-col">
                    {/* Log Filter Bar */}
                    <div className="flex items-center gap-2 border-b border-gunmetal-800 bg-terminal-bg px-4 py-2">
                        <Search className="h-3 w-3 text-gunmetal-500" />
                        <input
                            type="text"
                            placeholder="Grep logs (regex supported)..."
                            className="flex-1 bg-transparent text-xs font-mono text-gunmetal-300 placeholder-gunmetal-600 focus:outline-none"
                            value={grepPattern}
                            onChange={(e) => setGrepPattern(e.target.value)}
                        />
                    </div>

                    {/* The Virtualized Log Component */}
                    <div className="flex-1 relative overflow-hidden">
                        <ForensicTerminal
                            streamUrl={`wss://api.monitor.net/stream/${alert.id}`}
                            text={terminalText}
                            filterPattern={grepPattern}
                        />
                    </div>
                </div>

                {/* Right: Context & Remediation (25% Width) */}
                <div className="lg:col-span-3 flex flex-col bg-gunmetal-800">

                    {/* AI Findings */}
                    <div className="p-5 border-b border-gunmetal-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gunmetal-500">Findings</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBadge.bg} ${severityBadge.text} ${severityBadge.border}`}>
                                {isAnalyzing ? 'ANALYZING' : (report?.criticality ?? 'LOW').toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-gunmetal-400">
                                <span className="text-gunmetal-500">Target:</span>{' '}
                                <span className="font-mono text-gunmetal-200">{device?.name ?? alert.device}</span>
                            </div>
                            <div className="text-xs text-gunmetal-400">
                                <span className="text-gunmetal-500">Alert:</span>{' '}
                                <span className="text-gunmetal-200">{alert.message}</span>
                            </div>

                            {isAnalyzing && (
                                <div className="text-xs font-mono text-gunmetal-500">Running correlation across L1–L7 telemetry…</div>
                            )}

                            {!isAnalyzing && analysisText && (
                                <div className="text-xs text-gunmetal-200">{analysisText}</div>
                            )}

                            {!isAnalyzing && report && (
                                <>
                                    <div className="text-xs">
                                        <div className="text-gunmetal-500">Root Cause</div>
                                        <div className="text-gunmetal-100 font-semibold">{report.rootCause}</div>
                                    </div>
                                    <div className="text-xs text-gunmetal-200">{report.summary}</div>
                                    <div className="text-xs">
                                        <div className="text-gunmetal-500">Recommended Actions</div>
                                        <div className="text-gunmetal-200">
                                            {report.recommendations.slice(0, 3).map((r, idx) => (
                                                <div key={idx}>• {r}</div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Remediation Tools */}
                    <div className="flex-1 p-5">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gunmetal-500">Remediation</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left group flex items-center justify-between rounded-lg border border-gunmetal-700 bg-gunmetal-800 px-3 py-2.5 text-xs text-gunmetal-300 hover:border-alert-warning hover:text-white transition-all">
                                <span className="font-medium">Isolate Host</span>
                                <ShieldCheck className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-alert-warning" />
                            </button>
                            <button className="w-full text-left group flex items-center justify-between rounded-lg border border-gunmetal-700 bg-gunmetal-800 px-3 py-2.5 text-xs text-gunmetal-300 hover:border-alert-info hover:text-white transition-all">
                                <span className="font-medium">Restart Service</span>
                                <Cpu className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-alert-info" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
