import { CheckCircle2, Clock } from 'lucide-react';
import React from 'react';

interface PipelineTrackerProps {
  status: string;
  totalChunks: number;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({
  status,
  totalChunks,
}) => {
  const stages = ['Upload', 'Parse', 'Chunk', 'Embed', 'Enrich'];

  return (
    <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between text-xs select-none">
      <div className="flex items-center space-x-3">
        <span className="font-medium text-muted-foreground">
          Pipeline Stages:
        </span>
        <div className="flex items-center space-x-1.5">
          {stages.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{stage}</span>
              </span>
              {i < stages.length - 1 && (
                <span className="text-muted-foreground text-[10px]">➔</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 font-mono text-[11px] text-muted-foreground">
        <span>
          Status: <strong className="text-foreground">{status}</strong>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-primary mr-0.5" />
          <span>{totalChunks} Chunks</span>
        </span>
      </div>
    </div>
  );
};
