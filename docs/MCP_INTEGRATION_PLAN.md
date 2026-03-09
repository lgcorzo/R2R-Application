# План интеграции MCP и улучшений R2R-Application для программирования

## Maximizing R2R API & MCP Protocol for Developer Productivity

> **Цель:** Создать мощный dashboard для программирования с полной интеграцией MCP сервера и максимальным использованием возможностей R2R API

---

## 📊 Текущее состояние

### Анализ кодовой базы

- **Страниц:** 13 файлов в `/src/pages`
- **Размер страниц:** от 580 байт до 18,524 байт
- **MCP интеграция:** ❌ Отсутствует
- **Специализация для программирования:** ❌ Нет
- **Использование R2R Research Mode:** ❌ Нет
- **Использование Python Executor:** ❌ Нет
- **Codebase Search:** ❌ Нет

### Доступные возможности R2R API (не используются)

- ✅ Agentic RAG с research mode
- ✅ Python executor tool
- ✅ Reasoning и critique tools
- ✅ Embeddings API
- ✅ Knowledge Graph для кода
- ✅ HyDE search strategy
- ✅ Web search
- ✅ Streaming с events (ThinkingEvent, ToolCallEvent, etc.)

---

## 🎯 Стратегические цели

1. **Интеграция MCP сервера** - Сделать R2R доступным через MCP протокол
2. **Code-First Dashboard** - Специализированный интерфейс для программирования
3. **Максимальное использование R2R API** - Все возможности для улучшения качества данных
4. **Улучшение качества данных** - Входящие и исходящие данные через R2R

---

## 🚀 Phase 1: Интеграция MCP сервера (2-3 недели)

### 1.1 Архитектура интеграции MCP

**Цель:** Создать двустороннюю интеграцию между R2R-Application и MCP сервером

```typescript
// Архитектура:
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  R2R-Application │ ◄─────► │  MCP Server  │ ◄─────► │  R2R API    │
│   (Dashboard)    │  HTTP   │  (Bridge)    │  HTTP   │  (Backend)  │
└─────────────────┘         └──────────────┘         └─────────────┘
       │                            │                        │
       │                            │                        │
       └────────────────────────────┴────────────────────────┘
                    WebSocket для real-time updates
```

**Реализация:**

```typescript
// src/services/mcp/mcpClient.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  async connect(serverPath: string, args?: string[]) {
    this.transport = new StdioClientTransport({
      command: serverPath,
      args: args || [],
    });

    this.client = new Client(
      {
        name: 'r2r-dashboard',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    await this.client.connect(this.transport);
  }

  async listTools() {
    return this.client.listTools();
  }

  async callTool(name: string, args: Record<string, unknown>) {
    return this.client.callTool({ name, arguments: args });
  }

  async listResources() {
    return this.client.listResources();
  }

  async readResource(uri: string) {
    return this.client.readResource({ uri });
  }
}
```

**Задачи:**

- [ ] Установить `@modelcontextprotocol/sdk`
- [ ] Создать MCPClient wrapper
- [ ] Настроить подключение к MCP серверу R2R
- [ ] Реализовать список доступных tools
- [ ] Реализовать вызов tools через MCP
- [ ] Добавить WebSocket для real-time обновлений
- [ ] Создать UI для управления MCP соединением

**Оценка:** 3-4 дня

---

### 1.2 MCP Tools Integration

**Цель:** Предоставить все R2R возможности через MCP tools

**Доступные MCP Tools (из r2r-rag-search-agent):**

- `search_documents` - Поиск в документах
- `get_document` - Получить документ
- `rag_query` - RAG запрос
- `upload_document` - Загрузить документ
- `list_collections` - Список коллекций
- `create_collection` - Создать коллекцию
- И другие...

**Реализация:**

