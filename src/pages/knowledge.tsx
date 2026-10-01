import Head from 'next/head';
import { ChunkResponse, DocumentResponse } from 'r2r-js';
import React, { useEffect, useState } from 'react';

import { ChunkGrid } from '@/components/knowledge/ChunkGrid';
import { ChunkInspector } from '@/components/knowledge/ChunkInspector';
import { DocExplorer } from '@/components/knowledge/DocExplorer';
import { PipelineTracker } from '@/components/knowledge/PipelineTracker';
import { useUserContext } from '@/context/UserContext';
import { useWorkbenchContext } from '@/context/WorkbenchContext';

export default function KnowledgePage() {
  const { selectedDocId, selectedChunkId, setSelectedChunkId } =
    useWorkbenchContext();
  const { getClient } = useUserContext();
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [chunks, setChunks] = useState<ChunkResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDocId) return;
    let isMounted = true;
    const fetchDocChunks = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) return;
        const [docRes, chunksRes] = await Promise.all([
          client.documents.retrieve({ id: selectedDocId }),
          client.documents.listChunks({ id: selectedDocId, limit: 100 }),
        ]);
        if (isMounted) {
          setDoc(docRes?.results || null);
          const chunkList = chunksRes?.results || [];
          setChunks(chunkList);
          if (chunkList.length > 0 && !selectedChunkId) {
            setSelectedChunkId(chunkList[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching doc or chunks in KnowledgePage:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDocChunks();
    return () => {
      isMounted = false;
    };
  }, [selectedDocId, getClient, selectedChunkId, setSelectedChunkId]);

  const activeChunk =
    chunks.find((c) => c.id === selectedChunkId) || chunks[0] || null;

  return (
    <>
      <Head>
        <title>Knowledge Studio | R2R Workbench</title>
      </Head>
      <div className="flex-1 flex h-full overflow-hidden">
        <div className="w-1/4 min-w-[220px] max-w-[320px]">
          <DocExplorer />
        </div>
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <PipelineTracker
            status={doc?.ingestionStatus || 'Ready'}
            totalChunks={chunks.length}
          />
          <ChunkGrid chunks={chunks} loading={loading} />
        </div>
        <div className="w-1/3 min-w-[300px] max-w-[480px]">
          <ChunkInspector chunk={activeChunk} />
        </div>
      </div>
    </>
  );
}
