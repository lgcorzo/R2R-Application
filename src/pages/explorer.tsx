'use client';

import { useRouter } from 'next/router';
import { CollectionResponse } from 'r2r-js';
import React, { useCallback, useEffect, useState } from 'react';

import { CollectionTabs } from '@/components/explorer/CollectionTabs';
import { ExplorerSidebar } from '@/components/explorer/ExplorerSidebar';
import { Navbar } from '@/components/shared/NavBar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useUserContext } from '@/context/UserContext';

/**
 * ExplorerPage - Главная страница файлового менеджера
 *
 * Ответственность:
 * - Layout и маршрутизация
 * - Управление списком коллекций
 * - Sidebar для навигации по коллекциям
 */
export default function ExplorerPage() {
  const { getClient, authState } = useUserContext();
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const router = useRouter();

  const fetchCollections = useCallback(async () => {
    if (!authState.isAuthenticated) return;

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
  }, [authState.isAuthenticated, getClient]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <ExplorerSidebar
          collapsible="icon"
          selectedCollectionId={selectedCollectionId}
          onCollectionSelect={handleCollectionSelect}
        />
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
      </SidebarProvider>
    </div>
  );
}
