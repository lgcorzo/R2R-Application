'use client';

import { ChevronRight, FileText, Folder } from 'lucide-react';
import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface ExplorerBreadcrumbProps {
  /** Массив имен для breadcrumb path (например, ['All docs', 'My Collection']) */
  pathSegments: string[];
  /** Callback при клике на breadcrumb элемент */
  onNavigate: (index: number) => void;
}

/**
 * ExplorerBreadcrumb - компонент breadcrumb навигации для explorer
 *
 * Отображает иерархию навигации с иконками для "All docs" и коллекций.
 *
 * @example
 * ```tsx
 * <ExplorerBreadcrumb
 *   pathSegments={['All docs', 'My Collection']}
 *   onNavigate={(index) => {
 *     if (index === 0) {
 *       onCollectionSelect(null);
 *     }
 *   }}
 * />
 * ```
 */
export const ExplorerBreadcrumb: React.FC<ExplorerBreadcrumbProps> = ({
  pathSegments,
  onNavigate,
}) => {
  return (
    <Breadcrumb className="flex-1">
      <BreadcrumbList>
        {pathSegments.map((segment, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {index === pathSegments.length - 1 ? (
                <BreadcrumbPage className="flex items-center gap-2">
                  {index === 0 ? (
                    <FileText className="h-4 w-4 shrink-0" />
                  ) : (
                    <>
                      <Folder className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[200px]">{segment}</span>
                    </>
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => onNavigate(index)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {index === 0 ? (
                    <FileText className="h-4 w-4 shrink-0" />
                  ) : (
                    <>
                      <Folder className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[200px]">{segment}</span>
                    </>
                  )}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < pathSegments.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
