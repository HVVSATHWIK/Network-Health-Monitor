import { AlertTriangle, Server, Activity, ShieldCheck } from 'lucide-react';
import { kpiSummary } from '../../data/kpiMockData';

const GlobalSummaryBar = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Active Root Cause */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">Active Root Cause</h3>
                    <p className="text-red-400 font-bold text-lg mt-1">{kpiSummary.activeRootCause}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
            </div>

            {/* Devices Impacted */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">Devices Impacted</h3>
                    <p className="text-amber-400 font-bold text-2xl mt-1">{kpiSummary.devicesImpacted}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Server className="w-6 h-6 text-amber-500" />
                </div>
            </div>

            {/* Escalation Probability */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">Escalation Probability</h3>
                    <p className="text-orange-400 font-bold text-2xl mt-1">{kpiSummary.escalationProbability}%</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-500" />
                </div>
            </div>

            {/* System Health */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">System Health</h3>
                    <p className="text-emerald-400 font-bold text-2xl mt-1">{kpiSummary.systemHealth}%</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
            </div>
        </div>
    );
};

export default GlobalSummaryBar;
