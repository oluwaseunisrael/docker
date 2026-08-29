# Task API

A CRUD API for managing a to-do list, built with Node.js + Express, backed by PostgreSQL, and run with Docker Compose.

## Architecture

```
server.js  (routes only — no SQL, no storage knowledge)
    ↓
services/taskService.js  (validation + business rules)
    ↓
repositories/postgresTaskRepository.js  (the only file that knows SQL/Postgres)
    ↓
db/pool.js  (the pg connection pool, built from DATABASE_URL)
```

`server.js` and `services/taskService.js` are unchanged from the SQLite version of this project (Assignment W3·A1) — swapping storage from SQLite to Postgres meant writing one new file (`repositories/postgresTaskRepository.js`) and changing one `require()` line in `taskService.js`. That's the whole point of the layering: routes and business rules don't know or care what database sits underneath them.

## Run it

**Whole stack (recommended):**

```bash
docker compose up
```

This starts Postgres (with a volume so data survives restarts) and the app together. The API is at `http://localhost:3000`, Swagger UI at `http://localhost:3000/docs`. The `tasks` table is created automatically from `init.sql` the first time the Postgres container starts, and the 3 example tasks are seeded automatically by the app if the table is empty.

**App only, against a local Postgres:**

```bash
cp .env.example .env   # edit if your local Postgres uses different credentials
npm install
node server.js
```

## Environment variables

`.env` is gitignored; `.env.example` is committed so anyone cloning the repo knows what to set. `.env` holds `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (used to configure the Postgres container) and `DATABASE_URL` (used by the app when run directly on your machine, pointing at `localhost`).

When running via `docker compose up`, `docker-compose.yml` overrides `DATABASE_URL` for the app container to point at `db` (the Postgres service's name inside the Docker network) instead of `localhost` — inside a container, `localhost` means the container itself, not the host machine, so this override is necessary and expected.

## Endpoints

| Method | Path          | Description                          | Success | Errors        |
|--------|---------------|---------------------------------------|---------|----------------|
| GET    | `/`           | API info                              | 200     | —              |
| GET    | `/health`     | Health check                          | 200     | —              |
| GET    | `/tasks`      | List all tasks (supports `?done=` and `?search=`) | 200 | — |
| GET    | `/tasks/:id`  | Get one task                          | 200     | 404            |
| POST   | `/tasks`      | Create a task (`{ "title": "..." }`)  | 201     | 400            |
| PUT    | `/tasks/:id`  | Update a task's `title` and/or `done` | 200     | 400, 404       |
| DELETE | `/tasks/:id`  | Delete a task                         | 204     | 404            |
| GET    | `/stats`      | `{ total, done, open }`               | 200     | —              |
| POST   | `/reset`      | Restore the 3 seed tasks              | 200     | —              |

## Sample output

```
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy eggs"}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy eggs","done":false}
```

## How persistence was proven

1. Ran `docker compose up`, confirmed the 3 seed tasks via `GET /tasks`.
2. Created a task via `POST /tasks` (`{"title": "Survives app+db restart"}`).
3. Stopped the app, then restarted Postgres itself.
4. Restarted the app.
5. Ran `GET /tasks` again — the created task was still there alongside the original 3, proving data survives both an app restart and a database restart, not just the app.

## Swagger screenshot

_(add your screenshot of `/docs` here)_

## Stretch ideas (not implemented)

- Add Redis to `docker-compose.yml` for next week's caching work.
- Add an index on `tasks.done` and compare `EXPLAIN ANALYZE` on a filtered query before/after.
"# docker" 
