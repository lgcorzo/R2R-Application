import { CollectionResponse, DocumentResponse } from 'r2r-js';
import { useState, useEffect } from 'react';

import { useUserContext } from '@/context/UserContext';
import useDebounce from '@/hooks/use-debounce';

// Unified search result type
export type SearchResultItem = {
  type: 'document' | 'collection' | 'entity' | 'relationship' | 'community';
  id: string;
  title: string;
  description?: string;
  metadata?: any;
  data: any;
};

export interface UseUnifiedSearchOptions {
  searchQuery: string;
  isSearchFocused: boolean;
  files: DocumentResponse[];
  collections: CollectionResponse[];
  debounceMs?: number;
}

export interface UseUnifiedSearchResult {
  searchResults: SearchResultItem[];
  isSearching: boolean;
  debouncedSearchQuery: string;
}

/**
 * Custom hook for unified search across documents, entities, relationships, communities, and collections
 *
 * Features:
 * - Global search using R2R retrieval API (not limited to current collection)
 * - Semantic + fulltext search
 * - Prioritization by entity type and relevance
 * - Diversity filtering (max 3 per type, 8 total)
 * - Triple fallback mechanism for reliability
 * - Recent files shown when no query
 *
 * @param options - Search configuration options
 * @returns Search results, loading state, and debounced query
 */
