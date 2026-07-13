# Деплой на sg-files-prod (Hetzner)

Второй сайт на уже существующем сервере `sg-files-prod` (78.47.166.130),
без своего домена — через бесплатный псевдодомен
[sslip.io](https://sslip.io): `78-47-166-130.sslip.io` резолвится сам в
78.47.166.130.

## 0. Проверить, что уже стоит на сервере

```bash
node -v; nginx -v; pm2 -v; ss -tlnp | grep -E ':(3001|3002)\b'
```

Если Node.js/nginx/pm2 нет — поставить:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt install -y nodejs nginx
sudo npm i -g pm2
```

Проверить, что порт **3002** (backend calorie-tracker) свободен — если
занят другим сервисом на сервере, поменять порт в `server/.env` и в
`deploy/nginx-calorie-tracker.conf` (`proxy_pass`) на свободный.

## 1. Код на сервер

```bash
sudo mkdir -p /var/www/calorie-tracker
sudo chown $USER:$USER /var/www/calorie-tracker
git clone <URL твоего репозитория> /var/www/calorie-tracker
cd /var/www/calorie-tracker

npm ci && npm run build                    # → dist/
npm --prefix server ci && npm --prefix server run build   # → server/dist/
```

## 2. Переменные окружения backend

```bash
cp server/.env.example server/.env
```

В `server/.env` вписать:

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3002
ALLOWED_ORIGIN=https://78-47-166-130.sslip.io
```

## 3. Запуск backend через pm2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # выполнить команду, которую pm2 напечатает (systemd автозапуск)
```

## 4. nginx

```bash
sudo cp deploy/nginx-calorie-tracker.conf /etc/nginx/sites-available/calorie-tracker
sudo ln -s /etc/nginx/sites-available/calorie-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 78-47-166-130.sslip.io
```

Сайт будет на `https://78-47-166-130.sslip.io`.

## Обновление после изменений в коде

```bash
cd /var/www/calorie-tracker
./deploy/deploy.sh
```
