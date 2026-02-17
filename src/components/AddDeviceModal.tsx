
import { useState } from 'react';
import { X, Plus, Server, Router, Cpu, Box, Shield, Gauge, Activity } from 'lucide-react';
import { Device } from '../types/network';

interface AddDeviceModalProps {
    onClose: () => void;
    onAdd: (device: Device, parentId?: string) => void;
    devices: Device[];
}

export default function AddDeviceModal({ onClose, onAdd, devices }: AddDeviceModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<Device['type']>('switch');
    const [ip, setIp] = useState('');
    const [category, setCategory] = useState<'IT' | 'OT'>('OT');
    const [parentId, setParentId] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create new device with default metrics
        const newDevice: Device = {
            id: `d-${Date.now()}`, // Simple unique ID
            name,
            type,
            ip,
            category,
            status: 'healthy',
            location: 'New Location',
            position: [Math.random() * 50 - 25, Math.random() * 20, Math.random() * 50 - 25], // Random position near center
            metrics: {
                l1: { temperature: 35 },
                l2: { crcErrors: 0, linkUtilization: 10 },
                l3: { packetLoss: 0, routingTableSize: 10 },
                l4: { tcpRetransmissions: 0, jitter: 2 },
                l5: { sessionResets: 0, sessionStability: 100 },
                l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
                l7: { appLatency: 5 }
            }
        };

        onAdd(newDevice, parentId || undefined);
        onClose();
    };

    const deviceTypes = [
        { value: 'switch', label: 'Network Switch', icon: Router },
        { value: 'plc', label: 'PLC Controller', icon: Cpu },
        { value: 'server', label: 'Server / PC', icon: Server },
        { value: 'sensor', label: 'IoT Sensor', icon: Gauge },
        { value: 'router', label: 'Router', icon: Router },
        { value: 'firewall', label: 'Firewall', icon: Shield },
        { value: 'gateway', label: 'Gateway', icon: Box },
        { value: 'scada', label: 'SCADA Host', icon: Activity },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-400" />
                        Add New Device
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Device Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. Production Line Switch 01"
                        />
                    </div>

                    {/* Type Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Device Type</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 costume-scrollbar">
                            {deviceTypes.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value as Device['type'])}
                                        className={`flex items-center gap-2 p-2 rounded-lg text-sm border transition-all ${type === t.value
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Network Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">IP Address</label>
                            <input
                                required
                                type="text"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                placeholder="192.168.1.X"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCategory('IT')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${category === 'IT' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    IT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategory('OT')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${category === 'OT' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    OT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Uplink Connection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Connect to (Uplink)</label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        >
                            <option value="">-- No Connection (Standalone) --</option>
                            {devices.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.ip})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        Add Device to Network
                    </button>

                </form>
            </div>
        </div>
    );
}
