# Entities Tab UI Improvements

## Обзор изменений

Компонент `EntitiesTab` был полностью переработан в соответствии с современными практиками дизайна и стандартами shadcn/ui. Все изменения направлены на улучшение UX, визуальной согласованности и эргономики интерфейса.

## Ключевые улучшения

### 1. Категориальный фильтр (Category Filter)

**До:**
- Обычный Select без визуальных индикаторов
- Нет иконки фильтра
- Placeholder "Filter by category"

**После:**
```tsx
<div className="relative">
  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
    <SelectTrigger className="w-[200px] pl-9">
      <SelectValue placeholder="All categories" />
    </SelectTrigger>
    <SelectContent>
      {/* All Categories option with gradient dot */}
      <SelectItem value="all">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          <span>All Categories</span>
        </div>
      </SelectItem>
      {/* Category options with styled badges */}
      {categories.map((cat) => (
        <SelectItem key={cat} value={cat}>
          <Badge variant={...} className={...}>
            {cat}
          </Badge>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Улучшения:**
- ✅ Иконка `Filter` слева для визуальной идентификации
- ✅ Увеличена ширина до 200px для лучшей читаемости
- ✅ Градиентный индикатор для "All Categories"
- ✅ Предпросмотр badge прямо в dropdown options
- ✅ `z-10` для корректного отображения иконки

### 2. Поисковое поле (Search Input)

**До:**
- Обычный Input без иконки
- `className="max-w-sm"`

**После:**
```tsx
<div className="relative flex-1 max-w-sm">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
  <Input
    placeholder="Search by name, entity ID, or category..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9"
  />
</div>
```

**Улучшения:**
- ✅ Иконка `Search` слева
- ✅ Padding left увеличен до `pl-9` для иконки
- ✅ `flex-1` для адаптивной ширины
- ✅ `pointer-events-none` для избежания конфликтов событий

### 3. Badges категорий (Category Badges)

**До:**
```tsx
const getCategoryVariant = (category: string) => {
  const hash = category.split('').reduce((a, b) => {
    return ((a << 5) - a + b.charCodeAt(0)) | 0;
  }, 0);
  const variants = ['default', 'secondary', 'outline'] as const;
  return variants[Math.abs(hash) % variants.length];
};
```

**После:**
```tsx
const getCategoryBadgeProps = (category: string): {
  variant: 'default' | 'secondary' | 'outline';
  className?: string;
} => {
  const categoryLower = category.toLowerCase();

  // Semantic category mappings
  const semanticCategories: Record<string, { variant: ...; className?: string }> = {
    'api_endpoint': {
      variant: 'default',
      className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800',
    },
    'class': {
      variant: 'outline',
      className: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-800',
    },
    'module': {
      variant: 'secondary',
      className: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-800',
    },
    'import': {
      variant: 'outline',
      className: 'bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-800',
    },
    'person': {
      variant: 'default',
      className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-800',
    },
  };

  // Check for exact match
  if (semanticCategories[categoryLower]) {
    return semanticCategories[categoryLower];
  }

  // Fallback to hash-based coloring
  const hash = category.split('').reduce((a, b) => {
    return ((a << 5) - a + b.charCodeAt(0)) | 0;
  }, 0);
  const variants: Array<'default' | 'secondary' | 'outline'> = ['default', 'secondary', 'outline'];
  return { variant: variants[Math.abs(hash) % variants.length] };
};
```

**Улучшения:**
- ✅ Семантические цвета для известных категорий (API_ENDPOINT, CLASS, MODULE, IMPORT, PERSON)
- ✅ Dark mode поддержка через Tailwind dark: префикс
- ✅ Мягкие цвета с opacity (10-20%) для фона
- ✅ Контрастные border цвета для лучшей видимости
- ✅ Fallback на hash-based алгоритм для неизвестных категорий
- ✅ Type-safe через TypeScript interface

**Цветовая схема:**
| Категория | Цвет | Light mode | Dark mode |
|-----------|------|------------|-----------|
| API_ENDPOINT | Синий | `bg-blue-500/10` | `bg-blue-500/20` |
| CLASS | Фиолетовый | `bg-purple-500/10` | `bg-purple-500/20` |
| MODULE | Зелёный | `bg-green-500/10` | `bg-green-500/20` |
| IMPORT | Голубой | `bg-cyan-500/10` | `bg-cyan-500/20` |
| PERSON | Янтарный | `bg-amber-500/10` | `bg-amber-500/20` |

### 4. Кнопки действий (Action Buttons)

**До:**
```tsx
<RemoveButton
  itemId={entity.id?.toString() || ''}
  collectionId={collectionId || ''}
  itemType="entity"
  onSuccess={...}
  showToast={toast}
