# ADR 0001: Pragmatic Clean Architecture

- Status: Accepted
- Date: 2026-09-01

## Context

AccessiUX Market must remain maintainable as catalog, ordering, accessibility, and UX analytics capabilities grow. The project also needs strong separation between business rules and infrastructure concerns.

## Decision

The backend will use a pragmatic Clean Architecture with four projects:

- `AccessiUXMarket.Domain`: enterprise/domain rules with no framework dependencies.
- `AccessiUXMarket.Application`: use cases and application contracts; depends on Domain.
- `AccessiUXMarket.Infrastructure`: persistence and external service implementations; depends on Application.
- `AccessiUXMarket.Api`: HTTP composition root and transport layer; depends on Application and Infrastructure.

Features will be organized by business capability rather than generic technical folders where practical.

## Consequences

### Positive

- Business logic remains testable and independent from ASP.NET Core and EF Core.
- Infrastructure can evolve without contaminating the domain model.
- The project can grow toward modular boundaries without an early microservices split.

### Trade-offs

- More projects and explicit dependency boundaries than a simple CRUD application.
- Requires discipline to avoid leaking persistence concerns into Domain/Application.

## Rejected alternatives

- Single-project API: simpler initially but weakens long-term separation of responsibilities.
- Microservices: premature for the current scope and would add operational complexity without sufficient benefit.
