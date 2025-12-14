import { DollarSign, Leaf, ShieldCheck, PieChart } from 'lucide-react';

export default function BusinessROI({ healthPercentage }: { healthPercentage: number }) {
    // Mock Calculation based on health
    const downtimeAvoided = Math.round(450000 * (healthPercentage / 100)); // $450k value
    const energySaved = Math.round(1240 * (healthPercentage / 100)); // kWh
    const carbonOffset = Math.round(energySaved * 0.85); // kgCO2

    return (
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <div className="bg-purple-600/20 p-2 rounded-lg">
                    <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Value Realized</h3>
                    <p className="text-xs text-slate-400">Enterprise ROI Analysis (Monthly)</p>
                </div>
                <div className="ml-auto bg-purple-900/30 border border-purple-500/30 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-purple-300 tracking-wider">ENTERPRISE TIER</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Operational Efficiency (Money) */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-2 mb-2 text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Downtime Cost Avoided</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        ${(downtimeAvoided / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-slate-400">
                        Based on industry avg of <span className="text-slate-300">$5,600/min</span> downtime cost.
                    </div>
                </div>

                {/* 2. Sustainability (Eco) */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <Leaf className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Carbon Offset</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {carbonOffset} <span className="text-sm font-normal text-slate-400">kgCO2</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        Equivalent to <span className="text-slate-300">{Math.round(carbonOffset / 20)} trees</span> planted this month.
                    </div>
                </div>

                {/* 3. Risk Mitigation (Security) */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Risk Score</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        Low <span className="text-sm font-normal text-slate-400">(Top 5%)</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        Proactive monitoring prevented <span className="text-slate-300">14 critical incidents</span>.
                    </div>
                </div>
            </div>
        </div>
    );
}
