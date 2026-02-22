import { Activity, Brain, Cpu, Download, Gauge, History, MemoryStick, Timer } from 'lucide-react';
import { useMemo } from 'react';
import { PerfMonitorService } from '../../services/PerfMonitorService';
import { usePerfStore } from '../../store/usePerfStore';

const ms = (value: number) => `${value.toFixed(1)} ms`;

const sec = (msValue: number) => `${(msValue / 1000).toFixed(1)}s`;

export default function PerformanceStatsPanel() {
  const snapshot = usePerfStore((state) => state.buildSnapshot());
  const baseline = usePerfStore((state) => state.baseline);
  const setBaseline = usePerfStore((state) => state.setBaselineFromCurrent);

  const startupRows = useMemo(() => Object.entries(snapshot.startup), [snapshot.startup]);

  const regressions = useMemo(() => {
    if (!baseline) return [] as string[];

    const findings: string[] = [];
    for (const [key, current] of Object.entries(snapshot.startup)) {
      const prior = baseline.startup[key];
      if (typeof prior !== 'number' || prior <= 0) continue;
      const drift = ((current - prior) / prior) * 100;
      if (drift >= 20) findings.push(`${key} regressed by ${drift.toFixed(0)}%`);
    }

    const baselineAvg = baseline.model.avgLatencyMs;
    const currentAvg = snapshot.model.avgLatencyMs;
    if (baselineAvg > 0) {
      const drift = ((currentAvg - baselineAvg) / baselineAvg) * 100;
      if (drift >= 20) findings.push(`Model latency regressed by ${drift.toFixed(0)}%`);
    }

    return findings;
  }, [baseline, snapshot]);

  const coverage = useMemo(() => ([
    { label: 'Startup', ok: Object.keys(snapshot.startup).length > 0 },
    { label: 'AI', ok: snapshot.counters.aiRequests > 0 || snapshot.counters.aiDeterministic > 0 },
    { label: 'Telemetry', ok: snapshot.counters.telemetryBatches > 0 },
    { label: 'Import', ok: snapshot.counters.filesImported > 0 },
    { label: 'Actions', ok: Object.keys(snapshot.actions).length > 0 },
  ]), [snapshot]);

  const exportReport = () => {
    const content = PerfMonitorService.exportJsonReport();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netmonit-perf-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="perf-stats-panel" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 h-full overflow-y-auto space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-2">
          <Gauge className="w-4 h-4 text-indigo-300" /> Performance Stats
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Live diagnostics from startup, AI, telemetry, imports, and UI actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={setBaseline} className="text-xs px-2 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800">
            Set Baseline
          </button>
          <button onClick={exportReport} className="text-xs px-2 py-1 rounded-md border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-1">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {coverage.map((item) => (
          <span key={item.label} className={`text-[11px] px-2 py-1 rounded-full border ${item.ok ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-slate-700 text-slate-400 bg-slate-800/50'}`}>
            {item.label}
          </span>
        ))}
      </div>

      {regressions.length > 0 && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-3">
          <div className="text-xs font-semibold text-amber-300 mb-1">Regression Warnings</div>
          <ul className="text-xs text-amber-200 list-disc list-inside space-y-1">
            {regressions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Timer className="w-3 h-3" /> Startup</div>
          <div className="space-y-1 text-xs">
            {startupRows.length === 0 && <div className="text-slate-500">Startup data pending…</div>}
            {startupRows.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-slate-300">
                <span>{key}</span>
                <span>{ms(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MemoryStick className="w-3 h-3" /> Memory</div>
          {!snapshot.memory.supported ? (
            <div className="text-xs text-slate-500">Memory API unavailable in this browser</div>
          ) : (
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between"><span>Heap Used</span><span>{snapshot.memory.usedMB?.toFixed(1)} MB</span></div>
              <div className="flex justify-between"><span>Heap Limit</span><span>{snapshot.memory.limitMB?.toFixed(1)} MB</span></div>
              <div className="flex justify-between"><span>Usage</span><span className={snapshot.memory.warning ? 'text-amber-300' : 'text-slate-200'}>{snapshot.memory.percent?.toFixed(1)}%</span></div>
            </div>
          )}
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Brain className="w-3 h-3" /> Model Latency</div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between"><span>Requests</span><span>{snapshot.model.requests}</span></div>
            <div className="flex justify-between"><span>Errors</span><span>{snapshot.model.errors}</span></div>
            <div className="flex justify-between"><span>Avg</span><span>{ms(snapshot.model.avgLatencyMs)}</span></div>
            <div className="flex justify-between"><span>P95</span><span>{ms(snapshot.model.p95LatencyMs)}</span></div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Session</div>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between"><span>Uptime</span><span>{sec(snapshot.uptimeMs)}</span></div>
            <div className="flex justify-between"><span>Tool Actions</span><span>{snapshot.counters.toolActions}</span></div>
            <div className="flex justify-between"><span>Telemetry Batches</span><span>{snapshot.counters.telemetryBatches}</span></div>
            <div className="flex justify-between"><span>Telemetry Records</span><span>{snapshot.counters.telemetryRecords}</span></div>
            <div className="flex justify-between"><span>AI Requests</span><span>{snapshot.counters.aiRequests}</span></div>
            <div className="flex justify-between"><span>Deterministic AI</span><span>{snapshot.counters.aiDeterministic}</span></div>
            <div className="flex justify-between"><span>Files Imported</span><span>{snapshot.counters.filesImported}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
        <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Cpu className="w-3 h-3" /> Actions</div>
        <div className="space-y-1 text-xs">
          {Object.entries(snapshot.actions).length === 0 && <div className="text-slate-500">No action timings recorded yet.</div>}
          {Object.entries(snapshot.actions).map(([name, stat]) => (
            <div key={name} className="grid grid-cols-5 gap-2 text-slate-300">
              <span className="col-span-2 truncate">{name}</span>
              <span className="text-right">#{stat.count}</span>
              <span className="text-right">avg {ms(stat.count > 0 ? stat.totalMs / stat.count : 0)}</span>
              <span className="text-right">max {ms(stat.maxMs)}</span>
            </div>
          ))}
        </div>
      </div>

      {baseline && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <History className="w-3 h-3" /> Baseline loaded from local storage ({baseline.capturedAt})
        </div>
      )}
    </div>
  );
}
