# Changelog

All notable changes to AccessiUX Market are documented in this file.

## [Unreleased]

### Added

- Marketplace catalog domain with categories, seller profiles, products, stock, prices, currencies, and product lifecycle states.
- Public catalog API for active categories, published products, product detail, and public seller profiles.
- Protected seller API for profile creation, product drafts, seller inventory, and publication.
- Automatic `Seller` role assignment when an authenticated user creates a seller profile.
- EF Core catalog persistence, SQL Server migration, relational constraints, and unique/indexed slugs.
- Idempotent default-category seed for Tecnología, Hogar, Moda, Salud y bienestar, and Libros y educación.
- Angular public catalog and product-detail experiences.
- Accessible Angular seller dashboard for seller onboarding, product creation, inventory visibility, and publication.
- Catalog domain unit tests and Playwright/axe coverage for the public catalog.

### Changed

- API product version advanced from `0.2.0` Identity and Users to `0.3.0` Catalog, Categories and Sellers.
- Seller authorization now combines the Identity `Seller` role with server-side seller ownership checks.

## [0.2.0] - 2026-09-02

### Added

- ASP.NET Core Identity with `Customer`, `Seller`, and `Administrator` roles.
- SQL Server persistence through EF Core and the initial Identity migration.
- JWT access tokens and opaque, hashed, rotating refresh-token families.
- Registration, login, refresh, logout, current-user, forgot-password, and reset-password endpoints.
- FluentValidation, standardized Problem Details, account lockout, rate limiting, trusted-origin checks, and security headers.
- Angular authentication experience with accessible form feedback and protected account routing.
- xUnit unit, integration, architecture, Playwright, and axe-core test suites.
- Separate backend and frontend CI jobs.

### Changed

- Updated the project version from `0.1.0` Foundation to `0.2.0` Identity and Users.
- Corrected Angular 22.1 dependency compatibility by adopting TypeScript 6.
- Removed the default SQL Server password from Docker Compose.
