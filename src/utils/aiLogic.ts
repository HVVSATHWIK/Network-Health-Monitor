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
    const l1Alert = activeAlerts.find(a => a.layer === 'L1');
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

    if (l1Alert || l7Alert) {

        if (l1Alert) {
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
        else if (l7Alert) {
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
