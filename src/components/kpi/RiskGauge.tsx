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

    const tone = pct >= 80 ? 'text-alert-critical' : pct >= 60 ? 'text-alert-warning' : 'text-alert-success';

    const polar = (cx: number, cy: number, r: number, deg: number) => {
        const a = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    // Semicircle gauge: start at 180deg (left), end at 0deg (right)
    const cx = 100;
    const cy = 96;
    const r = 76;
    const startPt = polar(cx, cy, r, Math.PI); // 180deg
    void startPt;

    const left = { x: cx - r, y: cy };
    const right = { x: cx + r, y: cy };

    const gaugePath = `M ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${right.x} ${right.y}`;

    const endDeg = Math.PI - (pct / 100) * Math.PI; // from pi -> 0
    const endPt = polar(cx, cy, r, endDeg);
    const valuePath = pct <= 0
        ? ''
        : `M ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${endPt.x} ${endPt.y}`;

    const thresholdDeg = Math.PI - (thresholdPct / 100) * Math.PI;
    const thresholdPt = polar(cx, cy, r, thresholdDeg);

    const rangeStartDeg = Math.PI - (lowPct / 100) * Math.PI;
    const rangeEndDeg = Math.PI - (highPct / 100) * Math.PI;
    const rangeStartPt = polar(cx, cy, r, rangeStartDeg);
    const rangeEndPt = polar(cx, cy, r, rangeEndDeg);
    const rangePath = `M ${rangeStartPt.x} ${rangeStartPt.y} A ${r} ${r} 0 0 1 ${rangeEndPt.x} ${rangeEndPt.y}`;

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="relative w-[240px]">
                <svg width={240} height={150} viewBox="0 0 200 130" className="block">
                    <path
                        d={gaugePath}
                        stroke="currentColor"
                        className="text-gunmetal-700"
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.65}
                    />
                    {valuePath && (
                        <path
                            d={valuePath}
                            stroke="currentColor"
                            className={tone}
                            strokeWidth={6}
                            fill="none"
                            strokeLinecap="round"
                        />
                    )}

                    <path
                        d={rangePath}
                        stroke="currentColor"
                        className="text-gunmetal-300"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="3 3"
                        opacity={0.75}
                    />

                    <circle cx={thresholdPt.x} cy={thresholdPt.y} r={3} className="fill-alert-warning" />

                    {/* Micro tick labels */}
                    <text x="20" y="112" className="fill-gunmetal-500 font-mono" fontSize="10">0</text>
                    <text x="171" y="112" className="fill-gunmetal-500 font-mono" fontSize="10">100</text>
                    <text x={thresholdPt.x + 6} y={thresholdPt.y - 4} className="fill-alert-warning font-mono" fontSize="9">T {thresholdPct}</text>
                </svg>

                <div className="absolute inset-x-0 top-[58px] text-center">
                    <div className={`text-5xl font-mono font-semibold tabular-nums ${tone}`}>{pct}%</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-gunmetal-400">Estimated Event Probability</div>
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
