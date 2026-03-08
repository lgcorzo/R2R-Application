import { Loader2 } from 'lucide-react';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface SyncIndicatorProps {
  /** Whether syncing is in progress */
  isPolling: boolean;
  /** Number of items being synced */
  count: number;
  /** Optional label for the items (default: 'document') */
  itemLabel?: string;
}

/**
 * Indicator showing real-time syncing status with animated loader
 *
 * Displays a blue badge with spinner when polling is active and there are pending items.
 * Provides tooltip with detailed count information.
 *
 * @example
 * ```tsx
 * <SyncIndicator
 *   isPolling={true}
 *   count={5}
 *   itemLabel="document"
 * />
 * ```
 */
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isPolling,
  count,
  itemLabel = 'document',
}) => {
  if (!isPolling || count === 0) {
    return null;
  }

  const pluralLabel = count !== 1 ? `${itemLabel}s` : itemLabel;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            <span className="text-xs text-blue-500 font-medium">
              Syncing {count}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Auto-updating {count} {pluralLabel} with pending status
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
