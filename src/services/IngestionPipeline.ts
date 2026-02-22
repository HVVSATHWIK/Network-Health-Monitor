import { IdentifierResolver } from './IdentifierResolver';
import { TelemetryMapper, RawTelemetry } from './TelemetryMapper';
import { useNetworkStore } from '../store/useNetworkStore';
import type { Alert, Device } from '../types/network';

/**
 * Derive which OSI layer is the likely source of a status change.
 */
function detectFaultLayer(metrics: Device['metrics']): { layer: Alert['layer']; message: string } {
    if ((metrics.l1.temperature || 0) > 75) return { layer: 'L1', message: `Temperature critical (${Math.round(metrics.l1.temperature || 0)}°C)` };
    if ((metrics.l1.opticalRxPower || 0) < -30) return { layer: 'L1', message: `Optical RX power critical (${(metrics.l1.opticalRxPower || 0).toFixed(1)} dBm)` };
    if ((metrics.l2.crcErrors || 0) > 50) return { layer: 'L2', message: `CRC error storm (${Math.round(metrics.l2.crcErrors || 0)} errors)` };
    if ((metrics.l2.crcErrors || 0) > 10) return { layer: 'L2', message: `Elevated CRC errors (${Math.round(metrics.l2.crcErrors || 0)})` };
    if ((metrics.l3.packetLoss || 0) > 5) return { layer: 'L3', message: `High packet loss (${(metrics.l3.packetLoss || 0).toFixed(1)}%)` };
    if ((metrics.l3.packetLoss || 0) > 2) return { layer: 'L3', message: `Packet loss detected (${(metrics.l3.packetLoss || 0).toFixed(1)}%)` };
    if ((metrics.l7.appLatency || 0) > 1000) return { layer: 'L7', message: `Application latency critical (${Math.round(metrics.l7.appLatency || 0)}ms)` };
    if ((metrics.l7.appLatency || 0) > 500) return { layer: 'L7', message: `Application latency elevated (${Math.round(metrics.l7.appLatency || 0)}ms)` };
    return { layer: 'L7', message: 'Telemetry anomaly detected' };
}

/**
 * Shared pipeline for ingesting telemetry data.
 * Can be used by the SimulationService (generated data)
 * or the DataImporter (user-uploaded data).
 */
export const processTelemetryBatch = (batch: RawTelemetry[]) => {
    const { updateDevice, addAlert, alerts, devices, faultedDeviceIds } = useNetworkStore.getState();

    // Track previous device statuses for transition detection
    const prevStatusMap = new Map(devices.map(d => [d.id, d.status]));

    batch.forEach(telemetry => {
        // 1. Resolve Identity
        const device = IdentifierResolver.resolveDevice({ deviceId: telemetry.deviceId });

        if (device) {
            // Skip devices under an active injected fault — don't overwrite their metrics
            if (faultedDeviceIds.has(device.id)) return;

            // 2. Map Telemetry
            const updatedDevice = TelemetryMapper.mapTelemetryToDeviceMetrics(device, telemetry);

            // 3. Update Store
            updateDevice(device.id, {
                metrics: updatedDevice.metrics,
                status: updatedDevice.status
            });

            // 4. Generate alerts on status transitions (healthy→warning, healthy→critical, warning→critical)
            const prevStatus = prevStatusMap.get(device.id) || 'healthy';
            const newStatus = updatedDevice.status;

            const severityOrder: Record<string, number> = { healthy: 0, warning: 1, critical: 2, offline: 3 };
            if (severityOrder[newStatus] > severityOrder[prevStatus]) {
                // Check if there's already a recent alert for this device (within 30 seconds) to avoid spam
                const recentCutoff = Date.now() - 30_000;
                const hasRecent = alerts.some(
                    a => a.device === device.name && new Date(a.timestamp).getTime() > recentCutoff
                );

                if (!hasRecent) {
                    const { layer, message } = detectFaultLayer(updatedDevice.metrics);
                    const alert: Alert = {
                        id: `auto-${device.id}-${Date.now()}`,
                        severity: newStatus === 'critical' ? 'critical' : 'medium',
                        layer,
                        device: device.name,
                        message,
                        timestamp: new Date(),
                        aiCorrelation: ''
                    };
                    addAlert(alert);
                }
            }
        } else {
            if (import.meta.env.DEV) console.warn(`[Ingestion] Could not resolve device for telemetry:`, telemetry);
        }
    });
};

export const IngestionPipeline = {
    processTelemetryBatch
};
