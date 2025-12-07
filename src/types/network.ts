export interface Device {
  id: string;
  name: string;
  type: 'switch' | 'router' | 'plc' | 'sensor' | 'scada' | 'gateway' | 'server';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  ip: string;
  location: string;
  manufacturer?: string;
}

export interface LayerKPI {
  layer: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  layer: string;
  device: string;
  message: string;
  timestamp: Date;
  aiCorrelation?: string;
}

export interface NetworkConnection {
  source: string;
  target: string;
  bandwidth: number;
  latency: number;
  status: 'healthy' | 'degraded' | 'down';
}

export interface DependencyPath {
  appId: string;
  appName: string;
  criticality: 'low' | 'medium' | 'high' | 'mission-critical';
  path: string[]; // Array of Device IDs involved in this workflow
}
