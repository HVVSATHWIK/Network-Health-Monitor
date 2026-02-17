import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { trendData } from '../../data/kpiMockData';

const TrendAnalysisGraph = () => {
    return (
        <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 rounded-xl p-6 h-full flex flex-col ring-1 ring-white/5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-gunmetal-100 font-sans font-bold text-lg tracking-tight">Trend Analysis</h3>
                    <p className="text-gunmetal-400 text-xs">Severity vs escalation probability (last 15 min)</p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-alert-critical/80"></span>
                        <span className="text-gunmetal-300">Severity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-alert-warning/80"></span>
                        <span className="text-gunmetal-300">Probability</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 6" stroke="currentColor" className="text-gunmetal-700" opacity={0.55} vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="currentColor"
                            className="text-gunmetal-500"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="currentColor"
                            className="text-gunmetal-500"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(2,6,23,0.92)', borderColor: 'rgba(51,65,85,0.7)', color: '#f1f5f9' }}
                            itemStyle={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem', fontFamily: 'JetBrains Mono, monospace' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="severity"
                            stroke="currentColor"
                            className="text-alert-critical"
                            strokeWidth={1.75}
                            fill="none"
                        />
                        <Area
                            type="monotone"
                            dataKey="probability"
                            stroke="currentColor"
                            className="text-alert-warning"
                            strokeWidth={1.75}
                            fill="none"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendAnalysisGraph;
