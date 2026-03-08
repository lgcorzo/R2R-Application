# Explorer Collection Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Объединить страницы Explorer и Collection Detail в единый интерфейс с табами для доступа ко всем функциям из одного места.

**Architecture:** Создаем компонент CollectionTabs с lazy loading данных для каждого таба (Users, Entities, Relationships, Communities, Knowledge Graph, Explore). FileManager переиспользуется для Documents таба. Query parameters управляют состоянием (collection, tab). Старая страница `/collections/[id]` редиректится на новый формат.

**Tech Stack:** React 18, Next.js 14 Pages Router, TypeScript, r2r-js, shadcn/ui Tabs, React hooks (useState, useEffect, useCallback, useMemo)

---

## Фаза 1: Подготовка инфраструктуры

### Task 1: Создать useBatchFetch hook

**Files:**
- Create: `src/hooks/useBatchFetch.ts`

**Step 1: Создать файл с типами и интерфейсом**

```typescript
import { useCallback, useEffect, useState } from 'react';

interface BatchFetchOptions<T> {
  fetchFn: (params: {
    offset: number;
    limit: number;
  }) => Promise<{ results: T[]; totalEntries: number }>;
  collectionId: string | null;
  enabled: boolean;
  pageSize?: number;
}

interface BatchFetchResult<T> {
  data: T[];
  totalEntries: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBatchFetch<T>({
  fetchFn,
  collectionId,
  enabled,
  pageSize = 100,
}: BatchFetchOptions<T>): BatchFetchResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!enabled || !collectionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch first batch
      const firstBatch = await fetchFn({
        offset: 0,
        limit: pageSize,
      });

      if (firstBatch.results.length === 0) {
        setData([]);
        setTotalEntries(0);
        setLoading(false);
        return;
      }

      setTotalEntries(firstBatch.totalEntries);
      setData(firstBatch.results);
      setLoading(false);

      // Fetch remaining batches in background
      let offset = pageSize;
      let allData = [...firstBatch.results];

      while (offset < firstBatch.totalEntries) {
        const batch = await fetchFn({
          offset,
          limit: pageSize,
        });

        if (batch.results.length === 0) {
          break;
        }

        allData = allData.concat(batch.results);
        setData([...allData]);

        offset += pageSize;
      }
    } catch (err) {
      console.error('Batch fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [fetchFn, collectionId, enabled, pageSize]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { data, totalEntries, loading, error, refetch };
}
```

**Step 2: Commit hook**

```bash
cd ~/.config/superpowers/worktrees/R2R-Application/feature/explorer-collection-integration
git add src/hooks/useBatchFetch.ts
git commit -m "feat: добавлен useBatchFetch hook для batch loading данных"
```

---

### Task 2: Создать директорию для tab компонентов

**Files:**
- Create: `src/components/explorer/tabs/` (directory)

**Step 1: Создать директорию**

```bash
cd ~/.config/superpowers/worktrees/R2R-Application/feature/explorer-collection-integration
mkdir -p src/components/explorer/tabs
```

**Step 2: Создать index.ts для экспортов**

Create: `src/components/explorer/tabs/index.ts`

```typescript
export { UsersTab } from './UsersTab';
export { EntitiesTab } from './EntitiesTab';
export { RelationshipsTab } from './RelationshipsTab';
export { CommunitiesTab } from './CommunitiesTab';
export { KnowledgeGraphTab } from './KnowledgeGraphTab';
export { ExploreTab } from './ExploreTab';
```

**Step 3: Commit структуру**

```bash
git add src/components/explorer/tabs/
git commit -m "chore: создана директория для tab компонентов"
```

---

## Фаза 2: Tab компоненты

### Task 3: Создать UsersTab компонент

**Files:**
- Create: `src/components/explorer/tabs/UsersTab.tsx`

**Step 1: Создать компонент**

```typescript
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
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/UsersTab.tsx
git commit -m "feat: добавлен UsersTab компонент"
```

---

### Task 4: Создать EntitiesTab компонент

**Files:**
- Create: `src/components/explorer/tabs/EntitiesTab.tsx`

**Step 1: Создать компонент**

```typescript
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
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/EntitiesTab.tsx
git commit -m "feat: добавлен EntitiesTab компонент"
```

---

### Task 5: Создать RelationshipsTab компонент

**Files:**
- Create: `src/components/explorer/tabs/RelationshipsTab.tsx`

**Step 1: Создать компонент**

```typescript
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
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/RelationshipsTab.tsx
git commit -m "feat: добавлен RelationshipsTab компонент"
```

---

### Task 6: Создать CommunitiesTab компонент

**Files:**
- Create: `src/components/explorer/tabs/CommunitiesTab.tsx`

**Step 1: Создать компонент**

