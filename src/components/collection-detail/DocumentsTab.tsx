import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  FileSearch2,
  FileText,
  Loader,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { DocumentResponse } from 'r2r-js/dist/types';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus, KGExtractionStatus } from '@/types';

interface DocumentsTabProps {
  documents: DocumentResponse[];
  loading: boolean;
  loadingMore: boolean;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No documents found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        This collection doesn&apos;t have any documents yet. Upload documents to
        get started.
      </p>
    </div>
  );
}

export function DocumentsTab({
  documents,
  loading,
  loadingMore,
  onDelete,
  onView,
}: DocumentsTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // Filter documents by search query
  const filteredDocs = React.useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Paginate
  const paginatedDocs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize);

  const getStatusBadge = (status: string, type: 'ingestion' | 'extraction') => {
    const successStatus =
      type === 'ingestion'
        ? IngestionStatus.SUCCESS
        : KGExtractionStatus.SUCCESS;
    const failedStatus =
      type === 'ingestion' ? IngestionStatus.FAILED : KGExtractionStatus.FAILED;

    if (status === successStatus) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
    }
    if (status === failedStatus) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant="pending" className="gap-1">
        <Clock className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Document ID copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />
        <div className="rounded-md border p-4">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyState />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Search and Loading Indicator */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by title or document ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          {loadingMore && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Loader className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-500">
                Syncing {documents.length}
              </span>
            </div>
          )}
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Document ID</TableHead>
                <TableHead>Ingestion</TableHead>
                <TableHead>Extraction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc) => (
                  <TableRow key={doc.id} className="group">
                    <TableCell className="max-w-md">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate font-medium cursor-default">
                            {doc.title || 'Untitled'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md">
                          <p>{doc.title || 'Untitled'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate font-mono text-sm text-muted-foreground cursor-default">
                            {doc.id}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="font-mono text-xs">{doc.id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.ingestionStatus, 'ingestion')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.extractionStatus, 'extraction')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(doc.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Document ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onView(doc.id)}>
                            <FileSearch2 className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(doc.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No documents match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredDocs.length)} of{' '}
              {filteredDocs.length} documents
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
