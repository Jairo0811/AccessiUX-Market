# UX Requirements Baseline

This document turns the original usability/accessibility audit findings into implementation requirements for AccessiUX Market.

## AM-UX-001 — Order reversibility

Users must be able to identify whether a recently created order is cancellable and cancel it within the configured cancellation window before fulfillment blocks the action.

**Implementation status:** completed in Phase 6 with server-authoritative eligibility and transactional inventory restoration.

## AM-UX-002 — Standardized seller policies

Seller warranty, shipping, and return information must use a consistent structure and visual placement across marketplace product experiences.

**Implementation status:** pending.

## AM-UX-003 — Simple Reading Mode

The application must provide a user-controlled simplified experience that can reduce animation, promotional density, and unnecessary visual noise while preserving all essential commerce actions.

**Implementation status:** completed in Phase 7. The accessibility preferences panel provides persistent Simple Reading Mode, reduced motion, increased contrast, and larger text controls. Preferences apply from application startup and can be reset by the user.

## AM-UX-004 — Dynamic faceted filtering

Filter controls must expose useful result counts so users can predict the effect of a filter before committing to it.

**Implementation status:** completed in Phase 3.

## AM-UX-005 — Keyboard accessibility

Primary navigation, menus, dialogs, forms, catalog controls, and commerce flows must be operable without a pointing device. Focus state and focus order must remain visible and predictable.

**Implementation status:** completed for the current application surface in Phase 7. The initial document preserves native tab order and skip-link access; subsequent client-side route changes move focus to the main region. Playwright regression coverage verifies keyboard entry, skip-link behavior, route focus, and programmatic current-page navigation state.

## AM-UX-006 — Checkout visibility and error prevention

Checkout must clearly expose address, payment, items, totals, and confirmation state before the final purchase action. Changes to critical information must be reviewable before submission.

**Implementation status:** completed in Phase 5.

## Evidence policy

UX metrics must not be fabricated. Automated accessibility results, task completion data, SUS scores, and related measurements must be collected from actual test executions or documented user studies before being presented as project results.
