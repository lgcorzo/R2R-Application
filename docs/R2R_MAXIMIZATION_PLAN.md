# План максимизации потенциала R2R-Application
## Maximizing R2R API Usage & Data Quality for Programming

> **Цель:** Реализовать максимальный потенциал R2R API, улучшить качество данных и эффективность использования для программирования

> **⚠️ ВАЖНО:** Для максимальной эффективности рекомендуется использовать модели Gemini. См. [GEMINI_R2R_INTEGRATION_PLAN.md](./GEMINI_R2R_INTEGRATION_PLAN.md) для детальной настройки.

---

## 📊 Анализ текущего состояния

### Текущая реализация (из анализа кода)

**Документы:**
- ✅ Базовая загрузка файлов (`client.documents.create({ file })`)
- ✅ Простой ingestion mode (hi-res, fast)
- ❌ Нет custom ingestion config
- ❌ Нет chunk enrichment
- ❌ Нет pre-processing chunks
- ❌ Нет управления chunks после загрузки

**Поиск:**
- ✅ Базовый semantic search
- ✅ Hybrid search (частично)
- ❌ Нет HyDE strategy
- ❌ Нет multi-query
- ❌ Нет contextual compression

**Качество данных:**
- ❌ Нет валидации перед загрузкой
- ❌ Нет обогащения metadata
- ❌ Нет проверки качества chunks
- ❌ Нет feedback loop

---

## 🎯 Стратегические цели

1. **Максимизация R2R API** - Использовать все возможности API
2. **Улучшение качества входящих данных** - Pre-processing, validation, enrichment
3. **Улучшение качества исходящих данных** - Better search, better generation
4. **Специализация для программирования** - Code-specific features

---

## 🚀 Phase 1: Улучшение качества входящих данных (3-4 недели)

### 1.1 Advanced Document Ingestion

**Проблема:** Текущая загрузка использует только базовые режимы

**Решение:** Полная поддержка всех ingestion modes и настроек

