'use client';

import { Folder } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';

export interface CollectionSelectorProps {
  /** Список доступных коллекций */
  collections: CollectionResponse[];
  /** ID выбранной коллекции */
  selectedCollectionId: string | null;
  /** Callback при выборе коллекции */
  onSelect: (collectionId: string) => void;
}

/**
 * CollectionSelector - компонент для выбора коллекции из списка
 *
 * Используется в Move и Copy модалах для выбора destination коллекции.
 *
 * @example
 * ```tsx
 * <CollectionSelector
 *   collections={collections}
 *   selectedCollectionId={selectedId}
 *   onSelect={(id) => setSelectedId(id)}
 * />
 * ```
 */
export const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  collections,
  selectedCollectionId,
  onSelect,
}) => {
  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="space-y-2">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer ${
              selectedCollectionId === collection.id
                ? 'bg-primary/10 border border-primary'
                : ''
            }`}
            onClick={() => onSelect(collection.id)}
          >
            <Folder className="h-5 w-5 text-blue-500" />
            <span className="flex-1">{collection.name}</span>
            {selectedCollectionId === collection.id && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        ))}
        {collections.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No collections available
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