export function useUnifiedSearch({
  searchQuery,
  isSearchFocused,
  files,
  collections,
  debounceMs = 300,
}: UseUnifiedSearchOptions): UseUnifiedSearchResult {
  const { getClient } = useUserContext();
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  // Enhanced search with all entity types
  useEffect(() => {
    if (!isSearchFocused) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        // Show recent files when no query (from current view, not global)
        const recentFiles: SearchResultItem[] = files
          .slice(0, 5)
          .map((file) => ({
            type: 'document',
            id: file.id,
            title: file.title || file.id,
            description: file.metadata?.description,
            metadata: file.metadata,
            data: file,
          }));
        setSearchResults(recentFiles);
        return;
      }

      setIsSearching(true);

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        // Perform unified search using R2R retrieval API (GLOBAL - not limited to collection)
        const searchResponse = await client.retrieval.search({
          query: debouncedSearchQuery,
          searchSettings: {
            use_semantic_search: true,
            use_fulltext_search: true,
            limit: 10,
          },
        });

        const results: SearchResultItem[] = [];

        // Process document/chunk results - GLOBAL SEARCH (not limited to selected collection)
        if (searchResponse.results?.chunkSearchResults) {
          const seenDocs = new Set<string>();
          searchResponse.results.chunkSearchResults.forEach((chunk: any) => {
            if (chunk.document_id && !seenDocs.has(chunk.document_id)) {
              seenDocs.add(chunk.document_id);

              // Try to find in local files first (for metadata)
              let doc = files.find((f) => f.id === chunk.document_id);

              // If not found locally, create document object from chunk data (global search)
              if (!doc) {
                doc = {
                  id: chunk.document_id,
                  title: chunk.metadata?.title || chunk.document_id,
                  collectionIds: chunk.collection_ids || [],
                  ingestionStatus:
                    chunk.metadata?.ingestion_status || 'unknown',
                  extractionStatus:
                    chunk.metadata?.extraction_status || 'unknown',
                  metadata: chunk.metadata || {},
                } as DocumentResponse;
              }

              results.push({
                type: 'document',
                id: doc.id,
                title: doc.title || doc.id,
                description: chunk.text?.substring(0, 100),
                metadata: {
                  score: chunk.score,
                  collectionIds: chunk.collection_ids,
                  ...chunk.metadata,
                },
                data: doc,
              });
            }
          });
        }

        // Process graph results (entities, relationships, communities)
        if (searchResponse.results?.graphSearchResults) {
          searchResponse.results.graphSearchResults.forEach(
            (graphResult: any) => {
              const content = graphResult.content || {};
              const resultType =
                graphResult.resultType || graphResult.result_type;

              if (resultType === 'entity') {
                results.push({
                  type: 'entity',
                  id: content.id || content.name,
                  title: content.name || 'Unknown Entity',
                  description: content.description || content.category,
                  metadata: {
                    category: content.category,
                    ...graphResult.metadata,
                  },
                  data: content,
                });
              } else if (resultType === 'relationship') {
                results.push({
                  type: 'relationship',
                  id:
                    graphResult.id ||
                    `${content.subject}-${content.predicate}-${content.object}`,
                  title: `${content.subject} ${content.predicate} ${content.object}`,
                  description: content.description || content.predicate,
                  metadata: graphResult.metadata,
                  data: content,
                });
              } else if (resultType === 'community') {
                results.push({
                  type: 'community',
                  id: content.id || content.community_number?.toString(),
                  title:
                    content.name || `Community ${content.community_number}`,
                  description: content.summary || content.description,
                  metadata: { level: content.level, ...graphResult.metadata },
                  data: content,
                });
              }
            }
          );
        }

        // Also search in local collections
        const normalizedQuery = debouncedSearchQuery.toLowerCase().trim();
        collections.forEach((collection) => {
          if (
            collection.name?.toLowerCase().includes(normalizedQuery) ||
            collection.id?.toLowerCase().includes(normalizedQuery)
          ) {
            // Calculate relevance score for collection
            let collectionScore = 0.5; // Base score
            const collectionName = (
              collection.name || collection.id
            ).toLowerCase();

            // Exact match boost
            if (collectionName === normalizedQuery) {
              collectionScore = 1.0;
            } else if (collectionName.startsWith(normalizedQuery)) {
              collectionScore = 0.8;
            } else if (collectionName.includes(normalizedQuery)) {
              collectionScore = 0.6;
            }

            // Description boost
            if (collection.description) {
              collectionScore += 0.1;
            }

            results.push({
              type: 'collection',
              id: collection.id,
              title: collection.name || collection.id,
              description: collection.description,
              metadata: { score: collectionScore },
              data: collection,
            });
          }
        });

        // Prioritize and sort results
        const prioritizeResults = (
          results: SearchResultItem[]
        ): SearchResultItem[] => {
          return results
            .map((result) => {
              let priority = 0;
              const query = normalizedQuery;
              const title = result.title.toLowerCase();

              // Base priority by entity type
              const typeWeights: Record<string, number> = {
                document: 100, // Highest priority - most actionable
                collection: 90, // High priority - organizational
                entity: 70, // Medium-high - knowledge graph
                relationship: 60, // Medium - connections
                community: 50, // Lower - aggregated data
              };
              priority += typeWeights[result.type] || 0;

              // Score boost (from API or calculated)
              if (result.metadata?.score !== undefined) {
                priority += result.metadata.score * 50; // Scale API score (0-1) to 0-50
              }

              // Exact match boost
              if (title === query) {
                priority += 30;
              } else if (title.startsWith(query)) {
                priority += 20;
              } else if (title.includes(query)) {
                priority += 10;
              }

              // Description quality boost
              if (result.description && result.description.length > 20) {
                priority += 5;
              }

              // Title quality boost (has meaningful title vs just ID)
              if (result.title !== result.id && result.title.length > 3) {
                priority += 5;
              }

              // Status boost for documents (successful ingestion/extraction)
              if (result.type === 'document' && result.data) {
                const doc = result.data as DocumentResponse;
                if (doc.ingestionStatus === 'success') priority += 10;
                if (doc.extractionStatus === 'success') priority += 5;
              }

              return { ...result, metadata: { ...result.metadata, priority } };
            })
            .sort((a, b) => {
              const priorityA = a.metadata?.priority || 0;
              const priorityB = b.metadata?.priority || 0;
              return priorityB - priorityA; // Descending order
            });
        };

        const prioritizedResults = prioritizeResults(results);

        // Limit to 8 results total, but ensure diversity
        const finalResults: SearchResultItem[] = [];
        const typeCounts: Record<string, number> = {
          document: 0,
          collection: 0,
          entity: 0,
          relationship: 0,
          community: 0,
        };
        const maxPerType = 3; // Max 3 results per type

        for (const result of prioritizedResults) {
          if (finalResults.length >= 8) break;

          if (typeCounts[result.type] < maxPerType) {
            finalResults.push(result);
            typeCounts[result.type]++;
          }
        }

        // Fill remaining slots with highest priority results
        if (finalResults.length < 8) {
          for (const result of prioritizedResults) {
            if (finalResults.length >= 8) break;
            if (
              !finalResults.find(
                (r) => r.id === result.id && r.type === result.type
              )
            ) {
              finalResults.push(result);
            }
          }
        }

        setSearchResults(finalResults);
      } catch (error) {
        console.error('Error performing search:', error);
        // Fallback: try to search globally via documents.list API
        try {
          const client = await getClient();
          if (client) {
            const normalizedQuery = debouncedSearchQuery.toLowerCase().trim();
            // Global search - get all documents, not just from selected collection
            const allDocsResponse = await client.documents.list({
              limit: 50,
              offset: 0,
            });
            const allDocs = allDocsResponse?.results || [];
            const filtered = allDocs.filter(
              (file) =>
                file.title?.toLowerCase().includes(normalizedQuery) ||
                file.id?.toLowerCase().includes(normalizedQuery)
            );
            setSearchResults(
              filtered.slice(0, 8).map((file) => ({
                type: 'document' as const,
                id: file.id,
                title: file.title || file.id,
                description: file.metadata?.description,
                metadata: file.metadata,
                data: file,
              }))
            );
          } else {
            // Last resort: local file search (limited to current collection)
            const normalizedQuery = debouncedSearchQuery.toLowerCase().trim();
            const filtered = files.filter(
              (file) =>
                file.title?.toLowerCase().includes(normalizedQuery) ||
                file.id?.toLowerCase().includes(normalizedQuery)
            );
            setSearchResults(
              filtered.slice(0, 5).map((file) => ({
                type: 'document' as const,
                id: file.id,
                title: file.title || file.id,
                description: file.metadata?.description,
                metadata: file.metadata,
                data: file,
              }))
            );
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, isSearchFocused, files, collections, getClient]);

  return {
    searchResults,
    isSearching,
    debouncedSearchQuery,
  };
}
