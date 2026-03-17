# Gallery

A photography gallery and storefront for selling digital originals and fine-art prints. Built as a monorepo with a NestJS API, Next.js frontend, and shared TypeScript types.

Payment providers and print fulfillment services are managed as configurable [plugins](PLUGINS.md) from the admin UI — no hardcoded credentials or SKUs.

## Architecture

```text
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

# Generate an encryption key for service credentials
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the output as SERVICE_ENCRYPTION_KEY in .env

# Start both apps in development mode
pnpm dev
```

The API runs on `http://localhost:4000` and the frontend on `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env` at the project root. Both apps read from it.

| Variable                 | Description                                                                    | Default                           |
| ------------------------ | ------------------------------------------------------------------------------ | --------------------------------- |
| `DATABASE_HOST`          | PostgreSQL host                                                                | `localhost`                       |
| `DATABASE_PORT`          | PostgreSQL port                                                                | `5432`                            |
| `DATABASE_NAME`          | Database name                                                                  | `gallery`                         |
| `DATABASE_USER`          | Database user                                                                  | `gallery_user`                    |
| `DATABASE_PASSWORD`      | Database password                                                              |                                   |
| `REDIS_HOST`             | Redis host                                                                     | `localhost`                       |
| `REDIS_PORT`             | Redis port                                                                     | `6379`                            |
| `JWT_SECRET`             | Secret for signing JWTs                                                        | `change-me-in-production`         |
| `JWT_EXPIRES_IN`         | JWT token lifetime                                                             | `7d`                              |
| `ADMIN_INITIAL_PASSWORD` | Initial admin password                                                         | `admin`                           |
| `ADMIN_EMAIL`            | Admin email (for password reset)                                               |                                   |
| `SMTP_HOST`              | SMTP server host                                                               |                                   |
| `SMTP_PORT`              | SMTP server port                                                               | `587`                             |
| `SMTP_USER`              | SMTP username                                                                  |                                   |
| `SMTP_PASS`              | SMTP password                                                                  |                                   |
| `SMTP_FROM`              | From address for emails                                                        | `gallery@ilia.to`                 |
| `ANTHROPIC_API_KEY`      | Claude API key for AI image descriptions                                       |                                   |
| `SERVICE_ENCRYPTION_KEY` | 32-byte hex key for encrypting service credentials (see [Plugins](PLUGINS.md)) |                                   |
| `UPLOAD_DIR`             | Directory for uploaded images                                                  | `/var/www/gallery-uploads`        |
| `PUBLIC_URL`             | Public-facing URL of the API                                                   | `https://gallery.ilia.to`         |
| `CORS_ORIGIN`            | Allowed CORS origin                                                            | `https://gallery.ilia.to`         |
| `NEXT_PUBLIC_API_URL`    | API URL used by the frontend                                                   | `https://gallery.ilia.to`         |
| `NEXT_PUBLIC_UPLOAD_URL` | Base URL for uploaded image files                                              | `https://gallery.ilia.to/uploads` |

Service-specific credentials (BTCPay, PayPal, Prodigi, etc.) are no longer stored as environment variables. They are configured from **Admin > Settings** and stored encrypted in the database. See [PLUGINS.md](PLUGINS.md) for details.

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

On first startup the API seeds the `service_configs` table with default entries for BTCPay, PayPal, and Prodigi (all disabled). Configure them from the admin settings page.

## How prints work

- In the admin panel, enable prints per image and configure which sizes are available with custom retail prices.
- Print SKUs are managed per fulfillment service from **Admin > Settings** — the admin adds SKU codes from the provider's documentation along with descriptions.
- When configuring an image's print options, the admin picks from the combined catalog of all enabled fulfillment services.
- When a customer buys a print, after payment the API sends the order to the configured fulfillment provider with a signed image URL. The provider prints and ships directly to the customer.
- Optionally set a print limit per image for limited editions — the count is enforced atomically in the database.

## Production

PM2 is used for process management (see `ecosystem.config.cjs`). CI/CD is configured via GitHub Actions (`.github/workflows/deploy.yml`) — pushes to `main` trigger lint, type-check, build, and optionally deploy over SSH.

```bash
pnpm build
pm2 start ecosystem.config.cjs
```

The API runs on port 4000 and the frontend on port 3000. Use Nginx or similar to proxy and serve the upload directory.
