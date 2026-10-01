# RAG Developer & Operations Workbench — Design Specification

- **Date**: 2026-10-01
- **Status**: Approved
- **Repository**: [`R2R-Application`](file:///mnt/F024B17C24B145FE/Repos/R2R-Application)
- **Target Persona**: RAG Developers, AI Platform Engineers, & Operations Specialists

---

## 1. Executive Summary & Goals

The goal of this initiative is to modernize the R2R Dashboard from a fragmented collection of disjointed administrative pages into a unified, high-density **RAG Developer & Operations Workbench**.

### Key Objectives
1. **Consolidate Fragmented Information Architecture**: Eliminate competing pages (`/manage`, `/documents`, `/collections`, `/documents-detail`, `/explorer`, `/search`, `/chat`) and replace them with a unified 3-module system.
2. **Elevate Retrieval Experimentation**: Implement a **Side-by-Side A/B Retrieval Arena** to test queries simultaneously against two retrieval configurations with instant visual diffs of ranked chunks, latency waterfalls, and score distributions.
3. **Deepen Ingestion & Chunk Observability**: Implement a **3-Pane Knowledge Studio** offering an IDE-like explorer for documents, visual ingestion pipeline tracking, and live chunk/vector inspection.
4. **Deliver a State-of-the-Art Developer Experience**: Modernize styling to a sleek, dark Obsidian-Slate aesthetic with an Activity Bar rail, global command palette (`⌘K`), persistent bottom status bar, and virtualized 60 FPS scrolling.

---

## 2. Usability Audit & Heuristic Findings

| Heuristic Issue | Previous Implementation | Redesigned Solution |
| :--- | :--- | :--- |
| **Fragmented Navigation** | 4 separate pages for managing docs/collections with overlapping code. | Unified **Knowledge Studio** (`/knowledge`) with 3-pane resizable layout. |
| **Database Jargon Leak** | Low-level mathematical tuning knobs (`rrfK`, `efSearch`, `probes`) exposed without guidance. | Curated **Retrieval Presets** with an expandable "Tune" panel for deep configuration. |
| **Bifurcated AI Interaction** | `/chat` and `/search` maintained separate UIs for overlapping RAG data. | Unified **Retrieval Arena** (`/arena`) unifying vector inspection with agent traces. |
| **Orphaned Global Links** | `/documents-detail` linked globally without document context. | Context-aware slide-in or 3rd-pane chunk inspector linked directly to documents. |
| **Layout Inconsistencies** | Mixed top-nav, collapsible sidebars, and slide-over drawers across routes. | Persistent **Activity Rail + Status Bar** framework across all routes. |

---

## 3. Global Shell & Navigation Architecture

### 3.1 Shell Layout
The workbench uses an ultra-compact icon rail (width: 56px) paired with a contextual collapsible side panel and a persistent bottom diagnostics status bar (height: 28px).

```
┌──────┬───────────────────────┬────────────────────────────────────────────────────────┐
│ RAIL │ CONTEXT PANEL         │ MAIN WORKBENCH VIEWPORT                                │
├──────┼───────────────────────┼────────────────────────────────────────────────────────┤
│ 🧪   │ • Presets Library     │ [ Active Viewport: Arena / Knowledge / Ops ]           │
│ 📚   │ • Saved Queries       │                                                        │
│ 📊   │ • Ingestion Filters   │                                                        │
│ ⚙️   │ • Cluster Endpoints   │                                                        │
├──────┴───────────────────────┴────────────────────────────────────────────────────────┤
│ STATUS: Engine: Online (v3.7.0) │ Latency: 142ms │ Active Model: gpt-4o │ Hotkey: ⌘K  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Primary Workspaces

1. **`/arena` — Retrieval Arena & Agent Studio**:
   - Query input with hotkey execution (`⌘+Enter` / `Ctrl+Enter`).
   - Side-by-side A/B comparison panes.
   - Live ranked chunk cards with intersection badging (`[Also in B at #X]` / `[Unique to A]`).
   - Collapsible SSE Agent Reasoning trace drawer (`thinking`, `tool_call`, `tool_result`, `citation`).

2. **`/knowledge` — 3-Pane Knowledge Studio**:
   - **Pane 1 (25%)**: Collections & Documents tree, status badges, drag-and-drop ingestion.
   - **Pane 2 (45%)**: Ingestion pipeline stage tracker (`Upload` ➔ `Parse` ➔ `Chunk` ➔ `Embed` ➔ `Enrich`) and virtualized chunk grid.
   - **Pane 3 (30%)**: Chunk DevTools (raw formatted text, token counts, vector dimensionality, embedding stats, extracted entity subgraphs, and metadata JSON editor).

3. **`/ops` — Telemetry & Ingestion Queue**:
   - Real-time latency percentiles (p50, p95, p99) by pipeline phase.
   - Dead-letter ingestion queue with failure stack traces and batch retries.
   - Token accounting and active R2R engine configuration overview.

4. **Global Command Palette (`⌘K`)**:
   - Fast fuzzy navigation across documents, collections, saved queries, and system actions.

---

## 4. Module Specifications

### 4.1 Module 1: Retrieval Arena (A/B Testing Studio)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Unified Query Input: "What are the fault tolerance specs for worker nodes?"] [▶ Run]│
│ Collections: [All Collections ▾]  │ Mode: [Side-by-Side A/B ▾]  │ Hotkey: ⌘+Enter     │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│ 🅰️ CONFIGURATION A                       │ 🅱️ CONFIGURATION B                          │
│ Preset: [Balanced Hybrid (RRF) ▾]       │ Preset: [Pure Semantic / Dense ▾]           │
│ Hybrid: 70% Dense / 30% BM25 │ TopK: 10 │ Semantic Weight: 100% │ TopK: 10            │
│ Reranker: Cohere-v3 │ Latency: 142ms    │ Reranker: None │ Latency: 68ms              │
├──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ RANKED CHUNKS & SCORE DISTRIBUTION       │ RANKED CHUNKS & SCORE DISTRIBUTION          │
│                                          │                                             │
│ 1. [Doc: specs.pdf] Score: 0.92 [🟢]     │ 1. [Doc: specs.pdf] Score: 0.89 [🟢]        │
│    "Worker node failover triggers..."    │    "Worker node failover triggers..."       │
│    🏷️ [Also in B at #1]                  │    🏷️ [Also in A at #1]                     │
│                                          │                                             │
│ 2. [Doc: incident_402.md] Score: 0.86    │ 2. [Doc: architecture.md] Score: 0.81       │
│    "Root cause was network timeout..."   │    "Cluster nodes communicate via..."       │
│    🏷️ [Unique to A]                      │    🏷️ [Unique to B]                         │
├──────────────────────────────────────────┴─────────────────────────────────────────────┤
│ 🧠 AGENT REASONING & TRACE TIMELINE (Collapsible Drawer)                               │
│ [Step 1: Query Expansion] ➔ [Step 2: Vector Search] ➔ [Step 3: Graph Traversal]        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Interactive Behavior & Algorithms
- **Chunk Intersect Diffing**:
  Given chunk sets $R_A = \{c_{A,1}, \dots, c_{A,k}\}$ and $R_B = \{c_{B,1}, \dots, c_{B,k}\}$, the UI computes in $O(k)$:
  $$\text{Overlap}(c) = \begin{cases} \text{Position in } B & \text{if } c \in R_B \\ \text{Unique to } A & \text{otherwise} \end{cases}$$
- **Comparative Metrics Header**:
  Displays side-by-side latency badge, score drop-off gradient, and count of unique vs. shared chunks.
- **Agent Trace Stream**:
  Buffered consumption of R2R SSE stream using `requestAnimationFrame` to prevent UI freezing during fast token generation.

---

### 4.2 Module 2: 3-Pane Knowledge Studio & Chunk Inspector

```
┌─────────────────────────┬──────────────────────────────────┬─────────────────────────────┐
│ PANE 1: EXPLORER (25%)  │ PANE 2: CHUNKS & PIPELINE (45%)  │ PANE 3: CHUNK DEVTOOLS (30%)│
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 📁 Collections & Docs   │ 📄 Document: k8s_spec.pdf        │ 🔬 Chunk #14 Inspector      │
│ [+ Upload / Dropzone]   │ Status: ✅ Ready (12 Chunks)      │                             │
│                         │ Pipeline: Parse ➔ Embed ➔ Graph  │ [Formatted Text] [Raw JSON] │
│ ▼ 📂 Infrastructure     ├──────────────────────────────────┤                             │
│   • k8s_spec.pdf  [12]  │ [Search Chunks...  ] [Tokens: ▼] │ "The controller manages     │
│   • cluster.md    [4]   │                                  │ reconciliation loops across │
│                         │ Chunk #00  │ 248 Tokens │ 0.88   │ active worker nodes..."     │
│ ⚪ Filter by Status:     │ "Kubernetes architecture..."     │                             │
│ [All] [Ready] [Failed]  ├──────────────────────────────────┼─────────────────────────────┤
│                         │ Chunk #14 (Selected) ◄           │ 📊 Vector & Embedding Stats │
│                         │ "The controller manages..."      │ • Model: text-embedding-3   │
│                         │                                  │ • Dim: 1536-dim float32     │
└─────────────────────────┴──────────────────────────────────┴─────────────────────────────┘
```

#### Pane Details
- **Pane 1 (Directory)**: Tree view of collections with document child nodes, document status indicators (ready, processing, failed), and quick ingestion upload button.
- **Pane 2 (Pipeline & Chunk Stream)**: Stage-by-stage pipeline status tracker (`Upload` ➔ `Parse` ➔ `Chunk` ➔ `Embed` ➔ `Enrich`) with virtualized list of chunks.
- **Pane 3 (Inspector)**: Detailed view of the selected chunk, including syntax-highlighted formatted text, embedding model stats, token counts, extracted entity relationships, and metadata JSON viewer.

---

### 4.3 Module 3: Ops & Telemetry Hub

- **Latency Percentiles**: P50, P95, and P99 response time charts broken down by stage.
- **Dead-Letter Ingestion Queue**: Table displaying failed documents, error codes, stack traces, and 1-click retry.
- **Token Accounting**: Breakdown of prompt, completion, and embedding tokens.
- **Engine Blueprint**: Real-time inspection of active R2R configuration settings.

---

## 5. Technical Architecture & State Management

### 5.1 Directory & File Layout
```text
src/
├── context/
│   ├── UserContext.tsx              # Auth, R2R client instance, session state
│   └── WorkbenchContext.tsx         # Shared workbench state: Arena config, active doc/chunk
├── pages/
│   ├── _app.tsx                     # Global Activity Rail + Status Bar + Theme wrapper
│   ├── index.tsx                    # Automatic redirect to /arena
│   ├── arena.tsx                    # Module 1: Retrieval Arena
│   ├── knowledge.tsx                # Module 2: 3-Pane Knowledge Studio
│   └── ops.tsx                      # Module 3: Telemetry, Ingestion Queue & Settings
├── components/
│   ├── shell/
│   │   ├── ActivityRail.tsx         # Modern 56px left icon rail
│   │   ├── StatusBar.tsx            # Bottom 28px diagnostics bar
│   │   └── CommandPalette.tsx       # ⌘K quick switcher
│   ├── arena/
│   │   ├── ArenaPane.tsx            # Single retrieval execution pane
│   │   ├── ChunkDiffCard.tsx        # Comparative ranked chunk card with diff badge
│   │   ├── ParameterDrawer.tsx      # Retrieval presets & tuning sliders
│   │   └── TraceDrawer.tsx          # Agent SSE reasoning timeline
│   ├── knowledge/
│   │   ├── DocExplorer.tsx          # Pane 1: Tree directory & collection manager
│   │   ├── PipelineTracker.tsx      # Pane 2: Ingestion status & step tracker
│   │   ├── ChunkGrid.tsx            # Pane 2: Virtualized chunk list
│   │   └── ChunkInspector.tsx       # Pane 3: DevTools inspector & entity subgraph
│   ├── ops/
│   │   ├── LatencyWaterfall.tsx     # Latency percentile breakdown
│   │   ├── IngestionQueue.tsx       # Dead-letter queue & retry actions
│   │   └── EngineConfigCard.tsx     # R2R engine configuration overview
│   └── ui/                          # Radix UI + Tailwind primitives
```

### 5.2 Legacy Deprecation & Migration Plan
The following legacy pages will be safely archived/consolidated:
- `/manage.tsx`, `/documents.tsx`, `/collections.tsx`, `/documents-detail.tsx`, `/explorer.tsx` ➔ Replaced by `/knowledge.tsx`.
- `/chat.tsx`, `/search.tsx` ➔ Replaced by `/arena.tsx`.
- `/analytics.tsx`, `/indexLogs.tsx`, `/settings.tsx` ➔ Replaced by `/ops.tsx`.

---

## 6. Verification & Quality Gates

1. **Compilation & Type Safety**: Ensure zero TypeScript errors across the updated route structure.
2. **Chunk Intersect Accuracy**: Verify that chunk comparison correctly tags shared vs. unique chunks with accurate rank indices.
3. **Smooth Virtualization**: Verify 60 FPS scrolling performance on documents with 1,000+ chunks.
4. **SSE Resilience**: Verify smooth streaming of agent thinking and tool call events without UI frame drops.
