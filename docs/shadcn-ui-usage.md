# Руководство по использованию shadcn/ui в проекте

## Установленные компоненты

Все компоненты находятся в `src/components/ui/` и готовы к использованию.

## Основные компоненты для Chat UI

### 1. Input (поисковая строка)

```tsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Введите текст..."
  className="h-12 px-6"
  disabled={false}
/>
```

**Design tokens:**
- `text-foreground` - цвет текста
- `placeholder:text-muted-foreground` - цвет placeholder
- `border-input` - цвет границы
- `focus-visible:border-primary` - фокус

### 2. Card (сообщения чата)

```tsx
import { Card, CardContent } from '@/components/ui/card';

<Card className="bg-primary text-primary-foreground">
  <CardContent className="p-4">
    <p>Текст сообщения</p>
  </CardContent>
</Card>
```

**Варианты Card:**
- Пользователь: `bg-primary text-primary-foreground`
- Ассистент: `bg-muted/50 border-border/50`
- С анимацией: `animate-in slide-in-from-right-2`

### 3. Button

```tsx
import { Button } from '@/components/ui/button';

<Button
  size="icon"
  className="h-12 w-12"
  disabled={false}
>
  <ArrowRight className="h-5 w-5" />
</Button>
```

**Размеры:**
- `size="sm"` - маленькая
- `size="default"` - обычная
- `size="lg"` - большая
- `size="icon"` - квадратная для иконок

### 4. Select (выбор режима)

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={mode} onValueChange={setMode}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Выберите режим" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="rag">RAG</SelectItem>
    <SelectItem value="rag_agent">RAG Agent</SelectItem>
  </SelectContent>
</Select>
```

### 5. Accordion (настройки в Sidebar)

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="settings">
    <AccordionTrigger>Настройки</AccordionTrigger>
    <AccordionContent>
      {/* Контент */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Design Tokens (CSS переменные)

### Цвета

| Token | Использование |
|-------|---------------|
| `bg-background` | Основной фон страницы |
| `text-foreground` | Основной текст |
| `bg-card` | Фон карточек |
| `bg-primary` | Акцентный цвет (кнопки, активные элементы) |
| `text-primary-foreground` | Текст на акцентном фоне |
| `bg-muted` | Приглушенный фон |
| `text-muted-foreground` | Вторичный текст |
| `border-border` | Цвет границ |
| `border-input` | Границы инпутов |
| `ring-ring` | Focus ring |

### Эффекты

```tsx
// Backdrop blur
className="bg-background/95 backdrop-blur"

// Gradient
className="bg-gradient-to-t from-background via-background to-transparent"

// Transition
className="transition-all duration-300 ease-in-out"

// Animations
className="animate-in slide-in-from-right-2 duration-300"
className="animate-pulse"
```

---

## Адаптивность

### Breakpoints

```tsx
// Mobile first
className="p-2 sm:p-4 md:p-6 lg:p-8"

// Max width
className="max-w-xs lg:max-w-md"

// Hide/Show
className="hidden md:block"
```

---

## Темная тема

Все компоненты **автоматически** поддерживают темную тему через:

```css
.dark {
  --background: 216 28% 7%;
  --foreground: 210 17% 82%;
  /* ... */
}
```

**Переключение темы** происходит в `src/components/ThemeProvider/`.

---

## Accessibility

### Screen Reader

```tsx
<span className="sr-only">Описание для скринридера</span>
```

### ARIA

```tsx
<button aria-label="Отправить сообщение">
  <ArrowRight />
</button>
```

---

## Утилита cn()

Для комбинирования классов используй `cn()` из `@/lib/utils`:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // пропсы извне
)}>
```

**Пример:**
```tsx
<Card className={cn(
  'bg-muted/50 transition-all',
  isStreaming && 'ring-2 ring-primary/20',
  isError && 'border-destructive'
)}>
```

---

## Частые паттерны

### Sticky Footer

```tsx
<div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background">
  <Search />
</div>
```

### Centered Content

```tsx
<div className="fixed top-16 left-0 right-0 bottom-0 flex justify-center">
  <div className="w-full max-w-4xl">
    {/* Content */}
  </div>
</div>
```

### Loading State

```tsx
<Card className={cn(
  'transition-all',
  isLoading && 'animate-pulse opacity-50'
)}>
```

---

## Добавление новых компонентов

Если нужен новый shadcn/ui компонент:

```bash
# Установить компонент через CLI (если есть)
npx shadcn-ui@latest add tooltip

# Или скопировать из https://ui.shadcn.com/docs/components/
# в src/components/ui/
```

---

## Примеры из проекта

### Search Bar (search.tsx)

✅ Правильная реализация с shadcn/ui Input

```tsx
<div className="relative flex items-center gap-0 rounded-full overflow-hidden border border-input bg-zinc-800/50">
  <Input
    className="flex-1 h-12 border-0 bg-transparent"
    placeholder="Ask a question..."
  />
  <Button size="icon" className="h-12 w-12">
    <ArrowRight className="h-5 w-5" />
  </Button>
</div>
```

### Message Bubble (MessageBubble.tsx)

✅ Card с анимациями и design tokens

```tsx
<div className="flex justify-end mb-4 animate-in slide-in-from-right-2">
  <Card className="bg-primary text-primary-foreground shadow-md">
    <CardContent className="p-4">
      <p className="text-sm leading-relaxed">{message.content}</p>
    </CardContent>
  </Card>
</div>
```

---

**Обновлено**: 2025-12-16