```typescript
// src/services/ingestion/advancedIngestion.ts
export interface IngestionConfig {
  // Basic modes
  mode: 'hi-res' | 'fast' | 'custom';
  
  // Custom configuration
  customConfig?: {
    provider?: 'r2r' | 'unstructured_local' | 'unstructured_cloud';
    strategy?: 'auto' | 'by_title' | 'by_page' | 'recursive';
    chunking_strategy?: 'recursive' | 'by_title' | 'by_page';
    chunk_size?: number;
    chunk_overlap?: number;
    new_after_n_chars?: number;
    max_characters?: number;
    combine_under_n_chars?: number;
  };
  
  // Chunk enrichment
  chunkEnrichment?: {
    enabled: boolean;
    strategies: ('semantic' | 'neighborhood')[];
    forward_chunks?: number;
    backward_chunks?: number;
    semantic_neighbors?: number;
    semantic_similarity_threshold?: number;
    generation_config?: {
      model?: string;  // Рекомендуется: 'google/gemini-2.5-flash'
      temperature?: number;   // Рекомендуется: 0.2 для кода
      thinking_budget?: number;  // Для Gemini: -1 (dynamic) или 1024-2048
    };
  };
  
  // Metadata extraction
  metadataExtraction?: {
    enabled: boolean;
    extractFields?: string[];
    useLLM?: boolean;
    // Gemini-оптимизированные настройки
    geminiModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    thinkingBudget?: number;
  };
  
  // Code-specific settings
  codeSpecific?: {
    language?: string;
    extractFunctions?: boolean;
    extractClasses?: boolean;
    extractImports?: boolean;
    preserveStructure?: boolean;
  };
}

export class AdvancedIngestionService {
  constructor(private client: r2rClient) {}

  // Загрузка с полной конфигурацией
  async ingestDocument(
    file: File,
    config: IngestionConfig,
    metadata?: Record<string, any>,
    collectionIds?: string[]
  ) {
    // 1. Pre-processing
    const preprocessed = await this.preprocessFile(file, config);
    
    // 2. Validation
    await this.validateFile(file, preprocessed);
    
    // 3. Enrich metadata
    const enrichedMetadata = await this.enrichMetadata(
      file,
      preprocessed,
      metadata || {}
    );
    
    // 4. Upload with config
    if (config.mode === 'custom') {
      return this.client.documents.create({
        file: preprocessed.file,
        metadata: enrichedMetadata,
        collection_ids: collectionIds,
        ingestion_mode: 'custom',
        ingestion_config: config.customConfig,
      });
    } else {
      return this.client.documents.create({
        file: preprocessed.file,
        metadata: enrichedMetadata,
        collection_ids: collectionIds,
        ingestion_mode: config.mode,
      });
    }
  }

  // Pre-processing файла
  async preprocessFile(file: File, config: IngestionConfig) {
    // Для кода:
    if (config.codeSpecific) {
      return this.preprocessCode(file, config);
    }
    
    // Для обычных документов:
    return {
      file,
      text: await file.text(),
      metadata: {},
    };
  }

  // Pre-processing кода
  async preprocessCode(file: File, config: IngestionConfig) {
    const text = await file.text();
    const language = config.codeSpecific?.language || 
                     this.detectLanguage(file.name);
    
    // Извлечение структуры кода
    const structure = await this.extractCodeStructure(text, language);
    
    // Нормализация кода
    const normalized = this.normalizeCode(text, language);
    
    return {
      file,
      text: normalized,
      metadata: {
        ...structure,
        language,
        code_type: 'source_code',
      },
    };
  }

  // Извлечение структуры кода
  async extractCodeStructure(code: string, language: string) {
    // Используем R2R для извлечения:
    // - Функции
    // - Классы
    // - Импорты
    // - Зависимости
    
    const response = await this.client.retrieval.rag({
      query: `Extract code structure from this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
      rag_generation_config: {
        model: 'anthropic/claude-3-haiku-20240307',
        temperature: 0.1,
      },
    });
    
    return this.parseStructure(response);
  }
}
```

**UI Компоненты:**

```typescript
// src/components/ingestion/
├── AdvancedUploadDialog.tsx       # Расширенный диалог загрузки
│   ├── IngestionModeSelector      # Выбор режима
│   ├── CustomConfigEditor         # Редактор custom config
│   ├── ChunkEnrichmentSettings    # Настройки enrichment
│   └── CodeSpecificSettings       # Настройки для кода
├── IngestionProgress.tsx          # Прогресс с деталями
│   ├── ParsingStatus
│   ├── ChunkingStatus
│   ├── EmbeddingStatus
│   └── EnrichmentStatus
└── ChunkPreview.tsx               # Превью chunks перед загрузкой
```

**Задачи:**
- [ ] Создать AdvancedIngestionService
- [ ] Реализовать pre-processing для кода
- [ ] Добавить валидацию файлов
- [ ] Реализовать обогащение metadata
- [ ] Создать UI для advanced settings
- [ ] Добавить chunk preview

**Оценка:** 5-7 дней

---

### 1.2 Pre-processed Chunks Ingestion

**Цель:** Загрузка предобработанных chunks для лучшего контроля

```typescript
// src/services/ingestion/chunkIngestion.ts
export interface ProcessedChunk {
  text: string;
  metadata?: {
    chunk_order?: number;
    source_file?: string;
    function_name?: string;
    class_name?: string;
    line_start?: number;
    line_end?: number;
    language?: string;
    [key: string]: any;
  };
}

export class ChunkIngestionService {
  // Загрузка pre-processed chunks
  async ingestChunks(
    chunks: ProcessedChunk[],
    documentId?: string,
    collectionIds?: string[]
  ) {
    // Валидация chunks
    const validated = await this.validateChunks(chunks);
    
    // Обогащение chunks
    const enriched = await this.enrichChunks(validated);
    
    // Загрузка через R2R
    return this.client.chunks.create({
      chunks: enriched.map(chunk => ({
        text: chunk.text,
        metadata: chunk.metadata,
        document_id: documentId,
      })),
      collection_ids: collectionIds,
    });
  }

  // Валидация chunks
  async validateChunks(chunks: ProcessedChunk[]) {
    return chunks.filter(chunk => {
      // Проверка размера
      if (chunk.text.length > 10000) {
        logger.warn('Chunk too large', { size: chunk.text.length });
        return false;
      }
      
      // Проверка на пустоту
      if (!chunk.text.trim()) {
        return false;
      }
      
      return true;
    });
  }

