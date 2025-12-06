import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function AdvancedAnalytics() {
  const timeSeriesData = [
    { time: '00:00', latency: 145, throughput: 780, errors: 2 },
    { time: '04:00', latency: 152, throughput: 765, errors: 3 },
    { time: '08:00', latency: 138, throughput: 820, errors: 1 },
    { time: '12:00', latency: 165, throughput: 850, errors: 5 },
    { time: '16:00', latency: 148, throughput: 795, errors: 2 },
    { time: '20:00', latency: 142, throughput: 910, errors: 0 },
    { time: '24:00', latency: 150, throughput: 765, errors: 4 }
  ];

  const performanceData = [
    { category: 'L1 Health', value: 94 },
    { category: 'L2 Health', value: 87 },
    { category: 'L3 Health', value: 92 },
    { category: 'L4 Health', value: 89 },
    { category: 'L5-7 Health', value: 91 },
    { category: 'Security', value: 96 }
  ];

  const devicePerformance = [
    { device: 'Core Switch', utilization: 73, temp: 42, cpu: 35 },
    { device: 'Edge Router', utilization: 61, temp: 38, cpu: 28 },
    { device: 'PLC Line A', utilization: 88, temp: 45, cpu: 72 },
    { device: 'PLC Line B', utilization: 72, temp: 41, cpu: 58 },
    { device: 'SCADA', utilization: 45, temp: 36, cpu: 22 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Trends (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
              <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" name="Latency (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Layer Health Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
              <PolarRadiusAxis stroke="#9ca3af" />
              <Radar name="Health %" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Throughput & Error Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
            <Legend />
            <Line type="monotone" dataKey="throughput" stroke="#8b5cf6" strokeWidth={2} name="Throughput (Mbps)" />
            <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors/min" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Device Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-blue-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilization</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Temperature</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">CPU Load</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {devicePerformance.map((row, idx) => (
                <tr key={idx} className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800">{row.device}</td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-colors ${
                            row.utilization > 80 ? 'bg-red-500' :
                            row.utilization > 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${row.utilization}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-gray-700 w-8">{row.utilization}%</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-gray-700">{row.temp}°C</td>
                  <td className="text-right py-3 px-4 font-mono text-gray-700">{row.cpu}%</td>
                  <td className="text-right py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      row.utilization > 80 ? 'bg-red-100 text-red-800' :
                      row.utilization > 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {row.utilization > 80 ? 'Critical' : row.utilization > 70 ? 'Warning' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
