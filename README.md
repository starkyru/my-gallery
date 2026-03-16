# Gallery

A photography gallery and storefront for selling digital originals and fine-art prints. Built as a monorepo with a NestJS API, Next.js frontend, and shared TypeScript types.

Prints are fulfilled via [Prodigi](https://www.prodigi.com/) (print-on-demand) with support for limited editions and per-image pricing.

## Architecture

```
apps/
  api/        NestJS 10 — REST API, TypeORM, PostgreSQL
  web/        Next.js 15 — React 19, Zustand, Tailwind CSS, GSAP
packages/
  shared/     Shared TypeScript types and enums
```

## Prerequisites

- Node.js >= 22 (see `.nvmrc`)
- pnpm 10+
- PostgreSQL
- Redis

## Getting started

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env

# Start both apps in development mode
pnpm dev
```

The API runs on `http://localhost:4000` and the frontend on `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env` at the project root. Both apps read from it.

| Variable                 | Description                              | Default                           |
| ------------------------ | ---------------------------------------- | --------------------------------- |
| `DATABASE_HOST`          | PostgreSQL host                          | `localhost`                       |
| `DATABASE_PORT`          | PostgreSQL port                          | `5432`                            |
| `DATABASE_NAME`          | Database name                            | `gallery`                         |
| `DATABASE_USER`          | Database user                            | `gallery_user`                    |
| `DATABASE_PASSWORD`      | Database password                        |                                   |
| `REDIS_HOST`             | Redis host                               | `localhost`                       |
| `REDIS_PORT`             | Redis port                               | `6379`                            |
| `JWT_SECRET`             | Secret for signing JWTs                  | `change-me-in-production`         |
| `JWT_EXPIRES_IN`         | JWT token lifetime                       | `7d`                              |
| `ADMIN_INITIAL_PASSWORD` | Initial admin password                   | `admin`                           |
| `ANTHROPIC_API_KEY`      | Claude API key for AI image descriptions |                                   |
| `BTCPAY_URL`             | BTCPay Server URL                        |                                   |
| `BTCPAY_API_KEY`         | BTCPay API key                           |                                   |
| `BTCPAY_STORE_ID`        | BTCPay store ID                          |                                   |
| `PAYPAL_CLIENT_ID`       | PayPal client ID                         |                                   |
| `PAYPAL_CLIENT_SECRET`   | PayPal client secret                     |                                   |
| `PAYPAL_WEBHOOK_ID`      | PayPal webhook ID                        |                                   |
| `PRODIGI_API_KEY`        | Prodigi API key for print fulfillment    |                                   |
| `PRODIGI_SANDBOX`        | Use Prodigi sandbox environment          | `true`                            |
| `UPLOAD_DIR`             | Directory for uploaded images            | `/var/www/gallery-uploads`        |
| `PUBLIC_URL`             | Public-facing URL of the API             | `https://gallery.ilia.to`         |
| `CORS_ORIGIN`            | Allowed CORS origin                      | `https://gallery.ilia.to`         |
| `NEXT_PUBLIC_API_URL`    | API URL used by the frontend             | `https://gallery.ilia.to`         |
| `NEXT_PUBLIC_UPLOAD_URL` | Base URL for uploaded image files        | `https://gallery.ilia.to/uploads` |

## Scripts

```bash
pnpm dev           # Start API and frontend in dev mode
pnpm build         # Build all packages
pnpm lint          # Lint all packages
pnpm type-check    # Run TypeScript type checking
pnpm format        # Format code with Prettier
```

## Database

TypeORM with PostgreSQL. In development (`NODE_ENV != production`) the schema auto-syncs — no migrations needed. Create the database beforehand:

```sql
CREATE USER gallery_user WITH PASSWORD 'your_password';
CREATE DATABASE gallery OWNER gallery_user;
```

## Production

PM2 is used for process management (see `ecosystem.config.cjs`). CI/CD is configured via GitHub Actions (`.github/workflows/deploy.yml`) — pushes to `main` trigger lint, type-check, build, and optionally deploy over SSH.

```bash
pnpm build
pm2 start ecosystem.config.cjs
```

The API runs on port 4000 and the frontend on port 3000. Use Nginx or similar to proxy and serve the upload directory.
