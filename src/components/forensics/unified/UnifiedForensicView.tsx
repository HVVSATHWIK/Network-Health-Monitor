import React, { useState, useEffect } from 'react';
import { Search, Shield, Wifi, Terminal } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { AlertBubble } from './AlertBubble';
import { ForensicCard } from './ForensicCard';
import { Alert, Device } from '../../../types/network';

interface UnifiedViewProps {
    alerts: Alert[];
    devices: Device[];
    userName?: string;
    onClose?: () => void;
}

export const UnifiedForensicView: React.FC<UnifiedViewProps> = ({ alerts, devices, userName = "Admin", onClose }) => {
    // State for the expanded investigation view
    const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);

    // State for the Command Palette visibility
    const [isCmdOpen, setCmdOpen] = useState(false);

    // Keyboard shortcut listener for Cmd+K (Global Command Palette)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCmdOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <div className="flex h-[100dvh] w-full flex-col bg-gunmetal-950 text-gunmetal-100 font-sans selection:bg-alert-info selection:text-white fixed inset-0 z-50 overflow-x-hidden">

            {/* 
        SECTION 1: Top Search/Command Bar 
        Acts as the primary navigation and command dispatch center.
      */}
            <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal-700 bg-gunmetal-900/95 backdrop-blur px-4 sm:px-6 py-3 sm:h-16 shadow-lg shadow-gunmetal-950/50">

                {/* Branding & Status */}
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gunmetal-800 ring-1 ring-white/10 shadow-inner">
                        {/* Logo Icon */}
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-6 h-6 rounded flex items-center justify-center">
                            <Terminal className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none font-mono uppercase">Forensic Cockpit</h1>
                        <span className="text-xs font-medium text-alert-success flex items-center gap-1 mt-1 font-mono">
                            <div className="h-1.5 w-1.5 rounded-full bg-alert-success animate-pulse" />
                            System Operational
                        </span>
                    </div>
                </div>

                {/* Command Trigger (Visual only) */}
                <button
                    onClick={() => setCmdOpen(true)}
                    className="group order-last sm:order-none flex w-full sm:w-auto sm:flex-1 max-w-none sm:max-w-xl items-center justify-between rounded-lg border border-gunmetal-700 bg-gunmetal-950/50 px-4 py-2.5 text-sm text-gunmetal-400 transition-all hover:border-gunmetal-500 hover:bg-gunmetal-900 hover:shadow-md hover:shadow-alert-info/5 focus:outline-none focus:ring-2 focus:ring-alert-info/50"
                >
                    <span className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-gunmetal-500 group-hover:text-gunmetal-300" />
                        <span className="group-hover:text-gunmetal-200">Search devices, execute commands...</span>
                    </span>
                    <div className="flex items-center gap-1">
                        <kbd className="hidden rounded bg-gunmetal-800 px-2 py-0.5 text-[10px] font-bold text-gunmetal-400 sm:inline-block border border-gunmetal-700">⌘</kbd>
                        <kbd className="hidden rounded bg-gunmetal-800 px-2 py-0.5 text-[10px] font-bold text-gunmetal-400 sm:inline-block border border-gunmetal-700">K</kbd>
                    </div>
                </button>

                {/* User & Notification Area */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-gunmetal-800 px-3 py-1.5 border border-gunmetal-700">
                        <Wifi className="h-3.5 w-3.5 text-alert-success" />
                        <span className="text-xs font-mono text-gunmetal-300">12ms</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-gunmetal-800 hover:bg-gunmetal-700 text-gunmetal-300 px-3 py-1.5 rounded text-xs font-bold border border-gunmetal-700 transition"
                    >
                        EXIT
                    </button>

                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gunmetal-600 to-gunmetal-800 ring-2 ring-gunmetal-700 flex items-center justify-center text-xs font-bold text-white">
                        {userName.charAt(0)}
                    </div>
                </div>
            </header>

            {/* 
        SECTION 2: Main Forensic Stream 
        The scrollable area containing the timeline of alerts and investigations.
      */}
            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gunmetal-700 scrollbar-track-transparent">
                <div className="mx-auto max-w-6xl space-y-6 pb-20">

                    {/* Stream Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gunmetal-800">
                        <h2 className="text-sm font-semibold text-gunmetal-400 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-alert-info animate-pulse"></div>
                            Live Event Stream
                        </h2>
                        <span className="text-xs font-mono text-gunmetal-500">Sync: {new Date().toLocaleTimeString()}</span>
                    </div>

                    {/* Iterative Rendering of the Alert Stream */}
                    {alerts.map((alert) => (
                        <div key={alert.id} className="transition-all duration-500 ease-in-out">

                            {/* 
                THE MORPHISM LOGIC:
                If this alert is the active analysis target, render the ForensicCard.
                Otherwise, render the AlertBubble.
              */}
                            {activeAnalysisId === alert.id ? (
                                <ForensicCard
                                    alert={alert}
                                    device={devices.find(d => d.name === alert.device)}
                                    devices={devices}
                                    onClose={() => setActiveAnalysisId(null)}
                                />
                            ) : (
                                <AlertBubble
                                    alert={alert}
                                    onAnalyze={() => setActiveAnalysisId(alert.id)}
                                />
                            )}
                        </div>
                    ))}

                    {/* Empty State */}
                    {alerts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-gunmetal-600">
                            <Shield className="h-24 w-24 mb-6 opacity-10" />
                            <p className="text-lg font-medium text-gunmetal-500">System Secure</p>
                            <p className="text-sm">No active threats detected in the last 24 hours.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Command Palette Overlay Component */}
            <CommandPalette open={isCmdOpen} setOpen={setCmdOpen} devices={devices} />
        </div>
    );
};
