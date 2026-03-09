import { FileText, Upload, X } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React from 'react';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';

import {
  MetadataField,
  UploadMetadataEditor,
} from '@/components/explorer/UploadMetadataEditor';
import { UploadProgressDisplay } from '@/components/explorer/UploadProgressDisplay';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUploadStatus, UploadQuality } from '@/types/explorer';

import { UploadCollectionsSelect } from './UploadCollectionsSelect';
import { UploadQualitySelect } from './UploadQualitySelect';

interface UploadFileTabProps {
  // Dropzone
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;

  // Files
  uploadFiles: File[];
  onRemoveFile: (fileName: string) => void;

  // Collections
  collections: CollectionResponse[];
  uploadCollectionIds: string[];
  onCollectionIdsChange: (ids: string[]) => void;
  onCollectionChange: () => void;

  // Quality
  uploadQuality: string;
  onQualityChange: (quality: string) => void;

  // Metadata
  uploadMetadata: Record<string, string>;
  metadataFields: MetadataField[];
  onMetadataChange: (metadata: Record<string, string>) => void;
  onMetadataFieldsChange: (fields: MetadataField[]) => void;

  // Upload
  isUploading: boolean;
  uploadProgress: number;
  fileUploadStatus: Record<string, FileUploadStatus>;
  onUpload: (
    collectionIds: string[],
    quality: UploadQuality,
    metadata: Record<string, string>
  ) => void;
  onCancelUpload: () => void;
  onClose: () => void;
}

export function UploadFileTab({
  getRootProps,
  getInputProps,
  isDragActive,
  uploadFiles,
  onRemoveFile,
  collections,
  uploadCollectionIds,
  onCollectionIdsChange,
  onCollectionChange,
  uploadQuality,
  onQualityChange,
  uploadMetadata,
  metadataFields,
  onMetadataChange,
  onMetadataFieldsChange,
  isUploading,
  uploadProgress,
  fileUploadStatus,
  onUpload,
  onCancelUpload,
  onClose,
}: UploadFileTabProps) {
  return (
    <div className="space-y-6 py-4">
      {/* File Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-sm font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm font-medium mb-1">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOCX, TXT, JPG, PNG, and more
              </p>
            </>
          )}
        </div>
      </div>

      {/* Selected Files List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Selected Files ({uploadFiles.length})
          </label>
          <ScrollArea className="h-32 rounded-md border p-2">
            <div className="space-y-1">
              {uploadFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(file.name);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Collections */}
      <UploadCollectionsSelect
        collections={collections}
        selectedCollectionIds={uploadCollectionIds}
        onCollectionIdsChange={onCollectionIdsChange}
        onCollectionChange={onCollectionChange}
      />

      {/* Quality */}
      <UploadQualitySelect
        value={uploadQuality}
        onValueChange={onQualityChange}
      />

      {/* Metadata */}
      <UploadMetadataEditor
        metadata={uploadMetadata}
        metadataFields={metadataFields}
        onMetadataChange={onMetadataChange}
        onMetadataFieldsChange={onMetadataFieldsChange}
      />

      {/* Upload Progress */}
      {isUploading && uploadFiles.length > 0 && (
        <UploadProgressDisplay
          files={uploadFiles}
          fileUploadStatus={fileUploadStatus}
          uploadProgress={uploadProgress}
        />
      )}

      {/* Footer */}
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          {isUploading ? 'Close' : 'Cancel'}
        </Button>
        {isUploading ? (
          <Button variant="destructive" onClick={onCancelUpload}>
            <X className="h-4 w-4 mr-2" />
            Cancel Upload
          </Button>
        ) : (
          <Button
            onClick={() =>
              onUpload(
                uploadCollectionIds,
                uploadQuality as UploadQuality,
                uploadMetadata
              )
            }
            disabled={uploadFiles.length === 0 || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload{' '}
            {uploadFiles.length > 0 &&
              `${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}
