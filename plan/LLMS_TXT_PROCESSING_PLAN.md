# План реализации обработки llms.txt и llms-full.txt файлов

## LLMs.txt Processing & Cataloging Implementation Plan

> **Цель:** Создать систему поиска, подготовки, обработки через R2R, сохранения и каталогизации файлов llms.txt и llms-full.txt для максимизации эффективности R2R-Application

---

## 📚 Часть 1: Понимание llms.txt формата

### 1.1 Формат llms.txt

**Структура:**

```
# Project Name

> Brief summary of the project

Supporting context about the site's organization.

## Section Name
[Document Name](URL) - Description
[Another Document](URL) - Description

## Another Section
[Document](URL) - Description
```

**Ключевые элементы:**

- H1 заголовок с названием проекта
- Blockquote с кратким описанием
- Поддерживающий контекст
- Секции с ссылками на документы в формате `[Name](URL)`

### 1.2 Формат llms-full.txt

**Расширенная версия:**

- Та же структура, что и llms.txt
- Более детальная информация в каждой секции
- Полные описания документов
- Дополнительный контекст

### 1.3 Использование в R2R

**Преимущества:**

- Структурированная документация для LLM
- Легко парсится и индексируется
- Оптимизировано для RAG
- Содержит метаданные о структуре

---

## 🎯 Часть 2: Архитектура системы

### 2.1 Компоненты системы

```
llms-txt-processor/
├── discovery/              # Поиск файлов
│   ├── web_crawler.py      # Поиск на сайтах
│   ├── github_scanner.py   # Поиск в GitHub
│   ├── registry_scanner.py # Поиск в реестрах
│   └── url_validator.py    # Валидация URL
│
├── parser/                 # Парсинг файлов
│   ├── llms_txt_parser.py  # Парсер llms.txt
│   ├── llms_full_parser.py # Парсер llms-full.txt
│   ├── metadata_extractor.py # Извлечение метаданных
│   └── link_validator.py   # Валидация ссылок
│
├── processor/              # Обработка через R2R
│   ├── r2r_ingestion.py    # Ingestion в R2R
│   ├── chunk_strategy.py   # Стратегии chunking
│   ├── enrichment.py       # Обогащение данных
│   └── gemini_processor.py # Gemini-оптимизированная обработка
│
├── catalog/                 # Каталогизация
│   ├── catalog_manager.py  # Управление каталогом
│   ├── metadata_db.py      # База метаданных
│   ├── search_index.py     # Поисковый индекс
│   └── collection_manager.py # Управление коллекциями
│
└── api/                    # API для R2R-Application
    ├── discovery_api.ts    # API для поиска
    ├── processing_api.ts   # API для обработки
    └── catalog_api.ts      # API для каталога
```

### 2.2 Поток данных

```
1. Discovery (Поиск)
   ↓
2. Validation (Валидация)
   ↓
3. Parsing (Парсинг)
   ↓
4. Metadata Extraction (Извлечение метаданных)
   ↓
5. R2R Processing (Обработка через R2R)
   ↓
6. Cataloging (Каталогизация)
   ↓
7. Indexing (Индексация)
```

---

## 🔍 Часть 3: Реализация Discovery (Поиск)

### 3.1 Web Crawler для поиска llms.txt

