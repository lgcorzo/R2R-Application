'use client';

import { CollectionResponse, DocumentResponse } from 'r2r-js';
import React from 'react';

import { CollectionActionDialog } from '@/components/explorer/CollectionActionDialog';
import { CreateCollectionDialog } from '@/components/explorer/CreateCollectionDialog';
import { DeleteConfirmDialog } from '@/components/explorer/DeleteConfirmDialog';
import { DocumentDetailsDialog } from '@/components/explorer/DocumentDetailsDialog';
import { RenameDocumentDialog } from '@/components/explorer/RenameDocumentDialog';
import { UploadConfigForm } from '@/components/explorer/UploadConfigForm';
import { UploadDocumentsDialog } from '@/components/explorer/UploadDocumentsDialog';

/**
 * FileManagerDialogs - Контейнер всех модальных окон File Manager
 *
 * Управляет 7 модальными окнами:
 * 1. Upload (файлы/URL)
 * 2. Rename документа
 * 3. Delete подтверждение
 * 4. Move в коллекцию
 * 5. Copy в коллекцию
 * 6. Create Collection and Move
 * 7. Document Details (preview)
 */
interface FileManagerDialogsProps {
  // Upload Dialog
  uploadModalOpen: boolean;
  uploadActiveTab: 'file' | 'url';
  uploadFiles: File[];
  uploadStatus: Record<
    string,
    { status: 'pending' | 'uploading' | 'success' | 'error'; progress: number }
  >;
  isUploading: boolean;
  uploadProgress: number;
  uploadCollectionIds: string[];
  uploadQuality: string;
  uploadMetadata: Record<string, string>;
  collections: CollectionResponse[];

  onUploadClose: () => void;
  onUploadTabChange: (tab: 'file' | 'url') => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (fileName: string) => void;
  onClearFiles: () => void;
  onUpload: () => void;
  onCancelUpload: () => void;
  onCollectionsChange: (ids: string[]) => void;
  onQualityChange: (quality: string) => void;
  onMetadataChange: (metadata: Record<string, string>) => void;
  onCreateCollectionInUpload: (
    name: string
  ) => Promise<{ id: string; name: string } | null>;

  // Rename Dialog
  renameModalOpen: boolean;
  newFileName: string;
  onRenameClose: () => void;
  onRenameConfirm: (newName: string) => void;

  // Delete Dialog
  deleteModalOpen: boolean;
  activeFileId: string | null;
  files: DocumentResponse[];
  selectedFilesCount: number;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;

  // Move Dialog
  moveModalOpen: boolean;
  selectedCollectionForAction: string | null;
  onMoveClose: () => void;
  onMoveConfirm: (collectionId: string) => void;
  onMoveCollectionSelect: (id: string | null) => void;

  // Copy Dialog
  copyModalOpen: boolean;
  onCopyClose: () => void;
  onCopyConfirm: (collectionId: string) => void;
  onCopyCollectionSelect: (id: string | null) => void;

  // Create Collection Dialog
  createCollectionModalOpen: boolean;
  onCreateCollectionClose: () => void;
  onCreateCollectionConfirm: (collectionName: string) => Promise<void>;

  // Preview Dialog
  previewModalOpen: boolean;
  onPreviewClose: () => void;
}

export function FileManagerDialogs({
  uploadModalOpen,
  uploadActiveTab,
  uploadFiles,
  uploadStatus,
  isUploading,
  uploadProgress,
  uploadCollectionIds,
  uploadQuality,
  uploadMetadata,
  collections,
  onUploadClose,
  onUploadTabChange,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onUpload,
  onCancelUpload,
  onCollectionsChange,
  onQualityChange,
  onMetadataChange,
  onCreateCollectionInUpload,
  renameModalOpen,
  newFileName,
  onRenameClose,
  onRenameConfirm,
  deleteModalOpen,
  activeFileId,
  files,
  selectedFilesCount,
  onDeleteClose,
  onDeleteConfirm,
  moveModalOpen,
  selectedCollectionForAction,
  onMoveClose,
  onMoveConfirm,
  onMoveCollectionSelect,
  copyModalOpen,
  onCopyClose,
  onCopyConfirm,
  onCopyCollectionSelect,
  createCollectionModalOpen,
  onCreateCollectionClose,
  onCreateCollectionConfirm,
  previewModalOpen,
  onPreviewClose,
}: FileManagerDialogsProps) {
  // Получаем актуальный документ из files по activeFileId
  // Это гарантирует real-time обновление статусов в модалках
  const activeFile =
    activeFileId !== null ? files.find((f) => f.id === activeFileId) : null;

  return (
    <>
      {/* Upload Modal */}
      <UploadDocumentsDialog
        open={uploadModalOpen}
        onClose={onUploadClose}
        activeTab={uploadActiveTab}
        onTabChange={onUploadTabChange}
        uploadFiles={uploadFiles}
        uploadStatus={uploadStatus}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onAddFiles={onAddFiles}
        onRemoveFile={onRemoveFile}
        onClearFiles={onClearFiles}
        onUpload={onUpload}
        onCancelUpload={onCancelUpload}
        renderConfigForm={
          <UploadConfigForm
            collections={collections}
            selectedCollectionIds={uploadCollectionIds}
            uploadQuality={uploadQuality}
            metadata={uploadMetadata}
            onCollectionsChange={onCollectionsChange}
            onQualityChange={onQualityChange}
            onMetadataChange={onMetadataChange}
            onCreateCollection={onCreateCollectionInUpload}
            disabled={isUploading}
          />
        }
      />

      {/* Rename Modal */}
      <RenameDocumentDialog
        open={renameModalOpen}
        onClose={onRenameClose}
        onConfirm={onRenameConfirm}
        currentFileName={newFileName}
      />

      {/* Delete Modal */}
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        selectedCount={selectedFilesCount}
        activeFile={activeFile}
      />

      {/* Move Modal */}
      <CollectionActionDialog
        open={moveModalOpen}
        onClose={onMoveClose}
        onConfirm={onMoveConfirm}
        actionType="move"
        collections={collections}
        selectedCollectionId={selectedCollectionForAction}
        onCollectionSelect={onMoveCollectionSelect}
        selectedCount={selectedFilesCount}
      />

      {/* Copy Modal */}
      <CollectionActionDialog
        open={copyModalOpen}
        onClose={onCopyClose}
        onConfirm={onCopyConfirm}
        actionType="copy"
        collections={collections}
        selectedCollectionId={selectedCollectionForAction}
        onCollectionSelect={onCopyCollectionSelect}
        selectedCount={selectedFilesCount}
      />

      {/* Create Collection and Move Modal */}
      <CreateCollectionDialog
        open={createCollectionModalOpen}
        onClose={onCreateCollectionClose}
        onConfirm={onCreateCollectionConfirm}
        selectedCount={selectedFilesCount}
      />

      {/* Preview Modal - Detailed Document Info */}
      {activeFile && (
        <DocumentDetailsDialog
          document={activeFile}
          open={previewModalOpen}
          onClose={onPreviewClose}
        />
      )}
    </>
  );
}
