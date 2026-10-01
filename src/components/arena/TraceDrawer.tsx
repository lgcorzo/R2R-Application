import { Brain, Wrench, FileCheck, ChevronUp, ChevronDown } from 'lucide-react';
import React from 'react';

import { AgentActivity } from '@/types/r2r-events';

interface TraceDrawerProps {
  activities: AgentActivity[];
  isOpen: boolean;
  onToggle: () => void;
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({
  activities,
  isOpen,
  onToggle,
}) => {
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
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </div>

      {isOpen && (
        <div className="p-3 max-h-48 overflow-y-auto space-y-2 text-xs font-mono bg-background/50 border-t border-border">
          {activities.map((act, i) => (
            <div key={i} className="flex items-start space-x-2">
              {act.type === 'thinking' && (
                <Brain className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              )}
              {act.type === 'tool_call' && (
                <Wrench className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
              )}
              {act.type === 'citation' && (
                <FileCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-foreground/90 whitespace-pre-wrap">
                {act.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
