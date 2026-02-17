// import { Alert, Device } from '../types/network';
// import { GoogleGenerativeAI } from "@google/generative-ai";

// // --- Types ---

// export interface AgentResponse {
//     agent: 'Security' | 'Performance' | 'Reliability' | 'Coordinator';
//     status: 'clean' | 'issue_detected' | 'analyzing' | 'idle';
//     findings: string;
//     timestamp: number;
// }

// export interface ForensicArtifact {
//     type: 'otdr' | 'latency_histogram' | 'heatmap' | 'json_log';
//     title: string;
//     description: string;
//     data: any;
// }

// export interface ForensicStep {
//     id: string;
//     timestamp: number;
//     agent: string;
//     action: string;
//     result?: string;
//     status: 'pending' | 'success' | 'failed' | 'running';
// }

// export interface ForensicReport {
//     criticality: 'low' | 'medium' | 'high' | 'extreme';
//     rootCause: string;
//     chainOfThought: ForensicStep[]; // The reasoning timeline
//     artifacts: ForensicArtifact[];   // The "proof" (graphs, logs)
//     recommendations: string[];
//     summary: string;
// }

// // --- Gemini Client ---
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_AI_API_KEY || "dummy_key");
// const model = genAI.getGenerativeModel(
//     { model: import.meta.env.VITE_AI_MODEL || "gemini-2.5-flash-lite" },
//     { apiVersion: "v1" }
// );

// // --- Real AI Logic ---

// async function callGeminiAPI(query: string, alerts: Alert[], devices: Device[]): Promise<string> {
//     try {
//         // Optimize Context: Only send relevant fields to save tokens and reduce noise
//         const criticalDevices = devices.filter(d => d.status !== 'healthy').map(d => ({
//             name: d.name,
//             type: d.type,
//             status: d.status,
//             metrics: d.metrics // Include metrics for unhealthy devices
//         }));

//         const deviceSummary = devices.map(d => ({
//             name: d.name,
//             type: d.type,
//             status: d.status,
//             ip: d.ip
//         }));

//         const alertSummary = alerts.map(a => ({
//             id: a.id,
//             severity: a.severity,
//             device: a.device,
//             layer: a.layer,
//             message: a.message,
//             timestamp: a.timestamp
//         }));

//         const prompt = `
// You are NetMonit AI, an AI assistant designed for diagnostics and root cause
// analysis in industrial IT/OT networks.

// Your responsibility is to help operators understand what is happening
// in the network by reasoning over the LIVE TELEMETRY provided below.

// ================================================
// UI CONTEXT AWARENESS RULE
// ================================================
// The "CURRENT SYSTEM CONTEXT" section contains REAL-TIME data from the running simulation.
// You MUST treat this data as the absolute truth.

// • KPI Metrics (CRC, latency, temp) are real values from the simulation.
// • Alerts are real active alarms.

// You must correlate information across these elements.

// ================================================
// STEP 1 — USER INTENT CLASSIFICATION (DO SILENTLY)
// ================================================
// Infer the user’s intent from the query:

// ROOT CAUSE ANALYSIS intent:
// • "Identify the root cause"
// • "What is the root cause?"
// • "Why is [Device] critical?"
// • "What is wrong?"

// IT–OT INTERFERENCE intent:
// • "Is IT traffic impacting OT?"
// • "Why did OT degrade?"

// GENERAL KNOWLEDGE intent:
// • Conceptual questions (CRC, OSI, PLC) -> ANSWER NORMALLY.

// ================================================
// STEP 2 — CORE INDUSTRIAL REASONING RULES (STRICT)
// ================================================

// DEVICE RELEVANCE RULE:
// Prioritize anomalies on critical devices listed in the context.

// PATH VALIDATION RULE (MANDATORY):
// If L1/L2/L3 anomalies exist on a path, they are likely the root cause for L4/L7 symptoms.