  // Обогащение chunks
  async enrichChunks(chunks: ProcessedChunk[]) {
    return Promise.all(
      chunks.map(async (chunk) => {
        // Генерация embeddings для проверки качества
        // Рекомендуется использовать Gemini embeddings для лучшей совместимости
        const embedding = await this.client.retrieval.embedding({
          text: chunk.text,
          model: 'google/text-embedding-004',  // Gemini embeddings
        });
        
        // Извлечение entities для кода
        if (chunk.metadata?.language) {
          const entities = await this.extractCodeEntities(chunk.text);
          chunk.metadata.entities = entities;
        }
        
        return {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            embedding_quality: this.assessEmbeddingQuality(embedding),
            enriched_at: new Date().toISOString(),
          },
        };
      })
    );
  }

  // Извлечение entities из кода
  async extractCodeEntities(code: string) {
    // Используем R2R для извлечения:
    // - Имена функций
    // - Имена классов
    // - Переменные
    // - Импорты
    
    const response = await this.client.retrieval.rag({
      query: `Extract all code entities (functions, classes, variables, imports) from:\n\`\`\`\n${code}\n\`\`\``,
    });
    
    return this.parseEntities(response);
  }
}
```

**UI:**

```typescript
// src/components/chunks/
├── ChunkEditor.tsx                # Редактор chunks
├── ChunkValidator.tsx              # Валидатор chunks
├── ChunkEnricher.tsx               # Обогащение chunks
└── BulkChunkUpload.tsx             # Массовая загрузка
```

**Задачи:**
- [ ] Создать ChunkIngestionService
- [ ] Реализовать валидацию chunks
- [ ] Добавить обогащение chunks
- [ ] Создать UI для редактирования chunks
- [ ] Реализовать bulk upload

**Оценка:** 4-5 дней

---

### 1.3 Chunk Management & Quality Control

**Цель:** Управление chunks после загрузки для улучшения качества

```typescript
// src/services/chunks/chunkManagement.ts
export class ChunkManagementService {
  // Получение chunks документа
  async getDocumentChunks(
    documentId: string,
    options?: {
      includeVectors?: boolean;
      offset?: number;
      limit?: number;
    }
  ) {
    return this.client.documents.listChunks({
      id: documentId,
      include_vectors: options?.includeVectors,
      offset: options?.offset,
      limit: options?.limit,
    });
  }

  // Обновление chunk
  async updateChunk(
    chunkId: string,
    updates: {
      text?: string;
      metadata?: Record<string, any>;
    }
  ) {
    // Обновление через R2R (автоматически пересчитывает embeddings)
    return this.client.chunks.update({
      id: chunkId,
      text: updates.text,
      metadata: updates.metadata,
    });
  }

  // Анализ качества chunks
  async analyzeChunkQuality(chunkId: string) {
    const chunk = await this.client.chunks.retrieve({ id: chunkId });
    
    // Метрики качества:
    const metrics = {
      // Размер
      size: chunk.results.text.length,
      sizeScore: this.scoreSize(chunk.results.text.length),
      
      // Семантическая полнота
      semanticScore: await this.assessSemanticCompleteness(
        chunk.results.text
      ),
      
      // Качество metadata
      metadataScore: this.scoreMetadata(chunk.results.metadata),
      
      // Embedding quality
      embeddingScore: chunk.results.vector 
        ? this.assessEmbeddingQuality(chunk.results.vector)
        : 0,
      
      // Для кода: структура
      structureScore: chunk.results.metadata?.language
        ? await this.assessCodeStructure(chunk.results.text)
        : null,
    };
    
    return {
      ...metrics,
      overallScore: this.calculateOverallScore(metrics),
      suggestions: this.generateSuggestions(metrics),
    };
  }

  // Предложения по улучшению
  generateSuggestions(metrics: ChunkQualityMetrics): string[] {
    const suggestions: string[] = [];
    
    if (metrics.sizeScore < 0.5) {
      suggestions.push('Chunk is too small or too large. Consider splitting or merging.');
    }
    
    if (metrics.semanticScore < 0.7) {
      suggestions.push('Chunk may lack semantic completeness. Consider adding context.');
    }
    
    if (metrics.metadataScore < 0.6) {
      suggestions.push('Metadata is incomplete. Add more context information.');
    }
    
    if (metrics.structureScore && metrics.structureScore < 0.7) {
      suggestions.push('Code structure could be improved. Consider better chunking strategy.');
    }
    
    return suggestions;
  }

