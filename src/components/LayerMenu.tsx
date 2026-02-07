
import { X, Layers, ChevronRight } from 'lucide-react';

interface LayerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLayer: (layer: string) => void;
    selectedLayer: string | null;
}

export default function LayerMenu({ isOpen, onClose, onSelectLayer, selectedLayer }: LayerMenuProps) {
    const layers = [
        { id: 'L1', name: 'Physical Layer', desc: 'Cables, Signals, Power' },
        { id: 'L2', name: 'Data Link Layer', desc: 'MAC, VLANs, Switching' },
        { id: 'L3', name: 'Network Layer', desc: 'Routing, IP Subnets' },
        { id: 'L4', name: 'Transport Layer', desc: 'TCP/UDP Reliability' },
        { id: 'L5', name: 'Session Layer', desc: 'Dialog Control' },
        { id: 'L6', name: 'Presentation Layer', desc: 'Encryption, Formats' },
        { id: 'L7', name: 'Application Layer', desc: 'Protocols (HTTP, Modbus)' },
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 shadow-2xl z-[60] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Layers className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">OSI Layers</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Layer List */}
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 space-y-2">
                        {layers.map((layer) => (
                            <button
                                key={layer.id}
                                onClick={() => onSelectLayer(layer.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${selectedLayer === layer.id
                                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                                    }`}
                            >
                                {/* Active Indicator Bar */}
                                {selectedLayer === layer.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                )}

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className={`text-lg font-bold font-mono mb-0.5 ${selectedLayer === layer.id ? 'text-blue-200' : 'text-slate-300 group-hover:text-white'}`}>
                                            {layer.id}
                                        </div>
                                        <div className={`font-semibold ${selectedLayer === layer.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {layer.name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{layer.desc}</div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedLayer === layer.id ? 'text-blue-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-925">
                    <div className="text-xs text-slate-500 text-center">
                        Select a layer to view associated devices and health metrics.
                    </div>
                </div>
            </div>
        </>
    );
}
