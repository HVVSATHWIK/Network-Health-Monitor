import { Command } from 'cmdk';
import { Search, Terminal, ShieldAlert, Server, Router, Activity } from 'lucide-react';
import { useEffect } from 'react';
import { Device } from '../../../types/network'; // Use existing Device type

interface CommandPaletteProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    devices: Device[];
}

export const CommandPalette = ({ open, setOpen, devices }: CommandPaletteProps) => {
    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open: boolean) => !open);
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [setOpen])

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            // Backdrop & Positioning
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-gunmetal-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        // Dialog Content styling handled via wrapper below to avoid cmdk limitations
        >
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gunmetal-700 bg-gunmetal-900 shadow-2xl shadow-black ring-1 ring-white/10 mx-4">

                {/* Search Input */}
                <div className="flex items-center border-b border-gunmetal-800 px-4">
                    <Search className="mr-3 h-5 w-5 text-gunmetal-400" />
                    <Command.Input
                        className="flex-1 bg-transparent py-4 text-lg text-gunmetal-100 placeholder-gunmetal-500 focus:outline-none font-medium"
                        placeholder="Search devices by IP, Hostname, or MAC..."
                    />
                </div>

                {/* Results List */}
                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                    <Command.Empty className="py-12 text-center text-sm text-gunmetal-500">
                        No results found.
                    </Command.Empty>

                    {/* Group: System Actions */}
                    <Command.Group heading="Forensic Actions" className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gunmetal-500">
                        <Command.Item className="flex cursor-pointer select-none items-center rounded-md px-3 py-3 text-sm text-gunmetal-200 hover:bg-gunmetal-800 hover:text-white aria-selected:bg-gunmetal-800 aria-selected:text-white transition-colors">
                            <Terminal className="mr-3 h-4 w-4 text-alert-info" />
                            <span>Run Global Diagnostics</span>
                            <span className="ml-auto text-xs text-gunmetal-600 font-mono">ALL HOSTS</span>
                        </Command.Item>
                        <Command.Item className="flex cursor-pointer select-none items-center rounded-md px-3 py-3 text-sm text-gunmetal-200 hover:bg-gunmetal-800 hover:text-white aria-selected:bg-gunmetal-800 aria-selected:text-white transition-colors">
                            <ShieldAlert className="mr-3 h-4 w-4 text-alert-critical" />
                            <span>View Active Threats</span>
                            <span className="ml-auto text-xs text-gunmetal-600 font-mono">PRIORITY 1</span>
                        </Command.Item>
                    </Command.Group>

                    {/* Group: Devices */}
                    <Command.Group heading="Network Devices" className="px-2 text-xs font-bold uppercase tracking-wider text-gunmetal-500">
                        {devices.map(device => {
                            const Icon = device.type === 'switch' || device.type === 'firewall' ? Router : Server;
                            return (
                                <Command.Item key={device.id} className="flex cursor-pointer select-none items-center rounded-md px-3 py-3 text-sm text-gunmetal-200 hover:bg-gunmetal-800 hover:text-white aria-selected:bg-gunmetal-800 aria-selected:text-white transition-colors group">
                                    <Icon className="mr-3 h-4 w-4 text-gunmetal-400 group-hover:text-white" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{device.name}</span>
                                        <span className="text-xs text-gunmetal-500 font-mono">{device.ip}</span>
                                    </div>
                                    {device.status !== 'healthy' && (
                                        <div className={`ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border ${device.status === 'critical' ? 'bg-alert-critical/10 text-alert-critical border-alert-critical/20' : 'bg-alert-warning/10 text-alert-warning border-alert-warning/20'}`}>
                                            <Activity className="h-3 w-3" />
                                            {device.status.toUpperCase()}
                                        </div>
                                    )}
                                </Command.Item>
                            )
                        })}
                    </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="border-t border-gunmetal-800 bg-gunmetal-950 px-4 py-2 flex items-center justify-between text-[10px] text-gunmetal-600">
                    <span>Use arrow keys to navigate</span>
                    <div className="flex gap-2">
                        <span>Select <kbd className="font-sans bg-gunmetal-800 px-1 rounded text-gunmetal-400 border border-gunmetal-700">↵</kbd></span>
                        <span>Close <kbd className="font-sans bg-gunmetal-800 px-1 rounded text-gunmetal-400 border border-gunmetal-700">Esc</kbd></span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
};
