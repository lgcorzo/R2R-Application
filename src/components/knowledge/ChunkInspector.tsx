import { ChunkResponse } from 'r2r-js';
import React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChunkInspectorProps {
  chunk: ChunkResponse | null;
}

export const ChunkInspector: React.FC<ChunkInspectorProps> = ({ chunk }) => {
  if (!chunk) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
        Select a chunk from the middle pane to inspect embedding vectors and
        metadata.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card/20 border-l border-border overflow-hidden select-none">
      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-semibold">Chunk DevTools</h4>
        <span className="text-[10px] font-mono text-muted-foreground truncate block">
          {chunk.id}
        </span>
      </div>

      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <div className="px-3 pt-2">
          <TabsList className="grid grid-cols-2 h-7 text-xs">
            <TabsTrigger value="text" className="text-xs">
              Formatted
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              Raw JSON
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="text"
          className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed space-y-3"
        >
          <div className="p-3 rounded bg-muted/40 font-sans border border-border whitespace-pre-wrap select-text">
            {chunk.text}
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <div>
              Character Length:{' '}
              <span className="text-foreground">{chunk.text?.length || 0}</span>
            </div>
            <div>
              Document ID:{' '}
              <span className="text-foreground truncate block">
                {chunk.documentId}
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="json"
          className="flex-1 overflow-y-auto p-3 font-mono text-[11px]"
        >
          <pre className="p-3 rounded bg-muted/60 border border-border overflow-x-auto select-text">
            {JSON.stringify(chunk, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};
