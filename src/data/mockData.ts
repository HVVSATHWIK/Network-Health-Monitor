import { Device, LayerKPI, Alert, NetworkConnection, DependencyPath } from '../types/network';

export const devices: Device[] = [
  {
    id: 'd1', name: 'Hirschmann DRAGON MACH4x00', type: 'switch', status: 'healthy', category: 'OT', ip: '192.168.1.1', location: 'Server Room', manufacturer: 'Hirschmann', position: [0, 0, 0],
    metrics: {
      l1: { temperature: 42, fanSpeed: 4500 },
      l2: { crcErrors: 0, linkUtilization: 45 },
      l4: { tcpRetransmissions: 0.01, jitter: 2 },
      l7: { appLatency: 15 }
    }
  },
  {
    id: 'd2', name: 'Hirschmann EAGLE40 Firewall', type: 'firewall', status: 'healthy', category: 'IT', ip: '192.168.1.2', location: 'Network Center', manufacturer: 'Belden', position: [-20, 0, 10],
    metrics: {
      l1: { temperature: 45, fanSpeed: 4200 },
      l2: { crcErrors: 2, linkUtilization: 60 },
      l4: { tcpRetransmissions: 0.05, jitter: 5 },
      l7: { appLatency: 25 }
    }
  },
  {
    id: 'd3', name: 'Lion-M PLC Node A', type: 'plc', status: 'warning', category: 'OT', ip: '192.168.10.5', location: 'Production Floor A', position: [20, 0, -10],
    metrics: {
      l1: { temperature: 65, fanSpeed: 0 },
      l2: { crcErrors: 150, linkUtilization: 10 },
      l4: { tcpRetransmissions: 2.4, jitter: 45 },
      l7: { appLatency: 350 }
    }
  },
  {
    id: 'd4', name: 'Lion-M PLC Node B', type: 'plc', status: 'healthy', category: 'OT', ip: '192.168.10.6', location: 'Production Floor B', position: [10, 0, 20],
    metrics: {
      l1: { temperature: 38 },
      l2: { crcErrors: 0, linkUtilization: 12 },
      l4: { tcpRetransmissions: 0, jitter: 1 },
      l7: { appLatency: 5 }
    }
  },
  {
    id: 'd5', name: 'SCADA Control Loop', type: 'scada', status: 'healthy', category: 'OT', ip: '192.168.5.10', location: 'Control Room', position: [0, 20, 0],
    metrics: {
      l1: { temperature: 35 },
      l2: { crcErrors: 0, linkUtilization: 30 },
      l4: { tcpRetransmissions: 0.02, jitter: 3 },
      l7: { appLatency: 12 }
    }
  },
  {
    id: 'd6', name: 'Temp Sensor 01', type: 'sensor', status: 'healthy', category: 'OT', ip: '192.168.20.15', location: 'Zone A', position: [30, -10, 5],
    metrics: {
      l1: { temperature: 25 },
      l2: { crcErrors: 0, linkUtilization: 1 },
      l4: { tcpRetransmissions: 0, jitter: 0 },
      l7: { appLatency: 2 }
    }
  },
  {
    id: 'd7', name: 'Pressure Sensor 02', type: 'sensor', status: 'critical', category: 'OT', ip: '192.168.20.16', location: 'Zone B', position: [-30, -10, -5],
    metrics: {
      l1: { temperature: 80 },
      l2: { crcErrors: 0, linkUtilization: 0 },
      l4: { tcpRetransmissions: 0, jitter: 0 },
      l7: { appLatency: 0 }
    }
  },
  {
    id: 'd8', name: 'OpEdge-8D Gateway', type: 'gateway', status: 'healthy', category: 'OT', ip: '192.168.1.50', location: 'Edge Network', manufacturer: 'Belden', position: [-10, 10, -15],
    metrics: {
      l1: { temperature: 40 },
      l2: { crcErrors: 5, linkUtilization: 55 },
      l4: { tcpRetransmissions: 0.1, jitter: 8 },
      l7: { appLatency: 45 }
    }
  },
  {
    id: 'd9', name: 'Global ERP Core', type: 'server', status: 'healthy', category: 'IT', ip: '192.168.1.100', location: 'Server Room', position: [15, 15, 15],
    metrics: {
      l1: { temperature: 22, fanSpeed: 6000 },
      l2: { crcErrors: 0, linkUtilization: 80 },
      l4: { tcpRetransmissions: 0, jitter: 1 },
      l7: { appLatency: 5 }
    }
  },
  {
    id: 'd10', name: 'Hirschmann BOBCAT Switch', type: 'switch', status: 'warning', category: 'OT', ip: '192.168.1.3', location: 'Floor A', manufacturer: 'Hirschmann', position: [25, 5, 25],
    metrics: {
      l1: { temperature: 48, opticalRxPower: -24 },
      l2: { crcErrors: 45, linkUtilization: 35 },
      l4: { tcpRetransmissions: 1.2, jitter: 20 },
      l7: { appLatency: 120 }
    }
  }
];

