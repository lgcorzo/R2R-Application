import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Edit,
  Eye,
  MoreVertical,
  Move,
  Trash2,
} from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React from 'react';

import { EmptyState } from '@/components/explorer/EmptyState';
import { StatusFilter } from '@/components/explorer/StatusFilter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDateLocal,
  formatFileSize,
  getFileIcon,
  getStatusBadge,
} from '@/lib/explorer-utils';

export type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export interface FileTableViewProps {
  /** List of documents to display */
  files: DocumentResponse[];
  /** IDs of selected files */
  selectedFiles: string[];
  /** Whether data is loading */
  loading?: boolean;
  /** Current sort configuration */
  sortConfig: SortConfig;
  /** Available ingestion statuses for filtering */
  availableIngestionStatuses: string[];
  /** Available extraction statuses for filtering */
  availableExtractionStatuses: string[];
  /** Selected ingestion status filters */
  selectedIngestionStatuses: string[];
  /** Selected extraction status filters */
  selectedExtractionStatuses: string[];
  /** Callback when file is selected/deselected */
  onFileSelect: (fileId: string) => void;
  /** Callback when select all is toggled */
  onSelectAll: () => void;
  /** Callback when sort changes */
  onSort: (key: string) => void;
  /** Callback when file action is triggered */
  onFileAction: (action: string, file: DocumentResponse) => void;
  /** Callback when ingestion status filter changes */
  onIngestionStatusChange: (statuses: string[]) => void;
  /** Callback when extraction status filter changes */
  onExtractionStatusChange: (statuses: string[]) => void;
  /** Callback to clear ingestion status filter */
  onClearIngestionFilter: () => void;
  /** Callback to clear extraction status filter */
  onClearExtractionFilter: () => void;
  /** Empty state props */
  emptyState?: {
    searchQuery?: string;
    hasFilters?: boolean;
    onUpload?: () => void;
    onClearFilters?: () => void;
  };
}

/**
 * FileTableView component for displaying documents in a table layout.
 * Supports sorting, filtering, selection, and file actions.
 */
export const FileTableView: React.FC<FileTableViewProps> = ({
  files,
  selectedFiles,
  loading = false,
  sortConfig,
  availableIngestionStatuses,
  availableExtractionStatuses,
  selectedIngestionStatuses,
  selectedExtractionStatuses,
  onFileSelect,
  onSelectAll,
  onSort,
  onFileAction,
  onIngestionStatusChange,
  onExtractionStatusChange,
  onClearIngestionFilter,
  onClearExtractionFilter,
  emptyState,
}) => {
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (files.length === 0) {
    // Determine empty state message
    let message = 'This folder is empty. Upload a file to get started.';
    if (emptyState?.searchQuery) {
      message = `No results found for "${emptyState.searchQuery}". Try a different search term.`;
    } else if (emptyState?.hasFilters) {
      message =
        'No files match the selected filters. Try changing the filter criteria.';
    }

    return (
      <EmptyState
        message={message}
        action={
          emptyState?.onUpload
            ? { label: 'Upload File', onClick: emptyState.onUpload }
            : undefined
        }
        secondaryAction={
          emptyState?.hasFilters && emptyState?.onClearFilters
            ? {
                label: 'Clear Filters',
                onClick: emptyState.onClearFilters,
              }
            : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={
                selectedFiles.length === files.length && files.length > 0
              }
              onCheckedChange={onSelectAll}
              aria-label="Select all"
              disabled={files.length === 0}
            />
          </TableHead>
          <TableHead
            className="w-[300px] cursor-pointer"
            onClick={() => onSort('name')}
          >
            <div className="flex items-center gap-2">
              Name
              {renderSortIcon('name')}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => onSort('size')}>
            <div className="flex items-center gap-2">
              Size
              {renderSortIcon('size')}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => onSort('modified')}
          >
            <div className="flex items-center gap-2">
              Modified
              {renderSortIcon('modified')}
            </div>
          </TableHead>
          <TableHead className="w-[150px] !px-2 !py-1">
            <div className="flex items-center gap-2">
              <span>Ingestion</span>
              <StatusFilter
                title="Ingestion Status"
                availableStatuses={availableIngestionStatuses}
                selectedStatuses={selectedIngestionStatuses}
                onStatusChange={onIngestionStatusChange}
                onClear={onClearIngestionFilter}
              />
            </div>
          </TableHead>
          <TableHead className="w-[150px] !px-2 !py-1">
            <div className="flex items-center gap-2">
              <span>Extraction</span>
              <StatusFilter
                title="Extraction Status"
                availableStatuses={availableExtractionStatuses}
                selectedStatuses={selectedExtractionStatuses}
                onStatusChange={onExtractionStatusChange}
                onClear={onClearExtractionFilter}
              />
            </div>
          </TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow
            key={file.id}
            className={`table-row-hover ${
              selectedFiles.includes(file.id)
                ? 'bg-primary/10 dark:bg-primary/20'
                : ''
            }`}
          >
            <TableCell>
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onCheckedChange={() => onFileSelect(file.id)}
                aria-label={`Select ${file.title || file.id}`}
              />
            </TableCell>
            <TableCell>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => onFileAction('open', file)}
              >
                {getFileIcon(file)}
                <span className="font-medium font-mono text-sm">
                  {file.title || file.id}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(
                  (file as any).sizeInBytes || (file as any).size_in_bytes
                )}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDateLocal(file.updatedAt || file.createdAt)}
              </span>
            </TableCell>
            <TableCell className="w-[200px] min-w-[180px]">
              <div className="flex justify-start">
                {getStatusBadge(file.ingestionStatus, 'ingestion')}
              </div>
            </TableCell>
            <TableCell className="w-[200px] min-w-[180px]">
              <div className="flex justify-start">
                {getStatusBadge(file.extractionStatus, 'extraction')}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onFileAction('preview', file)}
                  >
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
                  <DropdownMenuItem
                    onClick={() => onFileAction('rename', file)}
                  >
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