```typescript
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
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/CommunitiesTab.tsx
git commit -m "feat: добавлен CommunitiesTab компонент"
```

---

### Task 7: Создать KnowledgeGraphTab компонент

**Files:**
- Create: `src/components/explorer/tabs/KnowledgeGraphTab.tsx`

**Step 1: Создать компонент**

```typescript
import { EntityResponse, RelationshipResponse } from 'r2r-js';
import React, { useEffect, useRef, useState } from 'react';

import KnowledgeGraphD3 from '@/components/knowledgeGraphD3';

interface KnowledgeGraphTabProps {
  entities: EntityResponse[];
  relationships: RelationshipResponse[];
  loading: boolean;
}

export function KnowledgeGraphTab({
  entities,
  relationships,
  loading,
}: KnowledgeGraphTabProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.offsetWidth;
        const height = graphContainerRef.current.offsetHeight;
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[550px]">
        <p>Loading knowledge graph...</p>
      </div>
    );
  }

  return (
    <div
      ref={graphContainerRef}
      className="w-full h-[550px] flex items-center justify-center"
    >
      {containerDimensions.width > 0 && (
        <KnowledgeGraphD3
          entities={entities}
          relationships={relationships}
          width={containerDimensions.width}
          height={containerDimensions.height}
          maxNodes={250}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/KnowledgeGraphTab.tsx
git commit -m "feat: добавлен KnowledgeGraphTab компонент"
```

---

### Task 8: Создать ExploreTab компонент

**Files:**
- Create: `src/components/explorer/tabs/ExploreTab.tsx`

**Step 1: Создать компонент**

```typescript
import { EntityResponse } from 'r2r-js';
import React, { useEffect, useRef, useState } from 'react';

import KnowledgeGraph from '@/components/knowledgeGraph';

interface ExploreTabProps {
  entities: EntityResponse[];
  loading: boolean;
}

export function ExploreTab({ entities, loading }: ExploreTabProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.offsetWidth;
        const height = graphContainerRef.current.offsetHeight;
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <p>Loading explore view...</p>
      </div>
    );
  }

  return (
    <div
      ref={graphContainerRef}
      className="w-full h-[600px] flex items-center justify-center"
    >
      {containerDimensions.width > 0 && entities.length > 0 && (
        <KnowledgeGraph
          entities={entities}
          width={containerDimensions.width}
          height={containerDimensions.height}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit компонент**

```bash
git add src/components/explorer/tabs/ExploreTab.tsx
git commit -m "feat: добавлен ExploreTab компонент"
```

**Step 3: Обновить index.ts экспорты**

Modify: `src/components/explorer/tabs/index.ts`

Убедиться что все компоненты экспортируются (уже должны быть из Task 2).

**Step 4: Commit обновления**

```bash
git add src/components/explorer/tabs/index.ts
git commit -m "chore: обновлены экспорты tab компонентов"
```

---

## Фаза 3: CollectionTabs компонент

### Task 9: Создать CollectionTabs с базовой структурой

**Files:**
- Create: `src/components/explorer/CollectionTabs.tsx`

**Step 1: Создать компонент с типами**

```typescript
'use client';

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

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
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
          <div className="p-4">Users tab - placeholder</div>
        </TabsContent>

        <TabsContent value="entities" className="flex-1 overflow-auto">
          <div className="p-4">Entities tab - placeholder</div>
        </TabsContent>

        <TabsContent value="relationships" className="flex-1 overflow-auto">
          <div className="p-4">Relationships tab - placeholder</div>
        </TabsContent>

        <TabsContent value="communities" className="flex-1 overflow-auto">
          <div className="p-4">Communities tab - placeholder</div>
        </TabsContent>

        <TabsContent value="knowledge-graph" className="flex-1 overflow-auto">
          <div className="p-4">Knowledge Graph tab - placeholder</div>
        </TabsContent>

        <TabsContent value="explore" className="flex-1 overflow-auto">
          <div className="p-4">Explore tab - placeholder</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Commit базовую структуру**

```bash
git add src/components/explorer/CollectionTabs.tsx
git commit -m "feat: добавлен CollectionTabs с базовой структурой табов"
```

---

### Task 10: Добавить lazy loading данных в CollectionTabs

**Files:**
- Modify: `src/components/explorer/CollectionTabs.tsx`

**Step 1: Добавить состояние для загрузки данных**

После строки `const [activeTab, setActiveTab] = useState<TabValue>('documents');` добавить:

```typescript
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<TabValue>>(
    new Set(['documents'])
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
```

**Step 2: Заменить placeholders на реальные компоненты**

Заменить TabsContent для users:

```typescript
        <TabsContent value="users" className="flex-1 overflow-auto">
          <UsersTab
            users={users}
            totalEntries={totalUserEntries}
            loading={usersLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchUsers}
          />
        </TabsContent>
```

