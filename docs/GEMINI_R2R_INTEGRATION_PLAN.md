# Глубокое исследование Gemini моделей и интеграция с R2R
## Deep Research: Gemini Models & R2R Optimization for Maximum Efficiency

> **Цель:** Максимизировать эффективность R2R-Application через оптимальную настройку и использование моделей Gemini

---

## 📚 Часть 1: Глубокое исследование моделей Gemini

### 1.1 Обзор моделей Gemini (2024-2025)

#### Gemini 2.5 Pro
**Характеристики:**
- **Input tokens:** 1,048,576 (1M+)
- **Output tokens:** 65,536
- **Multimodal:** ✅ (audio, images, video, text, PDFs)
- **Thinking Budget:** 0-24,576 tokens
- **Use cases:** Complex reasoning, code, mathematics, STEM
- **Pricing:** Premium (выше чем Flash)

**Ключевые возможности:**
- Structured outputs
- Caching
- Function calling
- Code execution
- Search grounding
- Extended thinking (thinking_budget)

#### Gemini 2.5 Flash
**Характеристики:**
- **Input tokens:** 1,048,576
- **Output tokens:** 65,536
- **Multimodal:** ✅
- **Thinking Budget:** 0-24,576 tokens
- **Use cases:** Speed-optimized, cost-effective, well-rounded
- **Pricing:** $0.10/1M input, $0.40/1M output

**Преимущества:**
- Быстрее чем Pro
- Дешевле чем Pro
- Хорошая производительность для большинства задач

#### Gemini 2.0 Flash Thinking Pro
**Характеристики:**
- **Benchmarks:**
  - General Knowledge (MMLU-Pro): 77.6%
  - Code Generation (LiveCodeBench v5): 34.5%
  - Reasoning (GPQA Diamond): 60.1%
  - Mathematics (MATH Dataset): 90.9%
  - Multimodal Reasoning (MMMU): 71.7%
- **Pricing:** $0.10/1M input, $0.40/1M output

#### Gemini 3 Pro (ноябрь 2025)
**Характеристики:**
- Новейшая модель
- Улучшенная multimodal understanding
- Используется в Google Antigravity IDE

### 1.2 Ключевые параметры конфигурации

#### Temperature
```typescript
// Рекомендации для разных задач:
interface TemperatureSettings {
  // Code Generation
  codeGeneration: {
    deterministic: 0.0-0.3,    // Высокая точность
    balanced: 0.3-0.5,         // Баланс точности и креативности
    creative: 0.5-0.7,         // Больше вариативности
  };
  
  // RAG Generation
  ragGeneration: {
    factual: 0.1-0.3,          // Фактические ответы
    balanced: 0.3-0.7,         // Баланс
    creative: 0.7-1.0,         // Креативные ответы
  };
  
  // Reasoning Tasks
  reasoning: {
    strict: 0.0-0.2,           // Строгое рассуждение
    balanced: 0.2-0.5,         // Баланс
  };
}
```

#### Thinking Budget
```typescript
// Стратегии thinking budget:
interface ThinkingBudgetStrategies {
  // Speed-optimized (для простых задач)
  fast: 0,                     // Отключено, максимальная скорость
  
  // Balanced (для большинства задач)
  balanced: -1,                // Dynamic - модель решает сама
  
  // Quality-optimized (для сложных задач)
  quality: 4096-8192,          // Средний budget
  
  // Maximum reasoning (для очень сложных задач)
  maximum: 16384-24576,        // Максимальный budget
}
```

#### Top-p и Top-k
```typescript
interface SamplingSettings {
  // Deterministic (для кода)
  deterministic: {
    top_p: 0.9-1.0,
    top_k: 20-40,
  };
  
  // Balanced
  balanced: {
    top_p: 0.95,
    top_k: 40,
  };
  
  // Creative
  creative: {
    top_p: 1.0,
    top_k: 100,
  };
}
```

### 1.3 Embeddings: text-embedding-004

**Характеристики:**
- **Dimensions:** 768 (default), configurable 128-3072
- **Tasks:** retrieval, similarity, classification, clustering
- **Languages:** 100+ languages
- **Performance:** State-of-the-art для RAG

**Преимущества для R2R:**
- Высокое качество embeddings
- Мультиязычность
- Гибкая размерность
- Оптимизирован для retrieval

---

## 🔧 Часть 2: Настройка R2R для Gemini

### 2.1 Конфигурация R2R для Gemini (r2r.toml)

