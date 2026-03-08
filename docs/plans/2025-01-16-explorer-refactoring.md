# Explorer Page Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Разбить монолитный `explorer.tsx` (4079 строк) на модульные компоненты для улучшения поддерживаемости и производительности.

**Architecture:** Выделение логических блоков в отдельные файлы: AppSidebar, FileManager, hooks для upload/search/bulk-actions. Сохранение существующей функциональности, shadcn/ui компоненты, r2r-js SDK интеграция.

**Tech Stack:** Next.js 14 (Pages Router), TypeScript, React 18, shadcn/ui, Tailwind CSS, r2r-js SDK v0.4.43

---

## Справочник: r2r-js SDK API

### Documents API
```javascript
// Создание документа
const result = await client.documents.create({
  file: { path: "document.pdf", name: "document.pdf" },
  metadata: { category: "research" },
  ingestionMode: "hi-res"  // "fast" | "hi-res" | "custom"
});

// Получение документа
const doc = await client.documents.retrieve({ id: documentId });

// Список документов
const docs = await client.documents.list({ limit: 100, offset: 0 });

// Удаление документа
await client.documents.delete({ id: documentId });

// Скачивание документа
const blob = await client.documents.download({ id: documentId });

// Список chunks документа
const chunks = await client.documents.listChunks({
  id: documentId,
  offset: 0,
  limit: 50
});

// Извлечение (KG extraction)
await client.documents.extract({ id: documentId });

// Список entities документа
const entities = await client.documents.listEntities({
  id: documentId,
  offset: 0,
  limit: 50
});

// Список relationships документа
const relationships = await client.documents.listRelationships({
  id: documentId,
  offset: 0,
  limit: 50
});
```

### Collections API
```javascript
// Список коллекций
const collections = await client.collections.list({ limit: 100, offset: 0 });

// Документы в коллекции
const docs = await client.collections.listDocuments({
  id: collectionId,
  limit: 100,
  offset: 0
});

// Добавить документ в коллекцию
await client.collections.addDocument({
  id: collectionId,
  documentId: documentId
});

// Удалить документ из коллекции
await client.collections.removeDocument({
  id: collectionId,
  documentId: documentId
});
```

### Chunks API
```javascript
// Получить chunk
const chunk = await client.chunks.retrieve({ id: chunkId });

// Обновить chunk
await client.chunks.update({
  id: chunkId,
  text: "Updated text",
  metadata: { edited: true }
});

// Удалить chunk
await client.chunks.delete({ id: chunkId });
```

### Retrieval API (Search & RAG)
```javascript
// Semantic search
const results = await client.retrieval.search({
  query: "What is machine learning?",
  searchSettings: {
    useSemanticSearch: true,
    limit: 10
  }
});

// Hybrid search (semantic + fulltext)
const hybridResults = await client.retrieval.search({
  query: "What was Uber's profit in 2020?",
  searchSettings: {
    useHybridSearch: true,
    hybridSettings: {
      fullTextWeight: 1.0,
      semanticWeight: 5.0,
      fullTextLimit: 200,
      rrfK: 50
    },
    filters: { "metadata.title": { "$in": ["uber_2021.pdf"] } },
    limit: 10
  }
});

// Knowledge Graph search
const kgResults = await client.retrieval.search({
  query: "Who was Aristotle?",
  graphSearchSettings: {
    useGraphSearch: true,
    kgSearchType: "local"
  }
});

// RAG (Retrieval-Augmented Generation)
const ragResponse = await client.retrieval.rag({
  query: "Summarize the main findings",
  searchSettings: { useHybridSearch: true },
  ragGenerationConfig: {
    model: "anthropic/claude-3-haiku-20240307",
    temperature: 0.5,
    stream: false
  }
});
```

