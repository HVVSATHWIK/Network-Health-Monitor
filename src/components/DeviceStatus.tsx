import { Device } from '../types/network';
import { Server, Router, Box, Gauge, Activity, Cpu } from 'lucide-react';

interface DeviceStatusProps {
  devices: Device[];
}

export default function DeviceStatus({ devices }: DeviceStatusProps) {
  const deviceIcons = {
    switch: Router,
    router: Router,
    plc: Cpu,
    sensor: Gauge,
    scada: Activity,
    gateway: Box,
    server: Server
  };

  const statusConfig = {
    healthy: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' },
    warning: { bg: 'bg-yellow-950/30', text: 'text-yellow-400', dot: 'bg-yellow-500 shadow-[0_0_8px_#eab308]' },
    critical: { bg: 'bg-red-950/30', text: 'text-red-400', dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]' },
    offline: { bg: 'bg-slate-800/50', text: 'text-slate-400', dot: 'bg-slate-500' }
  };

  const statusCounts = {
    healthy: devices.filter(d => d.status === 'healthy').length,
    warning: devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length,
    offline: devices.filter(d => d.status === 'offline').length
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Asset Status</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-emerald-400">{statusCounts.healthy}</div>
          <div className="text-xs text-emerald-500/70 font-medium mt-1 uppercase tracking-wider">Healthy</div>
        </div>
        <div className="text-center p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-yellow-400">{statusCounts.warning}</div>
          <div className="text-xs text-yellow-500/70 font-medium mt-1 uppercase tracking-wider">Warning</div>
        </div>
        <div className="text-center p-3 bg-red-950/30 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-red-500">{statusCounts.critical}</div>
          <div className="text-xs text-red-500/70 font-medium mt-1 uppercase tracking-wider">Critical</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-400">{statusCounts.offline}</div>
          <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Offline</div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {devices.map((device) => {
          const Icon = deviceIcons[device.type];
          const config = statusConfig[device.status];

          return (
            <div key={device.id} className="border border-slate-700/50 bg-slate-800/20 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-900/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`${config.bg} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${config.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{device.name}</span>
                    <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                  </div>
                  <div className="text-xs text-gray-500">
                    {device.ip} • {device.location}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {device.manufacturer && (['Hirschmann', 'Belden', 'EAGLE'].includes(device.manufacturer)) && (
                    <span className="bg-orange-950/40 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                      {device.manufacturer}
                    </span>
                  )}
                  <span className={`${config.bg} ${config.text} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/5`}>
                    {device.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
