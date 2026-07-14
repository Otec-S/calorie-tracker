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

```env
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

## Автодеплой при пуше в master

`.github/workflows/deploy.yml` при каждом пуше в `master` подключается к
серверу по SSH и триггерит `deploy/deploy.sh`.

Для этого на сервере в `/root/.ssh/authorized_keys` добавлена отдельная
(не личная) пара ключей github-actions-deploy-calorie-tracker с
принудительной командой:

```text
command="cd /var/www/calorie-tracker && ./deploy/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...
```

То есть этим ключом с сервера нельзя выполнить ничего, кроме самого
скрипта деплоя — даже если приватный ключ утечёт. Приватная половина
ключа лежит в secrets репозитория (`DEPLOY_SSH_KEY`, вместе с
`DEPLOY_HOST` и `DEPLOY_USER`) и нигде больше.

Чтобы отозвать доступ — удалить эту строку из `authorized_keys` на
сервере и/или secrets в GitHub.
