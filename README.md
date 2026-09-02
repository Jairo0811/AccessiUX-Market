# AccessiUX Market

**Accessible & Usable E-Commerce Platform**

AccessiUX Market is an e-commerce platform designed around accessibility, usability, error prevention, and user control.

The project evolves from an academic usability, accessibility, and security audit of Amazon.com. Instead of reproducing Amazon, AccessiUX Market turns the audit findings into a new implementation where UX and accessibility are architectural requirements from the beginning.

## Project goals

- Build an accessible marketplace aligned with WCAG principles.
- Apply Jakob Nielsen's usability heuristics to real product flows.
- Reduce cognitive load in catalog, navigation, and checkout experiences.
- Give users explicit control over orders and reversibility.
- Standardize seller information and marketplace policies.
- Measure UX improvements with automated and user-based evidence.

## Initial requirements derived from the UX audit

| ID | Requirement |
| --- | --- |
| AM-UX-001 | Visible and time-bounded order cancellation |
| AM-UX-002 | Standardized seller policy presentation |
| AM-UX-003 | Simple Reading Mode / accessibility preferences |
| AM-UX-004 | Dynamic faceted filtering with result counts |
| AM-UX-005 | Full keyboard navigation and focus management |
| AM-UX-006 | Checkout designed for visibility and error prevention |

## Technology stack

### Frontend
- Angular
- TypeScript
- Angular CDK
- SCSS
- Playwright
- axe-core

### Backend
- .NET 10
- ASP.NET Core Web API
- C#
- Entity Framework Core
- FluentValidation
- SQL Server

### Platform
- Docker / Docker Compose
- GitHub Actions
- OpenAPI
- Health checks

## Architecture

The backend follows a pragmatic Clean Architecture:

```text
Api
 ├── Application
 └── Infrastructure
       └── Application
             └── Domain
```

```text
backend/
├── src/
│   ├── AccessiUXMarket.Api/
│   ├── AccessiUXMarket.Application/
│   ├── AccessiUXMarket.Domain/
│   └── AccessiUXMarket.Infrastructure/
└── tests/
    ├── AccessiUXMarket.UnitTests/
    └── AccessiUXMarket.IntegrationTests/

frontend/
└── accessible-market-web/

docs/
├── accessibility/
├── architecture/
├── ux/
└── adr/
```

## Development roadmap

| Phase | Scope |
| --- | --- |
| 0 | Foundation, architecture, Docker, CI and documentation |
| 1 | Identity and users |
| 2 | Catalog, categories and sellers |
| 3 | Search and dynamic facets |
| 4 | Cart |
| 5 | Checkout |
| 6 | Orders and cancellations |
| 7 | Advanced accessibility |
| 8 | UX Lab, testing and production readiness |

## Local infrastructure

Start SQL Server:

```bash
docker compose up -d sqlserver
```

Run the API:

```bash
dotnet run --project backend/src/AccessiUXMarket.Api
```

Health endpoint:

```text
GET /health
```

## Status

Current milestone: **v0.1.0 — Foundation**.

## License

License to be defined before the first public release.
