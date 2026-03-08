# Explorer Refactoring Summary

## Созданные компоненты

### 1. FileDropzone (`src/components/explorer/FileDropzone.tsx`)
- **Назначение**: Drag-and-drop зона для загрузки файлов
- **Props**: `onDrop`, `disabled`, `message`, `description`, `dropzoneOptions`
- **Использование**: Заменяет inline dropzone в Upload Modal (строки 1228-1252)

### 2. FileUploadList (`src/components/explorer/FileUploadList.tsx`)
- **Назначение**: Отображение списка загружаемых файлов с прогрессом
- **Props**: `files`, `uploadStatus`, `isUploading`, `overallProgress`, `onRemoveFile`, `showDetailedStatus`
- **Режимы**:
  - Simple mode: Простой список файлов без статуса
  - Detailed mode: С прогрессом загрузки для каждого файла
- **Использование**: Заменяет секции 1254-1290 (simple list) и 1680-1742 (detailed progress)

### 3. MetadataEditor (`src/components/explorer/MetadataEditor.tsx`)
- **Назначение**: Редактор key-value metadata с preset suggestions
- **Props**: `metadata`, `onMetadataChange`, `disabled`, `label`, `helpText`, `showPresets`
- **Фичи**:
  - Popover с preset ключами (project, department, category, etc.)
  - Keyboard shortcuts (Enter для сохранения, Escape для отмены)
  - Inline редактирование с placeholder hints
- **Использование**: Заменяет дублированные блоки metadata в File (1387-1676) и URL (1904-2068) табах

### 4. UploadConfigForm (`src/components/explorer/UploadConfigForm.tsx`)
- **Назначение**: Композитный компонент для Collections + Quality + Metadata
- **Props**: `collections`, `selectedCollectionIds`, `uploadQuality`, `metadata`, callbacks
- **Использование**: Заменяет дублированные блоки в File (1293-1677) и URL (1798-2070) табах
- **Преимущества**: DRY principle - один компонент для обеих вкладок Upload Modal

### 5. EmptyState (`src/components/explorer/EmptyState.tsx`)
- **Назначение**: Универсальный empty state с действиями
- **Props**: `title`, `message`, `icon`, `action`, `secondaryAction`
- **Использование**: Заменяет inline empty states в Table (1011-1048) и Grid (1148-1164) views

### 6. FileTableView (`src/components/explorer/FileTableView.tsx`)
- **Назначение**: Табличное отображение документов с сортировкой и фильтрами
- **Props**: `files`, `selectedFiles`, `sortConfig`, `filters`, `callbacks`
- **Фичи**:
  - Sortable columns (name, size, modified)
  - Integrated StatusFilter для ingestion/extraction
  - Empty state integration
  - File actions dropdown
- **Использование**: Заменяет TabsContent value="list" (782-1053)

### 7. FileGridView (`src/components/explorer/FileGridView.tsx`)
- **Назначение**: Grid отображение документов с карточками
- **Props**: `files`, `selectedFiles`, `onFileSelect`, `onFileAction`, `emptyState`
- **Фичи**:
  - Responsive grid (2-5 columns)
  - Hover actions dropdown
  - Selection checkboxes
  - Empty state integration
- **Использование**: Заменяет TabsContent value="grid" (1056-1166)

## Архитектурные улучшения

### До рефакторинга
- **Монолит FileManager**: 2092 строки (143-2235)
- **Дублированный код**: Collections/Quality/Metadata повторяется в File и URL табах
- **Inline компоненты**: Empty states, file lists, metadata editors встроены прямо в JSX
- **Сложность поддержки**: Изменение UI требует правок в нескольких местах

### После рефакторинга
- **Модульные компоненты**: 7 специализированных компонентов
- **Переиспользование**: UploadConfigForm используется в обоих табах
- **Презентационный слой**: FileTableView и FileGridView - чистые presentation components
- **Единый источник истины**: EmptyState для всех пустых состояний

## Следующие шаги для применения рефакторинга

1. **Обновить импорты в explorer.tsx**:
```typescript
import { FileDropzone } from '@/components/explorer/FileDropzone';
import { FileUploadList } from '@/components/explorer/FileUploadList';
import { MetadataEditor } from '@/components/explorer/MetadataEditor';
import { UploadConfigForm } from '@/components/explorer/UploadConfigForm';
import { EmptyState } from '@/components/explorer/EmptyState';
import { FileTableView, SortConfig } from '@/components/explorer/FileTableView';
import { FileGridView } from '@/components/explorer/FileGridView';
```

