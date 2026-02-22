import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ShieldAlert, Terminal, Activity, Play } from 'lucide-react';
import { analyzeWithMultiAgents, ForensicReport } from '../../utils/aiLogic';
import { Alert, Device } from '../../types/network';
import OTDRTrace from './visualizations/OTDRTrace';
import LatencyHistogram from './visualizations/LatencyHistogram';
import InvestigationStream from './InvestigationStream';
import { PerfMonitorService } from '../../services/PerfMonitorService';

type OTDRPoint = { distance: number; signal: number };
type LatencyHistogramBin = { range: string; count: number; bin: number };

const isOTDRData = (data: unknown): data is OTDRPoint[] => {
    if (!Array.isArray(data)) return false;
    return data.every((item) => {
        if (typeof item !== 'object' || item === null) return false;
        const rec = item as Record<string, unknown>;
        return typeof rec.distance === 'number' && typeof rec.signal === 'number';
    });
};

const isLatencyHistogramData = (data: unknown): data is LatencyHistogramBin[] => {
    if (!Array.isArray(data)) return false;
    return data.every((item) => {
        if (typeof item !== 'object' || item === null) return false;
        const rec = item as Record<string, unknown>;
        return typeof rec.range === 'string' && typeof rec.count === 'number' && typeof rec.bin === 'number';
    });
};

interface ForensicCockpitProps {
    alerts: Alert[];
    devices: Device[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    systemMessage?: string;
    userName?: string;
}

export default function ForensicCockpit({ alerts, devices, isOpen, onOpenChange, systemMessage, userName = "Admin" }: ForensicCockpitProps) {
    const [query, setQuery] = useState("");
    const [report, setReport] = useState<ForensicReport | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisText, setAnalysisText] = useState<string | null>(null);
    const lastSystemMessageRef = useRef<string | undefined>(undefined);

    const handleScan = useCallback(async (prompt: string) => {
        if (isAnalyzing) return;
        const startedAt = PerfMonitorService.startTimer();
        setQuery(prompt);
        setIsAnalyzing(true);
        setReport(null); // Clear previous
        setAnalysisText(null);

        try {
            const result = await analyzeWithMultiAgents(prompt, null, alerts, devices, () => { });

            if (typeof result === 'string') {
                setAnalysisText(result);
                setIsAnalyzing(false);
            } else {
                // Simulate "Streaming" of the Chain of Thought
                // We will "Reveal" the report steps one by one to mimic real-time processing
                const fullReport = result as ForensicReport;

                // Initial empty state
                setReport({ ...fullReport, chainOfThought: [] });

                // Reveal loop
                fullReport.chainOfThought.forEach((step, idx) => {
                    setTimeout(() => {
                        setReport(prev => {
                            if (!prev) return prev;
                            return { ...prev, chainOfThought: [...prev.chainOfThought, step] };
                        });
                    }, idx * 800);
                });

                // Reveal Final Artifacts
                setTimeout(() => {
                    setReport(() => fullReport); // Show everything including artifacts/summary
                    setIsAnalyzing(false);
                }, fullReport.chainOfThought.length * 800 + 500);
            }

        } catch (e) {
            if (import.meta.env.DEV) console.error(e);
            setIsAnalyzing(false);
        } finally {
            PerfMonitorService.endAction('forensic_scan_ms', startedAt);
        }
    }, [alerts, devices, isAnalyzing]);

