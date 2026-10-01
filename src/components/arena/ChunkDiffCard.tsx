import { ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { useWorkbenchContext } from '@/context/WorkbenchContext';
import { EnrichedChunk } from '@/types/workbench';

interface ChunkDiffCardProps {
  chunk: EnrichedChunk;
  counterpartLabel: string;
}

export const ChunkDiffCard: React.FC<ChunkDiffCardProps> = ({
  chunk,
  counterpartLabel,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedChunkId, isDebugMode } = useWorkbenchContext();

  const getScoreColor = (score: number) => {
    if (score >= 0.85)
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 0.7)
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div
      onClick={() => setSelectedChunkId(chunk.id)}
      className="p-3 rounded-lg border border-border bg-card/60 hover:bg-card transition-all cursor-pointer space-y-2 group shadow-sm hover:shadow"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-muted-foreground font-semibold">
            #{chunk.rank}
          </span>
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium truncate max-w-[180px]">
            {chunk.documentTitle || chunk.documentId}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {chunk.counterpartRank ? (
            <Badge
              variant="outline"
              className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20"
            >
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              In {counterpartLabel} at #{chunk.counterpartRank}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20"
            >
              Unique to this config
            </Badge>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono border font-medium ${getScoreColor(
              chunk.score
            )}`}
          >
            {chunk.score.toFixed(3)}
          </span>
        </div>
      </div>

      <p
        className={`text-xs text-foreground/80 leading-relaxed font-sans ${
          expanded ? '' : 'line-clamp-2'
        }`}
      >
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
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};
