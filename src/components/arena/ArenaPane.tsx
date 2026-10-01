import { SlidersHorizontal, Clock, Layers } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { RetrievalConfig, ArenaResults } from '@/types/workbench';

import { ChunkDiffCard } from './ChunkDiffCard';
import { ParameterDrawer } from './ParameterDrawer';

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
          <span className="text-xs text-muted-foreground font-medium">
            ({config.preset})
          </span>
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

      {showTuning && (
        <ParameterDrawer config={config} onChange={onConfigChange} />
      )}

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
            <ChunkDiffCard
              key={chunk.id}
              chunk={chunk}
              counterpartLabel={counterpartLabel}
            />
          ))
        )}
      </div>
    </div>
  );
};
