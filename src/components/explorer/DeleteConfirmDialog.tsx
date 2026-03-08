'use client';

import { DocumentResponse } from 'r2r-js';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DeleteConfirmDialogProps {
  /** Флаг открытия диалога */
  open: boolean;
  /** Callback при закрытии диалога */
  onClose: () => void;
  /** Callback при подтверждении удаления */
  onConfirm: () => void;
  /** Количество выбранных файлов для удаления */
  selectedCount: number;
  /** Активный файл (если удаление одного файла) */
  activeFile?: DocumentResponse | null;
  /** Флаг загрузки операции */
  isLoading?: boolean;
}

/**
 * DeleteConfirmDialog - диалог подтверждения удаления документов
 *
 * Отображает разные сообщения для одного файла и массового удаления.
 *
 * @example
 * ```tsx
 * <DeleteConfirmDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   selectedCount={selectedFiles.length}
 *   activeFile={activeFile}
 * />
 * ```
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  activeFile,
  isLoading = false,
}) => {
  const getMessage = () => {
    if (selectedCount > 0) {
      return `Are you sure you want to delete ${selectedCount} selected item${selectedCount !== 1 ? 's' : ''}?`;
    }
    return `Are you sure you want to delete "${activeFile?.title || activeFile?.id}"?`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            {getMessage()}
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
