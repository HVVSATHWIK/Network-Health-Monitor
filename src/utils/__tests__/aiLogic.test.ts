/**
 * Comprehensive test suite for AI Logic engine (aiLogic.ts)
 *
 * Covers:
 * - Intent classification (classifyIntent)
 * - Runtime context stripping
 * - Status reports (buildStatusText)
 * - Device-specific queries (buildDeviceSpecificResponse)
 * - Offline general knowledge (buildOfflineGeneralKnowledgeResponse)
 * - Website/navigation assistance (buildWebsiteAssistText)
 * - Full analysis pipeline (analyzeWithMultiAgents) — greeting, status, diagnostic, general, fallback
 * - Deterministic forensic reports
 * - Criticality derivation & recommendation mapping
 * - Smart fallback (no Gemini)
 */

import { describe, it, expect } from 'vitest';
import type { Alert, Device, NetworkConnection, DependencyPath, CausalChain } from '../../types/network';
import { _testExports, analyzeWithMultiAgents, type ForensicReport } from '../aiLogic';

const {
  classifyIntent,
  stripRuntimeContext,
  buildStatusText,
  buildDeviceSpecificResponse,
  buildOfflineGeneralKnowledgeResponse,
  buildWebsiteAssistText,
  buildSmartFallbackResponse,
  buildDeterministicForensicReport,
  buildHealthyForensicReport,
  deriveCriticality,
  buildRecommendations,
} = _testExports;

// ─── Test Fixtures ──────────────────────────────────────────────────────

function makeDevice(overrides: Partial<Device> & { id: string; name: string }): Device {
  return {
    type: 'switch',
    status: 'healthy',
    category: 'IT',
    ip: '10.0.0.1',
    location: 'Test Lab',
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
    message: 'Test alert',
    timestamp: new Date(Date.now() - 3 * 60_000), // 3 min ago
    ...overrides,
  };
}

function makeConnection(overrides: Partial<NetworkConnection> & { id: string }): NetworkConnection {
  return {
    source: 'd1',
    target: 'd2',
    bandwidth: 1000,
    latency: 2,
    status: 'healthy',
    ...overrides,
  };
}

// Standard fixtures
const healthyDevice = makeDevice({ id: 'd1', name: 'Switch-A' });
const warningDevice = makeDevice({
  id: 'd2',
  name: 'PLC-Node-X',
  type: 'plc',
  status: 'warning',
  ip: '10.0.1.5',
  category: 'OT',
  metrics: {
    l1: { temperature: 68 },
    l2: { crcErrors: 120, linkUtilization: 15 },
    l3: { packetLoss: 2.5, routingTableSize: 50, firewallDrops: 0 },
    l4: { tcpRetransmissions: 3.0, jitter: 40 },
    l5: { sessionResets: 5, sessionStability: 94 },
    l6: { tlsHandshakeFailures: 0, encryptionOverheadMs: 0 },
    l7: { appLatency: 300 },
  },
});
const criticalDevice = makeDevice({
  id: 'd3',
  name: 'Core-Router',
  type: 'router',
  status: 'critical',
  ip: '10.0.0.254',
  metrics: {
    l1: { temperature: 80 },
    l2: { crcErrors: 500, linkUtilization: 95 },
    l3: { packetLoss: 8.0, routingTableSize: 600, firewallDrops: 50 },
    l4: { tcpRetransmissions: 10, jitter: 100 },
    l5: { sessionResets: 20, sessionStability: 80 },
    l6: { tlsHandshakeFailures: 5, encryptionOverheadMs: 10 },
    l7: { appLatency: 800 },
  },
});

