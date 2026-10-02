import { Search, X } from 'lucide-react';
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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    debouncedSearchHandler('');
  }, [debouncedSearchHandler]);

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
      <div className="w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-5 max-w-[1700px] mx-auto overflow-y-auto">
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
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search documents by title, ID, or content..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full pl-10 pr-16 py-2 text-sm bg-white/[0.04] hover:bg-white/[0.06] text-foreground placeholder:text-slate-500 rounded-xl border border-white/[0.08] focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:bg-[#0c1222] transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white/[0.06] border border-white/[0.08] rounded shadow-sm">
                  /
                </kbd>
              </div>
            </div>
          }
        />
      </div>
    </Layout>
  );
};

export default Index;
