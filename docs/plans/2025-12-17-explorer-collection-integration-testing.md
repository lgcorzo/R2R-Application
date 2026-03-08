# Testing Checklist - Explorer & Collection Integration

## Функциональное тестирование

- [ ] Страница /explorer загружается
- [ ] Sidebar с коллекциями отображается
- [ ] Все 7 табов видны
- [ ] Documents таб показывает FileManager
- [ ] Users таб загружает и отображает пользователей
- [ ] Entities таб загружает и отображает entities
- [ ] Relationships таб загружает и отображает relationships
- [ ] Communities таб загружает и отображает communities
- [ ] Knowledge Graph таб показывает D3 граф
- [ ] Explore таб показывает explore визуализацию
- [ ] Query params синхронизируются с UI
- [ ] Прямые ссылки с query params работают
- [ ] Редирект с /collections/[id] работает

## Lazy Loading

- [ ] Documents таб не вызывает API для других табов
- [ ] Users таб загружает данные только при открытии
- [ ] Entities таб загружает данные только при открытии
- [ ] Данные кэшируются при переключении табов

## Обратная совместимость

- [ ] Старые ссылки /collections/abc123 редиректятся
- [ ] FileManager функционал работает без регрессий
- [ ] Upload работает
- [ ] Bulk actions работают

## Запуск тестирования

**Запустить dev сервер:**
```bash
pnpm dev
```

**Открыть в браузере:**
```text
http://localhost:3005/explorer
```

**Проверка lazy loading:**
1. Открыть DevTools -> Network tab
2. Перейти на Users таб
3. Убедиться что API запрос `collections.listUsers` отправился только сейчас (не при загрузке страницы)

**Проверка query parameters:**
1. Переключить на Entities таб
2. Проверить URL обновился: `/explorer?tab=entities`
3. Выбрать коллекцию в sidebar
4. Проверить URL обновился: `/explorer?collection=<id>&tab=entities`
5. Скопировать URL и открыть в новой вкладке
6. Убедиться что правильный таб и коллекция открыты

**Проверка редиректа:**
1. Найти ID коллекции (например: `abc123`)
2. Перейти на `/collections/abc123`
3. Убедиться что редирект на `/explorer?collection=abc123&tab=documents` произошел
4. Страница показывает "Redirecting to Explorer..." на мгновение

## Известные ограничения

- Default коллекция: нужно будет добавить логику определения default collection ID после бэкенд интеграции
- Пагинация в табах: используется клиентская пагинация через Table компонент
- Performance: при больших данных (>1000 записей) может быть задержка при первой загрузке таба
