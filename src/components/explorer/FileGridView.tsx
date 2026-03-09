import {
  Download,
  Edit,
  Eye,
  MoreVertical,
  Move,
  Trash2,
  Upload,
} from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React from 'react';

import { EmptyState } from '@/components/explorer/EmptyState';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFileIcon } from '@/lib/explorer-utils';

export interface FileGridViewProps {
  /** List of documents to display */
  files: DocumentResponse[];
  /** IDs of selected files */
  selectedFiles: string[];
  /** Whether data is loading */
  loading?: boolean;
  /** Callback when file is selected/deselected */
  onFileSelect: (fileId: string) => void;
  /** Callback when file action is triggered */
  onFileAction: (action: string, file: DocumentResponse) => void;
  /** Empty state props */
  emptyState?: {
    searchQuery?: string;
    onUpload?: () => void;
  };
}

/**
 * FileGridView component for displaying documents in a grid layout.
 * Optimized for visual browsing with large icons and thumbnails.
 */
export const FileGridView: React.FC<FileGridViewProps> = ({
  files,
  selectedFiles,
  loading = false,
  onFileSelect,
  onFileAction,
  emptyState,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (files.length === 0) {
    const message = emptyState?.searchQuery
      ? `No results found for "${emptyState.searchQuery}". Try a different search term.`
      : 'This folder is empty. Upload a file to get started.';

    return (
      <EmptyState
        message={message}
        action={
          emptyState?.onUpload
            ? { label: 'Upload File', onClick: emptyState.onUpload }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {files.map((file) => (
        <div
          key={file.id}
          className={`relative group rounded-lg border bg-card p-2 transition-all hover:shadow-md ${
            selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          {/* Selection checkbox */}
          <div className="absolute top-2 right-2">
            <Checkbox
              checked={selectedFiles.includes(file.id)}
              onCheckedChange={() => onFileSelect(file.id)}
              aria-label={`Select ${file.title || file.id}`}
            />
          </div>

          {/* File content - clickable for preview */}
          <div
            className="flex flex-col items-center p-4 cursor-pointer"
            onClick={() => onFileAction('open', file)}
          >
            <div className="mb-2">{getFileIcon(file)}</div>
            <div className="text-center">
              <p className="font-medium font-mono text-sm truncate w-full max-w-[120px]">
                {file.title || file.id}
              </p>
              <p className="text-xs text-muted-foreground">
                {file.documentType || 'document'}
              </p>
            </div>
          </div>

          {/* Actions dropdown - appears on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFileAction('preview', file)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFileAction('download', file)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFileAction('rename', file)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFileAction('move', file)}>
                  <Move className="h-4 w-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onFileAction('delete', file)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
};