const allDevices = [healthyDevice, warningDevice, criticalDevice];
const allAlerts: Alert[] = [
  makeAlert({ id: 'a1', severity: 'medium', layer: 'L1', device: 'PLC-Node-X', message: 'Temp above threshold' }),
  makeAlert({ id: 'a2', severity: 'high', layer: 'L2', device: 'Core-Router', message: 'CRC errors spiking' }),
  makeAlert({ id: 'a3', severity: 'critical', layer: 'L3', device: 'Core-Router', message: 'Packet loss > 5%' }),
];
const allConnections: NetworkConnection[] = [
  makeConnection({ id: 'c1', source: 'd1', target: 'd2', status: 'healthy' }),
  makeConnection({ id: 'c2', source: 'd1', target: 'd3', status: 'degraded', latency: 50 }),
  makeConnection({ id: 'c3', source: 'd2', target: 'd3', status: 'down', latency: 999 }),
];
const allDeps: DependencyPath[] = [
  { appId: 'p1', appName: 'SCADA Loop', criticality: 'mission-critical', path: ['d1', 'd2', 'd3'] },
];

// ─── classifyIntent ─────────────────────────────────────────────────────

describe('classifyIntent', () => {
  it('classifies status queries', () => {
    expect(classifyIntent('show me the active alerts')).toBe('STATUS_CHECK');
    expect(classifyIntent('what is the current status?')).toBe('STATUS_CHECK');
    expect(classifyIntent('is the network healthy?')).toBe('STATUS_CHECK');
    expect(classifyIntent('give me a summary')).toBe('STATUS_CHECK');
    expect(classifyIntent('how is the network')).toBe('STATUS_CHECK');
    expect(classifyIntent('any problems?')).toBe('STATUS_CHECK');
    expect(classifyIntent('sitrep')).toBe('STATUS_CHECK');
    expect(classifyIntent('overview')).toBe('STATUS_CHECK');
  });

  it('classifies diagnostic queries', () => {
    expect(classifyIntent('analyze root cause')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('why is PLC-Node-X critical?')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent("what's wrong with the network?")).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('run a diagnostic scan')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('investigate the failure')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('blast radius of this issue')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('trace the propagation')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('troubleshoot this issue')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('security scan')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('vulnerability assessment')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('the network is slow')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('connection timeout')).toBe('DIAGNOSTIC_ANALYSIS');
  });

  it('classifies website assistance queries', () => {
    expect(classifyIntent('where is the heatmap?')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('how do I open forensic cockpit')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('guide me through the dashboard')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('how to import data')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('which button for 3d topology')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('click a device to see details')).toBe('WEBSITE_ASSIST');
    expect(classifyIntent('navigate to analytics view')).toBe('WEBSITE_ASSIST');
  });

  it('classifies general knowledge queries', () => {
    expect(classifyIntent('what is TCP?')).toBe('GENERAL_KNOWLEDGE');
    expect(classifyIntent('tell me about CRC errors')).toBe('GENERAL_KNOWLEDGE');
    expect(classifyIntent('who are you?')).toBe('GENERAL_KNOWLEDGE');
    expect(classifyIntent('hello')).toBe('GENERAL_KNOWLEDGE');
    expect(classifyIntent('what does SCADA stand for?')).toBe('GENERAL_KNOWLEDGE');
  });

  it('strips runtime context before classifying', () => {
    const query = 'what is the status? RUNTIME SYSTEM CONTEXT: devices=10 alerts=3';
    expect(classifyIntent(query)).toBe('STATUS_CHECK');
  });

  it('handles empty and very short queries', () => {
    expect(classifyIntent('')).toBe('GENERAL_KNOWLEDGE');
    expect(classifyIntent('a')).toBe('GENERAL_KNOWLEDGE');
  });

  it('does NOT let "unhealthy" match the "health" status hint (word boundary)', () => {
    // This was the root cause of the Forensic Cockpit / Diagnostic Scan bug:
    // prompts containing "unhealthy devices" were mis-classified as STATUS_CHECK.
    expect(classifyIntent('Forensic analysis requested. 1 unhealthy devices. Investigate root cause.')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('Initiate diagnostic scan. unhealthyDevices=2. Scan request id: 123.')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('3 unhealthy nodes detected, analyze impact')).toBe('DIAGNOSTIC_ANALYSIS');
  });

  it('still classifies standalone "health" as STATUS_CHECK', () => {
    expect(classifyIntent('is the network healthy?')).toBe('STATUS_CHECK');
    expect(classifyIntent('network health report')).toBe('STATUS_CHECK');
    expect(classifyIntent('check health')).toBe('STATUS_CHECK');
  });

  it('prioritizes diagnostic over status when both hints present', () => {
    // "analysis" (diagnostic) + system message text that might contain status-like words
    expect(classifyIntent('Forensic diagnostic analysis of current alerts and degraded links')).toBe('DIAGNOSTIC_ANALYSIS');
    expect(classifyIntent('Analyze the status of all critical devices')).toBe('DIAGNOSTIC_ANALYSIS');
  });
});

