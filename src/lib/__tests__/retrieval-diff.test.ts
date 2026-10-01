import assert from 'assert';
import { computeChunkIntersection } from '../retrieval-diff';
import { RankedChunk } from '@/types/workbench';

function runTest() {
  const mockA: RankedChunk[] = [
    { id: 'chunk-1', documentId: 'doc-1', text: 'Alpha text', score: 0.95, rank: 1 },
    { id: 'chunk-2', documentId: 'doc-1', text: 'Beta text', score: 0.88, rank: 2 },
  ];

  const mockB: RankedChunk[] = [
    { id: 'chunk-3', documentId: 'doc-2', text: 'Gamma text', score: 0.92, rank: 1 },
    { id: 'chunk-1', documentId: 'doc-1', text: 'Alpha text', score: 0.85, rank: 2 },
  ];

  const { diffA, diffB } = computeChunkIntersection(mockA, mockB);

  assert.strictEqual(diffA[0].counterpartRank, 2, 'diffA[0] counterpartRank should be 2');
  assert.strictEqual(diffA[0].isUnique, false, 'diffA[0] should not be unique');
  assert.strictEqual(diffA[1].isUnique, true, 'diffA[1] should be unique');
  assert.strictEqual(diffA[1].counterpartRank, null, 'diffA[1] counterpartRank should be null');

  assert.strictEqual(diffB[0].isUnique, true, 'diffB[0] should be unique');
  assert.strictEqual(diffB[1].counterpartRank, 1, 'diffB[1] counterpartRank should be 1');
  assert.strictEqual(diffB[1].isUnique, false, 'diffB[1] should not be unique');

  console.log('✅ computeChunkIntersection unit test passed!');
}

runTest();
