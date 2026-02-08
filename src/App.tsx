import { Activity, Shield, Zap, Play, Signal, Terminal, Bot, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AlertPanel from './components/AlertPanel';
import DeviceStatus from './components/DeviceStatus';
import Advanced3DTopology from './components/Advanced3DTopology';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import NetworkHeatmap from './components/NetworkHeatmap';
import DataFlowVisualization from './components/DataFlowVisualization';
import ForensicCockpit from './components/forensics/ForensicCockpit';
import AICopilot from './components/AICopilot';

import { devices as initialDevices, alerts as initialAlerts, connections as initialConnections, dependencyPaths, layerKPIs } from './data/mockData';
import { Device, Alert, NetworkConnection } from './types/network';
import SmartLogPanel from './components/SmartLogPanel'; // Import SmartLogPanel
import { smartLogs } from './data/smartLogs'; // Import mock logs

import VisualGuide from './components/VisualGuide';
import BootSequence from './components/BootSequence';
import KPIMatrix from './components/KPIMatrix';
import { UnifiedForensicView } from './components/forensics/unified/UnifiedForensicView'; // Updated import
import Login from './components/Login'; // Import Login
import BusinessROI from './components/BusinessROI'; // Import ROI Widget
import LayerMenu from './components/LayerMenu'; // Import LayerMenu
import LayerOverview from './components/LayerOverview'; // Import LayerOverview
import AssetDetailPanel from './components/AssetDetailPanel'; // Import AssetDetailPanel
import { OTHealthCard } from './components/dashboard/OTHealthCard';
import { NetworkLoadCard } from './components/dashboard/NetworkLoadCard';
import { CorrelationTimelineCard } from './components/dashboard/CorrelationTimelineCard';

import { auth, db } from './firebase'; // Import db
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

function App() {
  const [activeView, setActiveView] = useState<'3d' | 'analytics' | 'layer' | 'logs'>('3d');
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const scanTimeoutsRef = useRef<number[]>([]);
  const [isForensicOpen, setIsForensicOpen] = useState(false);
  const [forensicSystemMessage, setForensicSystemMessage] = useState<string | undefined>(undefined);
  const [isNetMonitAIOpen, setIsNetMonitAIOpen] = useState(false);

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

  const cloneDevices = (source: Device[]) => source.map(d => ({
    ...d,
    metrics: {
      ...d.metrics,
      l1: { ...d.metrics.l1 },
      l2: { ...d.metrics.l2 },
      l3: { ...d.metrics.l3 },
      l4: { ...d.metrics.l4 },
      l5: { ...d.metrics.l5 },
      l6: { ...d.metrics.l6 },
      l7: { ...d.metrics.l7 },
    }
  }));

  const cloneAlerts = (source: Alert[]) => source.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp)
  }));

  const cloneConnections = (source: NetworkConnection[]) => source.map(c => ({ ...c }));

  // Dynamic State for Simulation
  const [devices, setDevices] = useState<Device[]>(() => cloneDevices(initialDevices));
  const [alerts, setAlerts] = useState<Alert[]>(() => cloneAlerts(initialAlerts));
  const [connections, setConnections] = useState<NetworkConnection[]>(() => cloneConnections(initialConnections));


  const healthyDevices = devices.filter(d => d.status === 'healthy').length;
  const totalDevices = devices.length;
  const healthPercentage = Math.round((healthyDevices / totalDevices) * 100);

  const handleLogin = (user: string, _org: string) => {
    setUserName(user);
    // setOrganization(org); // Removed
    setIsLoggedIn(true);
    setIsBooting(true);
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
    // Make the scan visible: DataFlowVisualization lives in the 3D view.
    setActiveView('3d');

    // Open the forensic scan modal and auto-run a "full stack" diagnosis.
    setForensicSystemMessage(`Initiate full stack diagnostic scan (L1–L7) for ${userName}.`);
    setIsForensicOpen(true);

    // Clear previous scan timers so repeated clicks behave predictably.
    scanTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    scanTimeoutsRef.current = [];

    // Force a restart so repeated clicks still visibly re-trigger scan mode.
    setVisualMode('default');
    scanTimeoutsRef.current.push(window.setTimeout(() => setVisualMode('scan'), 0));

    // Bring the scan visualization into view (wait a beat for the view to render).
    scanTimeoutsRef.current.push(window.setTimeout(() => {
      document.getElementById('data-flow-viz')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150));

    // 2. AI Narration Sequence (Removed legacy setAiMessage)
    // setAiMessage(`Initiating Full Stack Telemetry Scan for ${userName}...`);

    scanTimeoutsRef.current.push(window.setTimeout(() => {
      // setAiMessage("Analyzing Layer 1 Physical Links... Detected 2ms jitter on Switch-02.");
    }, 15000));

    scanTimeoutsRef.current.push(window.setTimeout(() => {
      // setAiMessage("Correlating with Layer 7 Application Latency...");
      // Inject a simulated "fix" or "optimization" visual
    }, 30000));

    scanTimeoutsRef.current.push(window.setTimeout(() => {
      // setAiMessage("Optimization Complete. Routing efficiency improved by 15%. Dashboard updated.");
      setVisualMode('default');
    }, 45000));
  };

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // GAMIFICATION: Auto-Advance Tour based on User Actions
  // GAMIFICATION: Auto-Advance Tour Logic removed (Replaced by VisualGuide)

  // Interaction: Selected Device State (Syncs 3D and Data Flow)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const handleLayerSelect = (layer: string) => {
    setSelectedLayer(layer);
    setActiveView('layer');
    setIsMenuOpen(false);
  };

  // Fault Injection Logic
  const handleInjectFault = (type: 'l1' | 'l7') => {
    const baseDevices = cloneDevices(initialDevices);
    const baseAlerts = cloneAlerts(initialAlerts);
    const baseConnections = cloneConnections(initialConnections);
    const now = Date.now();

    if (type === 'l1') {
      // Scenario: L1 physical failure on Access Switch (BOBCAT) that manifests as L3/L4/L7 symptoms.
      const nextDevices: Device[] = baseDevices.map((d): Device => {
        if (d.id === 'd10') {
          return {
            ...d,
            status: 'critical',
            metrics: {
              ...d.metrics,
              l1: { ...d.metrics.l1, temperature: 78, opticalRxPower: -32 },
              l2: { ...d.metrics.l2, crcErrors: 980, linkUtilization: 0, macFlapping: true },
              l3: { ...d.metrics.l3, packetLoss: 18.5 },
              l4: { ...d.metrics.l4, tcpRetransmissions: 0.12, jitter: 85 },
              l5: { ...d.metrics.l5, sessionResets: 28, sessionStability: 82.1 },
              l7: { ...d.metrics.l7, appLatency: 1200, protocolAnomaly: true }
            }
          };
        }

        // Downstream production impact
        if (d.id === 'd5') {
          return {
            ...d,
            status: 'warning',
            metrics: {
              ...d.metrics,
              l3: { ...d.metrics.l3, packetLoss: 3.6 },
              l4: { ...d.metrics.l4, tcpRetransmissions: 0.08, jitter: 42 },
              l5: { ...d.metrics.l5, sessionResets: 7, sessionStability: 94.1 },
              l7: { ...d.metrics.l7, appLatency: 1400, protocolAnomaly: true }
            }
          };
        }

        if (d.id === 'd3') {
          return {
            ...d,
            status: 'critical',
            metrics: {
              ...d.metrics,
              l3: { ...d.metrics.l3, packetLoss: 9.2 },
              l4: { ...d.metrics.l4, tcpRetransmissions: 0.14, jitter: 65 },
              l5: { ...d.metrics.l5, sessionResets: 16, sessionStability: 78.4 },
              l7: { ...d.metrics.l7, appLatency: 3200, protocolAnomaly: true }
            }
          };
        }

        if (d.id === 'd6' || d.id === 'd7') {
          return {
            ...d,
            status: 'warning',
            metrics: {
              ...d.metrics,
              l2: { ...d.metrics.l2, crcErrors: Math.max(d.metrics.l2.crcErrors, 12) },
              l3: { ...d.metrics.l3, packetLoss: Math.max(d.metrics.l3.packetLoss, 4.8) },
              l7: { ...d.metrics.l7, appLatency: Math.max(d.metrics.l7.appLatency, 220), protocolAnomaly: true }
            }
          };
        }

        if (d.id === 'd1') {
          // Core switch shows routing/transport symptoms even though root cause is L1 edge.
          return {
            ...d,
            status: 'warning',
            metrics: {
              ...d.metrics,
              l3: { ...d.metrics.l3, packetLoss: 2.4, routingTableSize: d.metrics.l3.routingTableSize + 40 },
              l4: { ...d.metrics.l4, tcpRetransmissions: 0.04, jitter: 18 },
            }
          };
        }

        return d;
      });

      const nextConnections: NetworkConnection[] = baseConnections.map((c): NetworkConnection => {
        if (c.id === 'c2') return { ...c, status: 'down', latency: 0, bandwidth: 0 };
        if (c.id === 'c7' || c.id === 'c8' || c.id === 'c9') return { ...c, status: 'down', latency: 0, bandwidth: 0 };
        if (c.id === 'c3') return { ...c, status: 'degraded', latency: 14, bandwidth: Math.max(120, Math.round(c.bandwidth * 0.6)) };
        return c;
      });

      const simAlerts: Alert[] = [
        {
          id: `sim-l1-${now}-a`,
          severity: 'critical',
          layer: 'L1',
          device: 'Hirschmann BOBCAT Switch',
          message: 'Fiber link down on Port 4 (Optical RX < -30 dBm) — physical disconnect suspected',
          timestamp: new Date(),
          aiCorrelation: 'Primary fault likely at L1. Expect secondary symptoms at L3 (loss) and L4 (timeouts) across OT cells.'
        },
        {
          id: `sim-l1-${now}-b`,
          severity: 'high',
          layer: 'L2',
          device: 'Hirschmann BOBCAT Switch',
          message: 'CRC error storm + MAC flapping detected — unstable physical medium',
          timestamp: new Date(),
          aiCorrelation: 'L2 anomalies coincide with L1 optical power drop; treat L3 alarms as downstream effects.'
        },
        {
          id: `sim-l1-${now}-c`,
          severity: 'high',
          layer: 'L3',
          device: 'Hirschmann DRAGON MACH4x00',
          message: 'Packet loss spike and route churn observed for Zone A/Zone B subnets',
          timestamp: new Date(),
          aiCorrelation: 'This can look like routing/firewall issues, but correlation points back to edge physical instability.'
        },
        {
          id: `sim-l1-${now}-d`,
          severity: 'high',
          layer: 'L4',
          device: 'Lion-M PLC Node A',
          message: 'TCP retransmissions/timeouts rising — control loop reliability degraded',
          timestamp: new Date(),
          aiCorrelation: 'Transport reliability degradation aligns with L1/L2 faults upstream of the PLC segment.'
        },
        {
          id: `sim-l1-${now}-e`,
          severity: 'high',
          layer: 'L7',
          device: 'SCADA Control Loop',
          message: 'SCADA command latency elevated; intermittent protocol anomalies',
          timestamp: new Date(),
          aiCorrelation: 'Application symptoms are secondary. Mitigate by restoring physical link and validating switch port optics.'
        }
      ];

      setDevices(nextDevices);
      setConnections(nextConnections);
      setAlerts([...simAlerts, ...baseAlerts.filter(a => !a.id.startsWith('sim-'))]);
      return;
    }

    if (type === 'l7') {
      // Scenario: L7 server-side latency/timeout with clean lower layers.
      const nextDevices: Device[] = baseDevices.map((d): Device => {
        if (d.id === 'd5') {
          return {
            ...d,
            status: 'warning',
            metrics: {
              ...d.metrics,
              l4: { ...d.metrics.l4, tcpRetransmissions: 0.06, jitter: 12 },
              l5: { ...d.metrics.l5, sessionResets: 12, sessionStability: 93.8 },
              l6: { ...d.metrics.l6, tlsHandshakeFailures: 6, encryptionOverheadMs: 7 },
              l7: { ...d.metrics.l7, appLatency: 5200, protocolAnomaly: true },
            }
          };
        }

        if (d.id === 'd3' || d.id === 'd4') {
          // Controllers perceive lag but physical layer stays healthy.
          return {
            ...d,
            status: 'warning',
            metrics: {
              ...d.metrics,
              l4: { ...d.metrics.l4, tcpRetransmissions: Math.max(d.metrics.l4.tcpRetransmissions, 0.05), jitter: Math.max(d.metrics.l4.jitter, 22) },
              l5: { ...d.metrics.l5, sessionResets: Math.max(d.metrics.l5.sessionResets, 5), sessionStability: Math.min(d.metrics.l5.sessionStability, 95.5) },
              l7: { ...d.metrics.l7, appLatency: Math.max(d.metrics.l7.appLatency, 900) }
            }
          };
        }

        return d;
      });

      const nextConnections: NetworkConnection[] = baseConnections.map((c): NetworkConnection => {
        if (c.id === 'c7') return { ...c, status: 'degraded', latency: 120, bandwidth: Math.max(80, Math.round(c.bandwidth * 0.4)) };
        return c;
      });

      const simAlerts: Alert[] = [
        {
          id: `sim-l7-${now}-a`,
          severity: 'high',
          layer: 'L7',
          device: 'SCADA Control Loop',
          message: 'Response time > 5000ms; command acknowledgements delayed',
          timestamp: new Date(),
          aiCorrelation: 'L1–L3 telemetry remains nominal; likely application/service-side contention or overloaded control runtime.'
        },
        {
          id: `sim-l7-${now}-b`,
          severity: 'medium',
          layer: 'L5',
          device: 'SCADA Control Loop',
          message: 'Session instability: frequent reconnects observed',
          timestamp: new Date(),
          aiCorrelation: 'Sessions reset due to delayed responses rather than transport loss. Validate SCADA service health and thread saturation.'
        },
        {
          id: `sim-l7-${now}-c`,
          severity: 'medium',
          layer: 'L4',
          device: 'Lion-M PLC Node A',
          message: 'Transport retries increasing (client-side timeouts)',
          timestamp: new Date(),
          aiCorrelation: 'Retries driven by slow application responses; lower layers are stable (no L1/L2 error storm).'
        }
      ];

      setDevices(nextDevices);
      setConnections(nextConnections);
      setAlerts([...simAlerts, ...baseAlerts.filter(a => !a.id.startsWith('sim-'))]);
      return;
    }
    // AI Reaction
    // setAiMessage(`Alert Detected: ${type.toUpperCase()} Anomaly. Analyzing root cause...`); // Removed
  };

  const handleReset = () => {
    setDevices(cloneDevices(initialDevices));
    setAlerts(cloneAlerts(initialAlerts));
    setConnections(cloneConnections(initialConnections));
    // setAiMessage("System Reset. Telemetry metrics normalized."); // Removed
  };

  const handleAddDevice = (newDevice: Device, parentId?: string) => {
    setDevices(prev => [...prev, newDevice]);

    if (parentId) {
      const newConnection: NetworkConnection = {
        id: `c-${Date.now()}`,
        source: parentId,
        target: newDevice.id,
        status: 'healthy',
        bandwidth: 1000, // Default 1Gbps
        latency: 1,      // Default 1ms
      };
      setConnections(prev => [...prev, newConnection]);
    }
  };

  // Manual Visual Guide replaces auto tour step logic
  // ... (keeping existing logic if matches context, or just target handleReset end)

  // ... skip to JSX ...

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (isBooting) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-2xl">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <img src="/favicon.svg" alt="NetMonit network monitoring system logo" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">NetMonit</h1>
                <p className="text-sm text-slate-300">Network Monitoring System</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              {/* Simulation Trigger */}
              <button
                id="diagnostic-scan-trigger"
                onClick={runSimulation}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg transition-all text-sm font-bold ${visualMode === 'scan'
                  ? 'opacity-90'
                  : 'hover:from-purple-500 hover:to-blue-500'
                  }`}
              >
                <Play className={`w-4 h-4 fill-current ${visualMode === 'scan' ? 'animate-pulse' : ''}`} />
                <span>{visualMode === 'scan' ? 'Scanning…' : 'Run Diagnostic Scan'}</span>
              </button>

              <button
                id="forensic-cockpit-trigger"
                onClick={() => setIsCopilotOpen(true)}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full shadow-lg transition-all text-sm font-semibold"
              >
                <Terminal className="w-4 h-4" />
                <span>Forensic Cockpit</span>
              </button>

              <button
                id="netmonit-ai-trigger"
                onClick={() => setIsNetMonitAIOpen(true)}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full shadow-lg transition-all text-sm font-semibold"
              >
                <Bot className="w-4 h-4" />
                <span>NetMonit AI</span>
              </button>

              <div id="network-health-badge" className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg whitespace-nowrap">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-slate-400">Network Health</div>
                  <div className={`text-lg font-bold ${healthPercentage < 90 ? 'text-red-400' : 'text-green-400'}`}>{healthPercentage}%</div>
                </div>
              </div>

              {/* Network Status Badge (de-emphasized + only on wide screens) */}
              <div className="hidden 2xl:flex items-center gap-2 bg-purple-900/20 border border-purple-500/30 px-4 py-2 rounded-lg whitespace-nowrap">
                <Signal className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Network Status</div>
                  <div className="text-sm font-bold text-white leading-none">Live Monitoring</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg whitespace-nowrap">
                <Activity className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Active Devices</div>
                  <div className="text-lg font-bold text-blue-400">{healthyDevices}/{totalDevices}</div>
                </div>
              </div>
              <button
                id="kpi-matrix-trigger"
                onClick={() => setShowMatrix(true)}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 rounded-full transition-all text-sm font-medium"
              >
                <Activity className="w-4 h-4" />
                <span>KPI Matrix</span>
              </button>

              <div className="flex items-center">
                <VisualGuide />
              </div>
              <div className="hidden xl:block w-px h-6 bg-slate-700 mx-1"></div>
              <div className="flex items-center gap-2 text-sm text-slate-400 whitespace-nowrap max-w-[220px]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="truncate">{userName}</span>
                <span className="hidden xl:inline">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <LayerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectLayer={handleLayerSelect}
        selectedLayer={selectedLayer}
      />

      {/* Global Device Detail Overlay */}
      {selectedDeviceId && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
          {/* Click backdrop to close */}
          <div className="absolute inset-0" onClick={() => setSelectedDeviceId(null)}></div>

          <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-700 shadow-2xl relative z-10 animate-in slide-in-from-right duration-300">
            <AssetDetailPanel
              device={devices.find(d => d.id === selectedDeviceId)!}
              connections={connections}
              devices={devices}
              onClose={() => setSelectedDeviceId(null)}
              onInjectFault={(id) => handleInjectFault(devices.find(d => d.id === id)?.category === 'OT' ? 'l1' : 'l7')}
            />
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {showMatrix && <KPIMatrix devices={devices} onClose={() => setShowMatrix(false)} />}

      {/* Visual Guide Overlay (Manual Trigger) */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6 bg-slate-900/50 border border-slate-800 rounded-lg p-1.5 backdrop-blur-sm w-fit shadow-lg">
          <button
            id="view-3d-trigger"
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
          <button
            id="view-logs-trigger"
            onClick={() => setActiveView('logs')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeView === 'logs'
              ? 'bg-slate-700 text-white shadow-lg border border-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Terminal className="w-4 h-4" />
            System Logs
          </button>
        </div>

        {
          activeView === 'layer' && selectedLayer && (
            <LayerOverview
              selectedLayer={selectedLayer}
              devices={devices}
              kpis={layerKPIs} // Use renamed import or just import layerKPIs from data
              onSelectDevice={setSelectedDeviceId}
            />
          )
        }

        {
          activeView === '3d' && (
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
                  onAddDevice={handleAddDevice}
                />
              </div>

              {/* New Analysis Cards */}
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <OTHealthCard />
                <NetworkLoadCard />
                <CorrelationTimelineCard />
              </div>

              {/* Critical Panels: Status & Alerts */}
              <div className="col-span-12 lg:col-span-4">
                <DeviceStatus
                  devices={devices}
                  connections={connections}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={setSelectedDeviceId}
                  onInjectFault={(id: string) => handleInjectFault(devices.find(d => d.id === id)?.category === 'OT' ? 'l1' : 'l7')}
                />
              </div>
              <div className="col-span-12 lg:col-span-8">
                <AlertPanel alerts={alerts} devices={devices} />
              </div>

              <div className="col-span-12 lg:col-span-6" id="data-flow-viz">
                <DataFlowVisualization
                  mode={visualMode}
                  // showControlsExternal={showTour && tourStep === 3} // Removed forced external control to enforce 'Active Learning' (User must click)
                  selectedDevice={devices.find(d => d.id === selectedDeviceId) ?? null}
                />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <NetworkHeatmap alerts={alerts} />
              </div>
            </div>
          )
        }

        {
          activeView === 'analytics' && (
            <div id="analytics-view" className="space-y-6">
              {/* Business Value Dashboard (Score Booster) */}
              <BusinessROI healthPercentage={healthPercentage} />
              <AdvancedAnalytics />
            </div>
          )
        }

        {
          activeView === 'logs' && (
            <div className="h-[calc(100vh-140px)]">
              <SmartLogPanel logs={smartLogs} />
            </div>
          )
        }



        <footer className="mt-6 text-center text-sm text-slate-600 bg-slate-900/80 border-t border-slate-800 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-8">
            <span>NetMonit - Network Monitoring System</span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-500" />
              System Status: {healthyDevices === totalDevices ? 'Operational' : 'Degraded'}
            </span>
          </div>
        </footer>

        {/* Floating Chaos Control Panel moved inside 3D Topology */}
      </main >
      {/* Onboarding Tour Removed Duplicate */}

      {/* AI Assistant Replaced by Unified Forensic Cockpit */}
      {
        isCopilotOpen && (
          <UnifiedForensicView
            userName={userName}
            alerts={alerts}
            devices={devices}
            onClose={() => setIsCopilotOpen(false)}
          />
        )
      }

      {/* NetMonitAI Assistant (floating button + chat panel) */}
      <AICopilot
        userName={userName}
        alerts={alerts}
        devices={devices}
        isOpen={isNetMonitAIOpen}
        onOpenChange={setIsNetMonitAIOpen}
      />

      {/* Diagnostic Scan Forensic Console (only mounted when open to avoid extra launcher UI) */}
      {
        isForensicOpen && (
          <ForensicCockpit
            userName={userName}
            alerts={alerts}
            devices={devices}
            isOpen={isForensicOpen}
            onOpenChange={setIsForensicOpen}
            systemMessage={forensicSystemMessage}
          />
        )
      }
    </div >
  );
}

export default App;
