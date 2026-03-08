import { EntityResponse, RelationshipResponse } from 'r2r-js';
import React, { useEffect, useRef, useState } from 'react';

import KnowledgeGraphD3 from '@/components/knowledgeGraphD3';

interface KnowledgeGraphTabProps {
  entities: EntityResponse[];
  relationships: RelationshipResponse[];
  loading: boolean;
}

export function KnowledgeGraphTab({
  entities,
  relationships,
  loading,
}: KnowledgeGraphTabProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.offsetWidth;
        const height = graphContainerRef.current.offsetHeight;
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[550px]">
        <p>Loading knowledge graph...</p>
      </div>
    );
  }

  return (
    <div
      ref={graphContainerRef}
      className="w-full h-[550px] flex items-center justify-center"
    >
      {containerDimensions.width > 0 && (
        <KnowledgeGraphD3
          entities={entities}
          relationships={relationships}
          width={containerDimensions.width}
          height={containerDimensions.height}
          maxNodes={250}
        />
      )}
    </div>
  );
}
