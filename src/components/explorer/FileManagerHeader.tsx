'use client';

import { Grid, List, Loader2, Upload, X } from 'lucide-react';
import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ViewMode } from '@/types/explorer';

interface FileManagerHeaderProps {
  breadcrumbPath: string[];
  onBreadcrumbClick: (index: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUploadClick: () => void;
  isPolling?: boolean;
  pendingCount?: number;
}

export function FileManagerHeader({
  breadcrumbPath,
  onBreadcrumbClick,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  isPolling = false,
  pendingCount = 0,
}: FileManagerHeaderProps) {
  return (
    <div className="p-4 border-b">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbPath.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbPath.length - 1 ? (
                    <BreadcrumbPage>{item}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onBreadcrumbClick(index);
                      }}
                    >
                      {item}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Syncing indicator */}
        {isPolling && pendingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500 font-medium">
                    Syncing {pendingCount}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Auto-updating {pendingCount} document
                {pendingCount !== 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
