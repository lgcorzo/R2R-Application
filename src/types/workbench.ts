export type RetrievalPreset =
  | 'dense'
  | 'bm25'
  | 'hybrid'
  | 'graph_deep'
  | 'custom';

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

export type PipelineStage =
  | 'upload'
  | 'parsing'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'augmenting'
  | 'storing'
  | 'success'
  | 'failed';
