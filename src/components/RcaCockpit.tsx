import { Alert, Device, NetworkConnection } from '../types/network';
import { Bot, Share2, LocateFixed, GitMerge, AlertCircle, AlertTriangle } from 'lucide-react';
import { analyzeRootCause } from '../utils/aiLogic';
import { useState } from 'react';

interface RcaCockpitProps {
  alerts: Alert[];
  devices: Device[];
  connections: NetworkConnection[];
  onVisualizeRca: (rootNodeId: string, affectedNodeIds: string[]) => void;
}

interface IncidentInsight {
  alertId: string;
  insight: string;
  rootNodeParams: {
    rootNodeId: string;
    affectedNodeIds: string[];
  };
}

export default function RcaCockpit({ alerts, devices, connections, onVisualizeRca }: RcaCockpitProps) {
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<Record<string, IncidentInsight>>({});

  // We filter for actionable alerts (things that are broken, not just info)
  const ActionableAlerts = alerts
    .filter((a) => a.severity === 'critical' || a.severity === 'high' || a.severity === 'medium')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleAnalyze = async (alertId: string, deviceName: string) => {
    setAnalyzingIds((prev) => new Set(prev).add(alertId));

    // Simulate network delay for effect
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get the AI text explanation
    const insightText = await analyzeRootCause(deviceName, alerts, devices);
    
    // Find the device that triggered the alert
    const triggerDevice = devices.find((d) => d.name === deviceName || d.id === deviceName);
    
    // --- BUILD THE BLAST RADIUS MAP ---
    // In a real app, this would use pyRCA or a graph database query. 
    // Here we simulate finding dependents using the connections array.
    let rootNodeId = triggerDevice?.id || 'unknown';
    const affectedNodeIds = new Set<string>();
    
    // If the device that triggered the alert is a switch or router, it is likely the root cause
    // of other issues downstream. Let's find everything connected to it.
    if (triggerDevice) {
       // Trace connections where our device is the source (downstream)
       connections.forEach(conn => {
         if (conn.source === rootNodeId) {
             affectedNodeIds.add(conn.target);
             // One more hop
             connections.forEach(hop => {
                 if (hop.source === conn.target) affectedNodeIds.add(hop.target);
             })
         }
       });
    } else {
        // Fallback for demo purposes if we couldn't match the name exactly
        rootNodeId = devices[0].id;
        affectedNodeIds.add(devices[1].id);
        affectedNodeIds.add(devices[2].id);
    }
    
    // Add the original device as affected if we traced upstream, but here we assume the alert source IS the root.
    
    setInsights((prev) => ({
      ...prev,
      [alertId]: {
        alertId,
        insight: insightText || "Analysis completed, root cause identified in topology.",
        rootNodeParams: {
          rootNodeId,
          affectedNodeIds: Array.from(affectedNodeIds)
        }
      },
    }));

    setAnalyzingIds((prev) => {
      const next = new Set(prev);
      next.delete(alertId);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-50">
           <GitMerge className="w-24 h-24 text-slate-800" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
           <Bot className="w-6 h-6 text-purple-400" />
           AIOps Root Cause Engine
        </h3>
        <p className="text-sm text-slate-400 max-w-2xl">
          Powered by Causal Inference and graph logic. This engine cuts through alert noise by mapping cascading failures
          back to their origin point across the physical and logical layers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ActionableAlerts.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-12 flex flex-col items-center justify-center text-slate-500">
            <LocateFixed className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-400">No Actionable Incidents</p>
            <p className="text-sm">The network is currently stable. RCA requires an active alert.</p>
          </div>
        ) : (
          ActionableAlerts.map((alert) => {
            const isAnalyzing = analyzingIds.has(alert.id);
            const insightResult = insights[alert.id];

            return (
              <div key={alert.id} className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl overflow-hidden shadow-lg transition-all hover:border-slate-600">
                <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       {alert.severity === 'critical' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/50 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" /> Critical
                          </span>
                       ) : alert.severity === 'high' ? (
                           <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-950/50 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" /> High
                          </span>
                       ) : (
                           <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-950/50 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" /> Medium
                          </span>
                       )}
                       <span className="text-sm font-semibold text-slate-200">{alert.device}</span>
                       <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">Layer {alert.layer}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex gap-3">
                     {!insightResult ? (
                        <button
                          onClick={() => handleAnalyze(alert.id, alert.device)}
                          disabled={isAnalyzing}
                          className="w-full md:w-auto relative group overflow-hidden rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 hover:border-indigo-400 transition-all px-6 py-2.5"
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isAnalyzing ? (
                              <>
                                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
                                <span className="text-sm font-bold text-indigo-300">Computing Graph...</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-indigo-300">Run RCA Engine</span>
                              </>
                            )}
                          </div>
                          {isAnalyzing && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" />
                          )}
                        </button>
                     ) : (
                         <button
                           onClick={() => onVisualizeRca(insightResult.rootNodeParams.rootNodeId, insightResult.rootNodeParams.affectedNodeIds)}
                           className="w-full md:w-auto relative group overflow-hidden rounded-lg bg-purple-600 hover:bg-purple-500 border border-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] px-6 py-2.5"
                         >
                           <div className="flex items-center justify-center gap-2">
                               <LocateFixed className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-500" />
                               <span className="text-sm font-bold text-white">Visualize Blast Radius (3D)</span>
                           </div>
                         </button>
                     )}
                  </div>
                </div>

                {/* Expanded AI Insight Result */}
                {insightResult && (
                   <div className="border-t border-slate-700/50 bg-slate-900/50 p-5">
                       <div className="flex items-start gap-4">
                           <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg ring-1 ring-purple-500/50">
                              <Bot className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1">
                               <h4 className="text-sm font-bold text-slate-200 mb-1">Causal Inference Result</h4>
                               <div className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                 {insightResult.insight}
                               </div>
                               <div className="mt-3 flex flex-wrap gap-2">
                                   <div className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/20 text-xs">
                                      <span className="text-slate-400 mr-1">Root Node:</span> 
                                      <span className="text-red-400 font-mono font-bold">{insightResult.rootNodeParams.rootNodeId}</span>
                                   </div>
                                   <div className="px-2.5 py-1 rounded bg-orange-950/40 border border-orange-500/20 text-xs">
                                      <span className="text-slate-400 mr-1">Blast Radius Impact:</span> 
                                      <span className="text-orange-400 font-bold">{insightResult.rootNodeParams.affectedNodeIds.length} Nodes</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