  // Массовое улучшение chunks
  async improveChunksBatch(
    documentId: string,
    strategy: 'enrich' | 'split' | 'merge' | 'rechunk'
  ) {
    const chunks = await this.getDocumentChunks(documentId, { limit: 1000 });
    
    switch (strategy) {
      case 'enrich':
        return this.enrichChunksBatch(chunks.results);
      case 'split':
        return this.splitLargeChunks(chunks.results);
      case 'merge':
        return this.mergeSmallChunks(chunks.results);
      case 'rechunk':
        return this.rechunkDocument(documentId);
    }
  }
}
```

**UI:**

```typescript
// src/components/chunks/
├── ChunkQualityAnalyzer.tsx       # Анализатор качества
├── ChunkEditor.tsx                 # Редактор с suggestions
├── ChunkImprovementWizard.tsx      # Мастер улучшения
└── ChunkComparison.tsx             # Сравнение chunks
```

**Задачи:**
- [ ] Создать ChunkManagementService
- [ ] Реализовать анализ качества
- [ ] Добавить массовые операции
- [ ] Создать UI для управления chunks

**Оценка:** 5-6 дней

---

## 🔍 Phase 2: Максимизация поиска и генерации (2-3 недели)

### 2.1 Advanced Search Strategies

**Цель:** Использовать все search strategies R2R

```typescript
// src/services/search/advancedSearch.ts
export class AdvancedSearchService {
  // HyDE (Hypothetical Document Embeddings)
  async hydeSearch(query: string, options?: SearchOptions) {
    return this.client.retrieval.rag({
      query,
      search_settings: {
        search_strategy: 'hyde',
        limit: options?.limit || 10,
        filters: options?.filters,
      },
    });
  }

  // Multi-query search
  async multiQuerySearch(
    query: string,
    numQueries: number = 3
  ) {
    // Генерируем варианты запроса
    const queryVariants = await this.generateQueryVariants(
      query,
      numQueries
    );
    
    // Ищем по каждому варианту
    const results = await Promise.all(
      queryVariants.map(variant =>
        this.client.retrieval.search({
          query: variant,
          search_settings: {
            use_semantic_search: true,
            limit: 10,
          },
        })
      )
    );
    
    // Объединяем и дедуплицируем
    return this.mergeAndDeduplicate(results);
  }

  // Contextual compression
  async contextualSearch(
    query: string,
    context: string,
    options?: SearchOptions
  ) {
    // Используем context для улучшения поиска
    const enhancedQuery = await this.enhanceQueryWithContext(
      query,
      context
    );
    
    return this.client.retrieval.search({
      query: enhancedQuery,
      search_settings: {
        use_semantic_search: true,
        use_hybrid_search: true,
        filters: options?.filters,
        limit: options?.limit || 10,
      },
    });
  }

  // Re-ranking результатов
  async rerankedSearch(
    query: string,
    initialResults: SearchResult[],
    rerankerModel?: string
  ) {
    // Используем R2R для re-ranking
    const reranked = await this.client.retrieval.rag({
      query: `Re-rank these search results for query: "${query}"`,
      rag_generation_config: {
        model: rerankerModel || 'anthropic/claude-3-haiku-20240307',
      },
    });
    
    return this.applyReranking(initialResults, reranked);
  }

  // Code-specific search
  async codeSearch(
    query: string,
    options?: {
      language?: string;
      functionName?: string;
      className?: string;
      fileType?: string[];
    }
  ) {
    const filters: Record<string, any> = {
      code_type: { $eq: 'source_code' },
    };
    
    if (options?.language) {
      filters.language = { $eq: options.language };
    }
    
    if (options?.functionName) {
      filters['metadata.function_name'] = { $eq: options.functionName };
    }
    
    return this.client.retrieval.search({
      query,
      search_settings: {
        use_semantic_search: true,
        use_hybrid_search: true,
        filters,
        limit: 20,
      },
    });
  }
}
```

**UI:**

```typescript
// src/components/search/
├── AdvancedSearchPanel.tsx        # Панель с advanced options
│   ├── StrategySelector           # Выбор strategy
│   ├── MultiQueryToggle            # Multi-query
│   └── ContextInput                # Context для поиска
├── SearchResultsViewer.tsx         # Улучшенный просмотр результатов
│   ├── ResultCard
│   ├── RelevanceScore
│   └── ChunkPreview
└── CodeSearchInterface.tsx         # Специализированный для кода
```

**Задачи:**
- [ ] Реализовать все search strategies
- [ ] Добавить multi-query search
- [ ] Реализовать contextual compression
- [ ] Добавить re-ranking
- [ ] Создать code-specific search

**Оценка:** 4-5 дней

---

### 2.2 Enhanced RAG Generation

**Цель:** Максимизировать качество генерации через R2R

```typescript
// src/services/generation/enhancedRAG.ts
export class EnhancedRAGService {
  // RAG с chunk enrichment
  async enrichedRAG(
    query: string,
    options?: {
      useEnrichment?: boolean;
      enrichmentStrategy?: 'semantic' | 'neighborhood';
      model?: string;  // Рекомендуется: 'google/gemini-2.5-flash'
      temperature?: number;  // Рекомендуется: 0.3 для RAG
      thinkingBudget?: number;  // Для Gemini: -1 (dynamic) или 2048
    }
  ) {
    // Сначала поиск
    const searchResults = await this.client.retrieval.search({
      query,
      search_settings: {
        use_semantic_search: true,
        limit: 10,
      },
    });
    
    // Обогащение chunks если нужно
    if (options?.useEnrichment) {
      const enriched = await this.enrichSearchResults(
        searchResults,
        options.enrichmentStrategy
      );
      searchResults.results = enriched;
    }
    
    // Генерация с обогащенными результатами
    return this.client.retrieval.rag({
      query,
      search_settings: {
        use_semantic_search: true,
        limit: 10,
      },
      rag_generation_config: {
        model: options?.model,
        temperature: options?.temperature,
      },
    });
  }

