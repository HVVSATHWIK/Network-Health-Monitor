import { ArrowUp, ArrowDown, Server, Video, AlertCircle } from 'lucide-react';
import { Device, NetworkConnection } from '../../types/network';

export interface NetworkLoadCardProps {
    timeRangeLabel?: string;
    timeRangeValue?: string;
    device?: Device;
    connections?: NetworkConnection[];
    devices?: Device[];
}

export function NetworkLoadCard({ timeRangeLabel = "Last 10 min", device, connections = [], devices = [] }: NetworkLoadCardProps) {
    const name = device?.name ?? 'Hirschmann BOBCAT Switch';
    const linkUtil = device?.metrics.l2.linkUtilization ?? 0;
    const crcErrors = device?.metrics.l2.crcErrors ?? 0;

    // Compute port utilization from actual link utilization metric
    const utilization = Math.round(Math.min(100, linkUtil));

    // Derive burst pattern from actual metrics
    const burstPattern = crcErrors > 50
        ? 'Error Storm Active'
        : utilization > 80
            ? 'Burst Pattern (Likely IT)'
            : utilization > 60
                ? 'Sustained High Load'
                : 'Normal Periodic';

    // Queue drops derived from CRC error rate
    const queueDrops = Math.round(crcErrors * 0.25);

    // Find top talkers: devices with highest bandwidth connections to this device
    const deviceId = device?.id ?? '';
    const relatedConns = connections
        .filter(c => c.source === deviceId || c.target === deviceId)
        .sort((a, b) => b.bandwidth - a.bandwidth);

    const topTalkers = relatedConns.slice(0, 3).map(c => {
        const peerId = c.source === deviceId ? c.target : c.source;
        const peerDevice = devices.find(d => d.id === peerId);
        const totalBw = relatedConns.reduce((s, conn) => s + conn.bandwidth, 0) || 1;
        return {
            name: peerDevice?.name ?? peerId,
            pct: Math.round((c.bandwidth / totalBw) * 100),
            type: peerDevice?.type ?? 'server',
        };
    });

    const UtilArrow = utilization > 50 ? ArrowUp : ArrowDown;

    return (
        <div className="relative bg-slate-900/50 border border-slate-800 rounded-lg p-4 backdrop-blur-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Network Load: {name}
                </h3>
            </div>

            <div className="absolute top-4 right-4 text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
                {timeRangeLabel}
            </div>

            <div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-400">Port Utilization</span>
                    <span className={`text-lg font-bold flex items-center gap-1 ${utilization > 80 ? 'text-red-400' : utilization > 60 ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {utilization}% <UtilArrow className="w-4 h-4" />
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r relative ${utilization > 80 ? 'from-blue-500 to-red-500' : utilization > 60 ? 'from-blue-500 to-yellow-500' : 'from-blue-600 to-blue-400'}`}
                        style={{ width: `${utilization}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px]">
                    <span className="text-slate-500">Queue Drops: <span className={`font-mono ${queueDrops > 5 ? 'text-red-400' : 'text-slate-300'}`}>{queueDrops}/sec</span></span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {burstPattern}
                    </span>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400">Top Talkers (by Bandwidth)</div>
                <div className="space-y-1.5">
                    {topTalkers.map((talker, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-slate-800/50 rounded">
                            <div className="flex items-center gap-2">
                                {talker.type === 'server' ? <Server className="w-3 h-3 text-slate-400" /> :
                                 talker.type === 'sensor' ? <AlertCircle className="w-3 h-3 text-slate-400" /> :
                                 <Video className="w-3 h-3 text-slate-400" />}
                                <span className="text-slate-200 truncate max-w-[140px]">{talker.name}</span>
                            </div>
                            <span className={`font-mono ${i === 0 ? 'text-amber-400' : 'text-blue-400'}`}>{talker.pct}%</span>
                        </div>
                    ))}
                    {topTalkers.length === 0 && (
                        <div className="text-slate-500 text-xs italic">No active connections</div>
                    )}
                </div>
            </div>
        </div>
    );
}
