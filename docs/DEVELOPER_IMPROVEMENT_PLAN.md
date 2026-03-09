# Технический план улучшений для программиста

## R2R-Application Code Quality & Architecture Improvements

> **Цель:** Улучшить качество кода, архитектуру, производительность и поддерживаемость проекта

---

## 📊 Текущее состояние кодовой базы

### Метрики

- **Строк кода:** ~15,000+ (только src/)
- **Компонентов:** 50+
- **Страниц:** 15+
- **Использование `any`:** 137+ мест
- **Тесты:** 0 ❌
- **TypeScript strict mode:** ✅ (но правила ослаблены)
- **ESLint правила:** Многие отключены
- **Самый большой файл:** `explorer.tsx` - 4157 строк
- **Самый большой контекст:** `UserContext.tsx` - 673 строки

### Критические проблемы

1. **Архитектурные:**
   - Монолитные компоненты (explorer.tsx - 4157 строк)
   - Дублирование логики между страницами
   - Нет абстракции для API вызовов
   - Смешанная ответственность компонентов

2. **Качество кода:**
   - 137+ использований `any`
   - ESLint правила отключены (`no-explicit-any`, `no-unused-vars`)
   - Много `console.log` вместо структурированного логирования
   - Нет централизованной обработки ошибок

3. **Производительность:**
   - Клиентская фильтрация больших наборов данных
   - Нет мемоизации в критических местах
   - Большие компоненты без code splitting
   - Нет виртуальной прокрутки

4. **Тестирование:**
   - Нет unit тестов
   - Нет integration тестов
   - Нет E2E тестов

---

## 🎯 Приоритетные задачи

### Phase 1: Критический рефакторинг (2-3 недели)

#### 1.1 Разбить монолитные компоненты

**Проблема:** `explorer.tsx` - 4157 строк, `UserContext.tsx` - 673 строки

**Решение:**

```typescript
// Разбить explorer.tsx на модули:
src/pages/explorer/
├── index.tsx                    # Главный компонент (100-200 строк)
├── components/
│   ├── FileManager.tsx          # File manager логика
│   ├── CollectionTree.tsx       # Tree компонент
│   ├── DocumentTable.tsx        # Таблица документов
│   ├── Toolbar.tsx              # Toolbar с действиями
│   └── Filters.tsx              # Фильтры
├── hooks/
│   ├── useFileManager.ts        # Логика file manager
│   ├── useCollectionTree.ts     # Логика дерева
│   ├── useDocuments.ts          # Загрузка документов
│   └── useFilters.ts            # Логика фильтров
└── utils/
    ├── fileOperations.ts        # Операции с файлами
    └── treeUtils.ts             # Утилиты для дерева
```

**Задачи:**

- [ ] Создать структуру папок для explorer
- [ ] Выделить FileManager в отдельный компонент
- [ ] Создать кастомные хуки для логики
- [ ] Разбить на компоненты < 300 строк каждый
- [ ] Убедиться, что функциональность сохранена

**Оценка:** 3-5 дней

---

#### 1.2 Рефакторинг UserContext

**Проблема:** 673 строки, смешанная ответственность

**Решение:**

```typescript
// Разделить на несколько контекстов и сервисов:
src/context/
├── AuthContext.tsx              # Аутентификация (200 строк)
├── UserContext.tsx              # Пользовательские данные (150 строк)
└── PipelineContext.tsx         # Pipeline конфигурация (100 строк)

src/services/
├── authService.ts              # Логика аутентификации
├── userService.ts              # Операции с пользователями
└── pipelineService.ts          # Операции с pipeline
```

**Задачи:**

- [ ] Выделить AuthContext для аутентификации
- [ ] Создать authService для бизнес-логики
- [ ] Разделить UserContext на более мелкие контексты
- [ ] Использовать React Query для кэширования
- [ ] Убрать бизнес-логику из контекстов

**Оценка:** 2-3 дня

---

#### 1.3 Создать API Layer

**Проблема:** Прямые вызовы `client.*` в компонентах, дублирование логики

**Решение:**