```typescript
// src/services/mcp/r2rMcpTools.ts
export const R2R_MCP_TOOLS = {
  // Document operations
  searchDocuments: async (query: string, filters?: Record<string, any>) => {
    // Вызов через MCP
  },

  // RAG operations
  ragQuery: async (query: string, config?: RAGConfig) => {
    // Вызов через MCP с полной конфигурацией
  },

  // Agent operations
  agentQuery: async (
    message: string,
    mode: 'rag' | 'research',
    tools?: string[]
  ) => {
    // Вызов agent через MCP
  },

  // Code-specific operations
  codebaseSearch: async (query: string, codebasePath?: string) => {
    // Поиск в кодовой базе через R2R
  },

  generateEmbeddings: async (text: string | string[]) => {
    // Генерация embeddings
  },

  // Knowledge Graph operations
  extractEntities: async (text: string) => {
    // Извлечение entities из кода
  },
};
```

**Задачи:**

- [ ] Создать типизированные обертки для всех MCP tools
- [ ] Реализовать error handling для MCP calls
- [ ] Добавить retry logic
- [ ] Создать UI компоненты для каждого tool
- [ ] Добавить валидацию параметров

**Оценка:** 4-5 дней

---

### 1.3 MCP Resources Integration

**Цель:** Использовать MCP resources для доступа к R2R данным

```typescript
// src/services/mcp/r2rMcpResources.ts
export const R2R_MCP_RESOURCES = {
  // Document resources
  'r2r://documents/{id}': async (id: string) => {
    // Получить документ через MCP
  },

  // Collection resources
  'r2r://collections/{id}': async (id: string) => {
    // Получить коллекцию
  },

  // Embedding resources
  'r2r://embeddings/{id}': async (id: string) => {
    // Получить embeddings
  },

  // Knowledge Graph resources
  'r2r://kg/entities/{id}': async (id: string) => {
    // Получить entity из KG
  },
};
```

**Задачи:**

- [ ] Определить схему ресурсов R2R
- [ ] Реализовать чтение ресурсов через MCP
- [ ] Добавить кэширование ресурсов
- [ ] Создать UI для просмотра ресурсов

**Оценка:** 2-3 дня

---

## 💻 Phase 2: Code-First Dashboard (3-4 недели)

### 2.1 Codebase Search & Analysis

**Цель:** Специализированный поиск по кодовой базе с использованием R2R

**Новая страница:** `/codebase`

```typescript
// src/pages/codebase.tsx
interface CodebaseSearchPage {
  // Поиск по коду
  - Semantic search по функциям, классам, методам
  - Поиск по паттернам кода
  - Поиск по зависимостям
  - Поиск по тестам

  // Анализ кода
  - Извлечение entities из кода (функции, классы, переменные)
  - Построение Knowledge Graph кодовой базы
  - Анализ зависимостей
  - Поиск дубликатов кода

  // Code understanding
  - Объяснение сложных участков кода
  - Генерация документации
  - Поиск примеров использования
}
```

**Реализация:**

```typescript
// src/services/codebase/codebaseService.ts
export class CodebaseService {
  // Загрузка кодовой базы в R2R
  async indexCodebase(
    path: string,
    options?: {
      filePatterns?: string[];
      excludePatterns?: string[];
      chunkSize?: number;
    }
  ) {
    // Рекурсивно обходит директорию
    // Загружает файлы в R2R как документы
    // Создает коллекцию "codebase"
  }

  // Семантический поиск по коду
  async searchCode(
    query: string,
    filters?: {
      fileType?: string[];
      language?: string[];
      functionName?: string;
    }
  ) {
    return this.client.retrieval.search({
      query,
      search_settings: {
        filters: {
          collection_ids: ['codebase'],
          ...filters,
        },
        use_semantic_search: true,
        use_hybrid_search: true,
      },
    });
  }

  // Поиск функций/классов
  async findFunction(functionName: string) {
    return this.searchCode(`function ${functionName}`, {
      fileType: ['ts', 'tsx', 'js', 'jsx'],
    });
  }

  // Построение Knowledge Graph из кода
  async buildCodeGraph() {
    // Использует R2R KG extraction для кода
    // Извлекает:
    // - Entities: функции, классы, интерфейсы
    // - Relationships: вызовы, наследование, импорты
  }
}
```

**UI Компоненты:**

```typescript
// src/components/codebase/
├── CodebaseSearch.tsx          # Поиск по коду
├── CodeGraph.tsx                # Визуализация графа кода
├── FunctionFinder.tsx           # Поиск функций
├── DependencyGraph.tsx           # Граф зависимостей
├── CodeExplainer.tsx            # Объяснение кода через RAG
└── CodeDocumentation.tsx        # Генерация документации
```