// INDUSTRIAL RCA SAFETY RULE:
// • L4/L7 (Application/Transport) CANNOT be the root cause if L1/L2/L3 shows errors (CRC, Link Down, Packet Loss).
// • Timeouts and Latency are usually SYMPTOMS of lower-layer issues.

// ================================================
// STEP 3 — OUTPUT FORMAT (MANDATORY)
// ================================================
// If the user asks for analysis, status, or root cause, YOU MUST USE THIS FORMAT:

// Root Cause Layer: [Layer] – [Layer Name] (e.g., "L1 - Physical")

// Evidence from Live Telemetry:
// • [Device Name]: [Specific Metric Value] (e.g., "Temperature 78°C", "CRC Errors 980")
// • [Alert Message]

// Why other layers are NOT the root cause:
// • [Reasoning]

// Cause → Effect Explanation:
// [Concise narrative of how the fault propagated]

// Conclusion:
// [Decisive summary]

// ------------------------------------------------
// (Exception: If the user asks a purely definition-based question like "What is TCP?", ignore the format and answer educationally.)

// ================================================
// CURRENT SYSTEM CONTEXT (LIVE SIMULATION DATA)
// ================================================
// Active Alerts:
// ${JSON.stringify(alertSummary, null, 2)}

// CRITICAL DEVICES & METRICS (Focus Here):
// ${JSON.stringify(criticalDevices, null, 2)}

// All Devices List:
// ${JSON.stringify(deviceSummary, null, 2)}

// ================================================
// User Query:
// "${query}"
// `;

//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         return response.text();
//     } catch (error) {
//         console.error("Gemini API Error:", error);
//         return "I apologize, but I am unable to connect to the analysis engine at this moment. Please verify your network connection or API key.";
//     }
// }

// // --- Main Logic ---

// export async function analyzeWithMultiAgents(
//     userQuery: string,
//     _appName: string | null,
//     activeAlerts: Alert[],
//     devices: Device[],
//     _onAgentUpdate: (update: AgentResponse) => void
// ): Promise<ForensicReport | string> {

//     // 1. Skip Simulation Signatures - Always use Real AI
//     // The previous hardcoded logic for "Cable Cut" and "App Lag" has been removed.
//     // We now pass everything to Gemini to interpret based on the context.

//     // ask Gemini to perform the analysis based on strict rules
//     const aiResponse = await callGeminiAPI(userQuery, activeAlerts, devices);
//     return aiResponse;
// }

// /**
//  * Legacy Adapter
//  */
// export async function analyzeRootCause(appName: string, activeAlerts: Alert[], devices: Device[]): Promise<string | null> {
//     const res = await analyzeWithMultiAgents(`Analyze ${appName}`, appName, activeAlerts, devices, () => { });
//     if (typeof res === 'string') return res;
//     return res.summary;
// }
import { Alert, Device, NetworkConnection, DependencyPath, CausalChain } from '../types/network';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeRelationships } from './relationshipEngine';

// ---------------- TYPES ----------------

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
    data: unknown;
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
    chainOfThought: ForensicStep[];
    artifacts: ForensicArtifact[];
    recommendations: string[];
    summary: string;
}

export type AnalysisResult = string | ForensicReport;

// ---------------- GEMINI CLIENT ----------------

const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_AI_API_KEY || "dummy_key"
);

const model = genAI.getGenerativeModel(
    { model: import.meta.env.VITE_AI_MODEL || "gemini-2.5-flash-lite" },
    { apiVersion: "v1" }
);

// ---------------- PROMPT BUILDER ----------------

