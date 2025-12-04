import { Device, NetworkConnection } from '../types/network';
import { Server, Router, Box, Gauge, Activity, Cpu } from 'lucide-react';

interface NetworkTopologyProps {
  devices: Device[];
  connections: NetworkConnection[];
}

export default function NetworkTopology({ devices, connections }: NetworkTopologyProps) {
  const deviceIcons = {
    switch: Router,
    router: Router,
    plc: Cpu,
    sensor: Gauge,
    scada: Activity,
    gateway: Box,
    server: Server
  };

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  const connectionColors = {
    healthy: 'stroke-green-500',
    degraded: 'stroke-yellow-500',
    down: 'stroke-red-500'
  };

  const positions: Record<string, { x: number; y: number }> = {
    d2: { x: 50, y: 10 },
    d1: { x: 50, y: 30 },
    d10: { x: 30, y: 50 },
    d8: { x: 70, y: 50 },
    d9: { x: 50, y: 70 },
    d5: { x: 20, y: 70 },
    d3: { x: 60, y: 70 },
    d4: { x: 80, y: 70 },
    d6: { x: 10, y: 90 },
    d7: { x: 30, y: 90 }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Network Topology</h2>

      <div className="relative bg-slate-50 rounded-lg p-8 h-[500px] border-2 border-slate-200">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {connections.map((conn, idx) => {
            const source = devices.find(d => d.id === conn.source);
            const target = devices.find(d => d.id === conn.target);
            if (!source || !target) return null;

            const sourcePos = positions[source.id];
            const targetPos = positions[target.id];
            if (!sourcePos || !targetPos) return null;

            return (
              <g key={idx}>
                <line
                  x1={`${sourcePos.x}%`}
                  y1={`${sourcePos.y}%`}
                  x2={`${targetPos.x}%`}
                  y2={`${targetPos.y}%`}
                  className={connectionColors[conn.status]}
                  strokeWidth="2"
                  strokeDasharray={conn.status === 'down' ? '5,5' : '0'}
                />
                <text
                  x={`${(sourcePos.x + targetPos.x) / 2}%`}
                  y={`${(sourcePos.y + targetPos.y) / 2}%`}
                  className="text-xs fill-gray-600 font-medium"
                  textAnchor="middle"
                  dy="-5"
                >
                  {conn.bandwidth}Mbps
                </text>
              </g>
            );
          })}
        </svg>

        {devices.map((device) => {
          const pos = positions[device.id];
          if (!pos) return null;

          const Icon = deviceIcons[device.type];
          const statusColor = statusColors[device.status];

          return (
            <div
              key={device.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: 10
              }}
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`${statusColor} rounded-full p-4 shadow-lg bg-opacity-90 backdrop-blur`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusColor} rounded-full border-2 border-white animate-pulse`} />
                </div>
                <div className="mt-2 bg-white px-2 py-1 rounded shadow-md border border-gray-200">
                  <div className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                    {device.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {device.ip}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500"></div>
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-yellow-500"></div>
          <span>Degraded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 5px, transparent 5px, transparent 10px)' }}></div>
          <span>Down</span>
        </div>
      </div>
    </div>
  );
}
