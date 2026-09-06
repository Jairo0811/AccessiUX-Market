# Changelog

All notable changes to AccessiUX Market are documented in this file.

## [Unreleased]

## [0.7.0] - 2026-09-06

### Added

- Authenticated order history and order-detail API scoped to the current user.
- Server-authoritative cancellation metadata with `canCancel`, `cancelUntilUtc`, and `cancellationMessage`.
- Configurable order-cancellation window through `Orders:CancellationWindowMinutes`, defaulting to 30 minutes.
- Transactional order cancellation with SQL Server `Serializable` isolation and EF Core execution strategy.
- Atomic restoration of product inventory when an eligible order is cancelled.
- Protected Angular routes for `/orders` and `/orders/:id`.
- Accessible order history, detail, cancellation eligibility messaging, explicit cancellation confirmation, and live feedback.
- Unit and SQL Server integration coverage for cancellation rules, authentication, ownership, status transitions, duplicate cancellation prevention, and stock restoration.
- Playwright/axe coverage for order history and the cancellation-confirmation flow.
- Orders API, UX, and architecture documentation.

### Changed

- API product version advanced from `0.6.0` Checkout to `0.7.0` Orders and Cancellations.
- Authenticated navigation now exposes `Mis pedidos` directly.
- Cancellation eligibility is decided by the backend rather than inferred from the browser clock.

## [0.6.0] - 2026-09-06

### Added

- Protected checkout route and accessible review-before-confirmation experience.
- `POST /api/v1/checkout/review` for server-side review of address, payment-method selection, cart lines, stock, currency, and totals.
- `POST /api/v1/checkout/confirm` for transactional order creation.
- `Order` and `OrderItem` persistence with immutable product, price, and delivery-address snapshots.
- Stock revalidation and inventory decrement during confirmation.
- Atomic cart clearing after successful checkout.
- SQL Server migration for checkout orders.
- Unit and integration coverage for order snapshots, stock guards, confirmation, cart clearing, and stock revalidation.
- Playwright/axe coverage for the accessible checkout review flow.
- NORTIC B2 accessibility statement and regression coverage.

### Changed

- API product version advanced from `0.5.0` Cart to `0.6.0` Checkout.
- Explicit checkout transactions execute through EF Core's configured retry strategy.
- Card selection represents a payment-method choice only; AccessiUX Market does not store card data.

## [0.5.0] - 2026-09-04

### Added

- Persistent authenticated cart backed by SQL Server and EF Core.
- Cart line domain model keyed by user and product, preventing duplicate product rows per user.
- Authenticated cart API for reading, adding, updating, removing, and clearing cart items.
- Server-side stock validation and a `1-99` quantity limit per cart line.
- Protection against combining products with different currencies in the same cart.
- Accessible Angular cart experience with quantity editing, removal, clear-cart confirmation, subtotal, empty-state guidance, and live announcements.
- Add-to-cart flow from public product detail for authenticated customers.
- SQL Server integration coverage for authentication, persistence, stock enforcement, line merging, and user isolation.
- Playwright/axe coverage for the protected empty-cart experience.
- Cart API documentation in `docs/api/cart.md`.

### Changed

- API product version advanced from `0.4.0` Search and Dynamic Filters to `0.5.0` Cart.
- Product prices and stock used by the cart are always sourced server-side rather than trusted from client payloads.

## [0.4.0] - 2026-09-04

### Added

- Public catalog search endpoint with free-text search over product names and descriptions.
- Dynamic filtering by category, minimum/maximum price, and stock availability.
- Deterministic sorting by relevance/default name, newest, name, and ascending/descending price.
- Server-side pagination with bounded page sizes and total-page metadata.
- Dynamic category facets with result counts plus catalog minimum/maximum price metadata.
- Angular accessible search/filter form with URL-synchronized state for shareable and navigable searches.
- Accessible catalog pagination, result announcements, empty-state guidance, and filter reset flow.
- SQL Server integration tests for combined filters, pagination, sorting, and invalid price ranges.
- Playwright/axe coverage for search controls, empty results, and URL filter synchronization.

### Changed

- API product version advanced from `0.3.0` Catalog, Categories and Sellers to `0.4.0` Search and Dynamic Filters.
- Public catalog browsing now consumes the paged search contract instead of loading every published product at once.

## [0.3.0] - 2026-09-03

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
