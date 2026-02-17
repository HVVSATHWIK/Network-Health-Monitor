import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { layerSeverityData } from '../../data/kpiMockData';

const LayerSeverityChart = () => {
    // Custom tooltip for professional look
    type TooltipPayloadEntry = {
        value?: number;
        payload?: { severity?: string };
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-200 font-semibold mb-1">{label}</p>
                    <p className="text-sm text-slate-400">
                        Severity Score: <span className="text-white font-bold">{payload[0].value}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                        Status: <span className={{
                            'low': 'text-emerald-400',
                            'medium': 'text-amber-400',
                            'high': 'text-orange-400',
                            'critical': 'text-red-400'
                        }[payload[0].payload?.severity as string] || 'text-slate-400'}>{payload[0].payload?.severity}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const getBarColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444'; // red-500
            case 'high': return '#f97316'; // orange-500
            case 'medium': return '#f59e0b'; // amber-500
            case 'low': return '#10b981'; // emerald-500
            default: return '#64748b'; // slate-500
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-slate-200 font-semibold text-lg">Layer Severity Heatmap</h3>
                <p className="text-slate-400 text-xs">Real-time anomaly scoring per OSI layer</p>
            </div>

            <div className="flex-grow min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={layerSeverityData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            dataKey="layer"
                            type="category"
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                            width={30}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#1e293b' }}>
                            {layerSeverityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.severity)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LayerSeverityChart;
