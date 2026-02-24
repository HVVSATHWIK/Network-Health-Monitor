import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, ShieldAlert } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Alert, Device, NetworkConnection } from '../types/network';
import { TimeRangeSelector } from './dashboard/TimeRangeSelector';
import type { TimeRange } from './dashboard/timeRangePresets';

interface AdvancedAnalyticsProps {
  devices: Device[];
  alerts: Alert[];
  connections: NetworkConnection[];
  timeRangeLabel: string;
  timeRangeValue: string;
  timeRangeStart?: Date;
  timeRangeEnd?: Date;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}

export default function AdvancedAnalytics({
  devices,
  alerts,
  connections,
  timeRangeLabel,
  timeRangeValue,
  timeRangeStart,
  timeRangeEnd,
  timeRange,
  onTimeRangeChange,
}: AdvancedAnalyticsProps) {
  const safeCount = Math.max(devices.length, 1);
  const chartSyncKey = `${timeRangeValue}-${timeRangeStart?.getTime() ?? 'auto'}-${timeRangeEnd?.getTime() ?? 'auto'}-${alerts.length}`;

  const metrics = useMemo(() => {
    const avgLatency = devices.reduce((sum, d) => sum + d.metrics.l7.appLatency, 0) / safeCount;
    const avgJitter = devices.reduce((sum, d) => sum + d.metrics.l4.jitter, 0) / safeCount;
    const avgPacketLoss = devices.reduce((sum, d) => sum + d.metrics.l3.packetLoss, 0) / safeCount;
    const totalCRC = devices.reduce((sum, d) => sum + d.metrics.l2.crcErrors, 0);
    return { avgLatency, avgJitter, avgPacketLoss, totalCRC };
  }, [devices, safeCount]);

  const layerHealthData = useMemo(() => {
    const avgTemp = devices.reduce((sum, d) => sum + d.metrics.l1.temperature, 0) / safeCount;
    const avgCRC = devices.reduce((sum, d) => sum + d.metrics.l2.crcErrors, 0) / safeCount;
    const avgLoss = devices.reduce((sum, d) => sum + d.metrics.l3.packetLoss, 0) / safeCount;
    const avgRetrans = devices.reduce((sum, d) => sum + d.metrics.l4.tcpRetransmissions, 0) / safeCount;
    const avgStability = devices.reduce((sum, d) => sum + d.metrics.l5.sessionStability, 0) / safeCount;
    const avgTlsFail = devices.reduce((sum, d) => sum + d.metrics.l6.tlsHandshakeFailures, 0) / safeCount;
    const avgAppLatency = devices.reduce((sum, d) => sum + d.metrics.l7.appLatency, 0) / safeCount;

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    return [
      { category: 'Physical (L1)', value: clamp(100 - Math.max(0, avgTemp - 40) * 1.8), full: 100 },
      { category: 'Data Link (L2)', value: clamp(100 - avgCRC * 0.9), full: 100 },
      { category: 'Network (L3)', value: clamp(100 - avgLoss * 26), full: 100 },
      { category: 'Transport (L4)', value: clamp(100 - avgRetrans * 210), full: 100 },
      { category: 'Application (L7)', value: clamp(100 - Math.max(0, avgAppLatency - 80) * 0.25), full: 100 },
      { category: 'Security', value: clamp(100 - avgTlsFail * 4), full: 100 },
      { category: 'Session (L5)', value: clamp(avgStability), full: 100 },
    ];
  }, [devices, safeCount]);

  const protocolData = useMemo(() => {
    const itCount = devices.filter((d) => d.category === 'IT').length;
    const otCount = devices.filter((d) => d.category === 'OT').length;
    const degradedLinks = connections.filter((c) => c.status !== 'healthy').length;
    const healthyLinks = Math.max(connections.length - degradedLinks, 0);

    return [
      { name: 'OT Assets', value: Math.max(otCount, 0) },
      { name: 'IT Assets', value: Math.max(itCount, 0) },
      { name: 'Healthy Links', value: healthyLinks },
      { name: 'Degraded Links', value: degradedLinks },
    ].filter((item) => item.value > 0);
  }, [connections, devices]);

  const devicePerformance = useMemo(() => {
    const scored = devices.map((d) => {
      const score = d.metrics.l2.crcErrors * 1.4 + d.metrics.l3.packetLoss * 22 + d.metrics.l4.jitter * 0.7 + d.metrics.l7.appLatency * 0.15;
      const status = d.status === 'critical' ? 'Critical' : d.status === 'warning' ? 'Warning' : 'Healthy';
      return {
        device: d.name,
        type: d.type,
        metric: 'Health Index',
        value: score.toFixed(0),
        status,
      };
    });

    return scored.sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 6);
  }, [devices]);

  // ── Stable fingerprint: only recompute chart when something meaningful changes ──
  const criticals = devices.filter(d => d.status === 'critical').length;
  const warnings = devices.filter(d => d.status === 'warning').length;
  const stableFingerprint = `${timeRangeValue}|${timeRangeStart?.getTime() ?? ''}|${timeRangeEnd?.getTime() ?? ''}|${criticals}|${warnings}|${alerts.length}|${devices.length}`;

  // Pin "now" so it doesn't shift on every tick
  const pinnedNowRef = useRef(Date.now());
  const lastFingerprintRef = useRef(stableFingerprint);
  const cachedSeriesRef = useRef<{ time: string; crc: number; latency: number; loss: number }[]>([]);

  if (stableFingerprint !== lastFingerprintRef.current) {
    pinnedNowRef.current = Date.now();          // re-anchor only on real change
    lastFingerprintRef.current = stableFingerprint;
  }

  const timeSeriesData = useMemo(() => {
    const now = pinnedNowRef.current;

    const presetDurations: Record<string, number> = {
      '10m': 10 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '2d': 2 * 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1mo': 30 * 24 * 60 * 60 * 1000,
    };

    const startMs = timeRangeValue === 'custom' && timeRangeStart ? timeRangeStart.getTime() : now - (presetDurations[timeRangeValue] ?? 60 * 60 * 1000);
    const endMs = timeRangeValue === 'custom' && timeRangeEnd ? timeRangeEnd.getTime() : now;

    const duration = Math.max(endMs - startMs, 60 * 1000);
    const bins = duration <= 10 * 60 * 1000
      ? 16
      : duration <= 30 * 60 * 1000
        ? 20
        : duration <= 60 * 60 * 1000
          ? 24
          : duration <= 6 * 60 * 60 * 1000
            ? 28
            : duration <= 24 * 60 * 60 * 1000
              ? 36
              : duration <= 3 * 24 * 60 * 60 * 1000
                ? 42
                : 48;
    const step = duration / bins;

    // ---------- Stock-chart-style flowing data ----------
    // Base values from real device telemetry (floors guarantee visibility)
    const rawCRC = devices.reduce((s, d) => s + d.metrics.l2.crcErrors, 0) / safeCount;
    const rawLatency = devices.reduce((s, d) => s + d.metrics.l7.appLatency, 0) / safeCount;
    const rawLoss = devices.reduce((s, d) => s + d.metrics.l3.packetLoss, 0) / safeCount;

    const baseCRC = Math.max(rawCRC, 8);
    const baseLoss = Math.max(rawLoss, 1.2);
    const baseLatency = Math.max(rawLatency, 45);

    // Fault pressure
    const faultPressure = criticals * 0.35 + warnings * 0.12;
    const l1Alerts = alerts.filter(a => a.layer === 'L1' || a.layer === 'L2').length;
    const l7Alerts = alerts.filter(a => a.layer === 'L7' || a.layer === 'L5' || a.layer === 'L6').length;

    // Deterministic micro-jitter
    const hash = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return (x - Math.floor(x)) * 2 - 1;
    };

    const format = duration <= 6 * 60 * 60 * 1000
      ? { hour: '2-digit', minute: '2-digit', hour12: false } as const
      : duration <= 3 * 24 * 60 * 60 * 1000
        ? { month: 'short', day: '2-digit', hour: '2-digit', hour12: false } as const
        : { month: 'short', day: '2-digit' } as const;

    const durationH = duration / (3600 * 1000);
    const cycles = durationH <= 0.5 ? 1.5 : durationH <= 6 ? 2.2 : durationH <= 24 ? 3 : 4;
    const incidentMag = faultPressure + l1Alerts * 0.06 + l7Alerts * 0.04;

    const series: { time: string; crc: number; latency: number; loss: number }[] = [];

    for (let i = 0; i <= bins; i++) {
      const t = startMs + i * step;
      const pct = i / bins;

      // Smooth sine undulations
      const wave1 = Math.sin(pct * Math.PI * 2 * cycles);
      const wave2 = Math.sin(pct * Math.PI * 2 * cycles * 1.7 + 1.2);
      const wave3 = Math.cos(pct * Math.PI * 2 * cycles * 0.6 + 0.8);
      const micro = hash(i * 7.3 + bins) * 0.12;

      // Incident gaussian bumps with L1→L3→L7 phase lag
      const incW = 0.12;
      const crcBump   = Math.exp(-0.5 * ((pct - 0.65) / incW) ** 2);
      const lossBump  = Math.exp(-0.5 * ((pct - 0.69) / incW) ** 2);
      const latBump   = Math.exp(-0.5 * ((pct - 0.74) / (incW * 1.3)) ** 2);

      const crc = Math.max(2, baseCRC * (1 + wave1 * 0.12 + micro) + baseCRC * incidentMag * crcBump * 1.8);
      const loss = Math.max(0.3, baseLoss * (1 + wave2 * 0.10 + hash(i * 11.1) * 0.05) + baseLoss * incidentMag * lossBump * 1.4);
      const latency = Math.max(20, baseLatency * (1 + wave3 * 0.08 + hash(i * 19.9) * 0.04) + baseLatency * incidentMag * latBump * 0.9);

      series.push({
        time: new Date(t).toLocaleString([], format),
        crc: Math.round(crc * 10) / 10,
        loss: Math.round(loss * 100) / 100,
        latency: Math.round(latency),
      });
    }

    cachedSeriesRef.current = series;
    return series;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFingerprint]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* Top Row: Trends & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* L1 vs L7 Correlation Chart */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50"><Activity className="w-16 h-16 text-slate-800" /></div>

          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              L1 vs L7 Correlation
            </h3>
            {timeRange && onTimeRangeChange && (
              <div className="relative z-10">
                <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-6">RCA propagation: <span className="text-red-400">L1 CRC</span> → <span className="text-amber-400">L3 loss</span> → <span className="text-blue-400">L7 latency</span> — <span className="text-blue-400 font-medium">{timeRangeLabel}</span></p>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart key={chartSyncKey} data={timeSeriesData}>
              <defs>
                <linearGradient id="gradLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis yAxisId="left" stroke="#60a5fa" fontSize={11} tickLine={false} axisLine={false} width={38} />
              <YAxis yAxisId="right" orientation="right" stroke="#f87171" fontSize={11} tickLine={false} axisLine={false} width={38} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ color: '#93c5fd', fontWeight: 600 }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradLatency)" fillOpacity={1} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#93c5fd' }} name="L7 Latency (ms)" />
              <Line yAxisId="right" type="monotone" dataKey="crc" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#f87171' }} name="L1 CRC Errors" />
              <Line yAxisId="right" type="monotone" dataKey="loss" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#fbbf24' }} name="L3 Packet Loss (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Network Layer Health Radar */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-50"><ShieldAlert className="w-16 h-16 text-slate-800" /></div>
          <h3 className="text-lg font-bold text-white mb-1 tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            Layer Health Radar
          </h3>
          <p className="text-xs text-slate-400 mb-6">Real-time health score by OSI Layer</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={layerHealthData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
              <Radar name="Current Health" dataKey="value" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.2} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f3f4f6' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Latency", value: `${metrics.avgLatency.toFixed(1)}ms`, trend: `${alerts.length} alerts`, color: "text-blue-400" },
          { label: "Packet Loss", value: `${metrics.avgPacketLoss.toFixed(2)}%`, trend: `${connections.filter(c => c.status !== 'healthy').length} degraded links`, color: "text-emerald-400" },
          { label: "Jitter", value: `${metrics.avgJitter.toFixed(1)}ms`, trend: `${devices.filter(d => d.status === 'warning').length} warning assets`, color: "text-yellow-400" },
          { label: "CRC Errors", value: `${Math.round(metrics.totalCRC)}`, trend: `${devices.filter(d => d.status === 'critical').length} critical assets`, color: "text-red-400" },
        ].map((m, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg backdrop-blur-sm">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">{m.label}</div>
            <div className={`text-2xl font-mono font-bold ${m.color}`}>{m.value}</div>
            <div className="text-slate-500 text-xs mt-1">Trend: <span className="text-slate-300">{m.trend}</span></div>
          </div>
        ))}
      </div>

      {/* Bottom Row: Protocol Distribution & Device Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Protocol Pie Chart */}
        <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 tracking-wide">IT/OT Protocol Mix</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {protocolData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Performance Matrix */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-4 tracking-wide">Critical Device Telemetry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-normal">Device Name</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-normal">Type</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-normal">Primary Metric</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-normal">Value</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {devicePerformance.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors group">
                    <td className="py-3 px-4 font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{row.device}</td>
                    <td className="py-3 px-4 text-slate-500">{row.type}</td>
                    <td className="text-right py-3 px-4 text-slate-400">{row.metric}</td>
                    <td className="text-right py-3 px-4 font-mono text-slate-300">{row.value}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.status === 'Critical' ? 'bg-red-950/30 text-red-400 border-red-500/30' :
                        row.status === 'Warning' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-500/30' :
                          'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Critical' ? 'bg-red-500 animate-pulse' :
                          row.status === 'Warning' ? 'bg-yellow-500' :
                            'bg-emerald-500'
                          }`}></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