```toml
# ============================================
# R2R Configuration для Gemini Models
# ============================================

[app]
default_max_documents_per_user = 200
default_max_chunks_per_user = 50_000
default_max_collections_per_user = 20

# ============================================
# Completion Provider (LLM для генерации)
# ============================================
[completion]
provider = "litellm"
concurrent_request_limit = 64

  [completion.generation_config]
  # Для RAG - используем Flash для скорости и стоимости
  model = "google/gemini-2.5-flash"
  temperature = 0.3              # Низкая для точных ответов
  top_p = 0.95
  top_k = 40
  max_tokens_to_sample = 8192    # Достаточно для длинных ответов
  stream = true                   # Streaming для лучшего UX
  
  # Thinking budget для сложных задач
  thinking_budget = -1            # Dynamic - модель решает сама
  # Для очень сложных задач можно установить:
  # thinking_budget = 4096

# ============================================
# Embedding Provider
# ============================================
[embedding]
provider = "litellm"
# Используем Gemini embeddings для лучшей совместимости
base_model = "google/text-embedding-004"
base_dimension = 768              # Оптимальный размер для Gemini
batch_size = 512                  # Большой batch для эффективности
concurrent_request_limit = 256
quantization_settings = { quantization_type = "FP32" }

# ============================================
# Agent Configuration
# ============================================
[agent]
rag_agent_static_prompt = "rag_agent"
tools = ["search_file_knowledge", "get_file_content", "web_search"]

  [agent.generation_config]
  # Для agent используем Pro для сложных рассуждений
  model = "google/gemini-2.5-pro"
  temperature = 0.2               # Низкая для точных действий
  thinking_budget = 4096           # Средний budget для reasoning
  max_tokens_to_sample = 16384
  stream = true

# ============================================
# Ingestion Configuration
# ============================================
[ingestion]
provider = "r2r"
chunking_strategy = "recursive"
chunk_size = 1024
chunk_overlap = 512
excluded_parsers = []
# Используем Flash для быстрой обработки
document_summary_model = "google/gemini-2.5-flash"

  [ingestion.chunk_enrichment_settings]
  enable_chunk_enrichment = true
  strategies = ["semantic", "neighborhood"]
  forward_chunks = 3
  backward_chunks = 3
  semantic_neighbors = 10
  semantic_similarity_threshold = 0.7
  # Flash для enrichment - быстро и эффективно
  generation_config = { 
    model = "google/gemini-2.5-flash",
    temperature = 0.2,
    thinking_budget = 1024
  }

# ============================================
# Knowledge Graph Configuration
# ============================================
[database]
provider = "postgres"
batch_size = 256

  [database.graph_creation_settings]
  graph_entity_description_prompt = "graph_entity_description"
  entity_types = []
  relation_types = []
  fragment_merge_count = 1
  max_knowledge_relationships = 100
  max_description_input_length = 65536
  # Flash для быстрого извлечения entities
  generation_config = { 
    model = "google/gemini-2.5-flash",
    temperature = 0.1,
    thinking_budget = 2048
  }

  [database.graph_enrichment_settings]
  max_summary_input_length = 65536
  # Flash для enrichment
  generation_config = { 
    model = "google/gemini-2.5-flash",
    temperature = 0.2,
    thinking_budget = 1024
  }

  [database.graph_search_settings]
  # Flash для graph search
  generation_config = { 
    model = "google/gemini-2.5-flash",
    temperature = 0.3,
    thinking_budget = -1
  }

# ============================================
# Route Limits (оптимизированы для Gemini)
# ============================================
[database.route_limits]
"/v3/retrieval/search" = { route_per_min = 120, monthly_limit = 10_000 }
"/v3/retrieval/rag" = { route_per_min = 60, monthly_limit = 5_000 }
"/v3/retrieval/agent" = { route_per_min = 30, monthly_limit = 2_000 }
```

### 2.2 Environment Variables

```bash
# .env или environment variables
# Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# LiteLLM Configuration (если используется)
LITELLM_API_KEY=your_litellm_key  # Опционально

# Для R2R
R2R_API_KEY=your_r2r_key
```

---

## 🚀 Часть 3: Интеграция Gemini в R2R-Application

### 3.1 Gemini Service Layer

