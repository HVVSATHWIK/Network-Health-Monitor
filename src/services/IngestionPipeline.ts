import { IdentifierResolver } from './IdentifierResolver';
import { TelemetryMapper, RawTelemetry } from './TelemetryMapper';
import { useNetworkStore } from '../store/useNetworkStore';

/**
 * Shared pipeline for ingesting telemetry data.
 * Can be used by the SimulationService (generated data)
 * or the DataImporter (user-uploaded data).
 */
export const processTelemetryBatch = (batch: RawTelemetry[]) => {
    const { updateDevice } = useNetworkStore.getState();

    batch.forEach(telemetry => {
        // 1. Resolve Identity
        // Try to find the device in our Asset Registry using available IDs
        const device = IdentifierResolver.resolveDevice({ deviceId: telemetry.deviceId });

        if (device) {
            // 2. Map Telemetry
            // Normalize raw data into our internal Device structure
            const updatedDevice = TelemetryMapper.mapTelemetryToDeviceMetrics(device, telemetry);

            // 3. Update Store
            // We only update the metrics & status parts to avoid thrashing other state
            updateDevice(device.id, {
                metrics: updatedDevice.metrics,
                status: updatedDevice.status
            });
        } else {
            console.warn(`[Ingestion] Could not resolve device for telemetry:`, telemetry);
        }
    });
};

export const IngestionPipeline = {
    processTelemetryBatch
};
