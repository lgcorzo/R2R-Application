'use client';

import { format, parseISO } from 'date-fns';
import {
  Calendar,
  ChevronRight,
  Copy,
  Download,
  Edit,
  FileText,
  Loader2,
  MoreVertical,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/router';
import {
  ChunkResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
} from 'r2r-js';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
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
import { Separator } from '@/components/ui/separator';
import { ShadcnButton as Button } from '@/components/ui/ShadcnButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { IngestionStatus, KGExtractionStatus } from '@/types';

const ITEMS_PER_PAGE = 20;

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, 'PPpp');
  } catch {
    return dateString;
  }
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getStatusBadge = (
  status: string | undefined,
  type: 'ingestion' | 'extraction'
) => {
  if (!status) return null;

  let variant: 'success' | 'destructive' | 'pending' | 'secondary' =
    'secondary';

  const normalizedStatus = status.toLowerCase();

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

const DocumentsDetailPage: React.FC = () => {
  const router = useRouter();
  const { getClient, authState } = useUserContext();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // Filters
  const [ingestionStatusFilter, setIngestionStatusFilter] = useState<string[]>(
    []
  );
  const [extractionStatusFilter, setExtractionStatusFilter] = useState<
    string[]
  >([]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const response = await client.documents.list({
        limit: 100,
        offset: 0,
      });

      setDocuments(response.results || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [authState.isAuthenticated, getClient, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-select document from query parameter
  useEffect(() => {
    const documentId = router.query.id as string;
    if (documentId && documents.length > 0 && !selectedDocument) {
      const doc = documents.find((d) => d.id === documentId);
      if (doc) {
        setSelectedDocument(doc);
      }
    }
  }, [router.query.id, documents, selectedDocument]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query) ||
          doc.summary?.toLowerCase().includes(query)
      );
    }

    // Ingestion status filter
    if (ingestionStatusFilter.length > 0) {
      filtered = filtered.filter((doc) =>
        ingestionStatusFilter.includes(doc.ingestionStatus)
      );
    }

    // Extraction status filter
    if (extractionStatusFilter.length > 0) {
      filtered = filtered.filter((doc) =>
        extractionStatusFilter.includes(doc.extractionStatus)
      );
    }

    return filtered;
  }, [documents, searchQuery, ingestionStatusFilter, extractionStatusFilter]);

  const handleDocumentSelect = (document: DocumentResponse) => {
    setSelectedDocument(document);
  };

  const handleDownload = async (document: DocumentResponse) => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const blob = await client.documents.download({ id: document.id });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title || document.id;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Downloading ${document.title || document.id}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (document: DocumentResponse) => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.documents.delete({ id: document.id });
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      fetchDocuments();
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Documents List */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={
                ingestionStatusFilter.length === 0
                  ? 'all'
                  : ingestionStatusFilter[0]
              }
              onValueChange={(value) =>
                setIngestionStatusFilter(value === 'all' ? [] : [value])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ingestion Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                extractionStatusFilter.length === 0
                  ? 'all'
                  : extractionStatusFilter[0]
              }
              onValueChange={(value) =>
                setExtractionStatusFilter(value === 'all' ? [] : [value])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Extraction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No documents found
              </p>
            </div>
          ) : (
            <ItemGroup>
              {filteredDocuments.map((doc, index) => (
                <React.Fragment key={doc.id}>
                  <Item
                    variant={
                      selectedDocument?.id === doc.id ? 'muted' : 'default'
                    }
                    className="cursor-pointer"
                    onClick={() => handleDocumentSelect(doc)}
                  >
                    <ItemMedia variant="icon">
                      <FileText className="h-4 w-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">
                        {doc.title || doc.id}
                      </ItemTitle>
                      {doc.summary && (
                        <ItemDescription className="line-clamp-2">
                          {doc.summary}
                        </ItemDescription>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(doc.ingestionStatus, 'ingestion')}
                        {getStatusBadge(doc.extractionStatus, 'extraction')}
                      </div>
                    </ItemContent>
                    <ItemActions>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setInfoDialogOpen(true);
                              setSelectedDocument(doc);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </ItemActions>
                  </Item>
                  {index < filteredDocuments.length - 1 && <ItemSeparator />}
                </React.Fragment>
              ))}
            </ItemGroup>
          )}
        </ScrollArea>
      </div>

      {/* Right Content - Document Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedDocument ? (
          <DocumentDetailsView document={selectedDocument} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Select a document</p>
              <p className="text-sm text-muted-foreground">
                Choose a document from the list to view details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document Info Dialog */}
      {selectedDocument && (
        <DocumentInfoDialog
          id={selectedDocument.id}
          open={infoDialogOpen}
          onClose={() => setInfoDialogOpen(false)}
        />
      )}
    </div>
  );
};

