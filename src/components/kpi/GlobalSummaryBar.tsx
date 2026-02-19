import { AlertTriangle, Server, Activity, ShieldCheck } from 'lucide-react';
import { kpiSummary, type KPIData } from '../../data/kpiMockData';

interface GlobalSummaryBarProps {
    data?: KPIData;
}

const GlobalSummaryBar = ({ data = kpiSummary }: GlobalSummaryBarProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Active Root Cause */}
            <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 p-4 rounded-xl flex items-center justify-between ring-1 ring-white/5">
                <div>
                    <h3 className="text-gunmetal-400 text-xs font-mono uppercase tracking-widest">Active Root Cause</h3>
                    <p className="text-alert-critical font-sans font-bold text-lg mt-1 tracking-tight">{data.activeRootCause}</p>
                </div>
                <div className="p-3 bg-alert-critical/10 rounded-lg border border-alert-critical/20">
                    <AlertTriangle className="w-6 h-6 text-alert-critical" />
                </div>
            </div>

            {/* Devices Impacted */}
            <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 p-4 rounded-xl flex items-center justify-between ring-1 ring-white/5">
                <div>
                    <h3 className="text-gunmetal-400 text-xs font-mono uppercase tracking-widest">Devices Impacted</h3>
                    <p className="text-alert-warning font-mono font-semibold text-2xl mt-1 tabular-nums">{data.devicesImpacted}</p>
                </div>
                <div className="p-3 bg-alert-warning/10 rounded-lg border border-alert-warning/20">
                    <Server className="w-6 h-6 text-alert-warning" />
                </div>
            </div>

            {/* Escalation Probability */}
            <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 p-4 rounded-xl flex items-center justify-between ring-1 ring-white/5">
                <div>
                    <h3 className="text-gunmetal-400 text-xs font-mono uppercase tracking-widest">Escalation Estimate</h3>
                    <p className="text-alert-warning font-mono font-semibold text-2xl mt-1 tabular-nums">{data.escalationProbability}%</p>
                </div>
                <div className="p-3 bg-alert-warning/10 rounded-lg border border-alert-warning/20">
                    <Activity className="w-6 h-6 text-alert-warning" />
                </div>
            </div>

            {/* System Health */}
            <div className="bg-gunmetal-900/45 backdrop-blur-md border border-gunmetal-700/70 p-4 rounded-xl flex items-center justify-between ring-1 ring-white/5">
                <div>
                    <h3 className="text-gunmetal-400 text-xs font-mono uppercase tracking-widest">System Health</h3>
                    <p className="text-alert-success font-mono font-semibold text-2xl mt-1 tabular-nums">{data.systemHealth}%</p>
                </div>
                <div className="p-3 bg-alert-success/10 rounded-lg border border-alert-success/20">
                    <ShieldCheck className="w-6 h-6 text-alert-success" />
                </div>
            </div>
        </div>
    );
};

export default GlobalSummaryBar;
