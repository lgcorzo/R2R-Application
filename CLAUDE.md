# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Обзор проекта

R2R Dashboard — Next.js приложение для управления и мониторинга RAG (Retrieval-Augmented Generation) пайплайнов, построенных на [R2R framework](https://github.com/SciPhi-AI/R2R). Используется TypeScript, React 18, Next.js 14.2.5 (Pages Router), и SDK r2r-js v0.4.43.

### Ключевые архитектурные решения

- **Pages Router (НЕ App Router)**: Используется классическая архитектура Next.js с `src/pages/`, а не новый App Router
- **Runtime Config Injection**: Переменные окружения инжектируются в рантайм через `scripts/replace-env.js` → `public/env-config.js` для поддержки Docker-деплоя без пересборки
- **Standalone Output**: `next.config.js` использует `output: 'standalone'` для оптимизированных Docker-образов
- **Global Authentication**: Проверка прав доступа реализована централизованно в `src/pages/_app.tsx:23-56` через `useEffect + router.replace()`
- **R2R SDK Integration**: Все взаимодействие с R2R backend идет через `r2rClient` из `r2r-js` (инициализация в `UserContext`)
- **Supabase для метаданных**: Параллельно с R2R используется Supabase для дополнительных данных (конфиг в `.env`)

## 🛠️ Команды разработки

### Setup и запуск

```bash
# Установка зависимостей (ВСЕГДА используй pnpm, не npm/yarn)
pnpm install

# Development сервер на порту 3005 (НЕ 3000!)
pnpm dev

# Production build
pnpm build
pnpm start  # Запускается на порту 3000

# Проверка качества кода
pnpm lint          # ESLint с автофиксом
pnpm format        # Prettier форматирование
pnpm format:check  # Проверка без изменений
```

### Настройка окружения

1. **Создай `.env`** на основе `.env.example` (ОБЯЗАТЕЛЬНО перед первым запуском):

   ```bash
   cp .env.example .env
   ```

2. **Основные переменные** (требуются для работы):
   - `NEXT_PUBLIC_R2R_DEPLOYMENT_URL` — URL R2R API сервера
   - `NEXT_PUBLIC_R2R_DEFAULT_EMAIL` / `_PASSWORD` — автологин для разработки
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase настройки
   - `NEXT_PUBLIC_SENTRY_DSN` — Sentry для мониторинга ошибок (опционально)

3. **Runtime Config**: При `pnpm build` скрипт `scripts/replace-env.js` заменяет плейсхолдеры в `public/env-config.js`

### Типичные workflow

#### Добавление новой страницы

1. Создай `src/pages/my-page.tsx` (НЕ в `app/`!)
2. Если нужна авторизация — добавь маршрут в `src/pages/_app.tsx:24-31` (publicRoutes или userRoutes)
3. Используй `useUserContext()` для доступа к R2R клиенту:
   ```tsx
   const { getClient, authState } = useUserContext();
   const client = await getClient();
   ```

#### Работа с R2R API

**ВСЕГДА** используй методы `r2rClient` из контекста, НЕ создавай новые инстансы:

```tsx
const { getClient } = useUserContext();
const client = await getClient();

// Примеры вызовов
const docs = await client.documentsOverview();
const searchResults = await client.search({ query: 'example' });
```

#### Обновление UI компонентов (shadcn/ui)

Компоненты в `src/components/ui/` основаны на Radix UI + Tailwind. При изменении:

1. Используй утилиту `cn()` из `src/lib/utils.ts` для комбинирования классов
2. Следуй паттерну `class-variance-authority` для вариантов кнопок/карточек
3. НЕ импортируй Radix напрямую — всегда через обертки в `ui/`

## 📚 Структура кодовой базы

```text
src/
├── pages/              # Next.js Pages Router маршруты
│   ├── _app.tsx       # Глобальный Layout + Auth Guard
│   ├── index.tsx      # Главная (redirect на /documents)
│   ├── auth/          # Логин/регистрация
│   ├── documents.tsx  # Управление документами
│   ├── collections.tsx
│   ├── chat.tsx       # RAG playground
│   └── ...
├── components/
│   ├── ui/            # shadcn/ui компоненты (Radix + Tailwind)
│   ├── ChatDemo/      # Компоненты чата и RAG
│   ├── explorer/      # File explorer (новая фича)
│   └── shared/        # Footer, Logo, ThemeToggle
├── context/
│   └── UserContext.tsx # Глобальное состояние: auth + r2rClient
├── lib/
│   ├── utils.ts       # cn() и утилиты Tailwind
│   ├── logger.ts      # Логгирование в Sentry
│   ├── supabase.ts    # Supabase клиент
│   └── posthog-client.tsx # Аналитика
├── types.ts           # Глобальные TypeScript типы
└── styles/globals.css # Tailwind + кастомные стили
```

### Импорты и алиасы

- `@/*` → `src/*` (настроено в `tsconfig.json:20`)
- `@/utils/*` → `src/utils/*`
- **ВАЖНО**: ESLint настроен на автоматическую сортировку импортов (см. `.eslintrc.json:18-46`):
  1. Builtin (Node.js модули)
  2. External (npm пакеты)
  3. Internal (`@/components`, `@/ui`)
  4. Parent/Sibling (`../`, `./`)

## ⚙️ Настройки инструментов

### ESLint

- **Отключены правила**: `no-unused-vars`, `react-hooks/exhaustive-deps`, `@next/next/no-img-element` (см. `.eslintrc.json:9-17`)
- **Обязательно**: Сортировка импортов (`import/order`)
- **Рекомендация**: Запускай `pnpm lint` перед коммитом

### TypeScript

- **Strict mode**: Включен (`tsconfig.json:8`)
- **Target**: ES2018
- **Module Resolution**: Node (классический, не bundler)
- **JSX**: `preserve` (обрабатывается Next.js)

### Tailwind CSS

- Конфиг включает `@tailwindcss/forms` для стилизации форм
- Используй `tailwind-merge` через `cn()` для комбинирования классов
- Темизация через `next-themes` (см. `src/components/ThemeProvider/`)

### Sentry

- **Автоматическая настройка**: `next.config.js:29-83` (withSentryConfig)
- **Tunnel Route**: `/monitoring` для обхода ad-blockers
- **Error Handling**: Глобальный ErrorBoundary в `src/pages/_app.tsx:63-100`
- **НЕ фейлит билд**: При ошибках Sentry билд продолжается (см. `next.config.js:79-82`)

## 🔐 Аутентификация и права доступа

### Роли пользователей

- **admin** (суперпользователь): Полный доступ ко всем страницам
- **user**: Ограниченный доступ (только `/documents`, `/collections`, `/chat`, `/account`)

### Механизм проверки

Реализован в `src/pages/_app.tsx:23-56`:

1. **Незалогиненные** → redirect на `/auth/login`
2. **Админы** → доступ везде
3. **Обычные юзеры** → только `userRoutes`, иначе → `/documents`

### API взаимодействие

R2R клиент автоматически прикрепляет токен из `localStorage` (управляется в `UserContext`):

```tsx
// Логин
const { login } = useUserContext();
await login(email, password); // Сохраняет токен в localStorage

// Использование
const client = await getClient(); // Токен прикрепляется автоматически
```

## 📊 Интеграции

### PostHog (аналитика)

- Инициализация в `src/pages/_app.tsx:19-21`
- Конфигурация в `src/lib/posthog-client.tsx`
- **Отключение**: Проверяет `R2R_DASHBOARD_DISABLE_TELEMETRY` из env

### Vercel Analytics

- Автоматически включена через `<Analytics />` в `_app.tsx:134`

### Supabase

- Клиент в `src/lib/supabase.ts`
- Используется параллельно с R2R для дополнительных метаданных
- **НЕ используется для auth** (аутентификация через R2R API)

## ⛔️ Запрещенные практики

1. **НЕ используй App Router синтаксис** (`app/`, Server Components) — проект на Pages Router
2. **НЕ создавай новые инстансы r2rClient** — всегда используй `getClient()` из контекста
3. **НЕ хардкодь URLs** — используй переменные из `window.__RUNTIME_CONFIG__`
4. **НЕ импортируй Radix напрямую** — всегда через обертки в `src/components/ui/`
5. **НЕ коммить `.env`** — используй `.env.example` как шаблон
6. **НЕ используй npm/yarn** — только pnpm (указан в `package.json:5` как packageManager)
7. **НЕ игнорируй import order** — ESLint автоматически сортирует, следуй этому паттерну

## 🐛 Дебаггинг и troubleshooting

### Runtime Config не загружается

Проверь консоль браузера — скрипт `env-config.js` логгируется в `_app.tsx:106-122`:

```tsx
logger.info('Runtime config loaded', { hasDeploymentUrl: ... });
// или
logger.warn('Runtime config not found');
```

### R2R API не отвечает

1. Проверь `NEXT_PUBLIC_R2R_DEPLOYMENT_URL` в `.env`
2. Проверь Network tab в DevTools — запросы идут через `r2r-js`
3. Включи verbose логирование в UserContext (там есть try/catch с Sentry)

### SSE (Server-Sent Events) ошибки

В `src/components/ChatDemo/` используется SSE для стриминга RAG ответов. Распространенная проблема — обработка `[DONE]` маркера (см. коммит `06ad6b6`).

### Ошибки аутентификации

Проверь:

1. Валиден ли токен в `localStorage.getItem('userToken')`
2. Не истек ли refresh token
3. Логи в Sentry (если настроен NEXT_PUBLIC_SENTRY_DSN)

## 🚀 Деплой

### Docker (рекомендуется)

```bash
# Билд образа
docker build -t r2r-dashboard .

# Запуск с переменными окружения
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_R2R_DEPLOYMENT_URL=https://api.example.com \
  -e SUPABASE_URL=https://... \
  -e SUPABASE_ANON_KEY=... \
  r2r-dashboard
```

**Важно**: Благодаря runtime config injection можно менять env переменные БЕЗ пересборки образа.

### Vercel

Проект оптимизирован для Vercel, но требует настройки:

1. Добавь все `NEXT_PUBLIC_*` переменные в Environment Variables
2. Добавь `SENTRY_AUTH_TOKEN` для source maps (опционально)
3. Build Command: `pnpm build` (по умолчанию)

## 🚀 Новые возможности

### URL Upload с автоматическим разбиением (декабрь 2024)

В Explorer добавлена возможность загрузки документов по URL с автоматическим разбиением на части:

**Расположение**: Explorer → Upload → вкладка "URL Upload"

**Основные фичи**:

- Загрузка текстовых файлов напрямую по ссылке
- Автоматическое разбиение `llms-full.txt` по Markdown заголовкам
- Все настройки из File Upload: Collections, Quality, Metadata
- Предпросмотр документов перед загрузкой
- Преобразование URL контента в File objects для унифицированной обработки

**Компонент**: `src/components/explorer/UrlUploadTab.tsx`

**Документация**: `docs/URL_UPLOAD_FEATURE.md`

## 🔄 Паттерны реализации

### Custom Hooks для Auto-Refresh

При создании функционала автообновления данных используй паттерн custom hook с polling:

**Структура hook:**

```typescript
// src/hooks/useDocumentPolling.ts
export function useDocumentPolling(
  documentIds: string[],
  options: {
    interval?: number; // Интервал polling (default 5000ms)
    onlyPending?: boolean; // Останавливать при завершении
    onUpdate?: (data) => void; // Callback обновления
    maxRetries?: number; // Retry mechanism (default 3)
  }
) {
  // Автоматический lifecycle management через useEffect
  // Graceful shutdown при unmount
  // Race condition protection через isPollingRef
  return { isPolling, startPolling, stopPolling, restartPolling };
}
```

**Интеграция:**

```typescript
// Вычисление pending документов через useMemo
const pendingIds = useMemo(() => {
  return files.filter(isPending).map((f) => f.id);
}, [files]);

// Подписка на обновления
const { isPolling } = useDocumentPolling(pendingIds, {
  interval: 5000,
  onUpdate: (updatedDocs) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => updatedDocs.find((d) => d.id === file.id) || file)
    );
  },
});
```

**Best Practices:**

- ✅ Используй `useMemo` для вычисления списка документов
- ✅ Функциональный setState для atomic updates
- ✅ Автоматическая остановка при `pendingIds.length === 0`
- ✅ Retry mechanism с configurable maxRetries
- ✅ Cleanup в useEffect return

### Массовые операции (Bulk Actions)

При добавлении bulk операций в explorer/documents:

**1. Валидация перед операцией:**

```typescript
const handleBulkExtract = async () => {
  // Фильтрация eligible документов
  const eligibleFiles = selectedFiles.filter((fileId) => {
    const file = files.find((f) => f.id === fileId);
    return file && file.ingestionStatus === IngestionStatus.SUCCESS;
  });

  // Проверка наличия eligible
  if (eligibleFiles.length === 0) {
    toast({ variant: 'destructive', title: 'No Eligible Documents' });
    return;
  }
};
```

**2. Последовательная обработка с задержками:**

```typescript
// НЕ Promise.all — это может перегрузить backend!
for (const fileId of eligibleFiles) {
  try {
    await client.documents.extract({ id: fileId });
    successCount++;
    await new Promise((resolve) => setTimeout(resolve, 300)); // Rate limiting
  } catch (error) {
    failCount++;
  }
}
```

**3. Детальный feedback:**

```typescript
toast({
  title: 'Extraction Started',
  description: `${successCount} queued. ${failCount > 0 ? `${failCount} failed.` : 'Processing...'}`,
  variant: failCount > 0 ? 'default' : 'success',
});
```

### UI индикаторы синхронизации

При показе статуса фоновых операций:

```tsx
{
  isPolling && pendingCount > 0 && (
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
          Auto-updating {pendingCount} document{pendingCount !== 1 ? 's' : ''}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Ключевые моменты:**

- Показывай индикатор только когда `isPolling && count > 0`
- Используй shadcn/ui Tooltip для доп. информации
- Цветовая схема: blue для процесса, green для success, red для error
- Анимация через `animate-spin` от Tailwind

### Работа с R2R API для массовых операций

**Extract операции:**

```typescript
// Одиночная экстракция
await client.documents.extract({ id: documentId });

// Массовая экстракция (последовательно!)
for (const id of documentIds) {
  await client.documents.extract({ id });
  await delay(300); // Rate limiting
}
```

**Получение обновленных данных:**

```typescript
// Batch retrieve для polling
const promises = documentIds.map((id) =>
  client.documents.retrieve({ id }).catch(() => null)
);
const results = await Promise.all(promises);
const documents = results
  .filter((r): r is { results: DocumentResponse } => r !== null)
  .map((r) => r.results);
```

## 📝 Git Workflow

**ВСЕГДА** коммиты на русском (приоритет), одна строка, без Co-Authored-By:

```bash
git commit -m "feat: добавлен темный режим для страницы explorer"
git commit -m "fix: исправлена обработка SSE маркера [DONE]"
```

Префиксы: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`.

---

**Полезные ссылки:**

- [R2R Documentation](https://r2r-docs.sciphi.ai/)
- [r2r-js SDK](https://github.com/SciPhi-AI/r2r-js)
- [Discord сообщество](https://discord.gg/p6KqD2kjtB)
