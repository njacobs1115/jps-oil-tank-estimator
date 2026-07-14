# Project Decisions

This file records durable decisions for the JPS oil tank estimator and booking funnel.
Use it for context that future agents need in order to understand why the live system works the way it does.

Do not use this file for in-progress debugging notes, private agent scratch, or temporary task lists.
When adding an entry, include:
- the date
- the decision
- why it was made
- what future agents must preserve

---

## 2026-05-30 - Assisted conversion telemetry should stay invisible and non-PII

### Decision
Future tracking for price-aware users who click text/call should extend the existing non-PII funnel-event telemetry lane, not add visible reference codes to SMS prefill and not create GHL contacts before the visitor submits contact info or actually contacts JPS.

### Why
The goal is actionable assisted-conversion evidence without degrading the customer experience or polluting CRM. A visible reference code in an SMS body feels clunky, and creating contacts at price reveal would create anonymous CRM noise. The better path is to log rich anonymous funnel context, then infer downstream outcomes by matching event time/details against GHL inbound SMS/calls, contacts, opportunities, and appointments.

### Preserve
Keep anonymous funnel telemetry free of PII. Track assisted CTA events with enough context to support later matching: event time, `funnel_request_id`, CTA location, screen, city/state, price, quote state, tank/access/oil answers, and attribution. Treat matches to GHL as confidence-scored unless a later contact path creates a deterministic link. Preserve existing booking safety, rescue behavior, Step 5 intent persistence, GTM/GA4 tracking, Telegram alerts, timeout handling, and secret boundaries.

---

## 2026-05-21 - GHL field values must match live CRM options

### Decision
Funnel payload values sent to GHL must be normalized to the exact live custom-field option labels before they leave the funnel or public API.

### Why
GHL single-select fields may show a text value but fail to select the configured option when casing or labels do not match exactly. Downstream webhooks can then receive an empty selected value even though the CRM record appears to contain text.

### Current labels to preserve
- Tank Location: `Basement`, `Garage`, `Outside`
- Exit Type: `Bulkhead`, `Walkout`, `Stairs`
- Remaining Oil: `Empty`, `1/8`, `1/4`, `1/2`, `3/4`, `Full`, `I dont know`
- Accessibility: write `Tight Access` only when the customer says access is not accessible
- Accessible tanks are standard and should write no accessibility value
- Unsure access writes `POTENTIAL ACCESS ISSUES` as job details

### Preserve
Keep this as a narrow payload/value mapping concern. Do not change pricing, slot lookup, booking success/failure behavior, rescue behavior, Telegram alerts, customer-facing copy, or workflow tags when fixing CRM value labels.

---

## 2026-05-21 - Unknown MA/CT cities require confirmed pricing

### Decision
Unknown MA/CT cities do not receive a fallback instant price. They go through the confirmed-price request path and do not proceed to date lookup or online booking.

### Why
Guessing a fallback city price could create a false price expectation and lead to a booked job with bad pricing assumptions.

### Preserve
Do not reintroduce state-level fallback pricing for unknown MA/CT cities. Keep the manual quote path separate from slot lookup and booking.

---

## 2026-05-21 - Checkout state must match quoted state

### Decision
The quote state selected in the quiz remains the source of truth. Checkout should warn when city/ZIP appears to belong to a different state instead of silently changing the quote state.

### Why
Changing state at checkout can alter price and permit assumptions after the customer has already seen a quote.

### Preserve
Keep the warning plain and customer-safe. Do not alter routing, Maps/API behavior, slot ranking, booking confirmation, webhook URLs, GHL payload fields, Telegram/rescue behavior, pricing formula, or tracking events as part of this guardrail.

---

## 2026-05-21 - Lead capture is bounded before slot lookup

### Decision
Lead capture before slot lookup must stay bounded by timeout behavior so a slow CRM/contact-preservation path cannot hang the customer-facing date lookup flow.

### Why
The funnel needs enough time to capture intent, but the booking experience cannot stall indefinitely while a CRM/webhook dependency is slow.

### Preserve
Do not remove the lead-capture timeout without explicit approval and a replacement safety mechanism.

---

## 2026-06-12 - Make is retired and must not be treated as a live dependency

### Decision
Make is no longer used for the booking funnel. Future docs, tests, and implementation plans must not describe Make as live, use Make as a rescue-test target, or add new Make-based workflow paths.

### Why
Stale Make language creates operational risk: a future agent could test or design against a retired dependency, miss the real Route Optimizer/GHL path, or preserve legacy webhook surfaces longer than needed.

### Preserve
Treat remaining Make references as legacy cleanup surfaces only. Verify live Route Optimizer environment state before deleting backend proxy code, but do not build new work around Make. Do not POST to old hooks. Keep active customer flow documentation centered on GitHub Pages `booking-funnel.html`, Route Optimizer public APIs, GHL contact/appointment writes, Telegram alerts, GTM/GA4/Ads events, and the protected funnel-event export.

---

## 2026-05-21 - Booking intent must be preserved before final booking

### Decision
Before any final booking webhook/appointment attempt, persist the intended booking payload to the existing GHL contact. If intent preservation fails, do not create the appointment.

### Why
If the appointment-created automation fires without the full job context, the customer can appear booked while the CRM/downstream systems lack the information needed to service or rescue the job.

### Preserve
Required persisted context includes requested date, requested time, service, address, name, phone, email, and `funnel_request_id`.

---

## 2026-06-21 - Checkout oil level must not preserve an underpriced quote

### Decision
If the customer was priced from Step 3 as `Less than 1/4` or `I don't know`, but chooses checkout exact oil level `1/2`, `3/4`, or `Full`, checkout must stop before date lookup and require acknowledgement that tanks containing more than 1/4 carry the $150 oil disposal fee.

### Why
The booking flow collects a rough oil answer for pricing and a more exact oil level at checkout. Allowing a higher checkout oil level to proceed under the earlier lower quote creates a false price expectation and makes the $150 fee harder to defend later.

### Preserve
Keep this guard before booking state save, tracking submit events, lead capture, date lookup, manual quote, and final booking calls. Confirming the warning must update the pricing answer to `More than 1/4` and recompute the quote before proceeding. Do not turn this into a dismiss-only acknowledgement, and do not weaken the existing city/state mismatch guard.
