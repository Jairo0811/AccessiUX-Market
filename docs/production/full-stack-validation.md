# Full-stack validation evidence — v1.0.1

This document preserves the reproducible validation evidence used to close **AccessiUX Market v1.0.1**. It complements `release-readiness.md` and records only results produced by GitHub Actions and the repository's automated smoke/regression suites.

## Release candidate validated

The final hardening pull request was **PR #15 — `feat: harden role privileges, seller dashboard and v1.0.1 runtime`**.

- Final PR head: `5beca201003979a38a183d9f7899b82b81fd0997`
- Merge commit on `main`: `8ffc91305588c44aaa042826ae04773baf88d8e8`
- Merge date: **2026-09-12**

The release gate required both the standard CI workflow and the real full-stack smoke workflow to pass on the same candidate before merge.

## Pre-merge evidence

The final PR head completed both required workflows successfully:

| Workflow | Run | Result |
|---|---:|:---:|
| CI | #326 | ✅ Success |
| Full-stack smoke | #91 | ✅ Success |

This validated the release candidate before it entered `main`.

## Post-merge evidence on `main`

After PR #15 was merged, the merge commit was validated again from `main`:

| Workflow | Run | Commit | Result |
|---|---:|---|:---:|
| CI | #327 | `8ffc91305588c44aaa042826ae04773baf88d8e8` | ✅ Success |
| Full-stack smoke | #92 | `8ffc91305588c44aaa042826ae04773baf88d8e8` | ✅ Success |

GitHub Actions also reported the three release checks as successful on the merge commit:

- `Frontend · build and accessibility`
- `Backend · build and test`
- `Real stack smoke`

## Verified automated baseline

The final validated baseline for `v1.0.1` is:

- **22/22 Playwright + axe accessibility/browser tests passing**;
- **44/44 backend tests passing**:
  - 16 unit tests;
  - 25 SQL Server integration tests;
  - 3 architecture tests;
- Angular production build passing;
- `npm ci` reporting **0 vulnerabilities** during the real-stack validation;
- SQL Server 2022 reaching the expected healthy state;
- Development Customer, Seller and Administrator accounts authenticating successfully;
- seller profile and standardized commercial policies available in the real API flow;
- product creation/publication available to Seller;
- Customer rejected from the administrative overview endpoint;
- browser login/session restoration working against the real backend;
- seller and administrator navigation/dashboard flows working against the real backend;
- checkout reducing the smoke product inventory from **5 → 3**;
- eligible cancellation restoring inventory atomically from **3 → 5**.

## Reproducible scenario

The validation is implemented by repository-owned automation rather than by a manually described happy path:

- `.github/workflows/ci.yml`
- `.github/workflows/full-stack-smoke.yml`
- `scripts/full-stack-api-smoke.sh`
- `frontend/accessible-market-web/e2e/full-stack.smoke.mjs`

The real-stack smoke exercises SQL Server 2022, the Development API, EF Core migrations/demo seed, Angular and Chromium. The backend regression suite is executed again after the real-stack scenario so that the smoke environment cannot hide a regression in the standard test suite.

## Evidence policy

Only automated, reproducible results are claimed here. No human UX metrics are inferred from Playwright or axe results.

Human task-completion, SEQ, SUS and assistive-technology observations remain governed by `docs/ux/phase-8-ux-lab.md` and must stay unreported until sessions with real participants are actually conducted.

## Known release boundaries

The following are deliberate boundaries of `v1.0.1`, not failed release criteria:

- card selection represents a payment-method choice only; the application does not process or store PCI card data;
- SMTP delivery depends on external provider configuration and may remain disabled in local/testing environments;
- OpenTelemetry, specialized search infrastructure and distributed cache are future scaling options rather than release dependencies;
- deployment to a public production host requires environment-specific secrets, HTTPS/CORS configuration, SQL Server deployment and SMTP configuration where enabled.

## Closure

With the pre-merge and post-merge gates passing, **AccessiUX Market v1.0.1 is considered a stable portfolio release**. Future functionality should be introduced under a new version rather than expanding the scope of this release retrospectively.
