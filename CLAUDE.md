# Project Guidelines

## Security: Admin Endpoint Authorization

All API endpoints intended for admin use **must** use both `JwtAuthGuard` and `AdminGuard`:

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
```

Using `JwtAuthGuard` alone only verifies the user is authenticated — it does **not** check their role. Any authenticated artist can access endpoints protected only by `JwtAuthGuard`. Always pair it with `AdminGuard` for admin-only routes.
