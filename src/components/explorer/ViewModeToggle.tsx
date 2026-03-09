import { Grid, List } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export type ViewMode = 'list' | 'grid';

export interface ViewModeToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Toggle between list and grid view modes
 *
 * Provides a unified button group to switch between list and grid display modes.
 * The active mode is highlighted with secondary variant.
 *
 * @example
 * ```tsx
 * <ViewModeToggle
 *   viewMode="list"
 *   onViewModeChange={(mode) => setViewMode(mode)}
 * />
 * ```
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
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
  );
};
