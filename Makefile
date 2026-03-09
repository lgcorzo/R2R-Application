.PHONY: help dev build deploy deploy-local clean format lint test

# Переменные
SERVER_HOST := 136.119.36.216
SSH_KEY := ~/.ssh/google_compute_engine
DEPLOY_SCRIPT := scripts/deploy-to-server.sh

# Помощь
help:
	@echo "R2R Dashboard - Доступные команды:"
	@echo ""
	@echo "  make dev           - Запустить dev сервер на порту 3005"
	@echo "  make build         - Production билд"
	@echo "  make deploy        - Деплой на сервер $(SERVER_HOST)"
	@echo "  make deploy-local  - Локальный Docker деплой (тест)"
	@echo "  make format        - Prettier форматирование"
	@echo "  make lint          - ESLint проверка + автофикс"
	@echo "  make test          - Запустить тесты"
	@echo "  make clean         - Очистить build артефакты"
	@echo ""

# Development
dev:
	@echo "🚀 Запуск dev сервера..."
	pnpm dev

# Build
build:
	@echo "🔨 Production билд..."
	pnpm build

# Deploy на production сервер
deploy:
	@echo "🚀 Деплой на сервер $(SERVER_HOST)..."
	@bash $(DEPLOY_SCRIPT)

# Локальный Docker тест
deploy-local:
	@echo "🐳 Локальный Docker билд..."
	docker build -t r2r-dashboard:local .
	@echo "✅ Образ собран: r2r-dashboard:local"
	@echo "Для запуска используйте:"
	@echo "  docker run -p 3000:3000 --env-file .env r2r-dashboard:local"

# Форматирование
format:
	@echo "🎨 Prettier форматирование..."
	pnpm format

# Линтинг
lint:
	@echo "🔍 ESLint проверка..."
	pnpm lint

# Тесты
test:
	@echo "🧪 Запуск тестов..."
	@echo "⚠️  Тесты еще не настроены"

# Cleanup
clean:
	@echo "🧹 Очистка build артефактов..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache
	@echo "✅ Очищено"

# Проверка статуса на сервере
status:
	@echo "📊 Статус dashboard на сервере..."
	@ssh -i $(SSH_KEY) laptop@$(SERVER_HOST) "docker ps | grep r2r-dashboard"

# Логи с сервера
logs:
	@echo "📋 Логи dashboard контейнера..."
	@ssh -i $(SSH_KEY) laptop@$(SERVER_HOST) "cd /home/laptop/r2r-deploy && docker compose logs -f dashboard"

# Перезапуск на сервере
restart:
	@echo "🔄 Перезапуск dashboard..."
	@ssh -i $(SSH_KEY) laptop@$(SERVER_HOST) "cd /home/laptop/r2r-deploy && docker compose restart dashboard"

# Копирование .env на сервер
sync-env:
	@echo "🔐 Синхронизация .env файла..."
	@scp -i $(SSH_KEY) .env laptop@$(SERVER_HOST):/home/laptop/r2r-dashboard/.env
	@echo "✅ .env обновлен на сервере"
