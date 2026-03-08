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

export interface RenameDocumentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when rename is confirmed with new name */
  onConfirm: (newName: string) => void;
  /** Current file name to rename */
  currentFileName: string;
  /** Whether rename operation is in progress */
  isRenaming?: boolean;
}

/**
 * Dialog for renaming a document
 *
 * @example
 * ```tsx
 * <RenameDocumentDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(newName) => handleRename(newName)}
 *   currentFileName="document.pdf"
 * />
 * ```
 */
export const RenameDocumentDialog: React.FC<RenameDocumentDialogProps> = ({
  open,
  onClose,
  onConfirm,
  currentFileName,
  isRenaming = false,
}) => {
  const [newFileName, setNewFileName] = useState(currentFileName);

  // Reset to current filename when dialog opens
  useEffect(() => {
    if (open) {
      setNewFileName(currentFileName);
    }
  }, [open, currentFileName]);

  const handleRename = () => {
    if (newFileName.trim() === '') {
      return;
    }
    onConfirm(newFileName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFileName.trim()) {
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>Enter a new name for your file.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Input
              placeholder="File Name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRenaming}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRenaming}>
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={!newFileName.trim() || isRenaming}
          >
            {isRenaming ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
