# Error Tracking & Logging Setup

## Что было улучшено

### 1. Улучшенная конфигурация Sentry

#### Client-side (`sentry.client.config.ts`):

- ✅ Автоматическое определение environment (development/production)
- ✅ Интеграция `captureConsoleIntegration` для перехвата console.error/warn
- ✅ Интеграция `browserTracingIntegration` для трейсинга
- ✅ `beforeSend` фильтр для фильтрации неважных ошибок
- ✅ Автоматическое добавление контекста (runtime, tags, release)
- ✅ Настройка sampling rates для production (10% вместо 100%)
- ✅ `attachStacktrace: true` для всех ошибок

#### Server-side (`sentry.server.config.ts`):

- ✅ Environment detection из Vercel переменных
- ✅ Добавление Vercel контекста (region, env, commit SHA)
- ✅ `beforeSend` фильтр
- ✅ Автоматическое добавление runtime информации

#### Edge (`sentry.edge.config.ts`):

- ✅ Улучшенная конфигурация для edge runtime
- ✅ Environment detection

### 2. React ErrorBoundary

Создан компонент `ErrorBoundary` который:

- ✅ Перехватывает ошибки рендеринга React
- ✅ Автоматически отправляет их в Sentry
- ✅ Показывает пользователю понятное сообщение об ошибке
- ✅ Предлагает перезагрузить страницу

### 3. Централизованный Logger

Создан `src/lib/logger.ts` который:

- ✅ Отправляет логи в консоль (для Vercel logs)
- ✅ Отправляет важные логи в Sentry
- ✅ Форматирует логи с timestamp и контекстом
- ✅ Поддерживает уровни: debug, info, warn, error

### 4. Глобальные обработчики ошибок

В `_app.tsx` добавлены:

- ✅ `window.onerror` для перехвата необработанных ошибок
- ✅ `unhandledrejection` для перехвата необработанных промисов
- ✅ Автоматическая отправка в Sentry с контекстом

## Почему логи не собирались в Vercel

1. **Console.log не отправляется автоматически** - Vercel собирает только логи из stdout/stderr во время выполнения сервера
2. **Client-side логи не видны** - логи из браузера не попадают в Vercel logs
3. **Нет структурированного логирования** - обычные console.log не структурированы

## Решение

### Для Vercel Logs:

- Используйте `logger.info()`, `logger.error()` вместо `console.log()`
- Логи автоматически форматируются с timestamp
- Server-side логи видны в Vercel Dashboard → Logs

### Для Sentry:

- Все ошибки автоматически отправляются в Sentry
- Console.error/warn перехватываются и отправляются
- React ошибки перехватываются ErrorBoundary
- Глобальные ошибки перехватываются обработчиками

## Использование

### Вместо console.log:

```typescript
// ❌ Старый способ
console.log('User logged in', user);
console.error('Login failed', error);

// ✅ Новый способ
import logger from '@/lib/logger';

logger.info('User logged in', { userId: user.id, email: user.email });
logger.error('Login failed', error, { email, attemptCount: 3 });
```

### Ручная отправка в Sentry:

```typescript
import * as Sentry from '@sentry/nextjs';

// С контекстом
Sentry.captureException(error, {
  tags: { component: 'login', action: 'submit' },
  extra: { email, timestamp: Date.now() },
});

// С сообщением
Sentry.captureMessage('Custom error message', {
  level: 'error',
  tags: { feature: 'payment' },
});
```

## Просмотр логов

### Vercel Logs:

1. Перейдите в Vercel Dashboard
2. Выберите проект `r2r-dashboard`
3. Откройте вкладку "Logs"
4. Фильтруйте по environment (Production/Preview/Development)

### Sentry:

1. Перейдите: https://evgeny-pl.sentry.io/projects/r2r-dashboard/
2. Откройте "Issues" для просмотра ошибок
3. Откройте "Performance" для просмотра трейсов
4. Используйте фильтры по tags (component, vercel_env, etc.)

## Environment Variables

Убедитесь, что в Vercel установлены:

- `NEXT_PUBLIC_SENTRY_DSN` - для отправки ошибок
- `SENTRY_AUTH_TOKEN` - для загрузки source maps
- `VERCEL_ENV` - автоматически устанавливается Vercel
- `VERCEL_REGION` - автоматически устанавливается Vercel
- `VERCEL_GIT_COMMIT_SHA` - автоматически устанавливается Vercel

## Best Practices

1. **Используйте logger вместо console** для важных событий
2. **Добавляйте контекст** к ошибкам (user ID, action, etc.)
3. **Фильтруйте неважные ошибки** в beforeSend
4. **Используйте tags** для группировки ошибок
5. **Проверяйте Sentry регулярно** для выявления проблем

## Мониторинг

После деплоя проверьте:

1. ✅ Ошибки появляются в Sentry
2. ✅ Логи видны в Vercel Dashboard
3. ✅ Source maps загружены (читаемые stack traces)
4. ✅ ErrorBoundary работает (попробуйте вызвать ошибку)
