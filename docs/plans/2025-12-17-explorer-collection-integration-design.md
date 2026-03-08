# Дизайн интеграции Explorer и Collection Detail

**Дата:** 2025-12-17
**Статус:** Design Approved
**Автор:** Claude Sonnet 4.5

## Цель

Объединить страницы Explorer и Collection Detail в единый интерфейс с табами. Пользователь получит доступ ко всем функциям (документы, entities, knowledge graph) из одного места с sidebar навигацией.

## Текущее состояние

### Explorer страница (`/explorer`)

- Sidebar с коллекциями
- FileManager для работы с документами
- Upload, bulk actions, filters
- Современный UI с shadcn/ui компонентами

### Collection Detail страница (`/collections/[id]`)

- Старый Layout (Header + Footer)
- 7 табов: Documents, Users, Entities, Relationships, Communities, Knowledge Graph, Explore
- Таблицы для каждого типа данных
- Batch loading с постепенной подгрузкой

## Архитектура решения

### Компонентная иерархия

```text
ExplorerPage (src/pages/explorer.tsx)
├── Navbar
└── SidebarProvider
    ├── ExplorerSidebar
    └── SidebarInset
        └── CollectionTabs (новый)
            ├── TabsList
            └── TabsContent
                ├── Documents → FileManager
                ├── Users → UsersTab
                ├── Entities → EntitiesTab
                ├── Relationships → RelationshipsTab
                ├── Communities → CommunitiesTab
                ├── Knowledge Graph → KnowledgeGraphTab
                └── Explore → ExploreTab
```

### Управление состоянием

**ExplorerPage** отвечает за:
- `selectedCollectionId` (по умолчанию "default")
- `collections` (список всех коллекций)
- Синхронизацию с URL query parameters

**CollectionTabs** отвечает за:
- `activeTab` (текущий активный таб)
- `dataCache` (кэш загруженных данных для каждого таба)
- Lazy loading данных при первом открытии таба

### Стратегия загрузки данных

#### Documents таб
- FileManager загружает данные через существующую логику
- Никаких изменений

#### Users, Entities, Relationships, Communities табы
- Batch fetching паттерн из Collection Detail
- Первый batch (100 записей) загружается при открытии таба
- Остальные batches загружаются в фоне
- Данные кэшируются в state

#### Knowledge Graph табы
- Используют entities и relationships из кэша
- Загружаются при первом открытии таба

## Новые компоненты

### 1. CollectionTabs

**Путь:** `src/components/explorer/CollectionTabs.tsx`

**Ответственность:**
- Управление табами
- Lazy loading данных
- Кэширование загруженных данных
- Передача selectedCollectionId дочерним компонентам

**Props:**
```typescript
interface CollectionTabsProps {
  selectedCollectionId: string | null;
  collections: CollectionResponse[];
  onCollectionChange: () => void;
  onCollectionSelect: (collectionId: string | null) => void;
}
```

### 2. Tab компоненты

**Директория:** `src/components/explorer/tabs/`

Создаются 6 новых компонентов-оберток:
- `UsersTab.tsx` - обертка над Table компонентом для users
- `EntitiesTab.tsx` - обертка над Table для entities
- `RelationshipsTab.tsx` - обертка над Table для relationships
- `CommunitiesTab.tsx` - обертка над Table для communities
- `KnowledgeGraphTab.tsx` - обертка над KnowledgeGraphD3
- `ExploreTab.tsx` - обертка над KnowledgeGraph

**Каждый компонент:**
- Принимает data, loading, error через props
- Использует существующий Table или Graph компонент
- Не содержит логику загрузки (управляется родителем)

### 3. useBatchFetch hook

**Путь:** `src/hooks/useBatchFetch.ts`

**Назначение:** Переиспользуемая логика batch loading

**Интерфейс:**
```typescript
function useBatchFetch<T>({
  fetchFn: (offset: number, limit: number) => Promise<{ results: T[], totalEntries: number }>,
  collectionId: string,
  enabled: boolean,
  pageSize?: number
}): {
  data: T[];
  totalEntries: number;
  loading: boolean;
  error: Error | null;
}
```

## UI изменения

### Расположение табов

Табы размещаются внутри SidebarInset, над FileManager:

```text
┌─────────────────────────────────────┐
│ [Documents][Users][Entities]...     │ ← TabsList
├─────────────────────────────────────┤
│                                     │
│  Tab Content Area                   │
│  (FileManager или Table)            │
│                                     │
└─────────────────────────────────────┘
```

### FileManagerHeader изменения

Добавляется кнопка "Manage Collection":
- Показывается только когда выбрана коллекция (не для "All docs")
- Располагается рядом с кнопкой Upload
- Открывает существующий CollectionDialog

### Breadcrumbs

