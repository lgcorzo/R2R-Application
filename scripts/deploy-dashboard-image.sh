#!/bin/bash
set -e

echo "🚀 R2R Dashboard - Deploy Private Docker Image"
echo "================================================"
echo ""

# Проверка что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ Ошибка: docker-compose.yml не найден!"
  echo "Запустите скрипт из директории /home/laptop/dev/r2r-deploy/"
  exit 1
fi

# 1. Backup текущего docker-compose.yml
echo "💾 Создаем backup docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# 2. Pull нового образа (если не залогинен - docker покажет ошибку)
echo ""
echo "⬇️  Скачиваем goldmeat/r2r-dashboard:latest..."
if ! docker pull goldmeat/r2r-dashboard:latest 2>&1 | tee /tmp/docker-pull.log; then
  echo ""
  echo "❌ Не удалось скачать образ. Возможные причины:"
  echo "   1. Не залогинены в Docker Hub"
  echo "   2. Нет доступа к приватному репозиторию"
  echo ""
  echo "Для входа выполните:"
  echo "   docker login -u goldmeat"
  echo ""
  exit 1
fi

# 4. Останавливаем и удаляем старый dashboard контейнер
echo ""
echo "🛑 Останавливаем старый dashboard контейнер..."
docker compose stop dashboard 2>/dev/null || true
docker compose rm -f dashboard 2>/dev/null || true

# 5. Удаляем старые volumes (если использовались)
echo ""
echo "🗑️  Очищаем старые volume mounts..."
rm -rf /home/laptop/r2r-dashboard-build 2>/dev/null || true

# 6. Запускаем новый контейнер с приватным образом
echo ""
echo "🚀 Запускаем dashboard из goldmeat/r2r-dashboard:latest..."
docker compose up -d dashboard

# 7. Ждем запуска (3 секунды)
echo ""
echo "⏳ Ждем запуска контейнера..."
sleep 3

# 8. Проверяем статус
echo ""
echo "✅ Статус dashboard контейнера:"
docker compose ps dashboard

# 9. Показываем логи
echo ""
echo "📊 Логи dashboard (последние 30 строк):"
docker compose logs --tail=30 dashboard

# 10. Проверяем health
echo ""
echo "🔍 Проверяем доступность dashboard..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
  echo "✅ Dashboard отвечает на localhost:3000"
else
  echo "⚠️  Dashboard еще не отвечает (может требоваться больше времени на запуск)"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Деплой завершен!                                          ║"
echo "║                                                               ║"
echo "║  Dashboard доступен на:                                       ║"
echo "║  → http://136.119.36.216:3000                                 ║"
echo "║  → Приватный образ: goldmeat/r2r-dashboard:latest            ║"
echo "║  → Размер: 345MB                                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
