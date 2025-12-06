import { useMemo } from 'react';
import { Flame } from 'lucide-react';

export default function NetworkHeatmap() {
  const heatmapData = useMemo(() => {
    const data = [];
    const layers = ['L1', 'L2', 'L3', 'L4', 'L5-7'];
    const metrics = ['Utilization', 'Latency', 'Errors', 'Packets', 'Jitter'];

    for (let i = 0; i < layers.length; i++) {
      for (let j = 0; j < metrics.length; j++) {
        const baseValue = 50 + Math.sin(i * 0.5) * 20 + Math.cos(j * 0.3) * 15;
        data.push({
          layer: layers[i],
          metric: metrics[j],
          value: Math.min(100, Math.max(0, baseValue + Math.random() * 20))
        });
      }
    }
    return data;
  }, []);

  const getColor = (value: number) => {
    if (value < 20) return 'bg-blue-600';
    if (value < 40) return 'bg-green-500';
    if (value < 60) return 'bg-yellow-400';
    if (value < 80) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getTextColor = (value: number) => {
    if (value < 40 || value > 75) return 'text-white';
    return 'text-gray-800';
  };

  const layers = ['L1', 'L2', 'L3', 'L4', 'L5-7'];
  const metrics = ['Utilization', 'Latency', 'Errors', 'Packets', 'Jitter'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-800">Network Performance Heatmap</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-1 p-4 bg-gray-50 rounded-lg" style={{ gridTemplateColumns: `120px repeat(${metrics.length}, 1fr)`, minWidth: '100%' }}>
          <div className="font-semibold text-gray-700 text-sm text-center py-2">Layer</div>
          {metrics.map(m => (
            <div key={m} className="font-semibold text-gray-700 text-sm text-center py-2 truncate">
              {m}
            </div>
          ))}

          {layers.map(layer => (
            <>
              <div key={`layer-${layer}`} className="font-semibold text-gray-800 text-sm py-2 pl-2 flex items-center bg-white">
                {layer}
              </div>
              {metrics.map(metric => {
                const data = heatmapData.find(d => d.layer === layer && d.metric === metric);
                return (
                  <div key={`${layer}-${metric}`} className="relative">
                    <div
                      className={`${getColor(data?.value || 0)} ${getTextColor(data?.value || 0)} rounded px-2 py-2 text-center text-xs font-semibold transition-all hover:shadow-lg cursor-pointer`}
                      title={`${layer} ${metric}: ${data?.value.toFixed(1) || 0}%`}
                    >
                      {data?.value.toFixed(0) || 0}%
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <span className="text-gray-700">Optimal (0-20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-gray-700">Good (20-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400 rounded"></div>
          <span className="text-gray-700">Fair (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded"></div>
          <span className="text-gray-700">Caution (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded"></div>
          <span className="text-gray-700">Critical (80%+)</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-900">
          <strong>Legend:</strong> Each cell shows performance metrics for that layer. Lower values indicate better performance. Hover over cells for exact values.
        </div>
      </div>
    </div>
  );
}
