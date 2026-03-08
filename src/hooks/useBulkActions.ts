import { DocumentResponse } from 'r2r-js';
import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus, KGExtractionStatus } from '@/types';

interface UseBulkActionsOptions {
  onSuccess?: () => void;
}

/** Статистика для extract операции */
export interface ExtractStats {
  selectedCount: number;
  eligibleCount: number;
  alreadyExtractedCount: number;
  failedExtractionCount: number;
  notIngestedCount: number;
}

export function useBulkActions(
  files: DocumentResponse[],
  selectedIds: string[],
  options: UseBulkActionsOptions = {}
) {
  const { onSuccess } = options;
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const getSelectedFiles = useCallback(() => {
    return files.filter((f) => selectedIds.includes(f.id));
  }, [files, selectedIds]);

  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await client.documents.delete({ id });
          successCount++;
        } catch {
          failCount++;
        }
      }

      toast({
        title: 'Delete Complete',
        description: `${successCount} deleted${failCount > 0 ? `, ${failCount} failed` : ''}.`,
      });

      onSuccess?.();
    } catch (error: unknown) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, getClient, toast, onSuccess]);

  /**
   * Вычисляет статистику для extract операции
   * Используется для отображения в ExtractConfirmDialog
   */
  const getExtractStats = useCallback((): ExtractStats => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));

    const eligibleFiles = selectedFiles.filter(
      (f) => f.ingestionStatus === IngestionStatus.SUCCESS
    );

    const alreadyExtracted = eligibleFiles.filter(
      (f) => f.extractionStatus === KGExtractionStatus.SUCCESS
    );

    const failedExtraction = eligibleFiles.filter(
      (f) => f.extractionStatus === KGExtractionStatus.FAILED
    );

    const notIngested = selectedFiles.filter(
      (f) => f.ingestionStatus !== IngestionStatus.SUCCESS
    );

    return {
      selectedCount: selectedFiles.length,
      eligibleCount: eligibleFiles.length,
      alreadyExtractedCount: alreadyExtracted.length,
      failedExtractionCount: failedExtraction.length,
      notIngestedCount: notIngested.length,
    };
  }, [selectedIds, files]);

  const bulkExtract = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      // Filter only successfully ingested documents
      const eligibleIds = selectedIds.filter((id) => {
        const file = files.find((f) => f.id === id);
        return file && file.ingestionStatus === IngestionStatus.SUCCESS;
      });

      if (eligibleIds.length === 0) {
        toast({
          title: 'No Eligible Documents',
          description: 'Only successfully ingested documents can be extracted.',
          variant: 'destructive',
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const id of eligibleIds) {
        try {
          await client.documents.extract({ id });
          successCount++;
          await new Promise((r) => setTimeout(r, 300)); // Rate limiting
        } catch {
          failCount++;
        }
      }

      toast({
        title: 'Extraction Started',
        description: `${successCount} queued${failCount > 0 ? `, ${failCount} failed` : ''}.`,
      });

      onSuccess?.();
    } catch (error: unknown) {
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, files, getClient, toast, onSuccess]);

  const bulkMove = useCallback(
    async (targetCollectionId: string, sourceCollectionId?: string | null) => {
      if (selectedIds.length === 0) return;
      setIsProcessing(true);

      try {
        const client = await getClient();
        if (!client) throw new Error('Failed to get client');

        // Add to target collection
        await Promise.all(
          selectedIds.map((id) =>
            client.collections.addDocument({
              id: targetCollectionId,
              documentId: id,
            })
          )
        );

        // Remove from source if specified
        if (sourceCollectionId) {
          await Promise.all(
            selectedIds.map((id) =>
              client.collections.removeDocument({
                id: sourceCollectionId,
                documentId: id,
              })
            )
          );
        }

        toast({
          title: 'Move Complete',
          description: `${selectedIds.length} document(s) moved.`,
        });

        onSuccess?.();
      } catch (error: unknown) {
        toast({
          title: 'Move Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, getClient, toast, onSuccess]
  );

  const bulkCopy = useCallback(
    async (targetCollectionId: string) => {
      if (selectedIds.length === 0) return;
      setIsProcessing(true);

      try {
        const client = await getClient();
        if (!client) throw new Error('Failed to get client');

        await Promise.all(
          selectedIds.map((id) =>
            client.collections.addDocument({
              id: targetCollectionId,
              documentId: id,
            })
          )
        );

        toast({
          title: 'Copy Complete',
          description: `${selectedIds.length} document(s) copied.`,
        });

        onSuccess?.();
      } catch (error: unknown) {
        toast({
          title: 'Copy Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, getClient, toast, onSuccess]
  );

  const bulkDownload = useCallback(async () => {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      for (const file of selectedFiles) {
        try {
          const response = await client.documents.download({ id: file.id });
          const blob = new Blob([response as BlobPart]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.title || file.id;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Failed to download ${file.title}:`, error);
        }
      }

      toast({
        title: 'Download Complete',
        description: `${selectedFiles.length} file(s) downloaded.`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [getSelectedFiles, getClient, toast]);

  return {
    isProcessing,
    bulkDelete,
    bulkExtract,
    bulkMove,
    bulkCopy,
    bulkDownload,
    getSelectedFiles,
    getExtractStats,
  };
}
