# ADR 0002: Identity and session security

- Status: Accepted
- Date: 2026-09-02

## Context

AccessiUX Market needs first-party accounts for customers, sellers, and administrators. Browser sessions must remain usable without storing long-lived credentials in JavaScript-accessible storage, and a stolen refresh token must not remain reusable indefinitely.

## Decision

- ASP.NET Core Identity owns user, password, lockout, role, and password-reset behavior.
- Access tokens are signed JWTs with a 15-minute default lifetime and are held only in Angular application memory.
- Refresh tokens are opaque, generated from cryptographically secure random bytes, persisted only as SHA-256 hashes, and delivered in an `HttpOnly`, `SameSite=Strict` cookie.
- Each refresh operation rotates the token. Reuse of a revoked token revokes the complete token family.
- Session-changing cookie endpoints validate the browser origin against the configured frontend allowlist.
- Authentication and password-reset endpoints use independent IP-based rate limits.
- Resetting a password rotates the Identity security stamp and revokes active refresh tokens.

## Consequences

The browser can renew a session without exposing the refresh credential to application JavaScript. Token rotation requires persistent state and a serializable transaction, but enables server-side logout, replay detection, and family revocation.

Deployments must provide a secret signing key, a SQL Server connection string, HTTPS, an exact CORS origin allowlist, and an SMTP provider when email delivery is enabled.

## Rejected alternatives

- Browser `localStorage` for refresh tokens: increases the impact of XSS.
- Long-lived access tokens without refresh state: prevents reliable revocation.
- Wildcard credentialed CORS: broadens cross-origin exposure and is incompatible with an explicit trust boundary.