  // RAG с Knowledge Graph
  async kgEnhancedRAG(
    query: string,
    options?: RAGOptions
  ) {
    return this.client.retrieval.rag({
      query,
      search_settings: {
        use_semantic_search: true,
        graph_settings: {
          enabled: true,
          traversal_depth: options?.kgDepth || 2,
        },
      },
      rag_generation_config: options?.generationConfig,
    });
  }

  // RAG с web search
  async webEnhancedRAG(
    query: string,
    options?: RAGOptions
  ) {
    return this.client.retrieval.agent({
      message: { role: 'user', content: query },
      rag_tools: ['search_file_knowledge', 'web_search', 'web_scrape'],
      mode: 'rag',
      rag_generation_config: options?.generationConfig,
    });
  }

  // Code-specific RAG
  async codeRAG(
    query: string,
    codeContext?: string,
    options?: RAGOptions
  ) {
    const enhancedQuery = codeContext
      ? `${query}\n\nCode context:\n\`\`\`\n${codeContext}\n\`\`\``
      : query;
    
    return this.client.retrieval.rag({
      query: enhancedQuery,
      search_settings: {
        filters: {
          code_type: { $eq: 'source_code' },
        },
        use_semantic_search: true,
        use_hybrid_search: true,
        limit: 15,
      },
      rag_generation_config: {
        // Рекомендуется Gemini для кода
        model: options?.model || 'google/gemini-2.5-flash',
        temperature: options?.temperature || 0.2,  // Низкая для точности кода
        thinking_budget: options?.thinkingBudget || 2048,  // Для Gemini
      },
    });
  }
}
```

**Задачи:**
- [ ] Реализовать enriched RAG
- [ ] Добавить KG-enhanced RAG
- [ ] Реализовать web-enhanced RAG
- [ ] Создать code-specific RAG

**Оценка:** 3-4 дня

---

## 📈 Phase 3: Data Quality Pipeline (2-3 недели)

### 3.1 Pre-upload Validation & Enrichment

**Цель:** Улучшить качество данных до загрузки

```typescript
// src/services/quality/preUploadQuality.ts
export class PreUploadQualityService {
  // Валидация файла
  async validateFile(file: File): Promise<ValidationResult> {
    const checks = {
      size: this.validateSize(file),
      type: this.validateType(file),
      content: await this.validateContent(file),
      structure: await this.validateStructure(file),
      duplicates: await this.checkDuplicates(file),
    };
    
    return {
      valid: Object.values(checks).every(c => c.valid),
      checks,
      score: this.calculateScore(checks),
      suggestions: this.generateSuggestions(checks),
    };
  }

  // Обогащение metadata
  async enrichMetadata(
    file: File,
    existingMetadata?: Record<string, any>
  ): Promise<Record<string, any>> {
    const text = await file.text();
    
    // Автоматическое извлечение metadata
    const extracted = {
      // Из файла
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      last_modified: new Date(file.lastModified).toISOString(),
      
      // Из содержимого
      ...(await this.extractContentMetadata(text)),
      
      // Для кода
      ...(await this.extractCodeMetadata(text, file.name)),
      
      // Пользовательские
      ...existingMetadata,
    };
    
    return extracted;
  }

