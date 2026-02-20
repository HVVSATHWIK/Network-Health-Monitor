interface RiskGaugeProps {
    score: number;
    threshold: number;
    rangeLow: number;
    rangeHigh: number;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, threshold, rangeLow, rangeHigh }) => {
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const pct = clamp(score);
    const thresholdPct = clamp(threshold);
    const lowPct = clamp(rangeLow);
    const highPct = clamp(rangeHigh);
    const rangeMin = Math.min(lowPct, highPct);
    const rangeMax = Math.max(lowPct, highPct);

    const tone = pct >= 80 ? 'text-alert-critical' : pct >= 60 ? 'text-alert-warning' : 'text-alert-success';

    const polar = (cx: number, cy: number, r: number, deg: number) => {
        const a = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    // Semicircle gauge: start at 180deg (left), end at 0deg (right)
    const cx = 110;
    const cy = 100;
    const r = 78;

    const left = { x: cx - r, y: cy };
    const right = { x: cx + r, y: cy };

    const gaugePath = `M ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${right.x} ${right.y}`;

    const thresholdDeg = 180 - (thresholdPct / 100) * 180;
    const thresholdPt = polar(cx, cy, r, thresholdDeg);
    const thresholdTickInner = polar(cx, cy, r - 6, thresholdDeg);
    const thresholdTickOuter = polar(cx, cy, r + 3, thresholdDeg);
    const thresholdLabelDx = thresholdPt.x > cx ? -24 : 8;
    const thresholdLabelDy = thresholdPt.y < cy - r * 0.55 ? -6 : -4;

    const rangeStartDeg = 180 - (rangeMin / 100) * 180;
    const rangeEndDeg = 180 - (rangeMax / 100) * 180;
    void rangeStartDeg;
    void rangeEndDeg;

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="relative w-[260px] pt-1 pb-3">
                <svg width={260} height={180} viewBox="0 0 220 150" className="block">
                    <path
                        d={gaugePath}
                        stroke="currentColor"
                        className="text-gunmetal-700"
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.65}
                    />
                    <path
                        d={gaugePath}
                        stroke="currentColor"
                        className={tone}
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray={`${pct} 100`}
                    />

                    <line
                        x1={thresholdTickInner.x}
                        y1={thresholdTickInner.y}
                        x2={thresholdTickOuter.x}
                        y2={thresholdTickOuter.y}
                        stroke="currentColor"
                        className="text-alert-warning"
                        strokeWidth={2}
                        strokeLinecap="round"
                    />
                    <circle cx={thresholdPt.x} cy={thresholdPt.y} r={3} className="fill-alert-warning" />

                    {/* Micro tick labels */}
                    <text x={left.x - 2} y={132} className="fill-gunmetal-500 font-mono" fontSize="10">0</text>
                    <text x={right.x - 9} y={132} className="fill-gunmetal-500 font-mono" fontSize="10">100</text>
                    <text x={thresholdPt.x + thresholdLabelDx} y={thresholdPt.y + thresholdLabelDy} className="fill-alert-warning font-mono" fontSize="9">T {thresholdPct}</text>
                </svg>

                <div className="absolute inset-x-0 top-[56px] text-center">
                    <div className={`text-5xl font-mono font-semibold tabular-nums ${tone}`}>{pct}%</div>
                </div>

                <div className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-gunmetal-400">
                    Estimated Event Probability
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
