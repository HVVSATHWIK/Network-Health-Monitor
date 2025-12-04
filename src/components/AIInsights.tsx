import { Sparkles, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AIInsights() {
  const insights = [
    {
      type: 'prediction',
      title: 'Predicted Issue',
      description: 'Switch utilization on Floor A likely to exceed threshold within 4 hours based on current traffic pattern.',
      confidence: 87,
      action: 'Consider load balancing or capacity upgrade'
    },
    {
      type: 'correlation',
      title: 'Cross-Layer Correlation',
      description: 'L1 signal degradation in Zone B is causing L3 routing instability. Physical layer issue is the root cause.',
      confidence: 94,
      action: 'Inspect cable infrastructure in Zone B'
    },
    {
      type: 'anomaly',
      title: 'Anomaly Detected',
      description: 'PLC Line A showing unusual connection timeout pattern not aligned with production schedule.',
      confidence: 78,
      action: 'Review PLC configuration and network policies'
    },
    {
      type: 'optimization',
      title: 'Optimization Opportunity',
      description: 'VLAN segmentation could reduce broadcast traffic by ~15% and improve L2 performance.',
      confidence: 82,
      action: 'Review network segmentation strategy'
    }
  ];

  const typeConfig = {
    prediction: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    correlation: { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    anomaly: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    optimization: { icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">AI-Driven Insights</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => {
          const config = typeConfig[insight.type as keyof typeof typeConfig];
          const Icon = config.icon;

          return (
            <div key={idx} className={`border ${config.border} rounded-lg p-4 ${config.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-medium text-gray-600">Confidence:</div>
                      <div className={`text-xs font-bold ${config.color}`}>{insight.confidence}%</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {insight.description}
                  </p>
                  <div className="bg-white rounded px-3 py-2 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Recommended Action</div>
                    <div className="text-sm text-gray-800">{insight.action}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-gray-800 mb-1">AI Analysis Summary</div>
            <div className="text-sm text-gray-700">
              Monitoring 10 devices across 5 network layers. 3 active patterns detected.
              System learning from 1,247 historical events. Next analysis in 5 minutes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