```typescript
// src/services/gemini/geminiService.ts
import { r2rClient } from 'r2r-js';

export interface GeminiModelConfig {
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash';
  temperature?: number;
  thinkingBudget?: number | -1;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GeminiTaskProfile {
  // Профили для разных задач
  codeGeneration: GeminiModelConfig;
  ragGeneration: GeminiModelConfig;
  reasoning: GeminiModelConfig;
  fastResponse: GeminiModelConfig;
  qualityOptimized: GeminiModelConfig;
}

export class GeminiService {
  private client: r2rClient;
  
  // Профили для разных задач
  private readonly taskProfiles: GeminiTaskProfile = {
    // Генерация кода - низкая temperature, средний thinking budget
    codeGeneration: {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      thinkingBudget: 2048,
      topP: 0.95,
      topK: 40,
      maxTokens: 8192,
      stream: true,
    },
    
    // RAG генерация - сбалансированные настройки
    ragGeneration: {
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      thinkingBudget: -1,  // Dynamic
      topP: 0.95,
      topK: 40,
      maxTokens: 8192,
      stream: true,
    },
    
    // Сложные рассуждения - Pro модель, высокий thinking budget
    reasoning: {
      model: 'gemini-2.5-pro',
      temperature: 0.2,
      thinkingBudget: 8192,
      topP: 0.95,
      topK: 40,
      maxTokens: 16384,
      stream: true,
    },
    
    // Быстрые ответы - Flash, минимальный thinking
    fastResponse: {
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      thinkingBudget: 0,  // Отключено для скорости
      topP: 0.95,
      topK: 40,
      maxTokens: 2048,
      stream: true,
    },
    
    // Качество превыше всего - Pro, максимальный thinking
    qualityOptimized: {
      model: 'gemini-2.5-pro',
      temperature: 0.1,
      thinkingBudget: 16384,
      topP: 0.95,
      topK: 40,
      maxTokens: 32768,
      stream: true,
    },
  };

  constructor(client: r2rClient) {
    this.client = client;
  }

  // RAG с Gemini
  async ragWithGemini(
    query: string,
    profile: keyof GeminiTaskProfile = 'ragGeneration',
    options?: {
      searchSettings?: any;
      customConfig?: Partial<GeminiModelConfig>;
    }
  ) {
    const config = {
      ...this.taskProfiles[profile],
      ...options?.customConfig,
    };

    return this.client.retrieval.rag({
      query,
      rag_generation_config: {
        model: `google/${config.model}`,
        temperature: config.temperature,
        thinking_budget: config.thinkingBudget,
        top_p: config.topP,
        top_k: config.topK,
        max_tokens_to_sample: config.maxTokens,
        stream: config.stream,
      },
      search_settings: options?.searchSettings,
    });
  }

  // Agent с Gemini
  async agentWithGemini(
    message: { role: string; content: string },
    profile: keyof GeminiTaskProfile = 'reasoning',
    options?: {
      mode?: 'rag' | 'research';
      tools?: string[];
      customConfig?: Partial<GeminiModelConfig>;
    }
  ) {
    const config = {
      ...this.taskProfiles[profile],
      ...options?.customConfig,
    };

    return this.client.retrieval.agent({
      message,
      mode: options?.mode || 'rag',
      rag_tools: options?.tools,
      rag_generation_config: {
        model: `google/${config.model}`,
        temperature: config.temperature,
        thinking_budget: config.thinkingBudget,
        top_p: config.topP,
        top_k: config.topK,
        max_tokens_to_sample: config.maxTokens,
        stream: config.stream,
      },
    });
  }

  // Code generation с Gemini
  async generateCode(
    description: string,
    language: string,
    context?: string,
    options?: Partial<GeminiModelConfig>
  ) {
    const config = {
      ...this.taskProfiles.codeGeneration,
      ...options,
    };

    const prompt = `Generate ${language} code for: ${description}
${context ? `\nContext:\n\`\`\`\n${context}\n\`\`\`` : ''}`;

    return this.client.retrieval.rag({
      query: prompt,
      rag_generation_config: {
        model: `google/${config.model}`,
        temperature: config.temperature,
        thinking_budget: config.thinkingBudget,
        top_p: config.topP,
        top_k: config.topK,
        max_tokens_to_sample: config.maxTokens,
        stream: config.stream,
      },
      search_settings: {
        filters: {
          code_type: { $eq: 'source_code' },
          language: { $eq: language },
        },
        use_semantic_search: true,
        limit: 10,
      },
    });
  }

  // Embeddings с Gemini
  async generateEmbeddings(
    texts: string | string[],
    dimension: number = 768
  ) {
    return this.client.retrieval.embedding({
      text: texts,
      model: 'google/text-embedding-004',
      dimension,
    });
  }
}
```

### 3.2 Gemini Configuration UI