    // Auto-trigger analysis only when a NEW system message arrives while open
    useEffect(() => {
        if (systemMessage && isOpen && systemMessage !== lastSystemMessageRef.current) {
            lastSystemMessageRef.current = systemMessage;
            void handleScan(systemMessage);
        }
    }, [handleScan, systemMessage, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleScan(query);
    }

    if (!isOpen) {
        return createPortal(
            <button
                onClick={() => onOpenChange(true)}
                className="fixed bottom-6 right-6 bg-slate-950 border border-indigo-500/50 text-indigo-300 px-6 py-3 rounded-md shadow-lg hover:bg-slate-900 transition-all flex items-center gap-3 font-mono text-xs uppercase tracking-widest z-50 group hover:scale-105"
            >
                <Terminal className="w-4 h-4 group-hover:animate-pulse" />
                <span>Forensic Cockpit</span>
                <span className="bg-indigo-400 text-slate-950 px-1.5 py-0.5 text-[9px] font-bold rounded-sm">LIVE</span>
            </button>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 sm:p-8 font-sans overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-6xl h-[85dvh] bg-slate-950 border border-slate-800 shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* HEADER */}
                <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/40">
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-indigo-300" />
                        <h2 className="text-slate-200 font-mono uppercase tracking-widest text-sm font-bold">
                            NetMonit <span className="text-indigo-300">Forensic Console</span> v2.4
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                            CONNECTED: {userName.toUpperCase()}
                        </div>
                        <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-red-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* BODY GRID */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

                    {/* LEFT PANEL: INPUT & CONTEXT (4 cols) */}
                    <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 min-h-0">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-800">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="INITIATE DIAGNOSTIC SEQUENCE..."
                                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 font-mono text-xs p-3 pl-10 outline-none uppercase tracking-wide placeholder:text-slate-400"
                                    autoFocus
                                />
                                <Search className="w-4 h-4 text-indigo-300 absolute left-3 top-3.5" />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleScan(`Analyze root cause for: ${alerts.length > 0 ? alerts[0].device + ' - ' + alerts[0].message : 'potential physical cable fault on critical OT path'}`)} className="flex-1 bg-slate-900 hover:bg-indigo-500/10 border border-slate-800 text-slate-400 text-[10px] py-2 uppercase tracking-wider transition-all text-left px-3">
                                    {alerts.some(a => a.layer === 'L1' || a.layer === 'L2') ? 'Analyze L1/L2 Fault' : 'Sim: Cable Cut'}
                                </button>
                                <button onClick={() => handleScan(`Analyze application latency: ${devices.filter(d => d.metrics.l7.appLatency > 200).map(d => d.name).join(', ') || 'check all OT device response times'}`)} className="flex-1 bg-slate-900 hover:bg-indigo-500/10 border border-slate-800 text-slate-400 text-[10px] py-2 uppercase tracking-wider transition-all text-left px-3">
                                    {devices.some(d => d.metrics.l7.appLatency > 200) ? 'Analyze Latency' : 'Sim: L7 Lag'}
                                </button>
                            </div>
                        </div>

                        {/* Recent Alerts List (Static Context) */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Active Telemetry Triggers</h3>
                            <div className="space-y-3">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="border-l-2 border-red-500 bg-red-500/5 pl-3 py-2">
                                        <div className="flex justify-between items-start text-red-400 text-xs font-bold mb-1 font-mono">
                                            <span>{alert.layer} ALERT</span>
                                            <span>{alert.severity.toUpperCase()}</span>
                                        </div>
                                        <div className="text-slate-200 text-xs leading-tight mb-1">{alert.message}</div>
                                        <div className="text-slate-400 text-[10px] font-mono">{alert.device}</div>
                                    </div>
                                ))}
                                {alerts.length === 0 && <div className="text-indigo-300 text-xs font-mono italic opacity-50">NO ACTIVE ALERTS</div>}
                            </div>
                        </div>
                    </div>

                    {/* CENTER PANEL: VISUALIZATION (5 cols) */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
                        {report && (
                            <>
                                {/* Executive Summary Card */}
                                <div className={`border-l-4 p-4 ${report.criticality === 'extreme' ? 'bg-red-500/10 border-red-500' : 'bg-indigo-500/10 border-indigo-400'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldAlert className={`w-5 h-5 ${report.criticality === 'extreme' ? 'text-red-400' : 'text-indigo-300'}`} />
                                        <h3 className="text-slate-200 font-bold text-sm tracking-wide uppercase">Executive Summary</h3>
                                    </div>
                                    <p className="text-slate-200 text-xs leading-relaxed font-mono">
                                        {report.summary}
                                    </p>
                                </div>

                                {/* Artifacts */}
                                <div className="flex flex-col gap-6">
                                    {report.artifacts.map((artifact, i) => (
                                        <div key={i} className="animate-in slide-in-from-bottom-5 fade-in duration-500 delay-100">
                                            {artifact.type === 'otdr' && (
                                                <OTDRTrace
                                                    data={isOTDRData(artifact.data) ? artifact.data : []}
                                                    title={artifact.title}
                                                    description={artifact.description}
                                                />
                                            )}
                                            {artifact.type === 'latency_histogram' && (
                                                <LatencyHistogram
                                                    data={isLatencyHistogramData(artifact.data) ? artifact.data : []}
                                                    title={artifact.title}
                                                    description={artifact.description}
                                                />
                                            )}
                                            {artifact.type === 'json_log' && (
                                                <div className="font-mono text-[10px] bg-slate-950 border border-slate-800 p-4 text-slate-200">
                                                    <pre>{JSON.stringify(artifact.data, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Recommendations */}
                                {report.recommendations.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">Remediation Protocol</h4>
                                        <ul className="space-y-2">
                                            {report.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs text-slate-200 font-mono p-2 border border-slate-800 bg-slate-900/40">
                                                    <Play className="w-3 h-3 text-indigo-300" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                        {!report && !isAnalyzing && analysisText && (
                            <div className="border-l-4 p-4 bg-indigo-500/10 border-indigo-400">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-5 h-5 text-indigo-300" />
                                    <h3 className="text-slate-200 font-bold text-sm tracking-wide uppercase">Analysis Output</h3>
                                </div>
                                <p className="text-slate-200 text-xs leading-relaxed font-mono whitespace-pre-wrap">{analysisText}</p>
                            </div>
                        )}
                        {!report && !isAnalyzing && !analysisText && (
                            <div className="h-full flex flex-col items-center justify-center p-4">
                                <Activity className="w-12 h-12 mb-4 text-indigo-300 opacity-40" />
                                <div className="text-xs font-mono uppercase tracking-widest text-indigo-300 mb-6">
                                    {alerts.length === 0 ? 'System Operational' : 'Issues Detected'}
                                </div>
                                <div className="w-full max-w-sm space-y-3">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-slate-400">Active Alerts</span>
                                        <span className={`${alerts.length > 0 ? 'text-red-400' : 'text-indigo-300'}`}>{alerts.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-slate-400">Unhealthy Devices</span>
                                        <span className={`${devices.filter(d => d.status !== 'healthy').length > 0 ? 'text-red-400' : 'text-indigo-300'}`}>{devices.filter(d => d.status !== 'healthy').length}/{devices.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-slate-400">Device Coverage</span>
                                        <span className="text-indigo-300">{devices.length} assets</span>
                                    </div>
                                    {alerts.length > 0 && (
                                        <div className="mt-4 border-t border-slate-800 pt-3">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Top Issue</div>
                                            <div className="text-xs text-slate-200 font-mono">{alerts[0].device}: {alerts[0].message}</div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleScan(`Perform full system health audit. ${alerts.length} alerts, ${devices.filter(d => d.status !== 'healthy').length} unhealthy devices. Analyze all layers L1-L7.`)}
                                    className="mt-6 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase tracking-wider px-4 py-2 transition-all flex items-center gap-2"
                                >
                                    <Play className="w-3 h-3" /> Run Full Audit
                                </button>
                            </div>
                        )}
                        {isAnalyzing && !report && (
                            <div className="h-full flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-2 border-slate-800 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                                <div className="text-indigo-300 text-xs font-mono uppercase tracking-widest animate-pulse">Initializing Neural Agents...</div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: INVESTIGATION STREAM (3 cols) */}
                    <div className="lg:col-span-3 bg-slate-950 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Live Investigation Stream
                        </h3>
                        {report && report.chainOfThought && (
                            <InvestigationStream steps={report.chainOfThought} />
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
