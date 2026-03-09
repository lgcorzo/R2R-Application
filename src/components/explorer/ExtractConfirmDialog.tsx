'use client';

import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExtractConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Количество выбранных документов */
  selectedCount: number;
  /** Количество документов, которые уже были извлечены (re-extraction) */
  alreadyExtractedCount: number;
  /** Количество документов с failed extraction */
  failedExtractionCount: number;
}

/**
 * ExtractConfirmDialog - Диалог подтверждения извлечения сущностей
 *
 * Предупреждает пользователя о:
 * - Re-extraction (перезапись существующих entities/relationships)
 * - Failed extractions (повторная попытка)
 * - Общем количестве документов для обработки
 */
export function ExtractConfirmDialog({
  open,
  onClose,
  onConfirm,
  selectedCount,
  alreadyExtractedCount,
  failedExtractionCount,
}: ExtractConfirmDialogProps) {
  const hasReExtraction = alreadyExtractedCount > 0;
  const hasFailedRetry = failedExtractionCount > 0;

  const getDescription = () => {
    const parts: string[] = [];

    if (selectedCount === 0) {
      return 'No documents selected for extraction.';
    }

    parts.push(
      `Extract knowledge graph entities and relationships from ${selectedCount} document${selectedCount !== 1 ? 's' : ''}.`
    );

    if (hasReExtraction) {
      parts.push(
        `\n\n⚠️ Warning: ${alreadyExtractedCount} document${alreadyExtractedCount !== 1 ? 's have' : ' has'} already been extracted. This will re-extract and potentially overwrite existing entities and relationships.`
      );
    }

    if (hasFailedRetry) {
      parts.push(
        `\n\n🔄 ${failedExtractionCount} document${failedExtractionCount !== 1 ? 's' : ''} will be retried after previous failure.`
      );
    }

    parts.push(
      `\n\nThis operation may take several minutes depending on document size.`
    );

    return parts.join('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasReExtraction
              ? 'Re-extract Knowledge Graph?'
              : 'Extract Knowledge Graph?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              hasReExtraction ? 'bg-orange-600 hover:bg-orange-700' : ''
            }
          >
            {hasReExtraction ? 'Re-extract' : 'Extract'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
