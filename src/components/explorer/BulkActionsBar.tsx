'use client';

import {
  ArrowRightToLine,
  Copy,
  Download,
  FolderPlus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export type BulkAction =
  | 'download'
  | 'extract'
  | 'copy'
  | 'move'
  | 'createCollection'
  | 'delete';

interface BulkActionsBarProps {
  selectedCount: number;
  onDeselect: () => void;
  onAction: (action: BulkAction) => void;
  isProcessing?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onDeselect,
  onAction,
  isProcessing = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-background p-2 flex items-center justify-between border-b">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselect}
          disabled={isProcessing}
        >
          <X className="h-4 w-4 mr-2" />
          Deselect
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('download')}
          disabled={isProcessing}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('extract')}
          disabled={isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Extract
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('copy')}
          disabled={isProcessing}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('move')}
          disabled={isProcessing}
        >
          <ArrowRightToLine className="h-4 w-4 mr-2" />
          Move
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('createCollection')}
          disabled={isProcessing}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onAction('delete')}
          disabled={isProcessing}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