**Задачи:**

- [ ] Создать страницу `/codebase`
- [ ] Реализовать CodebaseService
- [ ] Создать UI компоненты для поиска
- [ ] Интегрировать с R2R для индексации кода
- [ ] Реализовать Knowledge Graph для кода
- [ ] Добавить визуализацию зависимостей

**Оценка:** 5-7 дней

---

### 2.2 Programming Assistant с Research Mode

**Цель:** Полноценный AI ассистент для программирования с использованием R2R Research Mode

**Улучшение страницы:** `/chat` → `/programming-assistant`

```typescript
// Новые возможности:
interface ProgrammingAssistant {
  // Research Mode
  - Использование research_tools: ['rag', 'reasoning', 'critique', 'python_executor']
  - Extended thinking для сложных задач
  - Python executor для вычислений

  // Code Generation
  - Генерация кода на основе документации
  - Рефакторинг кода
  - Генерация тестов

  // Code Analysis
  - Анализ сложности кода
  - Поиск багов
  - Оптимизация производительности

  // Documentation
  - Генерация документации из кода
  - Объяснение алгоритмов
  - Создание примеров использования
}
```

**Реализация:**

```typescript
// src/services/programming/programmingAssistant.ts
export class ProgrammingAssistant {
  // Research mode для сложных задач
  async researchCodeTask(task: string, codebaseContext?: string) {
    return this.client.retrieval.agent({
      message: {
        role: 'user',
        content: task,
      },
      research_generation_config: {
        model: 'anthropic/claude-3-opus-20240229',
        extended_thinking: true,
        thinking_budget: 8192,
        temperature: 0.2,
        max_tokens_to_sample: 32000,
        stream: true,
      },
      research_tools: [
        'rag', // Поиск в документации
        'reasoning', // Логическое рассуждение
        'critique', // Критический анализ
        'python_executor', // Выполнение кода
      ],
      mode: 'research',
    });
  }

  // Генерация кода
  async generateCode(description: string, language: string, context?: string) {
    const prompt = `Generate ${language} code for: ${description}
${context ? `\nContext:\n${context}` : ''}`;

    return this.client.retrieval.rag({
      query: prompt,
      rag_generation_config: {
        model: 'anthropic/claude-3-7-sonnet-20250219',
        temperature: 0.3,
      },
      search_settings: {
        filters: {
          collection_ids: ['codebase', 'documentation'],
        },
        use_semantic_search: true,
        limit: 10,
      },
    });
  }

  // Анализ кода
  async analyzeCode(
    code: string,
    analysisType: 'complexity' | 'bugs' | 'performance'
  ) {
    const prompts = {
      complexity: 'Analyze the complexity of this code',
      bugs: 'Find potential bugs in this code',
      performance: 'Suggest performance optimizations for this code',
    };

    return this.researchCodeTask(
      `${prompts[analysisType]}:\n\`\`\`\n${code}\n\`\`\``
    );
  }
}
```

**UI Улучшения:**

```typescript
// src/components/programming/
├── ResearchModeChat.tsx         # Chat с research mode
├── CodeGenerator.tsx             # Генератор кода
├── CodeAnalyzer.tsx              # Анализатор кода
├── StreamingEvents.tsx           # Отображение streaming events
│   - ThinkingEvent
│   - ToolCallEvent
│   - ToolResultEvent
│   - PythonExecutorEvent
└── CodeEditor.tsx                # Редактор с AI помощником
```

**Задачи:**

- [ ] Создать ProgrammingAssistant service
- [ ] Реализовать research mode integration
- [ ] Добавить Python executor UI
- [ ] Создать компоненты для streaming events
- [ ] Реализовать code generation UI
- [ ] Добавить code analysis features

**Оценка:** 6-8 дней

---

### 2.3 Embeddings для кода

**Цель:** Использовать embeddings для семантического поиска по коду

```typescript
// src/services/embeddings/codeEmbeddings.ts
export class CodeEmbeddings {
  // Генерация embeddings для кода
  async embedCode(
    code: string,
    metadata?: {
      filePath?: string;
      functionName?: string;
      language?: string;
    }
  ) {
    return this.client.retrieval.embedding({
      text: code,
      model: 'text-embedding-ada-002', // или специализированная модель для кода
    });
  }

