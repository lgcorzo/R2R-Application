import React, { createContext, useContext, useState, ReactNode } from 'react';

import { RetrievalConfig, ArenaResults } from '@/types/workbench';

const DEFAULT_CONFIG_A: RetrievalConfig = {
  preset: 'hybrid',
  name: 'Balanced Hybrid (RRF)',
  limit: 10,
  semanticWeight: 0.7,
  fullTextWeight: 0.3,
  rrfK: 60,
  useGraph: false,
  selectedCollectionIds: [],
};

const DEFAULT_CONFIG_B: RetrievalConfig = {
  preset: 'dense',
  name: 'Pure Semantic Dense',
  limit: 10,
  semanticWeight: 1.0,
  fullTextWeight: 0.0,
  rrfK: 60,
  useGraph: false,
  selectedCollectionIds: [],
};

interface WorkbenchContextValue {
  configA: RetrievalConfig;
  setConfigA: React.Dispatch<React.SetStateAction<RetrievalConfig>>;
  configB: RetrievalConfig;
  setConfigB: React.Dispatch<React.SetStateAction<RetrievalConfig>>;
  resultsA: ArenaResults | null;
  setResultsA: React.Dispatch<React.SetStateAction<ArenaResults | null>>;
  resultsB: ArenaResults | null;
  setResultsB: React.Dispatch<React.SetStateAction<ArenaResults | null>>;
  activeQuery: string;
  setActiveQuery: (q: string) => void;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  selectedChunkId: string | null;
  setSelectedChunkId: (id: string | null) => void;
  isDebugMode: boolean;
  setIsDebugMode: (debug: boolean) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | undefined>(
  undefined
);

export const WorkbenchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [configA, setConfigA] = useState<RetrievalConfig>(DEFAULT_CONFIG_A);
  const [configB, setConfigB] = useState<RetrievalConfig>(DEFAULT_CONFIG_B);
  const [resultsA, setResultsA] = useState<ArenaResults | null>(null);
  const [resultsB, setResultsB] = useState<ArenaResults | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  return (
    <WorkbenchContext.Provider
      value={{
        configA,
        setConfigA,
        configB,
        setConfigB,
        resultsA,
        setResultsA,
        resultsB,
        setResultsB,
        activeQuery,
        setActiveQuery,
        selectedDocId,
        setSelectedDocId,
        selectedChunkId,
        setSelectedChunkId,
        isDebugMode,
        setIsDebugMode,
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbenchContext = (): WorkbenchContextValue => {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) {
    throw new Error(
      'useWorkbenchContext must be used within WorkbenchProvider'
    );
  }
  return ctx;
};
