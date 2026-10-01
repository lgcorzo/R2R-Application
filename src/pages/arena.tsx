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
  const {
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
  } = useWorkbenchContext();
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
          searchSettings: {
            use_semantic_search: config.semanticWeight > 0,
            use_fulltext_search: config.fullTextWeight > 0,
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
        const rawChunks = (res.results?.chunkSearchResults || []) as any[];
        const ranked: RankedChunk[] = rawChunks.map(
          (c: any, index: number) => ({
            id: c.id || c.chunk_id || `chunk-${index}`,
            documentId: c.document_id || c.documentId || 'unknown',
            documentTitle:
              c.metadata?.title || c.title || c.document_id || 'Document',
            text: c.text || c.content || '',
            score: c.score || 0,
            rank: index + 1,
            metadata: c.metadata,
          })
        );
        return { latency, ranked };
      };

      const [resA, resB] = await Promise.all([
        runSearch(configA),
        runSearch(configB),
      ]);
      const { diffA, diffB } = computeChunkIntersection(
        resA.ranked,
        resB.ranked
      );

      setResultsA({
        query: activeQuery,
        latencyMs: resA.latency,
        chunks: diffA,
      });
      setResultsB({
        query: activeQuery,
        latencyMs: resB.latency,
        chunks: diffB,
      });
    } catch (e: any) {
      console.error('Arena search error:', e);
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
          <Button
            onClick={executeArenaSearch}
            disabled={loading || !activeQuery.trim()}
            size="sm"
            className="h-9 px-4 text-xs space-x-1.5"
          >
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

        <TraceDrawer
          activities={[]}
          isOpen={isTraceOpen}
          onToggle={() => setIsTraceOpen(!isTraceOpen)}
        />
      </div>
    </>
  );
}
