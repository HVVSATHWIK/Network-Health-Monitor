import { create } from 'zustand';

export interface ActionStat {
  count: number;
  totalMs: number;
  lastMs: number;
  maxMs: number;
}

export interface PerfSnapshot {
  sessionId: string;
  capturedAt: string;
  uptimeMs: number;
  startup: Record<string, number>;
  memory: {
    supported: boolean;
    usedMB: number | null;
    limitMB: number | null;
    percent: number | null;
    warning: boolean;
  };
  model: {
    requests: number;
    errors: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    lastLatencyMs: number;
  };
  counters: {
    toolActions: number;
    telemetryBatches: number;
    telemetryRecords: number;
    filesImported: number;
    aiRequests: number;
    aiDeterministic: number;
  };
  actions: Record<string, ActionStat>;
}

interface PerfState {
  sessionId: string;
  sessionStartedAt: number;
  startupMarks: Record<string, number>;
  startup: Record<string, number>;
  actions: Record<string, ActionStat>;
  modelLatencies: number[];
  modelErrors: number;
  memory: {
    supported: boolean;
    usedMB: number | null;
    limitMB: number | null;
    percent: number | null;
    warning: boolean;
    sampledAt: number | null;
  };
  counters: {
    toolActions: number;
    telemetryBatches: number;
    telemetryRecords: number;
    filesImported: number;
    aiRequests: number;
    aiDeterministic: number;
  };
  baseline: PerfSnapshot | null;

  markStartup: (name: string, at?: number) => void;
  measureStartup: (name: string, fromMark: string, toMark: string) => void;
  recordAction: (name: string, durationMs: number) => void;
  recordModelLatency: (durationMs: number, ok: boolean) => void;
  recordMemory: (memory: { supported: boolean; usedMB: number | null; limitMB: number | null; percent: number | null; warning: boolean }) => void;
  incrementCounter: (name: keyof PerfState['counters'], by?: number) => void;
  loadBaseline: () => void;
  setBaselineFromCurrent: () => void;
  buildSnapshot: () => PerfSnapshot;
}

const BASELINE_KEY = 'netmonit-perf-baseline-v1';

const nowIso = () => new Date().toISOString();

const randomId = () => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const calcP95 = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[index];
};

export const usePerfStore = create<PerfState>((set, get) => ({
  sessionId: randomId(),
  sessionStartedAt: Date.now(),
  startupMarks: {},
  startup: {},
  actions: {},
  modelLatencies: [],
  modelErrors: 0,
  memory: {
    supported: false,
    usedMB: null,
    limitMB: null,
    percent: null,
    warning: false,
    sampledAt: null,
  },
  counters: {
    toolActions: 0,
    telemetryBatches: 0,
    telemetryRecords: 0,
    filesImported: 0,
    aiRequests: 0,
    aiDeterministic: 0,
  },
  baseline: null,

  markStartup: (name, at = performance.now()) => set((state) => ({
    startupMarks: { ...state.startupMarks, [name]: at },
  })),

  measureStartup: (name, fromMark, toMark) => set((state) => {
    const from = state.startupMarks[fromMark];
    const to = state.startupMarks[toMark];
    if (typeof from !== 'number' || typeof to !== 'number' || to < from) return state;
    return {
      startup: { ...state.startup, [name]: Number((to - from).toFixed(2)) },
    } as Partial<PerfState>;
  }),

  recordAction: (name, durationMs) => set((state) => {
    const prev = state.actions[name] ?? { count: 0, totalMs: 0, lastMs: 0, maxMs: 0 };
    const next: ActionStat = {
      count: prev.count + 1,
      totalMs: Number((prev.totalMs + durationMs).toFixed(2)),
      lastMs: Number(durationMs.toFixed(2)),
      maxMs: Math.max(prev.maxMs, Number(durationMs.toFixed(2))),
    };
    return { actions: { ...state.actions, [name]: next } } as Partial<PerfState>;
  }),

  recordModelLatency: (durationMs, ok) => set((state) => ({
    modelLatencies: [...state.modelLatencies.slice(-499), Number(durationMs.toFixed(2))],
    modelErrors: ok ? state.modelErrors : state.modelErrors + 1,
  })),

  recordMemory: (memory) => set({ memory: { ...memory, sampledAt: Date.now() } }),

  incrementCounter: (name, by = 1) => set((state) => ({
    counters: { ...state.counters, [name]: state.counters[name] + by },
  })),

  loadBaseline: () => {
    try {
      const raw = localStorage.getItem(BASELINE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PerfSnapshot;
      set({ baseline: parsed });
    } catch {
      set({ baseline: null });
    }
  },

  setBaselineFromCurrent: () => {
    const snapshot = get().buildSnapshot();
    localStorage.setItem(BASELINE_KEY, JSON.stringify(snapshot));
    set({ baseline: snapshot });
  },

  buildSnapshot: () => {
    const state = get();
    const latencies = state.modelLatencies;
    const totalLatency = latencies.reduce((sum, v) => sum + v, 0);
    const avgLatency = latencies.length > 0 ? totalLatency / latencies.length : 0;

    return {
      sessionId: state.sessionId,
      capturedAt: nowIso(),
      uptimeMs: Date.now() - state.sessionStartedAt,
      startup: state.startup,
      memory: {
        supported: state.memory.supported,
        usedMB: state.memory.usedMB,
        limitMB: state.memory.limitMB,
        percent: state.memory.percent,
        warning: state.memory.warning,
      },
      model: {
        requests: latencies.length,
        errors: state.modelErrors,
        avgLatencyMs: Number(avgLatency.toFixed(2)),
        p95LatencyMs: Number(calcP95(latencies).toFixed(2)),
        lastLatencyMs: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
      },
      counters: state.counters,
      actions: state.actions,
    };
  },
}));
