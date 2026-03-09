import { FileText, Loader2, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FileUploadStatus {
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface FileUploadListProps {
  /** List of files being uploaded */
  files: File[];
  /** Upload status for each file (keyed by file name) */
  uploadStatus?: Record<string, FileUploadStatus>;
  /** Whether uploads are currently in progress */
  isUploading?: boolean;
  /** Overall upload progress (0-100) */
  overallProgress?: number;
  /** Callback when a file is removed */
  onRemoveFile?: (fileName: string) => void;
  /** Whether to show detailed per-file status */
  showDetailedStatus?: boolean;
}

/**
 * FileUploadList component displays selected files and their upload status.
 * Supports both simple file list and detailed upload progress tracking.
 */
export const FileUploadList: React.FC<FileUploadListProps> = ({
  files,
  uploadStatus = {},
  isUploading = false,
  overallProgress = 0,
  onRemoveFile,
  showDetailedStatus = false,
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Simple file list without upload status */}
      {!showDetailedStatus && (
        <>
          <label className="text-sm font-medium">
            Selected Files ({files.length})
          </label>
          <ScrollArea className="h-32 rounded-md border p-2">
            <div className="space-y-1">
              {files.map((file, index) => (
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
                  {onRemoveFile && (
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
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Detailed upload status with progress */}
      {showDetailedStatus && isUploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Upload Progress</span>
            <span className="text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />

          {/* Per-file status */}
          <ScrollArea className="h-40 rounded-md border p-3">
            <div className="space-y-2">
              {files.map((file, index) => {
                const status = uploadStatus[file.name];
                if (!status) return null;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {status.status === 'success' && (
                          <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                        )}
                        {status.status === 'error' && (
                          <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                        {(status.status === 'uploading' ||
                          status.status === 'pending') && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground flex-shrink-0 ml-2">
                        {status.status === 'success'
                          ? 'Done'
                          : status.status === 'error'
                            ? 'Failed'
                            : status.status === 'uploading'
                              ? `${Math.round(status.progress)}%`
                              : 'Pending'}
                      </span>
                    </div>
                    {(status.status === 'uploading' ||
                      status.status === 'pending') && (
                      <Progress value={status.progress} className="h-1" />
                    )}
                    {status.status === 'error' && status.error && (
                      <p className="text-xs text-red-500 truncate">
                        {status.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
