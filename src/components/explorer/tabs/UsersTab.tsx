import { User } from 'r2r-js';
import React from 'react';

import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import { useToast } from '@/components/ui/use-toast';

interface UsersTabProps {
  users: User[];
  totalEntries: number;
  loading: boolean;
  collectionId: string | null;
  onRefetch: () => void;
}

export function UsersTab({
  users,
  totalEntries,
  loading,
  collectionId,
  onRefetch,
}: UsersTabProps) {
  const { toast } = useToast();

  const userColumns: Column<User>[] = [
    { key: 'id', label: 'User ID', truncate: true, copyable: true },
    { key: 'email', label: 'Email', truncate: true, copyable: true },
  ];

  const renderUserActions = (user: User) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={user.id?.toString() || ''}
        collectionId={collectionId || ''}
        itemType="user"
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'User removed from collection',
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
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <Table
      data={users}
      columns={userColumns}
      itemsPerPage={10}
      onSelectAll={() => {}}
      onSelectItem={() => {}}
      selectedItems={[]}
      actions={renderUserActions}
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
