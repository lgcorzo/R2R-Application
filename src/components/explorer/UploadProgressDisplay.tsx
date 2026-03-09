import { Loader2 } from 'lucide-react';
import React from 'react';

import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUploadStatus } from '@/types/explorer';

interface UploadProgressDisplayProps {
  files: File[];
  fileUploadStatus: Record<string, FileUploadStatus>;
  uploadProgress: number;
}

export function UploadProgressDisplay({
  files,
  fileUploadStatus,
  uploadProgress,
}: UploadProgressDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Upload Progress</span>
        <span className="text-muted-foreground">
          {Math.round(uploadProgress)}%
        </span>
      </div>
      <Progress value={uploadProgress} className="h-2" />

      {/* Per-file status */}
      <ScrollArea className="h-40 rounded-md border p-3">
        <div className="space-y-2">
          {files.map((file, index) => {
            const status = fileUploadStatus[file.name];
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
                    <span className="truncate font-medium">{file.name}</span>
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
  );
}