```typescript
// Создать абстракцию для R2R API:
src/services/api/
├── r2rClient.ts                # Обертка над r2r-js
├── documents/
│   ├── documentsService.ts     # CRUD для документов
│   └── documentsQueries.ts     # React Query queries
├── collections/
│   ├── collectionsService.ts
│   └── collectionsQueries.ts
├── search/
│   ├── searchService.ts
│   └── searchQueries.ts
├── chat/
│   ├── chatService.ts
│   └── chatQueries.ts
└── types/
    └── api.types.ts            # Типы для API
```

**Пример реализации:**

```typescript
// src/services/api/documents/documentsService.ts
import { r2rClient } from 'r2r-js';
import { DocumentResponse } from 'r2r-js/dist/types';

export interface ListDocumentsParams {
  offset?: number;
  limit?: number;
  collectionIds?: string[];
  filters?: Record<string, any>;
}

export class DocumentsService {
  constructor(private client: r2rClient) {}

  async list(params: ListDocumentsParams): Promise<{
    results: DocumentResponse[];
    totalEntries: number;
  }> {
    return this.client.documents.list(params);
  }

  async retrieve(id: string): Promise<DocumentResponse> {
    const response = await this.client.documents.retrieve({ id });
    return response.results;
  }

  async delete(id: string): Promise<void> {
    await this.client.documents.delete({ id });
  }

  // ... другие методы
}
```

**Задачи:**

- [ ] Создать структуру services/api
- [ ] Реализовать DocumentsService
- [ ] Реализовать CollectionsService
- [ ] Реализовать SearchService
- [ ] Реализовать ChatService
- [ ] Создать React Query hooks для каждого сервиса
- [ ] Заменить прямые вызовы client.\* на сервисы

**Оценка:** 4-5 дней

---

### Phase 2: Улучшение качества кода (2-3 недели)

#### 2.1 Устранить использование `any`

**Проблема:** 137+ использований `any`

**Решение:**

```typescript
// Создать строгие типы:
src/types/
├── api.types.ts                # Типы для API responses
├── components.types.ts          # Типы для компонентов
├── forms.types.ts              # Типы для форм
└── utils.types.ts              # Утилитарные типы

// Примеры:
// ❌ Было:
function handleError(error: any) { ... }

// ✅ Стало:
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

function handleError(error: ApiError | Error) { ... }
```

**Задачи:**

- [ ] Проанализировать все использования `any`
- [ ] Создать типы для каждого случая
- [ ] Заменить `any` на конкретные типы
- [ ] Включить `@typescript-eslint/no-explicit-any: "error"` в ESLint
- [ ] Исправить все ошибки типизации

**Оценка:** 3-4 дня

---

#### 2.2 Включить строгие ESLint правила

**Проблема:** Многие правила отключены

**Решение:**

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error", // Включить
    "@typescript-eslint/no-unused-vars": "error", // Включить
    "react-hooks/exhaustive-deps": "warn", // Включить
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Задачи:**

- [ ] Обновить .eslintrc.json
- [ ] Исправить все ошибки ESLint
- [ ] Настроить pre-commit hook для проверки
- [ ] Добавить в CI/CD проверку линтера

**Оценка:** 2-3 дня

---

#### 2.3 Заменить console.log на logger

**Проблема:** Много `console.log` вместо структурированного логирования

**Решение:**

```typescript
// Уже есть logger.ts, нужно использовать везде:

// ❌ Было:
console.log('User logged in', user);
console.error('Error:', error);

// ✅ Стало:
import logger from '@/lib/logger';

logger.info('User logged in', { userId: user.id, email: user.email });
logger.error('Login failed', error, { email, attemptCount: 3 });
```

**Задачи:**

- [ ] Найти все `console.log/error/warn`
- [ ] Заменить на `logger.info/error/warn`
- [ ] Добавить контекст к логам
- [ ] Настроить уровни логирования для production

**Оценка:** 1-2 дня

---

#### 2.4 Централизованная обработка ошибок

**Проблема:** Разрозненная обработка ошибок

**Решение:**

