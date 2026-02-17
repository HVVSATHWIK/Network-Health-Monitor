import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface RiskGaugeProps {
    score: number;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
    // Gauge Data (Background arc + Value arc)
    const data = [
        { name: "Risk", value: score, color: score > 75 ? "#ef4444" : score > 50 ? "#f97316" : "#22c55e" },
        { name: "Remaining", value: 100 - score, color: "#334155" },
    ];

    // Needle Data (not implemented yet, simple arc fill for now)

    return (
        <div className="relative w-full h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* Centered Text */}
            <div className="absolute bottom-0 text-center mb-2">
                <span className={`text-4xl font-bold ${score > 75 ? "text-red-500" : score > 50 ? "text-orange-500" : "text-green-500"
                    }`}>
                    {score}%
                </span>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Probability</p>
            </div>
        </div>
    );
};

export default RiskGauge;
