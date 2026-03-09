'use client';

import { FileText, Folder } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React, { useEffect, useState } from 'react';

import { CollectionMenu } from '@/components/explorer/CollectionMenu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useUserContext } from '@/context/UserContext';

interface ExplorerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedCollectionId: string | null;
  onCollectionSelect: (collectionId: string | null) => void;
}

export function ExplorerSidebar({
  selectedCollectionId,
  onCollectionSelect,
  ...props
}: ExplorerSidebarProps) {
  const { getClient, authState } = useUserContext();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);

  const fetchCollections = async () => {
    try {
      const client = await getClient();
      if (!client) return;

      const response = await client.collections.list({
        limit: 100,
        offset: 0,
      });
      setCollections(response?.results || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  useEffect(() => {
    if (!authState.isAuthenticated) return;
    fetchCollections();
  }, [authState.isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sidebar {...props}>
      <SidebarHeader className="!pt-1">
        <div className="px-6 py-2">
          <h2 className="text-lg font-semibold mb-2">Collections</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="!pt-1">
        <SidebarGroup className="!pt-1 !pb-0.5">
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedCollectionId === null}
                  onClick={() => onCollectionSelect(null)}
                  title="All Documents"
                >
                  <FileText />
                  All Documents
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {collections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Collections ({collections.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collections.map((collection) => (
                  <SidebarMenuItem
                    key={collection.id}
                    className="group relative"
                  >
                    <SidebarMenuButton
                      isActive={selectedCollectionId === collection.id}
                      onClick={() => onCollectionSelect(collection.id)}
                      title={collection.name || collection.id}
                    >
                      <Folder />
                      <span className="truncate">
                        {collection.name || collection.id}
                      </span>
                    </SidebarMenuButton>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <CollectionMenu
                        collection={collection}
                        onCollectionUpdate={fetchCollections}
                      />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