```typescript
// src/lib/errorHandler.ts
export class ErrorHandler {
  static handle(error: unknown, context?: Record<string, unknown>) {
    // Логирование
    // Отправка в Sentry
    // Показ пользователю
    // Retry logic
  }

  static handleApiError(error: ApiError) {
    // Специфичная обработка API ошибок
  }

  static handleNetworkError(error: Error) {
    // Обработка сетевых ошибок
  }
}

// src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  return useCallback((error: unknown, context?: Record<string, unknown>) => {
    ErrorHandler.handle(error, context);
  }, []);
}
```

**Задачи:**

- [ ] Создать ErrorHandler класс
- [ ] Создать useErrorHandler hook
- [ ] Заменить try-catch блоки на использование ErrorHandler
- [ ] Добавить retry logic для сетевых ошибок
- [ ] Улучшить пользовательские сообщения об ошибках

**Оценка:** 2-3 дня

---

### Phase 3: Оптимизация производительности (1-2 недели)

#### 3.1 Внедрить React Query

**Проблема:** Нет кэширования, дублирование запросов

**Решение:**

```typescript
// src/services/api/documents/documentsQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentsService } from './documentsService';

export const documentsKeys = {
  all: ['documents'] as const,
  lists: () => [...documentsKeys.all, 'list'] as const,
  list: (params: ListDocumentsParams) =>
    [...documentsKeys.lists(), params] as const,
  detail: (id: string) => [...documentsKeys.all, 'detail', id] as const,
};

export function useDocuments(params: ListDocumentsParams) {
  const service = useDocumentsService();

  return useQuery({
    queryKey: documentsKeys.list(params),
    queryFn: () => service.list(params),
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  });
}

export function useDocument(id: string) {
  const service = useDocumentsService();

  return useQuery({
    queryKey: documentsKeys.detail(id),
    queryFn: () => service.retrieve(id),
    enabled: !!id,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const service = useDocumentsService();

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}
```

**Задачи:**

- [ ] Установить @tanstack/react-query
- [ ] Создать query keys для каждого ресурса
- [ ] Создать hooks для всех API вызовов
- [ ] Заменить useState/useEffect на useQuery
- [ ] Настроить кэширование и invalidation
- [ ] Добавить optimistic updates где возможно

**Оценка:** 3-4 дня

---

#### 3.2 Оптимизация рендеринга

**Проблема:** Ненужные ре-рендеры, большие компоненты

**Решение:**

```typescript
// 1. Мемоизация компонентов
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// 2. Мемоизация вычислений
const filteredData = useMemo(() => {
  return data.filter(item => item.status === 'active');
}, [data]);

// 3. Мемоизация колбэков
const handleClick = useCallback((id: string) => {
  // ...
}, [dependencies]);

// 4. Виртуальная прокрутка для больших списков
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ItemComponent item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**Задачи:**

- [ ] Проанализировать компоненты на ненужные ре-рендеры
- [ ] Добавить React.memo где необходимо
- [ ] Использовать useMemo для тяжелых вычислений
- [ ] Использовать useCallback для колбэков
- [ ] Внедрить виртуальную прокрутку для больших списков
- [ ] Использовать React DevTools Profiler для анализа

**Оценка:** 2-3 дня

---

#### 3.3 Code Splitting

**Проблема:** Большой bundle size, медленная загрузка

**Решение:**

```typescript
// 1. Lazy loading страниц
import dynamic from 'next/dynamic';

const ExplorerPage = dynamic(() => import('@/pages/explorer'), {
  loading: () => <Skeleton />,
  ssr: false, // Если не нужен SSR
});

// 2. Lazy loading тяжелых компонентов
const KnowledgeGraph = dynamic(
  () => import('@/components/knowledgeGraphD3'),
  { loading: () => <GraphSkeleton /> }
);

