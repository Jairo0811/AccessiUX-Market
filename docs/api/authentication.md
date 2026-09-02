# Authentication API

Base path: `/api/v1/auth`

All failures use RFC 9457-style `application/problem+json` responses. Validation failures include an `errors` object keyed by field. Authentication endpoints are rate-limited.

## Session model

Successful registration, login, and refresh responses contain a short-lived bearer token and the current user. The refresh token never appears in the JSON body; it is set as the `accessiux_refresh` `HttpOnly` cookie.

```json
{
  "accessToken": "<jwt>",
  "accessTokenExpiresAtUtc": "2026-09-02T13:30:00Z",
  "tokenType": "Bearer",
  "user": {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "person@example.com",
    "fullName": "Example Person",
    "emailConfirmed": false,
    "roles": ["Customer"]
  }
}
```

## Endpoints

| Method | Path | Authentication | Success |
|---|---|---|---|
| `POST` | `/register` | Public | `201` + session |
| `POST` | `/login` | Public | `200` + session |
| `POST` | `/refresh` | Refresh cookie + trusted origin | `200` + rotated session |
| `POST` | `/logout` | Bearer + refresh cookie + trusted origin | `204` |
| `GET` | `/me` | Bearer | `200` + current user |
| `POST` | `/forgot-password` | Public | Always `202` for valid input |
| `POST` | `/reset-password` | Public reset token | `204` |

### Register

```json
{
  "email": "person@example.com",
  "password": "A-strong-pass1!",
  "fullName": "Example Person"
}
```

New accounts receive the `Customer` role. Email addresses are unique after Identity normalization.

### Login

```json
{
  "email": "person@example.com",
  "password": "A-strong-pass1!"
}
```

Five failed attempts lock the account for 15 minutes. The response remains generic to avoid disclosing account state.

### Forgot and reset password

Forgot-password accepts `{ "email": "person@example.com" }` and returns the same accepted response whether or not the account exists. Reset-password accepts:

```json
{
  "email": "person@example.com",
  "token": "<url-decoded-identity-token>",
  "newPassword": "Another-pass2!"
}
```

SMTP delivery is disabled by default. Configure the `Smtp` section entirely through runtime secrets before enabling it.
