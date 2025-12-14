import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, ShieldAlert } from 'lucide-react';

export default function AdvancedAnalytics() {
  // L1-L7 Correlated Data
  const timeSeriesData = [
    { time: '00:00', l7_latency: 145, l1_crc: 2, throughput: 780 },
    { time: '04:00', l7_latency: 152, l1_crc: 3, throughput: 765 },
    { time: '08:00', l7_latency: 138, l1_crc: 12, throughput: 820 }, // CRC Spike
    { time: '12:00', l7_latency: 265, l1_crc: 45, throughput: 450 }, // Latency follows CRC
    { time: '16:00', l7_latency: 188, l1_crc: 15, throughput: 695 },
    { time: '20:00', l7_latency: 142, l1_crc: 2, throughput: 910 },
    { time: '24:00', l7_latency: 150, l1_crc: 4, throughput: 765 }
  ];

  const layerHealthData = [
    { category: 'Physical (L1)', value: 82, full: 100 },
    { category: 'Data Link (L2)', value: 87, full: 100 },
    { category: 'Network (L3)', value: 92, full: 100 },
    { category: 'Transport (L4)', value: 89, full: 100 },
    { category: 'Application (L7)', value: 78, full: 100 }, // Degraded due to L1
    { category: 'Security', value: 96, full: 100 }
  ];

  const devicePerformance = [
    { device: 'Access Switch 02', type: 'Physical', metric: 'CRC Errors', value: 342, status: 'Critical', trend: '+15%' },
    { device: 'Core Switch 01', type: 'Network', metric: 'Throughput', value: '45Gbps', status: 'Healthy', trend: '-2%' },
    { device: 'SCADA Master', type: 'Application', metric: 'Response Time', value: '142ms', status: 'Warning', trend: '+12%' },
    { device: 'Robot Controller', type: 'Edge', metric: 'Jitter', value: '12ms', status: 'Healthy', trend: '0%' },
    { device: 'Vision System', type: 'Sensor', metric: 'Processing', value: '89%', status: 'Warning', trend: '+5%' }
  ];

  const protocolData = [
    { name: 'EtherNet/IP (OT)', value: 45 },
    { name: 'Modbus/TCP (Legacy)', value: 30 },
    { name: 'HTTPS (IT)', value: 15 },
    { name: 'OPC UA (Bridge)', value: 10 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* Top Row: Trends & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* L1 vs L7 Correlation Chart */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50"><Activity className="w-16 h-16 text-slate-800" /></div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 tracking-wide">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            L1 vs L7 Correlation (24h)
          </h3>
          <p className="text-xs text-slate-400 mb-6">Correlating Physical Errors (CRC) with App Latency</p>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCRC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="l7_latency" stroke="#3b82f6" strokeWidth={3} fill="url(#colorLatency)" name="App Latency (ms)" />
              <Area type="monotone" dataKey="l1_crc" stroke="#ef4444" strokeWidth={3} fill="url(#colorCRC)" name="L1 CRC Errors" />
            </AreaChart>
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
          { label: "Avg Latency", value: "42ms", trend: "+5%", color: "text-blue-400" },
          { label: "Packet Loss", value: "0.01%", trend: "-2%", color: "text-emerald-400" },
          { label: "Jitter", value: "12ms", trend: "+8%", color: "text-yellow-400" },
          { label: "CRC Errors", value: "342", trend: "+150%", color: "text-red-400" },
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