```typescript
// src/components/gemini/GeminiConfigPanel.tsx
interface GeminiConfigPanelProps {
  onConfigChange: (config: GeminiModelConfig) => void;
  defaultConfig?: GeminiModelConfig;
  taskType?: keyof GeminiTaskProfile;
}

export const GeminiConfigPanel: React.FC<GeminiConfigPanelProps> = ({
  onConfigChange,
  defaultConfig,
  taskType = 'ragGeneration',
}) => {
  const [config, setConfig] = useState<GeminiModelConfig>(
    defaultConfig || GEMINI_DEFAULT_CONFIGS[taskType]
  );

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <Select
        value={config.model}
        onValueChange={(value) =>
          setConfig({ ...config, model: value as any })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Quality)</SelectItem>
          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Speed)</SelectItem>
          <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Cost)</SelectItem>
        </SelectContent>
      </Select>

      {/* Temperature */}
      <div>
        <Label>Temperature: {config.temperature}</Label>
        <Slider
          value={[config.temperature || 0.3]}
          min={0}
          max={2}
          step={0.1}
          onValueChange={([value]) =>
            setConfig({ ...config, temperature: value })
          }
        />
        <div className="text-xs text-gray-400 mt-1">
          Lower = more deterministic, Higher = more creative
        </div>
      </div>

      {/* Thinking Budget */}
      <div>
        <Label>Thinking Budget</Label>
        <Select
          value={String(config.thinkingBudget)}
          onValueChange={(value) =>
            setConfig({
              ...config,
              thinkingBudget: value === '-1' ? -1 : Number(value),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 (Fast, No Thinking)</SelectItem>
            <SelectItem value="-1">-1 (Dynamic - Recommended)</SelectItem>
            <SelectItem value="1024">1024 (Light Reasoning)</SelectItem>
            <SelectItem value="2048">2048 (Moderate Reasoning)</SelectItem>
            <SelectItem value="4096">4096 (Deep Reasoning)</SelectItem>
            <SelectItem value="8192">8192 (Very Deep Reasoning)</SelectItem>
            <SelectItem value="16384">16384 (Maximum Reasoning)</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-gray-400 mt-1">
          More thinking = better quality but slower and more expensive
        </div>
      </div>

      {/* Top-p */}
      <div>
        <Label>Top-p: {config.topP}</Label>
        <Slider
          value={[config.topP || 0.95]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([value]) =>
            setConfig({ ...config, topP: value })
          }
        />
      </div>

      {/* Top-k */}
      <div>
        <Label>Top-k: {config.topK}</Label>
        <Slider
          value={[config.topK || 40]}
          min={1}
          max={100}
          step={1}
          onValueChange={([value]) =>
            setConfig({ ...config, topK: value })
          }
        />
      </div>

      {/* Max Tokens */}
      <div>
        <Label>Max Tokens: {config.maxTokens}</Label>
        <Input
          type="number"
          value={config.maxTokens}
          onChange={(e) =>
            setConfig({
              ...config,
              maxTokens: Number(e.target.value),
            })
          }
        />
      </div>

      {/* Presets */}
      <div>
        <Label>Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setConfig(GEMINI_PRESETS.fast)}
          >
            Fast Response
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfig(GEMINI_PRESETS.balanced)}
          >
            Balanced
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfig(GEMINI_PRESETS.quality)}
          >
            High Quality
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfig(GEMINI_PRESETS.codeGeneration)}
          >
            Code Generation
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📈 Часть 4: Оптимизация для программирования

### 4.1 Code-Specific Gemini Configuration

```typescript
// src/services/gemini/codeGeminiConfig.ts
export const CODE_GEMINI_CONFIGS = {
  // Генерация кода
  codeGeneration: {
    model: 'gemini-2.5-flash' as const,
    temperature: 0.2,              // Низкая для точности
    thinkingBudget: 2048,          // Средний для понимания задачи
    topP: 0.95,
    topK: 40,
    maxTokens: 8192,
    stream: true,
  },

  // Анализ кода
  codeAnalysis: {
    model: 'gemini-2.5-pro' as const,
    temperature: 0.1,              // Очень низкая для точного анализа
    thinkingBudget: 4096,           // Высокий для глубокого анализа
    topP: 0.9,
    topK: 20,
    maxTokens: 16384,
    stream: true,
  },

  // Рефакторинг
  codeRefactoring: {
    model: 'gemini-2.5-pro' as const,
    temperature: 0.2,
    thinkingBudget: 8192,           // Высокий для понимания структуры
    topP: 0.95,
    topK: 40,
    maxTokens: 16384,
    stream: true,
  },

  // Генерация тестов
  testGeneration: {
    model: 'gemini-2.5-flash' as const,
    temperature: 0.3,
    thinkingBudget: 1024,
    topP: 0.95,
    topK: 40,
    maxTokens: 4096,
    stream: true,
  },

  // Объяснение кода
  codeExplanation: {
    model: 'gemini-2.5-flash' as const,
    temperature: 0.4,              // Немного выше для естественности
    thinkingBudget: -1,              // Dynamic
    topP: 0.95,
    topK: 40,
    maxTokens: 4096,
    stream: true,
  },
};
```

### 4.2 Интеграция в Advanced Ingestion

```typescript
// Расширение AdvancedIngestionService для Gemini
export class GeminiAdvancedIngestion extends AdvancedIngestionService {
  // Загрузка кода с Gemini-оптимизированными настройками
  async ingestCodeWithGemini(
    file: File,
    language: string,
    options?: {
      extractStructure?: boolean;
      extractDependencies?: boolean;
      enrichChunks?: boolean;
    }
  ) {
    const geminiService = new GeminiService(this.client);

    // 1. Pre-processing с Gemini
    const preprocessed = await this.preprocessCodeWithGemini(
      file,
      language,
      geminiService
    );

    // 2. Извлечение структуры через Gemini
    if (options?.extractStructure) {
      const structure = await geminiService.agentWithGemini(
        {
          role: 'user',
          content: `Extract code structure from this ${language} file:\n\`\`\`${language}\n${preprocessed.text}\n\`\`\``,
        },
        'codeAnalysis'
      );
      preprocessed.metadata.structure = this.parseStructure(structure);
    }

    // 3. Chunking с учетом структуры кода
    const chunks = options?.extractStructure
      ? await this.chunkByStructure(preprocessed, language)
      : await this.chunkCode(preprocessed.code, language);

    // 4. Обогащение chunks через Gemini
    if (options?.enrichChunks) {
      const enrichedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const enrichment = await geminiService.ragWithGemini(
            `Enrich this code chunk with context:\n\`\`\`${language}\n${chunk.code}\n\`\`\``,
            'codeGeneration',
            {
              searchSettings: {
                filters: {
                  code_type: { $eq: 'source_code' },
                  language: { $eq: language },
                },
                use_semantic_search: true,
                limit: 5,
              },
            }
          );
          return {
            ...chunk,
            enriched_context: enrichment.results.generated_answer,
          };
        })
      );
      chunks.splice(0, chunks.length, ...enrichedChunks);
    }

    // 5. Загрузка с Gemini embeddings
    return this.client.chunks.create({
      chunks: chunks.map((chunk) => ({
        text: chunk.code,
        metadata: {
          ...chunk.metadata,
          code_type: 'source_code',
          language,
          embedding_model: 'google/text-embedding-004',
        },
      })),
    });
  }

  // Pre-processing с Gemini
  async preprocessCodeWithGemini(
    file: File,
    language: string,
    geminiService: GeminiService
  ) {
    const text = await file.text();

    // Используем Gemini для улучшения кода перед chunking
    const improved = await geminiService.ragWithGemini(
      `Normalize and improve this ${language} code for better chunking:\n\`\`\`${language}\n${text}\n\`\`\``,
      'codeGeneration',
      {
        customConfig: {
          temperature: 0.1,
          thinkingBudget: 1024,
        },
      }
    );

    return {
      file,
      text: improved.results.generated_answer || text,
      metadata: {
        language,
        original_length: text.length,
        processed_length: improved.results.generated_answer?.length || text.length,
      },
    };
  }
}
```

### 4.3 Code Search с Gemini Embeddings

```typescript
// src/services/search/geminiCodeSearch.ts
export class GeminiCodeSearchService {
  constructor(
    private client: r2rClient,
    private geminiService: GeminiService
  ) {}

