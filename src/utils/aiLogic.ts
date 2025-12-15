import { Alert, Device } from '../types/network';

// --- Types ---

export interface AgentResponse {
    agent: 'Security' | 'Performance' | 'Reliability' | 'Coordinator';
    status: 'clean' | 'issue_detected' | 'analyzing' | 'idle';
    findings: string;
    timestamp: number;
}

export interface ForensicArtifact {
    type: 'otdr' | 'latency_histogram' | 'heatmap' | 'json_log';
    title: string;
    description: string;
    data: any;
}

export interface ForensicStep {
    id: string;
    timestamp: number;
    agent: string;
    action: string;
    result?: string;
    status: 'pending' | 'success' | 'failed' | 'running';
}

export interface ForensicReport {
    criticality: 'low' | 'medium' | 'high' | 'extreme';
    rootCause: string;
    chainOfThought: ForensicStep[]; // The reasoning timeline
    artifacts: ForensicArtifact[];   // The "proof" (graphs, logs)
    recommendations: string[];
    summary: string;
}

// --- Simulations ---

function generateOTDRData() {
    // Simulates a fiber cut at 12.4km
    const data = [];
    let signal = -2.4; // dBm
    for (let km = 0; km <= 20; km += 0.5) {
        if (km < 12.5) {
            signal -= 0.15; // standard attenuation
            // Connector events
            if (km === 5 || km === 10) signal -= 0.5;
        } else {
            signal = -80; // Noise floor after cut
        }
        data.push({ distance: km, signal: parseFloat(signal.toFixed(2)) });
    }
    return data;
}

function generateLatencyHistogram() {
    // Simulates a "Long Tail" latency distribution
    const data = [];
    // Normal traffic (50ms center)
    for (let i = 0; i < 200; i++) data.push(Math.floor(20 + Math.random() * 60));
    // Congestion traffic (2000ms+ center) - The "Bimodal" hump
    for (let i = 0; i < 80; i++) data.push(Math.floor(1800 + Math.random() * 800));

    // Binning for Recharts
    const bins = Array.from({ length: 30 }, (_, i) => ({
        bin: i * 100,
        count: 0,
        range: `${i * 100}-${(i + 1) * 100}ms`
    }));

    data.forEach(val => {
        const binIndex = Math.min(Math.floor(val / 100), 29);
        bins[binIndex].count++;
    });

    return bins;
}

// --- Main Logic ---

