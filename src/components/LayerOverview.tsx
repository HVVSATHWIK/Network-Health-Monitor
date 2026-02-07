import { Device, LayerKPI } from '../types/network';
import { Activity, AlertTriangle, CheckCircle, Server, Router, Cpu, Box, Shield, Gauge, ArrowRight } from 'lucide-react';

interface LayerOverviewProps {
  kpis: LayerKPI[];
  selectedLayer: string;
  devices: Device[];
  onSelectDevice: (deviceId: string) => void;
}

export default function LayerOverview({ kpis, selectedLayer, devices, onSelectDevice }: LayerOverviewProps) {

  const layerDescriptions: Record<string, string> = {
    'L1': 'Physical Layer - Cables, Signals, Connectivity',
    'L2': 'Data Link Layer - Switching, VLANs, MAC',
    'L3': 'Network Layer - Routing, Subnets, IP',
    'L4': 'Transport Layer - TCP/UDP, Reliability',
    'L5': 'Session Layer - Dialog Control, Stability',
    'L6': 'Presentation Layer - Encryption, Encoding',
    'L7': 'Application Layer - Protocols, Services'
  };

  const deviceIcons: Record<string, any> = {
    switch: Router,
    router: Router,
    plc: Cpu,
    sensor: Gauge,
    scada: Activity,
    gateway: Box,
    server: Server,
    firewall: Shield
  };

  // Filter devices that relevantly participate in this layer
  // For now, since mock data has metrics for all layers, we show all devices but highlight layer-specific metrics
  // Ideally, you'd filter: devices.filter(d => d.layers.includes(selectedLayer))

  const metricsForLayer = (device: Device) => {
    // @ts-ignore - dynamic access to layer metrics
    return device.metrics[selectedLayer.toLowerCase()];
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500">

      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-64 h-64 text-blue-500" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            ACTIVE VIEW
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{selectedLayer} Overview</h1>
          <p className="text-xl text-slate-400">{layerDescriptions[selectedLayer]}</p>
        </div>
      </div>

      {/* Device Grid */}
      <h2 className="text-xl font-bold text-slate-300 px-2 flex items-center gap-2">
        <Server className="w-5 h-5 text-slate-500" />
        Associated Devices
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {devices.map((device) => {
          const Icon = deviceIcons[device.type] || Box;
          const layerMetrics = metricsForLayer(device);

          return (
            <div
              key={device.id}
              onClick={() => onSelectDevice(device.id)}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/60 hover:border-blue-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-900/10 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${device.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors">{device.name}</h3>
                    <div className="text-xs text-slate-500 font-mono">{device.ip}</div>
                  </div>
                </div>
                {device.status === 'healthy'
                  ? <CheckCircle className="w-5 h-5 text-emerald-500/50" />
                  : <AlertTriangle className="w-5 h-5 text-red-500" />
                }
              </div>

              {/* Layer Specific Preview */}
              <div className="bg-slate-950/50 rounded-lg p-3 text-xs space-y-2 border border-slate-800/50">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{selectedLayer} Metrics</div>
                {Object.entries(layerMetrics).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {typeof value === 'number' ? value.toString().slice(0, 5) : String(value)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-2 flex items-center text-blue-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                View Full Report <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
