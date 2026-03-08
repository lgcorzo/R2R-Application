'use client';

import {
  Download,
  Edit,
  Eye,
  File,
  FileCode,
  FileImage,
  FileText,
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

interface FileCardProps {
  document: DocumentResponse;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen?: (doc: DocumentResponse) => void;
  onDelete?: (doc: DocumentResponse) => void;
  onRename?: (doc: DocumentResponse) => void;
}

// Helper function to get file icon
const getFileIcon = (doc: DocumentResponse) => {
  const type = doc.documentType?.toLowerCase() || '';
  if (type.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
    return <FileImage className="h-8 w-8 text-green-500" />;
  }
  if (type.includes('code') || type.includes('js') || type.includes('ts')) {
    return <FileCode className="h-8 w-8 text-purple-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
};

export function FileCard({
  document,
  selected,
  onSelect,
  onOpen,
  onDelete,
  onRename,
}: FileCardProps) {
  return (
    <div
      className={`relative group rounded-lg border bg-card p-2 transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="absolute top-2 right-2">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(document.id)}
          aria-label={`Select ${document.title || document.id}`}
        />
      </div>

      <div
        className="flex flex-col items-center p-4 cursor-pointer"
        onClick={() => onOpen?.(document)}
      >
        <div className="mb-2">{getFileIcon(document)}</div>
        <div className="text-center">
          <p className="font-medium truncate w-full max-w-[120px]">
            {document.title || document.id}
          </p>
          <p className="text-xs text-muted-foreground">
            {document.documentType || 'document'}
          </p>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ShadcnButton variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </ShadcnButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen?.(document)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpen?.(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename?.(document)}>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpen?.(document)}>
              <Move className="h-4 w-4 mr-2" />
              Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(document)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