  // Извлечение metadata из содержимого
  async extractContentMetadata(text: string) {
    // Используем R2R для извлечения:
    const response = await this.client.retrieval.rag({
      query: `Extract key metadata from this document:\n${text.substring(0, 2000)}`,
      rag_generation_config: {
        model: 'anthropic/claude-3-haiku-20240307',
        temperature: 0.1,
      },
    });
    
    return this.parseMetadata(response);
  }

  // Извлечение metadata из кода
  async extractCodeMetadata(code: string, fileName: string) {
    const language = this.detectLanguage(fileName);
    
    return {
      language,
      ...(await this.extractCodeStructure(code, language)),
      estimated_complexity: await this.estimateComplexity(code),
      dependencies: await this.extractDependencies(code, language),
    };
  }

  // Проверка на дубликаты
  async checkDuplicates(file: File): Promise<DuplicateCheck> {
    const text = await file.text();
    // Используем Gemini embeddings для лучшей точности
    const embedding = await this.client.retrieval.embedding({ 
      text,
      model: 'google/text-embedding-004',  // Gemini embeddings
    });
    
    // Поиск похожих документов
    const similar = await this.client.retrieval.search({
      query: '', // Используем embedding
      search_settings: {
        use_semantic_search: true,
        embedding: embedding.results.embeddings[0],
        limit: 5,
      },
    });
    
    return {
      hasDuplicates: similar.results.some(r => r.score > 0.95),
      similarDocuments: similar.results,
    };
  }
}
```

**UI:**

```typescript
// src/components/quality/
├── FileValidator.tsx              # Валидатор файлов
├── MetadataEnricher.tsx           # Обогащение metadata
├── DuplicateChecker.tsx            # Проверка дубликатов
└── QualityScore.tsx                # Оценка качества
```

**Задачи:**
- [ ] Создать PreUploadQualityService
- [ ] Реализовать валидацию
- [ ] Добавить обогащение metadata
- [ ] Реализовать проверку дубликатов

**Оценка:** 4-5 дней

---

### 3.2 Post-upload Quality Monitoring

**Цель:** Мониторинг качества после загрузки

```typescript
// src/services/quality/postUploadQuality.ts
export class PostUploadQualityService {
  // Мониторинг качества документа
  async monitorDocumentQuality(documentId: string) {
    const document = await this.client.documents.retrieve({ id: documentId });
    const chunks = await this.client.documents.listChunks({ id: documentId });
    
    return {
      document: await this.assessDocumentQuality(document.results),
      chunks: await Promise.all(
        chunks.results.map(chunk => this.assessChunkQuality(chunk))
      ),
      overall: this.calculateOverallQuality(document, chunks),
    };
  }

  // Оценка качества документа
  async assessDocumentQuality(document: DocumentResponse) {
    return {
      ingestionStatus: document.ingestionStatus,
      extractionStatus: document.extractionStatus,
      metadataCompleteness: this.scoreMetadata(document.metadata),
      chunkCount: document.chunkCount || 0,
      chunkQuality: await this.assessChunksQuality(document.id),
    };
  }

