'use client';

import { GitMerge, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

/**
 * CollectionGraphActions - Кнопки действий для графа коллекции
 *
 * Три действия (в порядке workflow):
 * 1. Pull - подтянуть entities/relationships из документов в граф
 * 2. Build - построить communities на основе графа
 * 3. Reset - сбросить граф (удалить entities, relationships, communities)
 */
interface CollectionGraphActionsProps {
  /** ID коллекции для которой выполняются действия */
  collectionId: string | null;
  /** Callback после успешного действия (для обновления данных) */
  onActionComplete?: () => void;
}

export function CollectionGraphActions({
  collectionId,
  onActionComplete,
}: CollectionGraphActionsProps) {
  const { getClient } = useUserContext();
  const { toast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  // Не показываем кнопки если не выбрана коллекция
  if (!collectionId) {
    return null;
  }

  const handlePull = async () => {
    if (!collectionId) return;

    setIsPulling(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.graphs.pull({ collectionId });

      toast({
        variant: 'success',
        title: 'Pull Started',
        description:
          'Extracting document entities and relationships into the graph...',
      });

      onActionComplete?.();
    } catch (error) {
      console.error('Error pulling graph data:', error);
      toast({
        variant: 'destructive',
        title: 'Pull Failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleBuildCommunities = async () => {
    if (!collectionId) return;

    setIsBuilding(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.graphs.buildCommunities({
        collectionId,
        runType: 'run',
      });

      toast({
        variant: 'success',
        title: 'Building Communities',
        description:
          'Community detection process has started. This may take a few minutes.',
      });

      onActionComplete?.();
    } catch (error) {
      console.error('Error building communities:', error);
      toast({
        variant: 'destructive',
        title: 'Build Failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const handleReset = async () => {
    if (!collectionId) return;

    setIsResetting(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.graphs.reset({ collectionId });

      toast({
        variant: 'success',
        title: 'Graph Reset',
        description:
          'All entities, relationships and communities have been removed from the graph.',
      });

      onActionComplete?.();
    } catch (error) {
      console.error('Error resetting graph:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const isAnyLoading = isPulling || isResetting || isBuilding;

  return (
    <div className="flex items-center gap-2">
      {/* Pull Button - первый шаг workflow */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePull}
        disabled={isAnyLoading}
        className="h-9 px-3 rounded-lg"
      >
        {isPulling ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <GitMerge className="h-4 w-4 mr-1.5" />
        )}
        Pull
      </Button>

      {/* Build Communities Button - второй шаг */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleBuildCommunities}
        disabled={isAnyLoading}
        className="h-9 px-3 rounded-lg"
      >
        {isBuilding ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1.5" />
        )}
        Build
      </Button>

      {/* Reset Button - деструктивное действие в конце */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={isAnyLoading}
        className="h-9 px-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      >
        {isResetting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-1.5" />
        )}
        Reset
      </Button>
    </div>
  );
}
