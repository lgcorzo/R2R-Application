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
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading document chunks...</span>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-6 text-center">
        No chunks found for this document.
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
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card/40 hover:bg-card'
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
