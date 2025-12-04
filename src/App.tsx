import { Activity, Network, Shield } from 'lucide-react';
import KPICard from './components/KPICard';
import AlertPanel from './components/AlertPanel';
import DeviceStatus from './components/DeviceStatus';
import NetworkTopology from './components/NetworkTopology';
import AIInsights from './components/AIInsights';
import LayerOverview from './components/LayerOverview';
import { devices, layerKPIs, alerts, connections } from './data/mockData';

function App() {
  const healthyDevices = devices.filter(d => d.status === 'healthy').length;
  const totalDevices = devices.length;
  const healthPercentage = Math.round((healthyDevices / totalDevices) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Network className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Network Health Monitor</h1>
                <p className="text-sm text-slate-300">IT/OT Convergence Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-slate-400">Network Health</div>
                  <div className="text-lg font-bold text-green-400">{healthPercentage}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Active Devices</div>
                  <div className="text-lg font-bold text-blue-400">{healthyDevices}/{totalDevices}</div>
                </div>
              </div>
              <div className="text-sm text-slate-400">
                Last updated: <span className="text-white font-medium">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <LayerOverview kpis={layerKPIs} />
          </div>

          <div className="col-span-12 lg:col-span-8">
            <NetworkTopology devices={devices} connections={connections} />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <DeviceStatus devices={devices} />
          </div>

          <div className="col-span-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Layer KPI Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {layerKPIs.map((kpi, idx) => (
                  <KPICard key={idx} kpi={kpi} />
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <AlertPanel alerts={alerts} />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <AIInsights />
          </div>
        </div>

        <footer className="mt-6 text-center text-sm text-slate-600 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center gap-8">
            <span>Powered by Belden Industrial Connectivity Solutions</span>
            <span className="text-slate-400">|</span>
            <span>Hirschmann • EAGLE • BHNO Platform</span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-500" />
              System Status: Operational
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