### Graphs API (Knowledge Graph)
```javascript
// Извлечь entities и relationships из документа
await client.documents.extract({ id: documentId });

// Список entities документа
const entities = await client.documents.listEntities({
  id: documentId,
  offset: 0,
  limit: 50
});
// Response: { results: [{ name, category, description, id }], totalEntries }

// Список relationships документа
const relationships = await client.documents.listRelationships({
  id: documentId,
  offset: 0,
  limit: 50
});
// Response: { results: [{ subject, predicate, object, description }], totalEntries }

// Список entities в графе коллекции
const graphEntities = await client.graphs.listEntities(collectionId);

// Список relationships в графе коллекции
const graphRelationships = await client.graphs.listRelationships(collectionId);

// Создать custom entity
await client.graphs.createEntity({
  collectionId,
  name: "Custom Entity",
  category: "CONCEPT",
  description: "Description of the entity",
  metadata: { source: "manual" }
});

// Создать custom relationship
await client.graphs.createRelationship({
  collectionId,
  subject: "Entity A",
  predicate: "RELATES_TO",
  object: "Entity B",
  description: "Description of relationship"
});

// Удалить entity из графа
await client.graphs.removeEntity({
  collectionId,
  entityId
});
```

---

## Справочник: shadcn/ui компоненты

### Используемые компоненты в explorer
| Компонент | Зависимости | Назначение |
|-----------|-------------|------------|
| `sidebar` | @radix-ui/react-slot, class-variance-authority, lucide-react | Боковая панель с коллекциями |
| `dialog` | @radix-ui/react-dialog | Модальные окна (upload, details) |
| `table` | - | Список документов |
| `button` | @radix-ui/react-slot, class-variance-authority | Кнопки действий |
| `input` | - | Поля ввода (поиск, метаданные) |
| `badge` | class-variance-authority | Статусы документов |
| `breadcrumb` | @radix-ui/react-slot | Навигация по коллекциям |
| `dropdown-menu` | @radix-ui/react-dropdown-menu | Контекстные меню |
| `tooltip` | @radix-ui/react-tooltip | Подсказки |
| `tabs` | @radix-ui/react-tabs | Вкладки (file/url upload) |
| `select` | @radix-ui/react-select | Выбор коллекций, качества |
| `checkbox` | @radix-ui/react-checkbox | Выбор документов |
| `scroll-area` | @radix-ui/react-scroll-area | Скроллируемые области |
| `progress` | @radix-ui/react-progress | Прогресс загрузки |

### Импорты shadcn/ui
```typescript
// Типичный паттерн импорта
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, SidebarInset, SidebarProvider, SidebarTrigger
} from '@/components/ui/sidebar';
```

### Пример: Sidebar с иконками
```tsx
"use client"

import { HomeIcon, InboxIcon, SettingsIcon } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger
} from "@/components/ui/sidebar"

const items = [
  { title: "Home", url: "#", icon: HomeIcon },
  { title: "Inbox", url: "#", icon: InboxIcon },
  { title: "Settings", url: "#", icon: SettingsIcon },
]

export default function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center px-4">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Пример: Dialog с формой
```tsx
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Пример: Table с данными
```tsx
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table"

export function TableDemo() {
  return (
    <Table>
      <TableCaption>A list of documents.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">document.pdf</TableCell>
          <TableCell>
            <Badge variant="default">success</Badge>
          </TableCell>
          <TableCell className="text-right">1.2 MB</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
```

---

## Обзор рефакторинга

### Текущая структура
```text
src/pages/explorer.tsx (4079 строк)
├── formatFileSize()           # helper
├── formatDateHelper()         # helper (не используется)
├── Tree()                     # компонент (не используется)
├── AppSidebar()               # sidebar с коллекциями
└── FileManager()              # основной менеджер файлов (~3500 строк)
    ├── state management       # ~50 useState
    ├── fetchFiles()
    ├── useDocumentPolling()
    ├── search logic           # ~200 строк
    ├── handleBulkAction()     # bulk operations
    ├── handleFileUpload()     # upload logic (~400 строк)
    └── JSX render             # ~1500 строк
```

