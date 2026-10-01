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
