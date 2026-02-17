import { Clock, TrendingUp, Info } from 'lucide-react';
import { escalationRisk } from '../../data/kpiMockData';
import RiskGauge from './RiskGauge';

const EscalationCard = () => {
    // Determine risk color
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'text-alert-critical bg-alert-critical/10 border-alert-critical/20';
            case 'High': return 'text-alert-warning bg-alert-warning/10 border-alert-warning/20';
            case 'Moderate': return 'text-alert-warning bg-alert-warning/10 border-alert-warning/20';
            default: return 'text-alert-success bg-alert-success/10 border-alert-success/20';
        }
    };

    return (
        <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 rounded-xl p-6 h-full flex flex-col relative overflow-hidden ring-1 ring-white/5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gunmetal-100 font-sans font-bold text-lg tracking-tight">Predictive Insights</h3>
                    <p className="text-gunmetal-400 text-xs">Thin-stroke probability gauge & micro KPIs</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskColor(escalationRisk.level)}`}>
                    {escalationRisk.level} Risk
                </div>
            </div>

            {/* Main Risk Display */}
            <div className="h-44 flex flex-col items-center justify-center mb-4">
                <RiskGauge score={escalationRisk.probability} />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gunmetal-950/35 p-3 rounded-lg border border-gunmetal-700/70">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-alert-warning" />
                        <span className="text-gunmetal-200 text-[10px] font-mono uppercase tracking-widest">Time to Critical</span>
                    </div>
                    <p className="text-gunmetal-100 font-mono font-semibold tabular-nums">{escalationRisk.timeToCritical}</p>
                </div>
                <div className="bg-gunmetal-950/35 p-3 rounded-lg border border-gunmetal-700/70">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-alert-success" />
                        <span className="text-gunmetal-200 text-[10px] font-mono uppercase tracking-widest">Model Confidence</span>
                    </div>
                    <p className="text-gunmetal-100 font-mono font-semibold tabular-nums">{escalationRisk.confidence}%</p>
                </div>
            </div>

            {/* SHAP Explainability Section */}
            <div className="bg-gunmetal-950/25 rounded-lg p-4 border border-gunmetal-700/60">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-gunmetal-400" />
                    <h4 className="text-gunmetal-200 text-sm font-sans font-bold tracking-tight">Why this prediction?</h4>
                </div>

                <div className="space-y-2.5">
                    {escalationRisk.predictionFactors.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-gunmetal-400">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'risk' ? 'bg-alert-warning' : 'bg-alert-success'}`}></div>
                                <span>{item.factor}</span>
                            </div>
                            <span className={`font-mono font-bold tabular-nums ${item.type === 'risk' ? 'text-alert-warning' : 'text-alert-success'}`}>
                                {item.impact > 0 ? '+' : ''}{item.impact}%
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-2 border-t border-gunmetal-700/60 text-[10px] text-gunmetal-500 text-center font-mono uppercase tracking-widest">
                    Based on XGBoost feature importance analysis
                </div>
            </div>
        </div>
    );
};

export default EscalationCard;