### Целевая структура
```text
src/
├── pages/explorer.tsx                    # ~150 строк (layout only)
├── components/explorer/
│   ├── ExplorerSidebar.tsx              # sidebar с коллекциями
│   ├── FileManager/
│   │   ├── index.tsx                    # главный компонент
│   │   ├── FileManagerHeader.tsx        # toolbar, search, view toggle
│   │   ├── FileManagerTable.tsx         # list view (существует)
│   │   ├── FileManagerGrid.tsx          # grid view
│   │   ├── BulkActionsBar.tsx           # bulk actions toolbar
│   │   └── UploadModal/
│   │       ├── index.tsx                # modal wrapper
│   │       ├── FileUploadTab.tsx        # file upload
│   │       └── UrlUploadTab.tsx         # URL upload (существует)
│   ├── DocumentDetailsDialog.tsx        # существует
│   ├── CollectionMenu.tsx               # существует
│   └── FileCard.tsx                     # существует
├── hooks/
│   ├── useDocumentPolling.ts            # существует
│   ├── useFileUpload.ts                 # NEW: upload logic
│   ├── useExplorerSearch.ts             # NEW: search logic
│   └── useBulkActions.ts                # NEW: bulk operations
└── lib/
    └── explorer-utils.ts                # helpers
```

---

## Task 1: Создание утилит и типов

**Files:**
- Create: `src/lib/explorer-utils.ts`
- Create: `src/types/explorer.ts`

**Step 1: Создать файл утилит**

```typescript
// src/lib/explorer-utils.ts

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
```

**Step 2: Создать типы для explorer**

```typescript
// src/types/explorer.ts
import { DocumentResponse, CollectionResponse } from 'r2r-js';

export interface FileUploadStatus {
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface SearchResultItem {
  type: 'document' | 'collection' | 'entity' | 'relationship' | 'community';
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  data: any;
}

export interface ExplorerFilters {
  ingestionStatus: string[];
  extractionStatus: string[];
}

export interface SortConfig {
  key: 'name' | 'size' | 'modified';
  direction: 'asc' | 'desc';
}

export interface MetadataField {
  id: string;
  key: string;
  value: string;
  placeholder: string;
  showPresets: boolean;
}

export type ViewMode = 'list' | 'grid';

export type UploadQuality = 'fast' | 'hi-res' | 'custom';

export interface ExplorerContextValue {
  files: DocumentResponse[];
  collections: CollectionResponse[];
  selectedCollectionId: string | null;
  selectedFiles: string[];
  viewMode: ViewMode;
  loading: boolean;
  // Actions
  fetchFiles: () => Promise<void>;
  setSelectedCollectionId: (id: string | null) => void;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
}
```

**Step 3: Запустить проверку типов**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors related to new files

**Step 4: Commit**

```bash
git add src/lib/explorer-utils.ts src/types/explorer.ts
git commit -m "refactor(explorer): add utility functions and types"
```

---

## Task 2: Исправить useDocumentPolling hook

**Files:**
- Modify: `src/hooks/useDocumentPolling.ts`

**Step 1: Добавить реактивный state для isPolling**

