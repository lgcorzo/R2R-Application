'use client';

import { CollectionResponse } from 'r2r-js';
import React from 'react';

import { CollectionSelector } from '@/components/explorer/CollectionSelector';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CollectionActionDialogProps {
  /** Флаг открытия диалога */
  open: boolean;
  /** Callback при закрытии диалога */
  onClose: () => void;
  /** Callback при подтверждении действия */
  onConfirm: (collectionId: string) => void;
  /** Тип действия: 'move' или 'copy' */
  actionType: 'move' | 'copy';
  /** Список доступных коллекций */
  collections: CollectionResponse[];
  /** ID выбранной коллекции */
  selectedCollectionId: string | null;
  /** Callback при выборе коллекции */
  onCollectionSelect: (collectionId: string) => void;
  /** Количество выбранных файлов */
  selectedCount: number;
  /** Флаг загрузки операции */
  isLoading?: boolean;
}

/**
 * CollectionActionDialog - универсальный диалог для Move и Copy операций
 *
 * Отображает список коллекций для выбора destination.
 *
 * @example
 * ```tsx
 * <CollectionActionDialog
 *   open={isMoveOpen}
 *   onClose={() => setIsMoveOpen(false)}
 *   onConfirm={(id) => handleMove(id)}
 *   actionType="move"
 *   collections={collections}
 *   selectedCollectionId={selectedId}
 *   onCollectionSelect={setSelectedId}
 *   selectedCount={selectedFiles.length}
 * />
 * ```
 */
export const CollectionActionDialog: React.FC<CollectionActionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  actionType,
  collections,
  selectedCollectionId,
  onCollectionSelect,
  selectedCount,
  isLoading = false,
}) => {
  const actionLabel = actionType === 'move' ? 'Move' : 'Copy';
  const buttonLabel = actionType === 'move' ? 'Move Here' : 'Copy Here';

  const handleConfirm = () => {
    if (selectedCollectionId) {
      onConfirm(selectedCollectionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionLabel} {selectedCount} item
            {selectedCount !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            {actionType === 'move'
              ? 'Select a destination collection.'
              : 'Select a destination collection to copy documents to.'}
          </DialogDescription>
        </DialogHeader>

        <CollectionSelector
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelect={onCollectionSelect}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCollectionId || isLoading}
          >
            {isLoading ? `${actionLabel}ing...` : buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
