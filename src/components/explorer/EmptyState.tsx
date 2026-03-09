import { Folder, Upload, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  /** Title to display */
  title?: string;
  /** Description message */
  message: string;
  /** Icon to display (defaults to Folder) */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  /** Optional secondary action (e.g., clear filters) */
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

/**
 * EmptyState component for displaying empty or no-results states.
 * Supports custom icons, messages, and action buttons.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No files found',
  message,
  icon = <Folder className="h-6 w-6 text-muted-foreground" />,
  action,
  secondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-muted p-3">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        {message}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-4 flex space-x-2">
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.icon || <Upload className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon || <X className="h-4 w-4 mr-2" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