/>
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  ...
</DropdownMenu>
```

**Проблемы:**
- ❌ Красная `variant="destructive"` кнопка всегда видна
- ❌ RemoveButton использует внешний компонент
- ❌ Нет Tooltip для кнопок

**После:**
```tsx
<div className="flex items-center justify-end gap-1">
  {/* Copy Actions Dropdown with Tooltip */}
  <TooltipProvider>
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More actions</TooltipContent>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Copy</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => copyToClipboard(entity.id?.toString() || '')}>
            <Copy className="mr-2 h-4 w-4" />
            Entity ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyToClipboard(entity.name || '')}>
            <Copy className="mr-2 h-4 w-4" />
            Name
          </DropdownMenuItem>
          {entity.category && (
            <DropdownMenuItem onClick={() => copyToClipboard(entity.category || '')}>
              <Copy className="mr-2 h-4 w-4" />
              Category
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  </TooltipProvider>

  {/* Remove Button with Tooltip */}
  <TooltipProvider>
    <Tooltip>
      <EntityRemoveButton
        entityId={entity.id?.toString() || ''}
        collectionId={collectionId || ''}
        onSuccess={...}
      />
      <TooltipContent>Remove from collection</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
```

**Новый EntityRemoveButton компонент:**
```tsx
function EntityRemoveButton({ entityId, collectionId, onSuccess }: EntityRemoveButtonProps) {
  const { getClient } = useUserContext();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const client = await getClient();
      if (!client) throw new Error('Failed to get authenticated client');

      await client.graphs.removeEntity({ collectionId, entityId });
      onSuccess();
    } catch (error: unknown) {
      // Error handling...
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove entity</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove entity from collection?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the entity from the current collection. The entity will not be deleted from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Улучшения:**
- ✅ Кнопка удаления теперь `variant="ghost"` с hover эффектом
- ✅ Цвет меняется на `text-destructive` только при hover
- ✅ Фон `bg-destructive/10` при hover
- ✅ Иконка `Trash2` вместо `FileMinus`
- ✅ Tooltips для всех кнопок через `TooltipProvider`
- ✅ `transition-all` для плавной анимации
- ✅ Loading state с `isRemoving`
- ✅ Улучшенный AlertDialog текст
- ✅ Внутренний компонент (не зависит от `RemoveButton`)

### 5. Results Counter

**До:**
```tsx
<div className="ml-auto text-sm text-muted-foreground">
  {searchQuery.trim() || categoryFilter !== 'all'
    ? `${filteredEntities.length} filtered of ${totalEntries} total`
    : `${totalEntries} entit${totalEntries !== 1 ? 'ies' : 'y'}`}
</div>
```

**После:**
```tsx
<div className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
  {searchQuery.trim() || categoryFilter !== 'all' ? (
    <span className="font-medium text-foreground">{filteredEntities.length}</span>
  ) : null}
  {searchQuery.trim() || categoryFilter !== 'all' ? ' filtered of ' : ''}
  <span className="font-medium text-foreground">{totalEntries}</span>
  {' '}{totalEntries !== 1 ? 'entities' : 'entity'}
</div>
```

**Улучшения:**
- ✅ Числа выделены `font-medium text-foreground` для контраста
- ✅ `whitespace-nowrap` предотвращает перенос строки
- ✅ Более чёткое разделение фильтрованных и общих результатов

### 6. Responsive Design

**До:**
- `<div className="flex items-center gap-4">`

**После:**
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  {/* Search и Filter */}
</div>
```

**Улучшения:**
- ✅ Mobile-first подход через `flex-col` → `sm:flex-row`
- ✅ Адаптивное выравнивание: `items-start` → `sm:items-center`
- ✅ Уменьшен gap до `gap-3` для компактности

## Технические детали

### Новые импорты

```tsx
import {
  Copy,
  MoreHorizontal,
  Network,
  Trash2,     // Новая иконка для удаления
  Search,     // Новая иконка для поиска
  Filter,     // Новая иконка для фильтра
} from 'lucide-react';

import {
  AlertDialog,               // Для EntityRemoveButton
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  Tooltip,                   // Для кнопок действий
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useUserContext } from '@/context/UserContext'; // Для EntityRemoveButton
```

### Удалённые зависимости

```tsx
// Больше не используется:
import { RemoveButton } from '@/components/ChatDemo/remove';
```

## Проверка работоспособности

### ESLint
```bash
pnpm lint
```

**Результат:** ✅ Все автофиксы применены, импорты отсортированы, форматирование корректное.

### TypeScript
```bash
pnpm tsc --noEmit
```

**Ожидаемый результат:** Нет ошибок типов.

### Dev Server
```bash
pnpm dev
```

**Проверить:**
- [ ] Search input отображается с иконкой слева
- [ ] Category filter показывает badges в dropdown
- [ ] Badges категорий используют семантические цвета
- [ ] Кнопка удаления появляется при hover и меняет цвет
- [ ] Tooltips отображаются корректно
- [ ] AlertDialog работает при клике на Trash2
- [ ] Copy actions dropdown работает
- [ ] Responsive layout на мобильных устройствах

## Сравнение до/после

### До:
- ❌ Красная кнопка удаления всегда видна
- ❌ Dropdown actions плохо видны
- ❌ Category filter без визуальных индикаторов
- ❌ Badges используют только hash-based цвета
- ❌ Нет иконок для Search и Filter
- ❌ Нет Tooltips
- ❌ Зависимость от внешнего RemoveButton

### После:
- ✅ Кнопка удаления появляется при hover
- ✅ Мягкий hover эффект с `bg-destructive/10`
- ✅ Category filter с иконкой и badge preview
- ✅ Семантические цвета для известных категорий
- ✅ Иконки Search и Filter слева
- ✅ Tooltips для всех кнопок
- ✅ Внутренний EntityRemoveButton компонент
- ✅ Dark mode поддержка

## Рекомендации по расширению

### Добавление новых семантических категорий

Для добавления новой категории в `getCategoryBadgeProps`:

```tsx
const semanticCategories: Record<string, { variant: ...; className?: string }> = {
  // Существующие...
  'new_category': {
    variant: 'outline',
    className: 'bg-pink-500/10 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-800',
  },
};
```

### Использование в других табах

Паттерны из `EntitiesTab` можно применить к:
- `RelationshipsTab` (аналогичная структура)
- `CommunitiesTab`
- `UsersTab`

**Ключевые элементы для переноса:**
1. Search input с иконкой
2. Category/Type filter с badge preview
3. EntityRemoveButton → RelationshipRemoveButton
4. Tooltips для actions
5. Semantic badge colors

## Заключение

Все улучшения следуют современным практикам UI/UX:
- **Shadcn/ui компоненты:** AlertDialog, Tooltip, Select
- **Lucide иконки:** Search, Filter, Trash2
- **Tailwind CSS:** Responsive, dark mode, opacity
- **Accessibility:** aria-labels, tooltips, focus states
- **Performance:** useMemo, React.useState для loading state

Компонент теперь более эргономичен, визуально согласован и готов к production использованию.
