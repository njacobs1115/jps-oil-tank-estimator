# Booking Funnel — Current State
> Source of truth for all funnel IDs, tracking, and live status.
> Last updated: 2026-05-10 (PR #29 quote-state mismatch fix deployed)
> Repo: github.com/njacobs1115/jps-oil-tank-estimator

---

## Live URLs

| Page | URL |
|---|---|
| Funnel | https://removemyoiltank.com/oil-tank-removal-cost |
| Backup (estimator) | https://removemyoiltank.com/oil-tank-removal-cost (same URL, new funnel replaced estimator) |

---

## Tracking IDs

| System | ID / Value |
|---|---|
| GA4 Property | G-SN22KH6SF1 |
| GTM Container | GTM-T39Z96C |
| GTM Version | v79 (live) |
| GTM Workspace | 113 |
| GA4 Property ID (numeric) | 374524599 |

---

## Make Webhooks (staging — not yet cut over to Command Center)

| Webhook | Make Scenario | Status |
|---|---|---|
| Booking confirmed | 4603576 | LIVE — awaiting cutover to Command Center `/webhook/funnel-add-contact` |
| Estimate email | 4629605 | LIVE — awaiting cutover to Command Center `/webhook/funnel-email-estimate` |

**Cutover plan:** Flip 2 env vars on Route Optimizer Render:
- `MAKE_LEAD_WEBHOOK_URL` → Command Center URL
- `MAKE_ESTIMATE_WEBHOOK_URL` → Command Center URL

Kill Make 4603576 + 4629605 after 48hrs clean. Norman must approve before flip.

---

## Ads Conversion Tracking

| Field | Value |
|---|---|
| Conversion name | "Funnel - Booking Confirmed" |
| Conversion ID | 852463092 |
| Conversion Label | RHHyCJ6tj40cEPrpYD |

---

## UptimeRobot Monitoring

- `/health` — Route Optimizer health (5-min check)
- `/health/funnel` — deep check with keyword `FUNNEL_OK` (catches broken date picker without 200 OK masking it)
- Monitor ID: 802784998

---

## Status

**LIVE ✅ TRACKING VERIFIED ✅ PR #29 DEPLOYED ✅**

### Latest Deployed Funnel Change - 2026-05-10

PR `#29` added checkout quote-state mismatch protection without changing routing, Maps/API, slot ranking, booking confirmation, webhook URLs, GHL payload fields, Telegram/rescue logic, pricing formula, or tracking events.

Current behavior:
- Customer selects quote state during the quiz.
- Checkout keeps the normal address, city, and ZIP fields.
- Before date lookup, the funnel checks checkout city/ZIP against the quote state.
- If the address appears to be in another state, the funnel stays on checkout and warns: "You were quoted for [state]. This address looks like [state]. Please confirm your address. A different state may affect price."
- Customer can correct city/ZIP in place or return to the quote state step.

Deployment proof:
- PR: `#29`
- Merge commit: `7a7ce96650cb78f30386fab7f3a32bc2548cdd5c`
- Feature commit: `73e6525`
- GitHub Pages run: `25646995350`, completed successfully
- Live smoke: RI quote + MA ZIP showed warning and made zero fetch/webhook/date calls

---

## Pending Work

- [ ] GHL workflow — trigger on `funnel-error` tag (Norman to build)
- [ ] End-to-end test — break Make, confirm funnel-error contact lands in GHL
- [ ] Internal links — add links from relevant pages to /oil-tank-removal-cost
- [ ] Point ads to new URL (currently pointing to /oil-tank-removal-ri-promotion/)
- [ ] Funnel cutover — flip 2 env vars, kill Make 4603576 + 4629605