  // Поиск похожего кода
  async findSimilarCode(code: string, threshold = 0.8) {
    const embedding = await this.embedCode(code);

    return this.client.retrieval.search({
      query: '', // Используем embedding напрямую
      search_settings: {
        use_semantic_search: true,
        embedding: embedding.results.embeddings[0],
        filters: {
          collection_ids: ['codebase'],
        },
      },
    });
  }

  // Кластеризация кода
  async clusterCode(files: string[]) {
    const embeddings = await Promise.all(
      files.map((file) => this.embedCode(file))
    );

    // Используем t-SNE или PCA для визуализации
    // Показываем кластеры похожего кода
  }
}
```

**UI:**

```typescript
// src/components/embeddings/
├── EmbeddingVisualizer.tsx       # Визуализация embeddings (t-SNE)
├── SimilarCodeFinder.tsx         # Поиск похожего кода
└── CodeClusters.tsx              # Кластеризация кода
```

**Задачи:**

- [ ] Реализовать CodeEmbeddings service
- [ ] Создать UI для визуализации embeddings
- [ ] Добавить поиск похожего кода
- [ ] Реализовать кластеризацию

**Оценка:** 3-4 дня

---

## 🔍 Phase 3: Максимальное использование R2R API (2-3 недели)

### 3.1 Advanced Search Strategies

**Цель:** Использовать все search strategies R2R

```typescript
// src/services/search/advancedSearch.ts
export class AdvancedSearch {
  // HyDE (Hypothetical Document Embeddings)
  async hydeSearch(query: string) {
    return this.client.retrieval.rag({
      query,
      search_settings: {
        search_strategy: 'hyde',
        limit: 10,
      },
    });
  }

  // Multi-query search
  async multiQuerySearch(query: string) {
    // Генерируем несколько вариантов запроса
    // Ищем по каждому
    // Объединяем результаты
  }

  // Contextual compression
  async contextualSearch(query: string, context: string) {
    // Используем context для улучшения поиска
  }

  // Re-ranking
  async rerankedSearch(query: string, initialResults: any[]) {
    // Используем R2R для re-ranking результатов
  }
}
```

**Задачи:**

- [ ] Реализовать HyDE search
- [ ] Добавить multi-query search
- [ ] Реализовать contextual compression
- [ ] Добавить re-ranking

**Оценка:** 3-4 дня

---

### 3.2 Knowledge Graph для программирования

**Цель:** Использовать KG для понимания структуры кода

```typescript
// src/services/knowledgeGraph/codeKG.ts
export class CodeKnowledgeGraph {
  // Извлечение entities из кода
  async extractCodeEntities(code: string) {
    // Функции, классы, переменные, импорты
    return this.client.collections.extractKG({
      collection_id: 'codebase',
      document_id: 'current',
    });
  }

  // Построение графа зависимостей
  async buildDependencyGraph() {
    // Использует KG для построения графа
    // Показывает:
    // - Импорты между файлами
    // - Вызовы функций
    // - Наследование классов
  }

  // Поиск по графу
  async graphSearch(query: string, traversalDepth = 2) {
    return this.client.retrieval.search({
      query,
      search_settings: {
        graph_settings: {
          enabled: true,
          traversal_depth: traversalDepth,
        },
      },
    });
  }
}
```

**UI:**

```typescript
// src/components/knowledgeGraph/
├── CodeDependencyGraph.tsx       # Граф зависимостей кода
├── EntityExtractor.tsx            # Извлечение entities
└── GraphTraversal.tsx             # Навигация по графу
```

**Задачи:**

- [ ] Реализовать CodeKnowledgeGraph service
- [ ] Создать UI для графа зависимостей
- [ ] Добавить graph search
- [ ] Реализовать визуализацию

**Оценка:** 4-5 дней

---

### 3.3 Web Search Integration

**Цель:** Использовать web search для актуальной информации

```typescript
// src/services/web/webSearch.ts
export class WebSearch {
  async searchWeb(query: string) {
    return this.client.retrieval.agent({
      message: { role: 'user', content: query },
      rag_tools: ['web_search', 'web_scrape'],
      mode: 'rag',
    });
  }