  // Семантический поиск по коду с Gemini embeddings
  async semanticCodeSearch(
    query: string,
    options?: {
      language?: string;
      functionName?: string;
      similarityThreshold?: number;
    }
  ) {
    // Генерируем embedding запроса через Gemini
    const queryEmbedding = await this.geminiService.generateEmbeddings(query);

    // Поиск с использованием Gemini embeddings
    return this.client.retrieval.search({
      query: '',
      search_settings: {
        use_semantic_search: true,
        embedding: queryEmbedding.results.embeddings[0],
        filters: {
          code_type: { $eq: 'source_code' },
          ...(options?.language && { language: { $eq: options.language } }),
          ...(options?.functionName && {
            'metadata.function_name': { $eq: options.functionName },
          }),
        },
        limit: 20,
      },
    });
  }

  // Multi-query search с Gemini
  async multiQueryCodeSearch(
    query: string,
    numVariants: number = 3
  ) {
    // Генерируем варианты запроса через Gemini
    const variants = await this.geminiService.ragWithGemini(
      `Generate ${numVariants} different search query variants for this programming question: "${query}"`,
      'fastResponse',
      {
        customConfig: {
          temperature: 0.5,
          maxTokens: 500,
        },
      }
    );

    const queryVariants = this.parseQueryVariants(
      variants.results.generated_answer
    );

    // Ищем по каждому варианту
    const results = await Promise.all(
      queryVariants.map((variant) =>
        this.semanticCodeSearch(variant, { language: 'typescript' })
      )
    );

    // Объединяем и дедуплицируем
    return this.mergeAndDeduplicate(results);
  }
}
```

---

## 🎯 Часть 5: Адаптация R2R_MAXIMIZATION_PLAN.md под Gemini

### 5.1 Обновления для Phase 1: Advanced Ingestion

```typescript
// Обновленный AdvancedIngestionService с Gemini
export interface GeminiIngestionConfig extends IngestionConfig {
  // Gemini-specific settings
  gemini?: {
    // Модель для pre-processing
    preprocessingModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    
    // Модель для chunk enrichment
    enrichmentModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    
    // Thinking budget для enrichment
    enrichmentThinkingBudget?: number;
    
    // Использовать Gemini embeddings
    useGeminiEmbeddings?: boolean;
    embeddingDimension?: number;
  };
}

