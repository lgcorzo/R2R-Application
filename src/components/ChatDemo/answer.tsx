import { FC } from 'react';
import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';

import { AgentActivityIndicator } from '@/components/ChatDemo/AgentActivityIndicator';
import { CodeBlock } from '@/components/ChatDemo/CodeBlock';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ChatDemo/popover';
import { Skeleton } from '@/components/ChatDemo/skeleton';
import { SearchResults } from '@/components/SearchResults';
import { Logo } from '@/components/shared/Logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Message } from '@/types';
import { VectorSearchResult, KGSearchResult } from '@/types';

function formatMarkdownNewLines(markdown: string) {
  return markdown
    .replace(/\[(\d+)]/g, '[$1]($1)')
    .split(`"queries":`)[0]
    .replace(/\\u[\dA-F]{4}/gi, (match: string) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

function sanitizeStreamingMarkdown(
  markdown: string,
  isStreaming: boolean
): string {
  if (!isStreaming) return markdown;

  // Удаляем незакрытые inline-код элементы в конце при стриминге
  const backtickCount = (markdown.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    // Нечетное количество backticks - добавляем закрывающий
    return markdown + '`';
  }

  return markdown;
}

interface Source extends VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    title?: string;
    text?: string;
    documentid?: string;
    snippet?: string;
  };
}

const parseVectorSearchSources = (sources: string | object): Source[] => {
  if (typeof sources === 'string') {
    try {
      const parsedData = JSON.parse(sources);
      // Handle the new SSE format where results are in data.chunk_search_results
      if (parsedData.data && parsedData.data.chunk_search_results) {
        return parsedData.data.chunk_search_results;
      }
      return parsedData;
    } catch (error) {
      console.error('Failed to parse vector sources:', error);
      return [];
    }
  }
  return sources as Source[];
};

const parseKGSearchResults = (sources: string | object): KGSearchResult[] => {
  if (typeof sources === 'string') {
    try {
      const parsedData = JSON.parse(sources);
      // Handle the new SSE format where results are in data.graph_search_results
      if (parsedData.data && parsedData.data.graph_search_results) {
        return parsedData.data.graph_search_results;
      }
      // If the data is directly an array
      if (Array.isArray(parsedData)) {
        return parsedData;
      }
      return [];
    } catch (error) {
      console.error('Failed to parse KG sources:', error);
      return [];
    }
  }
  return [];
};

const SourceInfo: React.FC<{
  isSearching: boolean;
  sourcesCount: number | null;
}> = ({ isSearching, sourcesCount }) => (
  <div className="flex items-center justify-between w-full">
    <Logo width={50} height={50} disableLink={true} />
    {isSearching ? (
      <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
        <Spinner className="h-3 w-3" />
        <span className="text-sm">Searching over sources...</span>
      </Badge>
    ) : sourcesCount !== null && sourcesCount > 0 ? (
      <Badge variant="outline" className="px-3 py-1">
        <span className="text-sm">View {sourcesCount} Sources</span>
      </Badge>
    ) : null}
  </div>
);

