import { layerSeverityData, type LayerSeverity } from '../../data/kpiMockData';

interface LayerSeverityChartProps {
    data?: LayerSeverity[];
}

const LayerSeverityChart = ({ data = layerSeverityData }: LayerSeverityChartProps) => {
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const severityTone = (severity: string) => {
        switch (severity) {
            case 'critical':
                return { ring: 'text-alert-critical', dim: 'text-alert-critical/80', bg: 'bg-alert-critical/10', border: 'border-alert-critical/20' };
            case 'high':
            case 'medium':
                return { ring: 'text-alert-warning', dim: 'text-alert-warning/80', bg: 'bg-alert-warning/10', border: 'border-alert-warning/20' };
            case 'low':
            default:
                return { ring: 'text-alert-success', dim: 'text-alert-success/80', bg: 'bg-alert-success/10', border: 'border-alert-success/20' };
        }
    };

    const makeSeries = (seed: number, base: number) => {
        const points = 18;
        const wave = 8 + (seed % 3) * 2;
        const drift = (seed % 5) - 2;
        const out: number[] = [];
        for (let i = 0; i < points; i++) {
            const t = i / (points - 1);
            const v = base + Math.sin((t * Math.PI * 2) + seed) * wave + drift * t;
            out.push(clamp(v, 0, 100));
        }
        return out;
    };

    const Sparkline = ({ values, tone }: { values: number[]; tone: string }) => {
        const w = 120;
        const h = 34;
        const pad = 3;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(1, max - min);

        const toX = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
        const toY = (v: number) => pad + (h - pad * 2) - ((v - min) * (h - pad * 2)) / range;

        const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`).join(' ');

        return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
                <path d={d} fill="none" className={`${tone}`} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        );
    };

    const HealthRing = ({ value, tone }: { value: number; tone: string }) => {
        const size = 44;
        const stroke = 4;
        const r = (size - stroke) / 2;
        const c = 2 * Math.PI * r;
        const pct = clamp(value, 0, 100) / 100;
        const dash = c * pct;

        return (
            <div className="relative h-11 w-11">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        className="text-gunmetal-700"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        className={tone}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${c - dash}`}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-gunmetal-100 tabular-nums">{Math.round(value)}%</span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 rounded-xl p-5 h-full flex flex-col ring-1 ring-white/5">
            <div className="mb-4">
                <h3 className="text-gunmetal-100 font-sans font-bold text-lg tracking-tight">KPI Intelligence</h3>
                <p className="text-gunmetal-400 text-xs">Layer health rings & telemetry sparklines (L1–L7)</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-3">
                    {data.map((layer, idx) => {
                        const tone = severityTone(layer.severity);
                        const health = clamp(100 - layer.score, 0, 100);
                        const crcPerMin = Math.round(clamp((layer.score / 100) * 420 + (idx * 7), 0, 999));
                        const lossPct = clamp((layer.score / 100) * 18, 0, 25);
                        const series = makeSeries(idx + 1, clamp(100 - layer.score * 0.85, 0, 100));

                        return (
                            <div key={layer.layer} className="rounded-lg border border-gunmetal-700/70 bg-gunmetal-950/35 px-3 py-3">
                                <div className="flex items-center gap-3">
                                    <HealthRing value={health} tone={tone.ring} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-baseline gap-2 min-w-0">
                                                <span className="text-gunmetal-100 font-sans font-bold tracking-tight">{layer.layer}</span>
                                                <span className={`text-[10px] font-mono uppercase tracking-widest ${tone.dim}`}>{layer.severity}</span>
                                            </div>

                                            <div className={`rounded-full border px-2 py-0.5 ${tone.bg} ${tone.border}`}>
                                                <span className={`text-[10px] font-mono tabular-nums ${tone.ring}`}>ANOM {layer.score}</span>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] font-mono text-gunmetal-200">
                                                    <span className="text-gunmetal-500">CRC/min</span> <span className="tabular-nums">{crcPerMin}</span>
                                                </div>
                                                <div className="text-[10px] font-mono text-gunmetal-200">
                                                    <span className="text-gunmetal-500">Loss</span> <span className="tabular-nums">{lossPct.toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                <Sparkline values={series} tone={tone.ring} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LayerSeverityChart;
