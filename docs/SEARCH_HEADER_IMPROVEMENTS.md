# Search Header Improvements - Explorer Tabs

## Обзор изменений

Проведён масштабный рефакторинг search/filter интерфейсов во всех Explorer табах для унификации дизайна, улучшения UX и устранения проблем с отступами.

## Проблемы, которые были решены

### 1. Асимметричные отступы и неравномерное выравнивание
**Проблема:** В разных табах использовались разные подходы к layout search bar:
- CommunitiesTab: `max-w-sm` на Input создавал асимметрию
- EntitiesTab: уже имел иконки, но разрозненный layout
- RelationshipsTab/UsersTab: отсутствовали иконки Search

**Решение:** Создан единый компонент `TabSearchHeader` с консистентным layout.

### 2. Отсутствие единообразия между табами
**Проблема:** Каждый таб реализовывал поиск по-своему:
- Разные placeholder тексты
- Разные стили счётчиков
- Разное позиционирование элементов

**Решение:** Унифицированный API через `TabSearchHeader`.

### 3. Сложная поддержка category filters
**Проблема:** EntitiesTab имел category filter с Badge'ами в Select, но это не было переиспользуемо.

**Решение:** `TabSearchHeader` поддерживает опциональный `categoryFilter` prop с Badge поддержкой.

## Архитектурные решения

### Новый компонент: `TabSearchHeader`

**Расположение:** `src/components/explorer/TabSearchHeader.tsx`

**Props API:**
```typescript
interface TabSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  totalCount: number;
  filteredCount?: number;
  itemName: string;
  categoryFilter?: {
    value: string;
    onChange: (value: string) => void;
    categories: Array<{
      value: string;
      label: string;
      color?: string;
      badgeVariant?: 'default' | 'secondary' | 'outline';
      badgeClassName?: string;
    }>;
  };
  infoBadge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
  };
}
```

**Ключевые features:**
- ✅ Search Input с иконкой Search (lucide-react)
- ✅ Опциональный Category Filter с иконкой Filter
- ✅ Адаптивный счётчик результатов (показывает filtered/total)
- ✅ Поддержка Badge в Select items для категорий
- ✅ Responsive layout (sm:flex-row для mobile)
- ✅ Единообразное выравнивание через flexbox

## Детальные изменения по файлам

### 1. `src/components/explorer/TabSearchHeader.tsx` (новый файл)

**Структура компонента:**
```tsx
<div className="flex flex-col gap-4">
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    {/* Search Input with Icon */}
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3..." />
      <Input placeholder={searchPlaceholder} className="pl-10" />
    </div>

    {/* Category Filter (optional) */}
    {categoryFilter && (
      <div className="relative">
        <Filter className="absolute left-3..." />
        <Select>...</Select>
      </div>
    )}

    {/* Results Counter */}
    <div className="flex items-center gap-3 sm:ml-auto">
      {infoBadge && <Badge>{infoBadge.label}</Badge>}
      <div className="text-sm">
        {isFiltered ? `${displayCount} filtered of ${totalCount}` : totalCount} {itemName}
      </div>
    </div>
  </div>
</div>
```

**Layout metrics:**
- Search Input: `flex-1 max-w-md` (ограничен 448px)
- Category Filter: `w-full sm:w-[200px]` (responsive)
- Counter: `sm:ml-auto` (прижат к правому краю на desktop)
- Gap: `gap-3` (12px) между элементами

### 2. `src/components/explorer/tabs/CommunitiesTabNew.tsx`

**Изменения:**
```diff
+ import { TabSearchHeader } from '@/components/explorer/TabSearchHeader';
- import { Input } from '@/components/ui/input';

// Замена search секции:
- <div className="flex items-center gap-4">
-   <Input placeholder="..." className="max-w-sm" />
-   <div className="ml-auto">...</div>
- </div>
+ <TabSearchHeader
+   searchQuery={searchQuery}
+   onSearchChange={setSearchQuery}
+   searchPlaceholder="Search by name, summary, or ID..."
+   totalCount={totalEntries}
+   filteredCount={filteredCommunities.length}
+   itemName="communities"
+ />
```

**Live Indicator улучшение:**
```tsx
{isPolling && (
  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
    <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600 dark:text-green-400" />
    <span className="text-xs text-green-700 dark:text-green-300 font-semibold">
      Live
    </span>
  </div>
)}
```

**Изменения дизайна:**
- Цвет: blue → green (более подходящий для "Live" статуса)
- Padding: `px-2 py-1` → `px-2.5 py-1.5` (больше breathing room)
- Hover effect: `hover:bg-green-500/15`
- Dark mode support: `dark:text-green-300`

### 3. `src/components/explorer/tabs/EntitiesTabNew.tsx`

**Изменения:**
```diff
+ import { TabSearchHeader } from '@/components/explorer/TabSearchHeader';
- import { Search, Filter } from 'lucide-react';
- import { Input } from '@/components/ui/input';
- import { Select, ... } from '@/components/ui/select';
```

