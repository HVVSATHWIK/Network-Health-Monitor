import { Device } from '../types/network';

export interface RawTelemetry {
    deviceId: string;
    timestamp: number;
    sourceType: 'snmp' | 'flow' | 'agent' | 'api';

    // Flattened raw metrics (simulating what an ingest pipeline might output)
    cpu_temp?: number;
    optical_rx_dbm?: number;
    fan_rpm?: number;

    if_crc_errors?: number;
    if_utilization_pct?: number;
    l2_mac_flap_flag?: boolean;

    l3_packet_loss_pct?: number;
    l3_routes_count?: number;
    l3_drops_count?: number;

    l4_tcp_retrans_rate?: number;
    l4_jitter_ms?: number;

    l5_session_resets?: number;
    l5_stability_score?: number;

    l6_tls_failures?: number;
    l6_enc_overhead?: number;

    l7_response_time_ms?: number;
    l7_proto_anomaly?: boolean;
}

export class TelemetryMapperService {
    /**
     * Maps raw telemetry data to the application's unified Device metrics structure.
     * This handles normalization, default values, and structure alignment.
     */
    public mapTelemetryToDeviceMetrics(currentDevice: Device, telemetry: RawTelemetry): Device {
        // Clone device to avoid mutation
        const updatedDevice = { ...currentDevice };

        // Helper to merge metrics gracefully
        const merge = (layer: keyof typeof updatedDevice.metrics, updates: Record<string, unknown>) => {
            updatedDevice.metrics = {
                ...updatedDevice.metrics,
                [layer]: {
                    ...updatedDevice.metrics[layer],
                    ...Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined))
                }
            };
        };

        // L1
        merge('l1', {
            temperature: telemetry.cpu_temp,
            opticalRxPower: telemetry.optical_rx_dbm,
            fanSpeed: telemetry.fan_rpm
        });

        // L2
        merge('l2', {
            crcErrors: telemetry.if_crc_errors,
            linkUtilization: telemetry.if_utilization_pct,
            macFlapping: telemetry.l2_mac_flap_flag
        });

        // L3
        merge('l3', {
            packetLoss: telemetry.l3_packet_loss_pct,
            routingTableSize: telemetry.l3_routes_count,
            firewallDrops: telemetry.l3_drops_count
        });

        // L4
        merge('l4', {
            tcpRetransmissions: telemetry.l4_tcp_retrans_rate,
            jitter: telemetry.l4_jitter_ms
        });

        // L5
        merge('l5', {
            sessionResets: telemetry.l5_session_resets,
            sessionStability: telemetry.l5_stability_score
        });

        // L6
        merge('l6', {
            tlsHandshakeFailures: telemetry.l6_tls_failures,
            encryptionOverheadMs: telemetry.l6_enc_overhead
        });

        // L7
        merge('l7', {
            appLatency: telemetry.l7_response_time_ms,
            protocolAnomaly: telemetry.l7_proto_anomaly
        });

        // Derive Status from Metrics
        updatedDevice.status = this.deriveStatusFromMetrics(updatedDevice.metrics);

        return updatedDevice;
    }

    private deriveStatusFromMetrics(metrics: Device['metrics']): 'healthy' | 'warning' | 'critical' {
        // L1 Thresholds
        if ((metrics.l1.temperature || 0) > 75) return 'critical';
        if ((metrics.l1.temperature || 0) > 60) return 'warning';
        if ((metrics.l1.opticalRxPower || 0) < -30) return 'critical';

        // L2 Thresholds
        if ((metrics.l2.crcErrors || 0) > 50) return 'critical';
        if ((metrics.l2.crcErrors || 0) > 10) return 'warning';

        // L3 Thresholds
        if ((metrics.l3.packetLoss || 0) > 5) return 'critical';
        if ((metrics.l3.packetLoss || 0) > 2) return 'warning';

        // L7 Thresholds
        if ((metrics.l7.appLatency || 0) > 1000) return 'critical';
        if ((metrics.l7.appLatency || 0) > 500) return 'warning';

        return 'healthy';
    }
}

export const TelemetryMapper = new TelemetryMapperService();
