# Booking Funnel — Agent Guide

## What This Repo Is
Public-facing JPS oil tank estimator and booking funnel. This is live customer-facing infrastructure and must be treated as such.

## Read First
1. `next_session.md`
2. `last_session.md`
3. `README.md`
4. `CLAUDE.md`

## Agent Lanes
- Shared repo truth lives in `README.md`, `AGENTS.md`, and approved funnel/runbook docs.
- Codex private scratch lives under `.codex/`.
- Claude private scratch lives under `.claude/`.
- Do not edit the other agent's private lane.
- Shared files should hold durable funnel state and decisions only.
- Keep in-progress debugging notes out of shared session files.

## Merge Lane
- Critical approval repo.
- Branch -> PR -> `codex-review` + `adversarial-review`.
- Green PRs still wait for approval before merge.

## Hard Rules
- Never allow a customer-facing false confirmation.
- `submitEstimate()` and `submitCheckout()` are separate paths. Do not assume shared state.
- Preserve the rescue path for date-fetch or booking failures.
- Before any final booking webhook attempt, persist the intended booking payload to the existing GHL contact.
- Never expose secrets, webhook URLs, or internal system details to the frontend.
- Do not weaken GTM/GA4/Ads tracking, Telegram alerts, or failure logging without explicit approval.

## Step 5 Requirement
Required persisted fields before booking: requested date, requested time, service, address, name, phone, email, and `funnel_request_id`. If intent preservation fails, do not proceed to booking.

## Sensitive Areas
- `booking-funnel.html`, webhook payloads, pricing logic, tracking events, rescue behavior, and any customer-facing copy around failure states.

---

### Failure handling
- If booking succeeds: return the normal success path.
- If booking fails, timeout occurs, or verification fails: trigger the silent rescue path.
- Telegram is the independent alert path and must remain functional even when GHL-related flows fail.
- Render primary Telegram alert fires on every Step 5 failure.
- GHL backup Telegram alert fires only if contact was tagged AND no ACK received within 5 minutes.

---

### Acknowledgment definition
- An alert is acknowledged ONLY by an in-thread reply of exactly ACK (case-insensitive) or click of a dedicated acknowledgment link/button.
- No other reply, reaction, emoji, or message counts as acknowledgment.
- Escalation timers must check explicit ACK state, not message activity.

---

### Orphan sweeper scope
- Only act on contacts with source = funnel OR a funnel_request_id value.
- Do not sweep contacts from other sources under any circumstances.

---

### Block approval if any PR change:
- Can create a false booked state for the customer
- Skips preservation of booking intent before the final webhook
- Makes rescue depend only on GHL (Telegram must remain independent)
- Weakens timeout handling, verification, or alerting
- Introduces customer-visible technical or error language
- Risks exposing secrets, tokens, or internal endpoint URLs
- Weakens or redefines the ACK acknowledgment protocol
- Broadens the orphan sweeper beyond funnel-sourced contacts

---

### Testing expectations
Require tests or validation for:
- Step 3 failure rescue behavior
- Step 5 intent preservation before booking attempt
- Step 5 failure silent rescue behavior
- Synthetic test path (testMode + HMAC verification)
- No customer-facing false confirmation in any failure scenario
- ACK acknowledgment correctly stops escalation
- Orphan sweeper correctly scoped to funnel-sourced contacts only

---

### GHL tag conventions
All funnel-related tags use funnel- prefix:
- funnel-date-failure
- funnel-booking-failure
- funnel-booking-success
- funnel-test


---

## PR Review Brief Requirement

For any PR touching booking logic, rescue logic, alerts, synthetic tests, GHL integration, Telegram integration, or customer-facing funnel behavior:

The PR description must include:
- what changed
- why it changed
- risk area
- checks run
- check results
- known risks or follow-up items

The PR must explicitly ask Codex to review for:
- customer-facing false confirmations
- Step 3 rescue behavior
- Step 5 intent preservation before booking webhook
- rescue path independence from GHL alone
- secret, token, webhook, or internal endpoint exposure
- regressions in ACK handling
- regressions in orphan sweeper scoping
