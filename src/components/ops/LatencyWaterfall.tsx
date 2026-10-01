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
              <span className="font-mono text-[11px]">
                p50: {m.p50}ms | p95: {m.p95}ms | p99: {m.p99}ms
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(m.p50 / m.p99) * 100}%` }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${((m.p95 - m.p50) / m.p99) * 100}%` }}
                className="bg-amber-500 h-full"
              />
              <div
                style={{ width: `${((m.p99 - m.p95) / m.p99) * 100}%` }}
                className="bg-rose-500 h-full"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
