import { CollectionResponse } from 'r2r-js';
import React from 'react';

import { MultiSelect } from '@/components/ui/multi-select';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

interface UploadCollectionsSelectProps {
  collections: CollectionResponse[];
  selectedCollectionIds: string[];
  onCollectionIdsChange: (ids: string[]) => void;
  onCollectionChange: () => void;
  id?: string;
}

export function UploadCollectionsSelect({
  collections,
  selectedCollectionIds,
  onCollectionIdsChange,
  onCollectionChange,
  id = 'upload-collections',
}: UploadCollectionsSelectProps) {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const handleCreateNew = async (name: string) => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const newCollection = await client.collections.create({
        name: name,
      });

      const collectionId = newCollection.results.id;
      const collectionName = newCollection.results.name || collectionId;

      // Refresh collections list
      onCollectionChange();

      toast({
        title: 'Success',
        description: `Collection "${collectionName}" created successfully.`,
      });

      return { id: collectionId, name: collectionName };
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create collection.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Collections</label>
      <MultiSelect
        id={id}
        options={collections.map((collection) => ({
          value: collection.id,
          label: collection.name || collection.id,
        }))}
        value={selectedCollectionIds}
        onChange={onCollectionIdsChange}
        onCreateNew={handleCreateNew}
      />
      {selectedCollectionIds.length === 0 && (
        <p className="text-xs text-muted-foreground">
          If no collection is selected, documents will be added to "All
          Documents"
        </p>
      )}
    </div>
  );
}
