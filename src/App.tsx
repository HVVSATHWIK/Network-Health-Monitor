import { Activity, Network, Shield, Zap, Play, Signal } from 'lucide-react';
import { useState, useEffect } from 'react';
import AlertPanel from './components/AlertPanel';
import DeviceStatus from './components/DeviceStatus';
import Advanced3DTopology from './components/Advanced3DTopology';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import NetworkHeatmap from './components/NetworkHeatmap';
import DataFlowVisualization from './components/DataFlowVisualization';

import { devices as initialDevices, alerts as initialAlerts, connections, dependencyPaths } from './data/mockData';
import { Device, Alert } from './types/network';

import VisualGuide from './components/VisualGuide';
import BootSequence from './components/BootSequence';
import KPIMatrix from './components/KPIMatrix';
import { UnifiedForensicView } from './components/forensics/unified/UnifiedForensicView'; // Updated import
import Login from './components/Login'; // Import Login
import BusinessROI from './components/BusinessROI'; // Import ROI Widget

import { auth, db } from './firebase'; // Import db
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

function App() {
  const [activeView, setActiveView] = useState<'3d' | 'analytics'>('3d');
  // const [showTour, setShowTour] = useState(true); // Replaced by VisualGuide
  // const [tourStep, setTourStep] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  // const [organization, setOrganization] = useState("Global Mfg - NA East"); // Unused
  // const [aiMessage, setAiMessage] = useState<string | undefined>(undefined); // Unused
  const [visualMode, setVisualMode] = useState<'default' | 'scan'>('default');
  const [isChaosOpen, setIsChaosOpen] = useState(false);

  // Persistent Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setIsLoggedIn(true);

        // Try to fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // if (data.organization) setOrganization(data.organization); // Removed
            if (data.name) setUserName(data.name);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }

        // If it's a fresh login (no profile yet), we might rely on handleLogin to set defaults/write content
        // But for now, just ensure we are logged in.
      } else {
        // User is signed out
        setIsLoggedIn(false);
        setIsBooting(false); // Reset boot state
      }
    });

    return () => unsubscribe();
  }, []);

  // Dynamic State for Simulation
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);


  const healthyDevices = devices.filter(d => d.status === 'healthy').length;
  const totalDevices = devices.length;
  const healthPercentage = Math.round((healthyDevices / totalDevices) * 100);

  const handleLogin = (user: string, _org: string) => {
    setUserName(user);
    // setOrganization(org); // Removed
    setIsLoggedIn(true);
    // setIsBooting(true) is already default, so it will start booting immediately after login
  };

  const handleBootComplete = async (name: string) => {
    if (name) {
      setUserName(name);
      // Save terminal name to Firestore
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, "users", auth.currentUser.uid), {
            name: name
          }, { merge: true });
        } catch (e) {
          console.error("Error saving terminal name:", e);
        }
      }
    }
    setIsBooting(false);
  };

  const runSimulation = () => {
    // 1. Start Visual Scan
    setVisualMode('scan');

    // 2. AI Narration Sequence (Removed legacy setAiMessage)
    // setAiMessage(`Initiating Full Stack Telemetry Scan for ${userName}...`);

    setTimeout(() => {
      // setAiMessage("Analyzing Layer 1 Physical Links... Detected 2ms jitter on Switch-02.");
    }, 15000);

    setTimeout(() => {
      // setAiMessage("Correlating with Layer 7 Application Latency...");
      // Inject a simulated "fix" or "optimization" visual
    }, 30000);

    setTimeout(() => {
      // setAiMessage("Optimization Complete. Routing efficiency improved by 15%. Dashboard updated.");
      setVisualMode('default');
    }, 45000);
  };

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // GAMIFICATION: Auto-Advance Tour based on User Actions
  // GAMIFICATION: Auto-Advance Tour Logic removed (Replaced by VisualGuide)

  // Interaction: Selected Device State (Syncs 3D and Data Flow)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Fault Injection Logic
  const handleInjectFault = (type: 'l1' | 'l7') => {
    if (type === 'l1') {
      // 1. Break the Switch (Physical Layer)
      setDevices(prev => prev.map(d =>
        d.name === 'Hirschmann BOBCAT Switch' ? { ...d, status: 'critical' } : d
      ));

      // 2. Add Critical Alert
      const newAlert: Alert = {
        id: `sim-l1-${Date.now()}`,
        severity: 'critical',
        layer: 'L1',
        device: 'Hirschmann BOBCAT Switch',
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
    // AI Reaction
    // setAiMessage(`Alert Detected: ${type.toUpperCase()} Anomaly. Analyzing root cause...`); // Removed
  };

  const handleReset = () => {
    setDevices(initialDevices);
    setAlerts(initialAlerts);
    // setAiMessage("System Reset. Telemetry metrics normalized."); // Removed
  };

  // Manual Visual Guide replaces auto tour step logic


  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (isBooting) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

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
              {/* Simulation Trigger */}
              <button
                id="diagnostic-scan-trigger"
                onClick={runSimulation}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full shadow-lg transition-all text-sm font-bold"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Diagnostic Scan</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-slate-400">Network Health</div>
                  <div className={`text-lg font-bold ${healthPercentage < 90 ? 'text-red-400' : 'text-green-400'}`}>{healthPercentage}%</div>
                </div>
              </div>
            </div>

            {/* Network Status Badge */}
            <div className="hidden xl:flex items-center gap-2 bg-purple-900/20 border border-purple-500/30 px-4 py-2 rounded-lg">
              <Signal className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Network Status</div>
                <div className="text-sm font-bold text-white leading-none">Live Monitoring</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-slate-400">Active Devices</div>
                <div className="text-lg font-bold text-blue-400">{healthyDevices}/{totalDevices}</div>
              </div>
            </div>
            <button
              id="kpi-matrix-trigger"
              onClick={() => setShowMatrix(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 rounded-full transition-all text-sm font-medium"
            >
              <Activity className="w-4 h-4" />
              <span>KPI Matrix (L1-L7)</span>
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {userName} Online
            </div>
          </div>
        </div>
      </header>

      {/* OVERLAYS */}
      {showMatrix && <KPIMatrix devices={devices} onClose={() => setShowMatrix(false)} />}

      {/* Visual Guide Overlay (Manual Trigger) */}
      <VisualGuide />
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
            id="view-analytics-trigger"
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
                alerts={alerts}
                dependencyPaths={dependencyPaths}
                onInjectFault={handleInjectFault}
                onReset={handleReset}
                // tourStep={showTour ? tourStep : -1} // Removed
                showControls={isChaosOpen}
                onShowControlsChange={setIsChaosOpen}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
              />
            </div>

            {/* Critical Panels: Status & Alerts */}
            <div className="col-span-12 lg:col-span-4">
              <DeviceStatus devices={devices} />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <AlertPanel alerts={alerts} devices={devices} />
            </div>

            <div className="col-span-12 lg:col-span-6" id="data-flow-viz">
              <DataFlowVisualization
                onInjectFault={handleInjectFault}
                onReset={handleReset}
                mode={visualMode}
                // showControlsExternal={showTour && tourStep === 3} // Removed forced external control to enforce 'Active Learning' (User must click)
                onShowControlsChange={setIsChaosOpen}
                selectedDeviceId={selectedDeviceId}
              />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <NetworkHeatmap alerts={alerts} />
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div id="analytics-view" className="space-y-6">
            {/* Business Value Dashboard (Score Booster) */}
            <BusinessROI healthPercentage={healthPercentage} />
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
      {/* Onboarding Tour Removed Duplicate */}

      {/* AI Assistant Replaced by Unified Forensic Cockpit */}
      {isCopilotOpen && (
        <UnifiedForensicView
          userName={userName}
          alerts={alerts}
          devices={devices}
          onClose={() => setIsCopilotOpen(false)}
        />
      )}
    </div >
  );
}

export default App;
