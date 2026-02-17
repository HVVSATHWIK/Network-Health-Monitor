import { useState, useEffect } from 'react';
import {
    BookOpen,
    X,
    ChevronRight,
    ChevronLeft,
    MousePointer2,
    Activity,
    Play,
    Search,
    Zap,
    BarChart3,
    Terminal,
    CheckCircle,
    Info
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface GuideStep {
    id: string;
    title: string;
    description: string;
    targetId: string | null;
    icon: React.ReactNode;
    ensureView?: '3d' | 'analytics' | 'kpi' | 'logs';
}

export default function VisualGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps: GuideStep[] = [
        {
            id: 'welcome',
            title: 'Welcome',
            description: 'This dashboard monitors network health across OSI Layers L1-L7 with shared AI context across views. Click "Next" to see key controls.',
            targetId: null,
            icon: <Info className="w-6 h-6 text-blue-400" />
        },
        {
            id: 'timeRange',
            title: 'Time Range',
            description: 'Use this to filter alerts and health context to a recent window (or choose a custom absolute range).',
            targetId: 'time-range-trigger',
            icon: <Activity className="w-6 h-6 text-slate-200" />
        },
        {
            id: 'import',
            title: 'Import Telemetry',
            description: 'Import a JSON telemetry batch to update device metrics via the ingestion pipeline (Device ID/IP/MAC supported).',
            targetId: 'data-import-trigger',
            icon: <Search className="w-6 h-6 text-slate-200" />
        },
        {
            id: 'controls',
            title: '3D Controls',
            description: 'Use your mouse to interact with the 3D map. Left-click to rotate, Right-click to pan, and Scroll to zoom.',
            targetId: 'canvas-container',
            icon: <MousePointer2 className="w-6 h-6 text-purple-400" />,
            ensureView: '3d'
        },
        {
            id: 'simulation',
            title: 'Run Diagnostic',
            description: 'Start here. Click this to run a full diagnostic scan across L1–L7 and open forensic results.',
            targetId: 'diagnostic-scan-trigger',
            icon: <Play className="w-6 h-6 text-green-400" />
        },
        {
            id: 'layerMenu',
            title: 'Layer Menu',
            description: 'Open the OSI Layer menu to jump into a layer-focused view (L1–L7) and drill down to affected assets.',
            targetId: 'layer-menu-trigger',
            icon: <Zap className="w-6 h-6 text-purple-300" />
        },
        {
            id: 'health',
            title: 'Network Health',
            description: 'Monitor the overall system health score here. It updates in real-time based on active alerts.',
            targetId: 'network-health-badge',
            icon: <Activity className="w-6 h-6 text-red-400" />
        },
        {
            id: 'aiCoverage',
            title: 'AI Coverage',
            description: 'This badge confirms AI monitoring scope (layers and assets). It reflects the same live dataset used by topology, alerts, and KPI views.',
            targetId: 'ai-monitor-badge',
            icon: <Zap className="w-6 h-6 text-indigo-300" />
        },
        {
            id: 'aiQuota',
            title: 'AI Quota Guardrails',
            description: 'Track AI request budget here. Limits are enforced at 15 requests/minute and 1000 requests/day to keep monitoring stable.',
            targetId: 'ai-quota-badge',
            icon: <Activity className="w-6 h-6 text-amber-300" />
        },
        {
            id: 'select',
            title: 'Select an Asset',
            description: 'Click a device in the 3D topology (or the Asset Status list). Selection will drive the Data Flow focus and investigations.',
            targetId: 'canvas-container',
            icon: <MousePointer2 className="w-6 h-6 text-purple-300" />,
            ensureView: '3d'
        },
        {
            id: 'assetDetail',
            title: 'Asset Detail Panel (Hidden)',
            description: 'After you select an asset, a slide-in detail panel opens on the right with deep metrics and actions. Click the dark backdrop to close it.',
            targetId: 'asset-detail-panel',
            icon: <ChevronRight className="w-6 h-6 text-blue-300" />,
            ensureView: '3d'
        },
        {
            id: 'assets',
            title: 'Asset Status',
            description: 'Use this list to find critical/warning assets quickly and open the Asset Detail panel for actions and context.',
            targetId: 'asset-status-panel',
            icon: <Activity className="w-6 h-6 text-emerald-400" />,
            ensureView: '3d'
        },
        {
            id: 'flow',
            title: 'Real-Time Data Flow',
            description: 'This panel visualizes packet flow across tiers. Selecting an asset focuses the flow to make the connection obvious.',
            targetId: 'data-flow-viz',
            icon: <Activity className="w-6 h-6 text-emerald-400" />,
            ensureView: '3d'
        },
        {
            id: 'flowPanZoom',
            title: 'Pan + Zoom (Hidden)',
            description: 'Inside the Data Flow canvas: drag to pan, use mouse-wheel/trackpad to zoom, and use Reset View if you lose the frame.',
            targetId: 'data-flow-pan-zoom',
            icon: <MousePointer2 className="w-6 h-6 text-slate-200" />,
            ensureView: '3d'
        },
        {
            id: 'kpi',
            title: 'KPI Matrix',
            description: 'Open the KPI Matrix to see a detailed breakdown of metrics across Layers 1 through 7.',
            targetId: 'kpi-matrix-trigger',
            icon: <BarChart3 className="w-6 h-6 text-yellow-400" />
        },
        {
            id: 'kpiView',
            title: 'KPI Intelligence',
            description: 'Switch to KPI Intelligence for real-time KPI monitoring and deeper layer-aware metrics.',
            targetId: 'view-kpi-trigger',
            icon: <BarChart3 className="w-6 h-6 text-orange-400" />
        },
        {
            id: 'logsView',
            title: 'System Logs',
            description: 'Switch to System Logs to view smart log streams and quickly search for error patterns.',
            targetId: 'view-logs-trigger',
            icon: <Terminal className="w-6 h-6 text-slate-200" />
        },
        {
            id: 'aiTimelineLogs',
            title: 'AI Monitoring Timeline',
            description: 'In System Logs, this timeline shows each automated AI enrichment action with status, layer, and device scope.',
            targetId: 'ai-monitoring-timeline',
            icon: <Activity className="w-6 h-6 text-indigo-300" />,
            ensureView: 'logs'
        },
        {
            id: 'forensics',
            title: 'Forensic Cockpit',
            description: 'Open the Forensic Cockpit to analyze alert streams. Hidden power tools: press Ctrl/Cmd+K for the command palette, and use regex filtering in the terminal view (e.g. error|refused|fail).',
            targetId: 'forensic-cockpit-trigger',
            icon: <Search className="w-6 h-6 text-blue-400" />
        },
        {
            id: 'assistant',
            title: 'NetMonitAI Assistant',
            description: 'Use NetMonit AI for conversational help and summaries. It shares the same network telemetry model as the forensic and KPI workflows.',
            targetId: 'netmonit-ai-trigger',
            icon: <Zap className="w-6 h-6 text-indigo-300" />
        },
        {
            id: 'chaos',
            title: 'Fault Injection',
            description: 'Use the gear in 3D Topology to inject demo faults (L1 cable cut / L7 latency) and see correlated impact.',
            targetId: 'chaos-control-trigger-3d',
            icon: <Zap className="w-6 h-6 text-orange-400" />,
            ensureView: '3d'
        },
        {
            id: 'analytics',
            title: 'Advanced Analytics',
            description: 'Switch to the Analytics view for historical trends and ROI analysis.',
            targetId: 'view-analytics-trigger',
            icon: <BarChart3 className="w-6 h-6 text-indigo-400" />,
            ensureView: 'analytics'
        },
        {
            id: 'ready',
            title: 'You are Ready',
            description: 'Explore the dashboard freely. You can restart this guide anytime by clicking the "Guide" button.',
            targetId: null,
            icon: <CheckCircle className="w-6 h-6 text-emerald-400" />
        }
    ];

    const currentStep = steps[currentStepIndex];

    // Update target position
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            // If this step lives in a specific view and the target isn't mounted yet,
            // attempt to switch views using the tab buttons.
            if (currentStep.ensureView) {
                const targetExists = currentStep.targetId ? document.getElementById(currentStep.targetId) : true;
                if (!targetExists) {
                    const triggerId = (() => {
                        switch (currentStep.ensureView) {
                            case '3d':
                                return 'view-3d-trigger';
                            case 'analytics':
                                return 'view-analytics-trigger';
                            case 'kpi':
                                return 'view-kpi-trigger';
                            case 'logs':
                                return 'view-logs-trigger';
                            default:
                                return 'view-3d-trigger';
                        }
                    })();
                    document.getElementById(triggerId)?.click();
                }
            }

            if (currentStep.targetId) {
                const el = document.getElementById(currentStep.targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setTargetRect(rect);
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    setTargetRect(null);
                }
            } else {
                setTargetRect(null);
            }
        };

        // Initial update
        updatePosition();

        // Wait a bit for layout shifts (e.g. if something is expanding)
        const timeout = setTimeout(updatePosition, 300);

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStepIndex, isOpen, currentStep.targetId, currentStep.ensureView]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            setIsOpen(false);
            setCurrentStepIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    // Render Portal for the Guide Overlay
    const renderOverlay = () => {
        if (!isOpen) return null;

        return createPortal(
            <div className="fixed inset-0 z-[100] pointer-events-none">
                {/* Dimmed Background - Optional, keeping it subtle or removing per user request "no cinematic shit". 
                    Let's keep it very clear transparency or just no background, just the spotlight.
                    User said "visually give step by step instruction... logos in it".
                    Let's use a semi-transparent dark overlay to make the focused area pop, but NOT hard letterbox.
                */}
                <div className="absolute inset-0 bg-slate-950/60 transition-opacity duration-500" />

                {/* Highlight/Spotlight Box */}
                {targetRect && (
                    <div
                        className="absolute transition-all duration-300 ease-out border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] rounded-lg animate-pulse"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                    />
                )}

                {/* Instruction Card */}
                <div
                    className="absolute pointer-events-auto transition-all duration-300"
                    style={{
                        // Position logic: Center if no target, or next to target
                        top: targetRect ? Math.min(window.innerHeight - 250, Math.max(20, targetRect.bottom + 20)) : '50%',
                        left: targetRect ? Math.min(window.innerWidth - 350, Math.max(20, targetRect.left + (targetRect.width / 2) - 160)) : '50%',
                        transform: targetRect ? 'none' : 'translate(-50%, -50%)'
                    }}
                >
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl w-72 max-w-[calc(100vw-2.5rem)] backdrop-blur-xl flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                                {currentStep.icon}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 ml-1">{currentStep.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{currentStep.description}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800">
                            <div className="text-xs text-slate-500 font-mono">
                                STEP {currentStepIndex + 1}/{steps.length}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentStepIndex === 0}
                                    className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-300" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                                >
                                    {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                                    {currentStepIndex < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 p-3 rounded-full shadow-lg transition-all active:scale-95 group"
                title="Start Visual Guide"
            >
                <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            {renderOverlay()}
        </>
    );
}
