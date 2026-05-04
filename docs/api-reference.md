# API Reference

Base path: `/api/v1`

## Authentication

Most write operations and user-scoped reads require a JWT Bearer token.

Login:

- `POST /api/v1/auth/login`

Use the token on protected routes with:

```text
Authorization: Bearer <token>
```

## Route Groups

### Auth

- `POST /login`

### Users

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /users/check-token`

### Projects

Common endpoints:

- `GET /projects`
- `POST /projects`
- `GET /projects/search`
- `GET /projects/country/:countryId`
- `GET /projects/metro/:metroAreaId/building-type/:buildingTypeId`
- `GET /projects/simple`
- `GET /projects/simple/export`
- `GET /projects/simple/export/excel`
- `GET /projects/simple/export/pdf`
- `GET /projects/simple/:id`
- `GET /projects/favorites`
- `GET /projects/coordinates`
- `GET /projects/count`
- `GET /projects/statuses`
- `POST /projects/:id/favorite`
- `DELETE /projects/:id/favorite`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`
- `PUT /projects/edit`
- `GET /projects/formatted/:id`

Notes:

- `GET /projects` is public.
- Most other project endpoints require authentication.
- Project writes support nested data for location, developers, architects, contractors, sources, and websites.

### Companies

- Company routes are mounted under `/companies`.
- See the controllers for the exact list of list/detail/update operations.

### Automation

- `GET /automation/job/:jobId`
- `POST /automation/job/:jobId/stop`

### Enrichment

- `GET /enrichment/job/:jobId`
- `POST /enrichment/job/:jobId/stop`

These endpoints read and control individual enrichment jobs.

### Queue Info

- `GET /queue-info`

Returns job counts and job lists for both queues.

### Reference Data

- `GET /countries`
- `GET /cities`
- `GET /metro-areas`
- `GET /building-types`
- `GET /building-uses`
- `GET /architects`

### Emojis

- `GET /emojis`

## Error Behavior

- Invalid routes return the project-specific not-found handler.
- Unexpected failures are passed to the shared error handler.
