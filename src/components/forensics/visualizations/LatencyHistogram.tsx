import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ForensicGraphCard from '../ForensicGraphCard';

interface LatencyHistogramProps {
    data: Array<{ range: string; count: number; bin: number }>;
    title?: string;
    description?: string;
}

export default function LatencyHistogram({ data, title = "Latency Distribution", description }: LatencyHistogramProps) {
    return (
        <ForensicGraphCard title={title} description={description || "Request Count vs Response Time"}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={0} barCategoryGap={0}>
                    <XAxis
                        dataKey="range"
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        interval={4}
                    />
                    <YAxis
                        hide
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.12)' }}
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#6366f1', fontSize: '12px' }}
                        itemStyle={{ color: '#c7d2fe' }}
                    />
                    <Bar dataKey="count" fill="#818cf8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.bin > 1000 ? '#ef4444' : (entry.bin > 200 ? '#f59e0b' : '#818cf8')} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ForensicGraphCard>
    );
}
