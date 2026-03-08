import { useState, useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { getFileNameOnly } from '@/lib/explorer-utils';
import { FileUploadStatus, UploadQuality } from '@/types/explorer';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  file: string;
  success: boolean;
  documentId?: string;
  error?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onSuccess, onError } = options;
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, FileUploadStatus>
  >({});
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadStatus((prev) => {
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadStatus({});
    setProgress(0);
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
  }, []);

  const uploadSingleFile = async (
    file: File,
    baseUrl: string,
    accessToken: string,
    metadata: Record<string, unknown>,
    collectionIds: string[],
    quality: UploadQuality,
    signal: AbortSignal
  ): Promise<UploadResult> => {
    const fileNameOnly = getFileNameOnly(file.name);
    const fileMetadata = { title: fileNameOnly, ...metadata };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ingestion_mode', quality);
    formData.append('run_with_orchestration', 'true');

    if (Object.keys(fileMetadata).length > 0) {
      formData.append('metadata', JSON.stringify(fileMetadata));
    }

    if (collectionIds.length > 0) {
      formData.append('collection_ids', JSON.stringify(collectionIds));
    }

    try {
      const response = await fetch(`${baseUrl}/v3/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }

        // Handle 409 Conflict - document already exists
        if (response.status === 409) {
          const errorMessage = errorData?.detail || JSON.stringify(errorData);
          const uuidMatch = errorMessage.match(
            /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
          );

          if (uuidMatch) {
            await fetch(`${baseUrl}/v3/documents/${uuidMatch[1]}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            const retryResponse = await fetch(`${baseUrl}/v3/documents`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
              signal,
            });

            if (retryResponse.ok) {
              const result = await retryResponse.json();
              return {
                file: file.name,
                success: true,
                documentId: result?.results?.id || result?.results?.document_id,
              };
            }
          }
          return {
            file: file.name,
            success: false,
            error: `Document already exists`,
          };
        }

        return {
          file: file.name,
          success: false,
          error: `HTTP ${response.status}: ${errorData?.detail || errorText}`,
        };
      }

      const result = await response.json();
      return {
        file: file.name,
        success: true,
        documentId: result?.results?.id || result?.results?.document_id,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { file: file.name, success: false, error: 'Upload cancelled' };
      }
      return {
        file: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const upload = useCallback(
    async (
      collectionIds: string[],
      quality: UploadQuality,
      metadata: Record<string, unknown>
    ) => {
      if (files.length === 0 || isUploading) return;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsUploading(true);

      // Initialize status
      const initialStatus: Record<string, FileUploadStatus> = {};
      files.forEach((file) => {
        initialStatus[file.name] = { progress: 0, status: 'pending' };
      });
      setUploadStatus(initialStatus);

      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        let baseUrl = '';
        const pipelineStr = localStorage.getItem('pipeline');
        if (pipelineStr) {
          const pipeline = JSON.parse(pipelineStr);
          baseUrl = pipeline?.deploymentUrl || '';
        }
        if (
          !baseUrl &&
          window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL
        ) {
          baseUrl = window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;
        }
        baseUrl = baseUrl.trim().replace(/\/$/, '');

        if (!baseUrl) {
          throw new Error('No deployment URL found');
        }

        const CONCURRENCY_LIMIT = 3;
        const results: UploadResult[] = [];
        let completedCount = 0;

        for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
          if (abortController.signal.aborted) break;

          const batch = files.slice(i, i + CONCURRENCY_LIMIT);

          batch.forEach((file) => {
            setUploadStatus((prev) => ({
              ...prev,
              [file.name]: { progress: 30, status: 'uploading' },
            }));
          });

          const batchResults = await Promise.all(
            batch.map(async (file) => {
              if (abortController.signal.aborted) {
                return { file: file.name, success: false, error: 'Cancelled' };
              }

              const result = await uploadSingleFile(
                file,
                baseUrl,
                accessToken,
                metadata,
                collectionIds,
                quality,
                abortController.signal
              );

              setUploadStatus((prev) => ({
                ...prev,
                [file.name]: {
                  progress: result.success ? 100 : 0,
                  status: result.success ? 'success' : 'error',
                  error: result.error,
                },
              }));

              return result;
            })
          );

          results.push(...batchResults);
          completedCount += batch.length;
          setProgress((completedCount / files.length) * 100);
        }

        const successCount = results.filter((r) => r.success).length;
        const errorCount = results.filter((r) => !r.success).length;

        if (successCount > 0) {
          toast({
            title: 'Upload Complete',
            description: `${successCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
          });
          onSuccess?.();
        } else if (errorCount > 0) {
          toast({
            title: 'Upload Failed',
            description: `All ${errorCount} files failed to upload.`,
            variant: 'destructive',
          });
        }

        clearFiles();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        toast({
          title: 'Upload Error',
          description: err.message,
          variant: 'destructive',
        });
        onError?.(err);
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [files, isUploading, toast, onSuccess, onError, clearFiles]
  );

  return {
    files,
    uploadStatus,
    isUploading,
    progress,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    cancelUpload,
  };
}