// 3. Разделение по роутам
// next.config.js уже настроен, но можно улучшить
```

**Задачи:**

- [ ] Добавить dynamic imports для тяжелых страниц
- [ ] Разделить компоненты на chunks
- [ ] Настроить preloading для критических компонентов
- [ ] Оптимизировать bundle size
- [ ] Использовать webpack-bundle-analyzer для анализа

**Оценка:** 1-2 дня

---

### Phase 4: Тестирование (2-3 недели)

#### 4.1 Настроить тестовое окружение

**Решение:**

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Задачи:**

- [ ] Установить Jest, React Testing Library
- [ ] Настроить jest.config.js
- [ ] Настроить MSW для моков API
- [ ] Создать тестовые утилиты
- [ ] Настроить coverage reporting

**Оценка:** 1 день

---

#### 4.2 Unit тесты для утилит и сервисов

**Решение:**

```typescript
// src/services/api/documents/__tests__/documentsService.test.ts
import { DocumentsService } from '../documentsService';
import { r2rClient } from 'r2r-js';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockClient: jest.Mocked<r2rClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new DocumentsService(mockClient);
  });

  describe('list', () => {
    it('should return documents list', async () => {
      const params = { offset: 0, limit: 10 };
      const expected = { results: [], totalEntries: 0 };

      mockClient.documents.list.mockResolvedValue(expected);

      const result = await service.list(params);

      expect(result).toEqual(expected);
      expect(mockClient.documents.list).toHaveBeenCalledWith(params);
    });
  });
});
```

**Задачи:**

- [ ] Написать тесты для всех сервисов
- [ ] Написать тесты для утилит
- [ ] Написать тесты для хуков
- [ ] Достичь 80%+ coverage для сервисов

**Оценка:** 3-4 дня

---

#### 4.3 Component тесты

**Решение:**

```typescript
// src/components/DocumentsTable/__tests__/DocumentsTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentsTable } from '../DocumentsTable';

describe('DocumentsTable', () => {
  const mockDocuments = [
    { id: '1', title: 'Doc 1', status: 'success' },
    { id: '2', title: 'Doc 2', status: 'pending' },
  ];

  it('should render documents', () => {
    render(<DocumentsTable documents={mockDocuments} />);

    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(screen.getByText('Doc 2')).toBeInTheDocument();
  });

  it('should handle selection', () => {
    const onSelect = jest.fn();
    render(
      <DocumentsTable
        documents={mockDocuments}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByLabelText('Select Doc 1'));
    expect(onSelect).toHaveBeenCalledWith('1', true);
  });
});
```

**Задачи:**

- [ ] Написать тесты для критических компонентов
- [ ] Написать тесты для форм
- [ ] Написать тесты для таблиц
- [ ] Достичь 70%+ coverage для компонентов

**Оценка:** 4-5 дней

---

#### 4.4 Integration и E2E тесты

**Решение:**

```typescript
// e2e/explorer.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('should display documents in explorer', async ({ page }) => {
  await page.goto('/explorer');

  await expect(page.locator('text=Documents')).toBeVisible();
  await expect(page.locator('[data-testid="document-item"]')).toHaveCount(10);
});

test('should filter documents', async ({ page }) => {
  await page.goto('/explorer');

  await page.fill('[data-testid="search-input"]', 'test');
  await page.waitForSelector('[data-testid="document-item"]');

  const items = await page.locator('[data-testid="document-item"]').count();
  expect(items).toBeGreaterThan(0);
});
```

**Задачи:**

- [ ] Установить Playwright
- [ ] Написать E2E тесты для критических путей
- [ ] Настроить CI для запуска E2E тестов
- [ ] Добавить visual regression тесты

**Оценка:** 3-4 дня

---

### Phase 5: Документация и инструменты (1 неделя)

#### 5.1 Storybook для компонентов

**Решение:**

```typescript
// src/components/DocumentsTable/DocumentsTable.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { DocumentsTable } from './DocumentsTable';

