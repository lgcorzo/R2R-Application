import { CommunityResponse } from 'r2r-js';
import React from 'react';

import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import { useToast } from '@/components/ui/use-toast';

interface CommunitiesTabProps {
  communities: CommunityResponse[];
  totalEntries: number;
  loading: boolean;
  collectionId: string | null;
  onRefetch: () => void;
}

export function CommunitiesTab({
  communities,
  totalEntries,
  loading,
  collectionId,
  onRefetch,
}: CommunitiesTabProps) {
  const { toast } = useToast();

  const communityColumns: Column<CommunityResponse>[] = [
    { key: 'id', label: 'Community ID', truncate: true, copyable: true },
    { key: 'name', label: 'Name' },
    { key: 'summary', label: 'Summary' },
    { key: 'findings', label: 'Findings' },
  ];

  const renderCommunityActions = (community: CommunityResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={community.id?.toString() || ''}
        collectionId={collectionId || ''}
        itemType="community"
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'Community removed from collection',
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
        <p>Loading communities...</p>
      </div>
    );
  }

  return (
    <Table
      data={communities}
      columns={communityColumns}
      itemsPerPage={10}
      onSelectAll={() => {}}
      onSelectItem={() => {}}
      selectedItems={[]}
      actions={renderCommunityActions}
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
