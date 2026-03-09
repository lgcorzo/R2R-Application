'use client';

import { FileText, Folder, Search } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import * as React from 'react';

import { Label } from '@/components/ui/label';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  personalCollections: CollectionResponse[];
  sharedCollections: CollectionResponse[];
  selectedCollectionId: string | null;
  onCollectionClick: (collectionId: string) => void;
  onAllDocumentsClick: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function AppSidebar({
  personalCollections,
  sharedCollections,
  selectedCollectionId,
  onCollectionClick,
  onAllDocumentsClick,
  searchQuery = '',
  onSearchChange,
  ...props
}: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Filter collections based on search query
  const filteredPersonalCollections = React.useMemo(() => {
    if (!searchQuery.trim()) return personalCollections;
    const query = searchQuery.toLowerCase();
    return personalCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query)
    );
  }, [personalCollections, searchQuery]);

  const filteredSharedCollections = React.useMemo(() => {
    if (!searchQuery.trim()) return sharedCollections;
    const query = searchQuery.toLowerCase();
    return sharedCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query)
    );
  }, [sharedCollections, searchQuery]);

  return (
    <Sidebar {...props}>
      {!isCollapsed && (
        <SidebarHeader className="border-b border-zinc-700 !pt-1">
          <div className="px-6 py-2">
            <h2 className="text-lg font-semibold text-white mb-2">
              Collections
            </h2>
          </div>
        </SidebarHeader>
      )}

      <SidebarContent className="!pt-1">
        {/* All Documents */}
        <SidebarGroup className="!pt-1 !pb-0.5">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onAllDocumentsClick}
                  isActive={selectedCollectionId === null}
                  title="All Documents"
                >
                  <FileText className="w-4 h-4" />
                  <span>All Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal Collections */}
        {filteredPersonalCollections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-zinc-400">
              Your Collections ({personalCollections.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredPersonalCollections.map((collection) => (
                  <SidebarMenuItem key={collection.id}>
                    <SidebarMenuButton
                      onClick={() => onCollectionClick(collection.id)}
                      isActive={selectedCollectionId === collection.id}
                      title={collection.name || collection.id}
                    >
                      <Folder className="w-4 h-4" />
                      <span className="truncate">
                        {collection.name || collection.id}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Shared Collections */}
        {filteredSharedCollections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-zinc-400">
              Shared With You ({sharedCollections.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSharedCollections.map((collection) => (
                  <SidebarMenuItem key={collection.id}>
                    <SidebarMenuButton
                      onClick={() => onCollectionClick(collection.id)}
                      isActive={selectedCollectionId === collection.id}
                      title={collection.name || collection.id}
                    >
                      <Folder className="w-4 h-4" />
                      <span className="truncate">
                        {collection.name || collection.id}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Empty state */}
        {searchQuery.trim() &&
          filteredPersonalCollections.length === 0 &&
          filteredSharedCollections.length === 0 && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No collections found matching &quot;{searchQuery}&quot;
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
