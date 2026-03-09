import { format } from 'date-fns';
import { File, FileText } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { IngestionStatus, KGExtractionStatus } from '@/types';

/**
 * Форматирует размер файла в человекочитаемый формат
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Форматирует дату в локализованный формат
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Извлекает имя файла из пути
 */
export function getFileNameOnly(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * Определяет иконку по типу документа
 */
export function getDocumentIcon(documentType: string | undefined): string {
  const typeMap: Record<string, string> = {
    pdf: 'file-text',
    txt: 'file-text',
    md: 'file-text',
    doc: 'file-text',
    docx: 'file-text',
    csv: 'table',
    xlsx: 'table',
    json: 'braces',
    html: 'code',
  };
  return typeMap[documentType?.toLowerCase() || ''] || 'file';
}

/**
 * Возвращает React иконку для документа на основе его типа
 */
export function getFileIcon(doc: DocumentResponse): React.ReactElement {
  const type = doc.documentType?.toLowerCase() || '';
  if (type.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
    return <FileText className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

/**
 * Форматирует дату в локальный формат с использованием date-fns
 */
export function formatDateLocal(date: Date | string | undefined): string {
  if (!date) return '-';
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Возвращает Badge компонент с соответствующим вариантом для статуса
 */
export function getStatusBadge(
  status: string | undefined,
  type: 'ingestion' | 'extraction'
): React.ReactElement | null {
  if (!status) return null;

  let variant: 'default' | 'destructive' | 'secondary' | 'outline' =
    'secondary';

  // Normalize status to lowercase for comparison
  const normalizedStatus = status.toLowerCase();

  if (type === 'ingestion') {
    // Check for success
    if (
      normalizedStatus === IngestionStatus.SUCCESS.toLowerCase() ||
      normalizedStatus === 'success'
    ) {
      variant = 'default';
    }
    // Check for failed
    else if (
      normalizedStatus === IngestionStatus.FAILED.toLowerCase() ||
      normalizedStatus === 'failed'
    ) {
      variant = 'destructive';
    }
    // Check for pending/intermediate statuses (including enriched/enriching)
    else if (
      normalizedStatus === IngestionStatus.PENDING.toLowerCase() ||
      normalizedStatus === IngestionStatus.PARSING.toLowerCase() ||
      normalizedStatus === IngestionStatus.EXTRACTING.toLowerCase() ||
      normalizedStatus === IngestionStatus.CHUNKING.toLowerCase() ||
      normalizedStatus === IngestionStatus.EMBEDDING.toLowerCase() ||
      normalizedStatus === IngestionStatus.AUGMENTING.toLowerCase() ||
      normalizedStatus === IngestionStatus.STORING.toLowerCase() ||
      normalizedStatus === IngestionStatus.ENRICHING.toLowerCase() ||
      normalizedStatus === 'enriched' || // Handle "enriched" as well
      normalizedStatus === 'parsing' ||
      normalizedStatus === 'extracting' ||
      normalizedStatus === 'chunking' ||
      normalizedStatus === 'embedding' ||
      normalizedStatus === 'augmenting' ||
      normalizedStatus === 'storing' ||
      normalizedStatus === 'enriching' ||
      normalizedStatus === 'pending'
    ) {
      variant = 'secondary';
    }
    // Default to secondary for unknown statuses
    else {
      variant = 'secondary';
    }
  } else {
    // Check for success
    if (
      normalizedStatus === KGExtractionStatus.SUCCESS.toLowerCase() ||
      normalizedStatus === 'success'
    ) {
      variant = 'default';
    }
    // Check for failed
    else if (
      normalizedStatus === KGExtractionStatus.FAILED.toLowerCase() ||
      normalizedStatus === 'failed'
    ) {
      variant = 'destructive';
    }
    // Check for pending/processing
    else if (
      normalizedStatus === KGExtractionStatus.PENDING.toLowerCase() ||
      normalizedStatus === KGExtractionStatus.PROCESSING.toLowerCase() ||
      normalizedStatus === 'pending' ||
      normalizedStatus === 'processing'
    ) {
      variant = 'secondary';
    }
    // Default to secondary for unknown statuses
    else {
      variant = 'secondary';
    }
  }

  return <Badge variant={variant}>{status}</Badge>;
}
