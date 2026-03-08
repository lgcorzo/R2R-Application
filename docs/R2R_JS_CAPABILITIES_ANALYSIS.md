# Анализ возможностей r2r-js для страницы Explorer

## Реализованные возможности

### ✅ Базовые функции

- Список документов (`client.documents.list()`)
- Список коллекций (`client.collections.list()`)
- Поиск по названию/ID
- Выбор файлов (checkbox)
- Модальные окна (Upload, New Folder, Rename, Delete, Move, Preview)
- Bulk actions toolbar
- List/Grid view

## Возможности r2r-js для реализации

### 1. Фильтрация и сортировка

#### 1.1 Фильтры по статусам (как в `documents.tsx`)

```typescript
// Фильтрация по ingestionStatus
const DEFAULT_INGESTION_STATUSES = [
  'pending',
  'parsing',
  'extracting',
  'chunking',
  'embedding',
  'augmenting',
  'storing',
  'enriching',
  'failed',
  'success',
];

// Фильтрация по extractionStatus
const DEFAULT_EXTRACTION_STATUSES = [
  'success',
  'failed',
  'pending',
  'processing',
];
```

**Реализация:**

- Добавить фильтры в header (как в v0-file-manager-list)
- Multi-select dropdown для статусов
- Badge для визуального отображения статусов

#### 1.2 Фильтрация по коллекциям

```typescript
// Фильтрация по collectionIds
client.documents.list({
  collectionIds: [collectionId1, collectionId2],
});
```

**Реализация:**

- Dropdown с коллекциями в sidebar
- Фильтрация при выборе коллекции
- Отображение коллекций в breadcrumb

#### 1.3 Продвинутые фильтры (из v0-dynamic-table)

```typescript
interface FilterRule {
  field: string;
  operator:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'contains'
    | 'startsWith'
    | 'endsWith';
  value: string;
}

interface FilterState {
  logicOperator: 'AND' | 'OR';
  rules: FilterRule[];
}
```

**Реализация:**

- Dialog с фильтрами (как в v0-dynamic-table)
- Поддержка AND/OR операторов
- Множественные правила фильтрации
- Автоматическое определение типов данных

### 2. Группировка и сортировка

#### 2.1 Группировка документов

```typescript
// Группировка по:
- ingestionStatus
- extractionStatus
- collectionIds
- documentType
- createdAt (по дате)
```

**Реализация:**

- Popover для выбора группировки (как в v0-dynamic-table)
- Collapsible группы
- Счетчик элементов в группе

#### 2.2 Сортировка по колонкам

```typescript
// Сортировка по:
-title(Name) -
  size(size_in_bytes) -
  updatedAt(Modified) -
  ingestionStatus -
  extractionStatus;
```

**Реализация:**

- Клик по заголовку колонки для сортировки
- Индикатор направления сортировки (↑/↓)
- Сохранение состояния сортировки

### 3. Детальный просмотр документа

#### 3.1 Chunks (фрагменты документа)

```typescript
client.documents.listChunks({
  id: documentId,
  offset: 0,
  limit: 10,
});
```

**Реализация:**

- Таблица chunks в Preview Modal
- Пагинация chunks
- Поиск по тексту chunks

#### 3.2 Entities (сущности)

```typescript
client.documents.listEntities({
  id: documentId,
  offset: 0,
  limit: 10,
});
```

**Реализация:**

- Таблица entities в Preview Modal
- Отображение категорий entities
- Связи между entities

#### 3.3 Relationships (связи)

```typescript
client.documents.listRelationships({
  id: documentId,
  offset: 0,
  limit: 10,
});
```

**Реализация:**

- Граф связей в Preview Modal
- Визуализация relationships
- Фильтрация по типам связей

### 4. Реальные операции с документами

#### 4.1 Скачивание файлов

```typescript
const blob = await client.documents.download({ id: documentId });
// Создать download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = document.title || document.id;
a.click();
```

**Реализация:**

- Реальное скачивание вместо заглушки
- Progress indicator для больших файлов
- Bulk download для выбранных файлов

#### 4.2 Удаление документов