// Пример использования:
const config: GeminiIngestionConfig = {
  mode: 'custom',
  customConfig: {
    chunking_strategy: 'recursive',
    chunk_size: 1024,
    chunk_overlap: 512,
  },
  chunkEnrichment: {
    enabled: true,
    strategies: ['semantic', 'neighborhood'],
    forward_chunks: 3,
    backward_chunks: 3,
    semantic_neighbors: 10,
    semantic_similarity_threshold: 0.7,
    generation_config: {
      model: 'google/gemini-2.5-flash',
      temperature: 0.2,
    },
  },
  gemini: {
    preprocessingModel: 'gemini-2.5-flash',
    enrichmentModel: 'gemini-2.5-flash',
    enrichmentThinkingBudget: 1024,
    useGeminiEmbeddings: true,
    embeddingDimension: 768,
  },
};
```

### 5.2 Обновления для Phase 2: Advanced Search

```typescript
// Gemini-оптимизированный Advanced Search
export class GeminiAdvancedSearch extends AdvancedSearchService {
  // HyDE с Gemini
  async hydeSearchWithGemini(query: string, options?: SearchOptions) {
    // Используем Gemini для генерации hypothetical document
    const hypotheticalDoc = await this.geminiService.ragWithGemini(
      `Generate a hypothetical document that would answer: "${query}"`,
      'fastResponse',
      {
        customConfig: {
          temperature: 0.5,
          thinkingBudget: 512,
        },
      }
    );

    // Используем hypothetical document для поиска
    return this.client.retrieval.rag({
      query: hypotheticalDoc.results.generated_answer,
      search_settings: {
        search_strategy: 'hyde',
        limit: options?.limit || 10,
        filters: options?.filters,
      },
      rag_generation_config: {
        model: 'google/gemini-2.5-flash',
        temperature: 0.3,
      },
    });
  }
}
```

### 5.3 Обновления для Phase 3: Data Quality

```typescript
// Gemini-улучшенная валидация
export class GeminiDataQualityService extends DataQualityService {
  // Валидация с Gemini
  async validateWithGemini(data: any, schema: any) {
    const validation = await this.geminiService.ragWithGemini(
      `Validate this data against schema:\nData: ${JSON.stringify(data)}\nSchema: ${JSON.stringify(schema)}`,
      'reasoning',
      {
        customConfig: {
          temperature: 0.1,
          thinkingBudget: 2048,
        },
      }
    );

    return this.parseValidation(validation.results.generated_answer);
  }

