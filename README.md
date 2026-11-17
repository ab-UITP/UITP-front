# UITP-front

Клиент игры «Поликарты»: Vue 3, Vite, TypeScript, PrimeVue, Pinia, TanStack Query, vue-router, VueUse, Vitest. Структура кода по [FEOD](https://feod.dev/), настройки в `feod.profile.md`. Экраны и стили перенесены из прототипа UX-макетов.

Что работает по-настоящему: вход и регистрация, создание матча, подключение второго игрока по ссылке. Партия от выбора тренера до результата пока идёт в браузере против бота, потому что игрового сервера ещё нет.

## Запуск всего в Docker

```bash
docker compose up -d --build
```

Игра откроется на http://localhost:8080. Чтобы подключить второго игрока с другого устройства, откройте игру по адресу машины в сети, иначе в ссылке будет `localhost`.

База данных запускается отдельно из `UITP-back/card-game-db`. Клиент и временный сервер пока её не используют.

## Разработка

Нужен pnpm (`npm install -g pnpm`) и запущенный `docker compose`, так как запросы к `/api` идут через порт 8080.

```bash
pnpm install
pnpm dev
```

Клиент с горячей перезагрузкой откроется на http://localhost:5173.

| Команда | Что делает |
|---|---|
| `pnpm test` | тесты Vitest |
| `pnpm lint` | ESLint с правилами FEOD |
| `pnpm typecheck` | проверка типов |
| `pnpm build` | сборка в `dist/` |

## Структура

```
src/
  app/       запуск, роутер, каркас экрана, стили
  pages/     страницы: главная, матч, 404
  modules/   Connection, Account, Match, Game
  common/    HTTP-клиент, шапка, имена маршрутов
server/      временный сервер
```

## Временный сервер

`server/server.js` хранит всё в памяти и нужен, пока не готов сервис на Kotlin. Пути совпадают с API из устава, поэтому при переходе надо поменять адрес в `nginx.conf`.

| Метод и путь | Назначение |
|---|---|
| `GET /api/v1/health` | проверка сервера |
| `POST /api/v1/auth/register` `{name, password}` | регистрация, сессия в httpOnly cookie |
| `POST /api/v1/auth/login` `{name, password}` | вход |
| `POST /api/v1/auth/logout` | выход |
| `GET /api/v1/me` | текущий игрок, 401 без сессии |
| `POST /api/v1/matches` | создать матч, ответ содержит `matchId` и `inviteLink` |
| `GET /api/v1/matches/{id}/state?since=N` | состояние матча, long-poll до 25 с |
| `POST /api/v1/matches/{id}/join` | присоединиться |
| `POST /api/v1/matches/{id}/leave` | выйти или отменить матч |

Отличия от устава: пароли хэшируются через scrypt, а не Argon2id, код матча одновременно служит токеном приглашения, эндпоинтов `moves` и `catalog` нет.
