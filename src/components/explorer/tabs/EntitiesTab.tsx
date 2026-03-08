import { EntityResponse } from 'r2r-js';
import React from 'react';

import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import { useToast } from '@/components/ui/use-toast';

interface EntitiesTabProps {
  entities: EntityResponse[];
  totalEntries: number;
  loading: boolean;
  collectionId: string | null;
  onRefetch: () => void;
}

export function EntitiesTab({
  entities,
  totalEntries,
  loading,
  collectionId,
  onRefetch,
}: EntitiesTabProps) {
  const { toast } = useToast();

  const entityColumns: Column<EntityResponse>[] = [
    { key: 'id', label: 'Entity ID', truncate: true, copyable: true },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Type' },
  ];

  const renderEntityActions = (entity: EntityResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={entity.id?.toString() || ''}
        collectionId={collectionId || ''}
        itemType="entity"
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'Entity removed from collection',
          });
          onRefetch();
        }}
        showToast={toast}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading entities...</p>
      </div>
    );
  }

  return (
    <Table
      data={entities}
      columns={entityColumns}
      itemsPerPage={10}
      onSelectAll={() => {}}
      onSelectItem={() => {}}
      selectedItems={[]}
      actions={renderEntityActions}
      initialSort={{ key: 'id', order: 'asc' }}
      initialFilters={{}}
      currentPage={1}
      totalEntries={totalEntries}
      onPageChange={() => {}}
      loading={loading}
      showPagination={true}
    />
  );
}
