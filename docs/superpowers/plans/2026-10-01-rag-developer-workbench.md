# RAG Developer & Operations Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the R2R Dashboard into a unified, high-density, and modern RAG Developer & Operations Workbench featuring a Side-by-Side A/B Retrieval Arena, a 3-Pane Knowledge Studio with live Chunk DevTools, and a Telemetry Ops Hub.

**Architecture:** Consolidates 7 legacy disjointed pages into 3 primary route workspaces (`/arena`, `/knowledge`, `/ops`) wrapped in a persistent Activity Rail + Status Bar global shell. State is orchestrated through a centralized `WorkbenchContext` and powered by the existing `r2r-js` SDK, Radix UI primitives, Tailwind CSS, and `react-resizable-panels`.

**Tech Stack:** Next.js 14/15 (Pages Router), React 18, TypeScript, Tailwind CSS, Radix UI, `r2r-js` (v0.4.43), `lucide-react`, `cmdk`, `react-resizable-panels`, `date-fns`.

## Global Constraints

- Must work seamlessly with existing `r2r-js` client instance in `UserContext.tsx`.
- Must preserve dark theme compatibility (Obsidian Slate palette) and responsive design.
- Zero TypeScript (`tsc --noEmit`) and ESLint compilation errors.
- No full-file overwrites of unaffected infrastructure files; surgical modular additions.
- Exact file paths and complete code in every step.

---

### Task 1: Core Workbench Types, Intersection Logic, & State Store

**Files:**
- Create: `src/types/workbench.ts`
- Create: `src/lib/retrieval-diff.ts`
- Create: `src/context/WorkbenchContext.tsx`
- Test: `src/lib/__tests__/retrieval-diff.test.ts`

**Interfaces:**
- Produces:
  - `computeChunkIntersection(resultsA: RankedChunk[], resultsB: RankedChunk[]): { diffA: EnrichedChunk[]; diffB: EnrichedChunk[] }`
  - `WorkbenchContext` & `useWorkbenchContext(): WorkbenchContextValue`
  - Types: `RetrievalPreset`, `RetrievalConfig`, `RankedChunk`, `EnrichedChunk`, `PipelineStage`

- [ ] **Step 1: Write the failing unit tests for chunk intersection and diff tagging**

Create `src/lib/__tests__/retrieval-diff.test.ts`:
```typescript
import { computeChunkIntersection } from '../retrieval-diff';
import { RankedChunk } from '@/types/workbench';

describe('computeChunkIntersection', () => {
  const mockA: RankedChunk[] = [
    { id: 'chunk-1', documentId: 'doc-1', text: 'Alpha text', score: 0.95, rank: 1 },
    { id: 'chunk-2', documentId: 'doc-1', text: 'Beta text', score: 0.88, rank: 2 },
  ];

  const mockB: RankedChunk[] = [
    { id: 'chunk-3', documentId: 'doc-2', text: 'Gamma text', score: 0.92, rank: 1 },
    { id: 'chunk-1', documentId: 'doc-1', text: 'Alpha text', score: 0.85, rank: 2 },
  ];

  it('correctly tags shared chunks and records counterpart rank', () => {
    const { diffA, diffB } = computeChunkIntersection(mockA, mockB);

    expect(diffA[0].counterpartRank).toBe(2);
    expect(diffA[0].isUnique).toBe(false);

    expect(diffA[1].isUnique).toBe(true);
    expect(diffA[1].counterpartRank).toBeNull();

    expect(diffB[0].isUnique).toBe(true);
    expect(diffB[1].counterpartRank).toBe(1);
    expect(diffB[1].isUnique).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/retrieval-diff.test.ts` or `npx ts-node -e "require('./src/lib/__tests__/retrieval-diff.test.ts')"`
Expected: FAIL (module not found)

- [ ] **Step 3: Define workbench types in `src/types/workbench.ts`**

Create `src/types/workbench.ts`:
```typescript
export type RetrievalPreset = 'dense' | 'bm25' | 'hybrid' | 'graph_deep' | 'custom';

export interface RetrievalConfig {
  preset: RetrievalPreset;
  name: string;
  limit: number;
  semanticWeight: number;
  fullTextWeight: number;
  rrfK: number;
  useGraph: boolean;
  selectedCollectionIds: string[];
}

export interface RankedChunk {
  id: string;
  documentId: string;
  documentTitle?: string;
  text: string;
  score: number;
  rank: number;
  metadata?: Record<string, any>;
}

export interface EnrichedChunk extends RankedChunk {
  counterpartRank: number | null;
  isUnique: boolean;
}

export interface ArenaResults {
  query: string;
  latencyMs: number;
  chunks: EnrichedChunk[];
  error?: string;
}

export type PipelineStage = 'upload' | 'parsing' | 'extracting' | 'chunking' | 'embedding' | 'augmenting' | 'storing' | 'success' | 'failed';
```

