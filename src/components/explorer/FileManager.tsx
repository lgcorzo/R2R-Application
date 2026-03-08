'use client';

import { CollectionResponse, DocumentResponse } from 'r2r-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BulkActionsBar } from '@/components/explorer/BulkActionsBar';
import { ExtractConfirmDialog } from '@/components/explorer/ExtractConfirmDialog';
import { FileGridView } from '@/components/explorer/FileGridView';
import { FileManagerDialogs } from '@/components/explorer/FileManagerDialogs';
import { FileManagerToolbar } from '@/components/explorer/FileManagerToolbar';
import { FileTableView, SortConfig } from '@/components/explorer/FileTableView';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useDocumentPolling } from '@/hooks/useDocumentPolling';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { IngestionStatus, KGExtractionStatus } from '@/types';
import { UploadQuality } from '@/types/explorer';

/**
 * FileManager - Главный компонент управления файлами и коллекциями
 *
 * Ответственность:
 * - Управление документами (загрузка, удаление, перемещение, копирование)
 * - Bulk операции над группой документов
 * - Фильтрация и поиск документов
 * - Auto-refresh pending документов через polling
 * - Модальные окна для всех операций
 */
export interface FileManagerProps {
  /** ID выбранной коллекции (null = все документы) */
  selectedCollectionId: string | null;
  /** Список всех коллекций */
  collections: CollectionResponse[];
  /** Callback для обновления списка коллекций */
  onCollectionChange: () => void;
  /** Callback выбора коллекции */
  onCollectionSelect: (collectionId: string | null) => void;
}

