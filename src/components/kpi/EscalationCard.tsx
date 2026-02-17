import { Clock, TrendingUp, Info } from 'lucide-react';
import { escalationRisk } from '../../data/kpiMockData';
import RiskGauge from './RiskGauge';

const EscalationCard = () => {
    // Determine risk color
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-slate-200 font-semibold text-lg">Escalation Intelligence</h3>
                    <p className="text-slate-400 text-xs">Predictive Risk Modeling</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskColor(escalationRisk.level)}`}>
                    {escalationRisk.level} Risk
                </div>
            </div>

            {/* Main Risk Display */}
            <div className="flex-grow flex flex-col items-center justify-center mb-6 min-h-[140px]">
                <RiskGauge score={escalationRisk.probability} />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-400 text-xs">Time to Critical</span>
                    </div>
                    <p className="text-slate-200 font-mono font-semibold">{escalationRisk.timeToCritical}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-400 text-xs">Model Confidence</span>
                    </div>
                    <p className="text-slate-200 font-mono font-semibold">{escalationRisk.confidence}%</p>
                </div>
            </div>

            {/* SHAP Explainability Section */}
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-slate-400" />
                    <h4 className="text-slate-300 text-sm font-semibold">Why This Prediction?</h4>
                </div>

                <div className="space-y-2.5">
                    {escalationRisk.predictionFactors.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'risk' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span>{item.factor}</span>
                            </div>
                            <span className={`font-mono font-bold ${item.type === 'risk' ? 'text-red-400' : 'text-green-400'}`}>
                                {item.impact > 0 ? '+' : ''}{item.impact}%
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/30 text-[10px] text-slate-500 text-center">
                    Based on XGBoost feature importance analysis
                </div>
            </div>
        </div>
    );
};

export default EscalationCard;
