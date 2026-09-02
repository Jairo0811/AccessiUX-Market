# Identity testing

## Test layers

- `AccessiUXMarket.UnitTests`: refresh-token invariants and request validation.
- `AccessiUXMarket.ArchitectureTests`: project dependency boundaries.
- `AccessiUXMarket.IntegrationTests`: the real API, EF Core migrations, and SQL Server 2022 through Testcontainers.
- `frontend/accessible-market-web/e2e`: keyboard-visible authentication UI and automated axe-core checks in Chromium.

## Local commands

```bash
dotnet restore backend/AccessiUXMarket.sln
dotnet build backend/AccessiUXMarket.sln --configuration Release --no-restore
dotnet test backend/AccessiUXMarket.sln --configuration Release --no-restore --no-build

cd frontend/accessible-market-web
npm ci
npm run build
npx playwright install chromium
npm test
```

Docker must be running for the integration tests. Tests create and remove their own isolated SQL Server container; they do not use the developer database from `docker-compose.yml`.

## Covered security behavior

- registration and duplicate-email conflict;
- login and authenticated `/me` access;
- refresh-token rotation and replay-family revocation;
- logout revocation;
- password-reset enumeration resistance;
- request validation and password policy;
- Clean Architecture dependency direction.

The CI workflow runs every layer on pushes to `main` and `feature/**`, and on pull requests targeting `main`.