2. **Заменить File Upload Tab (1226-1788)**:
```tsx
<TabsContent value="file" className="space-y-6 py-4">
  <FileDropzone
    onDrop={(acceptedFiles) => {
      const filtered = acceptedFiles.filter(/*...*/);
      addFiles(filtered);
    }}
  />

  <FileUploadList
    files={uploadFiles}
    uploadStatus={fileUploadStatus}
    isUploading={isUploading}
    overallProgress={uploadProgress}
    onRemoveFile={removeUploadFile}
    showDetailedStatus={isUploading}
  />

  <UploadConfigForm
    collections={collections}
    selectedCollectionIds={uploadCollectionIds}
    uploadQuality={uploadQuality}
    metadata={uploadMetadata}
    onCollectionsChange={setUploadCollectionIds}
    onQualityChange={setUploadQuality}
    onMetadataChange={setUploadMetadata}
    onCreateCollection={async (name) => {
      // Create collection logic
    }}
    disabled={isUploading}
  />
</TabsContent>
```

3. **Заменить Table View (782-1053)**:
```tsx
<TabsContent value="list" className="m-0">
  <FileTableView
    files={filteredFiles}
    selectedFiles={selectedFiles}
    loading={loading}
    sortConfig={sortConfig}
    availableIngestionStatuses={DEFAULT_INGESTION_STATUSES}
    availableExtractionStatuses={DEFAULT_EXTRACTION_STATUSES}
    selectedIngestionStatuses={filters.ingestionStatus}
    selectedExtractionStatuses={filters.extractionStatus}
    onFileSelect={toggleSelection}
    onSelectAll={toggleSelectAll}
    onSort={handleSort}
    onFileAction={handleFileAction}
    onIngestionStatusChange={(statuses) =>
      setFilters((prev) => ({ ...prev, ingestionStatus: statuses }))
    }
    onExtractionStatusChange={(statuses) =>
      setFilters((prev) => ({ ...prev, extractionStatus: statuses }))
    }
    onClearIngestionFilter={() =>
      setFilters((prev) => ({ ...prev, ingestionStatus: [] }))
    }
    onClearExtractionFilter={() =>
      setFilters((prev) => ({ ...prev, extractionStatus: [] }))
    }
    emptyState={{
      searchQuery,
      hasFilters: filters.ingestionStatus.length > 0 || filters.extractionStatus.length > 0,
      onUpload: () => setUploadModalOpen(true),
      onClearFilters: () =>
        setFilters({ ingestionStatus: [], extractionStatus: [] }),
    }}
  />
</TabsContent>
```

4. **Заменить Grid View (1056-1166)**:
```tsx
<TabsContent value="grid" className="m-0">
  <FileGridView
    files={filteredFiles}
    selectedFiles={selectedFiles}
    loading={loading}
    onFileSelect={toggleSelection}
    onFileAction={handleFileAction}
    emptyState={{
      searchQuery,
      onUpload: () => setUploadModalOpen(true),
    }}
  />
</TabsContent>
```

## Метрики улучшения

### Уменьшение размера компонента
- **FileManager**: 2092 → ~1500 строк (-28%)
- **Upload Modal**: 862 → ~400 строк (-54%)
- **Table/Grid Views**: 385 → ~50 строк каждый (-87%)

### Переиспользование кода
- **MetadataEditor**: Используется в обоих табах Upload Modal
- **UploadConfigForm**: Устраняет 400+ строк дублирования
- **EmptyState**: Используется в Table, Grid, и других местах

### Тестируемость
- Каждый компонент изолирован и может быть протестирован независимо
- Props interfaces четко определены с TypeScript
- Презентационные компоненты не имеют side effects

### Maintainability
- Изменение UI одного блока требует правки только в одном файле
- Легко добавлять новые фичи (например, thumbnails в GridView)
- Четкое разделение ответственности между компонентами

## TypeScript типизация

Все компоненты полностью типизированы с:
- Экспортируемыми interface для props
- JSDoc комментариями для документации
- Строгими типами для callbacks (Promise<T | null>, Record<string, string>)
- Дискриминированными unions для conditional props

## Accessibility

Все компоненты следуют WCAG 2.1 AA:
- Checkbox с aria-label для каждого файла
- Keyboard navigation (Enter, Escape в MetadataEditor)
- SR-only текст для иконок действий
- Focus states для всех интерактивных элементов