```typescript
await client.documents.delete({ id: documentId });
```

**Реализация:**

- Реальное удаление через API
- Bulk delete для выбранных файлов
- Обновление списка после удаления

#### 4.3 Перемещение в коллекции

```typescript
// Добавить документ в коллекцию
await client.collections.addDocument({
  id: collectionId,
  documentId: documentId,
});

// Удалить документ из коллекции
await client.collections.removeDocument({
  id: collectionId,
  documentId: documentId,
});
```

**Реализация:**

- Реальное перемещение через API
- Список коллекций в Move Modal
- Bulk move для выбранных файлов

#### 4.4 Извлечение данных

```typescript
await client.documents.extract({ id: documentId });
```

**Реализация:**

- Кнопка "Extract" в actions dropdown
- Progress indicator для извлечения
- Обновление статуса после извлечения

### 5. Визуальные улучшения

#### 5.1 Badge для статусов

```typescript
<Badge
  variant={
    doc.ingestionStatus === 'success' ? 'success' :
    doc.ingestionStatus === 'failed' ? 'destructive' : 'pending'
  }
>
  {doc.ingestionStatus}
</Badge>
```

**Реализация:**

- Badge в колонке Status (если добавить)
- Цветовая индикация статусов
- Tooltip с описанием статуса

#### 5.2 Колонка Status

- Добавить колонку Status с Badge
- Отображение ingestionStatus и extractionStatus
- Фильтрация по статусам

### 6. Пагинация и производительность

#### 6.1 Выбор размера страницы

```typescript
const pageSizeOptions = [10, 25, 50, 100];
```

**Реализация:**

- Select для выбора pageSize
- Сохранение выбора в localStorage
- Адаптивная пагинация

#### 6.2 Виртуализация списка

- Использовать react-window для больших списков
- Lazy loading для grid view
- Оптимизация рендеринга

## Приоритеты реализации

### Высокий приоритет

1. ✅ Реальное скачивание файлов (`client.documents.download()`)
2. ✅ Реальное удаление (`client.documents.delete()`)
3. ✅ Реальное перемещение в коллекции (`client.collections.addDocument()`)
4. ✅ Фильтры по статусам (ingestionStatus, extractionStatus)
5. ✅ Badge для отображения статусов
6. ✅ Сортировка по колонкам

### Средний приоритет

7. ✅ Детальный просмотр (chunks, entities, relationships)
8. ✅ Фильтрация по коллекциям
9. ✅ Группировка документов
10. ✅ Выбор размера страницы

### Низкий приоритет

11. ✅ Продвинутые фильтры (AND/OR операторы)
12. ✅ Извлечение данных (`client.documents.extract()`)
13. ✅ Виртуализация списка

## Примеры использования из кодовой базы

### Фильтрация по статусам (documents.tsx)

```typescript
const filtered = documents.filter((doc) =>
  filters.ingestionStatus.includes(doc.ingestionStatus)
);
```

### Детальный просмотр (documentDialogInfo.tsx)

```typescript
const chunks = await client.documents.listChunks({ id, offset: 0, limit: 10 });
const entities = await client.documents.listEntities({
  id,
  offset: 0,
  limit: 10,
});
const relationships = await client.documents.listRelationships({
  id,
  offset: 0,
  limit: 10,
});
```

### Скачивание файла (DownloadFileContainer.tsx)

```typescript
const blob = await client.documents.download({ id });
const url = URL.createObjectURL(blob);
// Создать download link
```

### Перемещение в коллекцию (AssignDocumentToCollectionDialog.tsx)

```typescript
await client.collections.addDocument({
  id: collectionId,
  documentId: documentId,
});
```

## Дизайн из v0.dev примеров

### v0-dynamic-table

- Продвинутые фильтры с AND/OR
- Группировка данных
- Автоматическое определение типов
- Сортировка по колонкам

### v0-file-manager-list

- Фильтры в header
- Badge для статусов
- Детальный просмотр
- Bulk actions

### v0-file-manager

- Grid/List view
- Поиск
- Фильтрация
- Сортировка
