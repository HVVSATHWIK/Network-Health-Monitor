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
    healthy: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' }
  };

  const statusCounts = {
    healthy: devices.filter(d => d.status === 'healthy').length,
    warning: devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length,
    offline: devices.filter(d => d.status === 'offline').length
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Asset Status</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{statusCounts.healthy}</div>
          <div className="text-xs text-green-600 font-medium mt-1">Healthy</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700">{statusCounts.warning}</div>
          <div className="text-xs text-yellow-600 font-medium mt-1">Warning</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{statusCounts.critical}</div>
          <div className="text-xs text-red-600 font-medium mt-1">Critical</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-700">{statusCounts.offline}</div>
          <div className="text-xs text-gray-600 font-medium mt-1">Offline</div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {devices.map((device) => {
          const Icon = deviceIcons[device.type];
          const config = statusConfig[device.status];

          return (
            <div key={device.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
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
                    {device.manufacturer && ` • ${device.manufacturer}`}
                  </div>
                </div>
                <span className={`${config.bg} ${config.text} text-xs font-semibold px-2 py-1 rounded uppercase`}>
                  {device.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
