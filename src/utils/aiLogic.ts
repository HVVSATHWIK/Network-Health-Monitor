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
// STEP 1 - USER INTENT CLASSIFICATION (DO SILENTLY)
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
// STEP 2 - CORE INDUSTRIAL REASONING RULES (STRICT)
// ================================================

// DEVICE RELEVANCE RULE:
// Prioritize anomalies on critical devices listed in the context.

// PATH VALIDATION RULE (MANDATORY):
// If L1/L2/L3 anomalies exist on a path, they are likely the root cause for L4/L7 symptoms.

// INDUSTRIAL RCA SAFETY RULE:
// • L4/L7 (Application/Transport) CANNOT be the root cause if L1/L2/L3 shows errors (CRC, Link Down, Packet Loss).
// • Timeouts and Latency are usually SYMPTOMS of lower-layer issues.

// ================================================
// STEP 3 - OUTPUT FORMAT (MANDATORY)
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
import { Alert, Device, NetworkConnection, DependencyPath, CausalChain, LayerKPI } from '../types/network';
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

export interface AIQuotaStatus {
    perMinuteLimit: number;
    dailyLimit: number;
    usedLastMinute: number;
    usedToday: number;
    remainingThisMinute: number;
    remainingToday: number;
}

export interface AIMonitoringSnapshot {
    monitoredDevices: number;
    monitoredConnections: number;
    monitoredAlerts: number;
    monitoredWorkflows: number;
    monitoredLayers: string[];
    coverageRatio: number;
    summary: string;
}

const AI_PER_MINUTE_LIMIT = 15;
const AI_DAILY_LIMIT = 1000;
const AI_QUOTA_STORAGE_KEY = 'netmonit_ai_quota_v1';

type StoredQuota = {
    dayKey: string;
    usedToday: number;
    minuteRequests: number[];
};

const getDayKey = (date = new Date()) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

const loadQuota = (): StoredQuota => {
    const fallback: StoredQuota = { dayKey: getDayKey(), usedToday: 0, minuteRequests: [] };

    if (typeof window === 'undefined') return fallback;

    try {
        const raw = window.localStorage.getItem(AI_QUOTA_STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<StoredQuota>;
        return {
            dayKey: typeof parsed.dayKey === 'string' ? parsed.dayKey : fallback.dayKey,
            usedToday: typeof parsed.usedToday === 'number' ? parsed.usedToday : 0,
            minuteRequests: Array.isArray(parsed.minuteRequests)
                ? parsed.minuteRequests.filter((t): t is number => typeof t === 'number')
                : [],
        };
    } catch {
        return fallback;
    }
};

const saveQuota = (quota: StoredQuota) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(AI_QUOTA_STORAGE_KEY, JSON.stringify(quota));
    } catch {
        // ignore storage failures
    }
};

const normalizeQuota = (): StoredQuota => {
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const todayKey = getDayKey();
    const quota = loadQuota();

    if (quota.dayKey !== todayKey) {
        quota.dayKey = todayKey;
        quota.usedToday = 0;
    }

    quota.minuteRequests = quota.minuteRequests.filter((ts) => ts >= minuteAgo);
    saveQuota(quota);
    return quota;
};

export function getAIQuotaStatus(): AIQuotaStatus {
    const quota = normalizeQuota();
    const usedLastMinute = quota.minuteRequests.length;
    const usedToday = quota.usedToday;
    return {
        perMinuteLimit: AI_PER_MINUTE_LIMIT,
        dailyLimit: AI_DAILY_LIMIT,
        usedLastMinute,
        usedToday,
        remainingThisMinute: Math.max(0, AI_PER_MINUTE_LIMIT - usedLastMinute),
        remainingToday: Math.max(0, AI_DAILY_LIMIT - usedToday),
    };
}

function tryConsumeAIRequest(): { ok: true; status: AIQuotaStatus } | { ok: false; status: AIQuotaStatus } {
    const quota = normalizeQuota();
    const status = getAIQuotaStatus();

    if (status.remainingThisMinute <= 0 || status.remainingToday <= 0) {
        return { ok: false, status };
    }

    quota.minuteRequests.push(Date.now());
    quota.usedToday += 1;
    saveQuota(quota);

    return { ok: true, status: getAIQuotaStatus() };
}

