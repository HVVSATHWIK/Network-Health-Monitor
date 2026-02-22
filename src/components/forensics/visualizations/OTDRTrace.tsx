import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import ForensicGraphCard from '../ForensicGraphCard';

interface OTDRTraceProps {
    data: Array<{ distance: number; signal: number }>;
    title?: string;
    description?: string;
}

export default function OTDRTrace({ data, title = "Optical Time-Domain Reflectometry", description }: OTDRTraceProps) {
    const breakPoint = data.find((d) => d.signal <= -70);

    return (
        <ForensicGraphCard title={title} description={description || "Signal strength (dBm) vs Distance (km)"}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="distance"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 9 }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        domain={[-90, 0]}
                        label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }}

                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#6366f1', fontSize: '12px' }}
                        itemStyle={{ color: '#c7d2fe' }}
                    />
                    <ReferenceLine y={-30} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold', fill: '#f59e0b', fontSize: 8 }} />

                    {breakPoint && (
                        <ReferenceDot x={breakPoint.distance} y={breakPoint.signal} r={4} fill="#ef4444" stroke="none" label={{ value: 'BREAK', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                    )}

                    <Area
                        type="stepAfter"
                        dataKey="signal"
                        stroke="#818cf8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSignal)"
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ForensicGraphCard>
    );
}