const meta: Meta<typeof DocumentsTable> = {
  title: 'Components/DocumentsTable',
  component: DocumentsTable,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DocumentsTable>;

export const Default: Story = {
  args: {
    documents: [
      { id: '1', title: 'Document 1', status: 'success' },
      { id: '2', title: 'Document 2', status: 'pending' },
    ],
  },
};
```

**Задачи:**

- [ ] Установить и настроить Storybook
- [ ] Создать stories для всех UI компонентов
- [ ] Добавить документацию к компонентам
- [ ] Настроить деплой Storybook

**Оценка:** 2-3 дня

---

#### 5.2 JSDoc комментарии

**Решение:**

````typescript
/**
 * Service for managing documents in R2R system
 *
 * @class DocumentsService
 * @example
 * ```typescript
 * const service = new DocumentsService(client);
 * const documents = await service.list({ limit: 10 });
 * ```
 */
export class DocumentsService {
  /**
   * Retrieves a list of documents with pagination
   *
   * @param params - Query parameters for listing documents
   * @param params.offset - Number of documents to skip
   * @param params.limit - Maximum number of documents to return
   * @param params.collectionIds - Optional filter by collection IDs
   * @returns Promise resolving to documents list and total count
   * @throws {ApiError} If the request fails
   */
  async list(params: ListDocumentsParams): Promise<...> {
    // ...
  }
}
````

**Задачи:**

- [ ] Добавить JSDoc ко всем публичным методам
- [ ] Добавить JSDoc к компонентам
- [ ] Добавить примеры использования
- [ ] Настроить генерацию документации

**Оценка:** 2 дня

---

## 📋 Чеклист выполнения

### Неделя 1-2: Критический рефакторинг

- [ ] Разбить explorer.tsx на модули
- [ ] Рефакторинг UserContext
- [ ] Создать API Layer
- [ ] Начать замену прямых вызовов client.\*

### Неделя 3-4: Качество кода

- [ ] Устранить все `any`
- [ ] Включить строгие ESLint правила
- [ ] Заменить console.log на logger
- [ ] Централизованная обработка ошибок

### Неделя 5-6: Производительность

- [ ] Внедрить React Query
- [ ] Оптимизация рендеринга
- [ ] Code splitting

### Неделя 7-9: Тестирование

- [ ] Настроить тестовое окружение
- [ ] Unit тесты для сервисов
- [ ] Component тесты
- [ ] E2E тесты

### Неделя 10: Документация

- [ ] Storybook
- [ ] JSDoc комментарии

---

## 🛠️ Инструменты и зависимости

### Новые зависимости

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react-window": "^1.8.10"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "@storybook/react": "^7.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "webpack-bundle-analyzer": "^4.9.0"
  }
}
```

---

## 📈 Метрики успеха

### Качество кода

- [ ] 0 использований `any` (кроме необходимых случаев)
- [ ] 0 ESLint ошибок
- [ ] 80%+ test coverage
- [ ] Все компоненты < 300 строк

### Производительность

- [ ] Bundle size < 500KB (gzipped)
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90
- [ ] 0 ненужных ре-рендеров (по React DevTools)

### Архитектура

- [ ] Все API вызовы через сервисы
- [ ] Все данные через React Query
- [ ] Четкое разделение ответственности
- [ ] Переиспользуемые компоненты

---

## 🎯 Приоритеты

### 🔴 Критично (сделать первым)

1. Разбить монолитные компоненты
2. Создать API Layer
3. Внедрить React Query
4. Устранить `any`

### 🟡 Важно (следующий спринт)

5. Рефакторинг UserContext
6. Централизованная обработка ошибок
7. Оптимизация рендеринга
8. Unit тесты

### 🟢 Желательно (когда будет время)

9. E2E тесты
10. Storybook
11. JSDoc документация

---

## 💡 Best Practices

### Структура файлов

```
src/
├── components/          # UI компоненты
│   ├── ComponentName/
│   │   ├── index.tsx
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx
│   │   ├── ComponentName.stories.tsx
│   │   └── types.ts
├── services/           # Бизнес-логика
│   ├── api/
│   └── utils/
├── hooks/              # Кастомные хуки
├── context/            # React контексты
├── types/              # TypeScript типы
└── lib/                # Утилиты
```

### Naming conventions

- Компоненты: `PascalCase` (DocumentsTable.tsx)
- Хуки: `camelCase` с префиксом `use` (useDocuments.ts)
- Сервисы: `PascalCase` с суффиксом `Service` (DocumentsService.ts)
- Утилиты: `camelCase` (formatDate.ts)
- Типы: `PascalCase` с суффиксом `Type` или `Interface` (DocumentType.ts)

### Code organization

- Один компонент = один файл
- Максимум 300 строк на файл
- Явные импорты (не `import *`)
- Группировка импортов (external, internal, relative)

---

**Дата создания:** 2025-01-27  
**Версия:** 1.0  
**Для:** Разработчиков R2R-Application