export function buildAIMonitoringSnapshot(
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[],
    layerKPIs: LayerKPI[],
    dependencies: DependencyPath[]
): AIMonitoringSnapshot {
    const monitoredLayers = Array.from(new Set(layerKPIs.map((kpi) => kpi.layer))).sort();
    const coverageRatio = Math.min(1, monitoredLayers.length / 7);
    const coveragePercent = Math.round(coverageRatio * 100);

    return {
        monitoredDevices: devices.length,
        monitoredConnections: connections.length,
        monitoredAlerts: alerts.length,
        monitoredWorkflows: dependencies.length,
        monitoredLayers,
        coverageRatio,
        summary: `Monitoring ${devices.length} devices, ${connections.length} links, ${alerts.length} active alerts, ${dependencies.length} workflow paths. Layer coverage ${coveragePercent}% (${monitoredLayers.join(', ') || 'none'}).`,
    };
}

// ---------------- GEMINI CLIENT ----------------

const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_AI_API_KEY || "dummy_key"
);

const PRIMARY_GEMINI_MODEL = import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_GEMINI_MODEL = import.meta.env.VITE_AI_FALLBACK_MODEL || 'gemini-2.0-flash';

const getModel = (modelName: string) =>
    genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: 'v1' }
    );

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientGeminiError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const rec = error as Record<string, unknown>;
    const status = rec.status;
    const statusText = rec.statusText;
    const msg = typeof rec.message === 'string' ? rec.message : String(error);
    const normalized = `${String(status ?? '')} ${String(statusText ?? '')} ${msg}`.toLowerCase();

    return (
        normalized.includes('503') ||
        normalized.includes('429') ||
        normalized.includes('high demand') ||
        normalized.includes('unavailable') ||
        normalized.includes('deadline exceeded') ||
        normalized.includes('timed out')
    );
}

async function generateWithRetry(prompt: string, modelName: string): Promise<string> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const model = getModel(modelName);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            const isTransient = isTransientGeminiError(error);
            const isLastAttempt = attempt === maxAttempts;

            if (!isTransient || isLastAttempt) {
                throw error;
            }

            const baseDelay = 700;
            const jitter = Math.floor(Math.random() * 200);
            const backoff = baseDelay * Math.pow(2, attempt - 1) + jitter;
            await sleep(backoff);
        }
    }

    throw new Error('Gemini retry loop exhausted unexpectedly');
}

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
You are NetMonit AI, an industrial IT/OT observability intelligence engine.

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

IF WEBSITE/UI NAVIGATION HELP Intent (user asks how to use the dashboard):
The dashboard has these key interactions:
- Click any device in the 3D map or Asset Status list to open a detail panel showing its health metrics, connections, and status.
- "Run Diagnostic Scan" button scans all devices and opens Forensic Cockpit with results.
- "Root Cause Analysis" button triggers AI analysis of all active issues.
- "Forensic Cockpit" opens a deep investigation workspace.
- "NetMonit AI" opens a chat assistant.
- The book icon (📖) opens a step-by-step Visual Guide with illustrations.
- Time Range dropdown filters alerts and data to a chosen window.
- The heatmap shows color-coded device health across all network layers.
- Gear icon (⚙) in 3D view lets you inject simulated faults for testing.

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
        const quota = tryConsumeAIRequest();
        if (!quota.ok) {
            return `AI request quota reached. Remaining this minute: ${quota.status.remainingThisMinute}/${quota.status.perMinuteLimit}, remaining today: ${quota.status.remainingToday}/${quota.status.dailyLimit}. Use diagnostic or status commands for deterministic analysis.`;
        }

        const prompt = buildPrompt(query, alerts, devices, connections, dependencies);
        try {
            return await generateWithRetry(prompt, PRIMARY_GEMINI_MODEL);
        } catch (primaryError) {
            const canTryFallback =
                FALLBACK_GEMINI_MODEL.trim().length > 0 &&
                FALLBACK_GEMINI_MODEL !== PRIMARY_GEMINI_MODEL;

            if (canTryFallback && isTransientGeminiError(primaryError)) {
                try {
                    return await generateWithRetry(prompt, FALLBACK_GEMINI_MODEL);
                } catch (fallbackError) {
                    console.error(`Gemini API Error (fallback model: ${FALLBACK_GEMINI_MODEL}):`, fallbackError);
                    return 'Gemini is temporarily overloaded (503/high demand). Please retry in 30-60 seconds. Your local quota remains enforced at 15 requests/minute and 1000/day.';
                }
            }

            console.error(`Gemini API Error (primary model: ${PRIMARY_GEMINI_MODEL}):`, primaryError);
            const offlineKnowledge = buildOfflineGeneralKnowledgeResponse(query);
            if (offlineKnowledge) return `${offlineKnowledge}\n\n(Served from local fallback because Gemini request failed.)`;
            return 'Gemini request failed. Check API key/model settings and retry. If this is a temporary provider spike, try again shortly.';
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI engine unavailable. Please verify configuration.";
    }
}

