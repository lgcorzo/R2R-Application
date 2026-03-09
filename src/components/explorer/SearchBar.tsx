'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Folder,
  Network,
  Link2,
  Users,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchResultItem } from '@/hooks/useUnifiedSearch';

export interface SearchBarProps {
  /**  Текущий поисковый запрос */
  searchQuery: string;
  /** Callback при изменении поискового запроса */
  onSearchChange: (query: string) => void;
  /** Callback при получении фокуса */
  onFocus: () => void;
  /** Callback при потере фокуса */
  onBlur: () => void;
  /** Флаг фокуса search input */
  isFocused: boolean;
  /** Результаты поиска */
  searchResults: SearchResultItem[];
  /** Флаг загрузки */
  isSearching: boolean;
  /** Callback при клике на результат документа */
  onDocumentClick: (title: string) => void;
  /** Callback при клике на результат коллекции */
  onCollectionClick: (id: string) => void;
  /** Callback при очистке поиска (опционально переключает на All Documents) */
  onClear: () => void;
}

/**
 * SearchBar - компонент поиска с dropdown результатами
 *
 * Использует unified search для поиска по документам, коллекциям,
 * entities, relationships и communities.
 *
 * @example
 * ```tsx
 * const { searchResults, isSearching } = useUnifiedSearch({ ... });
 *
 * <SearchBar
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   isFocused={isFocused}
 *   onFocus={() => setIsFocused(true)}
 *   onBlur={() => setIsFocused(false)}
 *   searchResults={searchResults}
 *   isSearching={isSearching}
 *   onDocumentClick={(title) => setQuery(title)}
 *   onCollectionClick={(id) => selectCollection(id)}
 *   onClear={() => { setQuery(''); selectCollection(null); }}
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onFocus,
  onBlur,
  isFocused,
  searchResults,
  isSearching,
  onDocumentClick,
  onCollectionClick,
  onClear,
}) => {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 flex-shrink-0" />;
      case 'collection':
        return <Folder className="h-4 w-4 flex-shrink-0" />;
      case 'entity':
        return <Network className="h-4 w-4 flex-shrink-0" />;
      case 'relationship':
        return <Link2 className="h-4 w-4 flex-shrink-0" />;
      case 'community':
        return <Users className="h-4 w-4 flex-shrink-0" />;
      default:
        return <FileText className="h-4 w-4 flex-shrink-0" />;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'text-blue-500';
      case 'collection':
        return 'text-purple-500';
      case 'entity':
        return 'text-green-500';
      case 'relationship':
        return 'text-orange-500';
      case 'community':
        return 'text-pink-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document':
        return 'Document';
      case 'collection':
        return 'Collection';
      case 'entity':
        return 'Entity';
      case 'relationship':
        return 'Relationship';
      case 'community':
        return 'Community';
      default:
        return 'Item';
    }
  };

  return (
    <div className="relative w-64">
      <Input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        onBlur={() => setTimeout(onBlur, 200)} // Delay to allow click on results
        className={`pl-3 ${searchQuery.length > 0 ? 'pr-20' : 'pr-9'} py-1.5 h-9 text-sm rounded-lg`}
      />
      {searchQuery.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            <motion.button
              key="clear"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </motion.button>
            <motion.div
              key="send"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Send className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isFocused && (searchResults.length > 0 || isSearching) && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1 border rounded-md shadow-sm overflow-hidden bg-background z-50 max-h-[400px] overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSearching ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            ) : (
              <>
                <ul>
                  {searchResults.map((result: SearchResultItem) => {
                    return (
                      <motion.li
                        key={`${result.type}-${result.id}`}
                        className="px-3 py-2.5 flex items-center justify-between hover:bg-muted cursor-pointer group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => {
                          if (result.type === 'document') {
                            onDocumentClick(result.title);
                          } else if (result.type === 'collection') {
                            onCollectionClick(result.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={getEntityColor(result.type)}>
                            {getEntityIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {result.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 h-5"
                              >
                                {getTypeLabel(result.type)}
                              </Badge>
                            </div>
                            {result.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {result.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {result.metadata?.score && (
                          <div className="ml-2 text-xs text-muted-foreground">
                            {(result.metadata.score * 100).toFixed(0)}%
                          </div>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
                {searchResults.length >= 8 && (
                  <div className="px-3 py-2 border-t text-xs text-muted-foreground text-center bg-muted/30">
                    Showing top {searchResults.length} results
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