export const layerKPIs: LayerKPI[] = [
  { layer: 'L1', name: 'Cable Signal Quality', value: 94, unit: '%', status: 'healthy', trend: 'stable', threshold: 85 },
  { layer: 'L1', name: 'CRC Errors', value: 12, unit: 'errors/min', status: 'healthy', trend: 'down', threshold: 50 },
  { layer: 'L1', name: 'Physical Link Up', value: 98, unit: '%', status: 'healthy', trend: 'stable', threshold: 95 },

  { layer: 'L2', name: 'MAC Table Usage', value: 67, unit: '%', status: 'healthy', trend: 'up', threshold: 80 },
  { layer: 'L2', name: 'VLAN Conflicts', value: 0, unit: 'conflicts', status: 'healthy', trend: 'stable', threshold: 1 },
  { layer: 'L2', name: 'Switch Utilization', value: 73, unit: '%', status: 'warning', trend: 'up', threshold: 70 },

  { layer: 'L3', name: 'Routing Table Size', value: 245, unit: 'routes', status: 'healthy', trend: 'stable', threshold: 500 },
  { layer: 'L3', name: 'Packet Loss', value: 0.3, unit: '%', status: 'healthy', trend: 'stable', threshold: 1 },
  { layer: 'L3', name: 'Subnet Availability', value: 99.8, unit: '%', status: 'healthy', trend: 'stable', threshold: 99 },

  { layer: 'L4', name: 'TCP Retransmissions', value: 2.1, unit: '%', status: 'healthy', trend: 'stable', threshold: 5 },
  { layer: 'L4', name: 'UDP Packet Rate', value: 1250, unit: 'pps', status: 'healthy', trend: 'up', threshold: 2000 },
  { layer: 'L4', name: 'Connection Timeouts', value: 8, unit: 'count/hr', status: 'warning', trend: 'up', threshold: 5 },

  { layer: 'L5-7', name: 'Application Response', value: 145, unit: 'ms', status: 'healthy', trend: 'stable', threshold: 200 },
  { layer: 'L5-7', name: 'Modbus/TCP Success', value: 99.2, unit: '%', status: 'healthy', trend: 'stable', threshold: 98 },
  { layer: 'L5-7', name: 'EtherNet/IP Health', value: 98.5, unit: '%', status: 'healthy', trend: 'stable', threshold: 97 },
];

export const alerts: Alert[] = [
  {
    id: 'a1',
    severity: 'critical',
    layer: 'L1',
    device: 'Pressure Sensor 02',
    message: 'Signal degradation detected - possible cable damage',
    timestamp: new Date(Date.now() - 5 * 60000),
    aiCorrelation: 'Correlated with L3 routing issues in Zone B - likely physical layer root cause'
  },
  {
    id: 'a2',
    severity: 'medium',
    layer: 'L2',
    device: 'Hirschmann BOBCAT Switch',
    message: 'Switch utilization approaching threshold',
    timestamp: new Date(Date.now() - 15 * 60000),
    aiCorrelation: 'Traffic pattern suggests normal production ramp-up'
  },
  {
    id: 'a3',
    severity: 'medium',
    layer: 'L4',
    device: 'Lion-M PLC Node A',
    message: 'Increased connection timeouts detected',
    timestamp: new Date(Date.now() - 25 * 60000),
    aiCorrelation: 'No L1-L3 issues detected - possible application layer protocol conflict'
  },
  {
    id: 'a4',
    severity: 'low',
    layer: 'L3',
    device: 'Hirschmann DRAGON MACH4x00',
    message: 'Routing table growing - review subnet allocation',
    timestamp: new Date(Date.now() - 120 * 60000)
  },
];

export const connections: NetworkConnection[] = [
  { id: 'c1', source: 'd2', target: 'd1', bandwidth: 950, latency: 2, status: 'healthy' },
  { id: 'c2', source: 'd1', target: 'd10', bandwidth: 640, latency: 3, status: 'healthy' },
  { id: 'c3', source: 'd1', target: 'd8', bandwidth: 780, latency: 2, status: 'healthy' },
  { id: 'c4', source: 'd1', target: 'd9', bandwidth: 890, latency: 1, status: 'healthy' },
  { id: 'c5', source: 'd8', target: 'd3', bandwidth: 450, latency: 5, status: 'degraded' },
  { id: 'c6', source: 'd8', target: 'd4', bandwidth: 520, latency: 4, status: 'healthy' },
  { id: 'c7', source: 'd10', target: 'd5', bandwidth: 380, latency: 3, status: 'healthy' },
  { id: 'c8', source: 'd10', target: 'd6', bandwidth: 120, latency: 6, status: 'healthy' },
  { id: 'c9', source: 'd10', target: 'd7', bandwidth: 85, latency: 45, status: 'down' },
];

export const dependencyPaths: DependencyPath[] = [
  {
    appId: 'p1',
    appName: 'Profinet realtime',
    criticality: 'high',
    path: ['d10', 'd1', 'd2', 'd9'] // Mapped to IDs: BOBCAT, DRAGON, EAGLE, ERP
  },
  {
    appId: 'p2',
    appName: 'SCADA Control Loop',
    criticality: 'critical',
    path: ['d3', 'd1', 'd5'] // Mapped to IDs: PLC A, DRAGON, SCADA Master
  }
];
