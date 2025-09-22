# Truetag Backend (MVP)

Production-ready, scalable ecommerce-aggregator backend. MVP includes:
- User auth (signup, login, JWT + refresh tokens)
- PostgreSQL schema and migrations (users, products, offers, price_snapshots, reviews, review_summaries, user_events, recommendation_cache, refresh_tokens)
- Express API with OpenAPI docs at `/api/v1/docs`
- Health endpoint at `/health`
- Docker Compose for local Postgres, Redis, Kafka

Planned next: eBay connector, canonical products + offers, price snapshots, Redis caching, cold-start recommendations, basic reviews ingestion + sentiment.

## Tech Stack
- Node.js 18+, TypeScript
- Express, Knex (Postgres)
- Redis client
- JWT auth (access + refresh)
- Swagger (OpenAPI) docs
- Winston logger

## Getting Started (Local)

1) Prerequisites
- Node.js >= 18
- Docker + Docker Compose

2) Clone and install deps
```
npm install
```

3) Start infrastructure (Postgres, Redis, Kafka)
```
docker-compose up -d
```

4) Configure env
```
cp .env.example .env
# edit .env if needed (DB_USER/DB_PASSWORD/DB_NAME must match docker-compose)
```

5) Run database migrations
```
npm run migrate
```

6) Start the dev server
```
npm run dev
```

Server will start at:
- API base: http://localhost:3000/api/v1
- Docs: http://localhost:3000/api/v1/docs
- Health: http://localhost:3000/health

## API Examples (curl)

Signup
```
curl -s -X POST http://localhost:3000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "alice@example.com",
    "password": "StrongPassw0rd!",
    "declared_interests": ["electronics", "laptops"]
  }'
```

Login
```
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "alice@example.com",
    "password": "StrongPassw0rd!"
  }'
```

Refresh token
```
curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refresh_token": "<paste-refresh-token>"
  }'
```

## Project Structure
```
src/
  app.ts
  server.ts
  config/
    env.ts
    db.ts
    redis.ts
  controllers/
    authController.ts
    userController.ts
  middleware/
    auth.ts
    errorHandler.ts
  models/
    user.ts
    refreshToken.ts
  routes/
    index.ts
    v1/
      auth.ts
      users.ts
  utils/
    jwt.ts
    logger.ts
    password.ts
  docs/
    swagger.ts
migrations/
seeds/
```

## Notes
- Postgres extensions `pgcrypto` and `uuid-ossp` are enabled via migration `000_enable_extensions.js` for UUID generation.
- Path alias `@` points to `src/` in TypeScript and to `dist/` at runtime; dev uses `tsconfig-paths/register`, prod uses `module-alias/register`.
- Rate limiting is enabled globally; tune via `.env`.

## Next Milestones
- eBay connector ingestion and normalization
- Canonicalization/dedupe
- Product detail + offers + 7-day price_series (Redis cached)
- Redis caching and cache invalidation on price updates
- Basic recommendations (cold-start via declared interests)
- Tests (unit + integration) and CI pipeline
- Observability (Prometheus metrics, dashboards)