// ─── stripRuntimeContext ────────────────────────────────────────────────

describe('stripRuntimeContext', () => {
  it('removes everything after "RUNTIME SYSTEM CONTEXT:"', () => {
    const stripped = stripRuntimeContext('my query RUNTIME SYSTEM CONTEXT: lots of data');
    expect(stripped).toBe('my query');
  });

  it('returns original string when no marker present', () => {
    expect(stripRuntimeContext('  plain query  ')).toBe('plain query');
  });

  it('handles empty string', () => {
    expect(stripRuntimeContext('')).toBe('');
  });
});

// ─── buildStatusText ────────────────────────────────────────────────────

describe('buildStatusText', () => {
  it('returns healthy message when no alerts or unhealthy devices', () => {
    const result = buildStatusText([], [healthyDevice]);
    expect(result).toContain('✅');
    expect(result).toContain('Network Healthy');
    expect(result).toContain('1 devices');
  });

  it('reports alerts, unhealthy devices, and degraded links', () => {
    const result = buildStatusText(allAlerts, allDevices, allConnections);
    expect(result).toContain('Network Status Report');
    expect(result).toContain('Critical alert');
    expect(result).toContain('High alert');
    expect(result).toContain('unhealthy');
    expect(result).toContain('degraded or down');
    expect(result).toContain('Core-Router');
    expect(result).toContain('PLC-Node-X');
  });

  it('includes actionable recommendations for critical issues', () => {
    const result = buildStatusText(allAlerts, allDevices, allConnections);
    expect(result).toContain('analyze root cause');
  });

  it('works without connections argument', () => {
    const result = buildStatusText(allAlerts, allDevices);
    expect(result).toContain('Network Status Report');
    expect(result).not.toContain('degraded or down');
  });
});

// ─── buildDeviceSpecificResponse ────────────────────────────────────────

describe('buildDeviceSpecificResponse', () => {
  it('returns null when no device matches', () => {
    const result = buildDeviceSpecificResponse('how is nonexistent-device?', allAlerts, allDevices, allConnections);
    expect(result).toBeNull();
  });

  it('matches device by name (case-insensitive)', () => {
    const result = buildDeviceSpecificResponse('how is plc-node-x doing?', allAlerts, allDevices, allConnections);
    expect(result).not.toBeNull();
    expect(result).toContain('PLC-Node-X');
    expect(result).toContain('warning');
    expect(result).toContain('Temperature');
    expect(result).toContain('CRC Errors');
  });

  it('matches device by ID', () => {
    const result = buildDeviceSpecificResponse('status of d1', allAlerts, allDevices, allConnections);
    expect(result).not.toBeNull();
    expect(result).toContain('Switch-A');
  });

  it('shows active alerts for matched device', () => {
    const result = buildDeviceSpecificResponse('tell me about core-router', allAlerts, allDevices, allConnections);
    expect(result).not.toBeNull();
    expect(result).toContain('Active Alerts');
    expect(result).toContain('CRC errors spiking');
    expect(result).toContain('Packet loss > 5%');
  });

  it('shows degraded links for matched device', () => {
    const result = buildDeviceSpecificResponse('core-router', allAlerts, allDevices, allConnections);
    expect(result).not.toBeNull();
    expect(result).toContain('Degraded Links');
  });

  it('suggests root cause analysis for unhealthy devices', () => {
    const result = buildDeviceSpecificResponse('plc-node-x', allAlerts, allDevices, allConnections);
    expect(result).not.toBeNull();
    expect(result).toContain('analyze root cause');
  });

  it('does NOT suggest root cause analysis for healthy devices', () => {
    const result = buildDeviceSpecificResponse('switch-a', [], [healthyDevice], allConnections);
    expect(result).not.toBeNull();
    expect(result).not.toContain('analyze root cause');
  });

  it('includes table with device properties', () => {
    const result = buildDeviceSpecificResponse('switch-a', [], [healthyDevice], allConnections);
    expect(result).toContain('| Property | Value |');
    expect(result).toContain('Type');
    expect(result).toContain('IP');
  });

  it('strips runtime context before matching', () => {
    const result = buildDeviceSpecificResponse(
      'How is PLC-Node-X? RUNTIME SYSTEM CONTEXT: blah blah',
      allAlerts,
      allDevices,
      allConnections
    );
    expect(result).not.toBeNull();
    expect(result).toContain('PLC-Node-X');
  });
});

