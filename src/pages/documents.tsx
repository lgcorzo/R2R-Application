import { DocumentResponse } from 'r2r-js';
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import debounce from '@/lib/debounce';
import logger from '@/lib/logger';
import { IngestionStatus } from '@/types';

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 500;
const MAX_DOCUMENTS_FOR_CLIENT_FILTERING = 1000; // Threshold for client-side filtering

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

const Index: React.FC = () => {
  const { getClient } = useUserContext();
  const [allDocuments, setAllDocuments] = useState<DocumentResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEntries, setTotalEntries] = useState<number>(0);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestionStatus: [...DEFAULT_INGESTION_STATUSES],
    extractionStatus: [...DEFAULT_EXTRACTION_STATUSES],
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Track if we're using client-side filtering (when filters/search are active)
  const [useClientSideFiltering, setUseClientSideFiltering] =
    useState<boolean>(false);

  // Ref to track if we need to load all documents
  const shouldLoadAllDocuments = useRef(false);

  /**
   * Check if filters are active (not all default values selected)
   */
  const hasActiveFilters = useMemo(() => {
    const hasIngestionFilter =
      filters.ingestionStatus.length !== DEFAULT_INGESTION_STATUSES.length ||
      !DEFAULT_INGESTION_STATUSES.every((status) =>
        filters.ingestionStatus.includes(status)
      );
    const hasExtractionFilter =
      filters.extractionStatus.length !== DEFAULT_EXTRACTION_STATUSES.length ||
      !DEFAULT_EXTRACTION_STATUSES.every((status) =>
        filters.extractionStatus.includes(status)
      );
    const hasSearch = debouncedSearchQuery.trim().length > 0;

    return hasIngestionFilter || hasExtractionFilter || hasSearch;
  }, [filters, debouncedSearchQuery]);

  /**
   * Fetch documents with server-side pagination (when no filters/search)
   */
  const fetchDocumentsPaginated = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const response = await client.documents.list({
        offset: offset,
        limit: ITEMS_PER_PAGE,
      });

      setDocuments(response.results);
      setTotalEntries(response.totalEntries);
      setAllDocuments([]); // Clear all documents when using pagination
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching documents', error as Error, {
        page: currentPage,
        mode: 'paginated',
      });
      setLoading(false);
    }
  }, [getClient, currentPage]);

  /**
   * Fetch all documents for client-side filtering
   */
  const fetchAllDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let allDocs: DocumentResponse[] = [];
      let offset = 0;
      const limit = 100; // Fetch in batches
      let total = 0;

      // Fetch first batch to get total
      const firstBatch = await client.documents.list({
        offset: 0,
        limit: limit,
      });
      total = firstBatch.totalEntries;
      allDocs = firstBatch.results;

      // If total is reasonable, fetch all documents
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
        // If too many documents, show warning and limit to first batch
        logger.warn('Too many documents for client-side filtering', {
          total,
          maxAllowed: MAX_DOCUMENTS_FOR_CLIENT_FILTERING,
        });
      }

      setAllDocuments(allDocs);
      setTotalEntries(total);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching all documents', error as Error, {
        mode: 'all',
      });
      setLoading(false);
    }
  }, [getClient]);

  /**
   * Apply client-side filtering and pagination
   */
  const filteredDocuments = useMemo(() => {
    if (!useClientSideFiltering) {
      // When using server-side pagination, return documents as-is
      return documents;
    }

    // Apply filters and search to all documents
    let filtered = [...allDocuments];

    // Apply ingestion status filter
    if (
      filters.ingestionStatus &&
      filters.ingestionStatus.length > 0 &&
      filters.ingestionStatus.length !== DEFAULT_INGESTION_STATUSES.length
    ) {
      filtered = filtered.filter((doc) =>
        filters.ingestionStatus.includes(doc.ingestionStatus)
      );
    }

    // Apply extraction status filter
    if (
      filters.extractionStatus &&
      filters.extractionStatus.length > 0 &&
      filters.extractionStatus.length !== DEFAULT_EXTRACTION_STATUSES.length
    ) {
      filtered = filtered.filter((doc) =>
        filters.extractionStatus.includes(doc.extractionStatus)
      );
    }

    // Apply search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
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
    filters,
    debouncedSearchQuery,
    useClientSideFiltering,
  ]);

  /**
   * Paginate filtered documents for display
   */
  const paginatedDocuments = useMemo(() => {
    if (!useClientSideFiltering) {
      return filteredDocuments;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredDocuments.slice(startIndex, endIndex);
  }, [filteredDocuments, currentPage, useClientSideFiltering]);

  /**
   * Calculate total entries for pagination
   */
  const displayTotalEntries = useMemo(() => {
    if (useClientSideFiltering) {
      return filteredDocuments.length;
    }
    return totalEntries;
  }, [filteredDocuments.length, totalEntries, useClientSideFiltering]);

  /**
   * Debounced search handler
   */
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedSearchQuery(query);
      }, SEARCH_DEBOUNCE_MS),
    []
  );

  /**
   * Effect: Determine if we need client-side filtering
   */
  useEffect(() => {
    const needsClientFiltering = hasActiveFilters;
    setUseClientSideFiltering(needsClientFiltering);
    shouldLoadAllDocuments.current = needsClientFiltering;
  }, [hasActiveFilters]);

  /**
   * Effect: Fetch documents based on filtering mode
   */
  useEffect(() => {
    if (useClientSideFiltering) {
      fetchAllDocuments();
    } else {
      fetchDocumentsPaginated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useClientSideFiltering, currentPage]);

  /**
   * Effect: Reset to page 1 when filters/search change
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchQuery]);

  /**
   * Effect: Handle pending documents
   */
  useEffect(() => {
    const pending = (useClientSideFiltering ? allDocuments : documents)
      .filter(
        (doc) =>
          doc.ingestionStatus !== IngestionStatus.SUCCESS &&
          doc.ingestionStatus !== IngestionStatus.FAILED
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents, allDocuments, useClientSideFiltering]);

  /**
   * Handle selection
   */
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedDocumentIds(paginatedDocuments.map((doc) => doc.id));
      } else {
        setSelectedDocumentIds([]);
      }
    },
    [paginatedDocuments]
  );

  const handleSelectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedDocumentIds((prev) => {
      if (selected) {
        return [...prev, itemId];
      } else {
        return prev.filter((id) => id !== itemId);
      }
    });
  }, []);

  /**
   * Handle filters and search
   */
  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSearchHandler(value);
    },
    [debouncedSearchHandler]
  );

  /**
   * Handle column visibility
   */
  const handleToggleColumn = useCallback(
    (columnKey: string, isVisible: boolean) => {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
    },
    []
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Refresh documents
   */
  const refetchDocuments = useCallback(async () => {
    if (useClientSideFiltering) {
      await fetchAllDocuments();
    } else {
      await fetchDocumentsPaginated();
    }
    setSelectedDocumentIds([]);
  }, [useClientSideFiltering, fetchAllDocuments, fetchDocumentsPaginated]);

  return (
    <Layout pageTitle="Documents" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 p-4 h-full">
            <DocumentsTable
              documents={paginatedDocuments}
              loading={loading}
              onRefresh={refetchDocuments}
              pendingDocuments={pendingDocuments}
              setPendingDocuments={setPendingDocuments}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={selectedDocumentIds}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
              totalEntries={displayTotalEntries}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              searchQuery={searchQuery}
              onSearchQueryChange={(query: string) => {
                setSearchQuery(query);
                debouncedSearchHandler(query);
              }}
              middleContent={
                <div className="w-full px-2">
                  <input
                    type="text"
                    placeholder="Search by Title or Document ID"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-2 focus:outline-none"
                  />
                </div>
              }
            />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