```typescript
// src/hooks/useDocumentPolling.ts
import { DocumentResponse } from 'r2r-js';
import { useEffect, useRef, useCallback, useState } from 'react';

import { useUserContext } from '@/context/UserContext';
import logger from '@/lib/logger';
import { IngestionStatus, KGExtractionStatus } from '@/types';

interface UseDocumentPollingOptions {
  interval?: number;
  onlyPending?: boolean;
  onUpdate?: (documents: DocumentResponse[]) => void;
  maxRetries?: number;
}

export function useDocumentPolling(
  documentIds: string[],
  options: UseDocumentPollingOptions = {}
) {
  const {
    interval = 5000,
    onlyPending = true,
    onUpdate,
    maxRetries = 3,
  } = options;

  const { getClient } = useUserContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isFetchingRef = useRef(false);

  // ИСПРАВЛЕНИЕ: Используем state вместо ref для реактивности
  const [isPolling, setIsPolling] = useState(false);

  const needsPolling = useCallback(
    (doc: DocumentResponse): boolean => {
      if (!onlyPending) return true;

      const ingestionPending =
        doc.ingestionStatus !== IngestionStatus.SUCCESS &&
        doc.ingestionStatus !== IngestionStatus.FAILED;

      const extractionPending =
        doc.extractionStatus !== KGExtractionStatus.SUCCESS &&
        doc.extractionStatus !== KGExtractionStatus.FAILED;

      return ingestionPending || extractionPending;
    },
    [onlyPending]
  );

  const fetchDocumentUpdates = useCallback(async () => {
    if (documentIds.length === 0 || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const promises = documentIds.map((id) =>
        client.documents.retrieve({ id }).catch((error) => {
          logger.warn('Failed to fetch document', { documentId: id, error });
          return null;
        })
      );

      const results = await Promise.all(promises);
      const documents = results
        .filter(
          (result): result is { results: DocumentResponse } => result !== null
        )
        .map((result) => result.results);

      retryCountRef.current = 0;

      const pendingDocuments = documents.filter(needsPolling);

      if (onUpdate) {
        onUpdate(documents);
      }

      if (pendingDocuments.length === 0 && onlyPending) {
        logger.info('All documents completed, stopping polling');
        stopPolling();
      }
    } catch (error) {
      logger.error('Error polling document updates', error as Error);
      retryCountRef.current += 1;

      if (retryCountRef.current >= maxRetries) {
        logger.error('Max retries reached, stopping polling');
        stopPolling();
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [documentIds, getClient, needsPolling, onUpdate, onlyPending, maxRetries]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    logger.info('Starting document polling', {
      interval,
      documentCount: documentIds.length,
    });

    setIsPolling(true);  // ИСПРАВЛЕНИЕ: обновляем state
    fetchDocumentUpdates();
    intervalRef.current = setInterval(fetchDocumentUpdates, interval);
  }, [interval, documentIds.length, fetchDocumentUpdates]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);  // ИСПРАВЛЕНИЕ: обновляем state
      logger.info('Stopped document polling');
    }
  }, []);

  const restartPolling = useCallback(() => {
    stopPolling();
    if (documentIds.length > 0) {
      startPolling();
    }
  }, [stopPolling, startPolling, documentIds.length]);

  useEffect(() => {
    if (documentIds.length > 0) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [documentIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling,  // Теперь реактивен!
  };
}
```

**Step 2: Проверить типы**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useDocumentPolling.ts
git commit -m "fix(hooks): make isPolling reactive in useDocumentPolling"
```

---

## Task 3: Создать hook useFileUpload

**Files:**
- Create: `src/hooks/useFileUpload.ts`

**Step 1: Создать hook для логики загрузки файлов**

```typescript
// src/hooks/useFileUpload.ts
import { useState, useCallback, useRef } from 'react';

