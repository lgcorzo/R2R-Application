import { CollectionResponse, DocumentResponse } from 'r2r-js';

export interface FileUploadStatus {
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface SearchResultItem {
  type: 'document' | 'collection' | 'entity' | 'relationship' | 'community';
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  data: unknown;
}

export interface ExplorerFilters {
  ingestionStatus: string[];
  extractionStatus: string[];
}

export interface SortConfig {
  key: 'name' | 'size' | 'modified';
  direction: 'asc' | 'desc';
}

export interface MetadataField {
  id: string;
  key: string;
  value: string;
  placeholder: string;
  showPresets: boolean;
}

export type ViewMode = 'list' | 'grid';

export type UploadQuality = 'fast' | 'hi-res' | 'custom';

export interface ExplorerContextValue {
  files: DocumentResponse[];
  collections: CollectionResponse[];
  selectedCollectionId: string | null;
  selectedFiles: string[];
  viewMode: ViewMode;
  loading: boolean;
  // Actions
  fetchFiles: () => Promise<void>;
  setSelectedCollectionId: (id: string | null) => void;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
}
