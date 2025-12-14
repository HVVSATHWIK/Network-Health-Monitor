import { X, Maximize2, Download, ShieldCheck, Cpu, Globe, Search } from 'lucide-react';
import { ForensicTerminal } from './ForensicTerminal';
import { Alert, Device } from '../../../types/network';

interface ForensicCardProps {
    alert: Alert;
    device?: Device;
    onClose: () => void;
}

export const ForensicCard: React.FC<ForensicCardProps> = ({ alert, device: _device, onClose }) => {
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
                            defaultValue="error|refused|fail"
                        />
                    </div>

                    {/* The Virtualized Log Component */}
                    <div className="flex-1 relative overflow-hidden">
                        <ForensicTerminal streamUrl={`wss://api.monitor.net/stream/${alert.id}`} />
                    </div>
                </div>

                {/* Right: Context & Remediation (25% Width) */}
                <div className="lg:col-span-3 flex flex-col bg-gunmetal-800">

                    {/* Device Vitals */}
                    <div className="p-5 border-b border-gunmetal-700">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gunmetal-500">Target Vitals</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gunmetal-400">CPU Load</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 rounded-full bg-gunmetal-700 overflow-hidden">
                                        <div className="h-full w-[85%] bg-alert-critical" />
                                    </div>
                                    <span className="text-xs font-mono text-alert-critical">85%</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gunmetal-400">Memory</span>
                                <span className="text-xs font-mono text-gunmetal-200">14GB / 16GB</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gunmetal-400">Disk I/O</span>
                                <span className="text-xs font-mono text-alert-warning">HIGH</span>
                            </div>
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