Заменить TabsContent для entities:

```typescript
        <TabsContent value="entities" className="flex-1 overflow-auto">
          <EntitiesTab
            entities={entities}
            totalEntries={totalEntityEntries}
            loading={entitiesLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchEntities}
          />
        </TabsContent>
```

Заменить TabsContent для relationships:

```typescript
        <TabsContent value="relationships" className="flex-1 overflow-auto">
          <RelationshipsTab
            relationships={relationships}
            totalEntries={totalRelationshipEntries}
            loading={relationshipsLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchRelationships}
          />
        </TabsContent>
```

Заменить TabsContent для communities:

```typescript
        <TabsContent value="communities" className="flex-1 overflow-auto">
          <CommunitiesTab
            communities={communities}
            totalEntries={totalCommunityEntries}
            loading={communitiesLoading}
            collectionId={selectedCollectionId}
            onRefetch={refetchCommunities}
          />
        </TabsContent>
```

Заменить TabsContent для knowledge-graph:

```typescript
        <TabsContent value="knowledge-graph" className="flex-1 overflow-auto">
          <KnowledgeGraphTab
            entities={entities}
            relationships={relationships}
            loading={entitiesLoading || relationshipsLoading}
          />
        </TabsContent>
```

Заменить TabsContent для explore:

```typescript
        <TabsContent value="explore" className="flex-1 overflow-auto">
          <ExploreTab entities={entities} loading={entitiesLoading} />
        </TabsContent>
```

**Step 3: Commit lazy loading**

```bash
git add src/components/explorer/CollectionTabs.tsx
git commit -m "feat: добавлен lazy loading данных для всех табов в CollectionTabs"
```

---

## Фаза 4: Интеграция в ExplorerPage

### Task 11: Добавить query parameters в ExplorerPage

**Files:**
- Modify: `src/pages/explorer.tsx`

**Step 1: Добавить импорт useRouter**

После строки `import { useUserContext } from '@/context/UserContext';` добавить:

```typescript
import { useRouter } from 'next/router';
```

**Step 2: Добавить query params синхронизацию**

После строки `const [collections, setCollections] = useState<CollectionResponse[]>([]);` добавить:

```typescript
  const router = useRouter();

  // Sync selectedCollectionId with query params
  useEffect(() => {
    if (!router.isReady) return;

    const collectionFromQuery = router.query.collection as string | undefined;

    if (collectionFromQuery && collectionFromQuery !== selectedCollectionId) {
      setSelectedCollectionId(collectionFromQuery);
    } else if (!collectionFromQuery && selectedCollectionId === null) {
      // Default collection logic - можно установить 'default' ID если известен
      // Пока оставляем null
    }
  }, [router.isReady, router.query.collection, selectedCollectionId]);

  // Update URL when selectedCollectionId changes
  const handleCollectionSelect = useCallback(
    (collectionId: string | null) => {
      setSelectedCollectionId(collectionId);

      const query: Record<string, string> = {};
      if (collectionId) {
        query.collection = collectionId;
      }
      if (router.query.tab) {
        query.tab = router.query.tab as string;
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
```

**Step 3: Заменить FileManager на CollectionTabs**

Заменить импорт FileManager:

```typescript
import { CollectionTabs } from '@/components/explorer/CollectionTabs';
```

Удалить старый импорт:
```typescript
// Удалить: import { FileManager } from '@/components/explorer/FileManager';
```

Заменить в JSX (строки 57-65):

```typescript
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <CollectionTabs
              selectedCollectionId={selectedCollectionId}
              collections={collections}
              onCollectionChange={fetchCollections}
              onCollectionSelect={handleCollectionSelect}
            />
          </div>
        </SidebarInset>
```

**Step 4: Commit интеграцию**

```bash
git add src/pages/explorer.tsx
git commit -m "feat: интегрирован CollectionTabs в ExplorerPage с query params"
```

---

### Task 12: Добавить синхронизацию tab query parameter

**Files:**
- Modify: `src/components/explorer/CollectionTabs.tsx`

**Step 1: Добавить импорт useRouter**

После `import { useUserContext } from '@/context/UserContext';` добавить:

```typescript
import { useRouter } from 'next/router';
```

**Step 2: Добавить синхронизацию с URL**

После строки `const [activeTab, setActiveTab] = useState<TabValue>('documents');` добавить:

```typescript
  const router = useRouter();

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
```

**Step 3: Использовать handleTabChange**

Заменить в Tabs:

```typescript
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col flex-1"
        >
```

**Step 4: Commit синхронизацию**

```bash
git add src/components/explorer/CollectionTabs.tsx
git commit -m "feat: добавлена синхронизация activeTab с query params"
```

---

## Фаза 5: Редирект со старой страницы

### Task 13: Создать редирект на /collections/[id]

