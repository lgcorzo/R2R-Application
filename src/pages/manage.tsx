import { CollectionResponse, DocumentResponse } from 'r2r-js';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { AppSidebar } from '@/components/AppSidebar';
import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import CollectionCreationModal from '@/components/ChatDemo/utils/collectionCreationModal';
import { ContainerObjectCard } from '@/components/ContainerObjectCard';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/context/UserContext';
import debounce from '@/lib/debounce';
import logger from '@/lib/logger';
import { IngestionStatus } from '@/types';

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 500;
const MAX_DOCUMENTS_FOR_CLIENT_FILTERING = 1000;

// Default filter values (all options selected = no filter)
const DEFAULT_INGESTION_STATUSES = [
  'pending',
  'parsing',
  'extracting',
  'chunking',
  'embedding',
  'augmenting',
  'storing',
  'enriching',
  'failed',
  'success',
];

const DEFAULT_EXTRACTION_STATUSES = [
  'success',
  'failed',
  'pending',
  'processing',
];

const ManagePage: React.FC = () => {
  const { getClient, authState } = useUserContext();
  const [activeTab, setActiveTab] = useState<'documents' | 'collections'>(
    'documents'
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  // Documents state
  const [allDocuments, setAllDocuments] = useState<DocumentResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(true);
  const [totalDocumentEntries, setTotalDocumentEntries] = useState<number>(0);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      title: true,
      id: true,
      ownerId: true,
      collectionIds: false,
      ingestionStatus: true,
      extractionStatus: true,
      documentType: false,
      metadata: false,
      version: false,
      createdAt: true,
      updatedAt: false,
    }
  );
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [debouncedDocumentSearchQuery, setDebouncedDocumentSearchQuery] =
    useState('');
  const [documentFilters, setDocumentFilters] = useState<Record<string, any>>({
    ingestionStatus: [...DEFAULT_INGESTION_STATUSES],
    extractionStatus: [...DEFAULT_EXTRACTION_STATUSES],
  });
  const [documentCurrentPage, setDocumentCurrentPage] = useState<number>(1);
  const [useClientSideDocumentFiltering, setUseClientSideDocumentFiltering] =
    useState<boolean>(false);

  // Collections state
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [personalCollections, setPersonalCollections] = useState<
    CollectionResponse[]
  >([]);
  const [sharedCollections, setSharedCollections] = useState<
    CollectionResponse[]
  >([]);
  const [collectionsLoading, setCollectionsLoading] = useState<boolean>(true);
  const [personalTotalEntries, setPersonalTotalEntries] = useState<number>(0);
  const [accessibleTotalEntries, setAccessibleTotalEntries] =
    useState<number>(0);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [currentPersonalPage, setCurrentPersonalPage] = useState(1);
  const [currentSharedPage, setCurrentSharedPage] = useState(1);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  /**
   * Check if document filters are active
   */
  const hasActiveDocumentFilters = useMemo(() => {
    const hasIngestionFilter =
      documentFilters.ingestionStatus.length !==
        DEFAULT_INGESTION_STATUSES.length ||
      !DEFAULT_INGESTION_STATUSES.every((status) =>
        documentFilters.ingestionStatus.includes(status)
      );
    const hasExtractionFilter =
      documentFilters.extractionStatus.length !==
        DEFAULT_EXTRACTION_STATUSES.length ||
      !DEFAULT_EXTRACTION_STATUSES.every((status) =>
        documentFilters.extractionStatus.includes(status)
      );
    const hasSearch = debouncedDocumentSearchQuery.trim().length > 0;

    return hasIngestionFilter || hasExtractionFilter || hasSearch;
  }, [documentFilters, debouncedDocumentSearchQuery]);

  /**
   * Fetch documents with server-side pagination
   */
  const fetchDocumentsPaginated = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const offset = (documentCurrentPage - 1) * ITEMS_PER_PAGE;
      const response = await client.documents.list({
        offset: offset,
        limit: ITEMS_PER_PAGE,
      });

      setDocuments(response.results);
      setTotalDocumentEntries(response.totalEntries);
      setAllDocuments([]);
      setDocumentsLoading(false);
    } catch (error) {
      logger.error('Error fetching documents', error as Error, {
        page: documentCurrentPage,
        mode: 'paginated',
      });
      setDocumentsLoading(false);
    }
  }, [getClient, documentCurrentPage]);

  /**
   * Fetch all documents for client-side filtering
   */
  const fetchAllDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let allDocs: DocumentResponse[] = [];
      let offset = 0;
      const limit = 100;
      let total = 0;

      const firstBatch = await client.documents.list({
        offset: 0,
        limit: limit,
      });
      total = firstBatch.totalEntries;
      allDocs = firstBatch.results;

      if (total <= MAX_DOCUMENTS_FOR_CLIENT_FILTERING) {
        offset = limit;
        while (offset < total) {
          const batch = await client.documents.list({
            offset: offset,
            limit: limit,
          });
          allDocs = allDocs.concat(batch.results);
          offset += limit;
        }
      } else {
        logger.warn('Too many documents for client-side filtering', {
          total,
          maxAllowed: MAX_DOCUMENTS_FOR_CLIENT_FILTERING,
        });
      }

      setAllDocuments(allDocs);
      setTotalDocumentEntries(total);
      setDocumentsLoading(false);
    } catch (error) {
      logger.error('Error fetching all documents', error as Error, {
        mode: 'all',
      });
      setDocumentsLoading(false);
    }
  }, [getClient]);

  /**
   * Apply client-side filtering to documents
   */
  const filteredDocuments = useMemo(() => {
    if (!useClientSideDocumentFiltering) {
      return documents;
    }

    let filtered = [...allDocuments];

    if (
      documentFilters.ingestionStatus &&
      documentFilters.ingestionStatus.length > 0 &&
      documentFilters.ingestionStatus.length !==
        DEFAULT_INGESTION_STATUSES.length
    ) {
      filtered = filtered.filter((doc) =>
        documentFilters.ingestionStatus.includes(doc.ingestionStatus)
      );
    }

    if (
      documentFilters.extractionStatus &&
      documentFilters.extractionStatus.length > 0 &&
      documentFilters.extractionStatus.length !==
        DEFAULT_EXTRACTION_STATUSES.length
    ) {
      filtered = filtered.filter((doc) =>
        documentFilters.extractionStatus.includes(doc.extractionStatus)
      );
    }

    if (debouncedDocumentSearchQuery.trim()) {
      const query = debouncedDocumentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((doc) => {
        const title = doc.title ? String(doc.title).toLowerCase() : '';
        const id = doc.id ? String(doc.id).toLowerCase() : '';
        return title.includes(query) || id.includes(query);
      });
    }

    return filtered;
  }, [
    allDocuments,
    documents,
    documentFilters,
    debouncedDocumentSearchQuery,
    useClientSideDocumentFiltering,
  ]);

  /**
   * Paginate filtered documents
   */
  const paginatedDocuments = useMemo(() => {
    if (!useClientSideDocumentFiltering) {
      return filteredDocuments;
    }

    const startIndex = (documentCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredDocuments.slice(startIndex, endIndex);
  }, [filteredDocuments, documentCurrentPage, useClientSideDocumentFiltering]);

  /**
   * Calculate total entries for documents
   */
  const displayDocumentTotalEntries = useMemo(() => {
    if (useClientSideDocumentFiltering) {
      return filteredDocuments.length;
    }
    return totalDocumentEntries;
  }, [
    filteredDocuments.length,
    totalDocumentEntries,
    useClientSideDocumentFiltering,
  ]);

  /**
   * Debounced search handler for documents
   */
  const debouncedDocumentSearchHandler = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedDocumentSearchQuery(query);
      }, SEARCH_DEBOUNCE_MS),
    []
  );

  /**
   * Fetch collections
   */
  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('No authenticated client');
      }

      const userId = authState.userId || '';

      const [personalBatch, accessibleBatch] = await Promise.all([
        client.users.listCollections({
          id: userId,
          offset: 0,
          limit: 1000,
        }),
        client.collections.list({ offset: 0, limit: 1000 }),
      ]);

      setPersonalTotalEntries(personalBatch.totalEntries);
      setAccessibleTotalEntries(accessibleBatch.totalEntries);

      const personalIds = new Set(personalBatch.results.map((col) => col.id));
      const shared = accessibleBatch.results.filter(
        (col) => !personalIds.has(col.id)
      );

      setPersonalCollections(personalBatch.results);
      setSharedCollections(shared);
      setCollections(accessibleBatch.results);
    } catch (error) {
      logger.error('Error fetching collections', error as Error);
      setPersonalCollections([]);
      setSharedCollections([]);
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  }, [getClient, authState.userId]);

  /**
   * Filter collections by search query
   */
  const filteredPersonalCollections = useMemo(() => {
    if (!collectionSearchQuery.trim()) {
      return personalCollections;
    }
    const query = collectionSearchQuery.toLowerCase();
    return personalCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [personalCollections, collectionSearchQuery]);

  const filteredSharedCollections = useMemo(() => {
    if (!collectionSearchQuery.trim()) {
      return sharedCollections;
    }
    const query = collectionSearchQuery.toLowerCase();
    return sharedCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [sharedCollections, collectionSearchQuery]);

  /**
   * Effects
   */
  useEffect(() => {
    setUseClientSideDocumentFiltering(hasActiveDocumentFilters);
  }, [hasActiveDocumentFilters]);

  useEffect(() => {
    if (useClientSideDocumentFiltering) {
      fetchAllDocuments();
    } else {
      fetchDocumentsPaginated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useClientSideDocumentFiltering, documentCurrentPage]);

  useEffect(() => {
    setDocumentCurrentPage(1);
  }, [documentFilters, debouncedDocumentSearchQuery]);

  useEffect(() => {
    const pending = (useClientSideDocumentFiltering ? allDocuments : documents)
      .filter(
        (doc) =>
          doc.ingestionStatus !== IngestionStatus.SUCCESS &&
          doc.ingestionStatus !== IngestionStatus.FAILED
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents, allDocuments, useClientSideDocumentFiltering]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  /**
   * Document handlers
   */
  const handleDocumentSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedDocumentIds(paginatedDocuments.map((doc) => doc.id));
      } else {
        setSelectedDocumentIds([]);
      }
    },
    [paginatedDocuments]
  );

  const handleDocumentSelectItem = useCallback(
    (itemId: string, selected: boolean) => {
      setSelectedDocumentIds((prev) => {
        if (selected) {
          return [...prev, itemId];
        } else {
          return prev.filter((id) => id !== itemId);
        }
      });
    },
    []
  );

  const handleDocumentFiltersChange = useCallback(
    (newFilters: Record<string, any>) => {
      setDocumentFilters(newFilters);
    },
    []
  );

  const handleDocumentSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDocumentSearchQuery(value);
      debouncedDocumentSearchHandler(value);
    },
    [debouncedDocumentSearchHandler]
  );

  const handleDocumentPageChange = useCallback((page: number) => {
    setDocumentCurrentPage(page);
  }, []);

  const handleDocumentToggleColumn = useCallback(
    (columnKey: string, isVisible: boolean) => {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
    },
    []
  );

  const refetchDocuments = useCallback(async () => {
    if (useClientSideDocumentFiltering) {
      await fetchAllDocuments();
    } else {
      await fetchDocumentsPaginated();
    }
    setSelectedDocumentIds([]);
  }, [
    useClientSideDocumentFiltering,
    fetchAllDocuments,
    fetchDocumentsPaginated,
  ]);

  /**
   * Collection handlers
   */
  const handleCollectionCreated = useCallback(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleAllDocumentsClick = useCallback(() => {
    setSelectedCollectionId(null);
    setActiveTab('documents');
  }, []);

  const handleCollectionClick = useCallback(
    (collectionId: string | null) => {
      if (collectionId === null) {
        handleAllDocumentsClick();
        return;
      }
      setSelectedCollectionId(collectionId);
      setActiveTab('collections');
    },
    [handleAllDocumentsClick]
  );

  return (
    <Layout pageTitle="Manage" includeFooter={false}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar
          collapsible="icon"
          className="border-r border-zinc-700"
          personalCollections={personalCollections}
          sharedCollections={sharedCollections}
          selectedCollectionId={selectedCollectionId}
          onCollectionClick={handleCollectionClick}
          onAllDocumentsClick={handleAllDocumentsClick}
          searchQuery={collectionSearchQuery}
          onSearchChange={setCollectionSearchQuery}
        />

        <SidebarInset className="flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-700 bg-zinc-900 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-2xl font-bold text-white">Manage</h1>
          </header>

          {/* Tabs Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'documents' | 'collections')
              }
              className="h-full flex flex-col"
            >
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
              </TabsList>

              <TabsContent
                value="documents"
                className="flex-1 overflow-auto mt-4 px-4"
              >
                <DocumentsTable
                  documents={paginatedDocuments}
                  loading={documentsLoading}
                  onRefresh={refetchDocuments}
                  pendingDocuments={pendingDocuments}
                  setPendingDocuments={setPendingDocuments}
                  onSelectAll={handleDocumentSelectAll}
                  onSelectItem={handleDocumentSelectItem}
                  selectedItems={selectedDocumentIds}
                  visibleColumns={visibleColumns}
                  onToggleColumn={handleDocumentToggleColumn}
                  totalEntries={displayDocumentTotalEntries}
                  currentPage={documentCurrentPage}
                  onPageChange={handleDocumentPageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                  filters={documentFilters}
                  onFiltersChange={handleDocumentFiltersChange}
                  searchQuery={documentSearchQuery}
                  onSearchQueryChange={(query: string) => {
                    setDocumentSearchQuery(query);
                    debouncedDocumentSearchHandler(query);
                  }}
                  middleContent={
                    <div className="w-full px-2">
                      <input
                        type="text"
                        placeholder="Search by Title or Document ID"
                        value={documentSearchQuery}
                        onChange={handleDocumentSearchInputChange}
                        className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-2 focus:outline-none"
                      />
                    </div>
                  }
                />
              </TabsContent>

              <TabsContent
                value="collections"
                className="flex-1 overflow-auto mt-4 px-4"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Collections
                    </h2>
                    <Button onClick={() => setIsCollectionModalOpen(true)}>
                      New Collection
                    </Button>
                  </div>

                  <div className="mb-4">
                    <Input
                      placeholder="Search by Name or Collection ID"
                      value={collectionSearchQuery}
                      onChange={(e) => setCollectionSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {filteredPersonalCollections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Your Collections
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredPersonalCollections.map((collection) => (
                          <ContainerObjectCard
                            key={collection.id}
                            containerObject={collection}
                            className="w-full h-[120px]"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredSharedCollections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Shared With You
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredSharedCollections.map((collection) => (
                          <ContainerObjectCard
                            key={collection.id}
                            containerObject={collection}
                            className="w-full h-[120px]"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPersonalCollections.length === 0 &&
                    filteredSharedCollections.length === 0 &&
                    !collectionsLoading && (
                      <div className="text-center text-zinc-400 py-12">
                        No collections found
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>

        <CollectionCreationModal
          open={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
          onCollectionCreated={handleCollectionCreated}
        />
      </SidebarProvider>
    </Layout>
  );
};

export default ManagePage;