function buildPrompt(
    query: string,
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[],
    dependencies: DependencyPath[]
): string {

    // 1. Run Relationship Engine (Deterministic Logic)
    const causalAnalysis = analyzeRelationships(alerts, devices, connections, dependencies);

    // 2. Prepare Raw Context (For Status/List Queries)
    const alertSummary = alerts.map(a => ({
        id: a.id,
        severity: a.severity,
        device: a.device,
        layer: a.layer,
        message: a.message,
        timestamp: a.timestamp
    }));

    const deviceSummary = devices.map(d => ({
        name: d.name,
        type: d.type,
        status: d.status,
        ip: d.ip
    }));

    return `
You are NetMonit AI — an industrial IT/OT observability intelligence engine.

================================================
STEP 1: CLASSIFY INTENT
================================================
You must first classify the user's INTENT based on their query:

1. **GENERAL KNOWLEDGE** (e.g., "What is CRC?", "Define latency", "Explain TCP"):
   -> IGNORE all telemetry. ANSWER the definition educationally. Do NOT mention specific devices unless asked.

2. **STATUS CHECK** (e.g., "List active alerts", "What devices are down?", "Show me criticals"):
   -> IGNORE the Causal Analysis. READ the "RAW TELEMETRY" section below and LIST the items directly.

3. **DIAGNOSTIC ANALYSIS** (e.g., "Why is the system slow?", "Analyze the root cause", "What is wrong?", "Diagnose this"):
   -> THIS IS THE ONLY CASE where you use the "CAUSAL INTELLIGENCE SUMMARY".
   -> Follow the "NARRATIVE GENERATOR" rules below.

================================================
CAUSAL INTELLIGENCE SUMMARY (Use ONLY for DIAGNOSTICS)
================================================
The following diagnostic chain has been pre-calculated by the deterministic Relationship Engine.
Use this as your PRIMARY FACTUAL BASIS for root cause analysis.

${JSON.stringify(causalAnalysis, null, 2)}

================================================
EVIDENCE PACK (Use ONLY for DIAGNOSTICS)
================================================
- Triggering Alert: ${causalAnalysis.evidence.triggeringAlertId}
- Root Layer: ${causalAnalysis.evidence.rootLayer}
- Confidence: ${(causalAnalysis.confidenceScore * 100).toFixed(1)}% (${causalAnalysis.confidenceReason})

================================================
RAW TELEMETRY (Use for STATUS CHECKS)
================================================
Active Alerts:
${JSON.stringify(alertSummary, null, 2)}

All Devices:
${JSON.stringify(deviceSummary, null, 2)}

================================================
YOUR RESPONSE
================================================
Based on the INTENT classification above, generate the appropriate response.

IF DIAGNOSTIC ANALYSIS Intent:
1. START with the Conclusion (The "What").
2. EXPLAIN the Propagation (The "How" - Reference the Upstream -> Downstream path).
3. CITE the Evidence (The "Why" - Mention specific metrics/alerts).
4. IF "Ambiguous": Clearly state multiple possibilities.
5. IF "Isolated": Confirm system health.
Keep it professional, concise, and executive-summary style.

IF GENERAL KNOWLEDGE Intent:
Answer the question directly and simply.

IF STATUS CHECK Intent:
List the relevant alerts or devices clearly.

================================================
USER QUERY:
"${query}"
`;
}

// ---------------- GEMINI CALL ----------------

async function callGeminiAPI(
    query: string,
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[],
    dependencies: DependencyPath[]
): Promise<string> {
    try {

        const prompt = buildPrompt(query, alerts, devices, connections, dependencies);

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return response.text();

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI engine unavailable. Please verify configuration.";
    }
}

// ---------------- LOCAL (DETERMINISTIC) ANALYSIS ----------------

type Intent = 'GENERAL_KNOWLEDGE' | 'STATUS_CHECK' | 'DIAGNOSTIC_ANALYSIS';

function classifyIntent(query: string): Intent {
    const q = query.toLowerCase();

    const statusHints = [
        'list active alerts',
        'active alerts',
        'show alerts',
        'what devices are down',
        'devices are down',
        'criticals',
        'show critical',
        'status',
        'health',
        'what is down',
        'what is offline',
    ];
    if (statusHints.some((h) => q.includes(h))) return 'STATUS_CHECK';

    const diagnosticHints = [
        'root cause',
        'rca',
        'diagnose',
        'analyze',
        'why',
        'what is wrong',
        'investigate',
        'failure',
        'latency spike',
        'cable',
        'fault',
        'blast radius',
        'impact',
    ];
    if (diagnosticHints.some((h) => q.includes(h))) return 'DIAGNOSTIC_ANALYSIS';

    return 'GENERAL_KNOWLEDGE';
}

