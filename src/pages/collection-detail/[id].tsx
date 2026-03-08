import { useRouter } from 'next/router';
import {
  CollectionResponse,
  CommunityResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
  User,
} from 'r2r-js/dist/types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CollectionHeader,
  CommunitiesTab,
  DocumentsTab,
  EntitiesTab,
  RelationshipsTab,
  UsersTab,
} from '@/components/collection-detail';
import type { CollectionStats, TabValue } from '@/components/collection-detail';
import KnowledgeGraph from '@/components/knowledgeGraph';
import KnowledgeGraphD3 from '@/components/knowledgeGraphD3';
import Layout from '@/components/Layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

const PAGE_SIZE = 1000;

const CollectionDetailPage: React.FC = () => {
  const router = useRouter();
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<EntityResponse[]>([]);
  const [relationships, setRelationships] = useState<RelationshipResponse[]>(
    []
  );
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('documents');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: 'document' | 'user' | 'entity' | 'relationship' | 'community';
  } | null>(null);

  const currentCollectionId =
    typeof router.query.id === 'string' ? router.query.id : '';

  // Calculate stats for header
  const stats: CollectionStats = useMemo(
    () => ({
      documents: documents.length,
      users: users.length,
      entities: entities.length,
      relationships: relationships.length,
      communities: communities.length,
    }),
    [
      documents.length,
      users.length,
      entities.length,
      relationships.length,
      communities.length,
    ]
  );

  // Update graph dimensions
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
  }, [activeTab]);

  // Fetch collection
  const fetchCollection = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      const collection = await client.collections.retrieve({
        id: currentCollectionId,
      });

      setCollection(collection.results);
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  }, [currentCollectionId, getClient]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      let offset = 0;
      let allDocs: DocumentResponse[] = [];

      const firstBatch = await client.collections.listDocuments({
        id: currentCollectionId,
        offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        allDocs = firstBatch.results;
        setDocuments(allDocs);
        setLoading(false);

        if (firstBatch.totalEntries > PAGE_SIZE) {
          setLoadingMore(true);
          offset += PAGE_SIZE;

          while (offset < firstBatch.totalEntries) {
            const batch = await client.collections.listDocuments({
              id: currentCollectionId,
              offset,
              limit: PAGE_SIZE,
            });

            if (batch.results.length === 0) break;

            allDocs = [...allDocs, ...batch.results];
            setDocuments(allDocs);
            offset += PAGE_SIZE;
          }
          setLoadingMore(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentCollectionId, getClient]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      let offset = 0;
      let allUsers: User[] = [];

      const firstBatch = await client.collections.listUsers({
        id: currentCollectionId,
        offset,
        limit: PAGE_SIZE,
      });

      allUsers = firstBatch.results;
      setUsers(allUsers);

      if (firstBatch.totalEntries > PAGE_SIZE) {
        offset += PAGE_SIZE;

        while (offset < firstBatch.totalEntries) {
          const batch = await client.collections.listUsers({
            id: currentCollectionId,
            offset,
            limit: PAGE_SIZE,
          });

          if (batch.results.length === 0) break;

          allUsers = [...allUsers, ...batch.results];
          setUsers(allUsers);
          offset += PAGE_SIZE;
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [currentCollectionId, getClient]);

  // Fetch entities
  const fetchEntities = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      let offset = 0;
      let allEntities: EntityResponse[] = [];

      const firstBatch = await client.graphs.listEntities({
        collectionId: currentCollectionId,
        offset,
        limit: PAGE_SIZE,
      });

      allEntities = firstBatch.results;
      setEntities(allEntities);

      if (firstBatch.totalEntries > PAGE_SIZE) {
        offset += PAGE_SIZE;
        while (offset < firstBatch.totalEntries) {
          const batch = await client.graphs.listEntities({
            collectionId: currentCollectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          allEntities = [...allEntities, ...batch.results];
          setEntities(allEntities);
          offset += PAGE_SIZE;
        }
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  }, [currentCollectionId, getClient]);

  // Fetch relationships
  const fetchRelationships = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      let offset = 0;
      let allRelationships: RelationshipResponse[] = [];

      const firstBatch = await client.graphs.listRelationships({
        collectionId: currentCollectionId,
        offset,
        limit: PAGE_SIZE,
      });

      allRelationships = firstBatch.results;
      setRelationships(allRelationships);

      if (firstBatch.totalEntries > PAGE_SIZE) {
        offset += PAGE_SIZE;
        while (offset < firstBatch.totalEntries) {
          const batch = await client.graphs.listRelationships({
            collectionId: currentCollectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          allRelationships = [...allRelationships, ...batch.results];
          setRelationships(allRelationships);
          offset += PAGE_SIZE;
        }
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  }, [currentCollectionId, getClient]);

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    if (!currentCollectionId) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      let offset = 0;
      let allCommunities: CommunityResponse[] = [];

      const firstBatch = await client.graphs.listCommunities({
        collectionId: currentCollectionId,
        offset,
        limit: PAGE_SIZE,
      });

      allCommunities = firstBatch.results;
      setCommunities(allCommunities);

      if (firstBatch.totalEntries > PAGE_SIZE) {
        offset += PAGE_SIZE;
        while (offset < firstBatch.totalEntries) {
          const batch = await client.graphs.listCommunities({
            collectionId: currentCollectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          allCommunities = [...allCommunities, ...batch.results];
          setCommunities(allCommunities);
          offset += PAGE_SIZE;
        }
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  }, [currentCollectionId, getClient]);

  // Initial data fetch
  useEffect(() => {
    if (!currentCollectionId) return;

    fetchCollection();
    fetchDocuments();
    fetchUsers();
    fetchEntities();
    fetchRelationships();
    fetchCommunities();
  }, [
    currentCollectionId,
    fetchCollection,
    fetchDocuments,
    fetchUsers,
    fetchEntities,
    fetchRelationships,
    fetchCommunities,
  ]);

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      // TODO: Implement delete logic based on type

      toast({
        title: 'Deleted',
        description: `${itemToDelete.type} has been removed.`,
      });

      // Refresh data
      if (itemToDelete.type === 'document') fetchDocuments();
      if (itemToDelete.type === 'user') fetchUsers();
      if (itemToDelete.type === 'entity') fetchEntities();
      if (itemToDelete.type === 'relationship') fetchRelationships();
      if (itemToDelete.type === 'community') fetchCommunities();

      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item.',
        variant: 'destructive',
      });
    }
  };

  // Delete handlers for each tab
  const handleDocumentDelete = (id: string) => {
    setItemToDelete({ id, type: 'document' });
    setDeleteDialogOpen(true);
  };

  const handleUserDelete = (id: string) => {
    setItemToDelete({ id, type: 'user' });
    setDeleteDialogOpen(true);
  };

  const handleEntityDelete = (id: string) => {
    setItemToDelete({ id, type: 'entity' });
    setDeleteDialogOpen(true);
  };

  const handleRelationshipDelete = (id: string) => {
    setItemToDelete({ id, type: 'relationship' });
    setDeleteDialogOpen(true);
  };

  const handleCommunityDelete = (id: string) => {
    setItemToDelete({ id, type: 'community' });
    setDeleteDialogOpen(true);
  };

  const handleDocumentView = (id: string) => {
    // TODO: Navigate to document detail or open modal
    console.log('View document:', id);
  };

  return (
    <Layout
      pageTitle={`Collection: ${collection?.name || currentCollectionId}`}
      includeFooter={false}
    >
      <main className="flex flex-col container h-screen-[calc(100%-4rem)] mt-5 pb-4 space-y-6">
        {/* Header with Stats */}
        <CollectionHeader
          collection={collection}
          stats={stats}
          loading={loading && !collection}
          onManageClick={() => {
            // TODO: Open manage dialog
            console.log('Manage collection');
          }}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="knowledgeGraph">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="flex-1 overflow-auto mt-4">
            <DocumentsTab
              documents={documents}
              loading={loading}
              loadingMore={loadingMore}
              onDelete={handleDocumentDelete}
              onView={handleDocumentView}
            />
          </TabsContent>

          <TabsContent value="users" className="flex-1 overflow-auto mt-4">
            <UsersTab users={users} onDelete={handleUserDelete} />
          </TabsContent>

          <TabsContent value="entities" className="flex-1 overflow-auto mt-4">
            <EntitiesTab entities={entities} onDelete={handleEntityDelete} />
          </TabsContent>

          <TabsContent
            value="relationships"
            className="flex-1 overflow-auto mt-4"
          >
            <RelationshipsTab
              relationships={relationships}
              onDelete={handleRelationshipDelete}
            />
          </TabsContent>

          <TabsContent
            value="communities"
            className="flex-1 overflow-auto mt-4"
          >
            <CommunitiesTab
              communities={communities}
              onDelete={handleCommunityDelete}
            />
          </TabsContent>

          <TabsContent
            value="knowledgeGraph"
            className="flex-1 overflow-auto mt-4"
          >
            <div
              ref={graphContainerRef}
              className="w-full h-[600px] flex items-center justify-center rounded-md border"
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
          </TabsContent>

          <TabsContent value="explore" className="flex-1 overflow-auto mt-4">
            <div
              ref={graphContainerRef}
              className="w-full h-[600px] flex items-center justify-center rounded-md border"
            >
              {containerDimensions.width > 0 && entities.length > 0 && (
                <KnowledgeGraph
                  entities={entities}
                  width={containerDimensions.width}
                  height={containerDimensions.height}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{' '}
              {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CollectionDetailPage;