  // Обогащение metadata с Gemini
  async enrichMetadataWithGemini(
    file: File,
    existingMetadata?: Record<string, any>
  ) {
    const text = await file.text();
    const preview = text.substring(0, 2000);

    const enrichment = await this.geminiService.ragWithGemini(
      `Extract comprehensive metadata from this document preview:\n${preview}`,
      'fastResponse',
      {
        customConfig: {
          temperature: 0.2,
          thinkingBudget: 512,
        },
      }
    );

    return {
      ...existingMetadata,
      ...this.parseMetadata(enrichment.results.generated_answer),
      enriched_by: 'gemini-2.5-flash',
      enriched_at: new Date().toISOString(),
    };
  }
}
```

---

## 📊 Часть 6: Best Practices для Gemini + R2R

### 6.1 Выбор модели по задаче

```typescript
export const GEMINI_MODEL_SELECTION_GUIDE = {
  // Когда использовать Flash:
  useFlash: [
    'RAG generation (большинство случаев)',
    'Fast responses',
    'Code generation (простые задачи)',
    'Chunk enrichment',
    'Metadata extraction',
    'Document summarization',
  ],

  // Когда использовать Pro:
  usePro: [
    'Complex reasoning tasks',
    'Code analysis и refactoring',
    'Deep research mode',
    'Multi-step problem solving',
    'Quality-critical tasks',
  ],

  // Thinking Budget рекомендации:
  thinkingBudget: {
    fast: 0,                    // Простые задачи
    balanced: -1,               // Большинство задач (dynamic)
    moderate: 2048,             // Средняя сложность
    deep: 4096-8192,            // Сложные задачи
    maximum: 16384-24576,       // Очень сложные задачи
  },
};
```

### 6.2 Оптимизация стоимости

```typescript
// Стратегии оптимизации стоимости
export const COST_OPTIMIZATION_STRATEGIES = {
  // Использовать Flash для большинства задач
  useFlashForMostTasks: true,

  // Минимизировать thinking budget где возможно
  minimizeThinkingBudget: {
    simpleTasks: 0,
    moderateTasks: -1,  // Dynamic
    complexTasks: 4096,
  },

  // Batch processing для embeddings
  batchEmbeddings: {
    batchSize: 512,
    useAsync: true,
  },

  // Кэширование результатов
  caching: {
    enableCaching: true,
    cacheTTL: 3600,  // 1 hour
  },

  // Оптимизация chunk size
  chunkOptimization: {
    optimalSize: 1024,
    overlap: 512,
    avoidTooSmall: true,
    avoidTooLarge: true,
  },
};
```

### 6.3 Оптимизация производительности

```typescript
// Стратегии производительности
export const PERFORMANCE_OPTIMIZATION = {
  // Streaming для лучшего UX
  alwaysUseStreaming: true,

  // Параллельные запросы
  parallelRequests: {
    maxConcurrent: 64,
    usePromiseAll: true,
  },

  // Оптимизация embeddings
  embeddingOptimization: {
    dimension: 768,  // Оптимальный для Gemini
    batchSize: 512,
    useAsync: true,
  },

  // Предзагрузка для частых запросов
  preloading: {
    enablePreload: true,
    preloadQueries: ['common', 'frequent'],
  },
};
```

---

## 🛠️ Часть 7: Реализация в R2R-Application

### 7.1 Обновление UserContext для Gemini

```typescript
// src/context/GeminiContext.tsx
export interface GeminiContextValue {
  // Текущая конфигурация
  currentConfig: GeminiModelConfig;
  
  // Профили задач
  taskProfiles: GeminiTaskProfile;
  
  // Методы
  setModel: (model: GeminiModelConfig['model']) => void;
  setTemperature: (temp: number) => void;
  setThinkingBudget: (budget: number | -1) => void;
  applyProfile: (profile: keyof GeminiTaskProfile) => void;
  
  // Сервис
  geminiService: GeminiService | null;
}

