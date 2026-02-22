import { Device, LayerKPI, Alert, NetworkConnection, DependencyPath } from '../types/network';

export const devices: Device[] = [
  {
    id: 'd1', name: 'Hirschmann DRAGON MACH4x00', type: 'switch', status: 'healthy', category: 'OT', ip: '192.168.1.1', location: 'Server Room', manufacturer: 'Hirschmann', vlan: 1, subnetMask: '/24', position: [0, 0, 0],
    metrics: {
      l1: { temperature: 42, fanSpeed: 4500 },
      l2: { crcErrors: 0, linkUtilization: 45 },
      l3: { packetLoss: 0.1, routingTableSize: 245, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0.01, jitter: 2 },
      l5: { sessionResets: 0, sessionStability: 99.9 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 1 },
      l7: { appLatency: 15 }
    }
  },
  {
    id: 'd2', name: 'Hirschmann EAGLE40 Firewall', type: 'firewall', status: 'healthy', category: 'IT', ip: '192.168.1.2', location: 'Network Center', manufacturer: 'Belden', vlan: 1, subnetMask: '/24', position: [-20, 0, 10],
    metrics: {
      l1: { temperature: 45, fanSpeed: 4200 },
      l2: { crcErrors: 2, linkUtilization: 60 },
      l3: { packetLoss: 0.2, routingTableSize: 310, firewallDrops: 12 },
      l4: { tcpRetransmissions: 0.05, jitter: 5 },
      l5: { sessionResets: 1, sessionStability: 99.6 },
      l6: { tlsHandshakeFailures: 2, encryptionOverheadMs: 3 },
      l7: { appLatency: 25 }
    }
  },
  {
    id: 'd3', name: 'Lion-M PLC Node A', type: 'plc', status: 'warning', category: 'OT', ip: '192.168.10.5', location: 'Production Floor A', vlan: 10, subnetMask: '/24', position: [20, 0, -10],
    metrics: {
      l1: { temperature: 65, fanSpeed: 0 },
      l2: { crcErrors: 150, linkUtilization: 10 },
      l3: { packetLoss: 2.1, routingTableSize: 48, firewallDrops: 0 },
      l4: { tcpRetransmissions: 2.4, jitter: 45 },
      l5: { sessionResets: 6, sessionStability: 93.2 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
      l7: { appLatency: 350 }
    }
  },
  {
    id: 'd4', name: 'Lion-M PLC Node B', type: 'plc', status: 'healthy', category: 'OT', ip: '192.168.10.6', location: 'Production Floor B', vlan: 10, subnetMask: '/24', position: [10, 0, 20],
    metrics: {
      l1: { temperature: 38 },
      l2: { crcErrors: 0, linkUtilization: 12 },
      l3: { packetLoss: 0.0, routingTableSize: 44, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0, jitter: 1 },
      l5: { sessionResets: 0, sessionStability: 99.8 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
      l7: { appLatency: 5 }
    }
  },
  {
    id: 'd5', name: 'SCADA Control Loop', type: 'scada', status: 'healthy', category: 'OT', ip: '192.168.5.10', location: 'Control Room', vlan: 5, subnetMask: '/24', position: [0, 20, 0],
    metrics: {
      l1: { temperature: 35 },
      l2: { crcErrors: 0, linkUtilization: 30 },
      l3: { packetLoss: 0.1, routingTableSize: 120, firewallDrops: 1 },
      l4: { tcpRetransmissions: 0.02, jitter: 3 },
      l5: { sessionResets: 0, sessionStability: 99.7 },
      l6: { tlsHandshakeFailures: 1, encryptionOverheadMs: 2 },
      l7: { appLatency: 12 }
    }
  },
  {
    id: 'd6', name: 'Temp Sensor 01', type: 'sensor', status: 'healthy', category: 'OT', ip: '192.168.20.15', location: 'Zone A', vlan: 20, subnetMask: '/24', position: [30, -10, 5],
    metrics: {
      l1: { temperature: 25 },
      l2: { crcErrors: 0, linkUtilization: 1 },
      l3: { packetLoss: 0.0, routingTableSize: 10, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0, jitter: 0 },
      l5: { sessionResets: 0, sessionStability: 100.0 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
      l7: { appLatency: 2 }
    }
  },
  {
    id: 'd7', name: 'Pressure Sensor 02', type: 'sensor', status: 'warning', category: 'OT', ip: '192.168.20.16', location: 'Zone B', vlan: 20, subnetMask: '/24', position: [-30, -10, -5],
    metrics: {
      l1: { temperature: 55 },
      l2: { crcErrors: 6, linkUtilization: 2 },
      l3: { packetLoss: 2.8, routingTableSize: 10, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0.1, jitter: 4 },
      l5: { sessionResets: 4, sessionStability: 95.2 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
      l7: { appLatency: 22 }
    }
  },
  {
    id: 'd8', name: 'OpEdge-8D Gateway', type: 'gateway', status: 'healthy', category: 'OT', ip: '192.168.1.50', location: 'Edge Network', manufacturer: 'Belden', vlan: 1, subnetMask: '/24', position: [-10, 10, -15],
    metrics: {
      l1: { temperature: 40 },
      l2: { crcErrors: 5, linkUtilization: 55 },
      l3: { packetLoss: 0.4, routingTableSize: 180, firewallDrops: 3 },
      l4: { tcpRetransmissions: 0.1, jitter: 8 },
      l5: { sessionResets: 2, sessionStability: 98.9 },
      l6: { tlsHandshakeFailures: 1, encryptionOverheadMs: 4 },
      l7: { appLatency: 45 }
    }
  },
  {
    id: 'd9', name: 'Global ERP Core', type: 'server', status: 'healthy', category: 'IT', ip: '192.168.1.100', location: 'Server Room', vlan: 1, subnetMask: '/24', position: [15, 15, 15],
    metrics: {
      l1: { temperature: 22, fanSpeed: 6000 },
      l2: { crcErrors: 0, linkUtilization: 80 },
      l3: { packetLoss: 0.0, routingTableSize: 520, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0, jitter: 1 },
      l5: { sessionResets: 0, sessionStability: 99.95 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 1 },
      l7: { appLatency: 5 }
    }
  },
  {
    id: 'd10', name: 'Hirschmann BOBCAT Switch', type: 'switch', status: 'warning', category: 'OT', ip: '192.168.1.3', location: 'Floor A', manufacturer: 'Hirschmann', vlan: 1, subnetMask: '/24', position: [25, 5, 25],
    metrics: {
      l1: { temperature: 48, opticalRxPower: -24 },
      l2: { crcErrors: 45, linkUtilization: 35 },
      l3: { packetLoss: 1.8, routingTableSize: 160, firewallDrops: 0 },
      l4: { tcpRetransmissions: 1.2, jitter: 20 },
      l5: { sessionResets: 3, sessionStability: 97.2 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
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

  { layer: 'L5', name: 'Session Stability', value: 99.4, unit: '%', status: 'healthy', trend: 'stable', threshold: 98 },
  { layer: 'L5', name: 'Session Resets', value: 2, unit: 'count/hr', status: 'healthy', trend: 'down', threshold: 10 },

  { layer: 'L6', name: 'TLS Handshake Failures', value: 1, unit: 'count/hr', status: 'healthy', trend: 'stable', threshold: 5 },
  { layer: 'L6', name: 'Encryption Overhead', value: 3, unit: 'ms', status: 'healthy', trend: 'stable', threshold: 10 },

  { layer: 'L7', name: 'Application Response', value: 145, unit: 'ms', status: 'healthy', trend: 'stable', threshold: 200 },
  { layer: 'L7', name: 'Modbus/TCP Success', value: 99.2, unit: '%', status: 'healthy', trend: 'stable', threshold: 98 },
  { layer: 'L7', name: 'EtherNet/IP Health', value: 98.5, unit: '%', status: 'healthy', trend: 'stable', threshold: 97 },
];

// Alerts are now derived dynamically from device metrics and connection
// states at runtime (see useNetworkStore.deriveAlertsFromState).
// This export is kept for type compatibility but is intentionally empty.
export const alerts: Alert[] = [];

export const connections: NetworkConnection[] = [
  { id: 'c1', source: 'd2', target: 'd1', bandwidth: 950, latency: 2, status: 'healthy' },
  { id: 'c2', source: 'd1', target: 'd10', bandwidth: 640, latency: 3, status: 'healthy' },
  { id: 'c3', source: 'd1', target: 'd8', bandwidth: 780, latency: 2, status: 'healthy' },
  { id: 'c4', source: 'd1', target: 'd9', bandwidth: 890, latency: 1, status: 'healthy' },
  { id: 'c5', source: 'd8', target: 'd3', bandwidth: 450, latency: 5, status: 'degraded' },
  { id: 'c6', source: 'd8', target: 'd4', bandwidth: 520, latency: 4, status: 'healthy' },
  { id: 'c7', source: 'd10', target: 'd5', bandwidth: 380, latency: 3, status: 'healthy' },
  { id: 'c8', source: 'd10', target: 'd6', bandwidth: 120, latency: 6, status: 'healthy' },
  { id: 'c9', source: 'd10', target: 'd7', bandwidth: 85, latency: 18, status: 'degraded' },
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
    criticality: 'mission-critical',
    path: ['d3', 'd1', 'd5'] // Mapped to IDs: PLC A, DRAGON, SCADA Master
  }
];