// Document Details View Component
const DocumentDetailsView: React.FC<{ document: DocumentResponse }> = ({
  document,
}) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

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
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching chunks:', error);
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
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching entities:', error);
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
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching relationships:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, document.id]
  );

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
    pageSize: 10,
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
    pageSize: 10,
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
    pageSize: 10,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg leading-none font-semibold break-words">
                {document.title || 'Untitled Document'}
              </h1>
              {document.summary && (
                <p className="text-muted-foreground text-sm leading-normal mt-2">
                  {document.summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(document.ingestionStatus, 'ingestion')}
              {getStatusBadge(document.extractionStatus, 'extraction')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chunks">
              Chunks {chunksTotal > 0 && `(${chunksTotal})`}
            </TabsTrigger>
            <TabsTrigger value="entities">
              Entities {entitiesTotal > 0 && `(${entitiesTotal})`}
            </TabsTrigger>
            <TabsTrigger value="relationships">
              Relationships{' '}
              {relationshipsTotal > 0 && `(${relationshipsTotal})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Document Information</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Document ID</FieldLabel>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                        {document.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(document.id, 'Document ID')
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Type</FieldLabel>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {document.documentType || 'N/A'}
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Size</FieldLabel>
                      <span className="text-sm">
                        {formatFileSize(
                          (document as any).sizeInBytes ||
                            (document as any).size_in_bytes
                        )}
                      </span>
                    </Field>

                    <Field>
                      <FieldLabel>Created</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(document.createdAt)}
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Updated</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(document.updatedAt)}
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Owner</FieldLabel>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">
                          {document.ownerId?.slice(0, 8)}...
                        </span>
                      </div>
                    </Field>
                  </div>

                  {document.collectionIds &&
                    document.collectionIds.length > 0 && (
                      <Field>
                        <FieldLabel>Collections</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                          {document.collectionIds.map((id) => (
                            <Badge
                              key={id}
                              variant="outline"
                              className="text-xs"
                            >
                              {id.slice(0, 8)}...
                            </Badge>
                          ))}
                        </div>
                      </Field>
                    )}
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="chunks" className="mt-6">
            {chunksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chunks && chunks.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chunks.map((chunk, index) => (
                      <TableRow key={chunk.id}>
                        <TableCell className="font-mono text-xs">
                          {(chunksPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2">{chunk.text}</p>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(chunk.text, 'Chunk content')
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {chunksTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToChunksPage(chunksPage - 1)}
                      disabled={chunksPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {chunksPage} of {chunksTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToChunksPage(chunksPage + 1)}
                      disabled={chunksPage === chunksTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No chunks available
              </div>
            )}
          </TabsContent>

          <TabsContent value="entities" className="mt-6">
            {entitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : entities && entities.length > 0 ? (
              <div className="space-y-4">
                <ItemGroup>
                  {entities.map((entity, index) => (
                    <React.Fragment key={entity.id}>
                      <Item variant="outline">
                        <ItemContent>
                          <ItemTitle>{entity.name}</ItemTitle>
                          {entity.category && (
                            <ItemDescription>
                              Category: {entity.category}
                            </ItemDescription>
                          )}
                          {entity.description && (
                            <ItemDescription className="mt-1">
                              {entity.description}
                            </ItemDescription>
                          )}
                        </ItemContent>
                      </Item>
                      {index < entities.length - 1 && <ItemSeparator />}
                    </React.Fragment>
                  ))}
                </ItemGroup>
                {entitiesTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToEntitiesPage(entitiesPage - 1)}
                      disabled={entitiesPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {entitiesPage} of {entitiesTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToEntitiesPage(entitiesPage + 1)}
                      disabled={entitiesPage === entitiesTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No entities available
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="mt-6">
            {relationshipsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : relationships && relationships.length > 0 ? (
              <div className="space-y-4">
                <ItemGroup>
                  {relationships.map((relationship, index) => (
                    <React.Fragment key={relationship.id}>
                      <Item variant="outline">
                        <ItemContent>
                          <ItemTitle>
                            <span className="font-medium">
                              {relationship.subject}
                            </span>{' '}
                            <Badge variant="outline" className="mx-2">
                              {relationship.predicate}
                            </Badge>{' '}
                            <span className="font-medium">
                              {relationship.object}
                            </span>
                          </ItemTitle>
                          {relationship.description && (
                            <ItemDescription className="mt-1">
                              {relationship.description}
                            </ItemDescription>
                          )}
                        </ItemContent>
                      </Item>
                      {index < relationships.length - 1 && <ItemSeparator />}
                    </React.Fragment>
                  ))}
                </ItemGroup>
                {relationshipsTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        goToRelationshipsPage(relationshipsPage - 1)
                      }
                      disabled={relationshipsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {relationshipsPage} of {relationshipsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        goToRelationshipsPage(relationshipsPage + 1)
                      }
                      disabled={relationshipsPage === relationshipsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No relationships available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default DocumentsDetailPage;
