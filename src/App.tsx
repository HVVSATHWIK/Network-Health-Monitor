import { Activity, Network, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import AlertPanel from './components/AlertPanel';
import DeviceStatus from './components/DeviceStatus';
import Advanced3DTopology from './components/Advanced3DTopology';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import NetworkHeatmap from './components/NetworkHeatmap';
import DataFlowVisualization from './components/DataFlowVisualization';

import { devices as initialDevices, alerts as initialAlerts, connections, dependencyPaths } from './data/mockData';
import { Device, Alert } from './types/network';

function App() {
  const [activeView, setActiveView] = useState<'3d' | 'analytics'>('3d');

  // Dynamic State for Simulation
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const healthyDevices = devices.filter(d => d.status === 'healthy').length;
  const totalDevices = devices.length;
  const healthPercentage = Math.round((healthyDevices / totalDevices) * 100);

  // Fault Injection Logic
  const handleInjectFault = (type: 'l1' | 'l7') => {
    if (type === 'l1') {
      // 1. Break the Switch (Physical Layer)
      setDevices(prev => prev.map(d =>
        d.name === 'Access Switch 02' ? { ...d, status: 'critical' } : d
      ));

      // 2. Add Critical Alert
      const newAlert: Alert = {
        id: `sim-l1-${Date.now()}`,
        severity: 'critical',
        layer: 'L1',
        device: 'Access Switch 02',
        message: 'Port 4 Link Down (CRC Errors > 90%)',
        timestamp: new Date()
      };
      setAlerts(prev => [newAlert, ...prev]);
    }
    else if (type === 'l7') {
      // 1. Lag the Server (Application Layer)
      setDevices(prev => prev.map(d =>
        d.type === 'scada' ? { ...d, status: 'warning' } : d
      ));

      // 2. Add High Latency Alert
      const newAlert: Alert = {
        id: `sim-l7-${Date.now()}`,
        severity: 'high',
        layer: 'L7',
        device: 'SCADA Control Loop', // Matches dependency path appName
        message: 'Response Time > 5000ms (Timeout)',
        timestamp: new Date()
      };
      setAlerts(prev => [newAlert, ...prev]);
    }
  };

  const handleReset = () => {
    setDevices(initialDevices);
    setAlerts(initialAlerts);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-2xl">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Network className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">NetMonit</h1>
                <p className="text-sm text-slate-300">Network Health Monitor</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-slate-400">Network Health</div>
                  <div className={`text-lg font-bold ${healthPercentage < 90 ? 'text-red-400' : 'text-green-400'}`}>{healthPercentage}%</div>
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
        <div className="flex gap-2 mb-6 bg-slate-900/50 border border-slate-800 rounded-lg p-1.5 backdrop-blur-sm w-fit shadow-lg">
          <button
            onClick={() => setActiveView('3d')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeView === '3d'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Zap className="w-4 h-4" />
            3D Topology
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeView === 'analytics'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            Analytics
          </button>
        </div>

        {activeView === '3d' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <Advanced3DTopology
                devices={devices}
                connections={connections}
                onInjectFault={handleInjectFault}
                onReset={handleReset}
              />
            </div>

            {/* Critical Panels: Status & Alerts */}
            <div className="col-span-12 lg:col-span-4">
              <DeviceStatus devices={devices} />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <AlertPanel alerts={alerts} devices={devices} dependencyPaths={dependencyPaths} />
            </div>

            <div className="col-span-12 lg:col-span-6">
              <DataFlowVisualization onInjectFault={handleInjectFault} onReset={handleReset} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <NetworkHeatmap alerts={alerts} />
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div>
            <AdvancedAnalytics />
          </div>
        )}



        <footer className="mt-6 text-center text-sm text-slate-600 bg-slate-900/80 border-t border-slate-800 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-8">
            <span>NetMonit - Network Health Monitor</span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-500" />
              System Status: {healthyDevices === totalDevices ? 'Operational' : 'Degraded'}
            </span>
          </div>
        </footer>

        {/* Floating Chaos Control Panel moved inside 3D Topology */}
      </main>
    </div>
  );
}

export default App;