**Добавлен useMemo для категорий:**
```tsx
// Перемещён getCategoryBadgeProps в useCallback перед использованием
const getCategoryBadgeProps = React.useCallback(...);

// Подготовка категорий для TabSearchHeader
const categoryFilterOptions = React.useMemo(() => {
  return [
    {
      value: 'all',
      label: 'All Categories',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    },
    ...categories.map((cat) => {
      const badgeProps = getCategoryBadgeProps(cat);
      return {
        value: cat,
        label: cat,
        badgeVariant: badgeProps.variant,
        badgeClassName: badgeProps.className,
      };
    }),
  ];
}, [categories, getCategoryBadgeProps]);
```

**Использование:**
```tsx
<TabSearchHeader
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search by name, entity ID, or category..."
  totalCount={totalEntries}
  filteredCount={filteredEntities.length}
  itemName="entities"
  categoryFilter={
    categoryFilterOptions.length > 1
      ? {
          value: categoryFilter,
          onChange: setCategoryFilter,
          categories: categoryFilterOptions,
        }
      : undefined
  }
/>
```

**Важное исправление:** Функция `getCategoryBadgeProps` обёрнута в `useCallback` и перемещена перед `useMemo` чтобы избежать ошибки "Cannot access before initialization".

### 4. `src/components/explorer/tabs/RelationshipsTabNew.tsx`

**Изменения:** Аналогично CommunitiesTabNew:
- Добавлен импорт `TabSearchHeader`
- Удалён импорт `Input`
- Заменена секция поиска
- Улучшен Live indicator (green вместо blue)

### 5. `src/components/explorer/tabs/UsersTabNew.tsx`

**Изменения:** Аналогично CommunitiesTabNew и RelationshipsTabNew.

## Визуальные улучшения

### До рефакторинга

**CommunitiesTab:**
```text
[Search Input (max-w-sm)]            [65 communities]  [Live]
        ↑                                    ↑
   Асимметричный                    Неравномерный gap
```

**Проблемы:**
- ❌ Input ограничен `max-w-sm` (384px) создавал пустое пространство
- ❌ Счётчик и Live badge не имели общего контейнера
- ❌ Отсутствовала иконка Search

### После рефакторинга

**Все табы (унифицировано):**
```text
[🔍 Search Input (flex-1 max-w-md)]  [🌐 Filter]  [65 communities] [✓ Live]
              ↑                           ↑              ↑             ↑
      Иконка + flex-1              Optional       Counter      Enhanced badge
```

**Улучшения:**
- ✅ Search Input с иконкой слева (pl-10)
- ✅ Flex-1 для adaptive width, max-w-md (448px) ограничение
- ✅ Опциональный Category Filter с иконкой Filter
- ✅ Счётчик прижат к правому краю (sm:ml-auto)
- ✅ Live badge с улучшенным дизайном (green, hover effect)

### Live Indicator сравнение

**До:**
```tsx
<div className="... bg-blue-500/10 border border-blue-500/20">
  <Loader2 className="h-3.5 w-3.5 text-blue-500" />
  <span className="text-xs text-blue-500">Live</span>
</div>
```

**После:**
```tsx
<div className="... bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
  <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600 dark:text-green-400" />
  <span className="text-xs text-green-700 dark:text-green-300 font-semibold">Live</span>
</div>
```

**Улучшения:**
- ✅ Green цвет (более подходящий для "Live"/"Active")
- ✅ Hover effect (`hover:bg-green-500/15`)
- ✅ Dark mode support (`dark:text-green-300`)
- ✅ Font-semibold для лучшей читаемости
- ✅ Больший padding (`px-2.5 py-1.5`)

## Technical Details

### Icon Positioning

**Search Icon:**
```tsx
<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
<Input className="pl-10" />
```

- Position: `left-3` (12px from left)
- Vertical centering: `top-1/2 -translate-y-1/2`
- Non-interactive: `pointer-events-none`
- Input padding: `pl-10` (40px) для space для иконки

**Filter Icon (в Select):**
```tsx
<Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
<SelectTrigger className="w-full sm:w-[200px] pl-10" />
```

- Z-index: `z-10` чтобы быть поверх Select overlay
- SelectTrigger padding: `pl-10` для иконки

### Responsive Behavior

**Mobile (< 640px):**
```text
┌─────────────────────────┐
│ 🔍 Search Input         │
├─────────────────────────┤
│ 🌐 Category Filter      │
├─────────────────────────┤
│ 65 communities   ✓ Live │
└─────────────────────────┘
```

**Desktop (≥ 640px):**
```text
┌──────────────────────────────────────────────────────┐
│ 🔍 Search Input    🌐 Filter    65 communities  ✓ Live │
└──────────────────────────────────────────────────────┘
```

