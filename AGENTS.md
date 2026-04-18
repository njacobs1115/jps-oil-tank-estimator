# AGENTS.md

## Booking Funnel Critical Review Rules

These rules govern all PRs touching the booking funnel (Route-Optimizer-JPS, jps-oil-tank-estimator, jps-command-center). Codex enforces these during review.

---

### Non-negotiable rules
- Never allow a customer-facing false confirmation.
- Step 3 date-fetch failure must preserve the lead and trigger the defined rescue path.
- Step 5 booking failure must preserve the intended booking details before attempting the final booking webhook.
- Never expose secrets, webhook URLs, tokens, or internal system details to the frontend or customer-facing copy.
- Do not change customer-facing rescue language unless explicitly requested.
- Do not remove or weaken synthetic testing, Telegram alerts, or failure logging without explicit approval.

---

### Step 5 requirement
Before the final booking webhook is attempted, the system must persist the intended booking payload to the existing GHL contact. This is non-negotiable and must happen on every booking attempt, success or failure.

Required fields:
- requested_date
- requested_time
- service
- address
- name
- phone
- email
- funnel_request_id

Prefer structured custom fields plus a human-readable contact note containing the same data.

If intent-preservation write fails: do NOT proceed to booking webhook. Execute rescue path.

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
