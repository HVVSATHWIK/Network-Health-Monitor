import { useMemo } from 'react';
import GlobalSummaryBar from './GlobalSummaryBar';
import LayerSeverityChart from './LayerSeverityChart';
import PropagationFlow from './PropagationFlow';
import EscalationCard from './EscalationCard';
import TrendAnalysisGraph from './TrendAnalysisGraph';
import type { Alert, Device, NetworkConnection } from '../../types/network';
import {
    kpiSummary,
    layerSeverityData,
    propagationChain,
    escalationRisk,
    trendData,
    type KPIData,
    type LayerSeverity,
    type PropagationNode,
    type EscalationRisk,
    type TrendPoint,
} from '../../data/kpiMockData';

interface RealTimeKPIPageProps {
    devices?: Device[];
    alerts?: Alert[];
    connections?: NetworkConnection[];
    timeRangeLabel?: string;
    timeRangeValue?: string;
    timeRangeStart?: Date;
    timeRangeEnd?: Date;
}

const severityWeight: Record<Alert['severity'], number> = {
    info: 0.8,
    low: 1.2,
    medium: 2,
    high: 3,
    critical: 4,
};

const layerOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'] as const;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const toSeverityBand = (score: number): LayerSeverity['severity'] => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
};

const getSpanMinutes = (value: string, start?: Date, end?: Date) => {
    if (value === 'custom' && start && end) {
        const diff = end.getTime() - start.getTime();
        return clamp(Math.round(diff / 60000), 10, 10080);
    }

    const mapping: Record<string, number> = {
        '10m': 10,
        '30m': 30,
        '1h': 60,
        '3h': 180,
        '6h': 360,
        '12h': 720,
        '24h': 1440,
        '2d': 2880,
        '3d': 4320,
        '1w': 10080,
        '1mo': 43200,
    };

    return mapping[value] ?? 180;
};

