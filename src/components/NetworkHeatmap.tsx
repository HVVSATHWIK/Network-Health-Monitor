import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { Alert, Device } from '../types/network';

interface NetworkHeatmapProps {
  alerts?: Alert[];
  devices?: Device[];
}

export default function NetworkHeatmap({ alerts = [], devices = [] }: NetworkHeatmapProps) {
  const heatmapData = useMemo(() => {
    const data: { layer: string; metric: string; value: number }[] = [];
    const layers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
    const metrics = ['Utilization', 'Latency', 'Errors', 'Packets', 'Jitter'];
    const n = Math.max(devices.length, 1);

    // Aggregate real metrics per layer from actual device telemetry
    const layerMetrics: Record<string, { utilization: number; latency: number; errors: number; packets: number; jitter: number }> = {};

    // Compute per-layer averages from real device data
    const avgTemp = devices.reduce((s, d) => s + d.metrics.l1.temperature, 0) / n;
    const avgCRC = devices.reduce((s, d) => s + d.metrics.l2.crcErrors, 0) / n;
    const avgLinkUtil = devices.reduce((s, d) => s + d.metrics.l2.linkUtilization, 0) / n;
    const avgLoss = devices.reduce((s, d) => s + d.metrics.l3.packetLoss, 0) / n;
    const avgRoutes = devices.reduce((s, d) => s + d.metrics.l3.routingTableSize, 0) / n;
    const avgRetrans = devices.reduce((s, d) => s + d.metrics.l4.tcpRetransmissions, 0) / n;
    const avgJitter = devices.reduce((s, d) => s + d.metrics.l4.jitter, 0) / n;
    const avgSessionResets = devices.reduce((s, d) => s + d.metrics.l5.sessionResets, 0) / n;
    const avgSessionStability = devices.reduce((s, d) => s + d.metrics.l5.sessionStability, 0) / n;
    const avgTlsFail = devices.reduce((s, d) => s + d.metrics.l6.tlsHandshakeFailures, 0) / n;
    const avgEncOverhead = devices.reduce((s, d) => s + d.metrics.l6.encryptionOverheadMs, 0) / n;
    const avgAppLatency = devices.reduce((s, d) => s + d.metrics.l7.appLatency, 0) / n;

    // Count alerts per layer for the "Packets" and "Errors" pressure signals
    const alertsByLayer: Record<string, number> = {};
    alerts.forEach(a => { alertsByLayer[a.layer] = (alertsByLayer[a.layer] || 0) + 1; });

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    // L1 — Physical
    layerMetrics['L1'] = {
      utilization: clamp(Math.max(0, avgTemp - 20) * 1.2),       // Temp-driven: 20°C=0%, 100°C=96%
      latency: clamp(avgAppLatency * 0.05),                       // Physical doesn't have latency per se, tiny contribution
      errors: clamp(avgCRC > 50 ? 90 : avgCRC > 10 ? 50 : avgCRC * 2),  // CRC errors map to error severity
      packets: clamp((alertsByLayer['L1'] || 0) * 20),            // Alert count as packet pressure
      jitter: clamp(avgJitter * 0.3),                             // Physical jitter contribution
    };

    // L2 — Data Link
    layerMetrics['L2'] = {
      utilization: clamp(avgLinkUtil),                             // Direct link utilization
      latency: clamp(avgCRC * 0.15),                              // CRC causes retransmit delays
      errors: clamp(avgCRC > 50 ? 85 : avgCRC > 10 ? 40 : avgCRC * 1.5),
      packets: clamp(avgLinkUtil * 0.4),                          // Packet throughput proportional to utilization
      jitter: clamp(avgCRC * 0.8),                                // CRC errors increase jitter
    };

    // L3 — Network
    layerMetrics['L3'] = {
      utilization: clamp(avgRoutes / 5),                           // Route table pressure (500=100%)
      latency: clamp(avgLoss * 8),                                 // Packet loss increases effective latency
      errors: clamp(avgLoss * 20),                                 // Loss is the primary L3 error
      packets: clamp(avgRoutes / 3),                               // Route count ~ packet diversity
      jitter: clamp(avgLoss * 5),                                  // Loss causes jitter spikes
    };

    // L4 — Transport
    layerMetrics['L4'] = {
      utilization: clamp(avgRetrans * 40),                         // Retransmissions drive utilization overhead
      latency: clamp(avgJitter * 1.5),                             // Jitter IS latency variation
      errors: clamp(avgRetrans * 30),                              // Retransmissions are transport errors
      packets: clamp(avgJitter * 0.8 + avgRetrans * 15),           // Combined packet pressure
      jitter: clamp(avgJitter * 2),                                // Direct jitter mapping
    };

    // L5 — Session
    layerMetrics['L5'] = {
      utilization: clamp(100 - avgSessionStability),                // Instability = utilization pressure
      latency: clamp(avgSessionResets * 2),                        // Resets cause latency spikes
      errors: clamp(avgSessionResets * 5),                         // Session resets are errors
      packets: clamp((100 - avgSessionStability) * 3),             // Instability affects packet flow
      jitter: clamp(avgSessionResets * 1.5),                       // Resets cause intermittent jitter
    };

    // L6 — Presentation
    layerMetrics['L6'] = {
      utilization: clamp(avgEncOverhead * 5),                      // Encryption overhead
      latency: clamp(avgEncOverhead * 4),                          // Direct overhead → latency
      errors: clamp(avgTlsFail * 10),                              // TLS failures
      packets: clamp(avgTlsFail * 5 + avgEncOverhead * 2),         // Combined
      jitter: clamp(avgEncOverhead * 2),                           // Encryption processing variance
    };

    // L7 — Application
    layerMetrics['L7'] = {
      utilization: clamp(avgAppLatency / 5),                       // App latency as utilization proxy
      latency: clamp(Math.min(avgAppLatency / 3, 100)),            // Direct application latency
      errors: clamp((alertsByLayer['L7'] || 0) * 15 + (avgAppLatency > 500 ? 40 : 0)),
      packets: clamp(avgAppLatency / 4),                           // Higher latency = more packet pressure
      jitter: clamp(avgJitter * 0.5 + avgAppLatency * 0.02),       // Combined sources
    };

    // Build the grid data
    for (const layer of layers) {
      const lm = layerMetrics[layer];
      for (const metric of metrics) {
        const key = metric.toLowerCase() as keyof typeof lm;
        data.push({ layer, metric, value: lm[key] ?? 0 });
      }
    }

    return data;
  }, [alerts, devices]);

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

  const layers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
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
