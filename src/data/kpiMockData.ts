
export interface KPIData {
    activeRootCause: string;
    devicesImpacted: number;
    escalationProbability: number;
    systemHealth: number;
}

export interface LayerSeverity {
    layer: string;
    score: number; // 0-100
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PropagationNode {
    id: string;
    name: string;
    layer: string;
    status: 'healthy' | 'warning' | 'critical';
    latency?: string;
}

export interface EscalationRisk {
    probability: number; // 0-100
    level: 'Low' | 'Moderate' | 'High' | 'Critical';
    timeToCritical: string;
    confidence: number;
    drivers: string[];
    predictionFactors: {
        factor: string;
        impact: number; // positive or negative percentage
        type: 'risk' | 'safety';
    }[];
}

export interface TrendPoint {
    time: string;
    severity: number;
    probability: number;
}

export const kpiSummary: KPIData = {
    activeRootCause: "L1 Physical (Switch-02)",
    devicesImpacted: 4,
    escalationProbability: 78,
    systemHealth: 82,
};

export const layerSeverityData: LayerSeverity[] = [
    { layer: 'L1', score: 92, severity: 'critical' },
    { layer: 'L2', score: 45, severity: 'medium' },
    { layer: 'L3', score: 30, severity: 'low' },
    { layer: 'L4', score: 65, severity: 'high' },
    { layer: 'L5', score: 20, severity: 'low' },
    { layer: 'L6', score: 15, severity: 'low' },
    { layer: 'L7', score: 88, severity: 'critical' },
];

export const propagationChain: PropagationNode[] = [
    { id: 'dev-1', name: 'Switch-02', layer: 'L1 Physical', status: 'critical', latency: '12 sec' },
    { id: 'dev-2', name: 'PLC-A', layer: 'L4 Transport', status: 'warning', latency: '8 sec' },
    { id: 'dev-3', name: 'SCADA System', layer: 'L7 Application', status: 'critical', latency: 'Now' },
];

export const escalationRisk: EscalationRisk = {
    probability: 78,
    level: 'High',
    timeToCritical: '5–10 minutes',
    confidence: 91,
    drivers: ['Packet Loss > 15%', 'Jitter Spike (85ms)', 'CRC Error Storm'],
    predictionFactors: [
        { factor: 'High CRC errors', impact: 22, type: 'risk' },
        { factor: 'Packet loss > 15%', impact: 18, type: 'risk' },
        { factor: 'Downstream device count', impact: 12, type: 'risk' },
        { factor: 'Stable L6/L7 metrics', impact: -5, type: 'safety' },
    ]
};

export const trendData: TrendPoint[] = [
    { time: '12:00', severity: 20, probability: 10 },
    { time: '12:02', severity: 25, probability: 15 },
    { time: '12:04', severity: 80, probability: 40 }, // Fault Injection
    { time: '12:06', severity: 85, probability: 65 },
    { time: '12:08', severity: 70, probability: 72 },
    { time: '12:10', severity: 90, probability: 78 },
    { time: '12:12', severity: 88, probability: 80 },
];
