export interface Device {
  id: string;
  name: string;
  type: 'server' | 'switch' | 'firewall' | 'router' | 'plc' | 'sensor' | 'gateway' | 'scada';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  category: 'IT' | 'OT';
  position: [number, number, number];

  // L1-L7 Telemetry
  metrics: {
    l1: {
      temperature: number; // Celsius
      opticalRxPower?: number; // dBm (Fiber only)
      fanSpeed?: number; // RPM
    };
    l2: {
      crcErrors: number; // Count
      linkUtilization: number; // Percentage
      macFlapping?: boolean;
    };
    l4: {
      tcpRetransmissions: number; // Rate
      jitter: number; // ms
    };
    l7: {
      appLatency: number; // ms
      protocolAnomaly?: boolean;
    };
  };
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
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L7';
  device: string;
  message: string;
  timestamp: Date;
  aiCorrelation?: string;

  // Forensic Unified UI Fields
  title?: string;
  description?: string;
  source?: string;
  target_ip?: string;
  agentSteps?: string[];
  device_id?: string;
}

export interface NetworkConnection {
  id: string;
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
