# Phase 8 — UX Lab protocol

Phase 8 closes the academic UX roadmap without inventing user-research results. This document defines the reproducible protocol to use when moderated or unmoderated sessions are actually performed.

## Goals

- Validate whether the complete commerce flow can be completed without assistance.
- Observe discoverability of search, filters, seller policies, checkout review, order cancellation, and accessibility preferences.
- Record accessibility blockers separately from general usability friction.
- Produce evidence that can be traced back to participants and test sessions without storing unnecessary personal data.

## Recommended participant sample

A first formative round can use 5–8 adult participants with mixed technical experience. When feasible, include keyboard-only users and people who use magnification, high contrast, or screen readers. This is a recruitment target, not a claim that participants have already been tested.

## Core tasks

| ID | Task | Success condition |
|---|---|---|
| UX-01 | Create an account and reach the authenticated experience | Account created and authenticated state visible |
| UX-02 | Find a product using search and at least one filter | Requested product/result set located |
| UX-03 | Identify warranty, shipping, and return terms | Participant correctly locates all three seller-policy sections |
| UX-04 | Add a product to cart and review checkout | Cart updated and checkout review reached without purchase ambiguity |
| UX-05 | Confirm an order and locate its detail | Order number/detail visible |
| UX-06 | Determine whether the order can be cancelled and cancel when eligible | Eligibility understood and cancellation completed when allowed |
| UX-07 | Enable an accessibility preference and navigate to another route | Preference remains active after navigation |
| UX-08 | Complete a primary navigation task using keyboard only | Task completed without a pointing device |

## Measurements to collect

For every session record only observed values:

- task completion: success / partial / failure;
- completion time per task;
- number and type of observable errors;
- requests for moderator assistance;
- Single Ease Question (SEQ) after selected tasks;
- qualitative notes and accessibility barriers;
- System Usability Scale (SUS) only after the participant completes the full session.

Do not convert automated axe results into SUS, task success, or human accessibility scores.

## Session record template

| Field | Value |
|---|---|
| Session ID | Not collected |
| Date | Not collected |
| Test build / commit | Not collected |
| Assistive technology / input method | Not collected |
| Tasks completed | Not collected |
| Task times | Not collected |
| Errors | Not collected |
| SEQ | Not collected |
| SUS | Not collected |
| Key observations | Not collected |

`Not collected` is intentional until a real session supplies evidence.

## Accessibility test matrix

When devices are available, manually sample these combinations in addition to automated Playwright/axe coverage:

1. Chromium + keyboard only.
2. Chromium/Edge + Windows High Contrast / forced colors.
3. Browser zoom at 200% and 400% where practical.
4. Reduced-motion operating-system preference.
5. NVDA + Firefox or NVDA + Chromium on Windows.
6. VoiceOver + Safari on macOS/iOS when available.

Record browser, OS, assistive-technology version, failing route, expected behavior, actual behavior, and reproduction steps for every defect.

## Exit criteria for a user-study round

A UX Lab round can be called complete only when its participant/session records exist. Phase 8 of the software roadmap can close without fabricated human metrics because automated regression and production-readiness work are independently verifiable; human-study metrics remain explicitly pending until sessions are conducted.
