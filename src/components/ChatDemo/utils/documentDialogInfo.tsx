import { format, parseISO } from 'date-fns';
import {
  Edit,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  User,
  Tag,
  Copy,
} from 'lucide-react';
import {
  ChunkResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
} from 'r2r-js';
import { useEffect, useState, useCallback } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ShadcnButton as Button } from '@/components/ui/ShadcnButton';
import { TablePagination } from '@/components/ui/TablePagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import {
  DocumentInfoDialogProps,
  IngestionStatus,
  KGExtractionStatus,
} from '@/types';

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    return 'N/A';
  }
  const date = parseISO(dateString);
  return format(date, 'PPpp');
};

const formatValue = (value: any) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
};

const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({
  id,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [documentOverview, setDocumentResponse] =
    useState<DocumentResponse | null>(null);
  const { getClient } = useUserContext();
  const [activeTab, setActiveTab] = useState('chunks');

  const fetchDocumentResponse = useCallback(
    async (client: any, documentId: string) => {
      const overview = await client.documents.list({
        ids: [documentId],
      });
      return overview.results[0] || null;
    },
    []
  );

  const fetchAllChunks = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listChunks({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document chunks:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  const fetchAllEntities = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listEntities({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document entities:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  const fetchAllRelationships = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listRelationships({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document relationships:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  // Pagination hooks for chunks
  const {
    currentPage: chunksCurrentPage,
    totalPages: chunksTotalPages,
    data: currentChunks,
    loading: chunksLoading,
    totalItems: chunksTotalEntries,
    goToPage: goToChunksPage,
  } = usePagination<ChunkResponse>({
    key: `chunks-${id}`,
    fetchData: fetchAllChunks,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  // Pagination hooks for entities
  const {
    currentPage: entitiesCurrentPage,
    totalPages: entitiesTotalPages,
    data: currentEntities,
    loading: entitiesLoading,
    totalItems: entitiesTotalEntries,
    goToPage: goToEntitiesPage,
  } = usePagination<EntityResponse>({
    key: `entities-${id}`,
    fetchData: fetchAllEntities,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  // Pagination hooks for relationships
  const {
    currentPage: relationshipsCurrentPage,
    totalPages: relationshipsTotalPages,
    data: currentRelationships,
    loading: relationshipsLoading,
    totalItems: relationshipsTotalEntries,
    goToPage: goToRelationshipsPage,
  } = usePagination<RelationshipResponse>({
    key: `relationships-${id}`,
    fetchData: fetchAllRelationships,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  const refreshChunks = useCallback(() => {
    if (chunksCurrentPage) {
      goToChunksPage(chunksCurrentPage);
    }
  }, [chunksCurrentPage, goToChunksPage]);

  const refreshEntities = useCallback(() => {
    if (entitiesCurrentPage) {
      goToEntitiesPage(entitiesCurrentPage);
    }
  }, [entitiesCurrentPage, goToEntitiesPage]);

  const refreshRelationships = useCallback(() => {
    if (relationshipsCurrentPage) {
      goToRelationshipsPage(relationshipsCurrentPage);
    }
  }, [relationshipsCurrentPage, goToRelationshipsPage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const overview = await fetchDocumentResponse(client, id);
        setDocumentResponse(overview);
      } catch (error) {
        console.error('Error fetching document overview:', error);
        setDocumentResponse(null);
      } finally {
        setLoading(false);
      }
    };

    if (open && id) {
      fetchData();
    }
  }, [open, id, getClient, fetchDocumentResponse]);

  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusBadge = (status: string, type: 'ingestion' | 'extraction') => {
    let variant: 'success' | 'destructive' | 'pending' | 'secondary' =
      'secondary';

    const normalizedStatus = status?.toLowerCase() || '';

    if (type === 'ingestion') {
      if (
        normalizedStatus === IngestionStatus.SUCCESS.toLowerCase() ||
        normalizedStatus === 'success'
      ) {
        variant = 'success';
      } else if (
        normalizedStatus === IngestionStatus.FAILED.toLowerCase() ||
        normalizedStatus === 'failed'
      ) {
        variant = 'destructive';
      } else {
        variant = 'pending';
      }
    } else {
      if (
        normalizedStatus === KGExtractionStatus.SUCCESS.toLowerCase() ||
        normalizedStatus === 'success'
      ) {
        variant = 'success';
      } else if (
        normalizedStatus === KGExtractionStatus.FAILED.toLowerCase() ||
        normalizedStatus === 'failed'
      ) {
        variant = 'destructive';
      } else {
        variant = 'pending';
      }
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {documentOverview && (
              <>
                <DialogHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <DialogTitle className="text-lg leading-none font-semibold break-words flex-1">
                          {documentOverview.title || 'Untitled Document'}
                        </DialogTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(
                            documentOverview.ingestionStatus,
                            'ingestion'
                          )}
                          {getStatusBadge(
                            documentOverview.extractionStatus,
                            'extraction'
                          )}
                        </div>
                      </div>
                      {documentOverview.summary && (
                        <DialogDescription className="text-muted-foreground text-sm leading-normal">
                          {documentOverview.summary}
                        </DialogDescription>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoCard
                      icon={<FileText className="h-4 w-4" />}
                      label="Type"
                      value={documentOverview.documentType || 'N/A'}
                    />
                    <InfoCard
                      icon={<Calendar className="h-4 w-4" />}
                      label="Created"
                      value={formatDate(documentOverview.createdAt)}
                    />
                    <InfoCard
                      icon={<Calendar className="h-4 w-4" />}
                      label="Updated"
                      value={formatDate(documentOverview.updatedAt)}
                    />
                    <InfoCard
                      icon={<User className="h-4 w-4" />}
                      label="Owner"
                      value={
                        documentOverview.ownerId?.slice(0, 8) + '...' || 'N/A'
                      }
                    />
                  </div>
                </div>

                <div className="px-6 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground text-sm leading-normal font-normal">
                      Document ID:
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(documentOverview.id, 'Document ID')
                      }
                      className="text-sm font-mono leading-normal text-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5 group"
                      title="Click to copy"
                    >
                      <span className="truncate max-w-[200px]">
                        {documentOverview.id}
                      </span>
                      <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                  {documentOverview.collectionIds &&
                    documentOverview.collectionIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm leading-normal font-normal">
                          Collections:
                        </span>
                        {documentOverview.collectionIds.map((id) => (
                          <button
                            key={id}
                            onClick={() => copyToClipboard(id, 'Collection ID')}
                            className="text-sm font-mono leading-normal text-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Click to copy"
                          >
                            {id.slice(0, 8)}...
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </>
            )}

            <div className="px-6 pb-6 flex-1 overflow-hidden flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full mb-4">
                  <TabsTrigger
                    value="chunks"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 gap-1.5"
                  >
                    <span>Chunks</span>
                    {chunksTotalEntries > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-[20px] px-1.5 text-xs font-normal"
                      >
                        {chunksTotalEntries}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="entities"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 gap-1.5"
                  >
                    <span>Entities</span>
                    {entitiesTotalEntries > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-[20px] px-1.5 text-xs font-normal"
                      >
                        {entitiesTotalEntries}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="relationships"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 gap-1.5"
                  >
                    <span>Relationships</span>
                    {relationshipsTotalEntries > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-[20px] px-1.5 text-xs font-normal"
                      >
                        {relationshipsTotalEntries}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="chunks"
                  className="mt-0 flex-1 overflow-y-auto"
                >
                  {chunksLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <ExpandableDocumentChunks
                        chunks={currentChunks}
                        onChunkDeleted={refreshChunks}
                        currentPage={chunksCurrentPage}
                        pageSize={10}
                      />
                      {chunksTotalPages > 1 && (
                        <div className="mt-4">
                          <TablePagination
                            currentPage={chunksCurrentPage}
                            totalPages={chunksTotalPages}
                            onPageChange={goToChunksPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                <TabsContent
                  value="entities"
                  className="mt-0 max-h-[500px] overflow-y-auto"
                >
                  {entitiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <ExpandableDocumentEntities entities={currentEntities} />
                      {entitiesTotalPages > 1 && (
                        <div className="mt-4">
                          <TablePagination
                            currentPage={entitiesCurrentPage}
                            totalPages={entitiesTotalPages}
                            onPageChange={goToEntitiesPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                <TabsContent
                  value="relationships"
                  className="mt-0 max-h-[500px] overflow-y-auto"
                >
                  {relationshipsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <ExpandableDocumentRelationships
                        relationships={currentRelationships}
                      />
                      {relationshipsTotalPages > 1 && (
                        <div className="mt-4">
                          <TablePagination
                            currentPage={relationshipsCurrentPage}
                            totalPages={relationshipsTotalPages}
                            onPageChange={goToRelationshipsPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// InfoCard Component for v0-style info display
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="text-muted-foreground flex-shrink-0 mt-0.5">{icon}</div>
    <div className="flex flex-col min-w-0 flex-1 gap-1">
      <span className="text-muted-foreground text-sm leading-normal font-normal">
        {label}
      </span>
      <span className="text-sm leading-snug font-medium truncate">{value}</span>
    </div>
  </div>
);

// InfoRow Component - v0 style
const InfoRow: React.FC<{
  label: string;
  value?: any;
  values?: { label?: string; value: any }[];
}> = ({ label, value, values }) => {
  const isLongContent =
    value?.length > 100 || values?.some((v) => v.value?.length > 100);

  return (
    <div
      className={`py-1 ${
        isLongContent
          ? 'flex flex-col gap-1.5'
          : 'flex items-center justify-between gap-4'
      }`}
    >
      <span className="text-muted-foreground text-sm leading-normal font-normal flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-sm leading-normal font-normal text-foreground ${
          isLongContent ? 'break-words' : 'truncate'
        }`}
      >
        {value !== undefined
          ? formatValue(value)
          : values
            ? values.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  {item.label && (
                    <span className="text-muted-foreground text-sm">
                      {item.label}:
                    </span>
                  )}
                  <span>{formatValue(item.value)}</span>
                </span>
              ))
            : 'N/A'}
      </span>
    </div>
  );
};

// ExpandableInfoRow Component - v0 style
const ExpandableInfoRow: React.FC<{
  label: string;
  values?: string[];
}> = ({ label, values }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <span>{values?.length ?? 0} items</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isExpanded && values && values.length > 0 && (
        <div className="mt-2 pl-4 space-y-1">
          {values.map((value, index) => (
            <div key={index} className="text-sm font-mono text-xs">
              {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ExpandableDocumentChunks Component
const ExpandableDocumentChunks: React.FC<{
  chunks: ChunkResponse[] | undefined;
  onChunkDeleted?: () => void;
  currentPage?: number;
  pageSize?: number;
}> = ({ chunks, onChunkDeleted, currentPage = 1, pageSize = 10 }) => {
  const [allExpanded, setAllExpanded] = useState(false);
  const [selectedChunks, setSelectedChunks] = useState<Set<string>>(new Set());

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  const toggleChunkSelection = (chunkId: string) => {
    setSelectedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!chunks) return;
    if (selectedChunks.size === chunks.length) {
      setSelectedChunks(new Set());
    } else {
      setSelectedChunks(new Set(chunks.map((c) => c.id)));
    }
  };

  if (!chunks || chunks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No chunks available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={chunks.length > 0 && selectedChunks.size === chunks.length}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all chunks"
            className="h-4 w-4"
          />
          <span className="text-xs text-muted-foreground">
            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAllExpanded}
          className="h-7 text-xs"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      <div className="space-y-2">
        {chunks.map((chunk, index) => (
          <ExpandableChunk
            key={chunk.id}
            chunk={chunk}
            index={(currentPage - 1) * pageSize + index}
            isExpanded={allExpanded}
            onDelete={onChunkDeleted}
            isSelected={selectedChunks.has(chunk.id)}
            onSelect={() => toggleChunkSelection(chunk.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableChunk Component
const ExpandableChunk: React.FC<{
  chunk: ChunkResponse;
  index: number;
  isExpanded: boolean;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ chunk, index, isExpanded, onDelete, isSelected = false, onSelect }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(chunk.text);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { getClient } = useUserContext();

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  // Abort editing when collapsing the chunk
  useEffect(() => {
    if (!localExpanded && isEditing) {
      // Abort the edit
      setIsEditing(false);
      setEditText(chunk.text);
    }
  }, [localExpanded, isEditing, chunk.text]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(chunk.text);
    setLocalExpanded(true); // Expand the chunk when editing
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditText(chunk.text);
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.chunks.update({
        id: chunk.id,
        text: editText,
        metadata: chunk.metadata,
      });
      setIsEditing(false);
      onDelete?.();
    } catch (error) {
      console.error('Error updating chunk:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Corrected to use chunk.id
      await client.chunks.delete({
        id: chunk.id,
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting chunk:', error);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const toggleMetadata = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMetadataExpanded(!metadataExpanded);
  };

  return (
    <Card className={`overflow-hidden ${isSelected ? 'bg-accent/50' : ''}`}>
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-md">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select chunk ${index + 1}`}
          />
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={toggleExpanded}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
              {chunk.metadata?.chunk_order ?? index + 1}
            </div>
            <span className="font-medium">
              Chunk {chunk.metadata?.chunk_order ?? index + 1}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && !deleting && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleExpanded}
          >
            {localExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {localExpanded && (
        <CardContent className="pt-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Chunk ID" value={chunk.id} />
            <InfoRow label="Document ID" value={chunk.documentId} />
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm leading-snug font-medium">Content</span>
              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm leading-normal text-foreground">
                  {chunk.text}
                </p>
              </div>
            )}
          </div>
          {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <button
                  className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={toggleMetadata}
                >
                  <span className="text-sm leading-snug font-medium">
                    Metadata
                  </span>
                  {metadataExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {metadataExpanded && (
                  <div className="mt-2 pl-4 space-y-2">
                    {Object.entries(chunk.metadata).map(([key, value]) => (
                      <InfoRow key={key} label={key} value={value} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this chunk?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The chunk will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

// ExpandableDocumentEntities Component
const ExpandableDocumentEntities: React.FC<{
  entities: EntityResponse[] | undefined;
  onChunkDeleted?: () => void;
}> = ({ entities }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!entities || entities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No entities available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted-foreground">
          {entities.length} entit{entities.length !== 1 ? 'ies' : 'y'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAllExpanded}
          className="h-7 text-xs"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      <div className="space-y-2">
        {entities.map((entity, index) => (
          <ExpandableEntity
            key={index}
            entity={entity}
            index={index}
            isExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableEntity Component
const ExpandableEntity: React.FC<{
  entity: EntityResponse;
  index: number;
  isExpanded: boolean;
}> = ({ entity, index, isExpanded }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
  };

  const toggleMetadata = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMetadataExpanded(!metadataExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-md"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{entity.name}</span>
            {entity.category && (
              <span className="text-xs text-muted-foreground">
                {entity.category}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleExpanded}
        >
          {localExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {localExpanded && (
        <CardContent className="pt-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Entity ID" value={entity.id} />
            <InfoRow label="Category" value={entity.category} />
          </div>
          {entity.chunkIds && entity.chunkIds.length > 0 && (
            <>
              <Separator />
              <ExpandableInfoRow label="Chunk IDs" values={entity.chunkIds} />
            </>
          )}
          {entity.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm leading-snug font-medium">
                  Description
                </span>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm leading-normal text-foreground">
                    {entity.description}
                  </p>
                </div>
              </div>
            </>
          )}
          {entity.metadata && Object.keys(entity.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <button
                  className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={toggleMetadata}
                >
                  <span className="text-sm leading-snug font-medium">
                    Metadata
                  </span>
                  {metadataExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {metadataExpanded && (
                  <div className="mt-2 pl-4 space-y-2">
                    {Object.entries(entity.metadata).map(([key, value]) => (
                      <InfoRow key={key} label={key} value={value} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// ExpandableDocumentRelationships Component
const ExpandableDocumentRelationships: React.FC<{
  relationships: RelationshipResponse[] | undefined;
  onChunkDeleted?: () => void;
}> = ({ relationships }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!relationships || relationships.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No relationships available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-muted-foreground">
          {relationships.length} relationship
          {relationships.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAllExpanded}
          className="h-7 text-xs"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      <div className="space-y-2">
        {relationships.map((relationship, index) => (
          <ExpandableRelationship
            key={index}
            relationship={relationship}
            index={index}
            isExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableEntity Component
const ExpandableRelationship: React.FC<{
  relationship: RelationshipResponse;
  index: number;
  isExpanded: boolean;
}> = ({ relationship, index, isExpanded }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
  };

  const toggleMetadata = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMetadataExpanded(!metadataExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-md"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{relationship.subject}</span>
              <Badge variant="outline" className="text-xs">
                {relationship.predicate}
              </Badge>
              <span className="font-medium">{relationship.object}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleExpanded}
        >
          {localExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {localExpanded && (
        <CardContent className="pt-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Relationship ID" value={relationship.id} />
            {relationship.weight !== undefined && (
              <InfoRow label="Weight" value={relationship.weight} />
            )}
            <InfoRow label="Subject ID" value={relationship.subjectId} />
            <InfoRow label="Object ID" value={relationship.objectId} />
          </div>
          {relationship.chunkIds && relationship.chunkIds.length > 0 && (
            <>
              <Separator />
              <ExpandableInfoRow
                label="Chunk IDs"
                values={relationship.chunkIds}
              />
            </>
          )}
          {relationship.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm leading-snug font-medium">
                  Description
                </span>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm leading-normal text-foreground">
                    {relationship.description}
                  </p>
                </div>
              </div>
            </>
          )}
          {relationship.metadata &&
            Object.keys(relationship.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <button
                    className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md transition-colors"
                    onClick={toggleMetadata}
                  >
                    <span className="text-sm font-medium">Metadata</span>
                    {metadataExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {metadataExpanded && (
                    <div className="mt-2 pl-4 space-y-2">
                      {Object.entries(relationship.metadata).map(
                        ([key, value]) => (
                          <InfoRow key={key} label={key} value={value} />
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
        </CardContent>
      )}
    </Card>
  );
};

export default DocumentInfoDialog;
