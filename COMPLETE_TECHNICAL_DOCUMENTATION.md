# NetMonit — Complete Technical Documentation

> **Industrial Network Health Monitoring Platform**
> Belden Hackathon — Track 1: Network Health Monitor for OT/IT Convergence
> Live URL: [https://netmonit-aa2cd.web.app](https://netmonit-aa2cd.web.app)
> Repository: [https://github.com/HVVSATHWIK/Network-Health-Monitor](https://github.com/HVVSATHWIK/Network-Health-Monitor)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Configuration Files](#4-configuration-files)
5. [Type System (`types/network.ts`)](#5-type-system)
6. [State Management (`store/useNetworkStore.ts`)](#6-state-management)
7. [Service Layer](#7-service-layer)
8. [AI Engine (`utils/aiLogic.ts`)](#8-ai-engine)
9. [Relationship Engine (`utils/relationshipEngine.ts`)](#9-relationship-engine)
10. [Mock Data](#10-mock-data)
11. [Application Shell (`App.tsx`)](#11-application-shell)
12. [Component Catalog](#12-component-catalog)
13. [Authentication System](#13-authentication-system)
14. [Deployment & Hosting](#14-deployment--hosting)
15. [Styling System](#15-styling-system)
16. [Performance Monitoring](#16-performance-monitoring)
17. [Data Flow Architecture](#17-data-flow-architecture)
18. [Environment Variables](#18-environment-variables)
19. [Available Scripts](#19-available-scripts)
20. [How To Run Locally](#20-how-to-run-locally)

---

## 1. Project Overview

NetMonit is a **real-time industrial network health monitoring platform** that provides:

- **3D Digital Twin** of the network topology (Three.js WebGL)
- **Full OSI L1–L7 telemetry monitoring** with per-device metrics
- **AI-powered root cause analysis** (3-tier: deterministic → offline knowledge → Google Gemini LLM)
- **Forensic investigation cockpit** with chain-of-thought analysis
- **KPI Intelligence dashboard** with live computation from device data
- **Alert management** with automatic generation, archiving to IndexedDB, and AI correlation
- **Simulated telemetry pipeline** (every 3 seconds, ~30% of devices updated per tick)
- **Authentication** via Firebase (Google SSO + email/password)
- **User profiles** stored in Firestore

### Problem It Solves

In converged IT/OT industrial environments (factories using Belden/Hirschmann infrastructure), when something goes wrong—a fiber link degrades, a PLC loses connectivity, a SCADA system sees latency spikes—operators struggle to determine:

1. **What layer** is the root cause? (Physical cable? Routing? Application?)
2. **What is affected?** (Which workflows, PLCs, SCADA loops?)
3. **What should I do?** (Fix the fiber? Restart the switch? Check the app?)

NetMonit answers all three by correlating telemetry across all 7 OSI layers, tracing fault propagation through the topology graph, and providing deterministic + AI-powered diagnosis.

---

## 2. Tech Stack & Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM rendering |
| `typescript` | 5.5.3 | Type-safe JavaScript |
| `vite` | 7.3.1 | Build tool & dev server |
| `three` | 0.181.2 | WebGL 3D rendering engine |
| `three-mesh-bvh` | 0.9.3 | BVH-accelerated raycasting for 3D click detection |
| `meshline` | 3.3.1 | Smooth 3D lines for network connections |
| `recharts` | 3.5.1 | Charting library (bar, line, area, radar, pie) |
| `zustand` | 5.0.11 | Lightweight state management |
| `firebase` | 12.6.0 | Authentication + Firestore database |
| `@google/generative-ai` | 0.24.1 | Google Gemini LLM integration |
| `react-markdown` | 10.1.0 | Markdown rendering in AI chat |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown support |
| `lucide-react` | 0.344.0 | Icon library (100+ icons used) |
| `tailwindcss-animate` | 1.0.7 | CSS animation utilities |
| `cmdk` | 1.1.1 | Command palette component |
| `@melloware/react-logviewer` | 6.3.4 | Log viewer component |
| `@supabase/supabase-js` | 2.57.4 | Supabase client (available but Firebase is primary) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@vitejs/plugin-react` | 4.3.1 | React Fast Refresh for Vite |
| `tailwindcss` | 3.4.1 | Utility-first CSS framework |
| `autoprefixer` | 10.4.18 | PostCSS autoprefixer |
| `postcss` | 8.4.35 | CSS processing |
| `eslint` | 9.17.0 | Code linting |
| `typescript-eslint` | 8.56.0 | TypeScript ESLint integration |
| `eslint-plugin-react-hooks` | 5.1.0 | React hooks lint rules |
| `eslint-plugin-react-refresh` | 0.4.11 | React Refresh lint rules |
| `vitest` | 4.0.18 | Unit testing framework |
| `@types/three` | 0.181.0 | Three.js type definitions |
| `@types/react` | 18.3.5 | React type definitions |
| `@types/react-dom` | 18.3.0 | React DOM type definitions |

---

## 3. Project Structure

```
Network-Health-Monitor/
├── index.html                    # Entry HTML with SEO, OpenGraph, JSON-LD
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite config with manual chunks & vitest
├── tsconfig.json                 # TypeScript project references
├── tsconfig.app.json             # App TypeScript config (ES2020, strict)
├── tsconfig.node.json            # Node TypeScript config
├── tailwind.config.js            # Custom theme (gunmetal palette, animations)
├── postcss.config.js             # PostCSS (tailwind + autoprefixer)
├── eslint.config.js              # ESLint flat config
├── firebase.json                 # Firebase Hosting config
├── firestore.rules               # Firestore security rules
├── public/
│   └── readme/                   # Static assets for README
├── src/
│   ├── main.tsx                  # Entry point: ErrorBoundary + PerfMonitor
│   ├── App.tsx                   # Main app shell (984 lines)
│   ├── firebase.ts               # Firebase initialization
│   ├── index.css                 # Global CSS (scrollbar, animations)
│   ├── vite-env.d.ts             # Vite + Three.js type augmentations
│   ├── types/
│   │   └── network.ts            # All TypeScript interfaces (215 lines)
│   ├── store/
│   │   ├── useNetworkStore.ts    # Zustand global store (370 lines)
│   │   └── usePerfStore.ts       # Performance metrics store
│   ├── services/
│   │   ├── AssetRegistry.ts      # CMDB with triple-index (ID/IP/MAC)
│   │   ├── IdentifierResolver.ts # Device identity resolution
│   │   ├── TelemetryMapper.ts    # Raw → unified metrics mapping (128 lines)
│   │   ├── IngestionPipeline.ts  # Shared telemetry processing pipeline
│   │   ├── SimulationService.ts  # Generates realistic telemetry every 3s
│   │   ├── PerfMonitorService.ts # Application performance tracking
│   │   └── AlertHistoryDB.ts     # IndexedDB alert archiving
│   ├── utils/
│   │   ├── aiLogic.ts            # Full AI engine (1601 lines)
│   │   └── relationshipEngine.ts # Graph-based causal chain analysis (185 lines)
│   ├── data/
│   │   ├── mockData.ts           # 10 devices, 9 connections, 20 KPIs, 2 paths
│   │   ├── kpiMockData.ts        # KPI mock data types + fallback data
│   │   └── smartLogs.ts          # Smart failure event mock data
│   ├── components/
│   │   ├── Advanced3DTopology.tsx # Three.js 3D network view (1016 lines)
│   │   ├── AICopilot.tsx         # AI chat interface (653 lines)
│   │   ├── AdvancedAnalytics.tsx  # Recharts dashboard (367 lines)
│   │   ├── AlertPanel.tsx        # Alert management panel (318 lines)
│   │   ├── AssetDetailPanel.tsx  # Device detail slide-in (360 lines)
│   │   ├── BootSequence.tsx      # Terminal-style boot animation
│   │   ├── BusinessROI.tsx       # Business value metrics
│   │   ├── DataFlowVisualization.tsx # 2D canvas OT data flow (338 lines)
│   │   ├── DataImporter.tsx      # JSON telemetry upload
│   │   ├── DeviceStatus.tsx      # Asset status list (131 lines)
│   │   ├── KPICard.tsx           # Individual KPI card
│   │   ├── KPIMatrix.tsx         # KPI matrix overlay
│   │   ├── LayerMenu.tsx         # OSI layer selection menu
│   │   ├── LayerOverview.tsx     # Per-layer device/KPI view
│   │   ├── Login.tsx             # Authentication UI
│   │   ├── NetworkHeatmap.tsx    # 7×5 health grid (201 lines)
│   │   ├── NetworkTopology.tsx   # Legacy 2D topology
│   │   ├── OnboardingTour.tsx    # Guided tour (legacy)
│   │   ├── RcaCockpit.tsx        # Root Cause Analysis cockpit
│   │   ├── SmartLogPanel.tsx     # Structured failure event viewer (402 lines)
│   │   ├── VisualGuide.tsx       # Step-by-step visual walkthrough
│   │   ├── LoadingSkeleton.tsx   # Loading placeholder
│   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   ├── AddDeviceModal.tsx    # Add device dialog
│   │   ├── dashboard/
│   │   │   ├── CorrelationTimelineCard.tsx   # Alert correlation timeline
│   │   │   ├── NetworkLoadCard.tsx           # Network load metrics
│   │   │   ├── OTHealthCard.tsx              # OT device health card
│   │   │   ├── PerformanceStatsPanel.tsx     # Performance metrics UI
│   │   │   ├── TimeRangeSelector.tsx         # Time range dropdown
│   │   │   └── timeRangePresets.ts           # Time range preset definitions
│   │   ├── forensics/
│   │   │   ├── ForensicCockpit.tsx           # Investigation workspace (317 lines)
│   │   │   ├── ForensicGraphCard.tsx         # Forensic visualization
│   │   │   ├── InvestigationStream.tsx       # Investigation event stream
│   │   │   ├── unified/
│   │   │   │   ├── AlertBubble.tsx           # Alert visualization
│   │   │   │   ├── CommandPalette.tsx        # Command palette
│   │   │   │   ├── ForensicCard.tsx          # Forensic result card
│   │   │   │   ├── ForensicTerminal.tsx      # Terminal-style output
│   │   │   │   └── UnifiedForensicView.tsx   # Combined forensic UI
│   │   │   └── visualizations/
│   │   │       ├── LatencyHistogram.tsx      # Latency distribution chart
│   │   │       └── OTDRTrace.tsx             # Optical Time-Domain Reflectometry viz
│   │   └── kpi/
│   │       ├── RealTimeKPIPage.tsx           # KPI Intelligence page (379 lines)
│   │       ├── GlobalSummaryBar.tsx          # Global health summary
│   │       ├── LayerSeverityChart.tsx        # Per-layer severity chart
│   │       ├── PropagationFlow.tsx           # Fault propagation visualization
│   │       ├── EscalationCard.tsx            # Escalation risk card
│   │       ├── RiskGauge.tsx                 # Risk gauge component
│   │       └── TrendAnalysisGraph.tsx        # Trend analysis chart
│   └── lib/
│       └── supabase.ts                       # Supabase client (secondary)
```

---

## 4. Configuration Files

### `vite.config.ts`
- **React plugin**: Fast Refresh for development
- **Manual chunks**: Code splitting into separate bundles:
  - `three` chunk: three.js + meshline + three-mesh-bvh
  - `charts` chunk: recharts
  - `firebase` chunk: firebase/app + firebase/auth + firebase/firestore
  - `ai` chunk: @google/generative-ai
  - `markdown` chunk: react-markdown + remark-gfm
- **Vitest config**: `globals: true`, `environment: 'node'`, empty API key for tests

### `tsconfig.app.json`
- **Target**: ES2020
- **Module**: ESNext with `bundler` module resolution
- **Strict mode**: Enabled (strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch)
- **JSX**: react-jsx (automatic runtime)
- **Includes**: `src/` directory

### `tailwind.config.js`
- **Custom color palette** (`gunmetal`):
  - 950: `#020617` (deepest dark)
  - 900: `#0f172a`
  - 800: `#1e293b`
  - 700: `#334155`
  - 600: `#475569`
  - 500: `#64748b`
  - 400: `#94a3b8`
  - 300: `#cbd5e1`
  - 200: `#e2e8f0`
  - 100: `#f1f5f9`
- **Alert colors**:
  - `alert-red`: `#ef4444`
  - `alert-yellow`: `#eab308`
  - `alert-green`: `#22c55e`
  - `alert-blue`: `#3b82f6`
- **Terminal bg**: `#0a0e17`
- **Custom fonts**:
  - Sans: `Inter` (primary UI)
  - Mono: `JetBrains Mono` (terminal, code)
- **Custom animations**:
  - `spin-slow`: 3s linear infinite spin
  - `float`: 3s ease-in-out infinite float
  - `glow-pulse`: 2s ease-in-out infinite glow pulse
- **Plugin**: `tailwindcss-animate`

### `firebase.json`
- **Hosting**: Public directory `dist`
- **Cache headers**:
  - `/assets/**`: `max-age=31536000, immutable` (JS/CSS bundles — fingerprinted)
  - `/images/**`: `max-age=604800` (1 week)
  - `**/*.html`: `no-cache`
- **SPA rewrite**: All routes → `index.html`

### `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
- Users can only read/write their own profile document
- Everything else is denied

### `eslint.config.js`
- TypeScript ESLint recommended config
- React Hooks plugin
- React Refresh plugin
- Ignores `dist/` directory

### `postcss.config.js`
- Plugins: `tailwindcss`, `autoprefixer`

### `index.html`
- Full SEO setup:
  - Title, description, canonical URL
  - OpenGraph meta tags (og:title, og:description, og:image, og:url)
  - Twitter Card meta tags
  - JSON-LD structured data (WebApplication schema)
- Google Fonts loaded: IBM Plex Mono 400/500/700, JetBrains Mono 400/500/700
- `<noscript>` fallback message
- Root `<div id="root">` with dark background
- Module script entry: `/src/main.tsx`

---

## 5. Type System

**File**: `src/types/network.ts` (215 lines)

### `Device`
The core data model for every network asset:

```typescript
interface Device {
  id: string;            // Unique identifier (e.g., "d1", "d10")
  name: string;          // Display name (e.g., "Hirschmann DRAGON MACH4x00")
  type: 'server' | 'switch' | 'firewall' | 'router' | 'plc' | 'sensor' | 'gateway' | 'scada';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  category: 'IT' | 'OT';
  position: [number, number, number];  // 3D coordinates for topology
  ip: string;
  mac?: string;
  location: string;
  manufacturer?: string;
  vlan?: number;
  subnetMask?: string;

  metrics: {
    l1: { temperature: number; opticalRxPower?: number; fanSpeed?: number; };
    l2: { crcErrors: number; linkUtilization: number; macFlapping?: boolean; };
    l3: { packetLoss: number; routingTableSize: number; firewallDrops?: number; };
    l4: { tcpRetransmissions: number; jitter: number; };
    l5: { sessionResets: number; sessionStability: number; };
    l6: { tlsHandshakeFailures: number; encryptionOverheadMs: number; };
    l7: { appLatency: number; protocolAnomaly?: boolean; };
  };
}
```

Every device carries **real metrics across all 7 OSI layers**. This is not just metadata — these values are updated by the simulation service every 3 seconds and used for alert generation, AI analysis, heatmap rendering, and KPI computation.

### `Alert`
```typescript
interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
  device: string;         // Device name
  message: string;
  timestamp: Date;
  aiCorrelation?: string; // AI-enriched explanation (filled asynchronously)
  title?: string;
  description?: string;
  source?: string;
  target_ip?: string;
  agentSteps?: string[];
  device_id?: string;
}
```

### `NetworkConnection`
```typescript
interface NetworkConnection {
  id: string;
  source: string;  // Device ID
  target: string;  // Device ID
  bandwidth: number;
  latency: number;
  status: 'healthy' | 'degraded' | 'down';
  vlan?: number;
}
```

### `DependencyPath`
```typescript
interface DependencyPath {
  appId: string;
  appName: string;
  criticality: 'low' | 'medium' | 'high' | 'mission-critical';
  path: string[];  // Array of Device IDs in this workflow
}
```

### `SmartFailureEvent`
A comprehensive failure model (used in Smart Log Panel):
- **What**: failureType, osiLayer
- **Where**: originDeviceId, originDeviceName, originPort
- **When**: startTime, endTime
- **TL;DR**: summary
- **Failure Chain**: rootCause → propagation[] → symptoms[]
- **Diagnosis**: rootCauseExplanation, ruledOutCauses
- **Confidence**: overall score + breakdown (temporal, layerConsistency, metricStrength, topology, noisePenalty)
- **Timeline**: micro-events with timestamps
- **Impact**: technical[], operational[], impactedDeviceIds[]
- **Action**: recommendedActions[]
- **Evidence**: alertCount, keyMetrics

### `CausalChain`
Output of the Relationship Engine:
```typescript
interface CausalChain {
  id: string;
  confidenceScore: number;        // 0–1
  confidenceReason: string;
  diagnosisType: 'RootCause' | 'Ambiguous' | 'Isolated';
  primaryFault: { device: string; layer: string; reason: string; };
  propagation: { upstreamDevice: string; downstreamDevice: string; depth: number; }[];
  impact: ImpactAnalysis;
  evidence: EvidencePack;
  possibleCauses?: string[];
  summary: string;
}
```

### `EvidencePack`
```typescript
interface EvidencePack {
  triggeringAlertId: string;
  rootLayer: string;
  affectedMetrics: string[];
  timestampWindow: { firstAnomaly: number; lastEscalation: number; };
  logSnippets?: string[];
}
```

### `ImpactAnalysis`
```typescript
interface ImpactAnalysis {
  technical: string[];
  operational: string[];
  impactedDeviceIds: string[];
  affectedWorkflows: string[];
}
```

---

## 6. State Management

**File**: `src/store/useNetworkStore.ts` (370 lines)

Uses **Zustand** for global state. This is the single source of truth for all runtime data.

### State Shape

```typescript
interface NetworkState {
  devices: Device[];
  alerts: Alert[];
  connections: NetworkConnection[];
  layerKPIs: LayerKPI[];
  dependencyPaths: DependencyPath[];
  faultedDeviceIds: Set<string>;  // Devices under injected fault (immune to simulation)

  // Actions
  setDevices, updateDevice, setAlerts, addAlert, removeAlertsForDevice,
  setConnections, addDevice, addConnection, resetSystem, injectFault
}
```

### Key Functions

#### `deriveAlertsFromState(devices, connections)`
Generates alerts from **actual device metrics and connection states**. No hardcoded alerts — every alert reflects real telemetry data:
- **Device alerts**: Generated when metrics exceed thresholds:
  - L1: Temperature > 60°C, Optical RX Power < -28 dBm
  - L2: CRC errors > 10 (warning) or > 50 (critical)
  - L3: Packet loss > 1.5% (warning) or > 5% (critical)
  - L4: Jitter > 30ms, TCP retransmissions > 1%
  - L7: App latency > 200ms (warning) or > 500ms (critical)
- **Connection alerts**: Generated for degraded/down links

#### `injectFault(type: 'l1' | 'l7')`
Two pre-built fault injection scenarios:

**L1 Fault** (Physical Layer):
- **Root**: Device `d10` (Hirschmann BOBCAT Switch) → temperature 78°C, optical RX -32 dBm, CRC 980, packet loss 18.5%, latency 1200ms
- **Downstream**: SCADA (d5) → warning, PLC Node A (d3) → critical, sensors (d6, d7) → warning, DRAGON switch (d1) → warning
- **Connections**: c2 → down, c7/c8/c9 → down, c3 → degraded
- **Handcrafted alerts**: 5 correlated alerts across L1, L2, L3, L4, L7 with AI correlation messages explaining propagation

**L7 Fault** (Application Layer):
- **Root**: SCADA (d5) → app latency 5200ms, session resets 12, TLS failures 6
- **Downstream**: PLC Node A (d3), PLC Node B (d4) → warning, latency ~900ms
- **Connection**: c7 → degraded (120ms latency)
- **Handcrafted alerts**: 3 correlated alerts (L7, L5, L4) with AI correlation explaining that lower layers are stable

#### `resetSystem()`
- Archives current alerts to IndexedDB
- Restores all devices, connections, and KPIs to initial mock data
- Clears faulted device IDs

### Deep Clone Helpers
`cloneDevices()` and `cloneConnections()` perform deep cloning of all nested metric objects to prevent mutation bugs in the simulation loop.

---

## 7. Service Layer

### 7.1 AssetRegistry (`services/AssetRegistry.ts`)

**Purpose**: Acts as the CMDB (Configuration Management Database) — the "source of truth" for device identity.

- **Singleton**: `AssetRegistry`
- **Triple-indexed** for O(1) lookups:
  - `devices: Map<string, Device>` (by ID)
  - `ipIndex: Map<string, string>` (IP → Device ID)
  - `macIndex: Map<string, string>` (MAC → Device ID)
- **Methods**: `getDeviceById()`, `getDeviceByIp()`, `getDeviceByMac()`, `getAllDevices()`, `registerAsset()`
- Initialized with 10 devices from `mockData.ts`

### 7.2 IdentifierResolver (`services/IdentifierResolver.ts`)

**Purpose**: Resolves incoming telemetry to registered devices using a priority chain.

**Resolution order**:
1. Device ID (explicit match)
2. MAC Address (reliable L2 identifier)
3. IP Address (L3 identifier, mutable but common)

This mirrors real-world telemetry ingestion where identifiers may come from SNMP, flow records, or agents, and not all fields are always present.

### 7.3 TelemetryMapper (`services/TelemetryMapper.ts`, 128 lines)

**Purpose**: Maps raw telemetry (flat field names) to the unified `Device.metrics` structure.

#### `RawTelemetry` Interface
Represents what a real ingest pipeline might output:
```typescript
interface RawTelemetry {
  deviceId: string;
  timestamp: number;
  sourceType: 'snmp' | 'flow' | 'agent' | 'api';
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
```

#### `mapTelemetryToDeviceMetrics()`
Maps each raw field to the correct layer in `Device.metrics`. Only updates fields that are present (preserves existing values for missing fields).

#### `deriveStatusFromMetrics()`
Threshold-based status derivation:
| Layer | Metric | Warning | Critical |
|-------|--------|---------|----------|
| L1 | Temperature | > 60°C | > 75°C |
| L1 | Optical RX Power | — | < -30 dBm |
| L2 | CRC Errors | > 10 | > 50 |
| L3 | Packet Loss | > 2% | > 5% |
| L7 | App Latency | > 500ms | > 1000ms |

### 7.4 IngestionPipeline (`services/IngestionPipeline.ts`)

**Purpose**: Shared pipeline for processing telemetry data (used by both SimulationService and DataImporter).

#### `processTelemetryBatch(batch: RawTelemetry[])`

For each telemetry record:
1. **Resolve identity** via `IdentifierResolver` (ID → MAC → IP)
2. **Skip faulted devices** (devices under injected fault are immune to simulation overwrite)
3. **Map telemetry** via `TelemetryMapper` to unified metrics
4. **Update store** with new metrics and derived status
5. **Generate alerts on status transitions**:
   - `healthy → warning` or `healthy → critical` or `warning → critical` → creates alert
   - Alert deduplication: 30-second window per device
   - `* → healthy` → auto-clears alerts for that device (and archives to IndexedDB)
6. **Detect fault layer**: Picks the most likely OSI layer based on which metrics exceed thresholds (L1 checked first, L7 last — following the "lowest layer first" principle)
7. **Performance tracking**: Records batch size and duration via PerfMonitorService

### 7.5 SimulationService (`services/SimulationService.ts`)

**Purpose**: Generates realistic telemetry at configurable intervals.

- **Default interval**: 3000ms (set in `App.tsx`)
- **Behavior**: Each tick, selects ~30% of devices randomly (`Math.random() > 0.7`) and generates bounded metric variations
- **Generated metrics per device**:
  - L1: `cpu_temp` = 40 + random(15) + (30 if critical)
  - L1: `optical_rx_dbm` = -10 - random(5)
  - L2: `if_utilization_pct` = random(60) + (30 if critical)
  - L2: `if_crc_errors` = 5% chance of random(10), else 0
  - L3: `l3_packet_loss_pct` = 2% chance of random(5), else 0
  - L4: `l4_jitter_ms` = 2 + random(10)
  - L7: `l7_response_time_ms` = 20 + random(100) + (1000 if critical)
- Uses `IngestionPipeline.processTelemetryBatch()` for processing
- Started in `App.tsx` `useEffect` and stopped on unmount

### 7.6 AlertHistoryDB (`services/AlertHistoryDB.ts`)

**Purpose**: Persists alert history to IndexedDB for cross-session alerting.

- **Database**: `netmonit-alert-history` (version 1)
- **Object Store**: `alerts` (keyPath: `archivedId`, index: `byTimestamp`)
- **Functions**:
  - `archiveAlerts(alerts)`: Adds alerts to IndexedDB with `archivedAt` timestamp
  - `getAlertHistory(limit = 200)`: Retrieves archived alerts, newest first
  - `clearAlertHistory()`: Clears entire archive
  - `getAlertHistoryCount()`: Returns count of archived alerts

### 7.7 PerfMonitorService (`services/PerfMonitorService.ts`, 103 lines)

**Purpose**: Application performance monitoring and reporting.

Uses a companion `usePerfStore` Zustand store. Tracked metrics:
- **Startup marks**: `root_ready`, `render_start`, `first_frame`, `auth_listener_attached`, `auth_state_resolved`, `app_mounted`, `boot_sequence_complete`
- **Startup measurements**: `render_to_first_frame_ms`, `auth_resolution_ms`, `root_to_app_ms`, `boot_sequence_ms`
- **Action durations**: `simulation_tick_ms`, `telemetry_batch_ms`, `file_import_ms`, `switch_view_*`, `select_device`, `inject_fault_*`, `reset_system`, `open_*`, etc.
- **Counters**: `toolActions`, `aiRequests`, `aiDeterministic`, `telemetryBatches`, `telemetryRecords`, `filesImported`
- **AI model latency**: Duration and success/failure tracking
- **Memory sampling**: Every 5 seconds, records `usedJSHeapSize`, `jsHeapSizeLimit`, percent used, warning threshold (80%)
- **Export**: `exportJsonReport()` returns full performance snapshot as JSON

---

## 8. AI Engine

**File**: `src/utils/aiLogic.ts` (1601 lines)

This is the largest and most complex file in the project. It implements a **3-tier AI architecture**:

### Tier 1: Deterministic Analysis
For diagnostic, status, and navigation queries — no API calls needed:
- **Intent Classification**: `classifyIntent()` categorizes queries into:
  - `DIAGNOSTIC_ANALYSIS`: root cause, fault investigation, troubleshooting
  - `STATUS_CHECK`: alert listing, device health, network overview
  - `WEBSITE_ASSIST`: UI navigation, feature discovery
  - `GENERAL_KNOWLEDGE`: protocol explanations, networking concepts
- **Relationship Engine**: `analyzeRelationships()` from `relationshipEngine.ts` provides deterministic causal chain
- **Forensic Report Builder**: `buildDeterministicForensicReport()` creates structured reports with chain-of-thought steps, artifacts, and recommendations
- **Status Report Builder**: `buildStatusText()` generates markdown status reports with severity breakdown
- **Device-Specific Response**: `buildDeviceSpecificResponse()` returns detailed metrics table for a named device
- **Website Assistant**: `buildWebsiteAssistText()` provides UI navigation guidance

### Tier 2: Offline Knowledge Base
25+ hardcoded expert responses for common networking topics:
- CRC errors, latency, jitter, packet loss
- OSI model, TCP, UDP, VLAN, DNS, SNMP
- Modbus, SCADA, PLC, PROFINET, EtherNet/IP, OPC UA
- STP/RSTP, QoS, firewall, NAT, ARP, BGP, OSPF
- IT/OT convergence, bandwidth/throughput, duplex
- Self-identity ("Who are you?", "What is NetMonit?")
- Capabilities list ("What can you do?")

### Tier 3: Google Gemini LLM
For open-ended questions that Tier 1 and Tier 2 can't answer:

**Models**:
- Primary: `gemini-2.5-flash-lite` (configurable via `VITE_AI_MODEL` env var)
- Fallback: `gemini-2.0-flash` (configurable via `VITE_AI_FALLBACK_MODEL` env var)

**Retry Logic**: `generateWithRetry()`:
- Up to 3 attempts per model
- Exponential backoff: 700ms base × 2^attempt + random jitter (0-200ms)
- Transient error detection: 503, 429, "high demand", "unavailable", "deadline exceeded", "timed out"
- Model fallback: If primary model fails with transient error, tries fallback model

**Prompt Engineering**: `buildPrompt()` creates a comprehensive prompt including:
1. System persona: "NetMonit AI, a helpful, knowledgeable, and conversational AI assistant"
2. Critical rules (never reveal reasoning, stay conversational, use markdown)
3. Response guidelines by intent type
4. **Causal Intelligence Summary**: Full `CausalChain` from the Relationship Engine (deterministic pre-analysis)
5. **Evidence Pack**: Triggering alert, root layer, confidence
6. **Raw Telemetry**: Active alerts + all device summaries (for status queries)
7. **Website navigation guide**: All available interactions
8. **User query**: The actual question

**Quota Management**:
- 15 requests per minute, 1000 per day
- Persisted to `localStorage` (key: `netmonit_ai_quota_v1`)
- `tryConsumeAIRequest()`: Checks and consumes quota atomically
- `getAIQuotaStatus()`: Returns current usage stats
- Quota shown to user when exceeded

### Main Entry Point: `analyzeWithMultiAgents()`

**Flow**:
1. Parse arguments (backward-compatible with legacy callers)
2. Classify intent via `classifyIntent()`
3. Handle greetings (contextual: mentions alert/device counts)
4. **DIAGNOSTIC_ANALYSIS** → Return structured `ForensicReport`:
   - Filter recent actionable alerts (10-minute window)
   - If no live degradation → `buildHealthyForensicReport()`
   - Otherwise → `buildDeterministicForensicReport()`
5. **STATUS_CHECK** → Return markdown string:
   - Try device-specific first → `buildDeviceSpecificResponse()`
   - Fallback to full status → `buildStatusText()`
6. **WEBSITE_ASSIST** → `buildWebsiteAssistText()`
7. **GENERAL_KNOWLEDGE**:
   - Try device-specific match first
   - Try offline knowledge base
   - If Gemini available → `callGeminiAPI()`
   - If no Gemini but live issues → run deterministic forensic report
   - Last resort → `buildSmartFallbackResponse()`

### ForensicReport Structure
```typescript
interface ForensicReport {
  criticality: 'low' | 'medium' | 'high' | 'extreme';
  rootCause: string;
  chainOfThought: ForensicStep[];  // Progressive investigation steps
  artifacts: ForensicArtifact[];    // Evidence (OTDR traces, logs)
  recommendations: string[];        // Actionable remediation steps
  summary: string;
}
```

### AI Monitoring
`buildAIMonitoringSnapshot()`: Creates a real-time snapshot of what the AI is monitoring:
- Device count, connection count, alert count, workflow count
- Layer coverage ratio (monitored layers / 7)
- Summary string displayed in the UI

### Performance Tracking
Every AI call records:
- Model latency (via `PerfMonitorService.recordModelLatency()`)
- Deterministic AI usage (via `PerfMonitorService.recordDeterministicAI()`)

---

## 9. Relationship Engine

**File**: `src/utils/relationshipEngine.ts` (185 lines)

**Purpose**: Deterministic graph-based causal chain analysis. This is the "brain" behind the fault propagation tracing.

### Algorithm: `analyzeRelationships()`

**Input**: alerts, devices, connections, dependencies
**Output**: `CausalChain`

1. **Build directed adjacency graph** from connections (source → target)
2. **Sort alerts** by composite key:
   - Priority 1: Timestamp (earliest first — if > 1 second difference)
   - Priority 2: OSI layer (L1 > L2 > ... > L7 — lower layer = more likely root)
3. **Select root cause candidate**: First alert after sorting
4. **BFS downstream traversal** from root device:
   - Follow directed edges in the graph
   - Only include neighbors that are also unhealthy
   - Track propagation depth
5. **Determine impacted workflows**: Check which `DependencyPath` entries include any impacted device
6. **Calculate confidence score**:
   - Base: 0.5
   - +0.2 if root is L1 or L2 (physical layer root)
   - +0.2 if propagation depth > 0 (explains downstream issues)
   - +0.1 if temporal ordering holds (root timestamp < last alert timestamp)
   - Capped at 0.99
7. **Build evidence pack**: Triggering alert ID, root layer, affected metrics, timestamp window
8. **Construct CausalChain**: Summary, propagation path, impact analysis

### Edge Cases

- **No alerts** → `createCleanStateChain()`: Confidence 1.0, "System Healthy"
- **Root device not found** → `createAmbiguousChain()`: Confidence 0.3, lists possible causes
- **Confidence reason generation**:
  - \> 0.8: "High confidence: Early {layer} anomaly precedes {n} downstream symptoms"
  - \> 0.6: "Medium confidence: {layer} fault detected but propagation pattern is partial"
  - ≤ 0.6: "Low confidence: Telemetry is noisy or lacks clear causal timing"

---

## 10. Mock Data

### `data/mockData.ts`

**10 Devices** (Real Belden/Hirschmann product names):

| ID | Name | Type | Category | IP | VLAN | Location |
|----|------|------|----------|-----|------|----------|
| d1 | Hirschmann DRAGON MACH4x00 | switch | OT | 10.0.1.1 | 10 | Plant Floor - Zone A |
| d2 | Hirschmann EAGLE40 Firewall | firewall | IT | 10.0.2.1 | 20 | DMZ Zone |
| d3 | Lion-M PLC Node A | plc | OT | 10.0.1.10 | 10 | Cell A |
| d4 | Lion-M PLC Node B | plc | OT | 10.0.1.11 | 10 | Cell B |
| d5 | SCADA Control Loop | scada | OT | 10.0.2.10 | 20 | Control Room |
| d6 | Temp Sensor 01 | sensor | OT | 10.0.1.20 | 10 | Cell A - Line 1 |
| d7 | Pressure Sensor 02 | sensor | OT | 10.0.1.21 | 10 | Cell B - Line 2 |
| d8 | OpEdge-8D Gateway | gateway | OT | 10.0.3.1 | 30 | Edge Zone |
| d9 | Global ERP Core | server | IT | 10.0.4.1 | 100 | Data Center |
| d10 | Hirschmann BOBCAT Switch | switch | OT | 10.0.1.50 | 10 | Plant Floor - Zone B |

**9 Network Connections**:

| ID | Source | Target | Bandwidth | Latency | Status |
|----|--------|--------|-----------|---------|--------|
| c1 | d1 (DRAGON) | d2 (EAGLE) | 10000 Mbps | 1ms | healthy |
| c2 | d10 (BOBCAT) | d1 (DRAGON) | 1000 Mbps | 2ms | healthy |
| c3 | d1 (DRAGON) | d3 (PLC A) | 1000 Mbps | 3ms | healthy |
| c4 | d1 (DRAGON) | d4 (PLC B) | 1000 Mbps | 3ms | healthy |
| c5 | d2 (EAGLE) | d9 (ERP) | 10000 Mbps | 5ms | healthy |
| c6 | d2 (EAGLE) | d5 (SCADA) | 5000 Mbps | 2ms | healthy |
| c7 | d3 (PLC A) | d6 (Sensor) | 100 Mbps | 1ms | healthy |
| c8 | d4 (PLC B) | d7 (Sensor) | 100 Mbps | 1ms | healthy |
| c9 | d10 (BOBCAT) | d8 (Gateway) | 1000 Mbps | 2ms | healthy |

**20 Layer KPIs** across L1–L7

**2 Dependency Paths** (critical workflows):
1. **Profinet realtime** (mission-critical): BOBCAT → DRAGON → EAGLE → ERP
2. **SCADA Control Loop** (high): PLC A → DRAGON → SCADA

### `data/kpiMockData.ts`
Types and fallback data for KPI Intelligence:
- `KPIData`, `LayerSeverity`, `PropagationNode`, `EscalationRisk`, `TrendPoint`
- Escalation risk includes SHAP-like prediction factors (signal values per metric)

### `data/smartLogs.ts`
Pre-built `SmartFailureEvent` entries for the Smart Log Panel demonstration.

---

## 11. Application Shell

**File**: `src/App.tsx` (984 lines)

### Entry Flow

```
main.tsx
  └── ErrorBoundary
       └── App.tsx
            ├── Not logged in → Login.tsx
            ├── Booting → BootSequence.tsx
            └── Main Dashboard
                 ├── Header (sticky)
                 ├── Tab Navigation
                 ├── Active View Content
                 ├── Footer
                 ├── AICopilot (portal)
                 └── ForensicCockpit (overlay)
```

### Main State

| State | Type | Purpose |
|-------|------|---------|
| `activeView` | `'3d' \| 'analytics' \| 'layer' \| 'logs' \| 'kpi' \| 'rca'` | Current dashboard view |
| `selectedLayer` | `string \| null` | Selected OSI layer for layer view |
| `activeRcaData` | `{ rootNodeId, affectedNodeIds } \| null` | RCA visualization overlay for 3D view |
| `isMenuOpen` | `boolean` | Layer menu open state |
| `isBooting` | `boolean` | Boot sequence active |
| `showUserMenu` | `boolean` | User dropdown open |
| `showMatrix` | `boolean` | KPI Matrix overlay |
| `isLoggedIn` | `boolean` | Authentication state |
| `userName` | `string` | Current user display name |
| `visualMode` | `'default' \| 'scan'` | Diagnostic scan animation mode |
| `isChaosOpen` | `boolean` | Chaos/fault injection panel |
| `isForensicOpen` | `boolean` | Forensic Cockpit open |
| `isNetMonitAIOpen` | `boolean` | NetMonit AI chat open |
| `aiLaunchMode` | `AILaunchMode` | AI mode: assistant, root-cause, diagnostic |
| `aiSessionKey` | `number` | Incremented to force chat reset |
| `timeRange` | `TimeRange` | Selected time range filter |
| `selectedDeviceId` | `string \| null` | Selected device for detail panel |
| `aiMonitoringTimeline` | `AIMonitoringEvent[]` | AI enrichment event log (last 50) |

### Header
- Sticky positioning with `bg-slate-950/82 backdrop-blur-xl`
- Contains: Layer menu trigger, logo, title, action buttons, health badge, user menu
- **Action buttons**:
  - Data Import (DataImporter component)
  - Run Diagnostic Scan → opens AICopilot in diagnostic mode
  - Forensic Cockpit → opens ForensicCockpit overlay
  - Root Cause Analysis → switches to RCA view
  - NetMonit AI → opens AICopilot in assistant mode
  - Health badge (percentage)
  - Visual Guide (book icon)
  - User menu with sign out

### Tab Navigation (Segmented Control)
```
3D Topology | Incidents (RCA) | Analytics | KPI Intelligence | System Logs
```
- Active tab: `bg-slate-100 text-slate-950` (white on dark)
- RCA tab: Purple theme with alert badge (ping animation when alerts present)
- Inactive: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/80`

### Sub-header Badges
- **AI Coverage**: `{layers}/7 layers · {devices} assets`
- **Assets**: `{healthy}/{total}`

### View Routing

**3D Topology** (`activeView === '3d'`):
- `Advanced3DTopology` (full width)
- 3 analysis cards: OTHealthCard, NetworkLoadCard, CorrelationTimelineCard
- DeviceStatus (4 cols) + AlertPanel (8 cols)
- DataFlowVisualization (6 cols) + NetworkHeatmap (6 cols)

**Incidents (RCA)** (`activeView === 'rca'`):
- `RcaCockpit` with filtered alerts, devices, connections, and visualize callback

**Analytics** (`activeView === 'analytics'`):
- TimeRangeSelector + KPI Matrix button
- BusinessROI component
- AdvancedAnalytics with time range props

**KPI Intelligence** (`activeView === 'kpi'`):
- TimeRangeSelector + KPI Matrix button
- RealTimeKPIPage (full height)

**System Logs** (`activeView === 'logs'`):
- SmartLogPanel (8 cols) + PerformanceStatsPanel (4 cols)

### AI Alert Enrichment
Background effect that automatically enriches each alert with AI correlation:
1. Finds first alert without `aiCorrelation`
2. Calls `analyzeWithMultiAgents()` with alert context
3. Updates the alert with the AI summary
4. Records to `aiMonitoringTimeline` (for System Logs view)
5. Handles quota limits and errors gracefully
6. One-at-a-time processing (via `aiEnrichmentInFlight` ref)

### Time Range Filtering
Alerts are filtered by selected time range before being passed to all views:
- Supports: 10m, 30m, 1h, 3h, 6h, 12h, 24h, 2d, 3d, 1w, 1mo
- Custom range with start/end dates
- Default: 1h

### Code Splitting
All heavy views are lazy-loaded via `React.lazy()`:
```
Advanced3DTopology, AdvancedAnalytics, NetworkHeatmap,
DataFlowVisualization, ForensicCockpit, AICopilot,
SmartLogPanel, RealTimeKPIPage, BusinessROI, RcaCockpit
```
Each wrapped in `<Suspense fallback={<LoadingSkeleton />}>`.

---

## 12. Component Catalog

### 12.1 Advanced3DTopology (1016 lines)
- **Three.js WebGL** scene with camera, lighting, and orbit controls
- **Device nodes**: 3D meshes positioned according to `device.position`
- **Connection edges**: Lines between connected devices with animated packet flow
- **BVH-accelerated raycasting**: Uses `three-mesh-bvh` for efficient click detection
- **Features**:
  - Click device → camera animates to it + opens detail panel
  - Fault injection controls (L1/L7) via gear icon
  - Reset button restores healthy state
  - Add device button → opens AddDeviceModal
  - RCA overlay: Highlights root node (red) and affected nodes (orange) when `activeRcaData` is set
  - Responsive canvas sizing

### 12.2 AICopilot (653 lines)
- **Floating chat panel** rendered via React Portal
- **Collapsed state**: Floating button with ping animation at bottom-right
- **Expanded state**: Fixed panel (400px width) with header, chat area, suggestions, input
- **Three launch modes**: `assistant`, `root-cause`, `diagnostic`
  - Each mode has different greeting, placeholder, examples, and quick action buttons
- **Quick actions** (3 per mode):
  - Assistant: Root Cause Check, Impact Analysis, Security Scan
  - Root Cause: Primary Cause, Impact Radius, Fix Plan
  - Diagnostic: Full Scan, Threshold Risk, Stability Check
- **Chat rendering**: ReactMarkdown with remarkGfm and custom component styling
- **System context injection**: Every user query is enriched with:
  - Active view, selected layer/device, time range
  - Health percentage, AI coverage summary
  - Full observability snapshot (alerts, devices, connections, KPIs, workflows)
- **Greeting handling**: Context-aware greetings mentioning alert/device counts
- **Capabilities request**: Mode-specific capability listings
- **ForensicReport formatting**: Converts structured reports to readable markdown
- **Processing indicator**: Bouncing dots animation during AI processing

### 12.3 ForensicCockpit (317 lines)
- **Full-screen overlay** for deep investigation
- **Chain-of-thought streaming**: Progressive step reveal (350ms intervals) showing each investigation step
- **Components**: OTDR trace visualization, latency histogram
- **Auto-trigger**: When `systemMessage` changes, initiates analysis automatically
- **Uses**: `analyzeWithMultiAgents()` with diagnostic intent

### 12.4 AdvancedAnalytics (367 lines)
- **Recharts dashboards** with multiple chart types:
  - Alert distribution (bar chart by severity)
  - Device status breakdown (pie/donut chart)
  - Layer KPI trends (line chart over time)
  - Network utilization (area chart)
- **Time range aware**: Filters data by selected time window

### 12.5 AlertPanel (318 lines)
- **Alert list** with severity badges, layer tags, device names
- **AI Root Cause button** per alert card → triggers AI analysis
- **Alert history**: Shows archived alerts from IndexedDB
- **Clear/archive actions**: Remove alerts with archiving
- **RCA visualization**: "Visualize" button highlights affected devices in 3D view

### 12.6 AssetDetailPanel (360 lines)
- **Slide-in panel** from right side
- **Device info**: Name, type, status, IP, MAC, VLAN, location, manufacturer
- **L1–L7 metrics table**: All metrics with color-coded values
- **Connected devices**: Upstream and downstream links with status
- **Alert summary**: Device-specific alerts
- **Fault injection**: Quick action to inject L1/L7 fault for testing
- **Close**: Click backdrop behind panel

### 12.7 DeviceStatus (131 lines)
- **Asset status list** showing all devices
- **Color-coded status**: Green (healthy), Yellow (warning), Red (critical), Gray (offline)
- **Click row** → opens AssetDetailPanel
- **Fault injection** per device via context menu

### 12.8 NetworkHeatmap (201 lines)
- **7×5 color-coded grid**: 7 rows (L1–L7) × 5 columns (Utilization, Latency, Errors, Packets, Jitter)
- **Colors**: Green, yellow, red based on actual device metric aggregation
- **Cross-layer influence coefficients**: Derived from real device metrics
- **Real-time updates**: Recalculates every render cycle

### 12.9 DataFlowVisualization (338 lines)
- **2D HTML5 Canvas** showing OT data flow
- **Scan mode**: When `visualMode === 'scan'`, shows animated scanning visualization
- **Device highlighting**: Selected device is emphasized
- **Flow animation**: Animated particles along data paths

### 12.10 SmartLogPanel (402 lines)
- **Structured failure event viewer** displaying `SmartFailureEvent` entries
- **Rich detail**: Failure chain visualization, confidence breakdown, timeline, impact, evidence
- **AI monitoring timeline**: Shows AI enrichment events with status (success/error/quota_limited)
- **Expandable cards**: Click to see full failure analysis

### 12.11 RealTimeKPIPage (379 lines)
- **5 sub-components** orchestrated together:
  1. `GlobalSummaryBar`: Overall health metrics
  2. `LayerSeverityChart`: Per-layer severity scores
  3. `PropagationFlow`: Fault propagation visualization
  4. `EscalationCard`: Escalation risk with prediction factors
  5. `TrendAnalysisGraph`: Historical trend analysis
- **Live computation** via `useMemo`:
  - Layer severity scores from device metrics
  - Propagation chains from connections + alerts
  - Escalation risk from alert trends
  - Trend data from historical snapshots
- **Fallback**: Uses mock data when no live data available

### 12.12 Login (Authentication UI)
- **Google Sign-In** button
- **Email/Password** form (sign in + sign up toggle)
- **Firebase Auth**: Uses `signInWithPopup` (Google) and `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`
- **Error handling**: User-friendly error messages for auth failures

### 12.13 BootSequence
- **Terminal-style boot animation** after login
- **Customizable name**: User enters a "terminal name" during boot
- **Name saved to Firestore** user profile
- **Visual flair**: Green-on-black terminal aesthetic with typing animation

### 12.14 VisualGuide
- **Step-by-step interactive guide** accessible via book icon in header
- Covers: diagnostic scan, device clicks, heatmap reading, forensic cockpit, AI chat

### 12.15 KPIMatrix
- **Modal overlay** showing full KPI matrix
- **All 20 layer KPIs** in an organized grid
- **Status indicators**: Healthy/warning/critical per KPI

### 12.16 LayerMenu / LayerOverview
- **Layer selection sidebar**: Click any OSI layer (L1–L7)
- **LayerOverview**: Shows devices and KPIs filtered by selected layer

### 12.17 DataImporter
- **JSON file upload** for telemetry data
- **Format**: Expects array of `RawTelemetry` objects
- **Processing**: Feeds uploaded data through `IngestionPipeline.processTelemetryBatch()`
- **Performance tracking**: Records import size and duration

### 12.18 BusinessROI
- **Business value dashboard** showing estimated ROI metrics
- **Health-based calculations**: Derives business impact from health percentage

### 12.19 RcaCockpit
- **Root Cause Analysis dedicated view**
- **Alert-centric**: Lists filtered alerts with AI analysis
- **Visualize button**: Highlights root and affected devices in 3D topology
- **Uses**: Relationship engine output for causal chain display

### 12.20 Dashboard Cards
- **OTHealthCard**: Shows health metrics for a specific OT device (default: PLC Node A)
- **NetworkLoadCard**: Network utilization metrics from connections and devices
- **CorrelationTimelineCard**: Alert correlation timeline showing alert clustering patterns
- **PerformanceStatsPanel**: Shows PerfMonitorService metrics (actions, latency, memory)

### 12.21 Forensic Sub-components
- **ForensicGraphCard**: Visualization card for forensic data
- **InvestigationStream**: Real-time investigation event stream
- **unified/ForensicTerminal**: Terminal-style output for forensic results
- **unified/CommandPalette**: cmdk-powered command palette
- **unified/AlertBubble**: Alert visualization bubbles
- **unified/ForensicCard**: Forensic result cards
- **unified/UnifiedForensicView**: Combined forensic interface
- **visualizations/LatencyHistogram**: Latency distribution histogram
- **visualizations/OTDRTrace**: Optical Time-Domain Reflectometry trace visualization

### 12.22 Utility Components
- **ErrorBoundary**: React error boundary wrapping the entire app
- **LoadingSkeleton**: Shimmer loading placeholder for lazy-loaded views
- **AddDeviceModal**: Form for adding new devices to the topology

---

## 13. Authentication System

**Files**: `src/firebase.ts`, `src/components/Login.tsx`, `src/App.tsx`

### Firebase Configuration
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

### Auth Flow
1. App loads → `onAuthStateChanged` listener attached
2. If no user → show `Login` component
3. User authenticates (Google SSO or email/password)
4. `onAuthStateChanged` fires → `setIsLoggedIn(true)`
5. Try to fetch user profile from Firestore (`users/{uid}`)
6. Show `BootSequence` (terminal-style animation)
7. User enters terminal name → saved to Firestore
8. Boot completes → main dashboard renders

### Firestore User Profile
```
/users/{uid}
  └── name: string  (terminal display name)
```

### Sign Out
- Triggered from user dropdown menu
- Calls `signOut(auth)` from Firebase
- Resets `isLoggedIn` and `isBooting` state

---

## 14. Deployment & Hosting

### Firebase Hosting
- **Project ID**: `netmonit-aa2cd`
- **Live URL**: [https://netmonit-aa2cd.web.app](https://netmonit-aa2cd.web.app)
- **Deploy command**: `npm run deploy:hosting`
  - Runs `vite build` then `firebase deploy --only hosting`

### Build Output
- Vite builds to `dist/` directory
- Code split into chunks: three, charts, firebase, ai, markdown, main
- Assets get content-hash filenames for cache busting

### Cache Strategy
| Path | Cache Policy |
|------|-------------|
| `/assets/**` | `max-age=31536000, immutable` |
| `/images/**` | `max-age=604800` (1 week) |
| `**/*.html` | `no-cache` |

### SPA Routing
All routes rewrite to `index.html` via Firebase rewrite rules.

---

## 15. Styling System

### Tailwind CSS
- Utility-first approach with custom configuration
- Dark theme throughout (`bg-slate-950`, `text-slate-200`)
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

### Custom Theme
- **Gunmetal palette**: 10-shade custom color scale for backgrounds and surfaces
- **Alert colors**: Semantic red, yellow, green, blue for status indicators
- **Fonts**: Inter (UI), JetBrains Mono (code/terminal), IBM Plex Mono (loaded via Google Fonts)
- **Custom animations**: float, glow-pulse, spin-slow

### Global CSS (`index.css`, 108 lines)
- **Custom scrollbars**: Gradient thumb (blue → indigo → purple), dark track, glow shadow
  - Consistent across all scrollable areas
  - Hover and active states with enhanced glow
- **Custom keyframe animations**: wiggle, pinchLeft, pinchRight, panLeft, panRight (for UI interactions)

### Design Patterns
- **Glass morphism**: `bg-slate-950/82 backdrop-blur-xl` for header
- **Card surfaces**: `bg-slate-900/70 border border-slate-700 rounded-lg`
- **Primary buttons**: `bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg`
- **Secondary buttons**: `bg-slate-900/70 hover:bg-slate-800 border border-slate-700`
- **Status indicators**: Green dot (healthy), yellow (warning), red (critical) with pulse animation
- **Segmented tabs**: Active = `bg-slate-100 text-slate-950`, inactive = `text-slate-400`

---

## 16. Performance Monitoring

### Architecture
Two-part system:
1. **PerfMonitorService** (singleton class): Records events, manages timers
2. **usePerfStore** (Zustand store): Stores all performance data, provides snapshot export

### What's Tracked

| Category | Metrics | How |
|----------|---------|-----|
| **Startup** | root_ready, render_start, first_frame, auth resolution, app mount, boot complete | `markStartup()` + `measureStartup()` |
| **View Switches** | Time to switch to each view | `startTimer()` + `endAction()` |
| **User Actions** | Device selection, layer selection, fault injection, reset | `startTimer()` + `endAction()` |
| **AI** | Model latency, deterministic vs LLM usage, success/failure | `recordModelLatency()`, `recordDeterministicAI()` |
| **Telemetry** | Batch count, record count, processing time | `recordTelemetryBatch()` |
| **File Import** | Record count, processing time | `recordFileImport()` |
| **Memory** | usedJSHeapSize, jsHeapSizeLimit, percent, warning flag | `sampleMemoryNow()` every 5 seconds |

### Viewing Performance Data
- **System Logs view** → PerformanceStatsPanel shows real-time performance metrics
- **Export**: `PerfMonitorService.exportJsonReport()` returns full JSON snapshot

---

## 17. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
│  SimulationService (3s tick)  │  DataImporter (JSON)    │
│  ~30% devices/tick            │  User-uploaded files     │
└──────────────┬────────────────┴──────────┬──────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                  INGESTION PIPELINE                      │
│  1. IdentifierResolver (ID → MAC → IP)                  │
│  2. TelemetryMapper (raw → unified L1-L7 metrics)       │
│  3. Status derivation (threshold-based)                  │
│  4. Store update (device metrics + status)               │
│  5. Alert generation (transition-based, 30s dedup)       │
│  6. PerfMonitor tracking                                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              ZUSTAND GLOBAL STORE                        │
│  devices[] │ alerts[] │ connections[] │ layerKPIs[]      │
│  dependencyPaths[] │ faultedDeviceIds (Set)              │
└──────┬───────┬──────┬────────┬───────┬──────────────────┘
       │       │      │        │       │
       ▼       ▼      ▼        ▼       ▼
┌──────────┐ ┌─────┐ ┌──────┐ ┌─────┐ ┌──────────────────┐
│ 3D Topo  │ │Alert│ │Heatma│ │ KPI │ │ AI Engine        │
│ (WebGL)  │ │Panel│ │p Grid│ │ Page│ │ (aiLogic.ts)     │
│          │ │     │ │      │ │     │ │                  │
│ Devices  │ │Filte│ │7×5   │ │Live │ │ Relationship     │
│ Connecti │ │red  │ │Color │ │Comp │ │ Engine + Gemini  │
│ Packets  │ │Time │ │Coded │ │uted │ │ + Offline KB     │
│ RCA Viz  │ │Range│ │      │ │     │ │                  │
└──────────┘ └─────┘ └──────┘ └─────┘ └──────────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ AICopilot    │
                                       │ ForensicCock │
                                       │ AlertEnrich  │
                                       │ RCA Cockpit  │
                                       └──────────────┘
```

### Alert Lifecycle

```
Device metrics change
  │
  ├─ Threshold exceeded? ────── No ──> No alert
  │
  └─ Yes ──> Status transition?
              │
              ├─ Same or lower severity ──> No alert (skip)
              │
              └─ Higher severity ──> Recent alert exists (30s window)?
                                     │
                                     ├─ Yes ──> Skip (dedup)
                                     │
                                     └─ No ──> CREATE ALERT
                                                │
                                                ├─ Pushed to store
                                                ├─ Visible in AlertPanel
                                                ├─ AI enrichment queued
                                                └─ Displayed in alerts badge

If device recovers to healthy:
  └─ removeAlertsForDevice()
       ├─ Archives to IndexedDB
       └─ Removes from active alerts
```

---

## 18. Environment Variables

Required in `.env` file at project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# AI Configuration (optional — works without Gemini via deterministic fallback)
VITE_AI_API_KEY=your_gemini_api_key
VITE_AI_MODEL=gemini-2.5-flash-lite           # Primary model
VITE_AI_FALLBACK_MODEL=gemini-2.0-flash        # Fallback model
```

**Note**: The app functions fully without Gemini API keys. All analysis falls back to deterministic mode (Relationship Engine + offline knowledge base). Gemini only adds open-ended conversational ability.

---

## 19. Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server |
| `dev:lan` | `vite --host 0.0.0.0` | Dev server accessible on LAN |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `deploy:hosting` | `npm run build && npx firebase-tools deploy --only hosting` | Build and deploy to Firebase |
| `lint` | `eslint .` | Run ESLint across all files |
| `typecheck` | `tsc --noEmit -p tsconfig.app.json` | TypeScript type checking |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Run tests in watch mode |

---

## 20. How To Run Locally

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/HVVSATHWIK/Network-Health-Monitor.git
cd Network-Health-Monitor

# 2. Install dependencies
npm install

# 3. Create .env file with Firebase config (required for auth)
# Copy the environment variables from Section 18 above

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

### Without Firebase Auth (for testing)
The app requires Firebase auth to load. You need:
1. A Firebase project with Authentication enabled
2. Google Sign-In and/or Email/Password providers configured
3. Firestore database created (even if empty)
4. `.env` file with valid Firebase configuration

### Without Gemini (works fine)
If `VITE_AI_API_KEY` is not set or set to empty:
- All diagnostic analysis uses the deterministic Relationship Engine
- Status checks use local data processing
- Navigation help uses hardcoded guidance
- General knowledge uses the 25+ topic offline knowledge base
- The only missing capability is open-ended conversational AI
- No errors or degraded UX — the fallback is designed to be comprehensive

---

## Appendix: Key Design Decisions

1. **Deterministic-first AI**: The Relationship Engine always runs first. Gemini receives the deterministic analysis as context, ensuring the LLM's output is grounded in real telemetry data.

2. **Zustand over Redux**: Chosen for simplicity. The entire store is ~370 lines with no boilerplate. Selectors are used for granular re-rendering.

3. **Three.js over D3/2D**: 3D topology provides depth perception for large networks and makes the demo visually striking for a hackathon.

4. **IndexedDB for alert history**: Persists across sessions without requiring a backend. The `AlertHistoryDB` service handles all browser storage.

5. **Manual chunks in Vite**: Explicit code splitting keeps the initial bundle small. Three.js (~1MB) only loads when the 3D view is active.

6. **Simulation service**: Generates realistic bounded variations rather than random data. Critical devices get larger metric swings, creating organic-looking alert patterns.

7. **30-second alert dedup**: Prevents alert storms during simulation. Each device can only generate one new alert per 30 seconds.

8. **Faulted device immunity**: When a fault is injected, those devices are marked in `faultedDeviceIds` and the simulation service skips them. This prevents the simulation from immediately overwriting the injected fault values.

9. **AI enrichment queue**: Alerts are enriched one at a time (via `aiEnrichmentInFlight` ref) to avoid quota exhaustion and rate limiting.

10. **Portal-based chat**: The AICopilot renders via `createPortal(content, document.body)` to escape layout constraints and appear as a floating overlay.
