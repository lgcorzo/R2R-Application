import { Link2, Loader2, Sparkles, FileText, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface UrlUploadTabProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  // Shared upload settings from parent
  renderCollectionsSelect?: React.ReactNode;
  renderQualitySelect?: React.ReactNode;
  renderMetadataFields?: React.ReactNode;
  // Callback to switch to file upload tab
  onSwitchToFileTab?: () => void;
}

interface ParsedSection {
  title: string;
  content: string;
  level: number;
}

export const UrlUploadTab: React.FC<UrlUploadTabProps> = ({
  onUpload,
  isUploading,
  renderCollectionsSelect,
  renderQualitySelect,
  renderMetadataFields,
  onSwitchToFileTab,
}) => {
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [autoSplit, setAutoSplit] = useState(false);
  const [useCorsProxy, setUseCorsProxy] = useState(false);
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isLlmsFullTxt = (urlString: string): boolean => {
    return (
      urlString.toLowerCase().includes('llms-full.txt') ||
      urlString.toLowerCase().includes('llms.txt')
    );
  };

  const parseMarkdownSections = (text: string): ParsedSection[] => {
    const lines = text.split('\n');

    // First pass: find the minimum header level (top level for this document)
    let minLevel = 6;
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        minLevel = Math.min(minLevel, level);
      }
    }

    // Second pass: split only by top-level headers
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Detect markdown headers (# Header, ## Header, etc.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        const level = headerMatch[1].length;

        // Only split on top-level headers (minLevel)
        if (level === minLevel) {
          // Save previous section if exists
          if (currentSection) {
            currentSection.content = currentContent.join('\n').trim();
            if (currentSection.content.length > 0) {
              sections.push(currentSection);
            }
          }

          // Start new section
          const title = headerMatch[2].trim();
          currentSection = {
            title,
            level,
            content: '',
          };
          currentContent = [line]; // Include header in content
        } else if (currentSection) {
          // Sub-header, add to current section
          currentContent.push(line);
        }
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
    }

    return sections;
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      setError('Пожалуйста, введите URL');
      return;
    }

    setIsFetching(true);
    setError(null);
    setParsedSections([]);

    try {
      // Fetch content from URL using CORS proxy or direct fetch
      let response: Response;
      const fetchUrl = useCorsProxy
        ? `https://corsproxy.io/?${encodeURIComponent(url)}`
        : url;

      try {
        response = await fetch(fetchUrl);
      } catch (fetchError: any) {
        // Check if it's a CORS error
        if (
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.name === 'TypeError'
        ) {
          const corsMessage = !useCorsProxy
            ? `CORS ошибка: Сервер ${new URL(url).hostname} не разрешает доступ из браузера. ` +
              `Попробуйте включить "Использовать CORS прокси" ниже или скачайте файл и загрузите через File Upload.`
            : `Не удалось загрузить файл через CORS прокси. Проверьте URL или скачайте файл и загрузите через File Upload.`;
          throw new Error(corsMessage);
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text')) {
        throw new Error('URL должен указывать на текстовый файл');
      }

      const text = await response.text();

      // Check if auto-split is enabled and it's llms-full.txt
      if (autoSplit && isLlmsFullTxt(url)) {
        const sections = parseMarkdownSections(text);

        if (sections.length === 0) {
          throw new Error('Не удалось найти заголовки для разбиения файла');
        }

        setParsedSections(sections);
      } else {
        // Single document upload
        setParsedSections([
          {
            title: new URL(url).pathname.split('/').pop() || 'document',
            content: text,
            level: 1,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching URL:', err);
      setError(err.message || 'Не удалось загрузить файл по ссылке');
      setParsedSections([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpload = () => {
    if (parsedSections.length === 0) {
      setError('Нет данных для загрузки');
      return;
    }

    try {
      // Convert sections to File objects
      const files: File[] = parsedSections.map((section, index) => {
        const blob = new Blob([section.content], { type: 'text/plain' });

        // Create filename from section title
        const sanitizedTitle = section.title
          .replace(/[^a-zA-Z0-9_\-\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase()
          .substring(0, 50);

        const filename =
          parsedSections.length > 1
            ? `${sanitizedTitle}_part${index + 1}.txt`
            : `${sanitizedTitle}.txt`;

        return new File([blob], filename, { type: 'text/plain' });
      });

      // Call onUpload with files
      onUpload(files);

      // Reset state after adding files
      setUrl('');
      setParsedSections([]);
      setAutoSplit(false);
      setError(null);

      // Switch to file tab to show the added files
      if (onSwitchToFileTab) {
        onSwitchToFileTab();
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке документа');
    }
  };

  const shouldShowAutoSplit = isLlmsFullTxt(url);

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url-input" className="text-sm font-medium">
          URL документа
        </Label>
        <div className="flex gap-2">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/document.txt"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isFetching || isUploading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isFetching && !isUploading) {
                handleFetchUrl();
              }
            }}
          />
          <Button
            onClick={handleFetchUrl}
            disabled={isFetching || isUploading || !url.trim()}
            variant="secondary"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Загрузить
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Поддерживаются прямые ссылки на текстовые файлы (.txt, .md).{' '}
          <strong>Важно:</strong> URL должен разрешать CORS или используйте{' '}
          <a
            href="https://corsproxy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            CORS прокси
          </a>
          .
        </p>
      </div>

      {/* CORS Proxy toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-sm font-medium">Использовать CORS прокси</div>
            <div className="text-xs text-muted-foreground">
              Обход CORS ограничений через corsproxy.io
            </div>
          </div>
        </div>
        <Switch
          checked={useCorsProxy}
          onCheckedChange={setUseCorsProxy}
          disabled={isFetching || isUploading}
        />
      </div>

      {/* Auto-split toggle (shown only for llms-full.txt) */}
      {shouldShowAutoSplit && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">
                Автоматическое разбиение по заголовкам
              </div>
              <div className="text-xs text-muted-foreground">
                Файл будет разбит на отдельные документы по заголовкам
              </div>
            </div>
          </div>
          <Switch
            checked={autoSplit}
            onCheckedChange={setAutoSplit}
            disabled={isFetching || isUploading}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Collections Selection */}
      {renderCollectionsSelect && (
        <div className="space-y-2">{renderCollectionsSelect}</div>
      )}

      {/* Quality Selection */}
      {renderQualitySelect && (
        <div className="space-y-2">{renderQualitySelect}</div>
      )}

      {/* Metadata Fields */}
      {renderMetadataFields && (
        <div className="space-y-2">{renderMetadataFields}</div>
      )}

      {/* Preview Sections */}
      {parsedSections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Предварительный просмотр
            </Label>
            <Badge variant="secondary">
              {parsedSections.length}{' '}
              {parsedSections.length === 1 ? 'документ' : 'документов'}
            </Badge>
          </div>

          <ScrollArea className="h-32 max-h-32 rounded-md border p-3">
            <div className="space-y-2">
              {parsedSections.slice(0, 50).map((section, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {section.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {section.content.length} символов
                      {autoSplit && ` • Уровень ${section.level}`}
                    </div>
                  </div>
                </div>
              ))}
              {parsedSections.length > 50 && (
                <div className="text-xs text-muted-foreground text-center py-2 border-t">
                  ... и ещё {parsedSections.length - 50} документов
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Upload Button */}
      {parsedSections.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Загрузка в R2R...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Загрузить {parsedSections.length}{' '}
              {parsedSections.length === 1 ? 'документ' : 'документов'}
            </>
          )}
        </Button>
      )}
    </div>
  );
};
