# NetMonit | AI-Assisted Network Health Monitor (IT/OT)

<p align="center">
	<img src="public/favicon.svg" width="88" height="88" alt="NetMonit logo" />
</p>

<p align="center">
	<strong>Industrial network observability with connected AI monitoring across topology, KPI, forensics, and logs.</strong>
</p>

<p align="center">
	<a href="#quickstart">Quickstart</a> ·
	<a href="#what-is-implemented-now">Current State</a> ·
	<a href="#ai-monitoring-and-quota-guardrails">AI Guardrails</a> ·
	<a href="#why-issues-can-appear-to-resolve-automatically">Auto-Resolve Behavior</a>
</p>

<p align="center">
	<img src="public/preview.svg" alt="NetMonit preview" />
</p>

---

## What this project does

NetMonit is an IT/OT convergence monitoring dashboard that combines:

- 3D topology and asset selection
- Layer-aware KPIs (L1-L7)
- Alert correlation and forensic investigation
- AI-assisted analysis with quota-safe execution
- Operator guide for discoverability of hidden features

The app is demo-oriented, but now has stronger end-to-end connection between views and AI monitoring workflows.

---

## What is implemented now

### 1) Connected monitoring across the app

- Shared telemetry state drives topology, alerts, KPI intelligence, and logs.
- AI monitoring coverage is surfaced in-header (layers, assets).
- AI quota usage is surfaced in-header (minute/day remaining).
- Automated alert enrichment writes AI context directly into active alerts.

### 2) KPI Intelligence UI (industrial minimal redesign)

- Replaced chunky heatmaps with thin sparklines and circular health rings for L1-L7.
- Predictive Insights card now uses a thin-stroke probability gauge.
- Propagation Flow is rendered as a cleaner digital twin schematic.
- Cards use frosted glass styling and dark gunmetal palette.

### 3) Forensics and logs

- Forensic cockpit renders deterministic RCA reports for diagnostic intents.
- Forensic terminal supports regex filtering with professionalized log formatting.
- New AI Monitoring Timeline in System Logs records automated AI enrichment actions with:
	- status (`success`, `quota_limited`, `error`)
	- timestamp
	- layer and device scope
	- detail summary

### 4) Guide updates

- Visual Guide includes:
	- AI Coverage badge step
	- AI Quota badge step
	- AI Monitoring Timeline step in System Logs
- Hidden interactions are called out (command palette, pan/zoom, panel behaviors).

### 5) Copy and naming cleanup

- Removed user-facing em-dash-heavy phrasing and decorative AI-like labels.
- Standardized wording to professional, operator-friendly naming.

---

## AI monitoring and quota guardrails

The AI logic now enforces strict request limits inside the app:

- **15 requests per minute**
- **1000 requests per day**

Implementation notes:

- Quota counters are persisted in browser `localStorage`.
- When quota is exhausted, the app returns a quota-safe message instead of calling external AI.
- Deterministic diagnostic/status logic remains available to avoid blank or broken UX.

Core file: `src/utils/aiLogic.ts`

---

## Why issues can appear to resolve automatically

This is expected in the current architecture and does not require manual intervention every time.

Reasons:

1. **Continuous simulation updates**
	 - `NetworkSimulation` ticks every few seconds and updates telemetry.

2. **Derived status recalculation**
	 - Device status is recomputed from thresholds in the telemetry mapper.
	 - If metrics recover under thresholds, status can return to healthy.

3. **Time-range filtering in UI**
	 - Older alerts can leave the active window based on selected time range.

4. **Automatic AI enrichment**
	 - Alert `aiCorrelation` can appear without a manual click because enrichment runs in the app loop.

If you want strict operator-driven behavior, disable simulation/auto-enrichment and use manual scan-only mode.

---

## Quickstart

### Prerequisites

- Node.js 18+

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Default URL is usually `http://localhost:5173`.

If the port is busy:

```bash
npm run dev -- --port 5174
```

### Quality checks

```bash
npm run typecheck
npm run lint
```

### Build

```bash
npm run build
```

---

## Main files

- `src/App.tsx` - app orchestration, shared monitoring state, AI enrichment loop
- `src/utils/aiLogic.ts` - deterministic RCA + AI quota guardrails + monitoring snapshot
- `src/components/VisualGuide.tsx` - guided walkthrough and hidden interaction hints
- `src/components/kpi/*` - KPI Intelligence UI (rings, sparklines, gauge, propagation)
- `src/components/SmartLogPanel.tsx` - forensic logs + AI Monitoring Timeline
- `src/components/forensics/*` - forensic cockpit and unified forensic view
- `src/services/SimulationService.ts` - telemetry simulation tick loop
- `src/services/IngestionPipeline.ts` / `src/services/TelemetryMapper.ts` - telemetry ingestion and status derivation

---

## Notes

- This repository is a demo/prototype for smart-industry IT/OT observability.
- SAP integration is currently not implemented (optional future extension).



