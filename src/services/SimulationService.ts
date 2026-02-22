import { AssetRegistry } from './AssetRegistry';
import { RawTelemetry } from './TelemetryMapper';
import { IngestionPipeline } from './IngestionPipeline';
import { Device } from '../types/network';
import { PerfMonitorService } from './PerfMonitorService';

class SimulationService {
    private intervalId: number | null = null;
    private isRunning = false;

    public startSimulation(intervalMs: number = 2000) {
        if (this.isRunning) return;
        this.isRunning = true;

        this.intervalId = window.setInterval(() => {
            this.tick();
        }, intervalMs);
    }

    public stopSimulation() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    private tick() {
        const startedAt = PerfMonitorService.startTimer();
        const allDevices = AssetRegistry.getAllDevices();

        // Simulate telemetry for a random subset of devices each tick
        const updates = allDevices
            .filter(() => Math.random() > 0.7) // Update ~30% of devices per tick
            .map(device => this.generateTelemetryForDevice(device))
            .filter((t): t is RawTelemetry => t !== null);

        // Use the shared pipeline to process generated data
        IngestionPipeline.processTelemetryBatch(updates);
        PerfMonitorService.endAction('simulation_tick_ms', startedAt);
    }

    private generateTelemetryForDevice(device: Device): RawTelemetry | null {
        // Generate realistic-ish variations based on device type
        const isCritical = device.status === 'critical';

        return {
            deviceId: device.id, // In real world, this might be missing, and we'd rely on IP/MAC
            timestamp: Date.now(),
            sourceType: 'agent',

            // L1
            cpu_temp: 40 + Math.random() * 15 + (isCritical ? 30 : 0),
            optical_rx_dbm: -10 - Math.random() * 5,

            // L2
            if_utilization_pct: Math.random() * 60 + (isCritical ? 30 : 0),
            if_crc_errors: Math.random() > 0.95 ? Math.floor(Math.random() * 10) : 0,

            // L3
            l3_packet_loss_pct: Math.random() > 0.98 ? Math.random() * 5 : 0,

            // L4
            l4_jitter_ms: 2 + Math.random() * 10,

            // L7
            l7_response_time_ms: 20 + Math.random() * 100 + (isCritical ? 1000 : 0)
        };
    }
}

export const NetworkSimulation = new SimulationService();