Остается без изменений:
- "All docs" для режима всех документов
- "All docs / Collection Name" для выбранной коллекции

## Роутинг

### Новая структура URL

```text
/explorer                              → default collection, documents tab
/explorer?collection=abc123            → конкретная коллекция, documents tab
/explorer?collection=abc123&tab=entities → конкретная коллекция, entities tab
```

### Query parameters

- `collection` - ID коллекции (опционально, default = "default")
- `tab` - активный таб (опционально, default = "documents")

### Обратная совместимость

Старые URL автоматически редиректятся:

```typescript
// src/pages/collections/[id].tsx
export default function CollectionRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.query.id) {
      router.replace(`/explorer?collection=${router.query.id}&tab=documents`);
    }
  }, [router.query.id]);

  return <div>Redirecting...</div>;
}
```

**Примеры:**
- `/collections/abc123` → `/explorer?collection=abc123&tab=documents`
- Старые ссылки продолжают работать

## Переиспользуемые компоненты

### Из Collection Detail

- `src/components/ChatDemo/Table.tsx` - универсальная таблица
- `src/components/knowledgeGraph.tsx` - Explore визуализация
- `src/components/knowledgeGraphD3.tsx` - Knowledge Graph визуализация
- `src/components/ChatDemo/utils/collectionDialog.tsx` - модалка настроек
- `src/components/ChatDemo/remove.tsx` - RemoveButton для действий

**Никаких изменений не требуется** - компоненты используются as-is.

### Из Explorer

- Весь FileManager с его экосистемой
- ExplorerSidebar
- Все explorer UI компоненты

## План реализации

### Фаза 1: Подготовка (1-2 часа)

1. Создать `useBatchFetch` hook
2. Создать директорию `src/components/explorer/tabs/`
3. Настроить роутинг в ExplorerPage для query parameters

### Фаза 2: CollectionTabs (2-3 часа)

1. Создать `CollectionTabs.tsx` с базовой структурой
2. Добавить TabsList с 7 табами
3. Реализовать управление состоянием (activeTab, dataCache)
4. Интегрировать в ExplorerPage

### Фаза 3: Tab компоненты (3-4 часа)

1. Создать UsersTab
2. Создать EntitiesTab
3. Создать RelationshipsTab
4. Создать CommunitiesTab
5. Создать KnowledgeGraphTab
6. Создать ExploreTab

### Фаза 4: Интеграция (1-2 часа)

1. Добавить кнопку "Manage" в FileManagerHeader
2. Подключить CollectionDialog
3. Синхронизировать URL state с компонентами

### Фаза 5: Редирект и cleanup (1 час)

1. Модифицировать `/collections/[id]` для редиректа
2. Обновить все внутренние ссылки на новый формат
3. Тестирование обратной совместимости

### Фаза 6: Тестирование (2-3 часа)

1. Проверить lazy loading всех табов
2. Проверить кэширование данных
3. Проверить редиректы
4. Проверить query parameters sync
5. Проверить все bulk actions и модалки

## Риски и митигация

### Риск: Performance при загрузке всех entities/relationships

**Митигация:**
- Lazy loading - данные загружаются только при открытии таба
- Кэширование - данные не перезагружаются при переключении табов
- Batch loading - постепенная подгрузка в фоне

### Риск: Конфликт состояния между FileManager и CollectionTabs

**Митигация:**
- ExplorerPage владеет selectedCollectionId
- Передается вниз через props (single source of truth)
- Синхронизация через URL query parameters

### Риск: Поломка старых ссылок

**Митигация:**
- Редирект из `/collections/[id]` на новый URL
- Обратная совместимость через query parameters
- Постепенная миграция - старая страница не удаляется сразу

## Альтернативные решения (отклонены)

### Вариант: Держать две отдельные страницы

**Почему отклонен:** Дублирование UI, разделение функционала, плохой UX

### Вариант: Использовать App Router вместо Pages Router

**Почему отклонен:** Проект на Pages Router, миграция слишком рискованна

### Вариант: Контекстные табы (показывать только при выборе коллекции)

**Почему отклонен:** Требование показывать Default коллекцию по умолчанию

## Критерии успеха

- ✅ Все функции Collection Detail доступны в Explorer
- ✅ Sidebar навигация работает для всех табов
- ✅ Старые ссылки `/collections/[id]` редиректятся корректно
- ✅ Lazy loading уменьшает начальное время загрузки
- ✅ FileManager сохраняет весь функционал (upload, bulk actions)
- ✅ Knowledge Graph визуализации работают без регрессий
- ✅ Query parameters синхронизируются с UI состоянием

## Зависимости

- Существующие компоненты: Table, KnowledgeGraph, KnowledgeGraphD3
- R2R API endpoints: collections.*, graphs.*
- shadcn/ui Tabs компонент
- Next.js router для query parameters
