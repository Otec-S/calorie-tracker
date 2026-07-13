# Дневник калорий

React + Vite SPA, которая оценивает калорийность и БЖУ блюда по фото или
текстовому описанию через Claude API, и хранит записи в `localStorage`.

## Структура

- `src/` — фронтенд (React + TypeScript)
- `server/` — минимальный Express-прокси: держит `ANTHROPIC_API_KEY` на
  сервере и проксирует запросы к Claude, чтобы ключ не попадал в браузер

## Запуск

```bash
# фронтенд
cp .env.example .env
npm install

# бэкенд-прокси
cp server/.env.example server/.env   # вписать свой ANTHROPIC_API_KEY
npm --prefix server install

# оба сразу
npm run dev:all
```

Фронтенд — `http://localhost:5173`, прокси — `http://localhost:3001`.

## Сборка

```bash
npm run build           # фронтенд → dist/
npm --prefix server run build   # сервер → server/dist/
```
