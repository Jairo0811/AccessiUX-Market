# Phase 7 — Advanced Accessibility

Phase 7 closes the accessibility requirements that still depended on explicit user control and predictable keyboard focus.

## Scope

This phase implements:

- `AM-UX-003 — Simple Reading Mode`;
- `AM-UX-005 — Keyboard accessibility` for the current application surface;
- persistent user accessibility preferences;
- regression coverage for skip links, keyboard entry, route focus, current-page semantics, and preference persistence;
- continued automated accessibility checks with Playwright and axe-core.

## Accessibility preferences

The public `/accessibility` route now exposes four user-controlled preferences:

1. **Simple Reading Mode** — reduces decorative and promotional density while preserving essential commerce actions.
2. **Reduced motion** — disables transitions and smooth scrolling even when the operating system has not requested reduced motion.
3. **Increased contrast** — strengthens text, borders, surfaces, and link identification.
4. **Larger text** — increases the application typographic scale without disabling browser zoom.

Preferences are persisted in browser `localStorage` under a versioned key and are applied from application startup through `AccessibilityPreferencesService`.

If browser storage is unavailable, preferences still apply during the current page lifetime; storage failures do not block the interface.

## Document-level state

Preferences are represented as attributes on the root `<html>` element:

- `data-simple-reading`;
- `data-reduce-motion`;
- `data-high-contrast`;
- `data-large-text`.

The dedicated `src/accessibility.scss` stylesheet maps those attributes to presentation changes. This keeps the preference model independent from individual feature components and avoids duplicating accessibility state across pages.

## Keyboard and focus strategy

### Initial navigation

The application does **not** programmatically move focus on the initial page load. This preserves the browser's native tab order and keeps the skip link as the first keyboard-accessible control.

### Skip link

`Saltar al contenido principal` targets the focusable `<main id="main-content" tabindex="-1">` region, allowing keyboard users to bypass repeated navigation.

### Client-side route changes

After the initial navigation, Angular `NavigationEnd` events schedule focus on the main content region. This prevents focus from remaining on a navigation control that belongs to the previous view and gives keyboard and assistive-technology users a predictable starting point after SPA navigation.

### Current-page semantics

Primary navigation links expose `aria-current="page"` through Angular `RouterLinkActive`, providing a programmatic indication of the current destination in addition to visible styling.

## Existing platform protections retained

Phase 7 builds on accessibility behavior that already existed before this phase:

- semantic landmarks and headings;
- visible `:focus-visible` outlines;
- `aria-live` and `role="alert"` feedback where appropriate;
- `forced-colors` support;
- `prefers-reduced-motion` support;
- accessible form names and error messaging;
- checkout review and order-cancellation feedback;
- Playwright + axe-core CI regression checks.

## Automated evidence

The Phase 7 Playwright suite adds checks for:

- `/accessibility` with axe-core;
- skip link as the first natural keyboard target;
- focus movement from skip link to main content;
- focus movement to main content after client-side navigation;
- persistence of all four user preferences across reload;
- reset behavior;
- root document attributes used by accessibility modes;
- axe-core while the preference modes are enabled;
- `aria-current="page"` on the active navigation destination.

Automated results must only be reported as passing after the corresponding GitHub Actions run completes successfully.

## Standards posture

AccessiUX Market targets WCAG Level AA principles as a technical accessibility objective and voluntarily references NORTIC B2:2017 for Dominican accessibility practices.

This documentation does not claim formal WCAG conformance certification or official NORTIC certification.
