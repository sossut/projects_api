# Architecture Guide

This repository is an Express + TypeScript API for building and project data. It includes a REST API, JWT authentication, and BullMQ workers for automation and enrichment tasks.

## Runtime Entry Points

- `src/app.ts` creates the Express app, configures middleware, mounts `/api/v1`, and registers error handlers.
- `src/index.ts` starts the HTTP server on `PORT` or `5000`.
- `src/api/index.ts` mounts the route groups under `/api/v1`.

## Request Pipeline

The app uses these core middlewares:

- `helmet` for security headers
- `cors` with permissive cross-origin settings
- `express.json()` for JSON request bodies
- `pino-http` for request logging and request IDs
- custom not-found and error handlers from `src/middlewares.ts`

Authentication is handled with Passport JWT. Protected endpoints expect a Bearer token in the `Authorization` header.

## Route Groups

The API currently mounts these route groups:

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

## Background Workers

Two BullMQ workers process queue jobs:

- `src/api/queues/automation.worker.ts`
- `src/api/queues/enrichment.worker.ts`

They use Redis via `REDIS_HOST` and `REDIS_PORT`, and they process jobs such as project search, company extraction, and project enrichment.

The worker scripts are independent from the HTTP server. The `worker` npm script starts the enrichment worker.

## Configuration

Environment values are defined in `.env.sample`. The most important ones are:

- `PORT`
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET`
- `REDIS_HOST`, `REDIS_PORT`
- `OPENAI_API_KEY`
- `USE_GPT5_ENRICHMENT`
- `PROJECT_SEARCH_CRON`

## Operational Notes

- The app is designed to run either locally with `npm run dev` or in Docker with `docker compose up --build`.
- Production uses the compiled app from `dist`.
- Queue status is exposed through the `/api/v1/queue-info` route.
- A Swagger/OpenAPI starter spec lives in `docs/openapi.yaml`.
