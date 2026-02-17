import { Alert, Device, NetworkConnection, CausalChain, DependencyPath } from '../types/network';

// --- Graph Structure ---

interface AdjacencyList {
    [deviceId: string]: string[]; // downstream neighbors
}

// --- Relationship Engine ---

export function analyzeRelationships(
    alerts: Alert[],
    devices: Device[],
    connections: NetworkConnection[],
    dependencies: DependencyPath[]
): CausalChain {

    // 1. Build Network Graph (Adjacency List)
    const graph: AdjacencyList = {};
    devices.forEach(d => graph[d.id] = []);
    connections.forEach(c => {
        if (graph[c.source]) graph[c.source].push(c.target);
        // We treat connections as directional for propagation (Source -> Target)
        // Adjust if your network model is bi-directional for fault propagation
    });

    // 2. Identify Anomalies (Root Cause Candidates)
    // Filter alerts active in the last window (e.g. 24h, though simpler is just "current alerts")
    // We assume 'alerts' passed in are already time-filtered by the UI
    if (alerts.length === 0) {
        return createCleanStateChain();
    }

    // Sort alerts by Time (oldest first) and Layer (L1 > L2 > ... > L7)
    // We need a composite sort:
    // Priority 1: Timestamp (Earliest is likely root)
    // Priority 2: Layer (Lower is likely root)
    const sortedAlerts = [...alerts].sort((a, b) => {
        const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (Math.abs(timeDiff) > 1000) return timeDiff; // If >1s diff, trust time
        // If close in time, prioritize Layer L1 -> L7
        const layerOrder = { 'L1': 1, 'L2': 2, 'L3': 3, 'L4': 4, 'L5': 5, 'L6': 6, 'L7': 7 };
        return (layerOrder[a.layer as keyof typeof layerOrder] || 99) - (layerOrder[b.layer as keyof typeof layerOrder] || 99);
    });

    const rootAlert = sortedAlerts[0];
    const rootDevice = devices.find(d => d.name === rootAlert.device) || devices.find(d => d.id === rootAlert.device);

    if (!rootDevice) {
        return createAmbiguousChain("Root device not found in topology", alerts);
    }

    // 3. Trace Propagation (Downstream Search)
    const propagationPath: { upstreamDevice: string, downstreamDevice: string, depth: number }[] = [];
    const impactedDevices = new Set<string>();
    impactedDevices.add(rootDevice.id);

    const queue: { id: string, depth: number }[] = [{ id: rootDevice.id, depth: 0 }];
    const visited = new Set<string>();
    visited.add(rootDevice.id);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = graph[current.id] || [];

        for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push({ id: neighborId, depth: current.depth + 1 });

                // Only add to propagation path if neighbor is ALSO Unhealthy
                const neighbor = devices.find(d => d.id === neighborId);
                if (neighbor && neighbor.status !== 'healthy') {
                    propagationPath.push({
                        upstreamDevice: getDeviceName(current.id, devices),
                        downstreamDevice: neighbor.name,
                        depth: current.depth + 1
                    });
                    impactedDevices.add(neighborId);
                }
            }
        }
    }

    // 4. Determine Impacted Workflows
    const impactedWorkflows = dependencies
        .filter(dep => dep.path.some(dId => impactedDevices.has(dId)))
        .map(dep => dep.appName);

    // 5. Calculate Confidence
    // Logic: 
    // - Base 0.5
    // - +0.2 if Root is L1/L2
    // - +0.2 if Propagation Depth > 0 (it explains downstream issues)
    // - +0.1 if Time Ordering matches (Root time < Symptom time) - Implicitly handled by sort, but we can verify last alert time

    let confidence = 0.5;
    const isPhysicalRoot = ['L1', 'L2'].includes(rootAlert.layer);
    if (isPhysicalRoot) confidence += 0.2;
    if (propagationPath.length > 0) confidence += 0.2;

    // Check timestamps: Root should be < Last Alert
    const lastAlert = sortedAlerts[sortedAlerts.length - 1];
    if (new Date(rootAlert.timestamp).getTime() < new Date(lastAlert.timestamp).getTime()) {
        confidence += 0.1;
    }

    // Cap at 0.99
    confidence = Math.min(0.99, confidence);

    // 6. Build Evidence Pack
    const evidence = {
        triggeringAlertId: rootAlert.id,
        rootLayer: rootAlert.layer,
        affectedMetrics: [rootAlert.message], // Simplified for now, could parse metrics
        timestampWindow: {
            firstAnomaly: new Date(rootAlert.timestamp).getTime(),
            lastEscalation: new Date(lastAlert.timestamp).getTime()
        }
    };

    // 7. Construct Causal Chain
    return {
        id: `chain-${Date.now()}`,
        confidenceScore: confidence,
        confidenceReason: generateConfidenceReason(confidence, rootAlert, propagationPath.length),
        diagnosisType: 'RootCause',
        primaryFault: {
            device: rootDevice.name,
            layer: rootAlert.layer,
            reason: rootAlert.message
        },
        propagation: propagationPath,
        impact: {
            technical: [`${propagationPath.length} dowstream devices correlated`],
            operational: isPhysicalRoot ? ["Physical layer instability detected"] : ["Application performance degraded"],
            impactedDeviceIds: Array.from(impactedDevices),
            affectedWorkflows: Array.from(new Set(impactedWorkflows))
        },
        evidence: evidence,
        summary: `Identified ${rootAlert.layer} root cause on ${rootDevice.name} affecting ${impactedWorkflows.length} workflows.`
    };
}

// --- Helpers ---

function createCleanStateChain(): CausalChain {
    return {
        id: `clean-${Date.now()}`,
        confidenceScore: 1.0,
        confidenceReason: "No active alerts detected.",
        diagnosisType: 'Isolated',
        primaryFault: { device: "None", layer: "None", reason: "System Healthy" },
        propagation: [],
        impact: { technical: [], operational: [], impactedDeviceIds: [], affectedWorkflows: [] },
        evidence: { triggeringAlertId: "", rootLayer: "", affectedMetrics: [], timestampWindow: { firstAnomaly: 0, lastEscalation: 0 } },
        summary: "System is operating normally."
    };
}

function createAmbiguousChain(reason: string, alerts: Alert[]): CausalChain {
    return {
        id: `ambiguous-${Date.now()}`,
        confidenceScore: 0.3,
        confidenceReason: "Conflicting or insufficient telemetry.",
        diagnosisType: 'Ambiguous',
        primaryFault: { device: "Unknown", layer: "Unknown", reason: "Multiple potential causes" },
        propagation: [],
        impact: { technical: [], operational: [], impactedDeviceIds: [], affectedWorkflows: [] },
        evidence: { triggeringAlertId: "", rootLayer: "", affectedMetrics: [], timestampWindow: { firstAnomaly: 0, lastEscalation: 0 } },
        possibleCauses: alerts.map(a => `${a.device} (${a.layer})`),
        summary: reason
    };
}

function getDeviceName(id: string, devices: Device[]): string {
    return devices.find(d => d.id === id)?.name || id;
}

function generateConfidenceReason(score: number, rootAlert: Alert, propagationCount: number): string {
    if (score > 0.8) return `High confidence: Early ${rootAlert.layer} anomaly precedes ${propagationCount} downstream symptoms.`;
    if (score > 0.6) return `Medium confidence: ${rootAlert.layer} fault detected but propagation pattern is partial.`;
    return "Low confidence: Telemetry is noisy or lacks clear causal timing.";
}
