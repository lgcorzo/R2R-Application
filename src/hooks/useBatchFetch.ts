import { useCallback, useEffect, useState } from 'react';

interface BatchFetchOptions<T> {
  fetchFn: (params: {
    offset: number;
    limit: number;
  }) => Promise<{ results: T[]; totalEntries: number }>;
  collectionId: string | null;
  enabled: boolean;
  pageSize?: number;
}

interface BatchFetchResult<T> {
  data: T[];
  totalEntries: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBatchFetch<T>({
  fetchFn,
  collectionId,
  enabled,
  pageSize = 100,
}: BatchFetchOptions<T>): BatchFetchResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!enabled || !collectionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch first batch
      const firstBatch = await fetchFn({
        offset: 0,
        limit: pageSize,
      });

      if (firstBatch.results.length === 0) {
        setData([]);
        setTotalEntries(0);
        setLoading(false);
        return;
      }

      setTotalEntries(firstBatch.totalEntries);
      setData(firstBatch.results);
      setLoading(false);

      // Fetch remaining batches in background
      let offset = pageSize;
      let allData = [...firstBatch.results];

      while (offset < firstBatch.totalEntries) {
        const batch = await fetchFn({
          offset,
          limit: pageSize,
        });

        if (batch.results.length === 0) {
          break;
        }

        allData = allData.concat(batch.results);
        setData([...allData]);

        offset += pageSize;
      }
    } catch (err) {
      console.error('Batch fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [fetchFn, collectionId, enabled, pageSize]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { data, totalEntries, loading, error, refetch };
}
