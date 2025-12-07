import { Device, LayerKPI, Alert, NetworkConnection, DependencyPath } from '../types/network';

export const devices: Device[] = [
  { id: 'd1', name: 'Core Switch 01', type: 'switch', status: 'healthy', ip: '192.168.1.1', location: 'Server Room', manufacturer: 'Hirschmann' },
  { id: 'd2', name: 'Edge Router 01', type: 'router', status: 'healthy', ip: '192.168.1.2', location: 'Network Center', manufacturer: 'EAGLE' },
  { id: 'd3', name: 'PLC Line A', type: 'plc', status: 'warning', ip: '192.168.10.5', location: 'Production Floor A' },
  { id: 'd4', name: 'PLC Line B', type: 'plc', status: 'healthy', ip: '192.168.10.6', location: 'Production Floor B' },
  { id: 'd5', name: 'SCADA Master', type: 'scada', status: 'healthy', ip: '192.168.5.10', location: 'Control Room' },
  { id: 'd6', name: 'Temp Sensor 01', type: 'sensor', status: 'healthy', ip: '192.168.20.15', location: 'Zone A' },
  { id: 'd7', name: 'Pressure Sensor 02', type: 'sensor', status: 'critical', ip: '192.168.20.16', location: 'Zone B' },
  { id: 'd8', name: 'IIoT Gateway', type: 'gateway', status: 'healthy', ip: '192.168.1.50', location: 'Edge Network', manufacturer: 'Belden' },
  { id: 'd9', name: 'Data Server', type: 'server', status: 'healthy', ip: '192.168.1.100', location: 'Server Room' },
  { id: 'd10', name: 'Access Switch 02', type: 'switch', status: 'warning', ip: '192.168.1.3', location: 'Floor A', manufacturer: 'Hirschmann' },
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
    device: 'Access Switch 02',
    message: 'Switch utilization approaching threshold',
    timestamp: new Date(Date.now() - 15 * 60000),
    aiCorrelation: 'Traffic pattern suggests normal production ramp-up'
  },
  {
    id: 'a3',
    severity: 'medium',
    layer: 'L4',
    device: 'PLC Line A',
    message: 'Increased connection timeouts detected',
    timestamp: new Date(Date.now() - 25 * 60000),
    aiCorrelation: 'No L1-L3 issues detected - possible application layer protocol conflict'
  },
  {
    id: 'a4',
    severity: 'low',
    layer: 'L3',
    device: 'Core Switch 01',
    message: 'Routing table growing - review subnet allocation',
    timestamp: new Date(Date.now() - 120 * 60000)
  },
];

export const connections: NetworkConnection[] = [
  { source: 'd2', target: 'd1', bandwidth: 950, latency: 2, status: 'healthy' },
  { source: 'd1', target: 'd10', bandwidth: 640, latency: 3, status: 'healthy' },
  { source: 'd1', target: 'd8', bandwidth: 780, latency: 2, status: 'healthy' },
  { source: 'd1', target: 'd9', bandwidth: 890, latency: 1, status: 'healthy' },
  { source: 'd8', target: 'd3', bandwidth: 450, latency: 5, status: 'degraded' },
  { source: 'd8', target: 'd4', bandwidth: 520, latency: 4, status: 'healthy' },
  { source: 'd10', target: 'd5', bandwidth: 380, latency: 3, status: 'healthy' },
  { source: 'd10', target: 'd6', bandwidth: 120, latency: 6, status: 'healthy' },
  { source: 'd10', target: 'd7', bandwidth: 85, latency: 45, status: 'down' },
];

export const dependencyPaths: DependencyPath[] = [
  {
    appId: 'app1',
    appName: 'SCADA Control Loop',
    criticality: 'mission-critical',
    path: ['d5', 'd10', 'd1', 'd8', 'd3'] // SCADA -> Switch -> Core -> Gateway -> PLC
  },
  {
    appId: 'app2',
    appName: 'Inventory Sync',
    criticality: 'medium',
    path: ['d9', 'd1', 'd2'] // Server -> Core Switch -> Edge Router
  },
  {
    appId: 'app3',
    appName: 'Zone B Monitoring',
    criticality: 'high',
    path: ['d7', 'd10', 'd1', 'd5'] // Sensor -> Switch -> Core -> SCADA
  }
];
