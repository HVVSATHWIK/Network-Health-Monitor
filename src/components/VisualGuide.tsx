import { useState, useEffect, type ReactNode } from 'react';
import {
    BookOpen,
    X,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';

/* ------------------------------------------------------------------ */
/*  Inline SVG mini-illustrations for each guide step                 */
/* ------------------------------------------------------------------ */

/** Generic wrapper that renders a small 160×80 SVG illustration */
const MiniSVG = ({ children }: { children: ReactNode }) => (
    <svg viewBox="0 0 160 80" className="w-full h-16 rounded-md bg-slate-800/60 border border-slate-700/50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const WelcomeSVG = () => (
    <MiniSVG>
        {/* Dashboard outline */}
        <rect x="10" y="10" width="140" height="60" rx="6" stroke="#45A29E" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="18" y="18" width="30" height="14" rx="2" fill="#45A29E" opacity="0.3" />
        <rect x="54" y="18" width="30" height="14" rx="2" fill="#66FCF1" opacity="0.2" />
        <rect x="90" y="18" width="30" height="14" rx="2" fill="#45A29E" opacity="0.3" />
        {/* 3D topo miniature */}
        <circle cx="40" cy="52" r="5" fill="#66FCF1" opacity="0.5" />
        <circle cx="80" cy="48" r="5" fill="#66FCF1" opacity="0.5" />
        <circle cx="120" cy="55" r="4" fill="#45A29E" opacity="0.5" />
        <line x1="45" y1="52" x2="75" y2="48" stroke="#45A29E" strokeWidth="1" opacity="0.6" />
        <line x1="85" y1="48" x2="116" y2="55" stroke="#45A29E" strokeWidth="1" opacity="0.6" />
        <text x="80" y="72" textAnchor="middle" fontSize="7" fill="#889299">Network Monitor Dashboard</text>
    </MiniSVG>
);

const TimeRangeSVG = () => (
    <MiniSVG>
        {/* Dropdown selector */}
        <rect x="30" y="12" width="100" height="20" rx="4" fill="#1F2833" stroke="#45A29E" strokeWidth="1" />
        <text x="80" y="26" textAnchor="middle" fontSize="8" fill="#66FCF1">{"Last 1 hour ▾"}</text>
        {/* Timeline bar */}
        <rect x="30" y="40" width="100" height="4" rx="2" fill="#1F2833" />
        <rect x="30" y="40" width="60" height="4" rx="2" fill="#45A29E" opacity="0.8" />
        <circle cx="90" cy="42" r="5" fill="#66FCF1" stroke="#0B0C10" strokeWidth="1.5" />
        {/* Labels */}
        <text x="30" y="58" fontSize="6" fill="#889299">1h ago</text>
        <text x="118" y="58" fontSize="6" fill="#889299">Now</text>
        <text x="80" y="72" textAnchor="middle" fontSize="6" fill="#889299">Filters alerts to your chosen window</text>
    </MiniSVG>
);

const DiagnosticSVG = () => (
    <MiniSVG>
        {/* Button representation */}
        <rect x="25" y="10" width="110" height="24" rx="6" fill="#4F46E5" />
        <text x="80" y="26" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">{"▶ Run Diagnostic Scan"}</text>
        {/* Arrow pointing down to results */}
        <line x1="80" y1="38" x2="80" y2="50" stroke="#66FCF1" strokeWidth="1.5" markerEnd="url(#arrowG)" />
        <defs><marker id="arrowG" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#66FCF1" /></marker></defs>
        {/* Result box */}
        <rect x="30" y="52" width="100" height="18" rx="3" fill="#1F2833" stroke="#45A29E" strokeWidth="0.8" />
        <text x="80" y="64" textAnchor="middle" fontSize="6.5" fill="#C5C6C7">Opens Forensic Results Panel</text>
    </MiniSVG>
);

const ClickDeviceSVG = () => (
    <MiniSVG>
        {/* 3D canvas area */}
        <rect x="5" y="5" width="90" height="70" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        {/* Devices */}
        <circle cx="30" cy="30" r="7" fill="#45A29E" opacity="0.5" />
        <circle cx="60" cy="45" r="7" fill="#66FCF1" stroke="#66FCF1" strokeWidth="2" opacity="0.9" />
        <circle cx="45" cy="60" r="5" fill="#45A29E" opacity="0.4" />
        <line x1="35" y1="33" x2="55" y2="42" stroke="#45A29E" strokeWidth="0.8" opacity="0.6" />
        <line x1="53" y1="48" x2="47" y2="57" stroke="#45A29E" strokeWidth="0.8" opacity="0.6" />
        {/* Cursor clicking */}
        <path d="M64 38 L68 42 L64 44 L66 48 L63 49 L61 45 L58 47 Z" fill="white" opacity="0.9" />
        {/* Arrow to side panel */}
        <line x1="98" y1="40" x2="108" y2="40" stroke="#66FCF1" strokeWidth="1.5" markerEnd="url(#arrowClick)" />
        <defs><marker id="arrowClick" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#66FCF1" /></marker></defs>
        {/* Side panel */}
        <rect x="110" y="5" width="45" height="70" rx="3" fill="#1F2833" stroke="#45A29E" strokeWidth="1" />
        <rect x="114" y="12" width="37" height="6" rx="1" fill="#45A29E" opacity="0.3" />
        <rect x="114" y="22" width="37" height="4" rx="1" fill="#45A29E" opacity="0.2" />
        <rect x="114" y="30" width="37" height="4" rx="1" fill="#45A29E" opacity="0.2" />
        <rect x="114" y="38" width="37" height="4" rx="1" fill="#45A29E" opacity="0.2" />
        <rect x="114" y="46" width="20" height="4" rx="1" fill="#66FCF1" opacity="0.3" />
        <text x="132" y="64" textAnchor="middle" fontSize="5.5" fill="#889299">Device Info</text>
    </MiniSVG>
);

const SidePanelSVG = () => (
    <MiniSVG>
        {/* Main area */}
        <rect x="5" y="5" width="85" height="70" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        <text x="47" y="40" textAnchor="middle" fontSize="7" fill="#889299">Main View</text>
        {/* Detail panel sliding in */}
        <rect x="95" y="5" width="60" height="70" rx="4" fill="#1F2833" stroke="#66FCF1" strokeWidth="1.5" />
        {/* Panel content */}
        <text x="125" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#66FCF1">PLC Node A</text>
        <rect x="100" y="22" width="50" height="1" fill="#45A29E" opacity="0.3" />
        <text x="104" y="32" fontSize="5" fill="#889299">Status:</text>
        <circle cx="134" cy="30" r="3" fill="#F59E0B" />
        <text x="140" y="32" fontSize="5" fill="#F59E0B">Warn</text>
        <text x="104" y="42" fontSize="5" fill="#889299">Temp: 62°C</text>
        <text x="104" y="50" fontSize="5" fill="#889299">Latency: 350ms</text>
        <text x="104" y="58" fontSize="5" fill="#889299">CRC: 150</text>
        {/* X button */}
        <line x1="148" y1="9" x2="152" y2="13" stroke="#889299" strokeWidth="1" />
        <line x1="152" y1="9" x2="148" y2="13" stroke="#889299" strokeWidth="1" />
        <text x="125" y="72" textAnchor="middle" fontSize="5" fill="#45A29E">Click backdrop to close</text>
    </MiniSVG>
);

const AlertsSVG = () => (
    <MiniSVG>
        {/* Alert cards */}
        <rect x="15" y="8" width="130" height="18" rx="3" fill="#7F1D1D" stroke="#EF4444" strokeWidth="0.8" opacity="0.7" />
        <circle cx="25" cy="17" r="4" fill="#EF4444" opacity="0.8" />
        <text x="33" y="15" fontSize="5.5" fill="#FCA5A5">CRITICAL</text>
        <text x="33" y="22" fontSize="5" fill="#C5C6C7">{"BOBCAT Switch — Fiber link down"}</text>
        <rect x="15" y="30" width="130" height="18" rx="3" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
        <circle cx="25" cy="39" r="4" fill="#F59E0B" opacity="0.8" />
        <text x="33" y="37" fontSize="5.5" fill="#FDE68A">MEDIUM</text>
        <text x="33" y="44" fontSize="5" fill="#C5C6C7">{"PLC Node A — High CRC errors"}</text>
        {/* AI analyze button hint */}
        <rect x="40" y="54" width="80" height="14" rx="3" fill="#312E81" stroke="#818CF8" strokeWidth="0.7" />
        <text x="80" y="64" textAnchor="middle" fontSize="6" fill="#A5B4FC">{"🧠 AI Root Cause on each"}</text>
    </MiniSVG>
);

const ForensicSVG = () => (
    <MiniSVG>
        {/* Terminal-like box */}
        <rect x="10" y="8" width="140" height="64" rx="4" fill="#0B0C10" stroke="#45A29E" strokeWidth="1" />
        {/* Title bar */}
        <rect x="10" y="8" width="140" height="12" rx="4" fill="#1F2833" />
        <circle cx="18" cy="14" r="2" fill="#EF4444" opacity="0.6" />
        <circle cx="25" cy="14" r="2" fill="#F59E0B" opacity="0.6" />
        <circle cx="32" cy="14" r="2" fill="#10B981" opacity="0.6" />
        <text x="80" y="16" textAnchor="middle" fontSize="6" fill="#66FCF1">Forensic Cockpit</text>
        {/* Terminal content */}
        <text x="16" y="30" fontSize="5" fill="#45A29E">{"▶ 3 alerts, 2 unhealthy devices"}</text>
        <text x="16" y="39" fontSize="5" fill="#889299">{"▶ Analyzing root cause..."}</text>
        <text x="16" y="48" fontSize="5" fill="#66FCF1">{"▶ L1 fault → L2/L3 propagation"}</text>
        <text x="16" y="57" fontSize="5" fill="#10B981">{"▶ Recommendation: Check fiber"}</text>
        <text x="16" y="66" fontSize="5" fill="#889299">{"▶ Ready for next command"}</text>
    </MiniSVG>
);

const RCASVG = () => (
    <MiniSVG>
        {/* RCA button */}
        <rect x="25" y="6" width="110" height="20" rx="4" fill="#1F2833" stroke="#818CF8" strokeWidth="1" />
        <text x="80" y="20" textAnchor="middle" fontSize="7" fill="#A5B4FC">{"🤖 Root Cause Analysis"}</text>
        {/* Arrow */}
        <line x1="80" y1="30" x2="80" y2="38" stroke="#66FCF1" strokeWidth="1.5" markerEnd="url(#arrowRCA)" />
        <defs><marker id="arrowRCA" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#66FCF1" /></marker></defs>
        {/* AI result */}
        <rect x="15" y="40" width="130" height="32" rx="3" fill="#1F2833" stroke="#45A29E" strokeWidth="0.8" />
        <text x="80" y="50" textAnchor="middle" fontSize="5.5" fill="#66FCF1">AI reads all alerts + device data</text>
        <text x="80" y="58" textAnchor="middle" fontSize="5.5" fill="#C5C6C7">{"→ Finds the real cause"}</text>
        <text x="80" y="66" textAnchor="middle" fontSize="5.5" fill="#10B981">{"→ Suggests what to fix"}</text>
    </MiniSVG>
);

const ThreeControlsSVG = () => (
    <MiniSVG>
        {/* 3D canvas */}
        <rect x="10" y="8" width="140" height="55" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        {/* Mouse icons */}
        <rect x="20" y="16" width="12" height="16" rx="3" fill="#1F2833" stroke="#889299" strokeWidth="0.8" />
        <line x1="26" y1="16" x2="26" y2="24" stroke="#889299" strokeWidth="0.5" />
        <rect x="20" y="16" width="6" height="8" rx="2" fill="#45A29E" opacity="0.3" />
        <text x="38" y="26" fontSize="5.5" fill="#C5C6C7">Left-drag = Rotate</text>
        <rect x="20" y="36" width="12" height="16" rx="3" fill="#1F2833" stroke="#889299" strokeWidth="0.8" />
        <rect x="26" y="36" width="6" height="8" rx="2" fill="#45A29E" opacity="0.3" />
        <text x="38" y="46" fontSize="5.5" fill="#C5C6C7">Right-drag = Pan</text>
        <text x="38" y="58" fontSize="5.5" fill="#C5C6C7">Scroll = Zoom in/out</text>
    </MiniSVG>
);

const HeatmapSVG = () => (
    <MiniSVG>
        {/* Heatmap grid — deterministic colors */}
        {[0, 1, 2, 3, 4].map(row =>
            [0, 1, 2, 3, 4, 5, 6].map(col => {
                const pal = ['#10B981', '#10B981', '#F59E0B', '#10B981', '#EF4444', '#10B981', '#F59E0B'];
                const ops = [0.35, 0.5, 0.45, 0.3, 0.6, 0.4, 0.55];
                return <rect key={`${row}-${col}`} x={15 + col * 19} y={8 + row * 12} width="16" height="10" rx="1.5" fill={pal[col]} opacity={ops[(row + col) % 7]} />;
            })
        )}
        <text x="80" y="74" textAnchor="middle" fontSize="5.5" fill="#889299">Live heatmap from device metrics</text>
    </MiniSVG>
);

const NetMonitAISVG = () => (
    <MiniSVG>
        {/* Chat window */}
        <rect x="20" y="6" width="120" height="68" rx="5" fill="#0B0C10" stroke="#818CF8" strokeWidth="1" />
        {/* Messages */}
        <rect x="28" y="14" width="60" height="12" rx="4" fill="#312E81" />
        <text x="32" y="23" fontSize="5" fill="#C7D2FE">How is the network doing?</text>
        <rect x="60" y="30" width="72" height="18" rx="4" fill="#1F2833" />
        <text x="64" y="39" fontSize="5" fill="#66FCF1">3 alerts active. BOBCAT</text>
        <text x="64" y="46" fontSize="5" fill="#66FCF1">switch has fiber issue...</text>
        {/* Input */}
        <rect x="28" y="54" width="104" height="12" rx="3" fill="#1F2833" stroke="#45A29E" strokeWidth="0.5" />
        <text x="36" y="62" fontSize="5" fill="#889299">Ask anything...</text>
    </MiniSVG>
);

const AssetListSVG = () => (
    <MiniSVG>
        {/* Asset list */}
        <rect x="10" y="6" width="140" height="68" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        <text x="80" y="16" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#C5C6C7">Asset Status</text>
        {/* Rows */}
        <rect x="16" y="22" width="128" height="12" rx="2" fill="#1F2833" />
        <circle cx="24" cy="28" r="3" fill="#10B981" />
        <text x="32" y="30" fontSize="5" fill="#C5C6C7">{"Core Router   — Healthy"}</text>
        <rect x="16" y="37" width="128" height="12" rx="2" fill="#78350F" opacity="0.3" />
        <circle cx="24" cy="43" r="3" fill="#F59E0B" />
        <text x="32" y="45" fontSize="5" fill="#FDE68A">{"PLC Node A    — Warning"}</text>
        <rect x="16" y="52" width="128" height="12" rx="2" fill="#7F1D1D" opacity="0.3" />
        <circle cx="24" cy="58" r="3" fill="#EF4444" />
        <text x="32" y="60" fontSize="5" fill="#FCA5A5">{"BOBCAT Switch — Critical"}</text>
        <text x="80" y="74" textAnchor="middle" fontSize="5" fill="#45A29E">{"Click any row → opens details"}</text>
    </MiniSVG>
);

const LayerMenuSVG = () => (
    <MiniSVG>
        <rect x="15" y="6" width="50" height="68" rx="4" fill="#1F2833" stroke="#45A29E" strokeWidth="1" />
        {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((l, i) => (
            <g key={l}>
                <rect x="20" y={10 + i * 8.5} width="40" height="7" rx="2" fill={i === 0 ? '#45A29E' : '#0B0C10'} opacity={i === 0 ? 0.4 : 0.8} stroke="#45A29E" strokeWidth="0.5" />
                <text x="40" y={15.5 + i * 8.5} textAnchor="middle" fontSize="5" fill={i === 0 ? '#66FCF1' : '#889299'}>{l}</text>
            </g>
        ))}
        {/* Arrow to detail */}
        <line x1="70" y1="40" x2="82" y2="40" stroke="#66FCF1" strokeWidth="1.2" markerEnd="url(#arrowLM)" />
        <defs><marker id="arrowLM" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#66FCF1" /></marker></defs>
        <rect x="85" y="14" width="65" height="50" rx="3" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        <text x="117" y="27" textAnchor="middle" fontSize="6" fill="#66FCF1">{"L1 — Physical"}</text>
        <text x="117" y="38" textAnchor="middle" fontSize="5" fill="#889299">Devices affected</text>
        <text x="117" y="47" textAnchor="middle" fontSize="5" fill="#889299">KPIs for this layer</text>
        <text x="117" y="56" textAnchor="middle" fontSize="5" fill="#889299">Drill into each</text>
    </MiniSVG>
);

const AnalyticsSVG = () => (
    <MiniSVG>
        {/* Chart */}
        <rect x="10" y="10" width="140" height="55" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        {/* Line chart */}
        <polyline points="20,50 40,35 60,42 80,28 100,38 120,22 140,30" stroke="#66FCF1" strokeWidth="1.5" fill="none" />
        <polyline points="20,55 40,48 60,50 80,44 100,46 120,40 140,42" stroke="#818CF8" strokeWidth="1.5" fill="none" />
        {/* Labels */}
        <text x="30" y="18" fontSize="5" fill="#66FCF1">{"━ Latency"}</text>
        <text x="80" y="18" fontSize="5" fill="#818CF8">{"━ Errors"}</text>
        <text x="80" y="74" textAnchor="middle" fontSize="5.5" fill="#889299">{"Historical trends & correlations"}</text>
    </MiniSVG>
);

const PerformanceStatsSVG = () => (
    <MiniSVG>
        <rect x="8" y="8" width="144" height="64" rx="4" fill="#0B0C10" stroke="#1F2833" strokeWidth="1" />
        <rect x="14" y="14" width="64" height="52" rx="3" fill="#1F2937" stroke="#334155" strokeWidth="0.8" />
        <text x="46" y="22" textAnchor="middle" fontSize="5.5" fill="#94A3B8">System Logs</text>
        <rect x="18" y="27" width="56" height="4" rx="1" fill="#334155" />
        <rect x="18" y="34" width="49" height="4" rx="1" fill="#334155" />
        <rect x="18" y="41" width="52" height="4" rx="1" fill="#334155" />
        <rect x="18" y="48" width="44" height="4" rx="1" fill="#334155" />

        <rect x="84" y="14" width="62" height="52" rx="3" fill="#111827" stroke="#4F46E5" strokeWidth="0.8" />
        <text x="115" y="22" textAnchor="middle" fontSize="5.5" fill="#C7D2FE">Performance Stats</text>
        <rect x="88" y="27" width="54" height="6" rx="1.5" fill="#312E81" opacity="0.55" />
        <rect x="88" y="36" width="26" height="6" rx="1.5" fill="#334155" />
        <rect x="116" y="36" width="26" height="6" rx="1.5" fill="#334155" />
        <rect x="88" y="45" width="54" height="6" rx="1.5" fill="#334155" />
        <text x="115" y="60" textAnchor="middle" fontSize="5" fill="#94A3B8">Baseline + Export JSON</text>
    </MiniSVG>
);

const HealthBadgeSVG = () => (
    <MiniSVG>
        {/* Health badge */}
        <rect x="35" y="10" width="90" height="30" rx="6" fill="#1F2833" stroke="#45A29E" strokeWidth="1" />
        <text x="56" y="22" fontSize="5" fill="#889299">{"🛡 Health"}</text>
        <text x="56" y="34" fontSize="12" fontWeight="bold" fill="#10B981">80%</text>
        <text x="100" y="28" fontSize="7" fill="#F59E0B">{"⚠"}</text>
        {/* Explanation */}
        <text x="80" y="52" textAnchor="middle" fontSize="5.5" fill="#10B981">{"Green = 90%+ healthy devices"}</text>
        <text x="80" y="60" textAnchor="middle" fontSize="5.5" fill="#F59E0B">{"Yellow = 70-90% healthy"}</text>
        <text x="80" y="68" textAnchor="middle" fontSize="5.5" fill="#EF4444">{"Red = below 70% healthy"}</text>
    </MiniSVG>
);

const FaultInjectionSVG = () => (
    <MiniSVG>
        {/* Gear icon */}
        <circle cx="30" cy="20" r="10" fill="#1F2833" stroke="#889299" strokeWidth="1" />
        <text x="30" y="24" textAnchor="middle" fontSize="12">{"⚙"}</text>
        {/* Arrow */}
        <line x1="44" y1="20" x2="56" y2="20" stroke="#66FCF1" strokeWidth="1" markerEnd="url(#arrowFI)" />
        <defs><marker id="arrowFI" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#66FCF1" /></marker></defs>
        {/* Fault options */}
        <rect x="58" y="6" width="90" height="18" rx="3" fill="#7F1D1D" stroke="#EF4444" strokeWidth="0.8" opacity="0.6" />
        <text x="103" y="18" textAnchor="middle" fontSize="6" fill="#FCA5A5">{"⚡ Simulate Cable Cut"}</text>
        <rect x="58" y="28" width="90" height="18" rx="3" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" opacity="0.6" />
        <text x="103" y="40" textAnchor="middle" fontSize="6" fill="#FDE68A">{"⚡ Simulate Slow App"}</text>
        <text x="80" y="60" textAnchor="middle" fontSize="5" fill="#889299">See how faults spread across</text>
        <text x="80" y="68" textAnchor="middle" fontSize="5" fill="#889299">the whole network in real-time</text>
    </MiniSVG>
);

const DoneSVG = () => (
    <MiniSVG>
        <circle cx="80" cy="32" r="18" fill="#065F46" stroke="#10B981" strokeWidth="1.5" />
        <polyline points="70,32 77,39 92,25" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="80" y="64" textAnchor="middle" fontSize="7" fill="#10B981">{"You're all set!"}</text>
    </MiniSVG>
);


/* ------------------------------------------------------------------ */
/*  Guide step definitions                                            */
/* ------------------------------------------------------------------ */

interface GuideStep {
    id: string;
    title: string;
    description: string;
    targetId: string | null;
    illustration: ReactNode;
    ensureView?: '3d' | 'analytics' | 'kpi' | 'logs';
}

export default function VisualGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps: GuideStep[] = [
        {
            id: 'welcome',
            title: 'Welcome to NetMonit',
            description: 'This is your network monitoring dashboard. It watches all your devices (routers, switches, sensors, PLCs) in real-time and warns you when something goes wrong. Let\'s walk through the key features.',
            targetId: null,
            illustration: <WelcomeSVG />
        },
        {
            id: 'timeRange',
            title: 'Pick a Time Window',
            description: 'This dropdown controls what time period you\'re looking at. For example, "Last 1 hour" only shows alerts and data from the past hour. Change it to see older or newer events.',
            targetId: 'time-range-trigger',
            illustration: <TimeRangeSVG />
        },
        {
            id: 'simulation',
            title: 'Run a Diagnostic Scan',
            description: 'This is the main action button. Click it to scan all your devices and connections. It will find problems and automatically open the Forensic Cockpit with the results. Start here when something feels off.',
            targetId: 'diagnostic-scan-trigger',
            illustration: <DiagnosticSVG />
        },
        {
            id: 'clickDevice',
            title: 'Click Any Device for Full Details',
            description: 'In the 3D map or the Asset Status list below it, click on any device (sensor, switch, PLC, router). A detail panel slides in from the right showing all its health data: temperature, latency, error counts, connected devices, and more.',
            targetId: 'canvas-container',
            illustration: <ClickDeviceSVG />,
            ensureView: '3d'
        },
        {
            id: 'sidePanel',
            title: 'The Side Panel — Device Deep Dive',
            description: 'When you click a device, this panel slides open on the right. It shows the device name, status (Healthy / Warning / Critical), live metrics like temperature and latency, plus its upstream and downstream connections. Click the dark area behind it to close.',
            targetId: 'asset-detail-panel',
            illustration: <SidePanelSVG />,
            ensureView: '3d'
        },
        {
            id: 'assetList',
            title: 'Asset Status List',
            description: 'This list shows every device with a color-coded status dot: 🟢 Healthy, 🟡 Warning, 🔴 Critical. Click any row to open the detail panel for that device. It\'s the quickest way to jump to a problem device.',
            targetId: 'asset-status-panel',
            illustration: <AssetListSVG />,
            ensureView: '3d'
        },
        {
            id: '3dControls',
            title: '3D Map Controls',
            description: 'In the 3D view: Left-click and drag to rotate the view, right-click and drag to move around, and use your scroll wheel to zoom in or out. Hit the "Reset View" button if you get lost.',
            targetId: 'canvas-container',
            illustration: <ThreeControlsSVG />,
            ensureView: '3d'
        },
        {
            id: 'alerts',
            title: 'Active Alerts Panel',
            description: 'Every problem the system detects becomes an alert here, sorted by severity (Critical → High → Medium → Low). Each alert card has an "AI Root Cause" button that uses AI to explain what caused it and what to do about it.',
            targetId: 'alerts-panel',
            illustration: <AlertsSVG />
        },
        {
            id: 'heatmap',
            title: 'Network Health Heatmap',
            description: 'This color grid shows the health of different metrics across all network layers. Green = good, Yellow = watch out, Red = problem. The values come directly from your actual device data and update live.',
            targetId: 'heatmap-panel',
            illustration: <HeatmapSVG />
        },
        {
            id: 'forensic',
            title: 'Forensic Cockpit',
            description: 'A deep investigation tool. It opens showing your current system health, then you can ask it specific questions like "Analyze the cable fault" or "What is causing high latency?". It traces the full chain from cause to effect using AI.',
            targetId: 'forensic-cockpit-trigger',
            illustration: <ForensicSVG />
        },
        {
            id: 'rca',
            title: 'Root Cause Analysis',
            description: 'One click and the AI reads ALL your active alerts and device data, then tells you: what broke, why it broke, what else it affected, and how to fix it. This is the fastest way to understand a network issue without reading each alert individually.',
            targetId: 'root-cause-analysis-trigger',
            illustration: <RCASVG />
        },
        {
            id: 'netmonitAI',
            title: 'NetMonit AI Chat',
            description: 'Your conversational AI assistant. Ask questions like "What is CRC?", "Why is the network slow?", or "List all critical devices". It sees the same live data as every other part of the dashboard, so answers are always current.',
            targetId: 'netmonit-ai-trigger',
            illustration: <NetMonitAISVG />
        },
        {
            id: 'healthBadge',
            title: 'Health Score Badge',
            description: 'Shows the percentage of healthy devices right now. The color tells you the overall situation at a glance: Green (90%+ healthy), Yellow (70-90%), Red (below 70%). The shield icon also changes color when any device goes critical.',
            targetId: 'network-health-badge',
            illustration: <HealthBadgeSVG />
        },
        {
            id: 'layerMenu',
            title: 'Layer Menu (☰)',
            description: 'Opens a menu for each network layer. L1 = Physical cables & ports, L2 = Switches & MACs, L3 = Routing & IPs, L4 = TCP connections, L5 = Sessions, L6 = Encryption, L7 = Applications. Pick one to see only devices and metrics for that layer.',
            targetId: 'layer-menu-trigger',
            illustration: <LayerMenuSVG />
        },
        {
            id: 'analytics',
            title: 'Analytics View',
            description: 'Switch to this tab for historical charts and trends. See how latency, errors, and other metrics changed over time. Great for spotting repeating patterns or proving that a fix actually worked.',
            targetId: 'view-analytics-trigger',
            illustration: <AnalyticsSVG />
        },
        {
            id: 'performanceStats',
            title: 'System Logs + Performance Stats',
            description: 'Open System Logs to see event history and live performance metrics side by side. The Performance Stats panel tracks startup timing, AI latency, telemetry and import throughput, action timings, and memory usage. Use Set Baseline to save a benchmark and Export to download a JSON report.',
            targetId: 'perf-stats-panel',
            illustration: <PerformanceStatsSVG />,
            ensureView: 'logs'
        },
        {
            id: 'faultInjection',
            title: 'Test with Simulated Faults',
            description: 'In the 3D view, click the gear (⚙) icon to inject a fake fault — like a cable cut or a slow application. Watch how alerts fire, health scores drop, the heatmap turns red, and the AI reacts. Great for learning how the system works.',
            targetId: 'chaos-control-trigger-3d',
            illustration: <FaultInjectionSVG />,
            ensureView: '3d'
        },
        {
            id: 'done',
            title: 'You\'re Ready!',
            description: 'You now know the essentials. Remember: click any device to see its details, and use "Run Diagnostic Scan" whenever you want a quick health check. You can reopen this guide anytime with the book icon.',
            targetId: null,
            illustration: <DoneSVG />
        }
    ];

    const currentStep = steps[currentStepIndex];

    // Update target position
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (currentStep.ensureView) {
                const targetExists = currentStep.targetId ? document.getElementById(currentStep.targetId) : true;
                if (!targetExists) {
                    const triggerId = (() => {
                        switch (currentStep.ensureView) {
                            case '3d': return 'view-3d-trigger';
                            case 'analytics': return 'view-analytics-trigger';
                            case 'kpi': return 'view-kpi-trigger';
                            case 'logs': return 'view-logs-trigger';
                            default: return 'view-3d-trigger';
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

        updatePosition();
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

    const renderOverlay = () => {
        if (!isOpen) return null;

        return createPortal(
            <div className="fixed inset-0 z-[100] pointer-events-none">
                {/* Dim background */}
                <div className="absolute inset-0 bg-slate-950/60 transition-opacity duration-500" />

                {/* Spotlight box on the target element */}
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
                        top: targetRect ? Math.min(window.innerHeight - 340, Math.max(20, targetRect.bottom + 20)) : '50%',
                        left: targetRect ? Math.min(window.innerWidth - 370, Math.max(20, targetRect.left + (targetRect.width / 2) - 170)) : '50%',
                        transform: targetRect ? 'none' : 'translate(-50%, -50%)'
                    }}
                >
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[340px] max-w-[calc(100vw-2.5rem)] backdrop-blur-xl flex flex-col overflow-hidden">
                        {/* Illustration area */}
                        <div className="p-3 pb-0">
                            {currentStep.illustration}
                        </div>

                        {/* Text content */}
                        <div className="p-4 pt-3">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-base font-bold text-white leading-tight pr-4">{currentStep.title}</h3>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white flex-shrink-0 mt-0.5">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-slate-300 text-[13px] leading-relaxed">{currentStep.description}</p>
                        </div>

                        {/* Navigation footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
                            <div className="text-xs text-slate-500 font-mono">
                                {currentStepIndex + 1} / {steps.length}
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
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                                >
                                    {currentStepIndex === steps.length - 1 ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Done
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
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