**Files:**
- Modify: `src/pages/collections/[id].tsx`

**Step 1: Полностью заменить содержимое файла**

Прочитать существующий файл и заменить его на:

```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Layout from '@/components/Layout';

const CollectionRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { id } = router.query;
    if (typeof id === 'string') {
      router.replace(`/explorer?collection=${id}&tab=documents`);
    }
  }, [router.isReady, router.query.id, router]);

  return (
    <Layout pageTitle="Redirecting..." includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">
        <p>Redirecting to Explorer...</p>
      </main>
    </Layout>
  );
};

export default CollectionRedirect;
```

**Step 2: Commit редирект**

```bash
git add src/pages/collections/[id].tsx
git commit -m "feat: добавлен редирект с /collections/[id] на /explorer"
```

---

## Фаза 6: Финальное тестирование

### Task 14: Проверить lint и билд

**Step 1: Запустить lint**

```bash
cd ~/.config/superpowers/worktrees/R2R-Application/feature/explorer-collection-integration
pnpm lint
```

Expected: No errors

**Step 2: Запустить билд**

```bash
pnpm build
```

Expected: Build успешный без ошибок

**Step 3: Commit если были автофиксы**

```bash
git add -A
git commit -m "chore: lint автофиксы" || echo "No changes to commit"
```

---

### Task 15: Ручное тестирование функционала

**Step 1: Запустить dev сервер**

```bash
pnpm dev
```

**Step 2: Проверить основные сценарии**

Открыть в браузере: http://localhost:3005/explorer

Проверить:
- ✅ Страница загружается
- ✅ Sidebar с коллекциями виден
- ✅ Табы отображаются корректно
- ✅ Documents таб показывает FileManager
- ✅ Переключение на Users таб загружает пользователей
- ✅ Переключение на Entities таб загружает entities
- ✅ Переключение на Relationships таб загружает relationships
- ✅ Переключение на Communities таб загружает communities
- ✅ Переключение на Knowledge Graph таб показывает граф
- ✅ Переключение на Explore таб показывает explore view
- ✅ URL обновляется при переключении табов
- ✅ Прямая ссылка `/explorer?collection=abc&tab=entities` работает
- ✅ Редирект с `/collections/[id]` работает

**Step 3: Проверить lazy loading**

- Открыть DevTools -> Network
- Перейти на Users таб
- Убедиться что API запрос отправился только сейчас (не при загрузке страницы)

**Step 4: Создать чеклист в документе**

Create: `docs/plans/2025-12-17-explorer-collection-integration-testing.md`

```markdown
# Testing Checklist

## Функциональное тестирование

- [ ] Страница /explorer загружается
- [ ] Sidebar с коллекциями отображается
- [ ] Все 7 табов видны
- [ ] Documents таб показывает FileManager
- [ ] Users таб загружает и отображает пользователей
- [ ] Entities таб загружает и отображает entities
- [ ] Relationships таб загружает и отображает relationships
- [ ] Communities таб загружает и отображает communities
- [ ] Knowledge Graph таб показывает D3 граф
- [ ] Explore таб показывает explore визуализацию
- [ ] Query params синхронизируются с UI
- [ ] Прямые ссылки с query params работают
- [ ] Редирект с /collections/[id] работает

## Lazy Loading

- [ ] Documents таб не вызывает API для других табов
- [ ] Users таб загружает данные только при открытии
- [ ] Entities таб загружает данные только при открытии
- [ ] Данные кэшируются при переключении табов

## Обратная совместимость

- [ ] Старые ссылки /collections/abc123 редиректятся
- [ ] FileManager функционал работает без регрессий
- [ ] Upload работает
- [ ] Bulk actions работают
```

**Step 5: Commit тестовый документ**

```bash
git add docs/plans/2025-12-17-explorer-collection-integration-testing.md
git commit -m "docs: добавлен testing checklist"
```

---

## Критерии приемки

- ✅ Все компоненты созданы и экспортируются
- ✅ CollectionTabs интегрирован в ExplorerPage
- ✅ Query parameters синхронизируются с UI
- ✅ Lazy loading работает для всех табов
- ✅ Старая страница редиректится на новый формат
- ✅ Lint проходит без ошибок
- ✅ Build успешный
- ✅ Ручное тестирование подтверждает функциональность

## Известные ограничения

- Default коллекция: нужно будет добавить логику определения default collection ID после бэкенд интеграции
- Пагинация в табах: используется клиентская пагинация через Table компонент
- Performance: при больших данных (>1000 записей) может быть задержка при первой загрузке таба

## Следующие шаги после реализации

1. Обновить ссылки в документации на новый формат URL
2. Добавить аналитику для отслеживания использования табов
3. Оптимизировать batch loading для очень больших коллекций
4. Добавить skeleton loaders для лучшего UX при загрузке
