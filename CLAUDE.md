# Project Guidelines

## Security: Admin Endpoint Authorization

All API endpoints intended for admin use **must** use both `JwtAuthGuard` and `AdminGuard`:

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
```

Using `JwtAuthGuard` alone only verifies the user is authenticated — it does **not** check their role. Any authenticated artist can access endpoints protected only by `JwtAuthGuard`. Always pair it with `AdminGuard` for admin-only routes.

## Code Quality: No Lint Errors

After editing any file, ensure there are no lint errors or warnings. In particular:

- No `@typescript-eslint/no-unused-vars` — remove any unused variables, imports, or functions.
- No `@typescript-eslint/no-explicit-any` — **never** use `any`. Use proper types, `unknown`, or generics instead.
- Run `pnpm turbo lint` after every change.
- Run `pnpm --filter @gallery/web exec tsc --noEmit` after completing a feature to catch type errors that lint misses (e.g., mismatched API return types).

## Code Quality: Icons

SVG icons must be in separate files under `apps/web/src/components/icons/`. Do not inline SVGs — import the icon component instead. Follow the existing pattern (e.g., `download-icon.tsx`).

## Database: Keep db-sync.ts in Sync

When adding or modifying entities, **always** update `apps/api/src/db-sync.ts` to include the new entity in its `entities` array. This file is used in production to create/alter tables (`pnpm db:sync`). If an entity is registered in `app.module.ts` but missing from `db-sync.ts`, the table won't exist in production and the app will crash on startup.

## Server: System Dependencies

HEIC/HEIF image upload support requires system packages on the server (Ubuntu 22.04):

```bash
apt-get install -y libheif-dev libheif-examples libvips-dev
```

- `libheif-examples` provides `heif-convert` CLI used by the API to convert HEIC to JPEG on upload
- `libvips-dev` and `libheif-dev` are build dependencies

## Payments: Adding a New Payment Provider

Payment providers follow a plugin pattern. To add one:

1. Create `apps/api/src/services/providers/<name>/<name>.provider.ts` implementing `PaymentProvider` interface
2. Create `.env.example` in the same directory with required env vars
3. Create `.env` with actual credentials (gitignored)
4. Register in `apps/api/src/services/services.module.ts` (providers array + constructor + `onModuleInit`)
5. Add seed config in `apps/api/src/services/services.service.ts` (`onModuleInit` seed array + `ensureProvider` for existing DBs)
6. Add button styling in `apps/web/src/app/checkout/page.tsx` (`PROVIDER_STYLES`)

Existing providers: PayPal (inline capture), BTCPay (redirect + webhook), Stripe (redirect + webhook).

Webhook endpoint for all providers: `POST /api/payments/<provider>/webhook`. Requires `rawBody` access (enabled in `main.ts`).

## Print Options: Per-Option Limits

Print edition limits can be tracked at two levels:

1. **Image-level** (default): `images.print_limit` / `images.prints_sold` — shared across all print options
2. **Per-option**: `image_print_options.print_limit` / `image_print_options.sold_count` — each SKU has its own limit

Toggle via `images.per_option_limits` (boolean). When per-option is enabled, the image-level fields are ignored. The `soldCount` is preserved across saves by matching on SKU.

Key files:

- `images.service.ts` — `incrementPrintsSold()` (image-level) and `incrementOptionSoldCount()` (per-option), both use atomic SQL updates
- `orders.service.ts` — validates sold-out status at order creation
- `payments.service.ts` — increments the correct counter after payment

## Print Options: SKU Catalog Dimensions

Fulfillment provider SKU catalogs (`service_configs.skus` JSONB) support `widthCm` / `heightCm`. When an admin selects a SKU on a print option, dimensions auto-fill and lock (read-only). Configured in admin settings per provider.

## Images: Physical Size

Images have optional physical dimensions (`size_width_cm`, `size_height_cm`). Admin enters in inches (converted to cm for storage). Displayed on the frontend detail page in inches when both values are set.

## Chat: Multi-Turn Conversation

The chat service (`chat.service.ts`) sends full conversation history (user + assistant messages) to the AI, preserving proper role alternation. The `callAi` method accepts `{ role, content }[]` — do not strip assistant messages.

## Security: Post-Change Security Audit

After **any** code changes, run the `security-vuln-checker` agent to assess security risks. This applies to all changes — new features, bug fixes, refactors, dependency updates, etc.