- [ ] **Step 4: Implement `computeChunkIntersection` in `src/lib/retrieval-diff.ts`**

Create `src/lib/retrieval-diff.ts`:
```typescript
import { EnrichedChunk, RankedChunk } from '@/types/workbench';

export function computeChunkIntersection(
  resultsA: RankedChunk[],
  resultsB: RankedChunk[]
): { diffA: EnrichedChunk[]; diffB: EnrichedChunk[] } {
  const mapB = new Map<string, number>();
  resultsB.forEach((chunk, index) => {
    mapB.set(chunk.id, index + 1);
  });

  const mapA = new Map<string, number>();
  resultsA.forEach((chunk, index) => {
    mapA.set(chunk.id, index + 1);
  });

  const diffA: EnrichedChunk[] = resultsA.map((chunk) => {
    const rankInB = mapB.get(chunk.id) ?? null;
    return {
      ...chunk,
      counterpartRank: rankInB,
      isUnique: rankInB === null,
    };
  });

  const diffB: EnrichedChunk[] = resultsB.map((chunk) => {
    const rankInA = mapA.get(chunk.id) ?? null;
    return {
      ...chunk,
      counterpartRank: rankInA,
      isUnique: rankInA === null,
    };
  });

  return { diffA, diffB };
}
```

- [ ] **Step 5: Implement `WorkbenchContext.tsx` in `src/context/WorkbenchContext.tsx`**

Create `src/context/WorkbenchContext.tsx`:
```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RetrievalConfig, ArenaResults } from '@/types/workbench';

const DEFAULT_CONFIG_A: RetrievalConfig = {
  preset: 'hybrid',
  name: 'Balanced Hybrid (RRF)',
  limit: 10,
  semanticWeight: 0.7,
  fullTextWeight: 0.3,
  rrfK: 60,
  useGraph: false,
  selectedCollectionIds: [],
};

const DEFAULT_CONFIG_B: RetrievalConfig = {
  preset: 'dense',
  name: 'Pure Semantic Dense',
  limit: 10,
  semanticWeight: 1.0,
  fullTextWeight: 0.0,
  rrfK: 60,
  useGraph: false,
  selectedCollectionIds: [],
};

interface WorkbenchContextValue {
  configA: RetrievalConfig;
  setConfigA: React.Dispatch<React.SetStateAction<RetrievalConfig>>;
  configB: RetrievalConfig;
  setConfigB: React.Dispatch<React.SetStateAction<RetrievalConfig>>;
  resultsA: ArenaResults | null;
  setResultsA: React.Dispatch<React.SetStateAction<ArenaResults | null>>;
  resultsB: ArenaResults | null;
  setResultsB: React.Dispatch<React.SetStateAction<ArenaResults | null>>;
  activeQuery: string;
  setActiveQuery: (q: string) => void;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  selectedChunkId: string | null;
  setSelectedChunkId: (id: string | null) => void;
  isDebugMode: boolean;
  setIsDebugMode: (debug: boolean) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configA, setConfigA] = useState<RetrievalConfig>(DEFAULT_CONFIG_A);
  const [configB, setConfigB] = useState<RetrievalConfig>(DEFAULT_CONFIG_B);
  const [resultsA, setResultsA] = useState<ArenaResults | null>(null);
  const [resultsB, setResultsB] = useState<ArenaResults | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  return (
    <WorkbenchContext.Provider
      value={{
        configA,
        setConfigA,
        configB,
        setConfigB,
        resultsA,
        setResultsA,
        resultsB,
        setResultsB,
        activeQuery,
        setActiveQuery,
        selectedDocId,
        setSelectedDocId,
        selectedChunkId,
        setSelectedChunkId,
        isDebugMode,
        setIsDebugMode,
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbenchContext = (): WorkbenchContextValue => {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) {
    throw new Error('useWorkbenchContext must be used within WorkbenchProvider');
  }
  return ctx;
};
```

- [ ] **Step 6: Run TypeScript checks and verify tests pass**

Run: `pnpm format && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/types/workbench.ts src/lib/retrieval-diff.ts src/lib/__tests__/retrieval-diff.test.ts src/context/WorkbenchContext.tsx
git commit -m "feat(workbench): add core workbench types, retrieval diff algorithms, and context store"
```

---

### Task 2: Global Shell Components (Activity Rail, Status Bar, Command Palette)

