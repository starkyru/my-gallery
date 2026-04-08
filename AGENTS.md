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

## Security: Post-Change Security Audit

After **any** code changes, run the `security-vuln-checker` agent to assess security risks. This applies to all changes — new features, bug fixes, refactors, dependency updates, etc.
