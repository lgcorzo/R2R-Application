import { RelationshipResponse } from 'r2r-js';
import React from 'react';

import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import { useToast } from '@/components/ui/use-toast';

interface RelationshipsTabProps {
  relationships: RelationshipResponse[];
  totalEntries: number;
  loading: boolean;
  collectionId: string | null;
  onRefetch: () => void;
}

export function RelationshipsTab({
  relationships,
  totalEntries,
  loading,
  collectionId,
  onRefetch,
}: RelationshipsTabProps) {
  const { toast } = useToast();

  const relationshipColumns: Column<RelationshipResponse>[] = [
    { key: 'id', label: 'Relationship ID', truncate: true, copyable: true },
    { key: 'subject', label: 'Subject' },
    { key: 'predicate', label: 'Predicate' },
    { key: 'object', label: 'Object' },
    { key: 'subjectId', label: 'Subject ID', truncate: true, copyable: true },
    { key: 'objectId', label: 'Object ID', truncate: true, copyable: true },
  ];

  const renderRelationshipActions = (relationship: RelationshipResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={relationship.id?.toString() || ''}
        collectionId={collectionId || ''}
        itemType="relationship"
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'Relationship removed from collection',
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
        <p>Loading relationships...</p>
      </div>
    );
  }

  return (
    <Table
      data={relationships}
      columns={relationshipColumns}
      itemsPerPage={10}
      onSelectAll={() => {}}
      onSelectItem={() => {}}
      selectedItems={[]}
      actions={renderRelationshipActions}
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