export const Answer: FC<{
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
}> = ({ message, isStreaming, isSearching }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedVectorSources, setParsedVectorSources] = useState<Source[]>([]);
  const [parsedEntities, setParsedEntities] = useState<KGSearchResult[]>([]);
  const [parsedCommunities, setParsedCommunities] = useState<KGSearchResult[]>(
    []
  );
  const [sourcesCount, setSourcesCount] = useState<number | null>(null);

  useEffect(() => {
    if (message.sources) {
      let count = 0;

      if (message.sources.vector) {
        const parsed = parseVectorSearchSources(message.sources.vector);
        setParsedVectorSources(parsed);
        count += parsed.length;
      }

      if (message.sources.kg) {
        console.log('message.sources.kg', message.sources.kg);
        const kgResults = parseKGSearchResults(message.sources.kg);

        // Only attempt to filter if kgResults is an array
        if (Array.isArray(kgResults)) {
          const entitiesArray = kgResults.filter(
            (item: any) => item.result_type === 'entity'
          );
          const communitiesArray = kgResults.filter(
            (item: any) => item.result_type === 'community'
          );

          setParsedEntities(entitiesArray);
          setParsedCommunities(communitiesArray);
          count += entitiesArray.length + communitiesArray.length;
        } else {
          console.warn('KG search results is not an array:', kgResults);
          setParsedEntities([]);
          setParsedCommunities([]);
        }
      }

      setSourcesCount(count > 0 ? count : null);
    } else {
      setSourcesCount(null);
    }
  }, [message.sources]);

  const AnimatedEllipsis: FC = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
      }, 200);

      return () => clearInterval(interval);
    }, []);

    return (
      <span
        style={{
          color: 'white',
          display: 'inline-block',
          width: '1em',
          height: '1em',
          textAlign: 'left',
        }}
      >
        {dots}
      </span>
    );
  };

  const renderContent = () => {
    const paragraphs = message.content.split('\n\n');
    return paragraphs.map((paragraph, index) => {
      try {
        return (
          <Markdown
            key={index}
            components={{
              h1: (props) => <h1 className="white" {...props} />,
              h2: (props) => <h2 className="white" {...props} />,
              h3: (props) => <h3 style={{ color: 'white' }} {...props} />,
              h4: (props) => <h4 style={{ color: 'white' }} {...props} />,
              h5: (props) => <h5 style={{ color: 'white' }} {...props} />,
              h6: (props) => <h6 style={{ color: 'white' }} {...props} />,
              strong: (props) => (
                <strong
                  style={{ color: 'white', fontWeight: 'bold' }}
                  {...props}
                />
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-7 text-white">
                  {children}
                  {isStreaming && index === paragraphs.length - 1 && (
                    <AnimatedEllipsis />
                  )}
                </p>
              ),
              li: (props) => <li style={{ color: 'white' }} {...props} />,
              blockquote: (props) => (
                <blockquote style={{ color: 'white' }} {...props} />
              ),
              em: (props) => <em style={{ color: 'white' }} {...props} />,

              code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : undefined;
                const codeString = String(children).replace(/\n$/, '');

                // Код в тройных обратных кавычках (даже однострочный) -> CodeBlock
                // Inline код в одинарных кавычках -> inline элемент
                if (!inline && className) {
                  return (
                    <CodeBlock
                      code={codeString}
                      language={language}
                      className="my-6"
                    />
                  );
                }

                // Inline код
                return (
                  <code
                    className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },

              pre: ({ children }: any) => {
                // Extract code element if exists
                if (children?.type === 'code') {
                  return <>{children}</>;
                }
                return <pre style={{ color: 'white' }}>{children}</pre>;
              },

              a: ({ href, ...props }) => {
                if (!href) return null;
                let source: Source | KGSearchResult | null = null;
                let isKGElement = false;

                if (+href - 1 < parsedVectorSources.length) {
                  source = parsedVectorSources[+href - 1];
                } else if (
                  +href - 1 >= parsedVectorSources.length &&
                  +href - 1 < parsedVectorSources.length + parsedEntities.length
                ) {
                  source =
                    parsedEntities[+href - parsedVectorSources.length - 1];
                  isKGElement = true;
                } else if (
                  +href - 1 >=
                  parsedVectorSources.length + parsedEntities.length
                ) {
                  source =
                    parsedCommunities[
                      +href -
                        parsedVectorSources.length -
                        parsedEntities.length -
                        1
                    ];
                  isKGElement = true;
                }
                if (!source) return null;

                const metadata = isKGElement
                  ? (source as KGSearchResult).content
                  : (source as Source).metadata;
                const title = isKGElement ? metadata.name : metadata.title;
                const description = isKGElement
                  ? metadata.description
                  : (source as Source).text;
                return (
                  <span className="inline-block w-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <span
                          title={title}
                          className="inline-block cursor-pointer transform scale-[60%] no-underline font-medium w-6 text-center h-6 rounded-full origin-top-left"
                          style={{ background: 'var(--popover)' }}
                        >
                          {href}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="max-w-screen-md flex flex-col gap-2 bg-zinc-800 shadow-transparent ring-zinc-600 border-zinc-600 ring-4 text-xs"
                      >
                        {!isKGElement && metadata?.documentid && (
                          <div className="text-zinc-200 font-medium border-b border-zinc-600 pb-1">
                            DocumentId: {metadata.documentid}
                          </div>
                        )}
                        <div className="text-zinc-200 text-ellipsis overflow-hidden whitespace-nowrap font-medium">
                          {title ? `Title: ${title}` : ''}
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 max-h-[200px] overflow-y-auto pr-2">
                            {isKGElement && (metadata as any).summary && (
                              <div className="text-zinc-300 break-words mb-2">
                                <strong>Summary:</strong>{' '}
                                {(metadata as any).summary}
                              </div>
                            )}
                            {!isKGElement && (
                              <div className="text-zinc-300 break-words mb-2">
                                {metadata?.snippet ?? ''}
                              </div>
                            )}
                            <div className="text-zinc-300 break-words">
                              {description ?? ''}
                            </div>
                            {isKGElement && (metadata as any).impact_rating && (
                              <div className="text-zinc-300 break-words mt-2">
                                <strong>Impact Rating:</strong>{' '}
                                {(metadata as any).impact_rating}
                              </div>
                            )}
                            {isKGElement &&
                              (metadata as any).rating_explanation && (
                                <div className="text-zinc-300 break-words mt-2">
                                  <strong>Rating Explanation:</strong>{' '}
                                  {(metadata as any).rating_explanation}
                                </div>
                              )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </span>
                );
              },
            }}
          >
            {formatMarkdownNewLines(
              sanitizeStreamingMarkdown(
                paragraph,
                isStreaming && index === paragraphs.length - 1
              )
            )}
          </Markdown>
        );
      } catch (error) {
        console.error('Markdown rendering error:', error);
        // Fallback для незавершенного markdown при стриминге
        return (
          <p key={index} style={{ color: 'white' }}>
            {paragraph}
            {isStreaming && index === paragraphs.length - 1 && (
              <AnimatedEllipsis />
            )}
          </p>
        );
      }
    });
  };
  return (
    <div className="mt-4">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        onValueChange={(value) => setIsOpen(value === 'answer')}
      >
        <AccordionItem value="answer">
          <AccordionTrigger className="py-2 text-lg font-bold text-zinc-200 hover:no-underline text-white">
            <SourceInfo isSearching={isSearching} sourcesCount={sourcesCount} />
          </AccordionTrigger>
          <AccordionContent>
            {!isSearching && sourcesCount !== null && sourcesCount > 0 && (
              <SearchResults
                vectorSearchResults={parsedVectorSources}
                entities={parsedEntities}
                communities={parsedCommunities}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Separator between sources and activities */}
      {message.activities && message.activities.length > 0 && (
        <>
          <Separator className="my-4 bg-zinc-700" />
          <AgentActivityIndicator
            activities={message.activities}
            isActive={isStreaming}
          />
        </>
      )}

      {/* Separator between activities and content */}
      {message.activities &&
        message.activities.length > 0 &&
        message.content && <Separator className="my-4 bg-zinc-700" />}

      <div className="space-y-4 mt-4">
        {message.content || isStreaming ? (
          <ScrollArea className="max-h-[700px] rounded-lg">
            <div className="prose prose-sm max-w-full text-zinc-300 prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white p-4">
              {message.content ? (
                renderContent()
              ) : (
                <div
                  style={{
                    color: 'white',
                    display: 'inline-block',
                    width: '1em',
                    height: '1em',
                  }}
                >
                  <AnimatedEllipsis />
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
            <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
            <Skeleton className="max-w-xl h-4 bg-zinc-200" />
          </div>
        )}
      </div>
    </div>
  );
};
