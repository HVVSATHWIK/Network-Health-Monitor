import { LayerKPI } from '../types/network';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  kpi: LayerKPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    stable: <Minus className="w-4 h-4" />
  };

  const statusDots = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[kpi.status]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDots[kpi.status]} animate-pulse`} />
          <span className="text-xs font-semibold">{kpi.layer}</span>
        </div>
        <div className="text-xs opacity-70">
          {trendIcons[kpi.trend]}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">
        {kpi.value}{kpi.unit}
      </div>
      <div className="text-xs font-medium">{kpi.name}</div>
      <div className="text-xs opacity-60 mt-2">
        Threshold: {kpi.threshold}{kpi.unit}
      </div>
    </div>
  );
}
