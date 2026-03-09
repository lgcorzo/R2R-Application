'use client';

import { Filter, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface StatusFilterProps {
  /** Заголовок фильтра (например, "Ingestion Status") */
  title: string;
  /** Список доступных статусов для фильтрации */
  availableStatuses: string[];
  /** Текущие выбранные статусы */
  selectedStatuses: string[];
  /** Callback при изменении выбранных статусов */
  onStatusChange: (statuses: string[]) => void;
  /** Callback при очистке фильтра */
  onClear: () => void;
}

/**
 * StatusFilter - компонент dropdown фильтра по статусам
 *
 * Используется для фильтрации документов по ingestion/extraction статусам
 * с checkbox списком и счетчиком выбранных элементов.
 *
 * @example
 * ```tsx
 * <StatusFilter
 *   title="Ingestion Status"
 *   availableStatuses={["pending", "parsing", "success", "failed"]}
 *   selectedStatuses={filters.ingestionStatus}
 *   onStatusChange={(statuses) => setFilters(prev => ({ ...prev, ingestionStatus: statuses }))}
 *   onClear={() => setFilters(prev => ({ ...prev, ingestionStatus: [] }))}
 * />
 * ```
 */
export const StatusFilter: React.FC<StatusFilterProps> = ({
  title,
  availableStatuses,
  selectedStatuses,
  onStatusChange,
  onClear,
}) => {
  const toggleStatus = (status: string) => {
    const isSelected = selectedStatuses.includes(status);
    const newStatuses = isSelected
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newStatuses);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 relative">
          <Filter
            className={`h-4 w-4 ${
              selectedStatuses.length > 0 ? 'text-primary' : 'opacity-50'
            }`}
          />
          {selectedStatuses.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
              {selectedStatuses.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="p-2">
          <div className="text-xs font-semibold mb-2 px-2">{title}</div>
          <div className="space-y-1">
            {availableStatuses.map((status) => (
              <div
                key={status}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                onClick={() => toggleStatus(status)}
              >
                <Checkbox
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                />
                <label className="text-sm cursor-pointer flex-1">
                  {status}
                </label>
              </div>
            ))}
          </div>
          {selectedStatuses.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={onClear}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