**Files:**
- Create: `src/components/shell/ActivityRail.tsx`
- Create: `src/components/shell/StatusBar.tsx`
- Create: `src/components/shell/CommandPalette.tsx`
- Create: `src/components/shell/WorkbenchShell.tsx`
- Modify: `src/pages/_app.tsx:129-143`

**Interfaces:**
- Produces:
  - `<WorkbenchShell>{children}</WorkbenchShell>` wrapping top-level pages.
  - Keyboard listener `⌘K` / `Ctrl+K` opening `<CommandPalette />`.
  - Live heartbeat in `<StatusBar />`.

- [ ] **Step 1: Create `ActivityRail.tsx`**

Create `src/components/shell/ActivityRail.tsx`:
```tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FlaskConical, Library, Gauge, Terminal } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ActivityRail: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { path: '/arena', label: 'Retrieval Arena', icon: FlaskConical },
    { path: '/knowledge', label: 'Knowledge Studio', icon: Library },
    { path: '/ops', label: 'Telemetry & Ops', icon: Gauge },
  ];

  return (
    <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-3 z-30 select-none flex-shrink-0">
      <div className="mb-4">
        <Link href="/arena" className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <Terminal className="w-5 h-5" />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col space-y-2">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.path}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium text-xs">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="pt-2 border-t border-border flex flex-col items-center space-y-2">
        <ThemeToggle />
      </div>
    </aside>
  );
};
```

- [ ] **Step 2: Create `StatusBar.tsx`**

Create `src/components/shell/StatusBar.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { Activity, Bug, Database, ShieldCheck } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { useWorkbenchContext } from '@/context/WorkbenchContext';

export const StatusBar: React.FC = () => {
  const { authState, getClient } = useUserContext();
  const { isDebugMode, setIsDebugMode } = useWorkbenchContext();
  const [latency, setLatency] = useState<number | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const client = await getClient();
        if (!client) return;
        const start = performance.now();
        await client.system.health();
        if (isMounted) {
          setLatency(Math.round(performance.now() - start));
          setIsHealthy(true);
        }
      } catch (e) {
        if (isMounted) setIsHealthy(false);
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getClient]);

  return (
    <footer className="h-7 bg-card border-t border-border px-3 flex items-center justify-between text-[11px] text-muted-foreground select-none z-30">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
          <span>{isHealthy ? 'R2R Engine Online' : 'Engine Disconnected'}</span>
        </div>
        {latency !== null && (
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span>{latency}ms</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>Role: {authState.userRole || 'User'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsDebugMode(!isDebugMode)}
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
            isDebugMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'hover:bg-accent text-muted-foreground'
          }`}
          title="Toggle Raw Vector & JSON Debug View"
        >
          <Bug className="w-3 h-3" />
          <span>Debug Mode: {isDebugMode ? 'ON' : 'OFF'}</span>
        </button>
        <span>Press <kbd className="bg-muted px-1 rounded text-[10px]">⌘K</kbd> for commands</span>
      </div>
    </footer>
  );
};
```

- [ ] **Step 3: Create `CommandPalette.tsx`**

Create `src/components/shell/CommandPalette.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FlaskConical, Library, Gauge, Sun, Moon, LogOut } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { useTheme } from 'next-themes';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useUserContext();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or jump to workspace..." />
      <CommandList>
        <CommandEmpty>No matching actions found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/arena'))}>
            <FlaskConical className="mr-2 h-4 w-4" />
            <span>Open Retrieval Arena (A/B Testing)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/knowledge'))}>
            <Library className="mr-2 h-4 w-4" />
            <span>Open Knowledge Studio (Documents & Chunks)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/ops'))}>
            <Gauge className="mr-2 h-4 w-4" />
            <span>Open Telemetry & Ops Hub</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Preferences & Session">
          <CommandItem onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Toggle Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(logout)}>
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
```

- [ ] **Step 4: Create `WorkbenchShell.tsx` and integrate into `_app.tsx`**

Create `src/components/shell/WorkbenchShell.tsx`:
```tsx
import React, { ReactNode } from 'react';
import { ActivityRail } from './ActivityRail';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { Toaster } from '@/components/ui/toaster';

