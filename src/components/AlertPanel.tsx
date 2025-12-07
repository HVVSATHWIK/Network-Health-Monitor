import { Alert, Device, DependencyPath } from '../types/network';
import { AlertCircle, AlertTriangle, Info, Sparkles, BrainCircuit } from 'lucide-react';
import { analyzeRootCause } from '../utils/aiLogic';

interface AlertPanelProps {
  alerts: Alert[];
  devices: Device[];
  dependencyPaths: DependencyPath[];
}

export default function AlertPanel({ alerts, devices, dependencyPaths }: AlertPanelProps) {
  const severityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Active Alerts</h2>
        <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          // Run AI Root Cause Analysis
          // We pass the alert's device name as the appName because in our mock data 
          // application alerts are logged against the App Name (e.g., "SCADA Control Loop")
          const rootCauseInsight = analyzeRootCause(alert.device, alerts, devices, dependencyPaths);

          return (
            <div key={alert.id} className={`border ${config.border} ${config.bg} rounded-lg p-4 transition-all hover:shadow-md`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${config.color} uppercase`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">
                    {alert.device} ({alert.layer})
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
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
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                      <div className="relative bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-lg border border-purple-100 shadow-xl">
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-inner">
                            <BrainCircuit className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 mb-1">
                              Deep-Dive Root Cause
                            </div>
                            <div className="text-xs text-gray-800 leading-relaxed font-medium">
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