export const GeminiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getClient } = useUserContext();
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [currentConfig, setCurrentConfig] = useState<GeminiModelConfig>(
    DEFAULT_GEMINI_CONFIG
  );

  useEffect(() => {
    const initService = async () => {
      const client = await getClient();
      if (client) {
        setGeminiService(new GeminiService(client));
      }
    };
    initService();
  }, [getClient]);

  return (
    <GeminiContext.Provider
      value={{
        currentConfig,
        taskProfiles: GEMINI_TASK_PROFILES,
        setModel: (model) =>
          setCurrentConfig({ ...currentConfig, model }),
        setTemperature: (temp) =>
          setCurrentConfig({ ...currentConfig, temperature: temp }),
        setThinkingBudget: (budget) =>
          setCurrentConfig({ ...currentConfig, thinkingBudget: budget }),
        applyProfile: (profile) =>
          setCurrentConfig(GEMINI_TASK_PROFILES[profile]),
        geminiService,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};
```

### 7.2 Обновление Chat страницы для Gemini

```typescript
// src/pages/chat.tsx - добавление Gemini конфигурации
const ChatPage: React.FC = () => {
  const { geminiService, currentConfig, applyProfile } = useGeminiContext();
  const [geminiMode, setGeminiMode] = useState<'flash' | 'pro'>('flash');

  // Использование Gemini для RAG
  const handleGeminiRAG = async (query: string) => {
    if (!geminiService) return;

    const profile = geminiMode === 'flash' ? 'ragGeneration' : 'qualityOptimized';
    
    return geminiService.ragWithGemini(query, profile, {
      searchSettings: {
        use_semantic_search: true,
        use_hybrid_search: true,
        limit: 10,
      },
    });
  };

  // UI для выбора Gemini модели
  return (
    <Layout>
      {/* Gemini Model Selector */}
      <GeminiModelSelector
        currentModel={geminiMode}
        onModelChange={setGeminiMode}
        config={currentConfig}
        onConfigChange={applyProfile}
      />
      
      {/* Остальной UI */}
    </Layout>
  );
};
```

### 7.3 Обновление Upload для Gemini

```typescript
// src/components/ingestion/GeminiUploadDialog.tsx
export const GeminiUploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const { geminiService } = useGeminiContext();
  const [geminiConfig, setGeminiConfig] = useState<GeminiIngestionConfig>({
    mode: 'custom',
    gemini: {
      preprocessingModel: 'gemini-2.5-flash',
      enrichmentModel: 'gemini-2.5-flash',
      useGeminiEmbeddings: true,
    },
  });

  const handleUpload = async (files: File[]) => {
    const service = new GeminiAdvancedIngestion(client);
    
    for (const file of files) {
      const language = detectLanguage(file.name);
      
      if (language) {
        // Используем Gemini-оптимизированную загрузку
        await service.ingestCodeWithGemini(file, language, {
          extractStructure: true,
          enrichChunks: true,
        });
      } else {
        // Обычная загрузка с Gemini enrichment
        await service.ingestDocument(file, geminiConfig);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload with Gemini Optimization</DialogTitle>
        </DialogHeader>
        
        {/* Gemini Configuration */}
        <GeminiConfigPanel
          config={geminiConfig.gemini}
          onConfigChange={(gemini) =>
            setGeminiConfig({ ...geminiConfig, gemini })
          }
        />
        
        {/* Upload UI */}
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📋 Roadmap реализации

### Sprint 1 (1 неделя): Базовая интеграция Gemini
- [ ] Создать GeminiService
- [ ] Настроить r2r.toml для Gemini
- [ ] Добавить GeminiConfigPanel
- [ ] Интегрировать в Chat страницу

### Sprint 2 (1 неделя): Оптимизация Ingestion
- [ ] Gemini-оптимизированная загрузка
- [ ] Code-specific ingestion с Gemini
- [ ] Chunk enrichment с Gemini
- [ ] Gemini embeddings integration

### Sprint 3 (1 неделя): Advanced Search & RAG
- [ ] HyDE с Gemini
- [ ] Multi-query с Gemini
- [ ] Code search с Gemini embeddings
- [ ] Enhanced RAG с Gemini

### Sprint 4 (1 неделя): Data Quality
- [ ] Валидация с Gemini
- [ ] Metadata enrichment с Gemini
- [ ] Quality monitoring
- [ ] Auto-improvement

---

## 📊 Метрики успеха

### Производительность
- [ ] RAG latency < 2s (Flash)
- [ ] RAG latency < 5s (Pro для сложных задач)
- [ ] Embedding generation < 500ms
- [ ] Code search < 1s

### Качество
- [ ] Code generation accuracy > 85%
- [ ] RAG answer quality > 90%
- [ ] Embedding quality > 95% similarity

### Стоимость
- [ ] 80%+ запросов используют Flash
- [ ] Средняя стоимость на запрос < $0.01
- [ ] Оптимизация через thinking budget

---

## 🎯 Ключевые рекомендации

### Для программирования:
1. **Code Generation:** Gemini 2.5 Flash, temperature 0.2, thinking_budget 2048
2. **Code Analysis:** Gemini 2.5 Pro, temperature 0.1, thinking_budget 4096+
3. **Code Search:** Gemini embeddings (text-embedding-004), dimension 768
4. **RAG для кода:** Gemini 2.5 Flash, temperature 0.3, thinking_budget -1 (dynamic)

### Для общего использования:
1. **RAG:** Gemini 2.5 Flash, temperature 0.3, thinking_budget -1
2. **Fast Responses:** Gemini 2.5 Flash, thinking_budget 0
3. **Quality Critical:** Gemini 2.5 Pro, thinking_budget 8192+

---

**Дата создания:** 2025-01-27  
**Версия:** 1.0  
**Фокус:** Gemini Models + R2R Optimization