  // Автоматическое улучшение
  async autoImprove(documentId: string) {
    const quality = await this.monitorDocumentQuality(documentId);
    
    const improvements: Improvement[] = [];
    
    // Если metadata неполное
    if (quality.document.metadataCompleteness < 0.7) {
      improvements.push({
        type: 'enrich_metadata',
        action: () => this.enrichDocumentMetadata(documentId),
      });
    }
    
    // Если chunks низкого качества
    if (quality.overall.chunkQuality < 0.7) {
      improvements.push({
        type: 'rechunk',
        action: () => this.rechunkDocument(documentId),
      });
    }
    
    // Если нет KG extraction
    if (quality.document.extractionStatus !== 'success') {
      improvements.push({
        type: 'extract_kg',
        action: () => this.extractKnowledgeGraph(documentId),
      });
    }
    
    return improvements;
  }
}
```

**UI:**

```typescript
// src/components/quality/
├── QualityDashboard.tsx            # Дашборд качества
├── QualityMonitor.tsx              # Мониторинг в реальном времени
├── AutoImprovement.tsx             # Автоматическое улучшение
└── QualityReports.tsx              # Отчеты о качестве
```

**Задачи:**
- [ ] Создать PostUploadQualityService
- [ ] Реализовать мониторинг
- [ ] Добавить автоматическое улучшение
- [ ] Создать quality dashboard

**Оценка:** 4-5 дней

---

## 💻 Phase 4: Специализация для программирования (3-4 недели)

### 4.1 Code-Specific Ingestion

**Цель:** Оптимизированная загрузка кода

```typescript
// src/services/code/codeIngestion.ts
export class CodeIngestionService {
  // Загрузка кодовой базы
  async ingestCodebase(
    files: File[],
    options?: {
      language?: string;
      preserveStructure?: boolean;
      extractDependencies?: boolean;
      chunkByFunction?: boolean;
    }
  ) {
    const results = [];
    
    for (const file of files) {
      // Pre-processing кода
      const processed = await this.preprocessCode(file, options);
      
      // Специальная chunking стратегия для кода
      const chunks = options?.chunkByFunction
        ? await this.chunkByFunctions(processed.code, processed.language)
        : await this.chunkCode(processed.code, processed.language);
      
      // Загрузка с code-specific metadata
      const result = await this.client.chunks.create({
        chunks: chunks.map(chunk => ({
          text: chunk.code,
          metadata: {
            ...chunk.metadata,
            code_type: 'source_code',
            language: processed.language,
            file_path: file.name,
            ...(options?.extractDependencies && {
              dependencies: chunk.dependencies,
            }),
          },
        })),
      });
      
      results.push(result);
    }
    
    return results;
  }

  // Chunking по функциям
  async chunkByFunctions(code: string, language: string) {
    // Используем R2R для извлечения функций
    const functions = await this.extractFunctions(code, language);
    
    return functions.map(func => ({
      code: func.code,
      metadata: {
        function_name: func.name,
        function_signature: func.signature,
        line_start: func.lineStart,
        line_end: func.lineEnd,
        parameters: func.parameters,
        return_type: func.returnType,
      },
    }));
  }

  // Извлечение зависимостей
  async extractDependencies(code: string, language: string) {
    const response = await this.client.retrieval.rag({
      query: `Extract all dependencies (imports, requires, etc.) from this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
    });
    
    return this.parseDependencies(response, language);
  }
}
```

**Задачи:**
- [ ] Создать CodeIngestionService
- [ ] Реализовать chunking по функциям
- [ ] Добавить извлечение зависимостей
- [ ] Оптимизировать для разных языков

**Оценка:** 5-6 дней

---

### 4.2 Code-Specific Search & RAG

**Цель:** Специализированный поиск и генерация для кода

```typescript
// src/services/code/codeSearch.ts
export class CodeSearchService {
  // Поиск функций
  async searchFunctions(query: string, language?: string) {
    return this.client.retrieval.search({
      query: `function ${query}`,
      search_settings: {
        filters: {
          code_type: { $eq: 'source_code' },
          'metadata.function_name': { $exists: true },
          ...(language && { language: { $eq: language } }),
        },
        use_semantic_search: true,
        limit: 20,
      },
    });
  }

  // Поиск по сигнатуре
  async searchBySignature(signature: string, language: string) {
    return this.client.retrieval.search({
      query: signature,
      search_settings: {
        filters: {
          code_type: { $eq: 'source_code' },
          language: { $eq: language },
          'metadata.function_signature': { $exists: true },
        },
        use_hybrid_search: true,
        limit: 10,
      },
    });
  }

  // Поиск примеров использования
  async findUsageExamples(functionName: string, language: string) {
    return this.client.retrieval.search({
      query: `examples of using ${functionName} in ${language}`,
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

  // Code RAG с контекстом
  async codeRAGWithContext(
    query: string,
    codeContext: string,
    options?: RAGOptions
  ) {
    return this.client.retrieval.rag({
      query: `${query}\n\nCode:\n\`\`\`\n${codeContext}\n\`\`\``,
      search_settings: {
        filters: {
          code_type: { $eq: 'source_code' },
        },
        use_semantic_search: true,
        use_hybrid_search: true,
        limit: 15,
      },
      rag_generation_config: {
        model: options?.model || 'anthropic/claude-3-7-sonnet-20250219',
        temperature: options?.temperature || 0.2,
      },
    });
  }
}
```

**Задачи:**
- [ ] Создать CodeSearchService
- [ ] Реализовать специализированные поиски
- [ ] Добавить code RAG с контекстом

**Оценка:** 3-4 дня

---

## 📋 Roadmap выполнения

### Sprint 1-2 (2 недели): Advanced Ingestion
- [ ] Advanced Ingestion Service
- [ ] Pre-processed Chunks
- [ ] Chunk Management
- [ ] UI для advanced settings

### Sprint 3-4 (2 недели): Search & Generation
- [ ] Advanced Search Strategies
- [ ] Enhanced RAG
- [ ] Code-specific search
- [ ] UI improvements

### Sprint 5-6 (2 недели): Data Quality
- [ ] Pre-upload validation
- [ ] Post-upload monitoring
- [ ] Auto-improvement
- [ ] Quality dashboard

### Sprint 7-8 (2 недели): Code Specialization
- [ ] Code ingestion
- [ ] Code search
- [ ] Code RAG
- [ ] Code UI

---

## 🛠️ Технические детали

### Новые сервисы

```
src/services/
├── ingestion/
│   ├── advancedIngestion.ts
│   ├── chunkIngestion.ts
│   └── codeIngestion.ts
├── chunks/
│   └── chunkManagement.ts
├── search/
│   ├── advancedSearch.ts
│   └── codeSearch.ts
├── generation/
│   └── enhancedRAG.ts
├── quality/
│   ├── preUploadQuality.ts
│   └── postUploadQuality.ts
└── code/
    ├── codeIngestion.ts
    └── codeSearch.ts
