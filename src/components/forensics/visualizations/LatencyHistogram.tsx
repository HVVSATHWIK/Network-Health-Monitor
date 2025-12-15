import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ForensicGraphCard from '../ForensicGraphCard';

interface LatencyHistogramProps {
    data: any[];
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
                        stroke="#889299"
                        fontSize={9}
                        tickLine={false}
                        interval={4}
                    />
                    <YAxis
                        hide
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(102, 252, 241, 0.1)' }}
                        contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#66FCF1', fontSize: '12px' }}
                        itemStyle={{ color: '#66FCF1' }}
                    />
                    <Bar dataKey="count" fill="#45A29E">
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.bin > 1000 ? '#FF2E2E' : (entry.bin > 200 ? '#FFA700' : '#45A29E')} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ForensicGraphCard>
    );
}
