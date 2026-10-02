import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React, { useState } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import DownloadFileContainer from '@/components/ChatDemo/DownloadFileContainer';
import Table, { Column } from '@/components/ChatDemo/Table';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus, KGExtractionStatus } from '@/types';

import ExtractButtonContainer from './ExtractContainer';

interface DocumentsTableProps {
  documents: DocumentResponse[];
  loading: boolean;
  onRefresh: () => void;
  pendingDocuments: string[];
  setPendingDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  showPagination?: boolean;
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (itemId: string, selected: boolean) => void;
  selectedItems: string[];
  hideActions?: boolean;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (columnKey: string, isVisible: boolean) => void;
  totalEntries?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage: number;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  middleContent?: React.ReactNode;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  onRefresh,
  pendingDocuments,
  setPendingDocuments,
  showPagination = true,
  onSelectAll,
  onSelectItem,
  selectedItems,
  hideActions = false,
  visibleColumns,
  onToggleColumn,
  totalEntries,
  currentPage = 1,
  onPageChange,
  itemsPerPage,
  middleContent,
}) => {
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const handleSelectAllInternal = (selected: boolean) => {
    onSelectAll(selected);
  };

  const handleSelectItemInternal = (itemId: string, selected: boolean) => {
    onSelectItem(itemId, selected);
  };

  const columns: Column<DocumentResponse>[] = [
    {
      key: 'title',
      label: 'Title',
      truncatedSubstring: true,
      sortable: true,
      copyable: true,
    },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    { key: 'ownerId', label: 'Owner ID', truncate: true, copyable: true },
    {
      key: 'collectionIds',
      label: 'Collection IDs',
      renderCell: (doc) =>
        doc.collectionIds && doc.collectionIds.length > 0
          ? doc.collectionIds.join(', ')
          : 'N/A',
      selected: false,
    },
    {
      key: 'ingestionStatus',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => {
        const s = (doc.ingestionStatus || '').toLowerCase();
        if (s === 'success') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              {doc.ingestionStatus}
            </span>
          );
        }
        if (s === 'failed') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]" />
              {doc.ingestionStatus}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            {doc.ingestionStatus || 'pending'}
          </span>
        );
      },
    },
    {
      key: 'extractionStatus',
      label: 'Extraction',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'processing'],
      renderCell: (doc) => {
        const s = (doc.extractionStatus || '').toLowerCase();
        if (s === 'success') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              {doc.extractionStatus}
            </span>
          );
        }
        if (s === 'enriched') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              {doc.extractionStatus}
            </span>
          );
        }
        if (s === 'failed') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]" />
              {doc.extractionStatus}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
            {doc.extractionStatus || 'pending'}
          </span>
        );
      },
    },
    { key: 'documentType', label: 'Type', selected: false },
    {
      key: 'metadata',
      label: 'Metadata',
      renderCell: (doc) => JSON.stringify(doc.metadata),
      selected: false,
    },
    { key: 'version', label: 'Version', selected: false },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
      renderCell: (doc) => new Date(doc.createdAt).toLocaleString(),
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      renderCell: (doc) => new Date(doc.updatedAt).toLocaleString(),
      selected: false,
    },
  ];

  const renderActions = (doc: DocumentResponse) =>
    hideActions ? null : (
      <div className="flex space-x-1 justify-end">
        <ExtractButtonContainer
          id={doc.id}
          ingestionStatus={doc.ingestionStatus}
          showToast={toast}
        />
        <DownloadFileContainer
          id={doc.id}
          fileName={doc.title ? doc.title : ''}
          showToast={toast}
        />
        <Button
          onClick={() => {
            setSelectedDocumentId(doc.id);
            setIsDocumentInfoDialogOpen(true);
          }}
          disabled={doc.ingestionStatus !== IngestionStatus.SUCCESS}
          variant="ghost"
          size="icon"
          title="View Document Info"
        >
          <FileSearch2 className="h-6 w-6" />
        </Button>
      </div>
    );

  // Documents are already filtered and paginated from parent component
  const displayedDocuments = documents;

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center mt-12">
          <Loader className="animate-spin" size={64} />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 p-2 bg-[#090d1a]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl">
            {/* Left side: Column toggle popover + search bar */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-3 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border-white/10 rounded-xl text-slate-300 flex items-center gap-2 flex-shrink-0 transition-colors"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                    <span className="hidden md:inline text-xs font-medium">
                      Columns
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="glass-panel border-white/10 p-4 rounded-xl shadow-2xl"
                >
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-white leading-none">
                        Toggle Columns
                      </h4>
                      <p className="text-xs text-slate-400">
                        Select which columns to display in the table.
                      </p>
                    </div>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {columns.map((col) => (
                        <div
                          key={col.key}
                          className="flex items-center space-x-2 py-0.5"
                        >
                          <Checkbox
                            id={`column-toggle-${col.key}`}
                            checked={visibleColumns[col.key]}
                            onCheckedChange={(
                              checked: boolean | 'indeterminate'
                            ) => {
                              if (typeof checked === 'boolean') {
                                onToggleColumn(col.key, checked);
                              }
                            }}
                          />
                          <label
                            htmlFor={`column-toggle-${col.key}`}
                            className="text-xs font-medium text-slate-300 cursor-pointer"
                          >
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex-1 min-w-0">{middleContent}</div>
            </div>

            {/* Right side: Upload and Delete buttons */}
            {!hideActions && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <UploadButton
                  setUploadedDocuments={() => {}}
                  onUploadSuccess={async () => {
                    await onRefresh();
                    onSelectAll(false);
                    return [];
                  }}
                  showToast={toast}
                  setPendingDocuments={setPendingDocuments}
                  setCurrentPage={() => {}}
                  documentsPerPage={10}
                />
                <DeleteButton
                  selectedDocumentIds={selectedItems}
                  onDelete={() => onSelectAll(false)}
                  onSuccess={async () => {
                    await onRefresh();
                  }}
                  showToast={toast}
                />
              </div>
            )}
          </div>

          <Table
            data={displayedDocuments}
            columns={columns.filter((col) => visibleColumns[col.key] === true)}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
            initialFilters={{}}
            tableHeight="600px"
            currentPage={currentPage}
            onPageChange={(page) => {
              if (onPageChange) {
                onPageChange(page);
              }
            }}
            itemsPerPage={10}
            showPagination={showPagination}
            loading={loading}
            enableColumnToggle={false}
            totalEntries={totalEntries}
          />
        </>
      )}

      {selectedDocumentId && (
        <DocumentInfoDialog
          id={selectedDocumentId}
          open={isDocumentInfoDialogOpen}
          onClose={() => {
            setIsDocumentInfoDialogOpen(false);
            setSelectedDocumentId('');
          }}
        />
      )}
    </div>
  );
};

export default DocumentsTable;
