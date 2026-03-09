'use client';

import { format } from 'date-fns';
import {
  ChevronRight,
  Download,
  Edit,
  Eye,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  MoreVertical,
  Move,
  Trash2,
} from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShadcnButton } from '@/components/ui/ShadcnButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FileManagerTableProps {
  documents: DocumentResponse[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onOpen?: (doc: DocumentResponse) => void;
  onDelete?: (doc: DocumentResponse) => void;
  onRename?: (doc: DocumentResponse) => void;
  loading?: boolean;
}

// Helper function to get file icon
const getFileIcon = (doc: DocumentResponse) => {
  const type = doc.documentType?.toLowerCase() || '';
  if (type.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
    return <FileImage className="h-5 w-5 text-green-500" />;
  }
  if (type.includes('code') || type.includes('js') || type.includes('ts')) {
    return <FileCode className="h-5 w-5 text-purple-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
};

// Helper function to format dates
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Unknown';
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateObj.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return format(dateObj, 'MMM d, yyyy');
  }
};

export function FileManagerTable({
  documents,
  selectedIds,
  onSelect,
  onSelectAll,
  onOpen,
  onDelete,
  onRename,
  loading = false,
}: FileManagerTableProps) {
  const allSelected =
    documents.length > 0 && selectedIds.length === documents.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < documents.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Folder className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          Upload a document or create a new collection to get started.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead className="w-[300px]">Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow
            key={doc.id}
            className={selectedIds.includes(doc.id) ? 'bg-muted/50' : ''}
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.includes(doc.id)}
                onCheckedChange={() => onSelect(doc.id)}
                aria-label={`Select ${doc.title || doc.id}`}
              />
            </TableCell>
            <TableCell>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => onOpen?.(doc)}
              >
                {getFileIcon(doc)}
                <span className="font-medium">{doc.title || doc.id}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-md bg-muted">
                  {doc.ingestionStatus || 'unknown'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {doc.documentType || 'document'}
              </span>
            </TableCell>
            <TableCell>{formatDate(doc.updatedAt || doc.createdAt)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ShadcnButton variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </ShadcnButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpen?.(doc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpen?.(doc)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRename?.(doc)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpen?.(doc)}>
                    <Move className="h-4 w-4 mr-2" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(doc)}
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
}