import { useUserContext } from '@/context/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { FileUploadStatus, UploadQuality, MetadataField } from '@/types/explorer';
import { getFileNameOnly } from '@/lib/explorer-utils';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  file: string;
  success: boolean;
  documentId?: string;
  error?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onSuccess, onError } = options;
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, FileUploadStatus>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadStatus((prev) => {
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadStatus({});
    setProgress(0);
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
  }, []);

  const uploadSingleFile = async (
    file: File,
    baseUrl: string,
    accessToken: string,
    metadata: Record<string, any>,
    collectionIds: string[],
    quality: UploadQuality,
    signal: AbortSignal
  ): Promise<UploadResult> => {
    const fileNameOnly = getFileNameOnly(file.name);
    const fileMetadata = { title: fileNameOnly, ...metadata };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ingestion_mode', quality);
    formData.append('run_with_orchestration', 'true');

    if (Object.keys(fileMetadata).length > 0) {
      formData.append('metadata', JSON.stringify(fileMetadata));
    }

    if (collectionIds.length > 0) {
      formData.append('collection_ids', JSON.stringify(collectionIds));
    }

    try {
      const response = await fetch(`${baseUrl}/v3/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }

        // Handle 409 Conflict - document already exists
        if (response.status === 409) {
          const errorMessage = errorData?.detail || JSON.stringify(errorData);
          const uuidMatch = errorMessage.match(
            /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
          );

          if (uuidMatch) {
            await fetch(`${baseUrl}/v3/documents/${uuidMatch[1]}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            const retryResponse = await fetch(`${baseUrl}/v3/documents`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
              signal,
            });

            if (retryResponse.ok) {
              const result = await retryResponse.json();
              return {
                file: file.name,
                success: true,
                documentId: result?.results?.id || result?.results?.document_id,
              };
            }
          }
          return { file: file.name, success: false, error: `Document already exists` };
        }

        return {
          file: file.name,
          success: false,
          error: `HTTP ${response.status}: ${errorData?.detail || errorText}`,
        };
      }

      const result = await response.json();
      return {
        file: file.name,
        success: true,
        documentId: result?.results?.id || result?.results?.document_id,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { file: file.name, success: false, error: 'Upload cancelled' };
      }
      return { file: file.name, success: false, error: error.message || 'Unknown error' };
    }
  };

  const upload = useCallback(
    async (
      collectionIds: string[],
      quality: UploadQuality,
      metadata: Record<string, any>
    ) => {
      if (files.length === 0 || isUploading) return;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsUploading(true);

      // Initialize status
      const initialStatus: Record<string, FileUploadStatus> = {};
      files.forEach((file) => {
        initialStatus[file.name] = { progress: 0, status: 'pending' };
      });
      setUploadStatus(initialStatus);

      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        let baseUrl = '';
        const pipelineStr = localStorage.getItem('pipeline');
        if (pipelineStr) {
          const pipeline = JSON.parse(pipelineStr);
          baseUrl = pipeline?.deploymentUrl || '';
        }
        if (!baseUrl && window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL) {
          baseUrl = window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;
        }
        baseUrl = baseUrl.trim().replace(/\/$/, '');

        if (!baseUrl) {
          throw new Error('No deployment URL found');
        }

        const CONCURRENCY_LIMIT = 3;
        const results: UploadResult[] = [];
        let completedCount = 0;

        for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
          if (abortController.signal.aborted) break;

          const batch = files.slice(i, i + CONCURRENCY_LIMIT);

          batch.forEach((file) => {
            setUploadStatus((prev) => ({
              ...prev,
              [file.name]: { progress: 30, status: 'uploading' },
            }));
          });

          const batchResults = await Promise.all(
            batch.map(async (file) => {
              if (abortController.signal.aborted) {
                return { file: file.name, success: false, error: 'Cancelled' };
              }

              const result = await uploadSingleFile(
                file,
                baseUrl,
                accessToken,
                metadata,
                collectionIds,
                quality,
                abortController.signal
              );

              setUploadStatus((prev) => ({
                ...prev,
                [file.name]: {
                  progress: result.success ? 100 : 0,
                  status: result.success ? 'success' : 'error',
                  error: result.error,
                },
              }));

              return result;
            })
          );

          results.push(...batchResults);
          completedCount += batch.length;
          setProgress((completedCount / files.length) * 100);
        }

        const successCount = results.filter((r) => r.success).length;
        const errorCount = results.filter((r) => !r.success).length;

        if (successCount > 0) {
          toast({
            title: 'Upload Complete',
            description: `${successCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
          });
          onSuccess?.();
        } else if (errorCount > 0) {
          toast({
            title: 'Upload Failed',
            description: `All ${errorCount} files failed to upload.`,
            variant: 'destructive',
          });
        }

        clearFiles();
      } catch (error: any) {
        toast({
          title: 'Upload Error',
          description: error.message,
          variant: 'destructive',
        });
        onError?.(error);
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [files, isUploading, toast, onSuccess, onError, clearFiles]
  );

  return {
    files,
    uploadStatus,
    isUploading,
    progress,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    cancelUpload,
  };
}
```

**Step 2: Проверить типы**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useFileUpload.ts
git commit -m "feat(hooks): add useFileUpload hook for upload logic"
```

---

## Task 4: Создать hook useBulkActions

**Files:**
- Create: `src/hooks/useBulkActions.ts`

**Step 1: Создать hook для bulk операций**

```typescript
// src/hooks/useBulkActions.ts
import { useState, useCallback } from 'react';
import { DocumentResponse } from 'r2r-js';

import { useUserContext } from '@/context/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus } from '@/types';

interface UseBulkActionsOptions {
  onSuccess?: () => void;
}

export function useBulkActions(
  files: DocumentResponse[],
  selectedIds: string[],
  options: UseBulkActionsOptions = {}
) {
  const { onSuccess } = options;
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const getSelectedFiles = useCallback(() => {
    return files.filter((f) => selectedIds.includes(f.id));
  }, [files, selectedIds]);

  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await client.documents.delete({ id });
          successCount++;
        } catch {
          failCount++;
        }
      }

      toast({
        title: 'Delete Complete',
        description: `${successCount} deleted${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        variant: failCount > 0 ? 'default' : 'success',
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, getClient, toast, onSuccess]);

  const bulkExtract = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      // Filter only successfully ingested documents
      const eligibleIds = selectedIds.filter((id) => {
        const file = files.find((f) => f.id === id);
        return file && file.ingestionStatus === IngestionStatus.SUCCESS;
      });

      if (eligibleIds.length === 0) {
        toast({
          title: 'No Eligible Documents',
          description: 'Only successfully ingested documents can be extracted.',
          variant: 'destructive',
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const id of eligibleIds) {
        try {
          await client.documents.extract({ id });
          successCount++;
          await new Promise((r) => setTimeout(r, 300)); // Rate limiting
        } catch {
          failCount++;
        }
      }

      toast({
        title: 'Extraction Started',
        description: `${successCount} queued${failCount > 0 ? `, ${failCount} failed` : ''}.`,
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Extraction Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, files, getClient, toast, onSuccess]);

  const bulkMove = useCallback(
    async (targetCollectionId: string, sourceCollectionId?: string | null) => {
      if (selectedIds.length === 0) return;
      setIsProcessing(true);

      try {
        const client = await getClient();
        if (!client) throw new Error('Failed to get client');

        // Add to target collection
        await Promise.all(
          selectedIds.map((id) =>
            client.collections.addDocument({
              id: targetCollectionId,
              documentId: id,
            })
          )
        );

        // Remove from source if specified
        if (sourceCollectionId) {
          await Promise.all(
            selectedIds.map((id) =>
              client.collections.removeDocument({
                id: sourceCollectionId,
                documentId: id,
              })
            )
          );
        }

        toast({
          title: 'Move Complete',
          description: `${selectedIds.length} document(s) moved.`,
        });

        onSuccess?.();
      } catch (error: any) {
        toast({
          title: 'Move Failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, getClient, toast, onSuccess]
  );

  const bulkCopy = useCallback(
    async (targetCollectionId: string) => {
      if (selectedIds.length === 0) return;
      setIsProcessing(true);

      try {
        const client = await getClient();
        if (!client) throw new Error('Failed to get client');

        await Promise.all(
          selectedIds.map((id) =>
            client.collections.addDocument({
              id: targetCollectionId,
              documentId: id,
            })
          )
        );

        toast({
          title: 'Copy Complete',
          description: `${selectedIds.length} document(s) copied.`,
        });

        onSuccess?.();
      } catch (error: any) {
        toast({
          title: 'Copy Failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, getClient, toast, onSuccess]
  );

  const bulkDownload = useCallback(async () => {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get client');

      for (const file of selectedFiles) {
        try {
          const response = await client.documents.download({ id: file.id });
          const blob = new Blob([response as any]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.title || file.id;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Failed to download ${file.title}:`, error);
        }
      }

      toast({
        title: 'Download Complete',
        description: `${selectedFiles.length} file(s) downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [getSelectedFiles, getClient, toast]);

  return {
    isProcessing,
    bulkDelete,
    bulkExtract,
    bulkMove,
    bulkCopy,
    bulkDownload,
    getSelectedFiles,
  };
}
```

**Step 2: Проверить типы**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useBulkActions.ts
git commit -m "feat(hooks): add useBulkActions hook for bulk operations"
```

---

## Task 5: Создать ExplorerSidebar компонент

**Files:**
- Create: `src/components/explorer/ExplorerSidebar.tsx`

**Step 1: Извлечь AppSidebar в отдельный файл**

```typescript
// src/components/explorer/ExplorerSidebar.tsx
'use client';

import { ChevronRight, File, FileText, Folder } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React, { useEffect, useState } from 'react';

import { CollectionMenu } from '@/components/explorer/CollectionMenu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useUserContext } from '@/context/UserContext';

interface ExplorerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedCollectionId: string | null;
  onCollectionSelect: (collectionId: string | null) => void;
}

export function ExplorerSidebar({
  selectedCollectionId,
  onCollectionSelect,
  ...props
}: ExplorerSidebarProps) {
  const { getClient, authState } = useUserContext();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);

  const fetchCollections = async () => {
    try {
      const client = await getClient();
      if (!client) return;

      const response = await client.collections.list({
        limit: 100,
        offset: 0,
      });
      setCollections(response?.results || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  useEffect(() => {
    if (!authState.isAuthenticated) return;
    fetchCollections();
  }, [authState.isAuthenticated, getClient]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="!pt-1">
        <div className="px-6 py-2">
          <h2 className="text-lg font-semibold mb-2">Collections</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="!pt-1">
        <SidebarGroup className="!pt-1 !pb-0.5">
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedCollectionId === null}
                  onClick={() => onCollectionSelect(null)}
                  title="All Documents"
                >
                  <FileText />
                  All Documents
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {collections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Collections ({collections.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collections.map((collection) => (
                  <SidebarMenuItem key={collection.id} className="group relative">
                    <SidebarMenuButton
                      isActive={selectedCollectionId === collection.id}
                      onClick={() => onCollectionSelect(collection.id)}
                      title={collection.name || collection.id}
                    >
                      <Folder />
                      <span className="truncate">
                        {collection.name || collection.id}
                      </span>
                    </SidebarMenuButton>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <CollectionMenu
                        collection={collection}
                        onCollectionUpdate={fetchCollections}
                      />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
```

**Step 2: Проверить импорты**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/explorer/ExplorerSidebar.tsx
git commit -m "feat(explorer): extract ExplorerSidebar component"
```

---

## Task 6: Создать BulkActionsBar компонент

**Files:**
- Create: `src/components/explorer/BulkActionsBar.tsx`

**Step 1: Создать компонент bulk actions toolbar**

```typescript
// src/components/explorer/BulkActionsBar.tsx
'use client';

import {
  ArrowRightToLine,
  Copy,
  Download,
  FolderPlus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export type BulkAction =
  | 'download'
  | 'extract'
  | 'copy'
  | 'move'
  | 'createCollection'
  | 'delete';

interface BulkActionsBarProps {
  selectedCount: number;
  onDeselect: () => void;
  onAction: (action: BulkAction) => void;
  isProcessing?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onDeselect,
  onAction,
  isProcessing = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-background p-2 flex items-center justify-between border-b">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselect}
          disabled={isProcessing}
        >
          <X className="h-4 w-4 mr-2" />
          Deselect
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('download')}
          disabled={isProcessing}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('extract')}
          disabled={isProcessing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Extract
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('copy')}
          disabled={isProcessing}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('move')}
          disabled={isProcessing}
        >
          <ArrowRightToLine className="h-4 w-4 mr-2" />
          Move
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('createCollection')}
          disabled={isProcessing}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onAction('delete')}
          disabled={isProcessing}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Проверить типы**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/explorer/BulkActionsBar.tsx
git commit -m "feat(explorer): add BulkActionsBar component"
```

---

## Task 7: Создать FileManagerHeader компонент

**Files:**
- Create: `src/components/explorer/FileManagerHeader.tsx`

**Step 1: Создать header с поиском и view toggle**

```typescript
// src/components/explorer/FileManagerHeader.tsx
'use client';

import {
  Filter,
  Grid,
  List,
  Loader2,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
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
```

**Step 2: Проверить типы**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/explorer/FileManagerHeader.tsx
git commit -m "feat(explorer): add FileManagerHeader component"
```

---

## Task 8: Удалить неиспользуемые импорты из explorer.tsx

**Files:**
- Modify: `src/pages/explorer.tsx`

**Step 1: Запустить ESLint с автофиксом**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm lint`
Expected: Auto-fix removes unused imports

**Step 2: Проверить результат**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/explorer.tsx
git commit -m "refactor(explorer): remove unused imports"
```

---

## Task 9: Интегрировать новые компоненты в explorer.tsx

**Files:**
- Modify: `src/pages/explorer.tsx`

**Step 1: Заменить inline компоненты на импортированные**

Заменить использование:
1. `AppSidebar` → `ExplorerSidebar`
2. Inline bulk actions → `BulkActionsBar`
3. Inline header → `FileManagerHeader`
4. Inline hooks → `useBulkActions`, `useFileUpload`

**Step 2: Обновить импорты в начале файла**

```typescript
// Добавить новые импорты
import { ExplorerSidebar } from '@/components/explorer/ExplorerSidebar';
import { BulkActionsBar, BulkAction } from '@/components/explorer/BulkActionsBar';
import { FileManagerHeader } from '@/components/explorer/FileManagerHeader';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ViewMode, ExplorerFilters, SortConfig } from '@/types/explorer';
import { formatFileSize, formatDate } from '@/lib/explorer-utils';
```

**Step 3: Проверить типы и lint**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm lint && pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/explorer.tsx
git commit -m "refactor(explorer): integrate extracted components and hooks"
```

---

## Task 10: Финальная проверка и тестирование

**Step 1: Запустить все проверки**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm lint && pnpm tsc --noEmit && pnpm build`
Expected: All pass

**Step 2: Запустить dev server и проверить функциональность**

Run: `cd /Users/laptop/mcp/R2R-Application && pnpm dev`

Checklist:
- [ ] Страница `/explorer` загружается
- [ ] Sidebar отображает коллекции
- [ ] Документы загружаются и отображаются
- [ ] Поиск работает
- [ ] View toggle (list/grid) работает
- [ ] Bulk actions работают (select, delete, extract)
- [ ] Upload модал открывается
- [ ] Polling индикатор отображается

**Step 3: Финальный commit**

```bash
git add .
git commit -m "refactor(explorer): complete modular refactoring

- Extract ExplorerSidebar component
- Extract BulkActionsBar component
- Extract FileManagerHeader component
- Add useFileUpload hook
- Add useBulkActions hook
- Add explorer-utils and types
- Fix isPolling reactivity in useDocumentPolling
- Remove unused imports"
```

---

## Summary

| До | После |
|-----|-------|
| `explorer.tsx`: 4079 строк | `explorer.tsx`: ~1500 строк |
| Монолитный компонент | 5 модульных компонентов |
| Inline логика | 4 переиспользуемых hooks |
| 10 unused imports | 0 unused imports |
| `isPolling` не реактивен | `isPolling` реактивен |

### Новые файлы
```text
src/
├── lib/explorer-utils.ts              # 60 строк
├── types/explorer.ts                  # 50 строк
├── hooks/
│   ├── useFileUpload.ts              # 200 строк
│   └── useBulkActions.ts             # 180 строк
├── components/explorer/
│   ├── ExplorerSidebar.tsx           # 100 строк
│   ├── BulkActionsBar.tsx            # 90 строк
│   └── FileManagerHeader.tsx         # 130 строк
```