// ─── buildOfflineGeneralKnowledgeResponse ───────────────────────────────

describe('buildOfflineGeneralKnowledgeResponse', () => {
  const knownTopics = [
    { query: 'what is CRC?', keyword: 'CRC' },
    { query: 'explain latency', keyword: 'Latency' },
    { query: 'tell me about jitter', keyword: 'Jitter' },
    { query: 'packet loss overview', keyword: 'Packet loss' },
    { query: 'explain the OSI model', keyword: 'OSI Model' },
    { query: 'what is TCP?', keyword: 'TCP' },
    { query: 'what is UDP?', keyword: 'UDP' },
    { query: 'tell me about VLAN', keyword: 'VLAN' },
    { query: 'what is Modbus TCP?', keyword: 'Modbus' },
    { query: 'what is SCADA?', keyword: 'SCADA' },
    { query: 'what is a PLC?', keyword: 'PLC' },
    { query: 'explain STP', keyword: 'STP' },
    { query: 'what is QoS?', keyword: 'QoS' },
    { query: 'what is a firewall?', keyword: 'Firewall' },
    { query: 'what is DNS?', keyword: 'DNS' },
    { query: 'explain SNMP', keyword: 'SNMP' },
    { query: 'bandwidth vs throughput', keyword: 'Bandwidth' },
    { query: 'duplex mismatch', keyword: 'Duplex' },
    { query: 'EtherNet/IP protocol', keyword: 'EtherNet/IP' },
    { query: 'what is PROFINET?', keyword: 'PROFINET' },
    { query: 'explain OSPF', keyword: 'OSPF' },
    { query: 'what is BGP?', keyword: 'BGP' },
    { query: 'what is ARP?', keyword: 'ARP' },
    { query: 'explain NAT', keyword: 'NAT' },
    { query: 'OPC UA protocol', keyword: 'OPC UA' },
    { query: 'RSTP convergence', keyword: 'RSTP' },
    { query: 'IT/OT convergence', keyword: 'IT/OT' },
  ];

  knownTopics.forEach(({ query, keyword }) => {
    it(`recognizes "${keyword}" queries`, () => {
      const result = buildOfflineGeneralKnowledgeResponse(query);
      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(20);
    });
  });

  it('handles identity questions ("who are you")', () => {
    const result = buildOfflineGeneralKnowledgeResponse('who are you?');
    expect(result).not.toBeNull();
    expect(result).toContain('NetMonit AI');
  });

  it('handles "what is netmonit" questions', () => {
    const result = buildOfflineGeneralKnowledgeResponse('what is netmonit?');
    expect(result).not.toBeNull();
    expect(result).toContain('NetMonit');
    expect(result).toContain('Industrial');
  });

  it('handles capability questions', () => {
    const result = buildOfflineGeneralKnowledgeResponse('what can you do?');
    expect(result).not.toBeNull();
    expect(result).toContain('Root Cause');
    expect(result).toContain('Status');
  });

  it('returns null for unknown queries', () => {
    expect(buildOfflineGeneralKnowledgeResponse('random nonsense xyz')).toBeNull();
    expect(buildOfflineGeneralKnowledgeResponse('whats the weather today')).toBeNull();
  });

  it('strips runtime context before matching', () => {
    const result = buildOfflineGeneralKnowledgeResponse('what is CRC? RUNTIME SYSTEM CONTEXT: ...');
    expect(result).not.toBeNull();
  });
});