function buildStatusText(alerts: Alert[], devices: Device[]): string {
    const unhealthy = devices.filter((d) => d.status !== 'healthy');
    const lines: string[] = [];

    lines.push(`Active alerts: ${alerts.length}`);
    alerts.slice(0, 25).forEach((a) => {
        lines.push(`- [${a.severity.toUpperCase()}] ${a.layer} ${a.device}: ${a.message}`);
    });
    if (alerts.length > 25) lines.push(`- …and ${alerts.length - 25} more`);

    lines.push('');
    lines.push(`Unhealthy devices: ${unhealthy.length}`);
    unhealthy.slice(0, 25).forEach((d) => {
        lines.push(`- [${d.status.toUpperCase()}] ${d.name} (${d.type}) ip=${d.ip}`);
    });
    if (unhealthy.length > 25) lines.push(`- …and ${unhealthy.length - 25} more`);

    return lines.join('\n');
}

function deriveCriticality(chain: CausalChain, alerts: Alert[]): ForensicReport['criticality'] {
    const rootLayer = chain.primaryFault.layer;
    const confidence = chain.confidenceScore;
    const hasCritical = alerts.some((a) => a.severity === 'critical');
    const hasHigh = alerts.some((a) => a.severity === 'high');

    if ((rootLayer === 'L1' || rootLayer === 'L2') && confidence >= 0.8) return 'extreme';
    if (hasCritical && confidence >= 0.7) return 'extreme';
    if (hasHigh || confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
}

function buildRecommendations(rootLayer: string): string[] {
    switch (rootLayer) {
        case 'L1':
            return [
                'Inspect fiber/copper plant on the affected link (connectors, bends, patching).',
                'Validate transceiver/optics levels and clean/replace if out of spec.',
                'Check for environmental contributors (temperature/power) on the edge switch/port.',
            ];
        case 'L2':
            return [
                'Check for CRC error sources (duplex mismatch, bad cable, EMI, failing port).',
                'Verify VLAN/STP configuration consistency across the affected segment.',
                'Capture interface counters over time to confirm whether errors are persistent.',
            ];
        case 'L3':
            return [
                'Validate routing adjacencies and confirm no route churn/instability.',
                'Check packet-loss hotspots along the path (drops/ACL/firewall counters).',
                'Confirm subnets and addressing are consistent with the intended OT zones.',
            ];
        case 'L4':
            return [
                'Inspect retransmissions/timeouts and correlate with upstream loss/jitter.',
                'Check connection limits/timeouts on endpoints (PLC/SCADA) and intermediates.',
            ];
        case 'L5':
        case 'L6':
            return [
                'Review session resets / handshake failures and confirm certificate/time sync.',
                'Validate policy changes and recent config deployments affecting sessions.',
            ];
        case 'L7':
            return [
                'Check application/service saturation and recent deploys (SCADA runtime, DB, brokers).',
                'Validate protocol-level anomalies with endpoint logs and transaction traces.',
            ];
        default:
            return ['Collect additional telemetry; current evidence is insufficient for confident remediation.'];
    }
}

function buildDeterministicForensicReport(
    query: string,
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[],
    dependencies: DependencyPath[]
): ForensicReport {
    const chain = analyzeRelationships(alerts, devices, connections, dependencies);
    const criticality = deriveCriticality(chain, alerts);

    const now = Date.now();
    const steps: ForensicStep[] = [
        {
            id: `step-${now}-1`,
            timestamp: now,
            agent: 'Coordinator',
            action: 'Ingest active telemetry + alerts',
            status: 'success',
            result: `${alerts.length} alert(s), ${devices.length} device(s)`,
        },
        {
            id: `step-${now}-2`,
            timestamp: now + 350,
            agent: 'Reliability',
            action: 'Identify earliest plausible root-layer anomaly',
            status: 'success',
            result: `${chain.primaryFault.layer} on ${chain.primaryFault.device}`,
        },
        {
            id: `step-${now}-3`,
            timestamp: now + 700,
            agent: 'Performance',
            action: 'Trace downstream propagation via topology graph',
            status: 'success',
            result: `${chain.propagation.length} correlated hop(s)`,
        },
        {
            id: `step-${now}-4`,
            timestamp: now + 1050,
            agent: 'Security',
            action: 'Check for obvious security indicators in current evidence',
            status: 'success',
            result: 'No explicit security-trigger telemetry provided',
        },
        {
            id: `step-${now}-5`,
            timestamp: now + 1400,
            agent: 'Coordinator',
            action: 'Compile root cause and remediation protocol',
            status: 'success',
        },
    ];

    const affectedWorkflows = chain.impact?.affectedWorkflows?.length ? chain.impact.affectedWorkflows.join(', ') : 'None detected';
    const summary = `${chain.summary} Workflows: ${affectedWorkflows}. Confidence ${(chain.confidenceScore * 100).toFixed(0)}%.`;

    return {
        criticality,
        rootCause: `${chain.primaryFault.layer} fault on ${chain.primaryFault.device}: ${chain.primaryFault.reason}`,
        chainOfThought: steps,
        artifacts: [
            {
                type: 'json_log',
                title: 'Causal Intelligence (Deterministic)',
                description: 'RelationshipEngine output used as the factual basis for this report.',
                data: {
                    query,
                    causalChain: chain,
                },
            },
        ],
        recommendations: buildRecommendations(chain.primaryFault.layer),
        summary,
    };
}

// ---------------- MAIN ANALYSIS ----------------

export async function analyzeWithMultiAgents(
    userQuery: string,
    _appName: string | null,
    activeAlerts: Alert[],
    devices: Device[],
    arg5?: NetworkConnection[] | ((update: AgentResponse) => void),
    arg6?: DependencyPath[],
    arg7?: (update: AgentResponse) => void
): Promise<AnalysisResult> {

    // Backward-compatible argument parsing:
    // - New callers: (query, app, alerts, devices, connections, dependencies, onUpdate)
    // - Legacy callers: (query, app, alerts, devices, onUpdate)
    let connections: NetworkConnection[] = [];
    let dependencies: DependencyPath[] = [];

    if (Array.isArray(arg5)) {
        connections = arg5;
        dependencies = arg6 ?? [];
        void arg7; // reserved for future streaming updates
    } else {
        void arg5; // reserved for future streaming updates
    }

    const intent = classifyIntent(userQuery);

    // For diagnostics, always return a structured report so forensic UIs can render artifacts/steps.
    if (intent === 'DIAGNOSTIC_ANALYSIS') {
        return buildDeterministicForensicReport(userQuery, activeAlerts, devices, connections, dependencies);
    }

    // For status checks, return a deterministic status listing.
    if (intent === 'STATUS_CHECK') {
        return buildStatusText(activeAlerts, devices);
    }

    // GENERAL KNOWLEDGE: prefer Gemini if configured, otherwise return a safe fallback.
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    const hasRealKey = typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey !== 'dummy_key';
    if (!hasRealKey) {
        return 'AI engine is not configured (missing VITE_AI_API_KEY). Ask a diagnostic or status question to use deterministic analysis.';
    }

    return callGeminiAPI(userQuery, activeAlerts, devices, connections, dependencies);
}

// ---------------- LEGACY ADAPTER ----------------

export async function analyzeRootCause(
    appName: string,
    activeAlerts: Alert[],
    devices: Device[]
): Promise<string | null> {

    // Legacy adapter with mock empty connections/deps if called from old code
    // Ideally update all callers.
    const res = await analyzeWithMultiAgents(
        `Analyze ${appName}`,
        appName,
        activeAlerts,
        devices,
        [], // Empty connections
        [], // Empty dependencies
        () => { }
    );

    return typeof res === 'string' ? res : res.summary;
}
