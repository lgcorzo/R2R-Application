#!/bin/bash

# R2R Dashboard Auto-Deploy Script
# Автоматический деплой кастомного R2R Dashboard на сервер

set -e  # Exit on error

# Конфигурация
SERVER_HOST="136.119.36.216"
SERVER_USER="laptop"
SSH_KEY="$HOME/.ssh/google_compute_engine"
DASHBOARD_DIR="/home/laptop/r2r-dashboard"
DOCKER_COMPOSE_DIR="/home/laptop/r2r-deploy"
ARCHIVE_NAME="r2r-dashboard-deploy.tar.gz"

echo "📦 Создание архива дашборда..."
tar -czf "/tmp/$ARCHIVE_NAME" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  .

echo "📁 Размер архива:"
ls -lh "/tmp/$ARCHIVE_NAME"

echo "🚀 Загрузка архива на сервер..."
scp -i "$SSH_KEY" "/tmp/$ARCHIVE_NAME" "$SERVER_USER@$SERVER_HOST:/home/$SERVER_USER/"

echo "📂 Распаковка на сервере..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" <<'ENDSSH'
  cd /home/laptop/r2r-dashboard
  rm -rf *
  tar -xzf /home/laptop/r2r-dashboard-deploy.tar.gz
  rm /home/laptop/r2r-dashboard-deploy.tar.gz
ENDSSH

echo "🔨 Сборка Docker образа..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" <<'ENDSSH'
  cd /home/laptop/r2r-deploy
  docker compose build --no-cache dashboard
ENDSSH

echo "🔄 Перезапуск dashboard контейнера..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" <<'ENDSSH'
  cd /home/laptop/r2r-deploy
  docker compose stop dashboard
  docker compose rm -f dashboard
  docker compose up -d dashboard
ENDSSH

echo "✅ Деплой завершен!"
echo "🌐 Dashboard доступен по адресу: http://$SERVER_HOST"

# Проверка статуса
echo ""
echo "📊 Статус контейнера:"
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "docker ps | grep r2r-dashboard"

# Cleanup
rm "/tmp/$ARCHIVE_NAME"
echo "🧹 Временные файлы удалены"
