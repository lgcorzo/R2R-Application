# 🚀 R2R Dashboard - Инструкция по деплою приватного Docker образа

## ✅ Что уже сделано (локально)

1. ✅ Docker образ собран: `goldmeat/r2r-dashboard:latest` (345MB)
2. ✅ Образ запушен на Docker Hub (теги: `latest`, `v1.0`)
3. ✅ Обновлен `.dockerignore` для минимального размера
4. ✅ Подготовлен `docker-compose.yml` с приватным образом
5. ✅ Создан `deploy-dashboard-image.sh` для автоматического деплоя

---

## 📋 Шаги для деплоя на сервер

### 1. Сделать репозиторий приватным (Docker Hub)

Откройте в браузере:
```text
https://hub.docker.com/repository/docker/goldmeat/r2r-dashboard/general
```

В интерфейсе:
- Перейдите в **Settings** → **Repository Visibility**
- Нажмите **Make Private**
- Подтвердите действие

---

### 2. Скопировать файлы на сервер

Выполните на **локальной машине**:

```bash
# Копируем обновленный docker-compose.yml
scp /tmp/docker-compose-vm.yml laptop@136.119.36.216:/home/laptop/dev/r2r-deploy/docker-compose.yml

# Копируем deploy скрипт
scp /tmp/deploy-dashboard-image.sh laptop@136.119.36.216:/home/laptop/dev/r2r-deploy/

# Подключаемся к серверу
ssh laptop@136.119.36.216
```

---

### 3. Запустить деплой на сервере

После подключения к серверу:

```bash
# Переходим в директорию проекта
cd /home/laptop/dev/r2r-deploy

# Делаем скрипт исполняемым
chmod +x deploy-dashboard-image.sh

# ВАЖНО: Логинимся в Docker Hub (один раз)
docker login -u goldmeat
# Введите пароль от Docker Hub

# Запускаем деплой
./deploy-dashboard-image.sh
```

---

## 📊 Что делает deploy скрипт

1. ✅ Создает backup текущего `docker-compose.yml`
2. ✅ Проверяет авторизацию в Docker Hub
3. ✅ Скачивает приватный образ `goldmeat/r2r-dashboard:latest`
4. ✅ Останавливает старый dashboard контейнер
5. ✅ Удаляет старые volume mounts (если были)
6. ✅ Запускает новый контейнер из приватного образа
7. ✅ Проверяет статус и показывает логи
8. ✅ Проверяет доступность dashboard

---

## 🔍 Проверка после деплоя

### Проверить статус контейнера:
```bash
docker compose ps dashboard
```

**Ожидаемый результат:**
```text
NAME             IMAGE                               STATUS         PORTS
r2r-dashboard    goldmeat/r2r-dashboard:latest       Up 10 seconds  0.0.0.0:3000->3000/tcp
```

### Проверить логи:
```bash
docker compose logs -f dashboard
```

**Ожидаемые логи:**
```bash
Replacing environment variables in env-config.js...
  ▲ Next.js 14.2.5
  - Local:        http://0.0.0.0:3000
  ✓ Ready in 1.2s
```

### Проверить доступность:
```bash
# На сервере:
curl -I http://localhost:3000

# В браузере:
http://136.119.36.216:3000
```

---

## 🎯 Ключевые изменения в docker-compose.yml

**ДО (volume-based deployment):**
```yaml
dashboard:
  image: node:20-alpine
  volumes:
    - /home/laptop/r2r-dashboard-build/.next/standalone:/app
    - /home/laptop/r2r-dashboard-build/.next/static:/app/.next/static
    - /home/laptop/r2r-dashboard-build/public:/app/public
```

**ПОСЛЕ (private Docker image):**
```yaml
dashboard:
  image: goldmeat/r2r-dashboard:latest
  environment:
    NEXT_PUBLIC_R2R_DEPLOYMENT_URL: "http://136.119.36.216:7272"
    NEXT_PUBLIC_HATCHET_DASHBOARD_URL: "http://136.119.36.216:7274"
    R2R_DASHBOARD_DISABLE_TELEMETRY: "false"
```

---

## 🔄 Обновление dashboard (в будущем)

Когда нужно обновить код dashboard:

### На локальной машине:
```bash
cd /Users/laptop/mcp/R2R-Application

# 1. Внести изменения в код
# 2. Пересобрать образ
docker build -t goldmeat/r2r-dashboard:latest -t goldmeat/r2r-dashboard:v1.1 .

# 3. Запушить на Docker Hub
docker push goldmeat/r2r-dashboard:latest
docker push goldmeat/r2r-dashboard:v1.1
```

### На сервере:
```bash
cd /home/laptop/dev/r2r-deploy

# Просто перезапустить deploy скрипт
./deploy-dashboard-image.sh
```

---

## 📦 Технические детали

### Размер образа:
- **345MB** (оптимизированный production build)
- Базовый образ: `node:22-alpine` (~180MB)
- Next.js standalone build: ~80MB
- Production dependencies: ~70MB
- Static assets: ~15MB

### Архитектура Docker образа:
```text
┌─────────────────────────────────────────┐
│  Multi-stage build:                     │
│                                          │
│  1. Builder stage (node:22-alpine)      │
│     → pnpm install (deps)               │
│     → pnpm build (Next.js)              │
│                                          │
│  2. Runner stage (node:22-alpine)       │
│     → Copy standalone build             │
│     → Copy startup.sh (runtime config)  │
│     → Expose 3000                        │
│     → CMD: /app/startup.sh               │
└─────────────────────────────────────────┘
```

### Runtime Config Injection:
Скрипт `startup.sh` заменяет плейсхолдеры в `/app/public/env-config.js` на актуальные значения из environment variables при старте контейнера.

---

## 🔐 Безопасность

1. ✅ **Приватный репозиторий** на Docker Hub (защита кода)
2. ✅ **Runtime config** (env переменные не в образе)
3. ✅ **Non-root user** (`nextjs:nodejs` в контейнере)
4. ✅ **Minimal base image** (Alpine Linux)

---

## ❓ Troubleshooting

### Проблема: Cannot pull image
```bash
Error response from daemon: pull access denied for goldmeat/r2r-dashboard
```

**Решение:**
```bash
# Логин в Docker Hub на сервере
docker login -u goldmeat
# Введите пароль
```

---

### Проблема: Dashboard не отвечает
```bash
# Проверить логи контейнера
docker compose logs dashboard

# Проверить что все env переменные установлены
docker compose exec dashboard env | grep NEXT_PUBLIC
```

**Ожидаемые env:**
```text
NEXT_PUBLIC_R2R_DEPLOYMENT_URL=http://136.119.36.216:7272
NEXT_PUBLIC_HATCHET_DASHBOARD_URL=http://136.119.36.216:7274
```

---

### Проблема: Старые volumes не удалились
```bash
# Вручную удалить директорию
sudo rm -rf /home/laptop/r2r-dashboard-build

# Перезапустить dashboard
docker compose restart dashboard
```

---

## 📚 Дополнительные ресурсы

- Docker образ: https://hub.docker.com/r/goldmeat/r2r-dashboard
- Dockerfile: `/Users/laptop/mcp/R2R-Application/Dockerfile`
- Deploy скрипт: `/home/laptop/dev/r2r-deploy/deploy-dashboard-image.sh`

---

**Создано:** 2024-12-17
**Версия:** 1.0
**Образ:** goldmeat/r2r-dashboard:latest (345MB)
