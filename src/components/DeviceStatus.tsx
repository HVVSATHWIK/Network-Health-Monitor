import { Device, NetworkConnection } from '../types/network'; // Added NetworkConnection
// import AssetDetailPanel from './AssetDetailPanel'; // Removed - now global
import { Server, Router, Box, Gauge, Activity, Cpu, Shield, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DeviceStatusProps {
  devices: Device[];
  connections?: NetworkConnection[]; // Added connections prop
  selectedDeviceId?: string | null;
  onSelectDevice?: (deviceId: string | null) => void;
  onInjectFault?: (id: string) => void;
}

export default function DeviceStatus({
  devices,
  selectedDeviceId,
  onSelectDevice
}: DeviceStatusProps) {
  const deviceIcons: Partial<Record<Device['type'], LucideIcon>> = {
    switch: Router,
    router: Router,
    plc: Cpu,
    sensor: Gauge,
    scada: Activity,
    gateway: Box,
    server: Server,
    firewall: Shield
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

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  if (selectedDevice && selectedDeviceId) {
    // Logic moved to global overlay in App.tsx
    // Keep selection highlight state but do not render panel here
  }

  return (
    <div id="asset-status-panel" className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl h-full flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">Asset Status</h2>
        <div className="p-2 bg-slate-800 rounded-full text-slate-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="text-center p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-xl font-bold text-emerald-400">{statusCounts.healthy}</div>
          <div className="text-[10px] text-emerald-500/70 font-medium mt-0.5 uppercase tracking-wider">Healthy</div>
        </div>
        <div className="text-center p-2 bg-yellow-950/30 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-xl font-bold text-yellow-400">{statusCounts.warning}</div>
          <div className="text-[10px] text-yellow-500/70 font-medium mt-0.5 uppercase tracking-wider">Warn</div>
        </div>
        <div className="text-center p-2 bg-red-950/30 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <div className="text-xl font-bold text-red-500">{statusCounts.critical}</div>
          <div className="text-[10px] text-red-500/70 font-medium mt-0.5 uppercase tracking-wider">Crit</div>
        </div>
        <div className="text-center p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
          <div className="text-xl font-bold text-slate-400">{statusCounts.offline}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">Off</div>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {devices.map((device) => {
          const Icon = deviceIcons[device.type] || Box;
          const config = statusConfig[device.status];
          const isSelected = selectedDeviceId === device.id;

          return (
            <div
              key={device.id}
              className={`border rounded-lg p-3 transition-all duration-300 group cursor-pointer relative overflow-hidden ${isSelected
                ? 'border-blue-500 bg-blue-900/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'border-slate-700/50 bg-slate-800/20 hover:border-blue-500/50 hover:bg-slate-800/50'
                }`}
              onClick={() => onSelectDevice?.(device.id)}
              role="button"
            >
              {/* Status Bar Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/30', '')}`}></div>

              <div className="flex items-center gap-3 pl-2">
                <div className={`${config.bg} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-200 text-sm truncate">{device.name}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                  </div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                    <span className="font-mono text-slate-600">{device.ip}</span>
                    <span>•</span>
                    <span className="truncate">{device.location}</span>
                  </div>
                </div>

                {/* Right Side Metadata badge */}
                {(['server', 'plc', 'switch'].includes(device.type)) && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {device.type.toUpperCase().slice(0, 3)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
