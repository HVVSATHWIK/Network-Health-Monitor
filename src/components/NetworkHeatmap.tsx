import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { Alert } from '../types/network';

interface NetworkHeatmapProps {
  alerts?: Alert[];
}

export default function NetworkHeatmap({ alerts = [] }: NetworkHeatmapProps) {
  const heatmapData = useMemo(() => {
    const data = [];
    const layers = ['L1', 'L2', 'L3', 'L4', 'L5-7'];
    const metrics = ['Utilization', 'Latency', 'Errors', 'Packets', 'Jitter'];

    // Check if we have the specific "Rigged" faults active
    const hasL1Fault = alerts.some(a => a.layer === 'L1' && a.severity === 'critical');
    const hasL7Fault = alerts.some(a => a.layer === 'L7' && a.severity === 'high');

    for (let i = 0; i < layers.length; i++) {
      for (let j = 0; j < metrics.length; j++) {
        const layer = layers[i];
        const metric = metrics[j];

        // Default Logic: Skew towards Healthy (0-20)
        // 85% chance of being Healthy (0-20)
        // 10% chance of being Warning (40-60)
        // 5% chance of being Critical (80-100)
        const rand = Math.random();
        let val = 0;
        if (rand < 0.85) {
          val = Math.floor(Math.random() * 20); // Healthy
        } else if (rand < 0.95) {
          val = Math.floor(Math.random() * 20) + 40; // Warning
        } else {
          val = Math.floor(Math.random() * 20) + 80; // Critical
        }

        // --- DYNAMIC DEMO SCENARIO ---
        // Only trigger the spike if the Fault is actually active in the system
        if (hasL1Fault && layer === 'L1' && metric === 'Errors') {
          val = 95; // SPIKE!
        }
        if (hasL7Fault && layer === 'L5-7' && metric === 'Latency') {
          val = 88; // SPIKE!
        }

        data.push({
          layer,
          metric,
          value: Math.min(100, Math.max(0, val))
        });
      }
    }
    return data;
  }, [alerts]); // Re-run when alerts change

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
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-bold text-white tracking-wide">Network Performance Heatmap</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-1 p-4 bg-slate-900/50 rounded-lg border border-slate-800" style={{ gridTemplateColumns: `120px repeat(${metrics.length}, 1fr)`, minWidth: '100%' }}>
          <div className="font-semibold text-slate-400 text-sm text-center py-2">Layer</div>
          {metrics.map(m => (
            <div key={m} className="font-semibold text-gray-700 text-sm text-center py-2 truncate">
              {m}
            </div>
          ))}

          {layers.map(layer => (
            <div key={layer} className="contents">
              <div className="font-semibold text-slate-300 text-sm py-2 pl-2 flex items-center bg-slate-800/30 rounded">
                {layer}
              </div>
              {metrics.map((metric, metricIndex) => {
                const data = heatmapData.find(d => d.layer === layer && d.metric === metric);
                return (
                  <div key={`${layer}-${metricIndex}`} className="relative">
                    <div
                      className={`${getColor(data?.value || 0)} ${getTextColor(data?.value || 0)} rounded px-2 py-2 text-center text-xs font-semibold transition-all hover:shadow-lg cursor-pointer`}
                      title={`${layer} ${metric}: ${data?.value.toFixed(1) || 0}%`}
                    >
                      {data?.value.toFixed(0) || 0}%
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <span className="text-slate-400">Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-slate-400">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400 rounded"></div>
          <span className="text-slate-400">Fair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded"></div>
          <span className="text-slate-400">Caution</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded"></div>
          <span className="text-slate-400">Critical</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
        <div className="text-sm text-slate-300">
          <strong className="text-white">Legend:</strong> Each cell shows performance metrics for that layer. Lower values indicate better performance.
        </div>
      </div>
    </div>
  );
}