```typescript
// src/services/llms-txt/discovery/webCrawler.ts
export interface LLMsTxtDiscoveryResult {
  url: string;
  type: 'llms.txt' | 'llms-full.txt';
  status: 'found' | 'not_found' | 'error';
  lastChecked: Date;
  content?: string;
}

export class LLMsTxtWebCrawler {
  constructor(private r2rClient: r2rClient) {}

  /**
   * Поиск llms.txt файлов на сайте
   */
  async discoverOnDomain(domain: string): Promise<LLMsTxtDiscoveryResult[]> {
    const results: LLMsTxtDiscoveryResult[] = [];

    // Стандартные пути
    const paths = [
      '/llms.txt',
      '/llms-full.txt',
      '/.well-known/llms.txt',
      '/docs/llms.txt',
    ];

    for (const path of paths) {
      const url = `https://${domain}${path}`;
      const result = await this.checkUrl(url);
      if (result.status === 'found') {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Проверка конкретного URL
   */
  async checkUrl(url: string): Promise<LLMsTxtDiscoveryResult> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/plain, text/markdown',
        },
      });

      if (response.ok) {
        const content = await response.text();
        const type = url.includes('llms-full.txt')
          ? 'llms-full.txt'
          : 'llms.txt';

        return {
          url,
          type,
          status: 'found',
          lastChecked: new Date(),
          content,
        };
      }

      return {
        url,
        type: 'llms.txt',
        status: 'not_found',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        url,
        type: 'llms.txt',
        status: 'error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Поиск через известные реестры
   */
  async discoverFromRegistry(
    registryUrl: string
  ): Promise<LLMsTxtDiscoveryResult[]> {
    // Поиск в реестрах типа llmstxt.com
    const response = await fetch(`${registryUrl}/api/llms-txt`);
    const data = await response.json();

    return data.map((item: any) => ({
      url: item.url,
      type: item.type || 'llms.txt',
      status: 'found' as const,
      lastChecked: new Date(),
    }));
  }

  /**
   * Поиск через GitHub
   */
  async discoverFromGitHub(
    owner: string,
    repo: string
  ): Promise<LLMsTxtDiscoveryResult | null> {
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

    try {
      const response = await fetch(githubApiUrl);
      const files = await response.json();

      const llmsTxtFile = files.find(
        (file: any) => file.name === 'llms.txt' || file.name === 'llms-full.txt'
      );

      if (llmsTxtFile) {
        const contentResponse = await fetch(llmsTxtFile.download_url);
        const content = await contentResponse.text();

        return {
          url: llmsTxtFile.html_url,
          type: llmsTxtFile.name as 'llms.txt' | 'llms-full.txt',
          status: 'found',
          lastChecked: new Date(),
          content,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Массовый поиск по списку доменов
   */
  async batchDiscover(domains: string[]): Promise<LLMsTxtDiscoveryResult[]> {
    const results: LLMsTxtDiscoveryResult[] = [];

    // Параллельный поиск с ограничением
    const batchSize = 10;
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((domain) => this.discoverOnDomain(domain))
      );
      results.push(...batchResults.flat());

      // Задержка между батчами
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }
}
```

### 3.2 GitHub Scanner

```typescript
// src/services/llms-txt/discovery/githubScanner.ts
export class GitHubLLMsTxtScanner {
  constructor(private githubToken?: string) {}

  /**
   * Поиск репозиториев с llms.txt
   */
  async searchRepositories(query: string = 'llms.txt'): Promise<any[]> {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}+filename:llms.txt`;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    return data.items || [];
  }

  /**
   * Получение llms.txt из репозитория
   */
  async getLLMsTxtFromRepo(
    owner: string,
    repo: string
  ): Promise<{ content: string; url: string } | null> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/llms.txt`;
      const response = await fetch(url);

      if (response.ok) {
        const file = await response.json();
        const contentResponse = await fetch(file.download_url);
        const content = await contentResponse.text();

        return {
          content,
          url: file.html_url,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
```

---

## 📝 Часть 4: Реализация Parser (Парсинг)

### 4.1 LLMs.txt Parser

```typescript
// src/services/llms-txt/parser/llmsTxtParser.ts
export interface ParsedLLMsTxt {
  title: string;
  summary: string;
  context: string;
  sections: LLMsTxtSection[];
  metadata: {
    url: string;
    type: 'llms.txt' | 'llms-full.txt';
    parsedAt: Date;
    version?: string;
  };
}

export interface LLMsTxtSection {
  name: string;
  links: LLMsTxtLink[];
  description?: string;
}

export interface LLMsTxtLink {
  name: string;
  url: string;
  description?: string;
}

export class LLMsTxtParser {
  /**
   * Парсинг llms.txt файла
   */
  parse(content: string, sourceUrl: string): ParsedLLMsTxt {
    const lines = content.split('\n');

    // Извлечение заголовка (H1)
    const title = this.extractTitle(lines);

    // Извлечение summary (blockquote)
    const summary = this.extractSummary(lines);

    // Извлечение контекста
    const context = this.extractContext(lines);

    // Извлечение секций
    const sections = this.extractSections(lines);

    return {
      title,
      summary,
      context,
      sections,
      metadata: {
        url: sourceUrl,
        type: sourceUrl.includes('llms-full.txt')
          ? 'llms-full.txt'
          : 'llms.txt',
        parsedAt: new Date(),
      },
    };
  }

  private extractTitle(lines: string[]): string {
    const titleLine = lines.find((line) => line.startsWith('# '));
    return titleLine ? titleLine.replace(/^#\s+/, '') : 'Unknown';
  }

  private extractSummary(lines: string[]): string {
    let inBlockquote = false;
    const summaryLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('>')) {
        inBlockquote = true;
        summaryLines.push(line.replace(/^>\s+/, ''));
      } else if (inBlockquote && line.trim() === '') {
        break;
      } else if (inBlockquote) {
        summaryLines.push(line);
      }
    }

    return summaryLines.join('\n').trim();
  }

  private extractContext(lines: string[]): string {
    // Контекст между summary и первой секцией
    let contextStart = false;
    const contextLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('>')) {
        contextStart = true;
        continue;
      }
      if (line.startsWith('##')) {
        break;
      }
      if (contextStart && line.trim()) {
        contextLines.push(line);
      }
    }

    return contextLines.join('\n').trim();
  }

  private extractSections(lines: string[]): LLMsTxtSection[] {
    const sections: LLMsTxtSection[] = [];
    let currentSection: LLMsTxtSection | null = null;

    for (const line of lines) {
      // Новая секция
      if (line.startsWith('##')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          name: line.replace(/^##\s+/, ''),
          links: [],
        };
      }
      // Ссылка в формате [Name](URL)
      else if (currentSection && line.match(/\[.+\]\(.+\)/)) {
        const link = this.parseLink(line);
        if (link) {
          currentSection.links.push(link);
        }
      }
      // Описание ссылки
      else if (currentSection && line.trim() && !line.startsWith('[')) {
        if (currentSection.links.length > 0) {
          const lastLink =
            currentSection.links[currentSection.links.length - 1];
          lastLink.description = line.trim();
        } else {
          currentSection.description = line.trim();
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private parseLink(line: string): LLMsTxtLink | null {
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.+))?/);
    if (match) {
      return {
        name: match[1],
        url: match[2],
        description: match[3]?.trim(),
      };
    }
    return null;
  }

  /**
   * Валидация парсинга
   */
  validate(parsed: ParsedLLMsTxt): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.title) {
      errors.push('Missing title');
    }

    if (parsed.sections.length === 0) {
      errors.push('No sections found');
    }

    for (const section of parsed.sections) {
      if (section.links.length === 0) {
        errors.push(`Section "${section.name}" has no links`);
      }

      for (const link of section.links) {
        if (!this.isValidUrl(link.url)) {
          errors.push(`Invalid URL in section "${section.name}": ${link.url}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 4.2 Metadata Extractor

```typescript
// src/services/llms-txt/parser/metadataExtractor.ts
export interface LLMsTxtMetadata {
  // Основные метаданные
  title: string;
  summary: string;
  domain: string;
  type: 'llms.txt' | 'llms-full.txt';

  // Статистика
  sectionCount: number;
  linkCount: number;
  totalLinks: number;

  // Категории (определяются автоматически)
  categories: string[];

  // Технологии (извлекаются из ссылок)
  technologies: string[];

  // Качество
  qualityScore: number;
  completenessScore: number;

  // Временные метки
  discoveredAt: Date;
  lastUpdated?: Date;
  lastChecked: Date;
}

export class LLMsTxtMetadataExtractor {
  /**
   * Извлечение метаданных из распарсенного llms.txt
   */
  extract(parsed: ParsedLLMsTxt): LLMsTxtMetadata {
    const domain = new URL(parsed.metadata.url).hostname;

    // Подсчет статистики
    const sectionCount = parsed.sections.length;
    const linkCount = parsed.sections.reduce(
      (sum, section) => sum + section.links.length,
      0
    );

    // Извлечение категорий
    const categories = this.extractCategories(parsed);

    // Извлечение технологий
    const technologies = this.extractTechnologies(parsed);

    // Оценка качества
    const qualityScore = this.calculateQualityScore(parsed);
    const completenessScore = this.calculateCompletenessScore(parsed);

    return {
      title: parsed.title,
      summary: parsed.summary,
      domain,
      type: parsed.metadata.type,
      sectionCount,
      linkCount,
      totalLinks: linkCount,
      categories,
      technologies,
      qualityScore,
      completenessScore,
      discoveredAt: parsed.metadata.parsedAt,
      lastChecked: new Date(),
    };
  }

  private extractCategories(parsed: ParsedLLMsTxt): string[] {
    const categories: string[] = [];
    const categoryKeywords: Record<string, string[]> = {
      api: ['api', 'rest', 'graphql', 'endpoint'],
      documentation: ['docs', 'documentation', 'guide', 'tutorial'],
      code: ['code', 'source', 'example', 'snippet'],
      library: ['library', 'package', 'module', 'sdk'],
      framework: ['framework', 'toolkit', 'platform'],
    };

    const allText = [
      parsed.title,
      parsed.summary,
      parsed.context,
      ...parsed.sections.map((s) => s.name),
    ]
      .join(' ')
      .toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories;
  }

  private extractTechnologies(parsed: ParsedLLMsTxt): string[] {
    const technologies: string[] = [];
    const techPatterns = [
      /python/i,
      /javascript/i,
      /typescript/i,
      /java/i,
      /go/i,
      /react/i,
      /vue/i,
      /angular/i,
      /node/i,
      /docker/i,
      /kubernetes/i,
      /aws/i,
      /gcp/i,
      /azure/i,
    ];

    const allText = [
      parsed.title,
      parsed.summary,
      parsed.context,
      ...parsed.sections.flatMap((s) => [
        s.name,
        ...s.links.map((l) => l.name + ' ' + (l.description || '')),
      ]),
    ].join(' ');

    for (const pattern of techPatterns) {
      if (pattern.test(allText)) {
        const match = allText.match(pattern);
        if (match) {
          technologies.push(match[0].toLowerCase());
        }
      }
    }

    return [...new Set(technologies)];
  }

  private calculateQualityScore(parsed: ParsedLLMsTxt): number {
    let score = 0;

    // Наличие заголовка
    if (parsed.title && parsed.title !== 'Unknown') score += 20;

    // Наличие summary
    if (parsed.summary) score += 20;

    // Наличие контекста
    if (parsed.context) score += 10;

    // Количество секций
    if (parsed.sections.length >= 3) score += 20;
    else if (parsed.sections.length >= 1) score += 10;

    // Количество ссылок
    const totalLinks = parsed.sections.reduce(
      (sum, s) => sum + s.links.length,
      0
    );
    if (totalLinks >= 10) score += 20;
    else if (totalLinks >= 5) score += 10;
    else if (totalLinks >= 1) score += 5;

    // Валидность ссылок
    const validLinks = parsed.sections
      .flatMap((s) => s.links)
      .filter((l) => this.isValidUrl(l.url)).length;
    const linkValidityRatio = validLinks / totalLinks;
    score += linkValidityRatio * 10;

    return Math.min(score, 100);
  }

  private calculateCompletenessScore(parsed: ParsedLLMsTxt): number {
    let score = 0;

    // Все обязательные поля
    if (parsed.title) score += 25;
    if (parsed.summary) score += 25;
    if (parsed.sections.length > 0) score += 25;

    // Описания ссылок
    const linksWithDescriptions = parsed.sections
      .flatMap((s) => s.links)
      .filter((l) => l.description).length;
    const totalLinks = parsed.sections.reduce(
      (sum, s) => sum + s.links.length,
      0
    );
    if (totalLinks > 0) {
      score += (linksWithDescriptions / totalLinks) * 25;
    }

    return score;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## ⚙️ Часть 5: Реализация R2R Processing

### 5.1 R2R Ingestion Service

```typescript
// src/services/llms-txt/processor/r2rIngestion.ts
import { AdvancedIngestionService } from '../ingestion/advancedIngestion';
import { GeminiService } from '../gemini/geminiService';

export interface LLMsTxtIngestionConfig {
  // Ingestion mode
  mode: 'hi-res' | 'fast' | 'custom';

  // Custom config для llms.txt
  customConfig?: {
    chunking_strategy: 'by_section' | 'by_link' | 'recursive';
    preserve_structure: boolean;
    extract_links: boolean;
  };

  // Chunk enrichment
  enrichment?: {
    enabled: boolean;
    extractLinkContent: boolean; // Загружать содержимое ссылок
    useGemini: boolean;
  };

  // Metadata
  metadata?: {
    sourceType: 'llms.txt' | 'llms-full.txt';
    domain: string;
    categories: string[];
    technologies: string[];
  };
}

export class LLMsTxtR2RIngestionService {
  constructor(
    private r2rClient: r2rClient,
    private geminiService: GeminiService
  ) {}

  /**
   * Ingestion llms.txt в R2R
   */
  async ingestLLMsTxt(
    parsed: ParsedLLMsTxt,
    metadata: LLMsTxtMetadata,
    config: LLMsTxtIngestionConfig
  ) {
    // 1. Подготовка контента для ingestion
    const content = this.prepareContent(parsed, config);

    // 2. Создание файла для загрузки
    const file = new File(
      [content],
      `llms-txt-${metadata.domain}-${Date.now()}.txt`,
      { type: 'text/plain' }
    );

    // 3. Обогащение metadata
    const enrichedMetadata = {
      ...metadata,
      ...config.metadata,
      llms_txt_type: parsed.metadata.type,
      parsed_at: parsed.metadata.parsedAt.toISOString(),
      section_count: metadata.sectionCount,
      link_count: metadata.linkCount,
      categories: metadata.categories,
      technologies: metadata.technologies,
      quality_score: metadata.qualityScore,
    };

    // 4. Ingestion config
    const ingestionConfig: IngestionConfig = {
      mode: config.mode,
      customConfig: config.customConfig
        ? {
            chunking_strategy: this.mapChunkingStrategy(
              config.customConfig.chunking_strategy
            ),
            chunk_size: 1024,
            chunk_overlap: 512,
          }
        : undefined,
      chunkEnrichment: config.enrichment?.enabled
        ? {
            enabled: true,
            strategies: ['semantic', 'neighborhood'],
            generation_config: config.enrichment.useGemini
              ? this.geminiService.taskProfiles.ragGeneration
              : undefined,
          }
        : undefined,
      metadataExtraction: {
        enabled: true,
        useLLM: true,
        geminiModel: 'gemini-2.5-flash',
        thinkingBudget: 1024,
      },
    };

    // 5. Загрузка через Advanced Ingestion
    const ingestionService = new AdvancedIngestionService(this.r2rClient);
    return ingestionService.ingestDocument(
      file,
      ingestionConfig,
      enrichedMetadata,
      [this.getOrCreateCollection(metadata)]
    );
  }

  /**
   * Подготовка контента для ingestion
   */
  private prepareContent(
    parsed: ParsedLLMsTxt,
    config: LLMsTxtIngestionConfig
  ): string {
    let content = `# ${parsed.title}\n\n`;

    if (parsed.summary) {
      content += `> ${parsed.summary}\n\n`;
    }

    if (parsed.context) {
      content += `${parsed.context}\n\n`;
    }

    // Добавление секций
    for (const section of parsed.sections) {
      content += `## ${section.name}\n\n`;

      if (section.description) {
        content += `${section.description}\n\n`;
      }

      for (const link of section.links) {
        content += `[${link.name}](${link.url})`;
        if (link.description) {
          content += ` - ${link.description}`;
        }
        content += '\n';
      }

      content += '\n';
    }

    return content;
  }

  /**
   * Маппинг chunking strategy
   */
  private mapChunkingStrategy(
    strategy: 'by_section' | 'by_link' | 'recursive'
  ): 'recursive' | 'by_title' | 'by_page' {
    switch (strategy) {
      case 'by_section':
        return 'by_title';
      case 'by_link':
        return 'by_page';
      default:
        return 'recursive';
    }
  }

  /**
   * Получение или создание коллекции
   */
  private async getOrCreateCollection(
    metadata: LLMsTxtMetadata
  ): Promise<string> {
    // Поиск существующей коллекции
    const collections = await this.r2rClient.collections.list({
      filters: {
        name: { $eq: `LLMs.txt - ${metadata.domain}` },
      },
    });

    if (collections.results.length > 0) {
      return collections.results[0].id;
    }

    // Создание новой коллекции
    const newCollection = await this.r2rClient.collections.create({
      name: `LLMs.txt - ${metadata.domain}`,
      description: `LLMs.txt files from ${metadata.domain}`,
      metadata: {
        type: 'llms_txt',
        domain: metadata.domain,
        categories: metadata.categories,
      },
    });

    return newCollection.results.id;
  }

  /**
   * Batch ingestion нескольких llms.txt файлов
   */
  async batchIngest(
    items: Array<{ parsed: ParsedLLMsTxt; metadata: LLMsTxtMetadata }>,
    config: LLMsTxtIngestionConfig
  ) {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.ingestLLMsTxt(
          item.parsed,
          item.metadata,
          config
        );
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }
}
```

### 5.2 Link Content Fetcher

```typescript
// src/services/llms-txt/processor/linkContentFetcher.ts
export class LLMsTxtLinkContentFetcher {
  /**
   * Загрузка содержимого ссылок из llms.txt
   */
  async fetchLinkContents(
    links: LLMsTxtLink[],
    options?: {
      maxConcurrent?: number;
      timeout?: number;
      filterByType?: string[];
    }
  ): Promise<Map<string, string>> {
    const contents = new Map<string, string>();
    const maxConcurrent = options?.maxConcurrent || 5;

    // Фильтрация ссылок
    const filteredLinks = this.filterLinks(links, options?.filterByType);

    // Batch processing
    for (let i = 0; i < filteredLinks.length; i += maxConcurrent) {
      const batch = filteredLinks.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map((link) => this.fetchContent(link.url, options?.timeout))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          contents.set(batch[index].url, result.value);
        }
      });
    }

    return contents;
  }

  private async fetchContent(url: string, timeout = 10000): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'text/html, text/plain, text/markdown',
        },
      });

      if (response.ok) {
        return await response.text();
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private filterLinks(
    links: LLMsTxtLink[],
    allowedTypes?: string[]
  ): LLMsTxtLink[] {
    if (!allowedTypes) return links;

    return links.filter((link) => {
      const extension = link.url.split('.').pop()?.toLowerCase();
      return extension && allowedTypes.includes(extension);
    });
  }
}
```

---

## 📚 Часть 6: Реализация Catalog (Каталогизация)

### 6.1 Catalog Manager

```typescript
// src/services/llms-txt/catalog/catalogManager.ts
export interface LLMsTxtCatalogEntry {
  id: string;
  url: string;
  type: 'llms.txt' | 'llms-full.txt';
  metadata: LLMsTxtMetadata;
  r2rDocumentId?: string;
  r2rCollectionId?: string;
  status: 'discovered' | 'parsed' | 'ingested' | 'error';
  discoveredAt: Date;
  lastChecked: Date;
  lastUpdated?: Date;
}

export class LLMsTxtCatalogManager {
  private catalog: Map<string, LLMsTxtCatalogEntry> = new Map();

  constructor(private r2rClient: r2rClient) {}

  /**
   * Добавление записи в каталог
   */
  async addEntry(
    url: string,
    parsed: ParsedLLMsTxt,
    metadata: LLMsTxtMetadata,
    r2rDocumentId?: string
  ): Promise<LLMsTxtCatalogEntry> {
    const entry: LLMsTxtCatalogEntry = {
      id: this.generateId(url),
      url,
      type: metadata.type,
      metadata,
      r2rDocumentId,
      status: r2rDocumentId ? 'ingested' : 'parsed',
      discoveredAt: metadata.discoveredAt,
      lastChecked: new Date(),
    };

    this.catalog.set(entry.id, entry);
    await this.saveToDatabase(entry);

    return entry;
  }

  /**
   * Поиск в каталоге
   */
  search(query: {
    domain?: string;
    category?: string;
    technology?: string;
    status?: string;
    minQualityScore?: number;
  }): LLMsTxtCatalogEntry[] {
    let results = Array.from(this.catalog.values());

    if (query.domain) {
      results = results.filter((e) => e.metadata.domain === query.domain);
    }

    if (query.category) {
      results = results.filter((e) =>
        e.metadata.categories.includes(query.category!)
      );
    }

    if (query.technology) {
      results = results.filter((e) =>
        e.metadata.technologies.includes(query.technology!)
      );
    }

    if (query.status) {
      results = results.filter((e) => e.status === query.status);
    }

    if (query.minQualityScore) {
      results = results.filter(
        (e) => e.metadata.qualityScore >= query.minQualityScore!
      );
    }

    return results;
  }

  /**
   * Получение статистики каталога
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageQualityScore: number;
  } {
    const entries = Array.from(this.catalog.values());

    return {
      total: entries.length,
      byType: this.groupBy(entries, (e) => e.type),
      byStatus: this.groupBy(entries, (e) => e.status),
      byCategory: this.groupByFlat(entries, (e) => e.metadata.categories),
      averageQualityScore:
        entries.reduce((sum, e) => sum + e.metadata.qualityScore, 0) /
          entries.length || 0,
    };
  }

  private generateId(url: string): string {
    // Генерация ID из URL
    return Buffer.from(url).toString('base64').slice(0, 32);
  }

  private groupBy<T>(
    items: T[],
    keyFn: (item: T) => string
  ): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item);
      groups[key] = (groups[key] || 0) + 1;
    }
    return groups;
  }

  private groupByFlat<T>(
    items: T[],
    keyFn: (item: T) => string[]
  ): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const item of items) {
      const keys = keyFn(item);
      for (const key of keys) {
        groups[key] = (groups[key] || 0) + 1;
      }
    }
    return groups;
  }

  private async saveToDatabase(entry: LLMsTxtCatalogEntry): Promise<void> {
    // Сохранение в R2R как metadata document
    // или в отдельную БД
  }
}
```

---

## 🚀 Часть 7: Интеграция в R2R-Application

### 7.1 API Endpoints

```typescript
// src/pages/api/llms-txt/discover.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domains, githubRepos } = req.body;

  const crawler = new LLMsTxtWebCrawler(r2rClient);
  const results = await crawler.batchDiscover(domains || []);

  return res.status(200).json({ results });
}

// src/pages/api/llms-txt/process.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url, config } = req.body;

  // 1. Discovery
  const crawler = new LLMsTxtWebCrawler(r2rClient);
  const discovery = await crawler.checkUrl(url);

  if (discovery.status !== 'found') {
    return res.status(404).json({ error: 'File not found' });
  }

  // 2. Parsing
  const parser = new LLMsTxtParser();
  const parsed = parser.parse(discovery.content!, url);

  // 3. Metadata extraction
  const extractor = new LLMsTxtMetadataExtractor();
  const metadata = extractor.extract(parsed);

  // 4. Ingestion
  const ingestionService = new LLMsTxtR2RIngestionService(
    r2rClient,
    geminiService
  );
  const result = await ingestionService.ingestLLMsTxt(parsed, metadata, config);

  // 5. Cataloging
  const catalogManager = new LLMsTxtCatalogManager(r2rClient);
  await catalogManager.addEntry(url, parsed, metadata, result.results.id);

  return res.status(200).json({ success: true, result });
}
```

### 7.2 UI Components

```typescript
// src/components/llms-txt/LLMsTxtDiscovery.tsx
export const LLMsTxtDiscovery: React.FC = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const [results, setResults] = useState<LLMsTxtDiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDiscover = async () => {
    setLoading(true);
    const response = await fetch('/api/llms-txt/discover', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    });
    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div>
      {/* UI для discovery */}
    </div>
  );
};
```

---

## 📋 Часть 8: Roadmap реализации

### Phase 1: Discovery (1 неделя)

- [ ] Web Crawler для поиска llms.txt
- [ ] GitHub Scanner
- [ ] URL Validator
- [ ] Batch discovery

### Phase 2: Parser (1 неделя)

- [ ] LLMs.txt parser
- [ ] LLMs-full.txt parser
- [ ] Metadata extractor
- [ ] Link validator

### Phase 3: R2R Processing (1-2 недели)

- [ ] R2R Ingestion service
- [ ] Gemini integration
- [ ] Link content fetcher
- [ ] Batch processing

### Phase 4: Catalog (1 неделя)

- [ ] Catalog manager
- [ ] Search functionality
- [ ] Statistics
- [ ] Database integration

### Phase 5: UI & API (1 неделя)

- [ ] Discovery UI
- [ ] Processing UI
- [ ] Catalog UI
- [ ] API endpoints

### Phase 6: Testing & Optimization (1 неделя)

- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Documentation

---

## 🎯 Ключевые возможности

1. **Автоматический поиск** llms.txt файлов
2. **Парсинг и валидация** структурированных данных
3. **Gemini-оптимизированная обработка** через R2R
4. **Каталогизация** с поиском и фильтрацией
5. **Интеграция** с существующими планами

---

**Дата создания:** 2025-01-27  
**Версия:** 1.0  
**Фокус:** LLMs.txt Processing & R2R Integration