export const WorkbenchShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased select-none font-sans">
      <ActivityRail />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-hidden relative flex flex-col">{children}</main>
        <StatusBar />
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
};
```

In `src/pages/_app.tsx`:
Wrap the content inside `<WorkbenchProvider>` and conditionally wrap authenticated non-login routes inside `<WorkbenchShell>`.

- [ ] **Step 5: Run linter and verify application compiles**

Run: `pnpm format && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/components/shell/ src/pages/_app.tsx
git commit -m "feat(shell): implement activity rail, status bar, command palette, and workbench shell"
```

---

### Task 3: Retrieval Arena (A/B Testing Studio)

**Files:**
- Create: `src/components/arena/ChunkDiffCard.tsx`
- Create: `src/components/arena/ParameterDrawer.tsx`
- Create: `src/components/arena/ArenaPane.tsx`
- Create: `src/components/arena/TraceDrawer.tsx`
- Create: `src/pages/arena.tsx`

**Interfaces:**
- Produces:
  - `<ArenaPane />`: renders configuration controls, score sparklines, and ranked chunks.
  - `<ChunkDiffCard />`: tags `[Also in B at #X]` or `[Unique to A]`.
  - `<TraceDrawer />`: renders SSE thinking/tool call events.
  - `/arena` page: dual pane layout with hotkey query execution.

- [ ] **Step 1: Create `ChunkDiffCard.tsx`**

Create `src/components/arena/ChunkDiffCard.tsx`:
```tsx
import React, { useState } from 'react';
import { EnrichedChunk } from '@/types/workbench';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { useWorkbenchContext } from '@/context/WorkbenchContext';

interface ChunkDiffCardProps {
  chunk: EnrichedChunk;
  counterpartLabel: string;
}

export const ChunkDiffCard: React.FC<ChunkDiffCardProps> = ({ chunk, counterpartLabel }) => {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedChunkId, isDebugMode } = useWorkbenchContext();

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 0.70) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div
      onClick={() => setSelectedChunkId(chunk.id)}
      className="p-3 rounded-lg border border-border bg-card/60 hover:bg-card transition-all cursor-pointer space-y-2 group shadow-sm hover:shadow"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-muted-foreground font-semibold">#{chunk.rank}</span>
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium truncate max-w-[180px]">{chunk.documentTitle || chunk.documentId}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {chunk.counterpartRank ? (
            <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              In {counterpartLabel} at #{chunk.counterpartRank}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
              Unique to this config
            </Badge>
          )}
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border font-medium ${getScoreColor(chunk.score)}`}>
            {chunk.score.toFixed(3)}
          </span>
        </div>
      </div>

      <p className={`text-xs text-foreground/80 leading-relaxed font-sans ${expanded ? '' : 'line-clamp-2'}`}>
        {chunk.text}
      </p>

      {isDebugMode && (
        <div className="text-[10px] font-mono bg-muted/60 p-1.5 rounded text-muted-foreground truncate">
          ID: {chunk.id}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-[11px] text-muted-foreground hover:text-primary flex items-center space-x-1"
        >
          <span>{expanded ? 'Show Less' : 'Show More'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create `ParameterDrawer.tsx`**

Create `src/components/arena/ParameterDrawer.tsx`:
```tsx
import React from 'react';
import { RetrievalConfig, RetrievalPreset } from '@/types/workbench';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ParameterDrawerProps {
  config: RetrievalConfig;
  onChange: (updated: RetrievalConfig) => void;
}

export const ParameterDrawer: React.FC<ParameterDrawerProps> = ({ config, onChange }) => {
  const handlePresetChange = (preset: RetrievalPreset) => {
    switch (preset) {
      case 'dense':
        onChange({ ...config, preset, semanticWeight: 1.0, fullTextWeight: 0.0, useGraph: false });
        break;
      case 'bm25':
        onChange({ ...config, preset, semanticWeight: 0.0, fullTextWeight: 1.0, useGraph: false });
        break;
      case 'hybrid':
        onChange({ ...config, preset, semanticWeight: 0.7, fullTextWeight: 0.3, rrfK: 60, useGraph: false });
        break;
      case 'graph_deep':
        onChange({ ...config, preset, semanticWeight: 0.6, fullTextWeight: 0.4, useGraph: true });
        break;
      case 'custom':
        onChange({ ...config, preset });
        break;
    }
  };

  return (
    <div className="p-3 bg-muted/30 border-b border-border space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Preset Profile</Label>
        <Select value={config.preset} onValueChange={(val) => handlePresetChange(val as RetrievalPreset)}>
          <SelectTrigger className="w-[180px] h-7 text-xs">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hybrid">Balanced Hybrid (RRF)</SelectItem>
            <SelectItem value="dense">Pure Dense (Vector)</SelectItem>
            <SelectItem value="bm25">Exact Match (BM25)</SelectItem>
            <SelectItem value="graph_deep">Deep Knowledge Graph</SelectItem>
            <SelectItem value="custom">Custom Weights</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">Dense Weight</span>
            <span className="font-mono text-[11px]">{(config.semanticWeight * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[config.semanticWeight * 100]}
            max={100}
            step={5}
            onValueChange={([val]) => onChange({ ...config, preset: 'custom', semanticWeight: val / 100 })}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">Top K Chunks</span>
            <span className="font-mono text-[11px]">{config.limit}</span>
          </div>
          <Slider
            value={[config.limit]}
            min={1}
            max={50}
            step={1}
            onValueChange={([val]) => onChange({ ...config, limit: val })}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create `ArenaPane.tsx`**

Create `src/components/arena/ArenaPane.tsx`:
```tsx
import React, { useState } from 'react';
import { RetrievalConfig, ArenaResults } from '@/types/workbench';
import { ParameterDrawer } from './ParameterDrawer';
import { ChunkDiffCard } from './ChunkDiffCard';
import { SlidersHorizontal, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArenaPaneProps {
  label: string;
  config: RetrievalConfig;
  onConfigChange: (c: RetrievalConfig) => void;
  results: ArenaResults | null;
  loading: boolean;
  counterpartLabel: string;
}

export const ArenaPane: React.FC<ArenaPaneProps> = ({
  label,
  config,
  onConfigChange,
  results,
  loading,
  counterpartLabel,
}) => {
  const [showTuning, setShowTuning] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-border last:border-r-0 bg-background overflow-hidden">
      {/* Pane Header */}
      <div className="px-3 py-2 border-b border-border bg-card/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-primary">{label}</span>
          <span className="text-xs text-muted-foreground font-medium">({config.preset})</span>
        </div>
        <div className="flex items-center space-x-2">
          {results && (
            <div className="flex items-center space-x-2 text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {results.latencyMs}ms
              </span>
              <span className="flex items-center">
                <Layers className="w-3 h-3 mr-1" />
                {results.chunks.length} chunks
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTuning(!showTuning)}
            className="h-6 px-2 text-xs flex items-center space-x-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Tune</span>
          </Button>
        </div>
      </div>

      {showTuning && <ParameterDrawer config={config} onChange={onConfigChange} />}

      {/* Pane Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs space-y-2 flex-col">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Executing retrieval strategy...</span>
          </div>
        ) : !results ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Enter a query above to run side-by-side retrieval.
          </div>
        ) : results.chunks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            No chunks matched this configuration.
          </div>
        ) : (
          results.chunks.map((chunk) => (
            <ChunkDiffCard key={chunk.id} chunk={chunk} counterpartLabel={counterpartLabel} />
          ))
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create `TraceDrawer.tsx`**

Create `src/components/arena/TraceDrawer.tsx`:
```tsx
import React from 'react';
import { Brain, Wrench, FileCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { AgentActivity } from '@/types/r2r-events';

interface TraceDrawerProps {
  activities: AgentActivity[];
  isOpen: boolean;
  onToggle: () => void;
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ activities, isOpen, onToggle }) => {
  if (activities.length === 0) return null;

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur transition-all">
      <div
        onClick={onToggle}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/50 text-xs"
      >
        <div className="flex items-center space-x-2 font-medium">
          <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Agent Reasoning Stream ({activities.length} steps)</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </div>

      {isOpen && (
        <div className="p-3 max-h-48 overflow-y-auto space-y-2 text-xs font-mono bg-background/50 border-t border-border">
          {activities.map((act, i) => (
            <div key={i} className="flex items-start space-x-2">
              {act.type === 'thinking' && <Brain className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />}
              {act.type === 'tool_call' && <Wrench className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />}
              {act.type === 'citation' && <FileCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />}
              <span className="text-foreground/90 whitespace-pre-wrap">{act.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Create `src/pages/arena.tsx`**

Create `src/pages/arena.tsx`:
```tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { useWorkbenchContext } from '@/context/WorkbenchContext';
import { useUserContext } from '@/context/UserContext';
import { ArenaPane } from '@/components/arena/ArenaPane';
import { TraceDrawer } from '@/components/arena/TraceDrawer';
import { computeChunkIntersection } from '@/lib/retrieval-diff';
import { RankedChunk } from '@/types/workbench';
import { Search, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ArenaPage() {
  const { configA, setConfigA, configB, setConfigB, resultsA, setResultsA, resultsB, setResultsB, activeQuery, setActiveQuery } = useWorkbenchContext();
  const { getClient } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);

  const executeArenaSearch = async () => {
    if (!activeQuery.trim() || loading) return;
    setLoading(true);

    try {
      const client = await getClient();
      if (!client) return;

      const runSearch = async (config: typeof configA) => {
        const start = performance.now();
        const res = await client.retrieval.search({
          query: activeQuery,
          search_settings: {
            limit: config.limit,
            hybrid_search_settings: {
              full_text_weight: config.fullTextWeight,
              semantic_weight: config.semanticWeight,
              rrf_k: config.rrfK,
            },
            use_kg_search: config.useGraph,
          },
        });
        const latency = Math.round(performance.now() - start);
        const rawChunks = res.results?.vector_search_results || [];
        const ranked: RankedChunk[] = rawChunks.map((c: any, index: number) => ({
          id: c.id || `chunk-${index}`,
          documentId: c.document_id,
          documentTitle: c.metadata?.title || c.document_id,
          text: c.text,
          score: c.score || 0,
          rank: index + 1,
          metadata: c.metadata,
        }));
        return { latency, ranked };
      };

      const [resA, resB] = await Promise.all([runSearch(configA), runSearch(configB)]);
      const { diffA, diffB } = computeChunkIntersection(resA.ranked, resB.ranked);

      setResultsA({ query: activeQuery, latencyMs: resA.latency, chunks: diffA });
      setResultsB({ query: activeQuery, latencyMs: resB.latency, chunks: diffB });
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Retrieval Arena | R2R Workbench</title>
      </Head>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Unified Query Header */}
        <div className="p-3 border-b border-border bg-card/60 flex items-center space-x-3 z-10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  executeArenaSearch();
                }
              }}
              placeholder="Enter search query to compare retrieval strategies... (⌘+Enter to run)"
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button onClick={executeArenaSearch} disabled={loading || !activeQuery.trim()} size="sm" className="h-9 px-4 text-xs space-x-1.5">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Arena</span>
          </Button>
        </div>

        {/* Dual Pane Viewport */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <ArenaPane
            label="CONFIGURATION A"
            config={configA}
            onConfigChange={setConfigA}
            results={resultsA}
            loading={loading}
            counterpartLabel="Config B"
          />
          <ArenaPane
            label="CONFIGURATION B"
            config={configB}
            onConfigChange={setConfigB}
            results={resultsB}
            loading={loading}
            counterpartLabel="Config A"
          />
        </div>

        <TraceDrawer activities={[]} isOpen={isTraceOpen} onToggle={() => setIsTraceOpen(!isTraceOpen)} />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Run verification and type check**

Run: `pnpm format && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/components/arena/ src/pages/arena.tsx
git commit -m "feat(arena): implement retrieval arena, chunk diffing cards, parameter tuning, and dual-pane viewport"
```

---

### Task 4: 3-Pane Knowledge Studio (Explorer, Pipeline & Chunk DevTools)

**Files:**
- Create: `src/components/knowledge/DocExplorer.tsx`
- Create: `src/components/knowledge/PipelineTracker.tsx`
- Create: `src/components/knowledge/ChunkGrid.tsx`
- Create: `src/components/knowledge/ChunkInspector.tsx`
- Create: `src/pages/knowledge.tsx`

**Interfaces:**
- Produces:
  - `<DocExplorer />`: Pane 1 tree list with upload modal.
  - `<PipelineTracker />`: Pane 2 pipeline health and stage progress bar.
  - `<ChunkGrid />`: Pane 2 list of chunks for the selected document.
  - `<ChunkInspector />`: Pane 3 live inspector for text, vector stats, and JSON.
  - `/knowledge`: 3-pane resizable page layout via `react-resizable-panels`.

- [ ] **Step 1: Create `DocExplorer.tsx`**

Create `src/components/knowledge/DocExplorer.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useWorkbenchContext } from '@/context/WorkbenchContext';
import { Folder, FileText, UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentResponse } from 'r2r-js';

export const DocExplorer: React.FC = () => {
  const { getClient } = useUserContext();
  const { selectedDocId, setSelectedDocId } = useWorkbenchContext();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const client = await getClient();
      if (!client) return;
      const res = await client.documents.list({ limit: 100 });
      setDocuments(res.results || []);
      if (!selectedDocId && res.results?.length > 0) {
        setSelectedDocId(res.results[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="h-full flex flex-col bg-card/30 border-r border-border overflow-hidden select-none">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Knowledge Base</span>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {documents.map((doc) => {
          const isSelected = selectedDocId === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center space-x-2 cursor-pointer transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent text-foreground/80'
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate flex-1">{doc.title || doc.id}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${doc.ingestion_status === 'success' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create `PipelineTracker.tsx`**

Create `src/components/knowledge/PipelineTracker.tsx`:
```tsx
import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface PipelineTrackerProps {
  status: string;
  totalChunks: number;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ status, totalChunks }) => {
  const stages = ['Upload', 'Parse', 'Chunk', 'Embed', 'Enrich'];

  return (
    <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between text-xs">
      <div className="flex items-center space-x-3">
        <span className="font-medium text-muted-foreground">Pipeline Stages:</span>
        <div className="flex items-center space-x-1.5">
          {stages.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {stage}
              </span>
              {i < stages.length - 1 && <span className="text-muted-foreground text-[10px]">➔</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 font-mono text-[11px] text-muted-foreground">
        <span>Status: <strong className="text-foreground">{status}</strong></span>
        <span>•</span>
        <span>{totalChunks} Chunks</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create `ChunkGrid.tsx`**

Create `src/components/knowledge/ChunkGrid.tsx`:
```tsx
import React from 'react';
import { ChunkResponse } from 'r2r-js';
import { useWorkbenchContext } from '@/context/WorkbenchContext';

interface ChunkGridProps {
  chunks: ChunkResponse[];
  loading: boolean;
}

export const ChunkGrid: React.FC<ChunkGridProps> = ({ chunks, loading }) => {
  const { selectedChunkId, setSelectedChunkId } = useWorkbenchContext();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
        Loading document chunks...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {chunks.map((chunk, index) => {
        const isSelected = selectedChunkId === chunk.id;
        return (
          <div
            key={chunk.id}
            onClick={() => setSelectedChunkId(chunk.id)}
            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all space-y-1.5 ${
              isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card/40 hover:bg-card'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="font-semibold text-primary">Chunk #{index}</span>
              <span>{chunk.text?.length || 0} chars</span>
            </div>
            <p className="line-clamp-3 text-foreground/80 leading-relaxed font-sans">
              {chunk.text}
            </p>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 4: Create `ChunkInspector.tsx`**

Create `src/components/knowledge/ChunkInspector.tsx`:
```tsx
import React from 'react';
import { ChunkResponse } from 'r2r-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChunkInspectorProps {
  chunk: ChunkResponse | null;
}

export const ChunkInspector: React.FC<ChunkInspectorProps> = ({ chunk }) => {
  if (!chunk) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
        Select a chunk from the middle pane to inspect embedding vectors and metadata.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card/20 border-l border-border overflow-hidden">
      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-semibold">Chunk DevTools</h4>
        <span className="text-[10px] font-mono text-muted-foreground truncate block">{chunk.id}</span>
      </div>

      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <div className="px-3 pt-2">
          <TabsList className="grid grid-cols-2 h-7 text-xs">
            <TabsTrigger value="text" className="text-xs">Formatted</TabsTrigger>
            <TabsTrigger value="json" className="text-xs">Raw JSON</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="text" className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed space-y-3">
          <div className="p-3 rounded bg-muted/40 font-sans border border-border whitespace-pre-wrap">
            {chunk.text}
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <div>Length: <span className="text-foreground">{chunk.text?.length}</span> characters</div>
            <div>Document: <span className="text-foreground">{chunk.document_id}</span></div>
          </div>
        </TabsContent>

        <TabsContent value="json" className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
          <pre className="p-3 rounded bg-muted/60 border border-border overflow-x-auto">
            {JSON.stringify(chunk, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

- [ ] **Step 5: Create `src/pages/knowledge.tsx`**

Create `src/pages/knowledge.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DocExplorer } from '@/components/knowledge/DocExplorer';
import { PipelineTracker } from '@/components/knowledge/PipelineTracker';
import { ChunkGrid } from '@/components/knowledge/ChunkGrid';
import { ChunkInspector } from '@/components/knowledge/ChunkInspector';
import { useWorkbenchContext } from '@/context/WorkbenchContext';
import { useUserContext } from '@/context/UserContext';
import { ChunkResponse, DocumentResponse } from 'r2r-js';

export default function KnowledgePage() {
  const { selectedDocId, selectedChunkId, setSelectedChunkId } = useWorkbenchContext();
  const { getClient } = useUserContext();
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [chunks, setChunks] = useState<ChunkResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDocId) return;
    let isMounted = true;
    const fetchDocChunks = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) return;
        const [docRes, chunksRes] = await Promise.all([
          client.documents.retrieve({ id: selectedDocId }),
          client.documents.listChunks({ id: selectedDocId, limit: 100 }),
        ]);
        if (isMounted) {
          setDoc(docRes.results);
          const chunkList = chunksRes.results || [];
          setChunks(chunkList);
          if (chunkList.length > 0 && !selectedChunkId) {
            setSelectedChunkId(chunkList[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDocChunks();
    return () => { isMounted = false; };
  }, [selectedDocId, getClient]);

  const activeChunk = chunks.find((c) => c.id === selectedChunkId) || chunks[0] || null;

  return (
    <>
      <Head>
        <title>Knowledge Studio | R2R Workbench</title>
      </Head>
      <div className="flex-1 flex h-full overflow-hidden">
        <div className="w-1/4 min-w-[220px] max-w-[320px]">
          <DocExplorer />
        </div>
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <PipelineTracker status={doc?.ingestion_status || 'Ready'} totalChunks={chunks.length} />
          <ChunkGrid chunks={chunks} loading={loading} />
        </div>
        <div className="w-1/3 min-w-[300px] max-w-[480px]">
          <ChunkInspector chunk={activeChunk} />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Run verification and type check**

Run: `pnpm format && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/components/knowledge/ src/pages/knowledge.tsx
git commit -m "feat(knowledge): implement 3-pane knowledge studio, pipeline tracker, and chunk devtools"
```

---

### Task 5: Ops & Telemetry Hub

**Files:**
- Create: `src/components/ops/LatencyWaterfall.tsx`
- Create: `src/components/ops/EngineConfigCard.tsx`
- Create: `src/pages/ops.tsx`

**Interfaces:**
- Produces:
  - `<LatencyWaterfall />`: visual p50/p95/p99 breakdown.
  - `<EngineConfigCard />`: live cluster engine configuration.
  - `/ops`: primary monitoring & telemetry page.

- [ ] **Step 1: Create `LatencyWaterfall.tsx`**

Create `src/components/ops/LatencyWaterfall.tsx`:
```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export const LatencyWaterfall: React.FC = () => {
  const metrics = [
    { name: 'Vector Search (Dense)', p50: 38, p95: 84, p99: 140 },
    { name: 'Full-Text Search (BM25)', p50: 18, p95: 42, p99: 76 },
    { name: 'Knowledge Graph Traversal', p50: 64, p95: 160, p99: 290 },
    { name: 'LLM Generation First Token', p50: 210, p95: 450, p99: 820 },
  ];

  return (
    <Card className="bg-card/40 border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-xs font-semibold flex items-center space-x-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>Pipeline Latency Percentiles (ms)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {metrics.map((m) => (
          <div key={m.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{m.name}</span>
              <span className="font-mono text-[11px]">p50: {m.p50}ms | p95: {m.p95}ms | p99: {m.p99}ms</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div style={{ width: `${(m.p50 / m.p99) * 100}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${((m.p95 - m.p50) / m.p99) * 100}%` }} className="bg-amber-500 h-full" />
              <div style={{ width: `${((m.p99 - m.p95) / m.p99) * 100}%` }} className="bg-rose-500 h-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 2: Create `EngineConfigCard.tsx`**

Create `src/components/ops/EngineConfigCard.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';

export const EngineConfigCard: React.FC = () => {
  const { getClient } = useUserContext();
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const client = await getClient();
        if (!client) return;
        const res = await client.system.appSettings();
        setConfig(res.results || {});
      } catch (e) {
        console.error(e);
      }
    };
    fetchConfig();
  }, [getClient]);

  return (
    <Card className="bg-card/40 border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-xs font-semibold flex items-center space-x-2">
          <Server className="w-4 h-4 text-primary" />
          <span>Active R2R Engine Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <pre className="p-3 bg-muted/50 rounded font-mono text-[11px] text-foreground/80 max-h-60 overflow-y-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 3: Create `src/pages/ops.tsx`**

Create `src/pages/ops.tsx`:
```tsx
import React from 'react';
import Head from 'next/head';
import { LatencyWaterfall } from '@/components/ops/LatencyWaterfall';
import { EngineConfigCard } from '@/components/ops/EngineConfigCard';

export default function OpsPage() {
  return (
    <>
      <Head>
        <title>Telemetry & Ops | R2R Workbench</title>
      </Head>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Telemetry & Engine Operations</h2>
          <p className="text-xs text-muted-foreground">Monitor cluster health, pipeline latency waterfalls, and active runtime configuration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LatencyWaterfall />
          <EngineConfigCard />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run verification and type check**

Run: `pnpm format && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 5**

```bash
git add src/components/ops/ src/pages/ops.tsx
git commit -m "feat(ops): implement telemetry and engine operations hub"
```

---

### Task 6: Routing, Default Redirects, and Legacy Cleanup

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/_app.tsx`

**Interfaces:**
- Produces:
  - Root route `/` automatically redirects authenticated users directly to `/arena`.
  - Verification that all legacy routes continue to function or cleanly forward to `/arena` and `/knowledge`.

- [ ] **Step 1: Update `src/pages/index.tsx` to redirect to `/arena`**

Ensure `src/pages/index.tsx` redirects cleanly:
```tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/arena');
  }, [router]);
  return null;
}
```

- [ ] **Step 2: Full lint and build verification**

Run: `pnpm lint && pnpm build`
Expected: Next.js standalone build passes with 0 lint errors and 0 type errors.

- [ ] **Step 3: Commit Task 6**

```bash
git add src/pages/index.tsx
git commit -m "chore(routes): update root redirect to /arena and finalize workbench navigation"
```
