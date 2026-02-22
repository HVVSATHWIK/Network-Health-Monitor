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
    l3: {
      packetLoss: number; // Percentage
      routingTableSize: number; // Count
      firewallDrops?: number; // Count
    };
    l4: {
      tcpRetransmissions: number; // Rate
      jitter: number; // ms
    };
    l5: {
      sessionResets: number; // count/hr
      sessionStability: number; // Percentage
    };
    l6: {
      tlsHandshakeFailures: number; // count/hr
      encryptionOverheadMs: number; // ms
    };
    l7: {
      appLatency: number; // ms
      protocolAnomaly?: boolean;
    };
  };
  ip: string;
  mac?: string;
  location: string;
  manufacturer?: string;
  vlan?: number;         // VLAN ID (e.g. 10, 20, 100)
  subnetMask?: string;   // CIDR notation mask (e.g. '255.255.255.0' or '/24')
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
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
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
  vlan?: number;  // VLAN tag if applicable
}

export interface DependencyPath {
  appId: string;
  appName: string;
  criticality: 'low' | 'medium' | 'high' | 'mission-critical';
  path: string[]; // Array of Device IDs involved in this workflow
}

export interface SmartFailureEvent {
  id: string;
  // WHAT
  failureType: string;
  osiLayer: 'L1' | 'L2' | 'L3' | 'L4' | 'L7';

  // WHERE
  originDeviceId: string;
  originDeviceName: string; // e.g., "Hirschmann BOBCAT"
  originPort?: string;      // e.g., "Port 4"

  // TL;DR Summary
  summary: string; // concise narrative ("Bad fiber caused X...")

  // WHEN
  startTime: string; // ISO String
  endTime?: string;   // ISO String

  // FAILURE CHAIN (The "One Root" Rule)
  failureChain: {
    rootCause: {
      layer: string;
      device: string;
      description: string;
    };
    propagation: {
      layer: string;
      device: string;
      description: string;
    }[];
    symptoms: {
      layer: string;
      device: string;
      description: string;
    }[];
  };

  // WHY & DIAGNOSIS
  rootCauseExplanation: string;
  ruledOutCauses: string[]; // List of dismissed hypotheses

  // CONFIDENCE
  confidenceScore: number; // 0–1
  confidenceBreakdown: {
    temporal: number;
    layerConsistency: number;
    metricStrength: number;
    topology: number;
    noisePenalty: number;
  };

  // TIMELINE (Micro-events)
  timeline: {
    timestamp: string;
    message: string;
    type: 'info' | 'critical' | 'completion';
  }[];

  // IMPACT
  impact: {
    technical: string[];   // e.g., "High Packet Loss"
    operational: string[]; // e.g., "Production Halted"
    impactedDeviceIds: string[];
  };

  // ACTION
  recommendedActions: string[];

  // EVIDENCE (Legacy metrics for compatibility)
  evidence: {
    alertCount: number;
    keyMetrics: Record<string, number>;
  };
}

// --- AI Relationship Engine Types ---

export interface EvidencePack {
  triggeringAlertId: string;
  rootLayer: string;
  affectedMetrics: string[];
  timestampWindow: {
    firstAnomaly: number;
    lastEscalation: number;
  };
  logSnippets?: string[]; // Optional for real logs
}

export interface ImpactAnalysis {
  technical: string[];
  operational: string[];
  impactedDeviceIds: string[];
  affectedWorkflows: string[];
}

export interface CausalChain {
  id: string;
  confidenceScore: number;
  confidenceReason: string;
  diagnosisType: 'RootCause' | 'Ambiguous' | 'Isolated';

  primaryFault: {
    device: string;
    layer: string;
    reason: string;
  };

  propagation: {
    upstreamDevice: string;
    downstreamDevice: string;
    depth: number;
  }[];

  impact: ImpactAnalysis;
  evidence: EvidencePack;

  possibleCauses?: string[]; // For ambiguous cases
  summary: string; // NLP-ready summary
}
