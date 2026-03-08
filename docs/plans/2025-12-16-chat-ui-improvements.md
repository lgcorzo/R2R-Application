     STDIN
   1 # Chat UI Improvements Implementation Plan
   2 
   3 > **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
   4 
   5 **Goal:** Улучшить интерфейс чата с использованием shadcn/ui компонентов для блоков размышления агента, отображения кода с возможностью копирования и улучшенного вывода ответов
   6 
   7 **Architecture:** Создать новые компоненты на основе shadcn/ui (Alert, Collapsible, Separator) для отображения агентской активности, кодовых блоков и структурированного вывода. Использовать существующий компонент CopyableContent как основу для кнопки копирования.
   8 
   9 **Tech Stack:** React 18, TypeScript, shadcn/ui (Radix UI primitives), react-markdown, Next.js 14.2.5
  10 
  11 ---
  12 
  13 ## Task 1: Создать компонент ThinkingBlock для блоков размышления
  14 
  15 **Files:**
  16 - Create: `src/components/ChatDemo/ThinkingBlock.tsx`
  17 
  18 **Step 1: Написать компонент ThinkingBlock**
  19 
  20 ```tsx
  21 import { Brain } from 'lucide-react';
  22 import React from 'react';
  23 
  24 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
  25 import {
  26   Collapsible,
  27   CollapsibleContent,
  28   CollapsibleTrigger,
  29 } from '@/components/ui/collapsible';
  30 import { Button } from '@/components/ui/button';
  31 import { ChevronDown } from 'lucide-react';
  32 
  33 interface ThinkingBlockProps {
  34   content: string;
  35   timestamp?: number;
  36   isActive?: boolean;
  37 }
  38 
  39 export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  40   content,
  41   timestamp,
  42   isActive = false,
  43 }) => {
  44   const [isOpen, setIsOpen] = React.useState(false);
  45 
  46   return (
  47     <Alert className={`bg-purple-500/10 border-purple-500/20 ${isActive ? 'animate-pulse' : ''}`}>
  48       <Brain className="h-4 w-4 text-purple-400" />
  49       <AlertTitle className="text-purple-300 mb-2">
  50         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
  51           <div className="flex items-center justify-between">
  52             <span>Agent Thinking</span>
  53             <CollapsibleTrigger asChild>
  54               <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
  55                 <ChevronDown
  56                   className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
  57                 />
  58                 <span className="sr-only">Toggle thinking details</span>
  59               </Button>
  60             </CollapsibleTrigger>
  61           </div>
  62           <CollapsibleContent>
  63             <AlertDescription className="text-purple-200 mt-2 text-sm whitespace-pre-wrap">
  64               {content}
  65             </AlertDescription>
  66             {timestamp && (
  67               <div className="text-xs text-purple-400/60 mt-1">
  68                 {new Date(timestamp).toLocaleTimeString()}
  69               </div>
  70             )}
  71           </CollapsibleContent>
  72         </Collapsible>
  73       </AlertTitle>
  74     </Alert>
  75   );
  76 };
  77 ```
  78 
  79 **Step 2: Проверить импорты компонентов**
  80 
  81 Run: `grep -r "export.*Alert" src/components/ui/`
  82 Expected: Найти экспорты Alert, AlertDescription, AlertTitle
  83 
  84 **Step 3: Commit**
  85 
  86 ```bash
  87 git add src/components/ChatDemo/ThinkingBlock.tsx
  88 git commit -m "feat: добавлен компонент ThinkingBlock для блоков размышления агента"
  89 ```
  90 
  91 ---
  92 
  93 ## Task 2: Создать компонент CodeBlock с кнопкой копирования
  94 
  95 **Files:**
  96 - Create: `src/components/ChatDemo/CodeBlock.tsx`
  97 
  98 **Step 1: Написать компонент CodeBlock**
  99 
 100 ```tsx
 101 import { Check, Copy } from 'lucide-react';
 102 import React, { useState } from 'react';
 103 
 104 import { Button } from '@/components/ui/button';
 105 import { Separator } from '@/components/ui/separator';
 106 import { useToast } from '@/components/ui/use-toast';
 107 
 108 interface CodeBlockProps {
 109   code: string;
 110   language?: string;
 111   className?: string;
 112 }
 113 
 114 export const CodeBlock: React.FC<CodeBlockProps> = ({
 115   code,
 116   language,
 117   className,
 118 }) => {
 119   const [copied, setCopied] = useState(false);
 120   const { toast } = useToast();
 121 
 122   const handleCopy = async () => {
 123     try {
 124       await navigator.clipboard.writeText(code);
 125       setCopied(true);
 126       toast({
 127         title: 'Copied to clipboard',
 128         description: 'Code has been copied successfully',
 129       });
 130       setTimeout(() => setCopied(false), 2000);
 131     } catch (err) {
 132       console.error('Failed to copy:', err);
 133       toast({
 134         title: 'Failed to copy',
 135         description: 'Could not copy code to clipboard',
 136         variant: 'destructive',
 137       });
 138     }
 139   };
 140 
 141   return (
 142     <div className="relative group rounded-lg border border-zinc-700 bg-zinc-900 my-4">
 143       {/* Header with language and copy button */}
 144       <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
 145         <span className="text-xs text-zinc-400 font-mono uppercase">
 146           {language || 'code'}
 147         </span>
 148         <Button
 149           variant="ghost"
 150           size="sm"
 151           onClick={handleCopy}
 152           className="h-8 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
 153         >
 154           {copied ? (
 155             <>
 156               <Check className="h-4 w-4 mr-1" />
 157               <span className="text-xs">Copied</span>
 158             </>
 159           ) : (
 160             <>
 161               <Copy className="h-4 w-4 mr-1" />
 162               <span className="text-xs">Copy</span>
 163             </>
 164           )}
 165         </Button>
 166       </div>
 167 
 168       {/* Code content */}
 169       <pre className={`p-4 overflow-x-auto ${className || ''}`}>
 170         <code className="text-sm text-zinc-200 font-mono">{code}</code>
 171       </pre>
 172     </div>
 173   );
 174 };
 175 ```
 176 
 177 **Step 2: Проверить существование ui/separator**
 178 
 179 Run: `ls -la src/components/ui/separator.tsx`
 180 Expected: Файл существует
 181 
 182 **Step 3: Commit**
 183 
 184 ```bash
 185 git add src/components/ChatDemo/CodeBlock.tsx
 186 git commit -m "feat: добавлен компонент CodeBlock с кнопкой копирования"
 187 ```
 188 
 189 ---
 190 
 191 ## Task 3: Интегрировать ThinkingBlock в AgentActivityIndicator
 192 
 193 **Files:**
 194 - Modify: `src/components/ChatDemo/AgentActivityIndicator.tsx:99-130`
 195 
 196 **Step 1: Импортировать ThinkingBlock**
 197 
 198 В начало файла `src/components/ChatDemo/AgentActivityIndicator.tsx` добавить:
 199 
 200 ```tsx
 201 import { ThinkingBlock } from '@/components/ChatDemo/ThinkingBlock';
 202 ```
 203 
 204 **Step 2: Заменить отображение thinking активностей**
 205 
 206 Найти строку 103-128 в `AgentActivityIndicator.tsx` и заменить:
 207 
 208 ```tsx
 209 // Before
 210 <div
 211   key={`${activity.type}-${index}`}
 212   className={`p-3 rounded-lg ${style.bgColor}`}
 213 >
 214   <div className="flex items-start gap-2">
 215     <div className={`mt-0.5 ${style.textColor}`}>
 216       {style.icon}
 217     </div>
 218     <div className="flex-1">
 219       <div className="flex items-center gap-2 mb-1">
 220         <span
 221           className={`text-xs font-semibold uppercase ${style.textColor}`}
 222         >
 223           {style.label}
 224         </span>
 225         <span className="text-xs text-zinc-500">
 226           {new Date(activity.timestamp).toLocaleTimeString()}
 227         </span>
 228       </div>
 229       <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
 230         {activity.content}
 231       </p>
 232     </div>
 233   </div>
 234 </div>
 235 
 236 // After
 237 {activity.type === 'thinking' ? (
 238   <ThinkingBlock
 239     key={`${activity.type}-${index}`}
 240     content={activity.content}
 241     timestamp={activity.timestamp}
 242     isActive={isActive && index === activities.length - 1}
 243   />
 244 ) : (
 245   <div
 246     key={`${activity.type}-${index}`}
 247     className={`p-3 rounded-lg ${style.bgColor}`}
 248   >
 249     <div className="flex items-start gap-2">
 250       <div className={`mt-0.5 ${style.textColor}`}>
 251         {style.icon}
 252       </div>
 253       <div className="flex-1">
 254         <div className="flex items-center gap-2 mb-1">
 255           <span
 256             className={`text-xs font-semibold uppercase ${style.textColor}`}
 257           >
 258             {style.label}
 259           </span>
 260           <span className="text-xs text-zinc-500">
 261             {new Date(activity.timestamp).toLocaleTimeString()}
 262           </span>
 263         </div>
 264         <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
 265           {activity.content}
 266         </p>
 267       </div>
 268     </div>
 269   </div>
 270 )}
 271 ```
 272 
 273 **Step 3: Проверить компиляцию**
 274 
 275 Run: `pnpm build`
 276 Expected: Компиляция завершается успешно без ошибок TypeScript
 277 
 278 **Step 4: Commit**
 279 
 280 ```bash
 281 git add src/components/ChatDemo/AgentActivityIndicator.tsx
 282 git commit -m "feat: интегрирован ThinkingBlock в AgentActivityIndicator"
 283 ```
 284 
 285 ---
 286 
 287 ## Task 4: Интегрировать CodeBlock в Answer компонент через react-markdown
 288 
 289 **Files:**
 290 - Modify: `src/components/ChatDemo/answer.tsx:184-210`
 291 
 292 **Step 1: Импортировать CodeBlock**
 293 
 294 В начало файла `src/components/ChatDemo/answer.tsx` добавить:
 295 
 296 ```tsx
 297 import { CodeBlock } from '@/components/ChatDemo/CodeBlock';
 298 ```
 299 
 300 **Step 2: Добавить кастомные компоненты для кода в Markdown**
 301 
 302 В функции `renderContent()`, в объекте `components` Markdown компонента (строка 186), добавить обработчики для кода:
 303 
 304 ```tsx
 305 components={{
 306   h1: (props) => <h1 className="white" {...props} />,
 307   h2: (props) => <h2 className="white" {...props} />,
 308   h3: (props) => <h3 style={{ color: 'white' }} {...props} />,
 309   h4: (props) => <h4 style={{ color: 'white' }} {...props} />,
 310   h5: (props) => <h5 style={{ color: 'white' }} {...props} />,
 311   h6: (props) => <h6 style={{ color: 'white' }} {...props} />,
 312   strong: (props) => (
 313     <strong style={{ color: 'white', fontWeight: 'bold' }} {...props} />
 314   ),
 315   p: ({ children }) => (
 316     <p style={{ color: 'white', display: 'inline' }}>
 317       {children}
 318       {isStreaming && index === paragraphs.length - 1 && (
 319         <AnimatedEllipsis />
 320       )}
 321     </p>
 322   ),
 323   li: (props) => <li style={{ color: 'white' }} {...props} />,
 324   blockquote: (props) => (
 325     <blockquote style={{ color: 'white' }} {...props} />
 326   ),
 327   em: (props) => <em style={{ color: 'white' }} {...props} />,
 328 
 329   // NEW: Replace inline code rendering
 330   code: ({ node, inline, className, children, ...props }: any) => {
 331     const match = /language-(\w+)/.exec(className || '');
 332     const language = match ? match[1] : undefined;
 333     const codeString = String(children).replace(/\n$/, '');
 334 
 335     if (!inline && codeString) {
 336       return (
 337         <CodeBlock
 338           code={codeString}
 339           language={language}
 340           className="my-4"
 341         />
 342       );
 343     }
 344 
 345     return (
 346       <code
 347         className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-sm"
 348         {...props}
 349       >
 350         {children}
 351       </code>
 352     );
 353   },
 354 
 355   // NEW: Replace pre rendering to work with CodeBlock
 356   pre: ({ children }: any) => {
 357     // Extract code element if exists
 358     if (children?.type === 'code') {
 359       return <>{children}</>;
 360     }
 361     return <pre style={{ color: 'white' }}>{children}</pre>;
 362   },
 363 
 364   a: ({ href, ...props }) => {
 365     // ... existing link handling code ...
 366   },
 367 }}
 368 ```
 369 
 370 **Step 3: Проверить компиляцию**
 371 
 372 Run: `pnpm build`
 373 Expected: Компиляция завершается успешно
 374 
 375 **Step 4: Протестировать в браузере**
 376 
 377 1. Run: `pnpm dev`
 378 2. Открыть http://localhost:3005/chat
 379 3. Задать вопрос агенту, который вернет код
 380 4. Expected: Кодовый блок отображается с кнопкой Copy
 381 
 382 **Step 5: Commit**
 383 
 384 ```bash
 385 git add src/components/ChatDemo/answer.tsx
 386 git commit -m "feat: интегрирован CodeBlock в Markdown рендеринг ответов"
 387 ```
 388 
 389 ---
 390 
 391 ## Task 5: Улучшить структуру вывода ответа с использованием Separator
 392 
 393 **Files:**
 394 - Modify: `src/components/ChatDemo/answer.tsx:310-340`
 395 
 396 **Step 1: Импортировать Separator**
 397 
 398 В начало файла `src/components/ChatDemo/answer.tsx` добавить:
 399 
 400 ```tsx
 401 import { Separator } from '@/components/ui/separator';
 402 ```
 403 
 404 **Step 2: Добавить визуальное разделение секций**
 405 
 406 Найти return блок компонента Answer (строка 310) и добавить Separator между секциями:
 407 
 408 ```tsx
 409 return (
 410   <div className="mt-4">
 411     <Accordion
 412       type="single"
 413       collapsible
 414       className="w-full"
 415       onValueChange={(value) => setIsOpen(value === 'answer')}
 416     >
 417       <AccordionItem value="answer">
 418         <AccordionTrigger className="py-2 text-lg font-bold text-zinc-200 hover:no-underline text-white">
 419           <SourceInfo isSearching={isSearching} sourcesCount={sourcesCount} />
 420         </AccordionTrigger>
 421         <AccordionContent>
 422           {!isSearching && sourcesCount !== null && sourcesCount > 0 && (
 423             <SearchResults
 424               vectorSearchResults={parsedVectorSources}
 425               entities={parsedEntities}
 426               communities={parsedCommunities}
 427             />
 428           )}
 429         </AccordionContent>
 430       </AccordionItem>
 431     </Accordion>
 432 
 433     {/* Separator between sources and activities */}
 434     {message.activities && message.activities.length > 0 && (
 435       <>
 436         <Separator className="my-4 bg-zinc-700" />
 437         <AgentActivityIndicator
 438           activities={message.activities}
 439           isActive={isStreaming}
 440         />
 441       </>
 442     )}
 443 
 444     {/* Separator between activities and content */}
 445     {message.activities && message.activities.length > 0 && message.content && (
 446       <Separator className="my-4 bg-zinc-700" />
 447     )}
 448 
 449     <div className="space-y-4 mt-4">
 450       {message.content || isStreaming ? (
 451         <ScrollArea className="max-h-[700px] rounded-lg">
 452           <div className="prose prose-sm max-w-full text-zinc-300 prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white p-4">
 453             {message.content ? (
 454               renderContent()
 455             ) : (
 456               <div
 457                 style={{
 458                   color: 'white',
 459                   display: 'inline-block',
 460                   width: '1em',
 461                   height: '1em',
 462                 }}
 463               >
 464                 <AnimatedEllipsis />
 465               </div>
 466             )}
 467           </div>
 468         </ScrollArea>
 469       ) : (
 470         <div className="flex flex-col gap-2">
 471           <Skeleton className="max-w-lg h-4 bg-zinc-200" />
 472           <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
 473           <Skeleton className="max-w-lg h-4 bg-zinc-200" />
 474           <Skeleton className="max-w-xl h-4 bg-zinc-200" />
 475         </div>
 476       )}
 477     </div>
 478   </div>
 479 );
 480 ```
 481 
 482 **Step 3: Проверить компиляцию**
 483 
 484 Run: `pnpm build`
 485 Expected: Компиляция завершается успешно
 486 
 487 **Step 4: Commit**
 488 
 489 ```bash
 490 git add src/components/ChatDemo/answer.tsx
 491 git commit -m "feat: добавлены визуальные разделители между секциями ответа"
 492 ```
 493 
 494 ---
 495 
 496 ## Task 6: Финальное тестирование и улучшение стилей
 497 
 498 **Files:**
 499 - Modify: `src/components/ChatDemo/ThinkingBlock.tsx` (if needed)
 500 - Modify: `src/components/ChatDemo/CodeBlock.tsx` (if needed)
 501 
 502 **Step 1: Запустить dev сервер и протестировать все компоненты**
 503 
 504 Run: `pnpm dev`
 505 
 506 **Step 2: Протестировать сценарии:**
 507 
 508 1. Открыть http://localhost:3005/chat
 509 2. Задать вопрос агенту который вызовет thinking блоки
 510 3. Expected: Thinking блоки отображаются с иконкой Brain, сворачиваются/разворачиваются
 511 4. Задать вопрос который вернет код (например "write a python function")
 512 5. Expected: Код отображается в CodeBlock с кнопкой Copy
 513 6. Нажать кнопку Copy
 514 7. Expected: Код копируется в буфер обмена, toast уведомление появляется
 515 8. Проверить что separators видны между секциями
 516 9. Expected: Визуальное разделение между sources, activities, content
 517 
 518 **Step 3: Улучшить стили если нужно**
 519 
 520 Если в процессе тестирования обнаружены проблемы со стилями:
 521 
 522 - Отрегулировать цвета в ThinkingBlock
 523 - Отрегулировать padding/margin в CodeBlock
 524 - Отрегулировать толщину Separator
 525 
 526 **Step 4: Финальный commit**
 527 
 528 ```bash
 529 git add .
 530 git commit -m "style: финальные улучшения стилей компонентов чата"
 531 ```
 532 
 533 ---
 534 
 535 ## Task 7: Обновить типы если необходимо
 536 
 537 **Files:**
 538 - Check: `src/types.ts` (строка 247-265)
 539 
 540 **Step 1: Проверить что типы Message и AgentActivity полные**
 541 
 542 Run: `grep -A 20 "export interface Message" src/types.ts`
 543 
 544 Expected:
 545 ```typescript
 546 export interface Message {
 547   role: 'user' | 'assistant';
 548   content: string;
 549   id: string;
 550   timestamp: number;
 551   sources?: {
 552     vector?: string | null;
 553     kg?: string | null;
 554   };
 555   isStreaming?: boolean;
 556   searchPerformed?: boolean;
 557   activities?: AgentActivity[];
 558 }
 559 ```
 560 
 561 **Step 2: Если нужно добавить дополнительные поля**
 562 
 563 Если обнаружится что нужны дополнительные поля (например для metadata кода), добавить их в интерфейс.
 564 
 565 **Step 3: Commit если были изменения**
 566 
 567 ```bash
 568 git add src/types.ts
 569 git commit -m "types: обновлены типы для новых компонентов чата"
 570 ```
 571 
 572 ---
 573 
 574 ## Verification Checklist
 575 
 576 После выполнения всех задач, убедитесь что:
 577 
 578 - [ ] ThinkingBlock корректно отображается и сворачивается
 579 - [ ] CodeBlock отображает код с подсветкой синтаксиса
 580 - [ ] Кнопка Copy в CodeBlock работает корректно
 581 - [ ] Toast уведомление появляется при копировании
 582 - [ ] Separator визуально разделяет секции
 583 - [ ] AgentActivityIndicator показывает ThinkingBlock для thinking активностей
 584 - [ ] react-markdown корректно рендерит код через CodeBlock
 585 - [ ] Inline код отображается с фоном и моноширинным шрифтом
 586 - [ ] Все компоненты используют shadcn/ui стандарты
 587 - [ ] Нет ошибок компиляции TypeScript
 588 - [ ] Нет ошибок в консоли браузера
 589 - [ ] Стили соответствуют темной теме приложения
 590 
 591 ---
 592 
 593 ## Notes
 594 
 595 - Все компоненты используют существующую shadcn/ui библиотеку из `src/components/ui/`
 596 - Стили подобраны под темную тему с цветами zinc-* и purple-* для thinking блоков
 597 - CodeBlock использует существующий toast из `use-toast` hook
 598 - ThinkingBlock использует Collapsible для сворачивания/разворачивания контента
 599 - Separator имеет цвет bg-zinc-700 для соответствия общей теме
 600 
 601 ## References
 602 
 603 - @superpowers:verification-before-completion - Перед завершением проверить все изменения
 604 - Existing: `src/components/ui/CopyableContent.tsx` - пример копирования в буфер
 605 - Existing: `src/components/ChatDemo/AgentActivityIndicator.tsx` - существующий индикатор активности
 606 - Existing: `src/components/ChatDemo/answer.tsx` - основной компонент вывода ответа
 607 - shadcn/ui docs: https://ui.shadcn.com/docs/components/alert
 608 - shadcn/ui docs: https://ui.shadcn.com/docs/components/collapsible
 609 - shadcn/ui docs: https://ui.shadcn.com/docs/components/separator
