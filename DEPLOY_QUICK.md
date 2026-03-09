# 🚀 Quick Deploy - R2R Dashboard на сервер

## ✅ Что уже готово

- ✅ Docker образ: `goldmeat/r2r-dashboard:latest` (345MB)
- ✅ Запушен на Docker Hub
- ✅ Deploy скрипт: `scripts/deploy-dashboard-image.sh`

---

## 📋 Шаги деплоя (3 команды)

### 1. Сделать репозиторий приватным

```bash
# Откройте в браузере:
https://hub.docker.com/repository/docker/goldmeat/r2r-dashboard/general

# Settings → Repository Visibility → Make Private
```

### 2. Скопировать файлы на сервер

```bash
# Локально:
scp /tmp/docker-compose-vm.yml laptop@136.119.36.216:/home/laptop/dev/r2r-deploy/docker-compose.yml
scp scripts/deploy-dashboard-image.sh laptop@136.119.36.216:/home/laptop/dev/r2r-deploy/
```

### 3. Запустить деплой на сервере

```bash
# На сервере:
cd /home/laptop/dev/r2r-deploy
chmod +x deploy-dashboard-image.sh

# Логин в Docker Hub (один раз)
docker login -u goldmeat

# Деплой
./deploy-dashboard-image.sh
```

---

## ✅ Результат

Dashboard доступен на: **http://136.119.36.216:3000**

---

## 📚 Документация

Полная инструкция: `docs/DEPLOY_INSTRUCTIONS.md`
