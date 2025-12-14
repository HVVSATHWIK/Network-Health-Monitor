import { Alert, Device } from '../types/network';
import { AlertCircle, AlertTriangle, Info, Sparkles, BrainCircuit } from 'lucide-react';
import { analyzeRootCause } from '../utils/aiLogic';
import { useState, useEffect } from 'react';

interface AlertPanelProps {
  alerts: Alert[];
  devices: Device[];
}

export default function AlertPanel({ alerts, devices }: AlertPanelProps) {
  const [insights, setInsights] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchInsights = async () => {
      const newInsights: Record<string, string> = {};

      for (const alert of alerts) {
        // Run AI Root Cause Analysis only if not already cached and relevant
        // We pass the alert's device name as the appName because in our mock data 
        // application alerts are logged against the App Name (e.g., "SCADA Control Loop")
        if (!insights[alert.id]) {
          const insight = await analyzeRootCause(alert.device, alerts, devices);
          if (insight) {
            newInsights[alert.id] = insight;
          }
        }
      }

      if (Object.keys(newInsights).length > 0) {
        setInsights(prev => ({ ...prev, ...newInsights }));
      }
    };

    fetchInsights();
  }, [alerts, devices]);

  const severityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30' },
    high: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/30' },
    medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-500/30' },
    low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' } // Added info fallback
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">Active Alerts</h2>
        <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {alerts.map((alert) => {
          // Use type assertion or fallback to avoid implicit any error
          // @ts-ignore - Valid severity check handled by fallback
          const config = severityConfig[alert.severity] || severityConfig.medium;
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
                      {formatTime(alert.timestamp)}
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
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-purple-700 mb-1">
                            AI Context
                          </div>
                          <div className="text-xs text-gray-600">
                            {alert.aiCorrelation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deep-Dive AI Root Cause Insight (Dynamic) */}
                  {rootCauseInsight && (
                    <div className="mt-4 relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-lg blur opacity-20 animate-pulse group-hover:opacity-40 transition duration-1000"></div>
                      <div className="relative bg-slate-950/50 p-4 rounded-lg border border-purple-500/30 shadow-xl backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg shadow-lg ring-2 ring-purple-200">
                            <BrainCircuit className="w-6 h-6 text-white animate-[spin_3s_linear_infinite]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 mb-1 flex items-center gap-2">
                              ✨ AI Root Cause Analysis
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed font-medium border-l-2 border-purple-500/50 pl-3">
                              {rootCauseInsight}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
