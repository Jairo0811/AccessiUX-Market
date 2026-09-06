# Production release readiness

This checklist defines the minimum operational gate for AccessiUX Market v1.0.0. It is intentionally limited to capabilities present in the repository.

## Runtime configuration

Production must provide values for:

- `ConnectionStrings__DefaultConnection`;
- `Cors__AllowedOrigins__*` with explicit HTTPS origins;
- `Jwt__Issuer` and `Jwt__Audience`;
- `Jwt__SigningKey` with at least 32 bytes of secret material;
- `PasswordReset__FrontendUrl`;
- SMTP settings when email delivery is enabled;
- `Orders__CancellationWindowMinutes` within the validated range.

Do not commit production credentials to the repository.

## Database deployment

1. Back up the target SQL Server database.
2. Apply EF Core migrations using the release build/configuration.
3. Verify `/health/ready` returns a healthy response after migration.
4. Keep the previous application artifact available until smoke tests pass.
5. If rollback is required, restore the database backup when a migration is not safely reversible with `Down` alone.

## Health probes

- `GET /health/live` — process/liveness only; does not depend on SQL Server.
- `GET /health/ready` — readiness probe; includes the application database check.
- `GET /health` — compatibility endpoint containing the full registered health-check set.

Recommended orchestrator behavior: use `/health/live` for restart decisions and `/health/ready` for traffic eligibility.

## Security gate

Before release confirm:

- HTTPS termination is enabled and HSTS is active outside development;
- CORS contains only intended frontend origins;
- JWT signing key is not a sample/default value;
- refresh cookies remain `HttpOnly` and secure according to environment configuration;
- authentication and password-reset rate limits are configured;
- security headers are present on representative API responses;
- `npm audit --audit-level=high` passes in CI;
- backend package vulnerability inventory is reviewed in CI.

## Functional smoke gate

The release candidate must verify at minimum:

1. registration/login/refresh;
2. seller profile and standardized commercial policies;
3. product creation/publication;
4. catalog search/filter/pagination;
5. public product detail and seller-policy visibility;
6. cart operations;
7. checkout review and confirmation;
8. order history/detail;
9. eligible cancellation with inventory restoration;
10. accessibility preferences, keyboard navigation, skip link, route focus, and axe regressions.

## CI gate

A release candidate is eligible to merge only when the same commit has:

- backend restore/build/test success, including SQL Server integration tests;
- frontend dependency install and high-severity audit success;
- Angular production build success;
- Playwright Chromium installation success;
- complete Playwright/axe suite success.

## Known boundaries of v1.0.0

- Payment card selection is a method choice only; the application does not process or store PCI card data.
- SMTP delivery depends on external provider configuration and can be disabled for local/testing environments.
- Human UX metrics are not claimed until the UX Lab protocol is executed with real participants.
- Specialized search infrastructure, distributed cache, and full telemetry are future scaling options, not v1.0.0 dependencies.
