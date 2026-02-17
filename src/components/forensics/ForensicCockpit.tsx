import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ShieldAlert, Terminal, Activity, Play } from 'lucide-react';
import { analyzeWithMultiAgents, ForensicReport } from '../../utils/aiLogic';
import { Alert, Device } from '../../types/network';
import OTDRTrace from './visualizations/OTDRTrace';
import LatencyHistogram from './visualizations/LatencyHistogram';
import InvestigationStream from './InvestigationStream';

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

    const handleScan = useCallback(async (prompt: string) => {
        if (isAnalyzing) return;
        setQuery(prompt);
        setIsAnalyzing(true);
        setReport(null); // Clear previous

        try {
            const result = await analyzeWithMultiAgents(prompt, null, alerts, devices, () => { });

            if (typeof result === 'string') {
                // Handle chat response (not forensic)
                // For now, we ignore purely chat responses in this view or show a toast
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
            console.error(e);
            setIsAnalyzing(false);
        }
    }, [alerts, devices, isAnalyzing]);

    // Auto-trigger analysis if system message implies it
    useEffect(() => {
        if (systemMessage && isOpen) {
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
                className="fixed bottom-6 right-6 bg-[#0B0C10] border border-[#66FCF1] text-[#66FCF1] px-6 py-3 rounded-none shadow-[0_0_15px_rgba(102,252,241,0.3)] hover:bg-[#1F2833] transition-all flex items-center gap-3 font-mono text-xs uppercase tracking-widest z-50 group hover:scale-105"
            >
                <Terminal className="w-4 h-4 group-hover:animate-pulse" />
                <span>Forensic Cockpit</span>
                <span className="bg-[#66FCF1] text-black px-1.5 py-0.5 text-[9px] font-bold rounded-sm">LIVE</span>
            </button>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 bg-[#0B0C10]/90 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 sm:p-8 font-sans overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-6xl h-[85dvh] bg-[#0B0C10] border border-[#1F2833] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* HEADER */}
                <div className="h-14 border-b border-[#1F2833] flex items-center justify-between px-6 bg-[#1F2833]/30">
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-[#66FCF1]" />
                        <h2 className="text-[#C5C6C7] font-mono uppercase tracking-widest text-sm font-bold">
                            NetMonit <span className="text-[#66FCF1]">Forensic Console</span> v2.4
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[#889299] text-xs font-mono">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            CONNECTED: {userName.toUpperCase()}
                        </div>
                        <button onClick={() => onOpenChange(false)} className="text-[#889299] hover:text-[#FF2E2E] transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* BODY GRID */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

                    {/* LEFT PANEL: INPUT & CONTEXT (4 cols) */}
                    <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1F2833] flex flex-col bg-[#0B0C10] min-h-0">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-[#1F2833]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="INITIATE DIAGNOSTIC SEQUENCE..."
                                    className="w-full bg-[#1F2833] border border-[#1F2833] focus:border-[#66FCF1] text-[#C5C6C7] font-mono text-xs p-3 pl-10 outline-none uppercase tracking-wide placeholder:text-[#889299]"
                                    autoFocus
                                />
                                <Search className="w-4 h-4 text-[#66FCF1] absolute left-3 top-3.5" />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleScan("Analyze Cable Failure")} className="flex-1 bg-[#1F2833] hover:bg-[#66FCF1]/10 border border-[#1F2833] text-[#889299] text-[10px] py-2 uppercase tracking-wider transition-all text-left px-3">
                                    Sim: Cable Cut
                                </button>
                                <button onClick={() => handleScan("Analyze Latency Spike")} className="flex-1 bg-[#1F2833] hover:bg-[#66FCF1]/10 border border-[#1F2833] text-[#889299] text-[10px] py-2 uppercase tracking-wider transition-all text-left px-3">
                                    Sim: L7 Lag
                                </button>
                            </div>
                        </div>

                        {/* Recent Alerts List (Static Context) */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            <h3 className="text-[#889299] text-[10px] font-bold uppercase tracking-widest mb-4">Active Telemetry Triggers</h3>
                            <div className="space-y-3">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="border-l-2 border-[#FF2E2E] bg-[#FF2E2E]/5 pl-3 py-2">
                                        <div className="flex justify-between items-start text-[#FF2E2E] text-xs font-bold mb-1 font-mono">
                                            <span>{alert.layer} ALERT</span>
                                            <span>{alert.severity.toUpperCase()}</span>
                                        </div>
                                        <div className="text-[#C5C6C7] text-xs leading-tight mb-1">{alert.message}</div>
                                        <div className="text-[#889299] text-[10px] font-mono">{alert.device}</div>
                                    </div>
                                ))}
                                {alerts.length === 0 && <div className="text-[#45A29E] text-xs font-mono italic opacity-50">NO ACTIVE ALERTS</div>}
                            </div>
                        </div>
                    </div>

                    {/* CENTER PANEL: VISUALIZATION (5 cols) */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#1F2833] bg-[#0B0C10] p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#1F2833] min-h-0">
                        {report && (
                            <>
                                {/* Executive Summary Card */}
                                <div className={`border-l-4 p-4 ${report.criticality === 'extreme' ? 'bg-[#FF2E2E]/10 border-[#FF2E2E]' : 'bg-[#45A29E]/10 border-[#45A29E]'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldAlert className={`w-5 h-5 ${report.criticality === 'extreme' ? 'text-[#FF2E2E]' : 'text-[#45A29E]'}`} />
                                        <h3 className="text-[#C5C6C7] font-bold text-sm tracking-wide uppercase">Executive Summary</h3>
                                    </div>
                                    <p className="text-[#C5C6C7] text-xs leading-relaxed font-mono">
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
                                                <div className="font-mono text-[10px] bg-[#0B0C10] border border-[#1F2833] p-4 text-[#C5C6C7]">
                                                    <pre>{JSON.stringify(artifact.data, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Recommendations */}
                                {report.recommendations.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-[#66FCF1] text-xs font-bold uppercase tracking-widest mb-3">Remediation Protocol</h4>
                                        <ul className="space-y-2">
                                            {report.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs text-[#C5C6C7] font-mono p-2 border border-[#1F2833] bg-[#1F2833]/30">
                                                    <Play className="w-3 h-3 text-[#66FCF1]" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                        {!report && !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-[#1F2833]">
                                <Activity className="w-16 h-16 mb-4 opacity-20" />
                                <div className="text-xs font-mono uppercase tracking-widest">Awaiting Diagnostic Input</div>
                            </div>
                        )}
                        {isAnalyzing && !report && (
                            <div className="h-full flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-2 border-[#1F2833] border-t-[#66FCF1] rounded-full animate-spin mb-4"></div>
                                <div className="text-[#66FCF1] text-xs font-mono uppercase tracking-widest animate-pulse">Initializing Neural Agents...</div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: INVESTIGATION STREAM (3 cols) */}
                    <div className="lg:col-span-3 bg-[#08090C] p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1F2833] min-h-0">
                        <h3 className="text-[#889299] text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
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