  // Поиск документации
  async searchDocumentation(library: string, query: string) {
    return this.searchWeb(`${library} documentation ${query}`);
  }

  // Поиск примеров кода
  async searchCodeExamples(language: string, task: string) {
    return this.searchWeb(`${language} ${task} example code`);
  }
}
```

**Задачи:**

- [ ] Реализовать WebSearch service
- [ ] Добавить UI для web search results
- [ ] Интегрировать в programming assistant

**Оценка:** 2-3 дня

---

## 📈 Phase 4: Улучшение качества данных (2-3 недели)

### 4.1 Data Quality Pipeline

**Цель:** Улучшить качество входящих и исходящих данных

```typescript
// src/services/quality/dataQuality.ts
export class DataQualityService {
  // Валидация входящих данных
  async validateInput(data: any, schema: any) {
    // Использует R2R для валидации
    // Проверяет структуру, типы, обязательные поля
  }

  // Очистка данных
  async cleanData(data: string) {
    // Удаляет дубликаты
    // Нормализует формат
    // Исправляет ошибки
  }

  // Обогащение данных
  async enrichData(data: any) {
    // Добавляет metadata
    // Извлекает entities
    // Создает embeddings
  }

  // Проверка качества ответов
  async validateResponse(response: string, query: string) {
    // Использует R2R для проверки:
    // - Релевантность
    // - Точность
    // - Полнота
  }
}
```

**Задачи:**

- [ ] Реализовать DataQualityService
- [ ] Добавить валидацию входящих данных
- [ ] Реализовать очистку данных
- [ ] Добавить обогащение данных
- [ ] Создать проверку качества ответов

**Оценка:** 4-5 дней

---

### 4.2 Feedback Loop для улучшения качества

**Цель:** Собирать feedback и улучшать качество

```typescript
// src/services/feedback/feedbackService.ts
export class FeedbackService {
  // Сбор feedback от пользователей
  async collectFeedback(
    query: string,
    response: string,
    rating: number,
    comments?: string
  ) {
    // Сохраняет feedback
    // Использует для улучшения поиска
  }

  // Анализ качества
  async analyzeQuality(conversationId: string) {
    // Анализирует качество ответов
    // Предлагает улучшения
  }

  // Автоматическое улучшение
  async improveSearch(query: string, feedback: any) {
    // Использует feedback для улучшения поиска
    // Настраивает параметры R2R
  }
}
```

**UI:**

```typescript
// src/components/feedback/
├── FeedbackCollector.tsx         # Сбор feedback
├── QualityMetrics.tsx            # Метрики качества
└── ImprovementSuggestions.tsx    # Предложения по улучшению
```

**Задачи:**

- [ ] Реализовать FeedbackService
- [ ] Создать UI для сбора feedback
- [ ] Добавить анализ качества
- [ ] Реализовать автоматическое улучшение

**Оценка:** 3-4 дня

---

## 🎨 Phase 5: UI/UX для программирования (2-3 недели)

### 5.1 Code-First Interface

**Новые компоненты:**

```typescript
// src/components/programming/
├── CodeEditor/
│   ├── MonacoEditor.tsx          # Monaco editor с AI
│   ├── InlineSuggestions.tsx     # AI подсказки в коде
│   └── CodeActions.tsx            # Действия с кодом
├── CodeViewer/
│   ├── SyntaxHighlighted.tsx     # Подсветка синтаксиса
│   ├── DiffViewer.tsx             # Просмотр изменений
│   └── CodeExplainer.tsx          # Объяснение кода
└── CodeSearch/
    ├── SemanticSearch.tsx         # Семантический поиск
    ├── PatternSearch.tsx          # Поиск паттернов
    └── DependencySearch.tsx       # Поиск зависимостей
```

**Задачи:**

- [ ] Интегрировать Monaco Editor
- [ ] Добавить AI подсказки
- [ ] Создать code viewer компоненты
- [ ] Реализовать code search UI

**Оценка:** 5-6 дней

---

### 5.2 Real-time Collaboration

**Цель:** Совместная работа с кодом через R2R

```typescript
// src/services/collaboration/collaborationService.ts
export class CollaborationService {
  // Совместное редактирование
  async shareCodeSession(codeId: string, users: string[]) {
    // Создает сессию для совместной работы
  }

