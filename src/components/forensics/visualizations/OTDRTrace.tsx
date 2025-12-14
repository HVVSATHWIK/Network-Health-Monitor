import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import ForensicGraphCard from './ForensicGraphCard';

interface OTDRTraceProps {
    data: any[];
    title?: string;
    description?: string;
}

export default function OTDRTrace({ data, title = "Optical Time-Domain Reflectometry", description }: OTDRTraceProps) {
    const breakPoint = data.find((d: any) => d.signal <= -70);

    return (
        <ForensicGraphCard title={title} description={description || "Signal strength (dBm) vs Distance (km)"}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#66FCF1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#66FCF1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="distance"
                        stroke="#889299"
                        fontSize={10}
                        tickLine={false}
                        label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -5, fill: '#889299', fontSize: 9 }}
                    />
                    <YAxis
                        stroke="#889299"
                        fontSize={10}
                        tickLine={false}
                        domain={[-90, 0]}
                        label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: '#889299', fontSize: 9 }}

                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#66FCF1', fontSize: '12px' }}
                        itemStyle={{ color: '#66FCF1' }}
                    />
                    <ReferenceLine y={-30} stroke="#FFA700" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold', fill: '#FFA700', fontSize: 8 }} />

                    {breakPoint && (
                        <ReferenceDot x={breakPoint.distance} y={breakPoint.signal} r={4} fill="#FF2E2E" stroke="none" label={{ value: 'BREAK', fill: '#FF2E2E', fontSize: 10, fontWeight: 'bold' }} />
                    )}

                    <Area
                        type="stepAfter"
                        dataKey="signal"
                        stroke="#66FCF1"
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
