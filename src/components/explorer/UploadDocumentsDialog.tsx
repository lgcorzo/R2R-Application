import { Link2, Upload, X } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React, { ReactNode } from 'react';

import { FileDropzone } from '@/components/explorer/FileDropzone';
import { FileUploadList } from '@/components/explorer/FileUploadList';
import { UrlUploadTab } from '@/components/explorer/UrlUploadTab';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadQuality } from '@/types/explorer';

export interface UploadDocumentsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Active tab: 'file' or 'url' */
  activeTab: 'file' | 'url';
  /** Callback when tab changes */
  onTabChange: (tab: 'file' | 'url') => void;

  // File upload props
  /** Files selected for upload */
  uploadFiles: File[];
  /** Upload status for each file */
  uploadStatus: Record<
    string,
    { status: 'pending' | 'uploading' | 'success' | 'error'; progress: number }
  >;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Overall upload progress (0-100) */
  uploadProgress: number;
  /** Callback when files are added */
  onAddFiles: (files: File[]) => void;
  /** Callback when file is removed */
  onRemoveFile: (fileName: string) => void;
  /** Callback to clear all files */
  onClearFiles: () => void;
  /** Callback to start upload */
  onUpload: () => void;
  /** Callback to cancel upload */
  onCancelUpload: () => void;

  /** Render prop for collections/quality/metadata configuration form */
  renderConfigForm: ReactNode;
}

/**
 * Comprehensive upload dialog with File and URL upload tabs
 *
 * Handles both file-based uploads and URL-based content fetching with:
 * - Drag & drop file upload
 * - URL content fetching
 * - Collection selection
 * - Quality settings
 * - Metadata configuration
 *
 * @example
 * ```tsx
 * <UploadDocumentsDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   activeTab="file"
 *   onTabChange={setActiveTab}
 *   uploadFiles={files}
 *   uploadStatus={status}
 *   isUploading={uploading}
 *   uploadProgress={progress}
 *   onAddFiles={addFiles}
 *   onRemoveFile={removeFile}
 *   onClearFiles={clearFiles}
 *   onUpload={performUpload}
 *   onCancelUpload={cancelUpload}
 *   renderConfigForm={
 *     <UploadConfigForm
 *       collections={collections}
 *       selectedCollectionIds={selectedIds}
 *       uploadQuality={quality}
 *       metadata={metadata}
 *       onCollectionsChange={setSelectedIds}
 *       onQualityChange={setQuality}
 *       onMetadataChange={setMetadata}
 *     />
 *   }
 * />
 * ```
 */
export const UploadDocumentsDialog: React.FC<UploadDocumentsDialogProps> = ({
  open,
  onClose,
  activeTab,
  onTabChange,
  uploadFiles,
  uploadStatus,
  isUploading,
  uploadProgress,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onUpload,
  onCancelUpload,
  renderConfigForm,
}) => {
  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload files from your computer or provide a URL to fetch content.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as 'file' | 'url')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-6 py-4">
            <FileDropzone
              onDrop={(acceptedFiles) => {
                const filtered = acceptedFiles.filter((file) => file.size > 0);
                onAddFiles(filtered);
              }}
            />

            <FileUploadList
              files={uploadFiles}
              uploadStatus={uploadStatus}
              isUploading={isUploading}
              overallProgress={uploadProgress}
              onRemoveFile={onRemoveFile}
              showDetailedStatus={isUploading}
            />

            {renderConfigForm}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                {isUploading ? 'Close' : 'Cancel'}
              </Button>
              {isUploading ? (
                <Button variant="destructive" onClick={onCancelUpload}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Upload
                </Button>
              ) : (
                <Button
                  onClick={onUpload}
                  disabled={uploadFiles.length === 0 || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload{' '}
                  {uploadFiles.length > 0 &&
                    `${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </DialogFooter>
          </TabsContent>

          <TabsContent value="url" className="space-y-6 py-4">
            <UrlUploadTab
              onUpload={onAddFiles}
              onSwitchToFileTab={() => onTabChange('file')}
              isUploading={isUploading}
              renderCollectionsSelect={renderConfigForm}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
