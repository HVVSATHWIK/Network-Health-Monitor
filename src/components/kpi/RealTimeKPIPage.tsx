import GlobalSummaryBar from './GlobalSummaryBar';
import LayerSeverityChart from './LayerSeverityChart';
import PropagationFlow from './PropagationFlow';
import EscalationCard from './EscalationCard';
import TrendAnalysisGraph from './TrendAnalysisGraph';

const RealTimeKPIPage = () => {
    return (
        <div className="h-full w-full p-6 bg-slate-950 overflow-y-auto custom-scrollbar">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Real-Time KPI & Escalation Intelligence</h1>
                <p className="text-slate-400">Live telemetry analysis, root cause propagation, and predictive escalation risk.</p>
            </div>

            {/* Top Section: Global Metrics */}
            <GlobalSummaryBar />

            {/* Middle Section: 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 h-auto lg:min-h-[450px]">

                {/* Left: Layer Severity (3 cols) */}
                <div className="lg:col-span-3 h-[400px] lg:h-full">
                    <LayerSeverityChart />
                </div>

                {/* Center: Propagation Flow (6 cols) */}
                <div className="lg:col-span-5 h-[400px] lg:h-full">
                    <PropagationFlow />
                </div>

                {/* Right: Escalation Intelligence (3 cols) */}
                <div className="lg:col-span-4 h-[400px] lg:h-full">
                    <EscalationCard />
                </div>
            </div>

            {/* Bottom Section: Trend Graph */}
            <div className="h-[350px] w-full mb-6">
                <TrendAnalysisGraph />
            </div>
        </div>
    );
};

export default RealTimeKPIPage;