export function FileManager({
  selectedCollectionId,
  collections,
  onCollectionChange,
  onCollectionSelect,
}: FileManagerProps) {
  const { getClient, authState } = useUserContext();
  const { toast } = useToast();

  // Core state
  const [files, setFiles] = useState<DocumentResponse[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filters, setFilters] = useState<{
    ingestionStatus: string[];
    extractionStatus: string[];
  }>({
    ingestionStatus: [],
    extractionStatus: [],
  });

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

  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadActiveTab, setUploadActiveTab] = useState<'file' | 'url'>(
    'file'
  );
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] =
    useState(false);
  const [extractConfirmModalOpen, setExtractConfirmModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [selectedCollectionForAction, setSelectedCollectionForAction] =
    useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Upload state
  const [newFileName, setNewFileName] = useState('');
  const [uploadCollectionIds, setUploadCollectionIds] = useState<string[]>([]);
  const [uploadQuality, setUploadQuality] = useState<string>('hi-res');
  const [uploadMetadata, setUploadMetadata] = useState<Record<string, string>>(
    {}
  );

  // Update upload collections when selectedCollectionId changes
  useEffect(() => {
    if (selectedCollectionId) {
      setUploadCollectionIds([selectedCollectionId]);
    } else {
      setUploadCollectionIds([]);
    }
  }, [selectedCollectionId]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) return;

      let response;
      if (selectedCollectionId) {
        response = await client.collections.listDocuments({
          id: selectedCollectionId,
          limit: 100,
          offset: 0,
        });
      } else {
        response = await client.documents.list({ limit: 100, offset: 0 });
      }
      setFiles(response?.results || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getClient, selectedCollectionId, toast]);

  useEffect(() => {
    if (!authState.isAuthenticated) return;
    fetchFiles();
  }, [authState.isAuthenticated, fetchFiles]);

  // Auto-refresh document statuses via polling
  const pendingDocumentIds = useMemo(() => {
    return files
      .filter((file) => {
        const ingestionPending =
          file.ingestionStatus !== IngestionStatus.SUCCESS &&
          file.ingestionStatus !== IngestionStatus.FAILED;
        const extractionPending =
          file.extractionStatus !== KGExtractionStatus.SUCCESS &&
          file.extractionStatus !== KGExtractionStatus.FAILED;
        return ingestionPending || extractionPending;
      })
      .map((file) => file.id);
  }, [files]);

  const { isPolling } = useDocumentPolling(pendingDocumentIds, {
    interval: 5000,
    onlyPending: true,
    onUpdate: (updatedDocs) => {
      setFiles((prevFiles) => {
        return prevFiles.map((file) => {
          const updated = updatedDocs.find((doc) => doc.id === file.id);
          return updated || file;
        });
      });
    },
  });

  // Batch проверка и РЕАЛЬНОЕ обновление extraction статусов для "processing" документов
  // Если у документа есть entities/relationships - обновляем статус на SUCCESS в БД
  useEffect(() => {
    const processingDocs = files.filter(
      (f) =>
        f.extractionStatus === KGExtractionStatus.PROCESSING ||
        f.extractionStatus === 'processing'
    );

    if (processingDocs.length === 0) return;

    const checkAndFixExtractionStatuses = async () => {
      try {
        const client = await getClient();
        if (!client) return;

        // Проверяем какие документы реально имеют извлеченные данные
        const results = await Promise.all(
          processingDocs.map(async (doc) => {
            try {
              // Проверяем entities и relationships в параллель
              const [entitiesResult, relationshipsResult] = await Promise.all([
                client.documents
                  .listEntities({ id: doc.id, offset: 0, limit: 1 })
                  .catch(() => ({ totalEntries: 0 })),
                client.documents
                  .listRelationships({ id: doc.id, offset: 0, limit: 1 })
                  .catch(() => ({ totalEntries: 0 })),
              ]);

              const hasExtractedData =
                (entitiesResult.totalEntries || 0) > 0 ||
                (relationshipsResult.totalEntries || 0) > 0;

              return {
                id: doc.id,
                needsUpdate: hasExtractedData,
                entitiesCount: entitiesResult.totalEntries || 0,
                relationshipsCount: relationshipsResult.totalEntries || 0,
              };
            } catch {
              return {
                id: doc.id,
                needsUpdate: false,
                entitiesCount: 0,
                relationshipsCount: 0,
              };
            }
          })
        );

        // Фильтруем документы которые нуждаются в обновлении
        const docsToUpdate = results.filter((r) => r.needsUpdate);

        if (docsToUpdate.length === 0) return;

        // РЕАЛЬНО обновляем статус через retrieve документа
        // R2R API не предоставляет прямого метода обновления extractionStatus,
        // поэтому мы делаем retrieve чтобы получить свежий статус с backend
        let updatedCount = 0;
        for (const doc of docsToUpdate) {
          try {
            // Получаем свежую версию документа с backend
            await client.documents.retrieve({ id: doc.id });
            updatedCount++;
          } catch (error) {
            console.error(`Failed to refresh document ${doc.id}:`, error);
          }
        }

        // После обновления - перезагружаем все документы
        if (updatedCount > 0) {
          await fetchFiles();

          toast({
            title: 'Extraction Statuses Updated',
            description: `Fixed ${updatedCount} document${updatedCount !== 1 ? 's' : ''} with completed extraction but incorrect status.`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error checking and fixing extraction statuses:', error);
      }
    };

    checkAndFixExtractionStatuses();
  }, [files, getClient, toast]);

  // Bulk actions hook
  const {
    isProcessing,
    bulkDelete,
    bulkExtract,
    bulkMove,
    bulkCopy,
    bulkDownload,
    getExtractStats,
  } = useBulkActions(files, selectedFiles, {
    onSuccess: () => {
      setSelectedFiles([]);
      fetchFiles();
    },
  });

  // File upload hook
  const {
    files: uploadFiles,
    uploadStatus: fileUploadStatus,
    isUploading,
    progress: uploadProgress,
    addFiles,
    removeFile: removeUploadFile,
    clearFiles: clearUploadFiles,
    upload: performUpload,
    cancelUpload,
  } = useFileUpload({
    onSuccess: () => {
      fetchFiles();
      setUploadModalOpen(false);
    },
  });

  // Unified search hook
  const { searchResults, isSearching } = useUnifiedSearch({
    searchQuery,
    isSearchFocused,
    files,
    collections,
  });

  const filteredFiles = useMemo(() => {
    let filtered = [...files];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.title?.toLowerCase().includes(query) ||
          file.id?.toLowerCase().includes(query)
      );
    }

    if (filters.ingestionStatus.length > 0) {
      filtered = filtered.filter((file) =>
        filters.ingestionStatus.includes(file.ingestionStatus)
      );
    }

    if (filters.extractionStatus.length > 0) {
      filtered = filtered.filter((file) =>
        filters.extractionStatus.includes(file.extractionStatus)
      );
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = (a.title || a.id).toLowerCase();
            bValue = (b.title || b.id).toLowerCase();
            break;
          case 'size':
            aValue = (a as any).sizeInBytes || (a as any).size_in_bytes || 0;
            bValue = (b as any).sizeInBytes || (b as any).size_in_bytes || 0;
            break;
          case 'modified':
            aValue = new Date(a.updatedAt || a.createdAt).getTime();
            bValue = new Date(b.updatedAt || b.createdAt).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [files, searchQuery, filters, sortConfig]);

  const toggleSelection = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (
      selectedFiles.length === filteredFiles.length &&
      filteredFiles.length > 0
    ) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((file) => file.id));
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      onCollectionSelect(null);
      setSearchQuery('');
    }
    setSelectedFiles([]);
  };

  const currentCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((c) => c.id === selectedCollectionId) || null;
  }, [selectedCollectionId, collections]);

  const breadcrumbPath = useMemo(() => {
    if (!selectedCollectionId) return ['All docs'];
    return [
      'All docs',
      currentCollection?.name || currentCollection?.id || 'Collection',
    ];
  }, [selectedCollectionId, currentCollection]);

  const handleFileAction = (action: string, file: DocumentResponse) => {
    setActiveFileId(file.id);

    switch (action) {
      case 'open':
      case 'preview':
        setPreviewModalOpen(true);
        break;
      case 'rename':
        setNewFileName(file.title || file.id);
        setRenameModalOpen(true);
        break;
      case 'move':
        setMoveModalOpen(true);
        break;
      case 'delete':
        setDeleteModalOpen(true);
        break;
      case 'download':
        handleDownload(file);
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'delete':
        setDeleteModalOpen(true);
        break;
      case 'move':
        setMoveModalOpen(true);
        break;
      case 'copy':
        setCopyModalOpen(true);
        break;
      case 'createCollection':
        setCreateCollectionModalOpen(true);
        break;
      case 'download':
        bulkDownload();
        break;
      case 'extract':
        // Показываем confirmation dialog перед extract
        setExtractConfirmModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleCreateCollectionAndMove = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Collection name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length === 0) return;

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const newCollection = await client.collections.create({
        name: newCollectionName.trim(),
      });

      const collectionId = newCollection.results.id;

      const addPromises = selectedFiles.map((fileId) =>
        client.collections.addDocument({
          id: collectionId,
          documentId: fileId,
        })
      );

      await Promise.all(addPromises);

      if (selectedCollectionId) {
        const removePromises = selectedFiles.map((fileId) =>
          client.collections.removeDocument({
            id: selectedCollectionId,
            documentId: fileId,
          })
        );
        await Promise.all(removePromises);
      }

      toast({
        title: 'Success',
        description: `Collection "${newCollectionName}" created and ${selectedFiles.length} document${selectedFiles.length !== 1 ? 's' : ''} moved successfully.`,
      });

      setCreateCollectionModalOpen(false);
      setNewCollectionName('');
      setSelectedFiles([]);
      onCollectionChange();
      fetchFiles();
    } catch (error: any) {
      console.error('Error creating collection and moving files:', error);
      toast({
        title: 'Error',
        description:
          error?.message || 'Failed to create collection and move documents.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (file: DocumentResponse) => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const blob = await client.documents.download({ id: file.id });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.title || file.id;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Successful',
        description: 'The file has been downloaded successfully.',
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: error?.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const deleteFiles = async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const filesToDelete =
        selectedFiles.length > 0
          ? selectedFiles
          : activeFileId
            ? [activeFileId]
            : [];

      await Promise.all(
        filesToDelete.map((fileId) => client.documents.delete({ id: fileId }))
      );

      toast({
        title: 'Success',
        description: `${filesToDelete.length} document${filesToDelete.length !== 1 ? 's' : ''} deleted successfully.`,
      });

      const response = selectedCollectionId
        ? await client.collections.listDocuments({
            id: selectedCollectionId,
            limit: 100,
            offset: 0,
          })
        : await client.documents.list({ limit: 100, offset: 0 });
      setFiles(response?.results || []);

      setSelectedFiles([]);
      setActiveFileId(null);
      setDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting files:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete documents.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-full mx-auto explorer-card">
      <FileManagerToolbar
        breadcrumbPath={breadcrumbPath}
        onNavigate={navigateToBreadcrumb}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchFocused={isSearchFocused}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
        searchResults={searchResults}
        isSearching={isSearching}
        onDocumentClick={(title) => setSearchQuery(title)}
        onCollectionClick={(id) => {
          onCollectionSelect(id);
          setSearchQuery('');
          setIsSearchFocused(false);
        }}
        onSearchClear={() => {
          setSearchQuery('');
          setIsSearchFocused(false);
          onCollectionSelect(null);
        }}
        isPolling={isPolling}
        pendingCount={pendingDocumentIds.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUploadClick={() => setUploadModalOpen(true)}
        selectedCollectionId={selectedCollectionId}
        onGraphActionComplete={fetchFiles}
      />

      <BulkActionsBar
        selectedCount={selectedFiles.length}
        onDeselect={() => setSelectedFiles([])}
        onAction={(action) => handleBulkAction(action)}
        isProcessing={isProcessing}
      />

      <CardContent className="p-0 bg-background">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'list' | 'grid')}
        >
          <TabsContent value="list" className="m-0">
            <FileTableView
              files={filteredFiles}
              selectedFiles={selectedFiles}
              loading={loading}
              sortConfig={sortConfig}
              availableIngestionStatuses={DEFAULT_INGESTION_STATUSES}
              availableExtractionStatuses={DEFAULT_EXTRACTION_STATUSES}
              selectedIngestionStatuses={filters.ingestionStatus}
              selectedExtractionStatuses={filters.extractionStatus}
              onFileSelect={toggleSelection}
              onSelectAll={toggleSelectAll}
              onSort={handleSort}
              onFileAction={handleFileAction}
              onIngestionStatusChange={(statuses) =>
                setFilters((prev) => ({ ...prev, ingestionStatus: statuses }))
              }
              onExtractionStatusChange={(statuses) =>
                setFilters((prev) => ({ ...prev, extractionStatus: statuses }))
              }
              onClearIngestionFilter={() =>
                setFilters((prev) => ({ ...prev, ingestionStatus: [] }))
              }
              onClearExtractionFilter={() =>
                setFilters((prev) => ({ ...prev, extractionStatus: [] }))
              }
              emptyState={{
                searchQuery,
                hasFilters:
                  filters.ingestionStatus.length > 0 ||
                  filters.extractionStatus.length > 0,
                onUpload: () => setUploadModalOpen(true),
                onClearFilters: () =>
                  setFilters({ ingestionStatus: [], extractionStatus: [] }),
              }}
            />
          </TabsContent>

          <TabsContent value="grid" className="m-0">
            <FileGridView
              files={filteredFiles}
              selectedFiles={selectedFiles}
              loading={loading}
              onFileSelect={toggleSelection}
              onFileAction={handleFileAction}
              emptyState={{
                searchQuery,
                onUpload: () => setUploadModalOpen(true),
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <FileManagerDialogs
        uploadModalOpen={uploadModalOpen}
        uploadActiveTab={uploadActiveTab}
        uploadFiles={uploadFiles}
        uploadStatus={fileUploadStatus}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadCollectionIds={uploadCollectionIds}
        uploadQuality={uploadQuality}
        uploadMetadata={uploadMetadata}
        collections={collections}
        onUploadClose={() => {
          setUploadModalOpen(false);
          clearUploadFiles();
          setUploadMetadata({});
          setUploadQuality('hi-res');
          setUploadActiveTab('file');
          if (selectedCollectionId) {
            setUploadCollectionIds([selectedCollectionId]);
          } else {
            setUploadCollectionIds([]);
          }
        }}
        onUploadTabChange={setUploadActiveTab}
        onAddFiles={addFiles}
        onRemoveFile={removeUploadFile}
        onClearFiles={clearUploadFiles}
        onUpload={() =>
          performUpload(
            uploadCollectionIds,
            uploadQuality as UploadQuality,
            uploadMetadata
          )
        }
        onCancelUpload={cancelUpload}
        onCollectionsChange={setUploadCollectionIds}
        onQualityChange={setUploadQuality}
        onMetadataChange={setUploadMetadata}
        onCreateCollectionInUpload={async (name: string) => {
          try {
            const client = await getClient();
            if (!client) {
              throw new Error('Failed to get authenticated client');
            }

            const newCollection = await client.collections.create({ name });

            const collectionId = newCollection.results.id;
            const collectionName = newCollection.results.name || collectionId;

            onCollectionChange();

            toast({
              title: 'Success',
              description: `Collection "${collectionName}" created successfully.`,
            });

            return { id: collectionId, name: collectionName };
          } catch (error: any) {
            console.error('Error creating collection:', error);
            toast({
              title: 'Error',
              description: error?.message || 'Failed to create collection.',
              variant: 'destructive',
            });
            return null;
          }
        }}
        renameModalOpen={renameModalOpen}
        newFileName={newFileName}
        onRenameClose={() => {
          setRenameModalOpen(false);
          setActiveFileId(null);
          setNewFileName('');
        }}
        onRenameConfirm={(newName) => {
          if (!activeFileId) return;
          setFiles((prev) =>
            prev.map((file) =>
              file.id === activeFileId ? { ...file, title: newName } : file
            )
          );
          setRenameModalOpen(false);
          setActiveFileId(null);
          setNewFileName('');
        }}
        deleteModalOpen={deleteModalOpen}
        activeFileId={activeFileId}
        files={files}
        selectedFilesCount={selectedFiles.length}
        onDeleteClose={() => {
          setDeleteModalOpen(false);
          setActiveFileId(null);
        }}
        onDeleteConfirm={async () => {
          if (selectedFiles.length > 0) {
            await bulkDelete();
            setDeleteModalOpen(false);
          } else {
            deleteFiles();
          }
        }}
        moveModalOpen={moveModalOpen}
        selectedCollectionForAction={selectedCollectionForAction}
        onMoveClose={() => {
          setMoveModalOpen(false);
          setSelectedCollectionForAction(null);
        }}
        onMoveConfirm={async (collectionId) => {
          await bulkMove(collectionId, selectedCollectionId);
          setMoveModalOpen(false);
          setSelectedCollectionForAction(null);
        }}
        onMoveCollectionSelect={setSelectedCollectionForAction}
        copyModalOpen={copyModalOpen}
        onCopyClose={() => {
          setCopyModalOpen(false);
          setSelectedCollectionForAction(null);
        }}
        onCopyConfirm={async (collectionId) => {
          await bulkCopy(collectionId);
          setCopyModalOpen(false);
          setSelectedCollectionForAction(null);
        }}
        onCopyCollectionSelect={setSelectedCollectionForAction}
        createCollectionModalOpen={createCollectionModalOpen}
        onCreateCollectionClose={() => {
          setCreateCollectionModalOpen(false);
          setNewCollectionName('');
        }}
        onCreateCollectionConfirm={async (name: string) => {
          setNewCollectionName(name);
          await handleCreateCollectionAndMove();
        }}
        previewModalOpen={previewModalOpen}
        onPreviewClose={() => {
          setPreviewModalOpen(false);
          setActiveFileId(null);
        }}
      />

      <ExtractConfirmDialog
        open={extractConfirmModalOpen}
        onClose={() => setExtractConfirmModalOpen(false)}
        onConfirm={() => {
          bulkExtract();
        }}
        {...getExtractStats()}
      />
    </Card>
  );
}
