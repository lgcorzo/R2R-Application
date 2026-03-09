import { EntityResponse } from 'r2r-js';
import React, { useEffect, useRef, useState } from 'react';

import KnowledgeGraph from '@/components/knowledgeGraph';

interface ExploreTabProps {
  entities: EntityResponse[];
  loading: boolean;
}

export function ExploreTab({ entities, loading }: ExploreTabProps) {
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
      <div className="flex justify-center items-center h-[600px]">
        <p>Loading explore view...</p>
      </div>
    );
  }

  return (
    <div
      ref={graphContainerRef}
      className="w-full h-[600px] flex items-center justify-center"
    >
      {containerDimensions.width > 0 && entities.length > 0 && (
        <KnowledgeGraph
          entities={entities}
          width={containerDimensions.width}
          height={containerDimensions.height}
        />
      )}
    </div>
  );
}