// ─── buildWebsiteAssistText ─────────────────────────────────────────────

describe('buildWebsiteAssistText', () => {
  it('responds with navigation guidance', () => {
    const result = buildWebsiteAssistText('where is the heatmap?', [], allDevices, allConnections);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(20);
  });

  it('includes live stats in the response', () => {
    const result = buildWebsiteAssistText('how do I open forensic cockpit', allAlerts, allDevices, allConnections);
    expect(result).toContain('alert');
  });

  it('handles 3D topology questions', () => {
    const result = buildWebsiteAssistText('where is the 3d topology', [], allDevices, allConnections);
    expect(result.length).toBeGreaterThan(10);
  });

  it('handles device click questions', () => {
    const result = buildWebsiteAssistText('how do I click a device to see details?', [], allDevices, allConnections);
    expect(result.length).toBeGreaterThan(10);
  });
});

// ─── buildRecommendations ───────────────────────────────────────────────

describe('buildRecommendations', () => {
  const layers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

  layers.forEach((layer) => {
    it(`returns non-empty recommendations for ${layer}`, () => {
      const recs = buildRecommendations(layer);
      expect(recs.length).toBeGreaterThan(0);
      recs.forEach((r) => expect(typeof r).toBe('string'));
    });
  });

  it('returns fallback recommendations for unknown layers', () => {
    const recs = buildRecommendations('L99');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toContain('telemetry');
  });
});

// ─── deriveCriticality ──────────────────────────────────────────────────

describe('deriveCriticality', () => {
  const baseChain: CausalChain = {
    id: 'test',
    confidenceScore: 0.5,
    confidenceReason: '',
    diagnosisType: 'RootCause',
    primaryFault: { device: 'Test', layer: 'L3', reason: 'test' },
    propagation: [],
    impact: { technical: [], operational: [], impactedDeviceIds: [], affectedWorkflows: [] },
    evidence: { triggeringAlertId: '', rootLayer: 'L3', affectedMetrics: [], timestampWindow: { firstAnomaly: 0, lastEscalation: 0 } },
    summary: '',
  };

  it('returns extreme for L1/L2 root with high confidence', () => {
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.85, primaryFault: { device: 'X', layer: 'L1', reason: '' } }, allAlerts)).toBe('extreme');
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.85, primaryFault: { device: 'X', layer: 'L2', reason: '' } }, allAlerts)).toBe('extreme');
  });

  it('returns extreme for critical alerts with high confidence', () => {
    const critAlerts = [makeAlert({ id: 'x', severity: 'critical', layer: 'L3' })];
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.75 }, critAlerts)).toBe('extreme');
  });

  it('returns high for high alerts', () => {
    const highAlerts = [makeAlert({ id: 'x', severity: 'high', layer: 'L3' })];
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.5 }, highAlerts)).toBe('high');
  });

  it('returns medium for moderate confidence without severe alerts', () => {
    const lowAlerts = [makeAlert({ id: 'x', severity: 'low', layer: 'L3' })];
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.55 }, lowAlerts)).toBe('medium');
  });

  it('returns low for low confidence and low severity alerts', () => {
    const lowAlerts = [makeAlert({ id: 'x', severity: 'low', layer: 'L3' })];
    expect(deriveCriticality({ ...baseChain, confidenceScore: 0.3 }, lowAlerts)).toBe('low');
  });
});

// ─── buildDeterministicForensicReport ───────────────────────────────────

