import { LayerKPI } from '../types/network';

interface LayerOverviewProps {
  kpis: LayerKPI[];
}

export default function LayerOverview({ kpis }: LayerOverviewProps) {
  const layers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

  const getLayerStatus = (layer: string) => {
    const layerKPIs = kpis.filter(k => k.layer === layer);
    const hasCritical = layerKPIs.some(k => k.status === 'critical');
    const hasWarning = layerKPIs.some(k => k.status === 'warning');

    if (hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  const statusConfig = {
    healthy: { bg: 'bg-green-500', text: 'text-green-700', lightBg: 'bg-green-50' },
    warning: { bg: 'bg-yellow-500', text: 'text-yellow-700', lightBg: 'bg-yellow-50' },
    critical: { bg: 'bg-red-500', text: 'text-red-700', lightBg: 'bg-red-50' }
  };

  const layerDescriptions: Record<string, string> = {
    'L1': 'Physical Layer - Cables, Signals, Connectivity',
    'L2': 'Data Link Layer - Switching, VLANs, MAC',
    'L3': 'Network Layer - Routing, Subnets, IP',
    'L4': 'Transport Layer - TCP/UDP, Reliability',
    'L5': 'Session Layer - Sessions, Stability, Resets',
    'L6': 'Presentation Layer - Encryption, Encoding',
    'L7': 'Application Layer - Protocols, Services'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">OSI Layer Health Status</h2>

      <div className="space-y-3">
        {layers.map((layer) => {
          const status = getLayerStatus(layer);
          const config = statusConfig[status];
          const layerKPIs = kpis.filter(k => k.layer === layer);

          return (
            <div key={layer} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 ${config.lightBg} rounded-lg flex items-center justify-center border-2 ${config.bg} border-opacity-30`}>
                    <span className={`text-xl font-bold ${config.text}`}>{layer}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{layerDescriptions[layer]}</h3>
                    <div className={`w-3 h-3 rounded-full ${config.bg} animate-pulse`} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {layerKPIs.map((kpi, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="text-gray-500">{kpi.name}:</span>
                        <span className={`ml-1 font-semibold ${statusConfig[kpi.status].text}`}>
                          {kpi.value}{kpi.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex-shrink-0 ${config.bg} ${config.text} px-4 py-2 rounded-lg font-semibold text-sm uppercase`}>
                  {status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">All KPIs Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Warning Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">Critical Issue</span>
        </div>
      </div>
    </div>
  );
}