export async function analyzeWithMultiAgents(
    userQuery: string,
    _appName: string | null,
    activeAlerts: Alert[],
    _devices: Device[],
    _onAgentUpdate: (update: AgentResponse) => void // Kept for backward compat/transition
): Promise<ForensicReport | string> { // Dual return type during migration

    // 0. Intent Routing (Conversational)
    const isConversational = /^(hi|hello|hey|greetings|help|who are you|what is this)\b/i.test(userQuery);
    if (isConversational) {
        // Return simple string for chat
        if (activeAlerts.length > 0) {
            return `Hello. I am the NetMonit Coordinator. I see ${activeAlerts.length} active alerts. Run a diagnosis to see a full forensic report.`;
        }
        return "System Ready. Industrial Forensic Cockpit initialized. Waiting for telemetry...";
    }

    // 1. Check for Simulation Signatures (The "Smart Fallback" / Demo Logic)
    // IMPORTANT: Only treat L1 as "cable sever" when the alert is severe, otherwise
    // the demo starts in a broken state (mock data includes non-fatal L1 degradations).
    const userWantsL1Scenario = /(cable|fiber|otdr|loss\s+of\s+signal|\blos\b|link\s+down)/i.test(userQuery);
    const userWantsL7Scenario = /(latency|timeout|response\s*time|deadlock|thread\s*pool|\bl7\b)/i.test(userQuery);
    const isAnalysisIntent = /(analy|diagnos|scan|investigat|root\s*cause|\brca\b|forensic)/i.test(userQuery);

    const l1Alert = activeAlerts.find(
        a => a.layer === 'L1' && (a.severity === 'critical' || a.severity === 'high')
    );
    const l7Alert = activeAlerts.find(a => a.layer === 'L7' && a.severity !== 'low');

    // Default "Clean" Report
    let report: ForensicReport = {
        criticality: 'low',
        rootCause: 'N/A',
        summary: 'System operating within normal parameters.',
        chainOfThought: [
            { id: '1', timestamp: Date.now(), agent: 'Coordinator', action: 'INITIALIZE_SCAN', status: 'success', result: 'All agents ready' },
            { id: '2', timestamp: Date.now() + 100, agent: 'Security-Bot', action: 'SCAN_LOGS', status: 'success', result: '0 Threats' },
            { id: '3', timestamp: Date.now() + 200, agent: 'Perf-Bot', action: 'CHECK_LATENCY', status: 'success', result: 'Avg 12ms' },
        ],
        artifacts: [],
        recommendations: ['Maintain standard monitoring interval.']
    };

    if (l1Alert || l7Alert || userWantsL1Scenario || userWantsL7Scenario) {

        if (l1Alert || userWantsL1Scenario) {
            // Scenario A: Cable Cut
            report = {
                criticality: 'extreme',
                rootCause: 'Physical Layer Sever (L1)',
                summary: 'Catastrophic loss of signal on Backbone Link 04. OTDR trace confirms physical cable integrity failure.',
                chainOfThought: [
                    { id: '1', timestamp: Date.now(), agent: 'Coordinator', action: 'DETECT_LOS', status: 'success', result: 'Signal Loss on Switch-02' },
                    { id: '2', timestamp: Date.now() + 500, agent: 'L1-Forensic-Bot', action: 'EXECUTE_OTDR', status: 'running', result: 'Injecting test pulse...' },
                    { id: '3', timestamp: Date.now() + 800, agent: 'L1-Forensic-Bot', action: 'ANALYZE_REFLECTION', status: 'success', result: 'Fresnel Reflection at 12.4km' },
                    { id: '4', timestamp: Date.now() + 1200, agent: 'Coordinator', action: 'CORRELATE_TOPOLOGY', status: 'success', result: 'location: Zone B Conduit' },
                ],
                artifacts: [
                    {
                        type: 'otdr',
                        title: 'OTDR Trace Analysis',
                        description: 'Signal strength (dBm) vs Distance (km). Sudden drop indicates hard sever.',
                        data: generateOTDRData()
                    },
                    {
                        type: 'json_log',
                        title: 'SFP Transceiver Dump',
                        description: 'DOM (Digital Optical Monitoring) Register Output',
                        data: {
                            "interface": "Eth1/0/4",
                            "sfp_type": "10GBASE-LR",
                            "tx_bias": "0.00 mA (FAULT)",
                            "tx_power": "-40.0 dBm (LOS)",
                            "rx_power": "-40.0 dBm (LOS)",
                            "temp": "45.2 C"
                        }
                    }
                ],
                recommendations: [
                    'Dispatch field tech to Zone B (GPS: 34.05, -118.25).',
                    'Inspect fiber patch panel 4 for rodent damage.',
                    'Reroute traffic via redundant link (cost: +5ms latency).'
                ]
            };
        }
        else if (l7Alert || userWantsL7Scenario) {
            // Scenario B: Application Lag
            report = {
                criticality: 'medium',
                rootCause: 'Application Deadlock (L7)',
                summary: 'Service "SCADA-Loop" is experiencing microburst congestion. Latency distribution shows bimodal behavior consistent with thread pool starvation.',
                chainOfThought: [
                    { id: '1', timestamp: Date.now(), agent: 'Coordinator', action: 'DETECT_TIMEOUT', status: 'success', result: '>5000ms response' },
                    { id: '2', timestamp: Date.now() + 300, agent: 'L7-Forensic-Bot', action: 'INSPECT_TCP', status: 'success', result: 'Zero Window detected' },
                    { id: '3', timestamp: Date.now() + 600, agent: 'L7-Forensic-Bot', action: 'PROFILE_HEAP', status: 'success', result: 'Memory usage 92%' },
                ],
                artifacts: [
                    {
                        type: 'latency_histogram',
                        title: 'Response Time Distribution',
                        description: 'Histogram showing "Long Tail" latency vs normal baseline.',
                        data: generateLatencyHistogram()
                    }
                ],
                recommendations: [
                    'Restart scada-control-service to clear thread pool.',
                    'Scale horizontal pods to handle burst load.',
                    'Investigate recent code deployment for potential infinite loop.'
                ]
            };
        }
    }

    // 2. Generic fallback: if the user is asking for analysis and there are alerts,
    // produce a meaningful L1–L7 report even when it's not the special L1/L7 demo signature.
    if (isAnalysisIntent && activeAlerts.length > 0 && report.rootCause === 'N/A') {
        const severityRank: Record<Alert['severity'], number> = {
            info: 0,
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
        };
        const mostSevere = [...activeAlerts].sort(
            (a, b) => severityRank[b.severity] - severityRank[a.severity]
        )[0];

        const criticality: ForensicReport['criticality'] =
            mostSevere.severity === 'critical'
                ? 'high'
                : mostSevere.severity === 'high'
                    ? 'medium'
                    : mostSevere.severity === 'medium'
                        ? 'medium'
                        : 'low';

        const layerRootCause: Record<Alert['layer'], string> = {
            L1: 'Physical Layer Degradation (L1)',
            L2: 'Link-Layer Instability (L2)',
            L3: 'Routing / Packet Loss Event (L3)',
            L4: 'Transport Congestion / Retransmissions (L4)',
            L5: 'Session Churn / Reset Storm (L5)',
            L6: 'TLS / Encoding Negotiation Failures (L6)',
            L7: 'Application Performance / Availability Issue (L7)',
        };

        const layerRecommendations: Record<Alert['layer'], string[]> = {
            L1: [
                'Verify cabling/connector integrity and check optical power (DOM) readings.',
                'Inspect ports for CRC errors and validate link negotiation (speed/duplex).',
                'Fail over to redundant physical path if available.'
            ],
            L2: [
                'Check for MAC flaps, STP topology changes, or VLAN mismatches.',
                'Validate trunk/tagging configuration and port security events.',
                'Review switch interface counters and broadcast/multicast rates.'
            ],
            L3: [
                'Check routing adjacency stability (OSPF/BGP) and recent route changes.',
                'Review packet loss hotspots and validate MTU consistency.',
                'Inspect ACL/firewall drops for unintended blocking.'
            ],
            L4: [
                'Inspect retransmissions, SYN backlog, and socket exhaustion indicators.',
                'Identify microburst/congestion points and validate QoS policies.',
                'Capture a short PCAP to confirm handshake/ACK patterns.'
            ],
            L5: [
                'Check for session resets, keepalive failures, or state table churn.',
                'Validate load balancer persistence/stickiness policies.',
                'Review timeout settings across client, proxy, and server tiers.'
            ],
            L6: [
                'Check TLS handshake failures (cert expiry, cipher mismatch, SNI issues).',
                'Validate intermediate CA chain and time sync (NTP) across endpoints.',
                'Confirm any recent policy updates to crypto libraries or proxies.'
            ],
            L7: [
                'Inspect application logs for error spikes and upstream dependency timeouts.',
                'Check resource saturation (CPU/memory) and thread pool metrics.',
                'Roll back recent deployments if correlated with start of incident.'
            ],
        };

        report = {
            criticality,
            rootCause: layerRootCause[mostSevere.layer],
            summary: `${mostSevere.layer} alert detected on ${mostSevere.device}: ${mostSevere.message}`,
            chainOfThought: [
                { id: '1', timestamp: Date.now(), agent: 'Coordinator', action: 'INGEST_ALERT', status: 'success', result: `${mostSevere.layer}/${mostSevere.severity}` },
                { id: '2', timestamp: Date.now() + 250, agent: 'Reliability-Bot', action: 'CORRELATE_TELEMETRY', status: 'success', result: 'Correlated with recent KPI drift' },
                { id: '3', timestamp: Date.now() + 500, agent: 'Coordinator', action: 'GENERATE_REMEDIATION', status: 'success', result: 'Action list prepared' },
            ],
            artifacts: [
                {
                    type: 'json_log',
                    title: 'Alert Payload',
                    description: 'Normalized alert object used for correlation.',
                    data: mostSevere,
                }
            ],
            recommendations: layerRecommendations[mostSevere.layer],
        };
    }

    return report;
}

/**
 * Legacy Adapter
 */
export async function analyzeRootCause(appName: string, activeAlerts: Alert[], devices: Device[]): Promise<string | null> {
    const res = await analyzeWithMultiAgents(`Analyze ${appName}`, appName, activeAlerts, devices, () => { });
    if (typeof res === 'string') return res;
    return res.summary;
}