```

### Новые компоненты

```
src/components/
├── ingestion/
│   ├── AdvancedUploadDialog.tsx
│   ├── IngestionProgress.tsx
│   └── ChunkPreview.tsx
├── chunks/
│   ├── ChunkQualityAnalyzer.tsx
│   ├── ChunkEditor.tsx
│   └── ChunkImprovementWizard.tsx
├── search/
│   ├── AdvancedSearchPanel.tsx
│   └── CodeSearchInterface.tsx
└── quality/
    ├── FileValidator.tsx
    ├── QualityDashboard.tsx
    └── AutoImprovement.tsx
```

---

## 📊 Метрики успеха

### Качество данных
- [ ] 100% файлов проходят валидацию
- [ ] 90%+ metadata completeness
- [ ] 80%+ chunk quality score
- [ ] 0 дубликатов высокого качества

### Использование API
- [ ] 100% ingestion modes поддерживаются
- [ ] Chunk enrichment включен для 80%+ документов
- [ ] Все search strategies доступны
- [ ] Code-specific features работают

### Эффективность
- [ ] Время загрузки < 30s для обычных файлов
- [ ] Время загрузки < 2min для больших кодовых баз
- [ ] Search latency < 500ms
- [ ] RAG generation < 5s

---

---

## 🔗 Связанные документы

- **[GEMINI_R2R_INTEGRATION_PLAN.md](./GEMINI_R2R_INTEGRATION_PLAN.md)** - Детальная настройка Gemini моделей для R2R
- **[DEVELOPER_IMPROVEMENT_PLAN.md](./DEVELOPER_IMPROVEMENT_PLAN.md)** - Технические улучшения кода
- **[MCP_INTEGRATION_PLAN.md](./MCP_INTEGRATION_PLAN.md)** - Интеграция MCP сервера

---

## 💡 Рекомендации по использованию Gemini

### Быстрый старт с Gemini:

1. **Настройте r2r.toml:**
   ```toml
   [completion]
   provider = "litellm"
   [completion.generation_config]
   model = "google/gemini-2.5-flash"
   temperature = 0.3
   
   [embedding]
   provider = "litellm"
   base_model = "google/text-embedding-004"
   ```

2. **Установите API ключ:**
   ```bash
   export GOOGLE_API_KEY=your_key_here
   ```

3. **Используйте GeminiService** из `GEMINI_R2R_INTEGRATION_PLAN.md`

### Оптимальные настройки для разных задач:

- **Code Generation:** `gemini-2.5-flash`, temp=0.2, thinking=2048
- **RAG:** `gemini-2.5-flash`, temp=0.3, thinking=-1 (dynamic)
- **Complex Reasoning:** `gemini-2.5-pro`, temp=0.2, thinking=8192
- **Fast Responses:** `gemini-2.5-flash`, temp=0.3, thinking=0

---

**Дата создания:** 2025-01-27  
**Версия:** 2.0 (обновлено с Gemini рекомендациями)  
**Фокус:** Maximizing R2R API + Data Quality + Gemini Optimization
