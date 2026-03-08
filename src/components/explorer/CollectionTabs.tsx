'use client';

import { useRouter } from 'next/router';
import {
  CollectionResponse,
  CommunityResponse,
  EntityResponse,
  RelationshipResponse,
  User,
} from 'r2r-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { FileManager } from '@/components/explorer/FileManager';
import {
  CommunitiesTab,
  EntitiesTab,
  ExploreTab,
  KnowledgeGraphTab,
  RelationshipsTab,
  UsersTab,
} from '@/components/explorer/tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/context/UserContext';
import { useBatchFetch } from '@/hooks/useBatchFetch';

interface CollectionTabsProps {
  selectedCollectionId: string | null;
  collections: CollectionResponse[];
  onCollectionChange: () => void;
  onCollectionSelect: (collectionId: string | null) => void;
}

type TabValue =
  | 'documents'
  | 'users'
  | 'entities'
  | 'relationships'
  | 'communities'
  | 'knowledge-graph'
  | 'explore';

export function CollectionTabs({
  selectedCollectionId,
  collections,
  onCollectionChange,
  onCollectionSelect,
}: CollectionTabsProps) {
  const { getClient } = useUserContext();
  const [activeTab, setActiveTab] = useState<TabValue>('documents');
  const router = useRouter();

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<TabValue>>(
    new Set(['documents'])
  );

  // Sync activeTab with query params
  useEffect(() => {
    if (!router.isReady) return;

    const tabFromQuery = router.query.tab as TabValue | undefined;
    const validTabs: TabValue[] = [
      'documents',
      'users',
      'entities',
      'relationships',
      'communities',
      'knowledge-graph',
      'explore',
    ];

    if (tabFromQuery && validTabs.includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [router.isReady, router.query.tab]);

  // Update URL when activeTab changes
  const handleTabChange = useCallback(
    (value: string) => {
      const newTab = value as TabValue;
      setActiveTab(newTab);

      const query: Record<string, string> = {};
      if (router.query.collection) {
        query.collection = router.query.collection as string;
      }
      if (newTab !== 'documents') {
        query.tab = newTab;
      }

      router.push(
        {
          pathname: '/explorer',
          query,
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  // Mark tab as loaded when it becomes active
  useEffect(() => {
    setLoadedTabs((prev) => new Set(prev).add(activeTab));
  }, [activeTab]);

  // Users data loading
  const shouldLoadUsers = loadedTabs.has('users') && !!selectedCollectionId;
  const {
    data: users,
    totalEntries: totalUserEntries,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useBatchFetch<User>({
    fetchFn: useCallback(
      async ({ offset, limit }) => {
        const client = await getClient();
        if (!client || !selectedCollectionId) {
          throw new Error('Client or collection ID not available');
        }
        return await client.collections.listUsers({
          id: selectedCollectionId,
          offset,
          limit,
        });
      },
      [getClient, selectedCollectionId]
    ),
    collectionId: selectedCollectionId,
    enabled: shouldLoadUsers,
    pageSize: 100,
  });

  // Entities data loading
  const shouldLoadEntities =
    (loadedTabs.has('entities') ||
      loadedTabs.has('knowledge-graph') ||
      loadedTabs.has('explore')) &&
    !!selectedCollectionId;
  const {
    data: entities,
    totalEntries: totalEntityEntries,
    loading: entitiesLoading,
    refetch: refetchEntities,
  } = useBatchFetch<EntityResponse>({
    fetchFn: useCallback(
      async ({ offset, limit }) => {
        const client = await getClient();
        if (!client || !selectedCollectionId) {
          throw new Error('Client or collection ID not available');
        }
        return await client.graphs.listEntities({
          collectionId: selectedCollectionId,
          offset,
          limit,
        });
      },
      [getClient, selectedCollectionId]
    ),
    collectionId: selectedCollectionId,
    enabled: shouldLoadEntities,
    pageSize: 100,
  });

  // Relationships data loading
  const shouldLoadRelationships =
    (loadedTabs.has('relationships') || loadedTabs.has('knowledge-graph')) &&
    !!selectedCollectionId;
  const {
    data: relationships,
    totalEntries: totalRelationshipEntries,
    loading: relationshipsLoading,
    refetch: refetchRelationships,
  } = useBatchFetch<RelationshipResponse>({
    fetchFn: useCallback(
      async ({ offset, limit }) => {
        const client = await getClient();
        if (!client || !selectedCollectionId) {
          throw new Error('Client or collection ID not available');
        }
        return await client.graphs.listRelationships({
          collectionId: selectedCollectionId,
          offset,
          limit,
        });
      },
      [getClient, selectedCollectionId]
    ),
    collectionId: selectedCollectionId,
    enabled: shouldLoadRelationships,
    pageSize: 100,
  });

  // Communities data loading
  const shouldLoadCommunities =
    loadedTabs.has('communities') && !!selectedCollectionId;
  const {
    data: communities,
    totalEntries: totalCommunityEntries,
    loading: communitiesLoading,
    refetch: refetchCommunities,
  } = useBatchFetch<CommunityResponse>({
    fetchFn: useCallback(
      async ({ offset, limit }) => {
        const client = await getClient();
        if (!client || !selectedCollectionId) {
          throw new Error('Client or collection ID not available');
        }
        return await client.graphs.listCommunities({
          collectionId: selectedCollectionId,
          offset,
          limit,
        });
      },
      [getClient, selectedCollectionId]
    ),
    collectionId: selectedCollectionId,
    enabled: shouldLoadCommunities,
    pageSize: 100,
  });

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="knowledge-graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="explore">Explore</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="flex-1">
          <FileManager
            selectedCollectionId={selectedCollectionId}
            collections={collections}
            onCollectionChange={onCollectionChange}
            onCollectionSelect={onCollectionSelect}
          />
        </TabsContent>

        <TabsContent value="users" className="flex-1 overflow-auto">
          <UsersTab
            users={users}
            totalEntries={totalUserEntries}
            loading={usersLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchUsers}
          />
        </TabsContent>

        <TabsContent value="entities" className="flex-1 overflow-auto">
          <EntitiesTab
            entities={entities}
            totalEntries={totalEntityEntries}
            loading={entitiesLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchEntities}
          />
        </TabsContent>

        <TabsContent value="relationships" className="flex-1 overflow-auto">
          <RelationshipsTab
            relationships={relationships}
            totalEntries={totalRelationshipEntries}
            loading={relationshipsLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchRelationships}
          />
        </TabsContent>

        <TabsContent value="communities" className="flex-1 overflow-auto">
          <CommunitiesTab
            communities={communities}
            totalEntries={totalCommunityEntries}
            loading={communitiesLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchCommunities}
          />
        </TabsContent>

        <TabsContent value="knowledge-graph" className="flex-1 overflow-auto">
          <KnowledgeGraphTab
            entities={entities}
            relationships={relationships}
            loading={entitiesLoading || relationshipsLoading}
          />
        </TabsContent>

        <TabsContent value="explore" className="flex-1 overflow-auto">
          <ExploreTab entities={entities} loading={entitiesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
