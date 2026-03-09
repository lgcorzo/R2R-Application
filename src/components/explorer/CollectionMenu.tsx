import { MoreHorizontal, Edit, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/router';
import { CollectionResponse } from 'r2r-js';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

export interface CollectionMenuProps {
  collection: CollectionResponse;
  onCollectionUpdate?: () => void;
}

export const CollectionMenu: React.FC<CollectionMenuProps> = ({
  collection,
  onCollectionUpdate,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const { getClient } = useUserContext();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(collection.name || collection.id);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Collection name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    if (newName.trim() === collection.name) {
      setRenameDialogOpen(false);
      return;
    }

    setIsRenaming(true);

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Update collection name using r2r-js API
      await client.collections.update({
        id: collection.id,
        name: newName.trim(),
      });

      toast({
        title: 'Success',
        description: `Collection renamed to "${newName.trim()}".`,
      });

      setRenameDialogOpen(false);
      onCollectionUpdate?.();
    } catch (error: any) {
      console.error('Error renaming collection:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to rename collection.',
        variant: 'destructive',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOpenPage = () => {
    router.push(`/collection-detail/${collection.id}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Collection actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setRenameDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPage();
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Collection Page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>
              Enter a new name for the collection "
              {collection.name || collection.id}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setRenameDialogOpen(false);
                  }
                }}
                disabled={isRenaming}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setNewName(collection.name || collection.id);
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