describe('buildDeterministicForensicReport', () => {
  it('returns a valid ForensicReport with alerts', () => {
    const report = buildDeterministicForensicReport(
      'analyze root cause',
      allAlerts,
      allDevices,
      allConnections,
      allDeps
    );
    expect(report).toBeDefined();
    expect(report.criticality).toBeDefined();
    expect(['low', 'medium', 'high', 'extreme']).toContain(report.criticality);
    expect(report.rootCause).toBeDefined();
    expect(report.rootCause.length).toBeGreaterThan(0);
    expect(report.chainOfThought.length).toBe(5);
    expect(report.artifacts.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.summary).toBeDefined();
  });

  it('all chain-of-thought steps are "success"', () => {
    const report = buildDeterministicForensicReport('diagnose', allAlerts, allDevices, allConnections, []);
    report.chainOfThought.forEach((step) => {
      expect(step.status).toBe('success');
      expect(step.agent).toBeDefined();
    });
  });

  it('artifacts contain causal chain data', () => {
    const report = buildDeterministicForensicReport('rca', allAlerts, allDevices, allConnections, allDeps);
    const artifact = report.artifacts.find((a) => a.type === 'json_log');
    expect(artifact).toBeDefined();
    expect((artifact!.data as { causalChain: CausalChain }).causalChain).toBeDefined();
  });
});

// ─── buildHealthyForensicReport ─────────────────────────────────────────