**Layout classes:**
- Container: `flex flex-col sm:flex-row` (column на mobile, row на desktop)
- Search: `flex-1 max-w-md` (растягивается, но ограничен 448px)
- Filter: `w-full sm:w-[200px]` (full width на mobile, 200px на desktop)
- Counter: `sm:ml-auto` (прижат к правому краю на desktop)

### Badge in Select Support

**Механизм:**
```tsx
// В TabSearchHeader
{categoryFilter.categories.map((cat) => (
  <SelectItem key={cat.value} value={cat.value}>
    <div className="flex items-center gap-2">
      {cat.badgeVariant ? (
        <Badge
          variant={cat.badgeVariant}
          className={`${cat.badgeClassName || ''} scale-90`}
        >
          {cat.label}
        </Badge>
      ) : (
        <>
          {cat.color && <div className={`h-2 w-2 rounded-full ${cat.color}`} />}
          <span>{cat.label}</span>
        </>
      )}
    </div>
  </SelectItem>
))}
```

**Features:**
- Если `badgeVariant` указан → рендерит Badge с `scale-90` (меньше для Select)
- Если нет `badgeVariant`, но есть `color` → рендерит цветной dot
- Fallback → простой `<span>`

## Best Practices применены

### 1. Component Composition
```tsx
// Вместо дублирования кода в каждом табе:
<TabSearchHeader {...props} />

// Кастомизация через props + children pattern для Live badge
```

### 2. Responsive Design
```tsx
// Mobile-first подход
className="flex flex-col sm:flex-row"  // Vertical на mobile, horizontal на desktop
className="w-full sm:w-[200px]"       // Full width на mobile
```

### 3. Accessibility
- ✅ Иконки: `pointer-events-none` чтобы не мешать focus
- ✅ Placeholder текст для screen readers
- ✅ Semantic HTML (div + flex layout)

### 4. Dark Mode Support
```tsx
// Все цвета имеют dark: варианты
className="text-green-700 dark:text-green-300"
className="bg-green-500/10 dark:bg-green-500/20"
```

### 5. TypeScript Safety
```typescript
interface TabSearchHeaderProps {
  // Required props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // ...
  // Optional props с type guards
  categoryFilter?: { ... };
  infoBadge?: { ... };
}
```

## Performance Considerations

### useMemo для категорий
```tsx
// Избегаем пересоздания category options на каждый render
const categoryFilterOptions = React.useMemo(() => {
  return [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat) => ({
      value: cat,
      label: cat,
      badgeVariant: getCategoryBadgeProps(cat).variant,
      badgeClassName: getCategoryBadgeProps(cat).className,
    })),
  ];
}, [categories, getCategoryBadgeProps]);
```

### useCallback для getCategoryBadgeProps
```tsx
// Мемоизируем функцию чтобы не нарушать useMemo dependency
const getCategoryBadgeProps = React.useCallback(
  (category: string) => { ... },
  []
);
```

## Файлы изменены

### Новые файлы:
1. ✅ `src/components/explorer/TabSearchHeader.tsx` - Унифицированный search header компонент

### Изменённые файлы:
1. ✅ `src/components/explorer/tabs/CommunitiesTabNew.tsx` - Интеграция TabSearchHeader
2. ✅ `src/components/explorer/tabs/EntitiesTabNew.tsx` - Интеграция с category filter
3. ✅ `src/components/explorer/tabs/RelationshipsTabNew.tsx` - Интеграция TabSearchHeader
4. ✅ `src/components/explorer/tabs/UsersTabNew.tsx` - Интеграция TabSearchHeader

### Документация:
1. ✅ `docs/SEARCH_HEADER_IMPROVEMENTS.md` - Этот документ

## Дальнейшие возможные улучшения

### 1. Keyboard Shortcuts
Добавить hotkeys для focus на search:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 2. Search History
Dropdown с recent searches:
```tsx
const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('search-history', []);
```

### 3. Advanced Filters
Expandable panel с дополнительными фильтрами:
```tsx
<Collapsible>
  <CollapsibleTrigger>Advanced Filters</CollapsibleTrigger>
  <CollapsibleContent>
    {/* Date range, status, etc */}
  </CollapsibleContent>
</Collapsible>
```

### 4. Search Suggestions
Autocomplete на базе существующих данных:
```tsx
const suggestions = useMemo(() => {
  return items
    .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
}, [items, query]);
```

## Заключение

Проведённый рефакторинг search/filter интерфейсов решил все основные проблемы:

✅ **Устранены асимметричные отступы** - унифицированный layout через flexbox
✅ **Единообразие между табами** - `TabSearchHeader` используется везде
✅ **Поддержка category filters** - Badge в Select работает seamlessly
✅ **Улучшен Live indicator** - green цвет, hover effects, dark mode
✅ **Responsive design** - mobile-first подход
✅ **Accessibility** - правильная структура, dark mode support
✅ **Performance** - useMemo/useCallback для оптимизации

Все Explorer табы теперь имеют профессиональный, современный и консистентный дизайн.
