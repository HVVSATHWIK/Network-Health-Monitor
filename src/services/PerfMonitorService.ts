import { usePerfStore } from '../store/usePerfStore';

class PerfMonitor {
  private memoryIntervalId: number | null = null;

  markStartup(name: string) {
    usePerfStore.getState().markStartup(name);
  }

  measureStartup(name: string, fromMark: string, toMark: string) {
    usePerfStore.getState().measureStartup(name, fromMark, toMark);
  }

  startTimer() {
    return performance.now();
  }

  endAction(name: string, startedAt: number) {
    const duration = Math.max(0, performance.now() - startedAt);
    const perf = usePerfStore.getState();
    perf.recordAction(name, duration);
    perf.incrementCounter('toolActions', 1);
  }

  recordAction(name: string, durationMs: number) {
    const perf = usePerfStore.getState();
    perf.recordAction(name, durationMs);
    perf.incrementCounter('toolActions', 1);
  }

  recordModelLatency(durationMs: number, ok: boolean) {
    const perf = usePerfStore.getState();
    perf.recordModelLatency(durationMs, ok);
    perf.incrementCounter('aiRequests', 1);
  }

  recordDeterministicAI() {
    usePerfStore.getState().incrementCounter('aiDeterministic', 1);
  }

  recordTelemetryBatch(recordCount: number, durationMs: number) {
    const perf = usePerfStore.getState();
    perf.incrementCounter('telemetryBatches', 1);
    if (recordCount > 0) perf.incrementCounter('telemetryRecords', recordCount);
    perf.recordAction('telemetry_batch_ms', durationMs);
  }

  recordFileImport(recordCount: number, durationMs: number) {
    const perf = usePerfStore.getState();
    perf.incrementCounter('filesImported', 1);
    perf.recordAction('file_import_ms', durationMs);
    if (recordCount > 0) perf.incrementCounter('telemetryRecords', recordCount);
  }

  sampleMemoryNow() {
    const perfAny = performance as Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };

    if (!perfAny.memory) {
      usePerfStore.getState().recordMemory({
        supported: false,
        usedMB: null,
        limitMB: null,
        percent: null,
        warning: false,
      });
      return;
    }

    const usedMB = perfAny.memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = perfAny.memory.jsHeapSizeLimit / (1024 * 1024);
    const percent = limitMB > 0 ? (usedMB / limitMB) * 100 : null;

    usePerfStore.getState().recordMemory({
      supported: true,
      usedMB: Number(usedMB.toFixed(2)),
      limitMB: Number(limitMB.toFixed(2)),
      percent: percent === null ? null : Number(percent.toFixed(2)),
      warning: percent !== null && percent >= 80,
    });
  }

  startMemorySampler(intervalMs = 5000) {
    if (this.memoryIntervalId !== null) return;
    this.sampleMemoryNow();
    this.memoryIntervalId = window.setInterval(() => this.sampleMemoryNow(), intervalMs);
  }

  stopMemorySampler() {
    if (this.memoryIntervalId !== null) {
      window.clearInterval(this.memoryIntervalId);
      this.memoryIntervalId = null;
    }
  }

  exportJsonReport() {
    return JSON.stringify(usePerfStore.getState().buildSnapshot(), null, 2);
  }
}

export const PerfMonitorService = new PerfMonitor();
