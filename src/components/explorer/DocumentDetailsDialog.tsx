'use client';

import { format, parseISO } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Edit,
  FileText,
  Folder,
  Loader2,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import {
  ChunkResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
} from 'r2r-js';
import React, { useCallback, useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { IngestionStatus, KGExtractionStatus } from '@/types';

// Format file size helper
function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Format date helper
function formatDateHelper(dateString: string | undefined) {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, 'PPpp');
  } catch {
    return dateString;
  }
}

interface DocumentDetailsDialogProps {
  document: DocumentResponse;
  open: boolean;
  onClose: () => void;
}

export function DocumentDetailsDialog({
  document,
  open,
  onClose,
}: DocumentDetailsDialogProps) {
  const { getClient } = useUserContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  // Preload totals state to fix badges immediately
  const [preloadedTotals, setPreloadedTotals] = useState<{
    chunks: number;
    entities: number;
    relationships: number;
  }>({ chunks: 0, entities: 0, relationships: 0 });

  // Delete confirmation dialogs
  const [deleteChunkId, setDeleteChunkId] = useState<string | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit states
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editChunkText, setEditChunkText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (
    status: string | undefined,
    type: 'ingestion' | 'extraction'
  ) => {
    if (!status) return null;

    let variant: 'default' | 'destructive' | 'secondary' | 'outline' =
      'secondary';

    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase();

    if (type === 'ingestion') {
      // Check for success
      if (
        normalizedStatus === IngestionStatus.SUCCESS.toLowerCase() ||
        normalizedStatus === 'success'
      ) {
        variant = 'default';
      }
      // Check for failed
      else if (
        normalizedStatus === IngestionStatus.FAILED.toLowerCase() ||
        normalizedStatus === 'failed'
      ) {
        variant = 'destructive';
      }
      // Check for pending/intermediate statuses
      else {
        variant = 'secondary';
      }
    } else {
      // Check for success
      if (
        normalizedStatus === KGExtractionStatus.SUCCESS.toLowerCase() ||
        normalizedStatus === 'success'
      ) {
        variant = 'default';
      }
      // Check for failed
      else if (
        normalizedStatus === KGExtractionStatus.FAILED.toLowerCase() ||
        normalizedStatus === 'failed'
      ) {
        variant = 'destructive';
      }
      // Check for pending/processing
      else {
        variant = 'secondary';
      }
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  // Fetch chunks
  const fetchChunks = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listChunks({
          id: document.id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results || [],
          totalEntries: response.totalEntries || 0,
        };
      } catch (error: any) {
        console.error('Error fetching chunks:', error);
        setError(error?.message || 'Failed to fetch chunks');
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, document.id]
  );

  // Fetch entities
  const fetchEntities = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listEntities({
          id: document.id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results || [],
          totalEntries: response.totalEntries || 0,
        };
      } catch (error: any) {
        console.error('Error fetching entities:', error);
        setError(error?.message || 'Failed to fetch entities');
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, document.id]
  );

  // Fetch relationships
  const fetchRelationships = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listRelationships({
          id: document.id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results || [],
          totalEntries: response.totalEntries || 0,
        };
      } catch (error: any) {
        console.error('Error fetching relationships:', error);
        setError(error?.message || 'Failed to fetch relationships');
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, document.id]
  );

  // Page size state for each tab
  const [chunksPageSize, setChunksPageSize] = useState(25);
  const [entitiesPageSize, setEntitiesPageSize] = useState(25);
  const [relationshipsPageSize, setRelationshipsPageSize] = useState(25);

  // Pagination hooks
  const {
    data: chunks,
    totalItems: chunksTotal,
    loading: chunksLoading,
    goToPage: goToChunksPage,
    currentPage: chunksPage,
    totalPages: chunksTotalPages,
  } = usePagination<ChunkResponse>({
    key: `chunks-${document.id}`,
    fetchData: fetchChunks,
    initialPage: 1,
    pageSize: chunksPageSize,
  });

  const {
    data: entities,
    totalItems: entitiesTotal,
    loading: entitiesLoading,
    goToPage: goToEntitiesPage,
    currentPage: entitiesPage,
    totalPages: entitiesTotalPages,
  } = usePagination<EntityResponse>({
    key: `entities-${document.id}`,
    fetchData: fetchEntities,
    initialPage: 1,
    pageSize: entitiesPageSize,
  });

  const {
    data: relationships,
    totalItems: relationshipsTotal,
    loading: relationshipsLoading,
    goToPage: goToRelationshipsPage,
    currentPage: relationshipsPage,
    totalPages: relationshipsTotalPages,
  } = usePagination<RelationshipResponse>({
    key: `relationships-${document.id}`,
    fetchData: fetchRelationships,
    initialPage: 1,
    pageSize: relationshipsPageSize,
  });

  // Reset page sizes when dialog opens
  useEffect(() => {
    if (open) {
      setChunksPageSize(25);
      setEntitiesPageSize(25);
      setRelationshipsPageSize(25);
    }
  }, [open]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  // Delete chunk
  const handleDeleteChunk = async () => {
    if (!deleteChunkId) return;

    setIsDeleting(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.chunks.delete({ id: deleteChunkId });

      toast({
        title: 'Success',
        description: 'Chunk deleted successfully',
      });

      // Refresh chunks
      goToChunksPage(chunksPage);
      setDeleteChunkId(null);
    } catch (error: any) {
      console.error('Error deleting chunk:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete chunk',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete entity
  const handleDeleteEntity = async () => {
    if (!deleteEntityId) return;

    setIsDeleting(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Try to delete entity via graphs API
      // Note: This might require collectionId, so we'll try document's collectionIds
      if (document.collectionIds && document.collectionIds.length > 0) {
        await client.graphs.removeEntity({
          collectionId: document.collectionIds[0],
          entityId: deleteEntityId,
        });
      } else {
        throw new Error('Document has no collection IDs');
      }

      toast({
        title: 'Success',
        description: 'Entity deleted successfully',
      });

      // Refresh entities
      goToEntitiesPage(entitiesPage);
      setDeleteEntityId(null);
    } catch (error: any) {
      console.error('Error deleting entity:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete entity',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Update chunk
  const handleUpdateChunk = async () => {
    if (!editingChunkId) return;

    setIsUpdating(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Get current chunk to preserve metadata
      const currentChunk = chunks?.find((c) => c.id === editingChunkId);
      if (!currentChunk) {
        throw new Error('Chunk not found');
      }

      await client.chunks.update({
        id: editingChunkId,
        text: editChunkText,
        metadata: currentChunk.metadata || {},
      });

      toast({
        title: 'Success',
        description: 'Chunk updated successfully',
      });

      // Refresh chunks
      goToChunksPage(chunksPage);
      setEditingChunkId(null);
      setEditChunkText('');
    } catch (error: any) {
      console.error('Error updating chunk:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update chunk',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Вычисляем реальный extractionStatus на основе наличия entities/relationships
  // Если есть данные - значит extraction SUCCESS, независимо от статуса с бэкенда
  const getActualExtractionStatus = (): string | undefined => {
    if (preloadedTotals.entities > 0 || preloadedTotals.relationships > 0) {
      return KGExtractionStatus.SUCCESS;
    }
    return document.extractionStatus;
  };

  // Reset error and preload totals when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setActiveTab('overview');
      // Preload totals for all tabs to fix badges immediately
      // This ensures badges show numbers right away instead of animating in
      const preloadTotals = async () => {
        try {
          const [chunksResult, entitiesResult, relationshipsResult] =
            await Promise.all([
              fetchChunks(0, 1),
              fetchEntities(0, 1),
              fetchRelationships(0, 1),
            ]);
          setPreloadedTotals({
            chunks: chunksResult.totalEntries,
            entities: entitiesResult.totalEntries,
            relationships: relationshipsResult.totalEntries,
          });
        } catch (err) {
          console.error('Error preloading totals:', err);
        }
      };
      preloadTotals();
    } else {
      // Reset preloaded totals when dialog closes
      setPreloadedTotals({ chunks: 0, entities: 0, relationships: 0 });
    }
  }, [open, fetchChunks, fetchEntities, fetchRelationships]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-lg font-semibold leading-tight">
              {document.title || 'Untitled Document'}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(document.ingestionStatus, 'ingestion')}
              {getStatusBadge(getActualExtractionStatus(), 'extraction')}
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col min-h-0 border-t"
        >
          <div className="px-6 pt-4 pb-3 border-b relative">
            <TabsList className="w-full bg-transparent h-auto p-0 gap-1">
              <TabsTrigger
                value="overview"
                className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-0 rounded-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-12px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="chunks"
                className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-0 rounded-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-12px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Chunks
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[1.25rem] px-1.5 text-xs font-medium flex-shrink-0 bg-muted border"
                >
                  {preloadedTotals.chunks > 0
                    ? preloadedTotals.chunks
                    : chunksTotal > 0
                      ? chunksTotal
                      : chunksLoading
                        ? '...'
                        : 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="entities"
                className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-0 rounded-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-12px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Entities
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[1.25rem] px-1.5 text-xs font-medium flex-shrink-0 bg-muted border"
                >
                  {preloadedTotals.entities > 0
                    ? preloadedTotals.entities
                    : entitiesTotal > 0
                      ? entitiesTotal
                      : entitiesLoading
                        ? '...'
                        : 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="relationships"
                className="relative data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-0 rounded-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-12px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Relationships
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[1.25rem] px-1.5 text-xs font-medium flex-shrink-0 bg-muted border"
                >
                  {preloadedTotals.relationships > 0
                    ? preloadedTotals.relationships
                    : relationshipsTotal > 0
                      ? relationshipsTotal
                      : relationshipsLoading
                        ? '...'
                        : 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Description */}
              {document.summary && (
                <div className="space-y-1.5 pb-3 border-b">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {document.summary}
                  </p>
                </div>
              )}

              {/* Document Information - Compact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {/* Document ID */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Document ID
                  </div>
                  <button
                    onClick={() => copyToClipboard(document.id, 'Document ID')}
                    className="group flex items-center w-full"
                    title="Click to copy"
                  >
                    <Badge
                      variant="secondary"
                      className="bg-muted/40 border border-border/50 font-mono text-[11px] px-2 py-1 h-7 w-full justify-start hover:bg-muted/60 transition-colors"
                    >
                      <FileText className="h-3 w-3 mr-1.5 shrink-0 opacity-60" />
                      <span className="flex-1 truncate text-left text-[11px]">
                        {document.id.length > 22
                          ? `${document.id.slice(0, 22)}...`
                          : document.id}
                      </span>
                      <Copy className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </Badge>
                  </button>
                </div>

                {/* Owner */}
                {document.ownerId && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Owner
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(document.ownerId!, 'Owner ID')
                      }
                      className="group flex items-center w-full"
                      title="Click to copy"
                    >
                      <Badge
                        variant="secondary"
                        className="bg-muted/40 border border-border/50 font-mono text-[11px] px-2 py-1 h-7 w-full justify-start hover:bg-muted/60 transition-colors"
                      >
                        <User className="h-3 w-3 mr-1.5 shrink-0 opacity-60" />
                        <span className="flex-1 truncate text-left text-[11px]">
                          {document.ownerId.length > 22
                            ? `${document.ownerId.slice(0, 22)}...`
                            : document.ownerId}
                        </span>
                        <Copy className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      </Badge>
                    </button>
                  </div>
                )}

                {/* Type */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </div>
                  <div className="flex items-center gap-1.5 text-sm h-7">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-foreground">
                      {document.documentType || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Size
                  </div>
                  <div className="text-sm text-foreground h-7 flex items-center">
                    {formatFileSize(
                      (document as any).sizeInBytes ||
                        (document as any).size_in_bytes
                    )}
                  </div>
                </div>

                {/* Version */}
                {(document as any).version && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Version
                    </div>
                    <div className="text-sm font-mono text-foreground h-7 flex items-center">
                      {(document as any).version}
                    </div>
                  </div>
                )}

                {/* Created */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </div>
                  <div className="flex items-center gap-1.5 text-sm h-7">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-foreground">
                      {formatDateHelper(document.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Updated */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Updated
                  </div>
                  <div className="flex items-center gap-1.5 text-sm h-7">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-foreground">
                      {formatDateHelper(document.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Attempts */}
                {(document as any).ingestion_attempt_number !== undefined && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Attempts
                    </div>
                    <div className="text-sm text-foreground h-7 flex items-center">
                      {(document as any).ingestion_attempt_number}
                    </div>
                  </div>
                )}

                {/* Metadata - исключая version */}
                {(document as any).metadata &&
                  Object.entries((document as any).metadata)
                    .filter(([key]) => key.toLowerCase() !== 'version')
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {key}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm h-7">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="break-words flex-1 text-foreground line-clamp-1">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>

              {/* Collection IDs - в самом низу, последними */}
              {document.collectionIds && document.collectionIds.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Collection IDs
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {document.collectionIds.map((id, index) => (
                      <button
                        key={id}
                        onClick={() => copyToClipboard(id, 'Collection ID')}
                        className="group flex items-center"
                        title="Click to copy"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-muted/40 border border-border/50 font-mono text-[11px] px-2 py-1 h-7 hover:bg-muted/60 transition-colors"
                        >
                          {index === 0 && (
                            <Folder className="h-3 w-3 mr-1.5 shrink-0 opacity-60" />
                          )}
                          <span className="max-w-[200px] truncate text-[11px]">
                            {id.length > 24 ? `${id.slice(0, 24)}...` : id}
                          </span>
                          <Copy className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chunks" className="mt-4 space-y-3">
              {chunksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chunks && chunks.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {chunksTotal > 0
                        ? `Showing ${(chunksPage - 1) * chunksPageSize + 1} to ${Math.min(chunksPage * chunksPageSize, chunksTotal)} of ${chunksTotal} chunks`
                        : 'No chunks available'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Per page:
                      </span>
                      <Select
                        value={chunksPageSize.toString()}
                        onValueChange={(value) => {
                          setChunksPageSize(Number.parseInt(value));
                          goToChunksPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="pr-2">
                      <Accordion type="single" collapsible className="w-full">
                        {chunks.map((chunk, index) => {
                          const chunkNumber =
                            (chunksPage - 1) * chunksPageSize + index + 1;
                          const metadataCount =
                            chunk.metadata &&
                            Object.keys(chunk.metadata).length > 0
                              ? Object.keys(chunk.metadata).length
                              : 0;
                          return (
                            <AccordionItem
                              key={chunk.id}
                              value={`chunk-${chunk.id}`}
                              className="border-b"
                            >
                              <AccordionTrigger className="py-3 px-0 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      Chunk {chunkNumber}
                                    </span>
                                    {metadataCount > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs font-normal"
                                      >
                                        {metadataCount} metadata field
                                        {metadataCount !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  <div
                                    className="flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentChunk = chunks?.find(
                                          (c) => c.id === chunk.id
                                        );
                                        if (currentChunk) {
                                          setEditChunkText(
                                            currentChunk.text || ''
                                          );
                                          setEditingChunkId(chunk.id);
                                        }
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Edit chunk
                                      </span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteChunkId(chunk.id);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Delete chunk
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-0 pb-3">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {chunk.text || 'No content'}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </ScrollArea>
                  {chunksTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <div className="text-sm text-muted-foreground">
                        Page {chunksPage} of {chunksTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToChunksPage(1)}
                          disabled={chunksPage === 1 || chunksLoading}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToChunksPage(chunksPage - 1)}
                          disabled={chunksPage === 1 || chunksLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select
                          value={chunksPage.toString()}
                          onValueChange={(value) =>
                            goToChunksPage(Number.parseInt(value))
                          }
                          disabled={chunksLoading}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: chunksTotalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <SelectItem key={page} value={page.toString()}>
                                {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                          of {chunksTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToChunksPage(chunksPage + 1)}
                          disabled={
                            chunksPage === chunksTotalPages || chunksLoading
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToChunksPage(chunksTotalPages)}
                          disabled={
                            chunksPage === chunksTotalPages || chunksLoading
                          }
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No chunks available
                </div>
              )}
            </TabsContent>

            <TabsContent value="entities" className="mt-4 space-y-3">
              {entitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : entities && entities.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {entitiesTotal > 0
                        ? `Showing ${(entitiesPage - 1) * entitiesPageSize + 1} to ${Math.min(entitiesPage * entitiesPageSize, entitiesTotal)} of ${entitiesTotal} entities`
                        : 'No entities available'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Per page:
                      </span>
                      <Select
                        value={entitiesPageSize.toString()}
                        onValueChange={(value) => {
                          setEntitiesPageSize(Number.parseInt(value));
                          goToEntitiesPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="pr-2">
                      <Accordion type="single" collapsible className="w-full">
                        {entities.map((entity) => {
                          return (
                            <AccordionItem
                              key={entity.id}
                              value={`entity-${entity.id}`}
                              className="border-b"
                            >
                              <AccordionTrigger className="py-2.5 px-0 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-foreground font-medium">
                                      {entity.name}
                                    </span>
                                    {entity.category && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {entity.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <div
                                    className="flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteEntityId(entity.id);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Delete entity
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-0 pb-2.5">
                                {entity.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {entity.description}
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </ScrollArea>
                  {entitiesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <div className="text-sm text-muted-foreground">
                        Page {entitiesPage} of {entitiesTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToEntitiesPage(1)}
                          disabled={entitiesPage === 1 || entitiesLoading}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToEntitiesPage(entitiesPage - 1)}
                          disabled={entitiesPage === 1 || entitiesLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select
                          value={entitiesPage.toString()}
                          onValueChange={(value) =>
                            goToEntitiesPage(Number.parseInt(value))
                          }
                          disabled={entitiesLoading}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: entitiesTotalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <SelectItem key={page} value={page.toString()}>
                                {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                          of {entitiesTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToEntitiesPage(entitiesPage + 1)}
                          disabled={
                            entitiesPage === entitiesTotalPages ||
                            entitiesLoading
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToEntitiesPage(entitiesTotalPages)}
                          disabled={
                            entitiesPage === entitiesTotalPages ||
                            entitiesLoading
                          }
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No entities available
                </div>
              )}
            </TabsContent>

            <TabsContent value="relationships" className="mt-4 space-y-3">
              {relationshipsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : relationships && relationships.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {relationshipsTotal > 0
                        ? `Showing ${(relationshipsPage - 1) * relationshipsPageSize + 1} to ${Math.min(relationshipsPage * relationshipsPageSize, relationshipsTotal)} of ${relationshipsTotal} relationships`
                        : 'No relationships available'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Per page:
                      </span>
                      <Select
                        value={relationshipsPageSize.toString()}
                        onValueChange={(value) => {
                          setRelationshipsPageSize(Number.parseInt(value));
                          goToRelationshipsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="pr-2">
                      <Accordion type="single" collapsible className="w-full">
                        {relationships.map((relationship) => {
                          return (
                            <AccordionItem
                              key={relationship.id}
                              value={`relationship-${relationship.id}`}
                              className="border-b"
                            >
                              <AccordionTrigger className="py-2.5 px-0 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-foreground font-medium">
                                      {relationship.subject}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-normal"
                                    >
                                      {relationship.predicate}
                                    </Badge>
                                    <span className="text-sm text-foreground">
                                      {relationship.object}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-0 pb-2.5">
                                {relationship.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {relationship.description}
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </ScrollArea>
                  {relationshipsTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <div className="text-sm text-muted-foreground">
                        Page {relationshipsPage} of {relationshipsTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToRelationshipsPage(1)}
                          disabled={
                            relationshipsPage === 1 || relationshipsLoading
                          }
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            goToRelationshipsPage(relationshipsPage - 1)
                          }
                          disabled={
                            relationshipsPage === 1 || relationshipsLoading
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select
                          value={relationshipsPage.toString()}
                          onValueChange={(value) =>
                            goToRelationshipsPage(Number.parseInt(value))
                          }
                          disabled={relationshipsLoading}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: relationshipsTotalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <SelectItem key={page} value={page.toString()}>
                                {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                          of {relationshipsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            goToRelationshipsPage(relationshipsPage + 1)
                          }
                          disabled={
                            relationshipsPage === relationshipsTotalPages ||
                            relationshipsLoading
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            goToRelationshipsPage(relationshipsTotalPages)
                          }
                          disabled={
                            relationshipsPage === relationshipsTotalPages ||
                            relationshipsLoading
                          }
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No relationships available
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>

      {/* Delete Chunk Confirmation Dialog */}
      <AlertDialog
        open={deleteChunkId !== null}
        onOpenChange={(open) => !open && setDeleteChunkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chunk</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chunk? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChunk}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entity Confirmation Dialog */}
      <AlertDialog
        open={deleteEntityId !== null}
        onOpenChange={(open) => !open && setDeleteEntityId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entity? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntity}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Chunk Dialog */}
      <Dialog
        open={editingChunkId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChunkId(null);
            setEditChunkText('');
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Chunk</DialogTitle>
            <DialogDescription>
              Edit the text content of this chunk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editChunkText}
              onChange={(e) => setEditChunkText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Enter chunk text..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingChunkId(null);
                setEditChunkText('');
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateChunk} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
