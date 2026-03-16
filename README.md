# Gallery

A photography gallery and storefront for selling digital originals and fine-art prints. Built as a monorepo with a NestJS API, Next.js frontend, and shared TypeScript types.

Prints are fulfilled via [Prodigi](https://www.prodigi.com/) (print-on-demand) with support for limited editions and per-image pricing.

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

## BTCPay Server

BTCPay Server handles Bitcoin/Lightning payments. You need a running instance — either self-hosted or via a third-party host.

1. Deploy or sign up for a BTCPay Server instance (see [docs.btcpayserver.org](https://docs.btcpayserver.org/Deployment/)).
2. Create a store in the BTCPay dashboard.
3. Go to **Account > Manage Account > API Keys**, create a key with these permissions:
   - `btcpay.store.cancreateinvoice`
   - `btcpay.store.canviewinvoices`
4. Set up a webhook in the store settings (**Settings > Webhooks**):
   - URL: `https://your-domain.com/api/payments/btcpay/webhook`
   - Events: `InvoiceSettled`
5. Fill in the env vars:

```bash
BTCPAY_URL=https://your-btcpay-instance.com
BTCPAY_API_KEY=your-api-key
BTCPAY_STORE_ID=your-store-id
```

## PayPal

PayPal handles card and PayPal balance payments via the Orders v2 API.

1. Create an app at [developer.paypal.com/dashboard/applications](https://developer.paypal.com/dashboard/applications/sandbox).
2. Copy the **Client ID** and **Secret** from the app credentials page.
3. For sandbox testing, use the sandbox app credentials. Switch to the live app for production.
4. Set up a webhook under **My Apps & Credentials > Webhooks**:
   - URL: `https://your-domain.com/api/payments/paypal/webhook`
   - Events: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`
5. Copy the **Webhook ID** from the created webhook.
6. Fill in the env vars:

```bash
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_WEBHOOK_ID=your-webhook-id
```

The app auto-selects the sandbox or live API based on `NODE_ENV` (`production` uses live, everything else uses sandbox).

## Prodigi (print fulfillment)

Prodigi handles printing and shipping of fine-art prints. No subscription — you pay per order.

1. Create an account at [prodigi.com](https://www.prodigi.com/).
2. Go to **Dashboard > Settings > API Keys** and copy your API key.
3. Use sandbox mode for testing — orders won't be printed or charged.
4. Fill in the env vars:

```bash
PRODIGI_API_KEY=your-api-key
PRODIGI_SANDBOX=true          # set to false for production
```

5. Set up a webhook in the Prodigi dashboard (**Settings > Webhooks**):
   - URL: `https://your-domain.com/api/prodigi/webhook`
   - This receives order status updates (shipped, delivered, etc.)

### How prints work

- In the admin panel, enable prints per image and configure which sizes are available with custom retail prices.
- The available SKUs are hardcoded in the API (`GLOBAL-PHO-8x10-FP`, `GLOBAL-PHO-16x20-FP`, etc.) and shown as a dropdown in the admin UI.
- When a customer buys a print, after payment the API sends the order to Prodigi with a signed image URL. Prodigi fetches the original, prints it, and ships directly to the customer.
- Optionally set a print limit per image for limited editions — the count is enforced atomically in the database.

## Production

PM2 is used for process management (see `ecosystem.config.cjs`). CI/CD is configured via GitHub Actions (`.github/workflows/deploy.yml`) — pushes to `main` trigger lint, type-check, build, and optionally deploy over SSH.

```bash
pnpm build
pm2 start ecosystem.config.cjs
```

The API runs on port 4000 and the frontend on port 3000. Use Nginx or similar to proxy and serve the upload directory.
