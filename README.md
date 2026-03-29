# VacantSlot API

Rule-based dynamic discounting for time-based inventory. Built with **NestJS**, **MongoDB** (inventory and vendors), and **Redis** (short-lived booking locks).

---

## API documentation

| Resource | Location |
|----------|----------|
| **Human-readable reference** (payloads, errors, flows) | [docs/API.md](docs/API.md) |
| **OpenAPI UI** | `http://localhost:<PORT>/docs` |
| **OpenAPI JSON** (codegen, Postman, Insomnia) | `http://localhost:<PORT>/docs-json` |

- REST routes use the global prefix `/<API_PREFIX>/…` (default **`/api/v1`**).
- Swagger is served at **`/docs`** and **`/docs-json`** (these paths are **not** prefixed with `API_PREFIX`).
- **Authentication:** send `x-api-key: <vendor-api-key>` on every route **except** `POST /api/v1/vendors`. Registration returns the API key once; clients must store it securely.

When you change request or response shapes, update **Swagger** (DTOs and `@Api*` decorators) and keep **[docs/API.md](docs/API.md)** in sync so frontend and integrations stay accurate.

---

## Prerequisites

- **Node.js** 18 or newer (LTS recommended)
- **pnpm** (package manager for this repo)
- **MongoDB** (persistent data)
- **Redis** (distributed locks for the lock → confirm booking flow)

---

## Configuration

1. Copy `.env.example` to `.env`.
2. Set at least `MONGO_URI` and Redis settings for your environment.

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `API_PREFIX` | Global route prefix (default `api/v1`) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection |
| `REDIS_USER`, `REDIS_PASSWORD` | Optional (ACL / cloud Redis) |
| `REDIS_TLS` | Set `true` when the server requires TLS |

**Guidelines:** never commit `.env` or real API keys. Use `.env.example` for documented placeholders only. In production, inject secrets via your host’s secret store or environment, not the repo.

---

## Project setup

```bash
pnpm install
```

Ensure MongoDB and Redis are reachable before starting the app (locks and slot flows depend on Redis).

---

## Build and run

```bash
# development (watch)
pnpm run start:dev

# production
pnpm run build
pnpm run start

# debug + watch
pnpm run start:debug
```

---

## Repository layout (guidelines)

| Area | Role |
|------|------|
| `src/main.ts` | Bootstrap, global prefix, `ValidationPipe`, Swagger, shutdown hooks |
| `src/app.module.ts` | Root module, `ConfigModule`, `APP_GUARD` (`ApiKeyGuard`) |
| `src/common/` | Cross-cutting pieces: guards, decorators (`@Public`, `@GetVendor`), `HttpExceptionFilter`, shared Swagger response DTOs |
| `src/vendors/` | Vendor registration and pricing rules |
| `src/slots/` | Slot CRUD/sync, pricing, lock, confirm |
| `src/pricing/` | Pure pricing logic from slot + vendor rules |
| `src/locks/` | Redis-backed lock acquire/release |
| `src/analytics/` | Aggregated metrics |

**Module boundaries:** feature modules own their Mongoose schemas and services. Prefer **injecting** `PricingService` and `LockService` from their modules rather than duplicating logic in controllers.

**Controllers** should stay thin: validate via DTOs, call services, return typed results. **Services** own business rules and persistence.

**Errors:** use Nest’s `BadRequestException`, `UnauthorizedException`, `NotFoundException`, and `ConflictException` with **stable, human-readable `message` strings**—clients and [docs/API.md](docs/API.md) rely on them.

**New routes:** add `@ApiTags`, `@ApiOperation`, and response types (`@ApiOkResponse`, etc.). Protected routes use the global API key guard unless marked `@Public()`.

---

## DTOs and validation

- Request bodies and query objects use **class-validator** decorators.
- Global `ValidationPipe` uses **`whitelist: true`** and **`forbidNonWhitelisted: true`**—unknown JSON properties return **400**.
- Pair DTOs with **`@nestjs/swagger`** (`@ApiProperty`, `@ApiPropertyOptional`) so `/docs` stays accurate.

---

## Code quality

```bash
pnpm run lint
```

ESLint is configured with TypeScript type-aware rules and Prettier. Run lint before opening a PR or merging; fix new issues in files you touch.

---

## License

UNLICENSED (private).
