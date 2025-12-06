import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function PredictiveAnalytics() {
  const predictions = [
    {
      type: 'capacity',
      severity: 'high',
      title: 'Switch Capacity Warning',
      description: 'Core Switch 01 will reach 85% utilization in 2.5 hours',
      probability: 87,
      timeframe: '2h 30m',
      recommendation: 'Enable load balancing or schedule maintenance',
      impact: 'High - May cause network slowdown'
    },
    {
      type: 'failure',
      severity: 'critical',
      title: 'Component Failure Predicted',
      description: 'Pressure Sensor 02 shows degradation pattern - failure likely within 18 hours',
      probability: 94,
      timeframe: '18h',
      recommendation: 'Schedule replacement before failure occurs',
      impact: 'Critical - Production impact if not addressed'
    },
    {
      type: 'performance',
      severity: 'medium',
      title: 'Latency Increase Expected',
      description: 'PLC Line A communication latency trending upward - will exceed threshold in 4 hours',
      probability: 76,
      timeframe: '4h',
      recommendation: 'Review network policies and QoS settings',
      impact: 'Medium - May affect production speed'
    },
    {
      type: 'security',
      severity: 'medium',
      title: 'Anomalous Traffic Pattern',
      description: 'Unusual data flow detected from gateway to external network',
      probability: 65,
      timeframe: 'Ongoing',
      recommendation: 'Review firewall logs and verify authorized connections',
      impact: 'Medium - Security investigation needed'
    }
  ];

  const severityConfig = {
    critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Predictive Analytics</h2>
            <p className="text-sm text-gray-600">AI-powered forecasting for network events</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-3xl font-bold text-red-700">1</div>
            <div className="text-sm text-red-600 font-medium">Critical Predictions</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-700">1</div>
            <div className="text-sm text-orange-600 font-medium">High Risk</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">2</div>
            <div className="text-sm text-yellow-600 font-medium">Medium Risk</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">92%</div>
            <div className="text-sm text-blue-600 font-medium">Avg Confidence</div>
          </div>
        </div>
      </div>

      {predictions.map((pred, idx) => {
        const config = severityConfig[pred.severity as keyof typeof severityConfig];
        const Icon = config.icon;

        return (
          <div key={idx} className={`border ${config.border} rounded-lg p-6 ${config.bg}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 ${config.bg} rounded-lg border ${config.border}`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{pred.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">{pred.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${config.color}`}>{pred.probability}%</div>
                <div className="text-xs text-gray-600 font-medium">Probability</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Timeframe</div>
                  <div className="text-lg font-bold text-gray-800">{pred.timeframe}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Impact</div>
                  <div className={`text-sm font-semibold ${pred.severity === 'critical' ? 'text-red-700' : pred.severity === 'high' ? 'text-orange-700' : 'text-yellow-700'}`}>
                    {pred.impact}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          pred.probability > 80 ? 'bg-red-500' :
                          pred.probability > 70 ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${pred.probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3">
              <div className="text-xs font-semibold text-blue-900 mb-1 uppercase">Recommended Action</div>
              <div className="text-sm text-blue-800">{pred.recommendation}</div>
            </div>
          </div>
        );
      })}

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">AI Model Details</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-blue-300 font-semibold">Training Data</div>
            <div className="mt-1">5,247 historical events analyzed</div>
          </div>
          <div>
            <div className="text-blue-300 font-semibold">Model Accuracy</div>
            <div className="mt-1">92.3% on test dataset</div>
          </div>
          <div>
            <div className="text-blue-300 font-semibold">Last Update</div>
            <div className="mt-1">5 minutes ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
