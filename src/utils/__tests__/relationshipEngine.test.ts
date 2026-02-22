/**
 * Test suite for RelationshipEngine (relationshipEngine.ts)
 *
 * Covers:
 * - Clean state (no alerts)
 * - Single root cause identification
 * - Multi-hop propagation tracing
 * - Confidence scoring
 * - Dependency/workflow impact detection
 * - Ambiguous / missing device handling
 */

import { describe, it, expect } from 'vitest';
import { analyzeRelationships } from '../relationshipEngine';
import type { Alert, Device, NetworkConnection, DependencyPath } from '../../types/network';

// ─── Minimal fixture helpers ────────────────────────────────────────────

function makeDevice(overrides: Partial<Device> & { id: string; name: string }): Device {
  return {
    type: 'switch',
    status: 'healthy',
    category: 'IT',
    ip: '10.0.0.1',
    location: 'Lab',
    position: [0, 0, 0],
    metrics: {
      l1: { temperature: 40 },
      l2: { crcErrors: 0, linkUtilization: 30 },
      l3: { packetLoss: 0, routingTableSize: 100, firewallDrops: 0 },
      l4: { tcpRetransmissions: 0, jitter: 1 },
      l5: { sessionResets: 0, sessionStability: 99.9 },
      l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 1 },
      l7: { appLatency: 10 },
    },
    ...overrides,
  };
}

function makeAlert(overrides: Partial<Alert> & { id: string }): Alert {
  return {
    severity: 'medium',
    layer: 'L3',
    device: 'Switch-A',
    message: 'test alert',
    timestamp: new Date(Date.now() - 3 * 60_000),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('analyzeRelationships', () => {
  const deviceA = makeDevice({ id: 'd1', name: 'Switch-A' });
  const deviceB = makeDevice({ id: 'd2', name: 'PLC-B', status: 'warning' });
  const deviceC = makeDevice({ id: 'd3', name: 'Router-C', status: 'critical' });

  const connections: NetworkConnection[] = [
    { id: 'c1', source: 'd1', target: 'd2', bandwidth: 1000, latency: 2, status: 'healthy' },
    { id: 'c2', source: 'd2', target: 'd3', bandwidth: 500, latency: 5, status: 'degraded' },
  ];

  const deps: DependencyPath[] = [
    { appId: 'p1', appName: 'SCADA Loop', criticality: 'mission-critical', path: ['d1', 'd2', 'd3'] },
  ];

  it('returns clean state when no alerts', () => {
    const chain = analyzeRelationships([], [deviceA], [], []);
    expect(chain.diagnosisType).toBe('Isolated');
    expect(chain.confidenceScore).toBe(1.0);
    expect(chain.primaryFault.device).toBe('None');
    expect(chain.summary).toContain('operating normally');
  });

  it('identifies the earliest/lowest-layer alert as root cause', () => {
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L1', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) }),
      makeAlert({ id: 'a2', layer: 'L4', device: 'PLC-B', timestamp: new Date(Date.now() - 5 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA, deviceB], connections, deps);
    expect(chain.primaryFault.device).toBe('Switch-A');
    expect(chain.primaryFault.layer).toBe('L1');
  });

  it('traces downstream propagation to unhealthy neighbors', () => {
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L1', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) }),
      makeAlert({ id: 'a2', layer: 'L4', device: 'PLC-B', timestamp: new Date(Date.now() - 5 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA, deviceB, deviceC], connections, deps);
    // PLC-B is warning -> should appear in propagation
    expect(chain.propagation.length).toBeGreaterThan(0);
    const downstream = chain.propagation.map((p) => p.downstreamDevice);
    expect(downstream).toContain('PLC-B');
  });

  it('calculates higher confidence for physical-layer root causes', () => {
    const l1Alert = makeAlert({ id: 'a1', layer: 'L1', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) });
    const l7Alert = makeAlert({ id: 'a2', layer: 'L7', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) });

    const chainL1 = analyzeRelationships([l1Alert], [deviceA], [], []);
    const chainL7 = analyzeRelationships([l7Alert], [deviceA], [], []);

    expect(chainL1.confidenceScore).toBeGreaterThan(chainL7.confidenceScore);
  });

  it('detects impacted workflows', () => {
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L2', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA, deviceB, deviceC], connections, deps);
    // d1 is in the SCADA Loop dependency path
    expect(chain.impact.affectedWorkflows).toContain('SCADA Loop');
  });

  it('returns Ambiguous chain when root device not in topology', () => {
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L3', device: 'NonExistentDevice' }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA], [], []);
    expect(chain.diagnosisType).toBe('Ambiguous');
    expect(chain.confidenceScore).toBeLessThan(0.5);
  });

  it('confidence is capped at 0.99', () => {
    // L1 root (+0.2), propagation (+0.2), time ordering (+0.1) = 0.5 + 0.5 = 1.0 -> capped at 0.99
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L1', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) }),
      makeAlert({ id: 'a2', layer: 'L7', device: 'PLC-B', timestamp: new Date(Date.now() - 1 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA, deviceB], connections, deps);
    expect(chain.confidenceScore).toBeLessThanOrEqual(0.99);
  });

  it('includes evidence pack with alert IDs and timestamps', () => {
    const now = Date.now();
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L2', device: 'Switch-A', timestamp: new Date(now - 5 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA], [], []);
    expect(chain.evidence.triggeringAlertId).toBe('a1');
    expect(chain.evidence.rootLayer).toBe('L2');
    expect(chain.evidence.timestampWindow.firstAnomaly).toBeGreaterThan(0);
  });

  it('generates meaningful confidence reason strings', () => {
    const alerts = [
      makeAlert({ id: 'a1', layer: 'L1', device: 'Switch-A', timestamp: new Date(Date.now() - 10 * 60_000) }),
      makeAlert({ id: 'a2', layer: 'L7', device: 'PLC-B', timestamp: new Date(Date.now() - 1 * 60_000) }),
    ];
    const chain = analyzeRelationships(alerts, [deviceA, deviceB], connections, []);
    expect(chain.confidenceReason.length).toBeGreaterThan(10);
  });

  it('handles single alert single device', () => {
    const alerts = [makeAlert({ id: 'a1', layer: 'L3', device: 'Switch-A' })];
    const chain = analyzeRelationships(alerts, [deviceA], [], []);
    expect(chain.diagnosisType).toBe('RootCause');
    expect(chain.primaryFault.device).toBe('Switch-A');
    expect(chain.propagation.length).toBe(0);
  });
});
