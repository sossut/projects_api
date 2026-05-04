# Buildings API (Express + TypeScript)

Backend API for projects/buildings data, user auth, enrichment, and automation workers.

## 1) Quick Start (Docker, development)

This is the easiest way to run locally.

### Prerequisites

- Docker Desktop
- Git

### Setup

1. Copy environment file:
   - `cp .env.sample .env` (Git Bash)
   - or create `.env` manually on Windows
2. Fill required values in `.env` (DB, JWT, OpenAI, etc).
3. Start the stack:
   - `docker compose up --build`

API runs on: `http://localhost:5000`

### Stop

- `docker compose down`

### Rebuild from clean state

- `docker compose down -v && docker compose up --build`

---

## 2) Production (Docker)

Production compose file is available:

- `docker-compose.prod.yml`

### Start prod stack

- `docker compose -f docker-compose.prod.yml up --build -d`

### Logs

- `docker compose -f docker-compose.prod.yml logs -f api`

### Stop

- `docker compose -f docker-compose.prod.yml down`

Notes:

- `Dockerfile` is multi-stage and runs compiled output (`npm run start:dist`).
- Production compose uses Redis healthchecks and production workers.

---

## 3) Run without Docker

### Development

- `npm ci`
- `npm run dev`

### Build + run compiled app

- `npm run build`
- `npm run start:dist`

---

## 4) Scripts

- `npm run dev` — start API with nodemon
- `npm run build` — compile TypeScript to `dist`
- `npm run start:dist` — run compiled app
- `npm run test` — run Jest tests
- `npm run lint` — run ESLint with autofix
- `npm run typecheck` — TypeScript checks without emit

---

## 5) Environment Variables

Use `.env.sample` as the template.

| Variable                       | Required               | Example                      | Purpose                                   |
| ------------------------------ | ---------------------- | ---------------------------- | ----------------------------------------- |
| `NODE_ENV`                     | Yes                    | `development` / `production` | Runtime mode                              |
| `PORT`                         | Yes                    | `5000`                       | API listen port                           |
| `DB_HOST`                      | Yes                    | `host.docker.internal`       | MySQL host                                |
| `DB_USER`                      | Yes                    | `root`                       | MySQL username                            |
| `DB_PASS`                      | Yes                    | `your_password`              | MySQL password                            |
| `DB_NAME`                      | Yes                    | `buildings_db`               | MySQL database name                       |
| `JWT_SECRET`                   | Yes                    | `strong-random-secret`       | JWT signing secret (required at startup)  |
| `OPENAI_API_KEY`               | Optional/Feature-based | `sk-...`                     | AI enrichment/search services             |
| `USE_GPT5_ENRICHMENT`          | Optional               | `true` / `false`             | Toggle GPT-5 enrichment flow              |
| `REDIS_HOST`                   | Yes                    | `redis`                      | Redis host for queues/workers             |
| `REDIS_PORT`                   | Yes                    | `6379`                       | Redis port                                |
| `PROJECT_SEARCH_CRON`          | Optional               | `off` / cron-like value      | Automation scheduling switch              |
| `PROJECT_SEARCH_LOCATION`      | Optional               | `Hanoi`                      | Default automation search location        |
| `PROJECT_SEARCH_BUILDING_TYPE` | Optional               | `A`                          | Default automation building type selector |

Security notes:

- Never commit real `.env` values.
- Rotate secrets immediately if leaked.

---

## 6) Auth (JWT)

Authentication is Bearer JWT via Passport (`ExtractJwt.fromAuthHeaderAsBearerToken`).

### Login

- `POST /api/v1/auth/login`
- Body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Use token on protected routes

Header:

```text
Authorization: Bearer <token>
```

Example protected endpoints:

- `GET /api/v1/users`
- `GET /api/v1/users/check-token`
- `GET /api/v1/projects/favorites`

---

## 7) API Base and Route Groups

Base path: `/api/v1`

Route groups (mounted in `src/api/index.ts`):

- `/auth`
- `/users`
- `/projects`
- `/companies`
- `/automation`
- `/enrichment`
- `/metro-areas`
- `/cities`
- `/building-uses`
- `/building-types`
- `/countries`
- `/architects`
- `/queue-info`
- `/emojis`

Example:

- `GET /api/v1/projects`
- `GET /api/v1/projects/favorites`

---

## 8) Projects API Reference

Base: `/api/v1/projects`

### Endpoints

| Method   | Path                                                | Auth        | Purpose                                                |
| -------- | --------------------------------------------------- | ----------- | ------------------------------------------------------ |
| `GET`    | `/`                                                 | No          | List projects (supports paging/filtering query params) |
| `POST`   | `/`                                                 | Yes         | Create one or more projects (`projects` array payload) |
| `GET`    | `/search?q=...`                                     | Yes         | Search projects by text                                |
| `GET`    | `/metro/:metroAreaId/building-type/:buildingTypeId` | Yes         | Get project names by metro area + building type        |
| `GET`    | `/simple`                                           | Yes         | Lightweight project list                               |
| `GET`    | `/simple/:id`                                       | Yes         | Lightweight project detail                             |
| `GET`    | `/favorites`                                        | Yes         | List projects favorited by at least one user           |
| `GET`    | `/count`                                            | Yes         | Count projects (supports filters)                      |
| `GET`    | `/statuses`                                         | Yes         | List distinct project statuses                         |
| `POST`   | `/:id/favorite`                                     | Yes         | Favorite project for current user                      |
| `DELETE` | `/:id/favorite`                                     | Yes         | Unfavorite project for current user                    |
| `GET`    | `/:id`                                              | Yes         | Full project detail                                    |
| `PUT`    | `/:id`                                              | Yes         | Update project by URL id                               |
| `DELETE` | `/:id`                                              | Yes (admin) | Delete project                                         |
| `PUT`    | `/edit`                                             | Yes         | Update project by `id` in request body                 |
| `GET`    | `/formatted/:id`                                    | Yes         | Formatted project response for editing/client use      |

### Common query params for list endpoints

- `limit` (number)
- `page` (number)
- `sortBy` (field)
- `order` (`asc` or `desc`)

### Example: favorite flow

1. Login and get token:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

2. Favorite a project:

```http
POST /api/v1/projects/123/favorite
Authorization: Bearer <token>
```

3. Fetch favorited projects:

```http
GET /api/v1/projects/favorites
Authorization: Bearer <token>
```

### Notes

- `GET /projects/favorites` currently returns `404` when no favorites exist.
- Status values accepted in update/create validation include: `planned`, `approved`, `proposed`, `on_hold`, `under_construction`, `completed`, `cancelled`, `pre_construction`.

---

## 9) Data/Infra Notes

- Redis is started by compose (used by queue/workers).
- MySQL is expected via environment settings (`DB_HOST`, `DB_USER`, etc).
- In many local setups this points to host machine DB (`host.docker.internal`).

---

## 10) Typical Update/Deploy Flow (Laptop server)

From project directory on server:

- `git pull`
- `docker compose -f docker-compose.prod.yml up -d --build`

---

## 11) Troubleshooting

- Container won’t start:
  - check logs: `docker compose logs -f api`
- Worker issues:
  - check Redis and worker logs in compose output
- Type errors:
  - run `npm run build` or `npm run typecheck`
- DB enum/status mismatch:
  - verify DB `projects.status` allowed values match API validation
