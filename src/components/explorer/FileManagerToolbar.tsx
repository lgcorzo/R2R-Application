'use client';

import { Upload } from 'lucide-react';
import React from 'react';

import { CollectionGraphActions } from '@/components/explorer/CollectionGraphActions';
import { ExplorerBreadcrumb } from '@/components/explorer/ExplorerBreadcrumb';
import { SearchBar } from '@/components/explorer/SearchBar';
import { SyncIndicator } from '@/components/explorer/SyncIndicator';
import { ViewModeToggle } from '@/components/explorer/ViewModeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchResultItem } from '@/hooks/useUnifiedSearch';

/**
 * FileManagerToolbar - Toolbar компонент для File Manager
 *
 * Объединяет breadcrumb навигацию, поиск, синхронизацию и действия
 */
interface FileManagerToolbarProps {
  /** Сегменты пути для breadcrumb (напр. ['All docs', 'Collection Name']) */
  breadcrumbPath: string[];
  /** Callback для навигации по breadcrumb */
  onNavigate: (index: number) => void;

  /** Поисковый запрос */
  searchQuery: string;
  /** Callback изменения поискового запроса */
  onSearchChange: (query: string) => void;
  /** Состояние фокуса поисковой строки */
  isSearchFocused: boolean;
  /** Callback при получении фокуса */
  onSearchFocus: () => void;
  /** Callback при потере фокуса */
  onSearchBlur: () => void;
  /** Результаты unified search */
  searchResults: SearchResultItem[];
  /** Индикатор выполнения поиска */
  isSearching: boolean;
  /** Callback клика на документ в результатах */
  onDocumentClick: (title: string) => void;
  /** Callback клика на коллекцию в результатах */
  onCollectionClick: (id: string) => void;
  /** Callback очистки поиска */
  onSearchClear: () => void;

  /** Индикатор polling статуса */
  isPolling: boolean;
  /** Количество pending документов */
  pendingCount: number;

  /** Текущий view mode */
  viewMode: 'list' | 'grid';
  /** Callback изменения view mode */
  onViewModeChange: (mode: 'list' | 'grid') => void;

  /** Callback клика на кнопку Upload */
  onUploadClick: () => void;

  /** ID выбранной коллекции (для graph actions) */
  selectedCollectionId?: string | null;
  /** Callback после успешного graph action */
  onGraphActionComplete?: () => void;
}

export function FileManagerToolbar({
  breadcrumbPath,
  onNavigate,
  searchQuery,
  onSearchChange,
  isSearchFocused,
  onSearchFocus,
  onSearchBlur,
  searchResults,
  isSearching,
  onDocumentClick,
  onCollectionClick,
  onSearchClear,
  isPolling,
  pendingCount,
  viewMode,
  onViewModeChange,
  onUploadClick,
  selectedCollectionId,
  onGraphActionComplete,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-background">
      {/* Первая строка: Breadcrumbs и Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-1 overflow-hidden">
          <SidebarTrigger className="shrink-0 h-7 w-7" />
          <Separator orientation="vertical" className="h-4 shrink-0" />
          <ExplorerBreadcrumb
            pathSegments={breadcrumbPath}
            onNavigate={onNavigate}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto mr-4">
          <CollectionGraphActions
            collectionId={selectedCollectionId ?? null}
            onActionComplete={onGraphActionComplete}
          />
          <SyncIndicator isPolling={isPolling} count={pendingCount} />
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            isFocused={isSearchFocused}
            searchResults={searchResults}
            isSearching={isSearching}
            onDocumentClick={onDocumentClick}
            onCollectionClick={onCollectionClick}
            onClear={onSearchClear}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>

          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>
      </div>
    </div>
  );
}
