import { Activity, Shield, Play, Terminal, Bot, Menu, Boxes, LineChart, Gauge, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import AlertPanel from './components/AlertPanel';
import DeviceStatus from './components/DeviceStatus';
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy-loaded view components (code-split)
const Advanced3DTopology = lazy(() => import('./components/Advanced3DTopology'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const NetworkHeatmap = lazy(() => import('./components/NetworkHeatmap'));
const DataFlowVisualization = lazy(() => import('./components/DataFlowVisualization'));
const ForensicCockpit = lazy(() => import('./components/forensics/ForensicCockpit'));
const AICopilot = lazy(() => import('./components/AICopilot'));
const SmartLogPanel = lazy(() => import('./components/SmartLogPanel'));
const RealTimeKPIPage = lazy(() => import('./components/kpi/RealTimeKPIPage'));
const BusinessROI = lazy(() => import('./components/BusinessROI'));

import { Device, NetworkConnection } from './types/network';
import type { AIMonitoringEvent } from './components/SmartLogPanel';
import { smartLogs } from './data/smartLogs';
import { useNetworkStore } from './store/useNetworkStore';
import { NetworkSimulation } from './services/SimulationService';

import VisualGuide from './components/VisualGuide';
import BootSequence from './components/BootSequence';
import KPIMatrix from './components/KPIMatrix';
import Login from './components/Login';
import LayerMenu from './components/LayerMenu';
import LayerOverview from './components/LayerOverview';
import AssetDetailPanel from './components/AssetDetailPanel';
import { OTHealthCard } from './components/dashboard/OTHealthCard';
import { NetworkLoadCard } from './components/dashboard/NetworkLoadCard';
import { CorrelationTimelineCard } from './components/dashboard/CorrelationTimelineCard';
import { TimeRangeSelector } from './components/dashboard/TimeRangeSelector';
import { TIME_RANGE_PRESETS, type TimeRange } from './components/dashboard/timeRangePresets';
import { DataImporter } from './components/DataImporter';
import {
  analyzeWithMultiAgents,
  buildAIMonitoringSnapshot,
} from './utils/aiLogic';

import { auth, db } from './firebase'; // Import db
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const getFirebaseErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as Record<string, unknown>;
  const code = record.code;
  return typeof code === 'string' ? code : undefined;
};

function App() {
  const [activeView, setActiveView] = useState<'3d' | 'analytics' | 'layer' | 'logs' | 'kpi'>('3d');
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [visualMode, setVisualMode] = useState<'default' | 'scan'>('default');
  const [isChaosOpen, setIsChaosOpen] = useState(false);
  const scanTimeoutsRef = useRef<number[]>([]);
  const [isForensicOpen, setIsForensicOpen] = useState(false);
  const [forensicSystemMessage, setForensicSystemMessage] = useState<string | undefined>(undefined);
  const [isNetMonitAIOpen, setIsNetMonitAIOpen] = useState(false);
  const [aiSystemMessage, setAiSystemMessage] = useState<string | undefined>(undefined);

  // Time Range State
  const [timeRange, setTimeRange] = useState<TimeRange>({ ...TIME_RANGE_PRESETS[2] }); // Default to '1h' so initial alerts don't age out

  // Persistent Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setIsLoggedIn(true);
        setUserName(user.displayName || user.email || 'Authenticated User');

        // Try to fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // if (data.organization) setOrganization(data.organization); // Removed
            if (data.name) setUserName(data.name);
          }
        } catch (error) {
          const code = getFirebaseErrorCode(error);
          if (import.meta.env.DEV) {
            if (code === 'permission-denied') {
              console.warn('Firestore users profile read denied by security rules. Using auth profile fallback.');
            } else {
              console.error("Error fetching user profile:", error);
            }
          }
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

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setIsBooting(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Sign out failed:', error);
    }
  };

  // Lifecycle: Start/Stop Simulation
  useEffect(() => {
    NetworkSimulation.startSimulation(3000); // Update every 3 seconds
    return () => NetworkSimulation.stopSimulation();
  }, []);

  // Dynamic State for Simulation - MIGRATED TO ZUSTAND
  const devices = useNetworkStore((state) => state.devices);
  const alerts = useNetworkStore((state) => state.alerts);
  const connections = useNetworkStore((state) => state.connections);
  const layerKPIs = useNetworkStore((state) => state.layerKPIs);
  const dependencyPaths = useNetworkStore((state) => state.dependencyPaths);
  const addDevice = useNetworkStore((state) => state.addDevice);
  const addConnection = useNetworkStore((state) => state.addConnection);
  const addAlert = useNetworkStore((state) => state.addAlert);
  const setAlerts = useNetworkStore((state) => state.setAlerts);
  const resetSystem = useNetworkStore((state) => state.resetSystem);
  const injectFault = useNetworkStore((state) => state.injectFault);
  const [aiMonitoringTimeline, setAiMonitoringTimeline] = useState<AIMonitoringEvent[]>([]);
  const aiEnrichmentInFlight = useRef(false);


  const healthyDevices = useMemo(() => devices.filter(d => d.status === 'healthy').length, [devices]);
  const totalDevices = devices.length;
  const healthPercentage = useMemo(() => Math.round((healthyDevices / totalDevices) * 100), [healthyDevices, totalDevices]);
  const aiMonitoringSnapshot = useMemo(() => buildAIMonitoringSnapshot(alerts, devices, connections, layerKPIs, dependencyPaths), [alerts, devices, connections, layerKPIs, dependencyPaths]);

  useEffect(() => {
    if (aiEnrichmentInFlight.current) return;

    const nextAlert = alerts.find((alert) => !alert.aiCorrelation || alert.aiCorrelation.trim().length === 0);
    if (!nextAlert) return;

    aiEnrichmentInFlight.current = true;

    void (async () => {
      try {
        const result = await analyzeWithMultiAgents(
          `Analyze root cause and impact for ${nextAlert.device}: ${nextAlert.message}`,
          null,
          alerts,
          devices,
          connections,
          dependencyPaths,
          () => { }
        );

        const summary = typeof result === 'string' ? result : result.summary;
        const normalizedSummary = summary.replace(/\s+/g, ' ').trim();

        if (!normalizedSummary) return;

        const status: AIMonitoringEvent['status'] = normalizedSummary.toLowerCase().includes('quota reached')
          ? 'quota_limited'
          : 'success';

        setAiMonitoringTimeline((prev) => {
          const next: AIMonitoringEvent[] = [
            ...prev,
            {
              id: `ai-${nextAlert.id}-${Date.now()}`,
              timestamp: Date.now(),
              status,
              layer: nextAlert.layer,
              device: nextAlert.device,
              detail: normalizedSummary,
            },
          ];
          return next.slice(-50);
        });

        setAlerts(
          alerts.map((alert) =>
            alert.id === nextAlert.id
              ? { ...alert, aiCorrelation: normalizedSummary }
              : alert
          )
        );
      } catch (error) {
        if (import.meta.env.DEV) console.error('AI enrichment failed:', error);
        setAiMonitoringTimeline((prev) => {
          const next: AIMonitoringEvent[] = [
            ...prev,
            {
              id: `ai-error-${nextAlert.id}-${Date.now()}`,
              timestamp: Date.now(),
              status: 'error',
              layer: nextAlert.layer,
              device: nextAlert.device,
              detail: 'AI enrichment failed for this alert. Review connectivity or quota state.',
            },
          ];
          return next.slice(-50);
        });
      } finally {
        aiEnrichmentInFlight.current = false;
      }
    })();
  }, [alerts, devices, connections, dependencyPaths, setAlerts]);

  // Filter Alerts based on Time Range
  const filteredAlerts = useMemo(() => alerts.filter(alert => {
    const alertTime = new Date(alert.timestamp).getTime();
    if (timeRange.value === 'custom' && timeRange.start && timeRange.end) {
      return alertTime >= timeRange.start.getTime() && alertTime <= timeRange.end.getTime();
    }

    // Relative times
    const now = Date.now();
    let cutoff = 0;

    switch (timeRange.value) {
      case '10m': cutoff = now - 10 * 60 * 1000; break;
      case '30m': cutoff = now - 30 * 60 * 1000; break;
      case '1h': cutoff = now - 60 * 60 * 1000; break;
      case '3h': cutoff = now - 3 * 60 * 60 * 1000; break;
      case '6h': cutoff = now - 6 * 60 * 60 * 1000; break;
      case '12h': cutoff = now - 12 * 60 * 60 * 1000; break;
      case '24h': cutoff = now - 24 * 60 * 60 * 1000; break;
      case '2d': cutoff = now - 2 * 24 * 60 * 60 * 1000; break;
      case '3d': cutoff = now - 3 * 24 * 60 * 60 * 1000; break;
      case '1w': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
      case '1mo': cutoff = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoff = 0; // Show all if unknown (or maybe specific default)
    }

    return alertTime >= cutoff;
  }), [alerts, timeRange]);

  const handleLogin = (user: string, _org: string) => {
    void _org;
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
          const code = getFirebaseErrorCode(e);
          if (import.meta.env.DEV) {
            if (code === 'permission-denied') {
              console.warn('Firestore users profile write denied by security rules.');
            } else {
              console.error("Error saving terminal name:", e);
            }
          }
        }
      }
    }
    setIsBooting(false);
  };

  const runSimulation = () => {
    // Make the scan visible: DataFlowVisualization lives in the 3D view.
    setActiveView('3d');

    // Open the forensic scan modal and auto-run a "full stack" diagnosis.
    const unhealthyCount = devices.filter((d) => d.status !== 'healthy').length;
    const degradedLinks = connections.filter((c) => c.status !== 'healthy').length;
    const recentAlerts = filteredAlerts.slice(0, 3).map((a) => `${a.device} (${a.layer}) ${a.message}`).join(' | ');
    setForensicSystemMessage(
      `Initiate full stack diagnostic scan (L1–L7) for ${userName}. ` +
      `Live state: alerts=${filteredAlerts.length}, unhealthyDevices=${unhealthyCount}, degradedLinks=${degradedLinks}. ` +
      `${recentAlerts ? `Recent alerts: ${recentAlerts}. ` : ''}` +
      `Scan request id: ${Date.now()}.`
    );
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

    // 2. Scan narration removed (was legacy setAiMessage)

    scanTimeoutsRef.current.push(window.setTimeout(() => {
      setVisualMode('default');
    }, 45000));
  };

  const runRootCauseAnalysis = () => {
    setActiveView('3d');

    const recencyWindowMs = 10 * 60 * 1000;
    const now = Date.now();
    const severityRank: Record<'critical' | 'high' | 'medium' | 'low' | 'info', number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    const recentActionableAlerts = filteredAlerts
      .filter((a) => {
        const ts = new Date(a.timestamp).getTime();
        return Number.isFinite(ts) && now - ts <= recencyWindowMs && a.severity !== 'info';
      })
      .sort((a, b) => {
        const severityDelta = severityRank[b.severity] - severityRank[a.severity];
        if (severityDelta !== 0) return severityDelta;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    const hasLiveDegradation =
      devices.some((d) => d.status !== 'healthy') ||
      connections.some((c) => c.status !== 'healthy');

    const contextPrompt = recentActionableAlerts.length > 0
      ? `Perform root cause analysis on current live alerts. Prioritize highest severity and explain cause, impact, and remediation. Top alert: ${recentActionableAlerts[0].device} (${recentActionableAlerts[0].layer}) - ${recentActionableAlerts[0].message}`
      : hasLiveDegradation
        ? 'Perform proactive root cause analysis using current live telemetry (devices, links, KPIs, workflows). There are degraded elements but no fresh high-signal alert in the last 10 minutes. Identify likely root causes and remediation.'
        : 'Validate that the system is currently healthy and incident is resolved. If no active fault exists, provide a short health confirmation and top preventive recommendations.';

    setAiSystemMessage(`${contextPrompt}\n\nRequest timestamp: ${new Date().toISOString()}`);
    setIsNetMonitAIOpen(true);
  };

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
    injectFault(type);

    // AI Reaction - Legacy
    // setAiMessage(`Alert Detected: ${type.toUpperCase()} Anomaly. Analyzing root cause...`); // Removed
  };

  const handleReset = () => {
    resetSystem();
    // setAiMessage("System Reset. Telemetry metrics normalized."); // Removed
  };

  const handleAddDevice = (newDevice: Device, parentId?: string) => {
    addDevice(newDevice);

    if (parentId) {
      const newConnection: NetworkConnection = {
        id: `c-${Date.now()}`,
        source: parentId,
        target: newDevice.id,
        status: 'healthy',
        bandwidth: 1000, // Default 1Gbps
        latency: 1,      // Default 1ms
      };
      addConnection(newConnection);
    }

    // Add system alert so user can see the event in Alert Panel
    addAlert({
      id: `alert-add-${Date.now()}`,
      severity: 'info',
      layer: 'L7',
      device: newDevice.name,
      device_id: newDevice.id,
      message: `New device "${newDevice.name}" (${newDevice.ip}) added to network${parentId ? ` — connected to ${devices.find(d => d.id === parentId)?.name || parentId}` : ' as standalone'}`,
      timestamp: new Date(),
      title: 'Device Provisioned',
    });

    // Auto-select the new device so detail panel opens
    setSelectedDeviceId(newDevice.id);
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
      <header className="sticky top-0 z-50 bg-slate-950/82 backdrop-blur-xl border-b border-slate-800/90">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex items-center gap-3 shrink-0">
              <button
                id="layer-menu-trigger"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open layer menu"
                className="h-10 w-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <img src="/favicon.svg" alt="NetMonit network monitoring system logo" className="w-11 h-11" />
              <div>
                <h1 className="text-[1.55rem] font-semibold tracking-tight text-slate-100">NetMonit</h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Network Monitoring System</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
              {/* Data Import */}
              <DataImporter />

              {/* Simulation Trigger */}
              <button
                id="diagnostic-scan-trigger"
                onClick={runSimulation}
                className={`h-10 whitespace-nowrap inline-flex items-center gap-2 px-4 bg-indigo-600 text-white rounded-lg shadow-sm border border-indigo-500/60 transition-all text-sm font-semibold ${visualMode === 'scan'
                  ? 'opacity-95'
                  : 'hover:bg-indigo-500'
                  }`}
              >
                <Play className={`w-4 h-4 fill-current ${visualMode === 'scan' ? 'animate-pulse' : ''}`} />
                <span>{visualMode === 'scan' ? 'Scanning…' : 'Run Diagnostic Scan'}</span>
              </button>

              <button
                id="forensic-cockpit-trigger"
                onClick={() => {
                  // Build a context-aware forensic prompt
                  const unhealthyCount = devices.filter((d) => d.status !== 'healthy').length;
                  const degradedLinks = connections.filter((c) => c.status !== 'healthy').length;
                  const topAlerts = filteredAlerts.slice(0, 3).map((a) => `${a.device} (${a.layer}): ${a.message}`).join(' | ');
                  const prompt = unhealthyCount > 0 || filteredAlerts.length > 0
                    ? `Forensic analysis requested. Live state: ${filteredAlerts.length} alerts, ${unhealthyCount} unhealthy devices, ${degradedLinks} degraded links. ${topAlerts ? `Active issues: ${topAlerts}.` : ''} Investigate root cause and impact chain.`
                    : `Forensic health audit requested. All ${devices.length} devices operational, ${degradedLinks} degraded links. Perform preventive analysis and identify potential risks.`;
                  setForensicSystemMessage(`${prompt} Request id: ${Date.now()}.`);
                  setIsForensicOpen(true);
                }}
                className="h-10 whitespace-nowrap inline-flex items-center gap-2 px-3.5 bg-slate-900/70 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all text-sm font-medium"
              >
                <Terminal className="w-4 h-4" />
                <span>Forensic Cockpit</span>
              </button>

              <button
                id="root-cause-analysis-trigger"
                onClick={runRootCauseAnalysis}
                className="h-10 whitespace-nowrap inline-flex items-center gap-2 px-3.5 bg-slate-900/70 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all text-sm font-medium"
              >
                <Bot className="w-4 h-4" />
                <span>Root Cause Analysis</span>
              </button>

              <button
                id="netmonit-ai-trigger"
                onClick={() => setIsNetMonitAIOpen(true)}
                className="h-10 whitespace-nowrap inline-flex items-center gap-2 px-3.5 bg-slate-900/70 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all text-sm font-medium"
              >
                <Bot className="w-4 h-4" />
                <span>NetMonit AI</span>
              </button>

              <div id="network-health-badge" className="hidden md:flex items-center gap-2 bg-slate-900/70 border border-slate-700 px-3 py-1.5 rounded-lg whitespace-nowrap">
                <Shield className={`w-4 h-4 ${devices.some(d => d.status === 'critical') ? 'text-red-400' : devices.some(d => d.status === 'warning') ? 'text-yellow-400' : 'text-green-400'}`} />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Health</div>
                  <div className={`text-sm font-bold ${healthPercentage < 70 ? 'text-red-400' : healthPercentage < 90 ? 'text-yellow-400' : 'text-green-400'}`}>{healthPercentage}%</div>
                </div>
              </div>

              <div className="flex items-center">
                <VisualGuide />
              </div>
              <div className="hidden xl:block w-px h-6 bg-slate-700 mx-1"></div>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="hidden sm:flex items-center gap-2 text-sm text-slate-400 whitespace-nowrap max-w-[220px] hover:text-slate-200 transition-colors rounded-lg px-2 py-1.5 hover:bg-slate-800/60"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="truncate">{userName}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{userName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Active Session
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
        <div id="asset-detail-overlay" className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
          {/* Click backdrop to close */}
          <div className="absolute inset-0" onClick={() => setSelectedDeviceId(null)}></div>

          <div id="asset-detail-panel" className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-700 shadow-2xl relative z-10 animate-in slide-in-from-right duration-300">
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">Skip to main content</a>
      <main id="main-content" className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-3 inline-flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900/55 p-1.5 backdrop-blur-sm" role="tablist" aria-label="Dashboard views">
          <button
            id="view-3d-trigger"
            role="tab"
            aria-selected={activeView === '3d'}
            onClick={() => setActiveView('3d')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeView === '3d'
              ? 'bg-slate-100 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <Boxes className="w-4 h-4" />
            3D Topology
          </button>
          <button
            id="view-analytics-trigger"
            role="tab"
            aria-selected={activeView === 'analytics'}
            onClick={() => setActiveView('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeView === 'analytics'
              ? 'bg-slate-100 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <LineChart className="w-4 h-4" />
            Analytics
          </button>
          <button
            id="view-kpi-trigger"
            role="tab"
            aria-selected={activeView === 'kpi'}
            onClick={() => setActiveView('kpi')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeView === 'kpi'
              ? 'bg-slate-100 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <Gauge className="w-4 h-4" />
            KPI Intelligence
          </button>
          <button
            id="view-logs-trigger"
            role="tab"
            aria-selected={activeView === 'logs'}
            onClick={() => setActiveView('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeView === 'logs'
              ? 'bg-slate-100 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <Terminal className="w-4 h-4" />
            System Logs
          </button>
        </div>

        <div className="mb-6 hidden lg:flex items-center gap-2">
          <div id="ai-monitor-badge" className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700">
            <Bot className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">AI Coverage</div>
              <div className="text-xs font-semibold text-indigo-300">
                {aiMonitoringSnapshot.monitoredLayers.length}/7 layers · {aiMonitoringSnapshot.monitoredDevices} assets
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700">
            <Activity className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Assets</div>
              <div className="text-xs font-semibold text-blue-300">{healthyDevices}/{totalDevices}</div>
            </div>
          </div>
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
            <Suspense fallback={<LoadingSkeleton label="Loading 3D Topology…" />}>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Advanced3DTopology
                  devices={devices}
                  connections={connections}
                  alerts={filteredAlerts}
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
                <OTHealthCard timeRangeLabel={timeRange.label} timeRangeValue={timeRange.value} device={devices.find(d => d.id === 'd3')} />
                <NetworkLoadCard timeRangeLabel={timeRange.label} timeRangeValue={timeRange.value} device={devices.find(d => d.id === 'd10')} connections={connections} devices={devices} />
                <CorrelationTimelineCard timeRangeLabel={timeRange.label} timeRangeValue={timeRange.value} alerts={filteredAlerts} devices={devices} connections={connections} />
              </div>

              {/* Critical Panels: Status & Alerts */}
              <div className="col-span-12 lg:col-span-4" id="asset-status-panel">
                <DeviceStatus
                  devices={devices}
                  connections={connections}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={setSelectedDeviceId}
                  onInjectFault={(id: string) => handleInjectFault(devices.find(d => d.id === id)?.category === 'OT' ? 'l1' : 'l7')}
                />
              </div>
              <div className="col-span-12 lg:col-span-8" id="alerts-panel">
                <AlertPanel alerts={filteredAlerts} devices={devices} />
              </div>

              <div className="col-span-12 lg:col-span-6" id="data-flow-viz">
                <DataFlowVisualization
                  mode={visualMode}
                  // showControlsExternal={showTour && tourStep === 3} // Removed forced external control to enforce 'Active Learning' (User must click)
                  selectedDevice={devices.find(d => d.id === selectedDeviceId) ?? null}
                />
              </div>
              <div className="col-span-12 lg:col-span-6" id="heatmap-panel">
                <NetworkHeatmap alerts={filteredAlerts} devices={devices} />
              </div>
            </div>
            </Suspense>
          )
        }

        {
          activeView === 'analytics' && (
            <Suspense fallback={<LoadingSkeleton label="Loading Analytics…" />}>
            <div id="analytics-view" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                <button
                  id="kpi-matrix-trigger"
                  onClick={() => setShowMatrix(true)}
                  className="h-9 whitespace-nowrap inline-flex items-center gap-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-lg transition-all text-sm font-medium"
                >
                  <Activity className="w-4 h-4" />
                  <span>KPI Matrix</span>
                </button>
              </div>

              {/* Business Value Dashboard (Score Booster) */}
              <BusinessROI healthPercentage={healthPercentage} />
              <AdvancedAnalytics
                devices={devices}
                alerts={filteredAlerts}
                connections={connections}
                timeRangeLabel={timeRange.label}
                timeRangeValue={timeRange.value}
                timeRangeStart={timeRange.start}
                timeRangeEnd={timeRange.end}
              />
            </div>
            </Suspense>
          )
        }

        {
          activeView === 'kpi' && (
            <Suspense fallback={<LoadingSkeleton label="Loading KPI Intelligence…" />}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                <button
                  onClick={() => setShowMatrix(true)}
                  className="h-9 whitespace-nowrap inline-flex items-center gap-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-lg transition-all text-sm font-medium"
                >
                  <Activity className="w-4 h-4" />
                  <span>KPI Matrix</span>
                </button>
              </div>

              <div className="h-[calc(100vh-210px)]">
                <RealTimeKPIPage
                  devices={devices}
                  alerts={filteredAlerts}
                  connections={connections}
                  timeRangeLabel={timeRange.label}
                  timeRangeValue={timeRange.value}
                  timeRangeStart={timeRange.start}
                  timeRangeEnd={timeRange.end}
                />
              </div>
            </div>
            </Suspense>
          )
        }

        {
          activeView === 'logs' && (
            <Suspense fallback={<LoadingSkeleton label="Loading System Logs…" />}>
            <div className="h-[calc(100vh-140px)]">
              <SmartLogPanel logs={smartLogs} aiTimeline={aiMonitoringTimeline} />
            </div>
            </Suspense>
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

      {/* NetMonitAI Assistant (floating button + chat panel) */}
      <AICopilot
        userName={userName}
        systemMessage={aiSystemMessage}
        alerts={filteredAlerts}
        devices={devices}
        connections={connections}
        dependencyPaths={dependencyPaths}
        layerKPIs={layerKPIs}
        systemContext={{
          activeView,
          selectedLayer,
          selectedDeviceId,
          healthPercentage,
          timeRangeLabel: timeRange.label,
          aiCoverageSummary: aiMonitoringSnapshot.summary,
        }}
        isOpen={isNetMonitAIOpen}
        onOpenChange={setIsNetMonitAIOpen}
      />

      {/* Diagnostic Scan Forensic Console (only mounted when open to avoid extra launcher UI) */}
      {
        isForensicOpen && (
          <ForensicCockpit
            userName={userName}
            alerts={filteredAlerts}
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