  // Синхронизация через R2R
  async syncChanges(codeId: string, changes: any) {
    // Синхронизирует изменения через R2R
  }
}
```

**Задачи:**

- [ ] Реализовать CollaborationService
- [ ] Добавить real-time синхронизацию
- [ ] Создать UI для совместной работы

**Оценка:** 4-5 дней

---

## 📋 Roadmap выполнения

### Sprint 1-2 (2 недели): MCP Integration

- [ ] MCP Client setup
- [ ] MCP Tools integration
- [ ] MCP Resources integration
- [ ] UI для MCP управления

### Sprint 3-4 (2 недели): Codebase Features

- [ ] Codebase search
- [ ] Code indexing
- [ ] Knowledge Graph для кода
- [ ] Embeddings для кода

### Sprint 5-6 (2 недели): Programming Assistant

- [ ] Research mode integration
- [ ] Python executor
- [ ] Code generation
- [ ] Code analysis

### Sprint 7-8 (2 недели): Advanced Features

- [ ] Advanced search strategies
- [ ] Web search integration
- [ ] Data quality pipeline
- [ ] Feedback loop

### Sprint 9-10 (2 недели): UI/UX

- [ ] Code editor integration
- [ ] Real-time collaboration
- [ ] Improved visualizations
- [ ] Performance optimization

---

## 🛠️ Технические детали

### Новые зависимости

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@monaco-editor/react": "^4.6.0",
    "react-syntax-highlighter": "^15.5.0",
    "react-diff-viewer": "^3.1.1",
    "d3": "^7.9.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Структура новых сервисов

```
src/
├── services/
│   ├── mcp/
│   │   ├── mcpClient.ts
│   │   ├── r2rMcpTools.ts
│   │   └── r2rMcpResources.ts
│   ├── codebase/
│   │   ├── codebaseService.ts
│   │   └── codeIndexer.ts
│   ├── programming/
│   │   ├── programmingAssistant.ts
│   │   └── codeGenerator.ts
│   ├── embeddings/
│   │   └── codeEmbeddings.ts
│   ├── knowledgeGraph/
│   │   └── codeKG.ts
│   ├── search/
│   │   └── advancedSearch.ts
│   ├── web/
│   │   └── webSearch.ts
│   ├── quality/
│   │   └── dataQuality.ts
│   └── feedback/
│       └── feedbackService.ts
├── components/
│   ├── mcp/
│   │   ├── MCPConnection.tsx
│   │   └── MCPToolsPanel.tsx
│   ├── codebase/
│   │   ├── CodebaseSearch.tsx
│   │   └── CodeGraph.tsx
│   ├── programming/
│   │   ├── ResearchModeChat.tsx
│   │   └── CodeGenerator.tsx
│   └── embeddings/
│       └── EmbeddingVisualizer.tsx
└── pages/
    ├── codebase.tsx
    ├── programming-assistant.tsx
    └── mcp-dashboard.tsx
```

---

## 📊 Метрики успеха

### Функциональность

- [ ] 100% MCP tools доступны через UI
- [ ] Codebase полностью индексирован в R2R
- [ ] Research mode работает для всех задач
- [ ] Knowledge Graph построен для кода

### Качество данных

- [ ] Валидация всех входящих данных
- [ ] Обогащение данных автоматически
- [ ] Feedback loop работает
- [ ] Качество ответов улучшилось на 30%+

### Производительность

- [ ] Codebase search < 500ms
- [ ] Code generation < 5s
- [ ] Embeddings generation < 1s
- [ ] Real-time updates < 100ms latency

---

## 🎯 Приоритеты

### 🔴 Критично (Sprint 1-2)

1. MCP Integration
2. Codebase Search
3. Research Mode

### 🟡 Важно (Sprint 3-4)

4. Code Generation
5. Knowledge Graph
6. Embeddings

### 🟢 Желательно (Sprint 5+)

7. Web Search
8. Data Quality
9. Collaboration

---

**Дата создания:** 2025-01-27  
**Версия:** 1.0  
**Фокус:** MCP Integration + Programming Features
