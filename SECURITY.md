# Security policy

## Supported versions

Security fixes are applied to the current development line until the project publishes a stable release policy.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, personal data, or active tokens. Use GitHub's private vulnerability reporting feature for this repository. Include the affected endpoint or component, reproduction steps, impact, and a safe proof of concept when available.

## Secret handling

- Never commit database passwords, JWT signing keys, SMTP credentials, tokens, or production connection strings.
- Configure secrets through environment variables or the deployment platform's secret store.
- Rotate any value immediately if it appears in source control, logs, screenshots, or shared test data.
- Use HTTPS in every non-local environment.

## Identity controls

The current identity implementation includes password hashing through ASP.NET Core Identity, account lockout, short-lived JWT access tokens, hashed rotating refresh tokens, replay-family revocation, origin checks for cookie-backed session operations, rate limiting, generic password-reset responses, strict CORS, security headers, and structured Problem Details without stack traces.