const RealTimeKPIPage = ({
    devices = [],
    alerts = [],
    connections = [],
    timeRangeLabel = 'last 15 min',
    timeRangeValue = '3h',
    timeRangeStart,
    timeRangeEnd,
}: RealTimeKPIPageProps) => {
    const hasLiveData = devices.length > 0 || alerts.length > 0 || connections.length > 0;

    const computed = useMemo(() => {
        if (!hasLiveData) {
            return {
                summary: kpiSummary,
                layers: layerSeverityData,
                chain: propagationChain,
                risk: escalationRisk,
                trend: trendData,
            };
        }

        const unhealthyDevices = devices.filter((d) => d.status !== 'healthy').length;
        const degradedConnections = connections.filter((c) => c.status !== 'healthy').length;
        const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
        const highAlerts = alerts.filter((a) => a.severity === 'high').length;
        const mediumAlerts = alerts.filter((a) => a.severity === 'medium').length;
        const impactedDevices = new Set(alerts.map((a) => a.device).filter(Boolean));

        const rootAlert = [...alerts].sort((a, b) => {
            const weightDelta = severityWeight[b.severity] - severityWeight[a.severity];
            if (weightDelta !== 0) return weightDelta;
            return b.timestamp.getTime() - a.timestamp.getTime();
        })[0];

        const healthPercentage = devices.length > 0
            ? Math.round((devices.filter((d) => d.status === 'healthy').length / devices.length) * 100)
            : kpiSummary.systemHealth;

        const impactedRatio = devices.length > 0 ? impactedDevices.size / devices.length : 0;
        const degradedRatio = connections.length > 0 ? degradedConnections / connections.length : 0;
        const unhealthyRatio = devices.length > 0 ? unhealthyDevices / devices.length : 0;

        const escalationProbability = Math.round(
            clamp(
                18 +
                criticalAlerts * 12 +
                highAlerts * 7 +
                mediumAlerts * 3 +
                impactedRatio * 28 +
                degradedRatio * 18 +
                unhealthyRatio * 22,
                6,
                99
            )
        );

        const summary: KPIData = {
            activeRootCause: rootAlert ? `${rootAlert.layer} ${rootAlert.device}` : kpiSummary.activeRootCause,
            devicesImpacted: impactedDevices.size > 0 ? impactedDevices.size : unhealthyDevices,
            escalationProbability,
            systemHealth: healthPercentage,
        };

        const layers: LayerSeverity[] = layerOrder.map((layer) => {
            const layerAlerts = alerts.filter((a) => a.layer === layer);
            const avgWeight = layerAlerts.length > 0
                ? layerAlerts.reduce((sum, alert) => sum + severityWeight[alert.severity], 0) / layerAlerts.length
                : 0;

            const deviceMetricStress = devices.length > 0
                ? devices.reduce((sum, device) => {
                    if (layer === 'L1') {
                        return sum + clamp((device.metrics.l1.temperature - 35) * 1.1, 0, 60);
                    }
                    if (layer === 'L2') {
                        return sum + clamp((device.metrics.l2.crcErrors / 20) + ((100 - device.metrics.l2.linkUtilization) * 0.22), 0, 65);
                    }
                    if (layer === 'L3') {
                        return sum + clamp(device.metrics.l3.packetLoss * 4.5, 0, 70);
                    }
                    if (layer === 'L4') {
                        return sum + clamp((device.metrics.l4.jitter * 1.25) + (device.metrics.l4.tcpRetransmissions * 120), 0, 75);
                    }
                    if (layer === 'L5') {
                        return sum + clamp(device.metrics.l5.sessionResets * 2.1, 0, 70);
                    }
                    if (layer === 'L6') {
                        return sum + clamp(device.metrics.l6.tlsHandshakeFailures * 4.2, 0, 70);
                    }
                    return sum + clamp(device.metrics.l7.appLatency / 45, 0, 75);
                }, 0) / Math.max(1, devices.length)
                : 0;

            const score = Math.round(
                clamp(
                    avgWeight * 17 +
                    Math.min(layerAlerts.length, 5) * 6 +
                    deviceMetricStress,
                    6,
                    96
                )
            );

            return {
                layer,
                score,
                severity: toSeverityBand(score),
            };
        });

        const statusFromDevice = (device?: Device): PropagationNode['status'] => {
            if (!device) return 'warning';
            if (device.status === 'critical') return 'critical';
            if (device.status === 'healthy') return 'healthy';
            return 'warning';
        };

        const rootDevice = rootAlert
            ? devices.find((d) => d.name === rootAlert.device)
            : undefined;

        const impactCandidates = [...devices]
            .sort((a, b) => {
                const impactA = (a.status === 'critical' ? 4 : a.status === 'warning' ? 2 : 0) + (a.metrics.l7.appLatency / 1000) + a.metrics.l3.packetLoss;
                const impactB = (b.status === 'critical' ? 4 : b.status === 'warning' ? 2 : 0) + (b.metrics.l7.appLatency / 1000) + b.metrics.l3.packetLoss;
                return impactB - impactA;
            })
            .filter((device) => !rootDevice || device.id !== rootDevice.id)
            .slice(0, 2);

        const chainDevices = [rootDevice, ...impactCandidates].filter(Boolean) as Device[];

        const chain: PropagationNode[] = (chainDevices.length > 0 ? chainDevices : []).map((device, idx) => {
            const layer = idx === 0
                ? (rootAlert?.layer ?? 'L1')
                : device.metrics.l7.appLatency > 800
                    ? 'L7'
                    : device.metrics.l4.jitter > 25
                        ? 'L4'
                        : 'L3';

            return {
                id: device.id,
                name: device.name,
                layer,
                status: statusFromDevice(device),
                latency: `${Math.round(clamp(device.metrics.l7.appLatency, 20, 8000))} ms`,
            };
        });

        const probabilityLevel: EscalationRisk['level'] = escalationProbability >= 85
            ? 'Critical'
            : escalationProbability >= 70
                ? 'High'
                : escalationProbability >= 45
                    ? 'Moderate'
                    : 'Low';

        const modelReliability = Math.round(
            clamp(
                62 +
                Math.log2(Math.max(2, devices.length + alerts.length)) * 7 -
                Math.max(0, degradedConnections - 3) * 1.2,
                58,
                96
            )
        );
        const uncertaintyBand = clamp(Math.round(28 - modelReliability * 0.2), 8, 20);
        const probabilityRangeLow = clamp(escalationProbability - uncertaintyBand, 1, 99);
        const probabilityRangeHigh = clamp(escalationProbability + uncertaintyBand, 1, 99);

        const p50Minutes = clamp(Math.round(55 - escalationProbability * 0.45), 5, 60);
        const p90Minutes = clamp(p50Minutes + 8, 8, 80);

        const risk: EscalationRisk = {
            probability: escalationProbability,
            level: probabilityLevel,
            probabilityRange: {
                low: probabilityRangeLow,
                high: probabilityRangeHigh,
            },
            escalationThreshold: 70,
            timeToCriticalRange: `${p50Minutes}–${p90Minutes} minutes (P50–P90 estimate)`,
            modelReliability,
            reliabilityLabel: 'Live calibration from active telemetry window',
            falsePositiveRate: clamp(Math.round(40 - modelReliability * 0.32), 5, 26),
            recommendedAction: escalationProbability >= 70
                ? 'Escalate to OT and network ops if score remains above threshold for 2 consecutive windows.'
                : 'Continue observation and verify noisy links before escalating to incident response.',
            predictionFactors: [
                {
                    factor: 'Critical/high alert concentration',
                    signal: Number((criticalAlerts * 0.9 + highAlerts * 0.45).toFixed(1)),
                    type: 'risk',
                },
                {
                    factor: 'Transport jitter and retransmissions',
                    signal: Number((devices.reduce((sum, d) => sum + d.metrics.l4.jitter, 0) / Math.max(1, devices.length * 30)).toFixed(1)),
                    type: 'risk',
                },
                {
                    factor: 'Dependency path saturation',
                    signal: Number((degradedRatio * 2.4).toFixed(1)),
                    type: 'risk',
                },
                {
                    factor: 'Healthy endpoint coverage',
                    signal: Number((-(healthPercentage / 100) * 1.1).toFixed(1)),
                    type: 'safety',
                },
            ],
        };

        const spanMinutes = getSpanMinutes(timeRangeValue, timeRangeStart, timeRangeEnd);
        const points = clamp(Math.round(spanMinutes / 6), 10, 36);
        const now = Date.now();
        const bucketMs = Math.max(1, Math.round((spanMinutes * 60 * 1000) / points));

        let rollingProbability = escalationProbability * 0.7;
        const trend: TrendPoint[] = Array.from({ length: points }, (_, idx) => {
            const ts = now - (points - 1 - idx) * bucketMs;
            const fromTs = ts - bucketMs;
            const bucketAlerts = alerts.filter((alert) => {
                const ms = alert.timestamp.getTime();
                return ms > fromTs && ms <= ts;
            });

            const bucketSeverity = bucketAlerts.length > 0
                ? bucketAlerts.reduce((sum, alert) => sum + severityWeight[alert.severity], 0) / bucketAlerts.length
                : 0;

            const volatility = Math.sin(idx / 2.3) * 3.2 + Math.cos(idx / 3.7) * 1.6;
            const severity = clamp(
                Math.round(
                    18 +
                    bucketSeverity * 18 +
                    unhealthyRatio * 34 +
                    degradedRatio * 22 +
                    volatility
                ),
                4,
                99
            );

            rollingProbability = clamp(
                rollingProbability * 0.72 + severity * 0.28 + bucketAlerts.length * 0.7,
                3,
                99
            );

            return {
                time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                severity,
                probability: Math.round(rollingProbability),
            };
        });

        return {
            summary,
            layers,
            chain: chain.length > 0 ? chain : propagationChain,
            risk,
            trend,
        };
    }, [hasLiveData, devices, alerts, connections, timeRangeValue, timeRangeStart, timeRangeEnd]);

    return (
        <div className="h-full w-full p-6 lg:pr-28 pb-28 bg-gunmetal-950 text-gunmetal-100 overflow-y-auto custom-scrollbar">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sans font-bold text-gunmetal-100 mb-2 tracking-tight">NetMonit AI: KPI Intelligence</h1>
                <p className="text-gunmetal-400">Live telemetry, propagation mapping, and predictive escalation risk.</p>
            </div>

            {/* Top Section: Global Metrics */}
            <GlobalSummaryBar data={computed.summary} />

            {/* Middle Section: 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 h-auto lg:min-h-[450px]">

                {/* Left: Layer Severity (3 cols) */}
                <div className="lg:col-span-3 h-[400px] lg:h-full">
                    <LayerSeverityChart data={computed.layers} />
                </div>

                {/* Center: Propagation Flow (6 cols) */}
                <div className="lg:col-span-5 h-[400px] lg:h-full">
                    <PropagationFlow chain={computed.chain} />
                </div>

                {/* Right: Escalation Intelligence (3 cols) */}
                <div className="lg:col-span-4 h-[400px] lg:h-full">
                    <EscalationCard risk={computed.risk} />
                </div>
            </div>

            {/* Bottom Section: Trend Graph */}
            <div className="h-[350px] w-full mb-6">
                <TrendAnalysisGraph data={computed.trend} windowLabel={timeRangeLabel.toLowerCase()} />
            </div>
        </div>
    );
};

export default RealTimeKPIPage;
