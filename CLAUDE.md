# Project Guidelines

## Security: Admin Endpoint Authorization

All API endpoints intended for admin use **must** use both `JwtAuthGuard` and `AdminGuard`:

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
```

Using `JwtAuthGuard` alone only verifies the user is authenticated — it does **not** check their role. Any authenticated artist can access endpoints protected only by `JwtAuthGuard`. Always pair it with `AdminGuard` for admin-only routes.

## Security: Post-Change Security Audit

After **any** code changes, run the `security-vuln-checker` agent to assess security risks. This applies to all changes — new features, bug fixes, refactors, dependency updates, etc.