// ---------------- LOCAL (DETERMINISTIC) ANALYSIS ----------------

type Intent = 'GENERAL_KNOWLEDGE' | 'STATUS_CHECK' | 'DIAGNOSTIC_ANALYSIS' | 'WEBSITE_ASSIST';

function stripRuntimeContext(query: string): string {
    const marker = 'RUNTIME SYSTEM CONTEXT:';
    const idx = query.indexOf(marker);
    if (idx === -1) return query.trim();
    return query.slice(0, idx).trim();
}

function classifyIntent(query: string): Intent {
    const q = stripRuntimeContext(query).toLowerCase();

    const websiteAssistHints = [
        'where is',
        'where can i find',
        'how do i',
        'how to',
        'which button',
        'which tab',
        'open netmonit ai',
        'open forensic cockpit',
        'run diagnostic scan',
        'import data',
        'system logs',
        'kpi intelligence',
        '3d topology',
        'analytics view',
        'layer view',
        'navigate',
        'dashboard',
        'click a device',
        'click device',
        'click sensor',
        'click on a',
        'select a device',
        'device details',
        'device info',
        'side panel',
        'detail panel',
        'asset detail',
        'guide',
        'tutorial',
        'walkthrough',
        'help me use',
        'heatmap',
        'heat map',
        'color grid',
    ];
    if (websiteAssistHints.some((h) => q.includes(h))) return 'WEBSITE_ASSIST';

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
        'diagnostic',
        'diagnostic scan',
        'telemetry scan',
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

function buildWebsiteAssistText(
    query: string,
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[]
): string {
    const q = stripRuntimeContext(query).toLowerCase();
    const unhealthy = devices.filter((d) => d.status !== 'healthy').length;
    const degradedLinks = connections.filter((c) => c.status !== 'healthy').length;

    if (q.includes('root cause') || q.includes('rca')) {
        return [
            'To run root cause analysis:',
            '1) Click "Root Cause Analysis" button in the header — the AI reads all alerts and device data, then tells you what broke, why, and how to fix it.',
            '2) Or in Active Alerts, click "AI Root Cause" on any individual alert card for per-alert analysis.',
            '3) Or use "Run Diagnostic Scan" to trigger a full scan and get forensic results automatically.',
            '',
            `Current state: ${alerts.length} active alert(s), ${unhealthy} unhealthy device(s), ${degradedLinks} degraded/down link(s).`,
        ].join('\n');
    }

    if (q.includes('click') || q.includes('device') || q.includes('sensor') || q.includes('detail') || q.includes('side panel') || q.includes('info')) {
        return [
            'To see detailed info about any device (sensor, switch, PLC, router):',
            '1) In the 3D Topology map, click on any device node — a detail panel slides in from the right.',
            '2) Or in the Asset Status list (below the 3D map), click any row to open the same detail panel.',
            '',
            'The detail panel shows:',
            '- Device name and current status (Healthy / Warning / Critical)',
            '- Live metrics: temperature, latency, CRC errors, packet loss, jitter',
            '- Upstream and downstream connected devices',
            '- Quick actions like fault injection for testing',
            '',
            'Click the dark backdrop behind the panel to close it.',
            '',
            `Current state: ${devices.length} devices total, ${unhealthy} unhealthy, ${degradedLinks} degraded link(s).`,
        ].join('\n');
    }

    if (q.includes('forensic cockpit') || q.includes('forensic')) {
        return [
            'Forensic Cockpit is available from the header button labeled "Forensic Cockpit".',
            'It opens with a live summary of your system state (alerts, unhealthy devices, degraded links).',
            'You can then ask it specific questions like "Analyze the cable fault" or run a full audit.',
            'It uses AI to trace the problem from root cause through the propagation chain.',
            `Current state: ${alerts.length} active alert(s) available for investigation.`,
        ].join('\n');
    }

    if (q.includes('guide') || q.includes('tutorial') || q.includes('how to use') || q.includes('help')) {
        return [
            'Click the book icon (📖) in the header to open the Visual Guide.',
            'It walks you through every feature step-by-step with illustrations:',
            '- How to run a diagnostic scan',
            '- How to click a device to see its details',
            '- How to read the heatmap and alerts',
            '- How to use the Forensic Cockpit and AI chat',
            '- How to simulate faults for testing',
            '',
            'You can restart the guide anytime.',
        ].join('\n');
    }

    if (q.includes('netmonit ai') || q.includes('ai') || q.includes('chat')) {
        return [
            'NetMonit AI opens from the header button "NetMonit AI" (or the floating chat launcher at the bottom).',
            'Ask it anything:',
            '- "What is CRC?" — general knowledge answers',
            '- "List all critical devices" — live status checks',
            '- "Why is the network slow?" — AI root cause analysis',
            '',
            `It sees the same live data: ${alerts.length} alert(s), ${devices.length} device(s), ${connections.length} link(s).`,
        ].join('\n');
    }

    if (q.includes('heatmap') || q.includes('heat map') || q.includes('color grid')) {
        return [
            'The Network Health Heatmap is a color grid below the 3D map.',
            'It shows health metrics across all 7 network layers (L1–L7):',
            '- Green cells = that metric is healthy',
            '- Yellow cells = needs attention',
            '- Red cells = problem detected',
            '',
            'Values are computed from actual device metrics (temperature, CRC errors, packet loss, latency, etc.) and update in real-time.',
        ].join('\n');
    }

    if (q.includes('alert') || q.includes('warning') || q.includes('critical')) {
        return [
            'Active Alerts appear in the panel on the 3D Topology view.',
            'Each alert shows: severity (Critical/High/Medium/Low), device name, layer, and message.',
            'Click "AI Root Cause" on any alert card to get an AI explanation of what caused it.',
            'New alerts are generated automatically when a device transitions to warning or critical.',
            '',
            `Current: ${alerts.length} active alert(s), ${unhealthy} unhealthy device(s).`,
        ].join('\n');
    }

    return [
        'Here\'s how to navigate the dashboard:',
        '',
        '📖 **Guide**: Click the book icon in the header for a step-by-step visual walkthrough.',
        '🔍 **Run Diagnostic Scan**: Scans all devices and opens forensic results.',
        '👆 **Click any device**: In the 3D map or Asset Status list — opens a detail panel with all metrics.',
        '🤖 **Root Cause Analysis**: One-click AI analysis of all active issues.',
        '🔬 **Forensic Cockpit**: Deep investigation tool with AI-powered chain-of-thought analysis.',
        '💬 **NetMonit AI**: Chat assistant for questions about your network.',
        '📊 **Views**: 3D Topology, Analytics, KPI Intelligence, System Logs.',
        '',
        `Live status: ${alerts.length} alert(s), ${unhealthy} unhealthy device(s), ${degradedLinks} degraded link(s).`,
    ].join('\n');
}

function buildOfflineGeneralKnowledgeResponse(query: string): string | null {
    const q = stripRuntimeContext(query).toLowerCase();

    if (q.includes('crc')) {
        return 'CRC (Cyclic Redundancy Check) errors indicate data integrity failures at L2. Rising CRC usually points to bad cabling, duplex mismatch, EMI, or failing ports/transceivers.';
    }
    if (q.includes('latency')) {
        return 'Latency is end-to-end delay for packet delivery, typically measured in milliseconds. Persistent latency spikes are often symptoms of congestion, packet loss, queueing, or upstream physical/link instability.';
    }
    if (q.includes('jitter')) {
        return 'Jitter is variation in packet delay over time. High jitter can break OT/real-time traffic even when average latency appears acceptable.';
    }
    if (q.includes('packet loss')) {
        return 'Packet loss is the percentage of packets that never reach destination. In IT/OT systems, sustained loss often cascades into retransmissions, timeout storms, and application-level failures.';
    }
    if (q.includes('osi')) {
        return 'OSI is a 7-layer model (L1 Physical to L7 Application). In root-cause analysis, faults often originate in lower layers (L1-L3) and propagate upward as L4-L7 symptoms.';
    }

    return null;
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

function buildHealthyForensicReport(
    query: string,
    devices: Device[],
    connections: NetworkConnection[]
): ForensicReport {
    const now = Date.now();
    const healthyDevices = devices.filter((d) => d.status === 'healthy').length;
    const degradedLinks = connections.filter((c) => c.status !== 'healthy').length;

    return {
        criticality: 'low',
        rootCause: 'No active root cause identified in current live telemetry.',
        chainOfThought: [
            {
                id: `step-${now}-1`,
                timestamp: now,
                agent: 'Coordinator',
                action: 'Validate current telemetry state',
                status: 'success',
                result: `${healthyDevices}/${devices.length} devices healthy; ${degradedLinks} degraded/down links`,
            },
            {
                id: `step-${now}-2`,
                timestamp: now + 300,
                agent: 'Reliability',
                action: 'Check for recent high-confidence fault indicators',
                status: 'success',
                result: 'No active incident pattern detected',
            },
        ],
        artifacts: [
            {
                type: 'json_log',
                title: 'Healthy State Verification',
                description: 'No active fault chain identified; system appears stable at analysis time.',
                data: {
                    query,
                    devices: { total: devices.length, healthy: healthyDevices },
                    links: { total: connections.length, degradedOrDown: degradedLinks },
                    analyzedAt: new Date(now).toISOString(),
                },
            },
        ],
        recommendations: [
            'Continue live monitoring and keep alert thresholds calibrated.',
            'If issue was recently fixed, monitor for 10-15 minutes to confirm no recurrence.',
        ],
        summary: 'System is operating normally. No active root cause found in current telemetry.',
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
        const now = Date.now();
        const recencyWindowMs = 10 * 60 * 1000;
        const recentActionableAlerts = activeAlerts.filter((a) => {
            const ts = new Date(a.timestamp).getTime();
            const isRecent = Number.isFinite(ts) && now - ts <= recencyWindowMs;
            return isRecent && a.severity !== 'info';
        });

        const hasLiveDegradation =
            devices.some((d) => d.status !== 'healthy') ||
            connections.some((c) => c.status !== 'healthy');

        if (!hasLiveDegradation && recentActionableAlerts.length === 0) {
            return buildHealthyForensicReport(userQuery, devices, connections);
        }

        const alertsForAnalysis = recentActionableAlerts.length > 0
            ? recentActionableAlerts
            : activeAlerts.filter((a) => a.severity !== 'info');

        return buildDeterministicForensicReport(userQuery, alertsForAnalysis, devices, connections, dependencies);
    }

    // For status checks, return a deterministic status listing.
    if (intent === 'STATUS_CHECK') {
        return buildStatusText(activeAlerts, devices);
    }

    // For website/navigation questions, return deterministic assistant guidance.
    if (intent === 'WEBSITE_ASSIST') {
        return buildWebsiteAssistText(userQuery, activeAlerts, devices, connections);
    }

    // GENERAL KNOWLEDGE: prefer Gemini if configured, otherwise return a safe fallback.
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    const hasRealKey = typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey !== 'dummy_key';
    if (!hasRealKey) {
        const offlineKnowledge = buildOfflineGeneralKnowledgeResponse(userQuery);
        if (offlineKnowledge) return offlineKnowledge;
        return 'Gemini is not configured. Add VITE_AI_API_KEY to your .env file and restart the dev server. Deterministic diagnostic/status analysis is still available.';
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
