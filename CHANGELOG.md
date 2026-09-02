# Changelog

All notable changes to AccessiUX Market are documented in this file.

## [Unreleased]

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