describe('buildHealthyForensicReport', () => {
  it('returns low criticality for healthy network', () => {
    const report = buildHealthyForensicReport('run a diagnostic', [healthyDevice], []);
    expect(report.criticality).toBe('low');
    expect(report.rootCause).toContain('No active root cause');
    expect(report.summary).toContain('operating normally');
  });

  it('has at least 2 chain-of-thought steps', () => {
    const report = buildHealthyForensicReport('status check', allDevices, allConnections);
    expect(report.chainOfThought.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── buildSmartFallbackResponse ─────────────────────────────────────────

describe('buildSmartFallbackResponse', () => {
  it('provides helpful response with no alerts', () => {
    const result = buildSmartFallbackResponse('random question', [], [healthyDevice], []);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(10);
  });

  it('gives summary of live issues when they exist', () => {
    const result = buildSmartFallbackResponse('tell me something', allAlerts, allDevices, allConnections);
    expect(result).toContain('alert');
  });

  it('matches device names in query and returns device info', () => {
    const result = buildSmartFallbackResponse(
      'what about PLC-Node-X?',
      allAlerts,
      allDevices,
      allConnections
    );
    expect(result).toContain('PLC-Node-X');
  });

  it('strips runtime context before matching', () => {
    const result = buildSmartFallbackResponse(
      'switch-a RUNTIME SYSTEM CONTEXT: data here',
      [],
      [healthyDevice],
      allConnections
    );
    expect(result).toContain('Switch-A');
  });
});

// ─── analyzeWithMultiAgents (integration tests) ─────────────────────────

describe('analyzeWithMultiAgents', () => {
  // These tests run without Gemini (no API key), exercising all deterministic paths.

  describe('greeting handling', () => {
    it('responds to "hi" with greeting', async () => {
      const result = await analyzeWithMultiAgents('hi', null, allAlerts, allDevices, allConnections, allDeps);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('👋');
    });

    it('responds to "hello" with greeting', async () => {
      const result = await analyzeWithMultiAgents('hello', null, [], [healthyDevice], [], []);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('👋');
    });

    it('includes alert count in greeting when issues present', async () => {
      const result = await analyzeWithMultiAgents('hey', null, allAlerts, allDevices, allConnections, allDeps);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('alert');
    });

    it('mentions healthy network in greeting when no issues', async () => {
      const result = await analyzeWithMultiAgents('good morning', null, [], [healthyDevice], [], []);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('healthy');
    });
  });

  describe('STATUS_CHECK intent', () => {
    it('returns status text for general status query', async () => {
      const result = await analyzeWithMultiAgents(
        'show me the active alerts',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('Network Status Report');
    });

    it('returns device-specific response when device mentioned in status query', async () => {
      const result = await analyzeWithMultiAgents(
        'how is plc-node-x?',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('PLC-Node-X');
      expect((result as string)).toContain('warning');
    });

    it('shows healthy report when all devices healthy', async () => {
      const result = await analyzeWithMultiAgents(
        'is the network healthy?',
        null,
        [],
        [healthyDevice],
        [],
        []
      );
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('✅');
    });
  });

  describe('DIAGNOSTIC_ANALYSIS intent', () => {
    it('returns ForensicReport for diagnostic query with alerts', async () => {
      const result = await analyzeWithMultiAgents(
        'analyze root cause',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      expect(typeof result).toBe('object');
      const report = result as ForensicReport;
      expect(report.criticality).toBeDefined();
      expect(report.rootCause).toBeDefined();
      expect(report.chainOfThought).toBeDefined();
      expect(report.artifacts).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('returns healthy ForensicReport when no issues present', async () => {
      const result = await analyzeWithMultiAgents(
        "what's wrong?",
        null,
        [],
        [healthyDevice],
        [makeConnection({ id: 'c1', source: 'd1', target: 'd1', status: 'healthy' })],
        []
      );
      expect(typeof result).toBe('object');
      const report = result as ForensicReport;
      expect(report.criticality).toBe('low');
      expect(report.summary).toContain('operating normally');
    });

    it('forensic report contains propagation data', async () => {
      const result = await analyzeWithMultiAgents(
        'investigate the failure',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      const report = result as ForensicReport;
      expect(report.chainOfThought.some((s) => s.agent === 'Reliability')).toBe(true);
      expect(report.chainOfThought.some((s) => s.agent === 'Performance')).toBe(true);
      expect(report.chainOfThought.some((s) => s.agent === 'Security')).toBe(true);
    });
  });

  describe('GENERAL_KNOWLEDGE intent', () => {
    it('answers CRC knowledge queries offline', async () => {
      const result = await analyzeWithMultiAgents(
        'what is CRC?',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('CRC');
    });

    it('answers identity queries', async () => {
      const result = await analyzeWithMultiAgents(
        'who are you?',
        null,
        [],
        [healthyDevice],
        [],
        []
      );
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('NetMonit AI');
    });

    it('falls back to smart fallback for unknown queries without Gemini', async () => {
      const result = await analyzeWithMultiAgents(
        'what is the meaning of life?',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      // Should either return a deterministic report (live issues) or fallback string
      expect(result).toBeDefined();
      if (typeof result === 'string') {
        expect(result.length).toBeGreaterThan(10);
      } else {
        // Got a ForensicReport because there are live issues
        expect(result.summary).toBeDefined();
      }
    });
  });

  describe('WEBSITE_ASSIST intent', () => {
    it('returns navigation guidance for website questions', async () => {
      const result = await analyzeWithMultiAgents(
        'where is the heatmap?',
        null,
        allAlerts,
        allDevices,
        allConnections,
        allDeps
      );
      expect(typeof result).toBe('string');
      expect((result as string).length).toBeGreaterThan(20);
    });
  });

  describe('backward compatibility', () => {
    it('works with legacy argument style (no connections/deps)', async () => {
      const result = await analyzeWithMultiAgents(
        'summary',
        null,
        allAlerts,
        allDevices
      );
      expect(result).toBeDefined();
      // Should still produce a status text
      if (typeof result === 'string') {
        expect(result.length).toBeGreaterThan(10);
      }
    });
  });

  describe('edge cases', () => {
    it('handles empty devices array', async () => {
      const result = await analyzeWithMultiAgents('summary', null, [], [], [], []);
      expect(result).toBeDefined();
    });

    it('handles empty alerts with unhealthy devices', async () => {
      const result = await analyzeWithMultiAgents('status', null, [], [warningDevice], [], []);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('unhealthy');
    });

    it('handles diagnostic with info-only alerts', async () => {
      const infoAlert = makeAlert({ id: 'info1', severity: 'info', layer: 'L1', message: 'Informational' });
      const result = await analyzeWithMultiAgents(
        'analyze root cause',
        null,
        [infoAlert],
        [healthyDevice],
        [],
        []
      );
      // Info-only alerts should result in healthy report since info alerts are filtered
      expect(result).toBeDefined();
    });
  });
});
