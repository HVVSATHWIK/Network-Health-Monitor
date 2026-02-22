import { Alert, Device } from '../types/network';
import { AlertCircle, AlertTriangle, Info, Sparkles, BrainCircuit, History, Trash2 } from 'lucide-react';
import { analyzeRootCause } from '../utils/aiLogic';
import { useState, useEffect, useCallback } from 'react';
import { getAlertHistory, clearAlertHistory, type ArchivedAlert } from '../services/AlertHistoryDB';

interface AlertPanelProps {
  alerts: Alert[];
  devices: Device[];
}

export default function AlertPanel({ alerts, devices }: AlertPanelProps) {
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [history, setHistory] = useState<ArchivedAlert[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAlertHistory(200);
      setHistory(data);
    } catch {
      // IndexedDB unavailable — silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Refresh history when tab switches to it, or when active alerts change (some may have resolved)
  useEffect(() => {
    if (tab === 'history') void loadHistory();
  }, [tab, alerts.length, loadHistory]);

  const handleClearHistory = async () => {
    await clearAlertHistory();
    setHistory([]);
  };

  const handleAnalyze = async (alertId: string, deviceName: string) => {
    setAnalyzingIds(prev => new Set(prev).add(alertId));

    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const insight = await analyzeRootCause(deviceName, alerts, devices);
    if (insight) {
      setInsights(prev => ({ ...prev, [alertId]: insight }));
    }

    setAnalyzingIds(prev => {
      const next = new Set(prev);
      next.delete(alertId);
      return next;
    });
  };



  const severityConfig: Record<Alert['severity'], { icon: typeof AlertCircle; color: string; bg: string; border: string }> = {
    critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30' },
    high: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/30' },
    medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-500/30' },
    low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
  };

  const formatTimeAgo = (ms: number) => {
    const now = Date.now();
    const diff = Math.floor((now - ms) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl h-full overflow-hidden flex flex-col">
      {/* Tab header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-0.5" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'active'}
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${tab === 'active' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Active
            {alerts.length > 0 && (
              <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'history'}
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <History className="w-3.5 h-3.5" />
            History
            {history.length > 0 && tab !== 'history' && (
              <span className="ml-0.5 text-xs text-slate-500">{history.length}</span>
            )}
          </button>
        </div>

        {tab === 'history' && history.length > 0 && (
          <button
            onClick={() => void handleClearHistory()}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Active tab */}
      {tab === 'active' && (
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1" role="log" aria-label="Active alerts" aria-live="polite">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <AlertTriangle className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs mt-1">All systems operating normally</p>
            </div>
          ) : (
            alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          const rootCauseInsight = insights[alert.id];

          return (
            <div key={alert.id} className={`border ${config.border} ${config.bg} rounded-lg p-4 transition-all hover:shadow-md`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${config.color} uppercase`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTimeAgo(new Date(alert.timestamp).getTime())}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mb-1">
                    {alert.device} ({alert.layer})
                  </div>
                  <div className="text-sm text-slate-300 mb-2">
                    {alert.message}
                  </div>

                  {/* Standard AI Correlation (from static data) */}
                  {alert.aiCorrelation && !rootCauseInsight && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-purple-400 mb-1">
                            AI Context
                          </div>
                          <div className="text-xs text-slate-400">
                            {alert.aiCorrelation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deep-Dive AI Root Cause Insight (Dynamic) */}
                  {rootCauseInsight ? (
                    <div className="mt-4 relative group animate-in fade-in slide-in-from-top-2">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-lg blur opacity-20 animate-pulse group-hover:opacity-40 transition duration-1000"></div>
                      <div className="relative bg-slate-950/50 p-4 rounded-lg border border-purple-500/30 shadow-xl backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg shadow-lg ring-2 ring-purple-200">
                            <BrainCircuit className="w-6 h-6 text-white animate-[spin_3s_linear_infinite]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 mb-1 flex items-center gap-2">
                              AI Root Cause Analysis
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed font-medium border-l-2 border-purple-500/50 pl-3 whitespace-pre-wrap">
                              {rootCauseInsight}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // On-Demand Analysis Trigger
                    <div className="mt-3">
                      <button
                        onClick={() => handleAnalyze(alert.id, alert.device)}
                        disabled={analyzingIds.has(alert.id)}
                        className="w-full relative group overflow-hidden rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 transition-all p-3"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {analyzingIds.has(alert.id) ? (
                            <>
                              <BrainCircuit className="w-4 h-4 text-purple-400 animate-spin" />
                              <span className="text-xs font-bold text-purple-300">Analyzing telemetry...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-bold text-slate-300 group-hover:text-purple-300 transition-colors">Run Root Cause Analysis</span>
                            </>
                          )}
                        </div>
                        {analyzingIds.has(alert.id) && (
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-shimmer" />
                        )}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1" role="log" aria-label="Alert history">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-3" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <History className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No alert history yet</p>
              <p className="text-xs mt-1">Resolved alerts will appear here</p>
            </div>
          ) : (
            history.map((item) => {
              const config = severityConfig[item.severity];
              const Icon = config.icon;
              return (
                <div key={item.historyId} className="border border-slate-700/50 bg-slate-800/30 rounded-lg p-3 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5 opacity-60`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-semibold ${config.color} uppercase opacity-70`}>
                          {item.severity}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Resolved {formatTimeAgo(item.resolvedAt)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-300 truncate">
                        {item.device} ({item.layer})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {item.message}
                      </div>
                      {item.aiCorrelation && (
                        <div className="text-[10px] text-purple-400/70 mt-1 truncate flex items-center gap-1">
                          <Sparkles className="w-3 h-3 flex-shrink-0" />
                          {item.aiCorrelation}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600 mt-1">
                        Created {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
