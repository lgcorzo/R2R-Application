import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface CreateCollectionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when collection creation is confirmed with name and document IDs */
  onConfirm: (collectionName: string) => Promise<void>;
  /** Number of selected files to move to new collection */
  selectedCount: number;
  /** Whether creation operation is in progress */
  isCreating?: boolean;
}

/**
 * Dialog for creating a new collection and optionally moving selected documents into it
 *
 * @example
 * ```tsx
 * <CreateCollectionDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(name) => handleCreateCollection(name)}
 *   selectedCount={3}
 * />
 * ```
 */
export const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  isCreating = false,
}) => {
  const [collectionName, setCollectionName] = useState('');

  // Reset collection name when dialog opens
  useEffect(() => {
    if (open) {
      setCollectionName('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (collectionName.trim() === '') {
      return;
    }
    await onConfirm(collectionName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && collectionName.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create Collection and Move {selectedCount} item
            {selectedCount !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Create a new collection and move selected documents to it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Collection Name</label>
            <Input
              placeholder="Enter collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!collectionName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create and Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
