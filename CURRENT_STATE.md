# Booking Funnel - Current State
> Source of truth for funnel IDs, tracking, and live status.
> Last updated: 2026-05-20 early AM ET (quote guardrails live after estimator PR #32 and Route Optimizer PR #34)
> Repo: github.com/njacobs1115/jps-oil-tank-estimator

---

## Live URLs

| Page | URL |
|---|---|
| Funnel | https://removemyoiltank.com/oil-tank-removal-cost |
| Backup estimator | https://removemyoiltank.com/oil-tank-removal-cost |

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

## Make Webhooks

Make is still live for the original funnel proxy paths. Do not expose webhook URLs in frontend or docs.

| Webhook | Make Scenario | Status |
|---|---|---|
| Booking confirmed | 4603576 | LIVE - awaiting approved Command Center cutover |
| Estimate email | 4629605 | LIVE - awaiting approved Command Center cutover |

Cutover plan, when Norman approves: flip `MAKE_LEAD_WEBHOOK_URL` and `MAKE_ESTIMATE_WEBHOOK_URL` on Route Optimizer Render, then kill Make scenarios after 48 hours clean.

---

## Ads Conversion Tracking

| Field | Value |
|---|---|
| Conversion name | "Funnel - Booking Confirmed" |
| Conversion ID | 852463092 |
| Conversion Label | RHHyCJ6tj40cEPrpYD |

---

## UptimeRobot Monitoring

- `/health` - Route Optimizer basic health, 5-minute check.
- `/health/funnel` - deep check with keyword `FUNNEL_OK`; catches broken date picker cases that `/health` can miss.
- Monitor ID: 802784998

---

## Status

**LIVE - TRACKING VERIFIED - QUOTE GUARDRAILS DEPLOYED**

### Latest Runtime State - 2026-05-20 Early AM

Estimator PR `#32` is merged and deployed.
- Merge commit: `8d188c030663da0013f455952f13dd72003eb130`
- GitHub Pages deployment run: `26138838475`
- Codex review initially found a P1 lead-webhook hang risk; fixed before merge with `LEAD_CAPTURE_TIMEOUT_MS = 8000`.

Matching Route Optimizer PR `#34` is merged and deployed.
- Merge commit: `813b9dd87ce11691c421502552f128fc87bb5be1`
- `/health/funnel` returned `FUNNEL_OK calendar=25 timed=25` after merge.

Live behavior now:
- Quote states are `verified`, `ma_permit_tbd`, and `unknown_city_manual_quote`.
- Unknown MA/CT cities no longer receive `$600/$700` fallback pricing.
- Unknown city path shows confirmed-price request copy, uses the booking contact fields, posts to `/api/public/manual-quote`, and does not call `/find-slots` or `/book`.
- MA permit-TBD cities remain bookable but show the `$50-$110` permit caveat in the visible funnel and payload metadata.
- Route Optimizer rejects `unknown_city_manual_quote` on `/api/public/find-slots` and `/api/public/book`.
- Route Optimizer manual quote capture applies `funnel-manual-quote-needed`, writes a contact note, sends Telegram alert, and has kill switch `DISABLE_MANUAL_QUOTE_CAPTURE`.
- Booking intent writes contact fields and a contact note before appointment creation; failure blocks booking.
- Funnel telemetry accepts quote-state metadata and remains PII-free.
- `sync-airtable.js` validation fails on NaN fees, duplicate/conflicting city rows, missing removal fees, or unsupported states.

City data shipped:
- `Malden, MA` added at `$800`, permit TBD.
- `Dracut, MA` permit changed from `NaN` to `null`.
- Duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT` rows removed.

Checks passed:
- Estimator: `node test-quote-guardrails.js`
- Route Optimizer: `node node_modules\typescript\bin\tsc`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts`
- `git diff --check` in both repos

Live proof:
- GitHub Pages `booking-funnel.html` contains `unknown_city_manual_quote`, `LEAD_CAPTURE_TIMEOUT_MS`, and `Malden`.
- Backend `/api/public/find-slots` with `unknown_city_manual_quote` returned `409 manual_quote_required`.
- Backend `/api/public/book` with `unknown_city_manual_quote` returned `409 manual_quote_required`.
- Browser smoke on the live GitHub Pages funnel: unknown `Faketown, MA` called only `/manual-quote`; no `/find-slots`; no `/book`.
- Browser smoke confirmed `Malden, MA` shows `$800` plus `$50-$110` permit caveat and remains bookable.
- Live custom page `https://removemyoiltank.com/oil-tank-removal-cost/` loaded the funnel frame.
- Direct live date fetch for known-bookable `Malden, MA` returned `200 OK` with available slots.
- No real contact or appointment was created during browser smoke; write endpoints were intercepted.

---

## Prior Deployed Context

PR `#31` shipped funnel-event telemetry before the guardrail work.
- Merge commit: `e349d1e4b84987065cf6154a0af13db095920a99`
- Feature commits: `819d85e`, `f540a00`

PR `#29` added checkout quote-state mismatch protection.
- Merge commit: `7a7ce96650cb78f30386fab7f3a32bc2548cdd5c`
- Live smoke: RI quote + MA ZIP showed warning and made zero fetch/webhook/date calls.

PR `#30` cleaned repo state without changing live funnel runtime behavior.
- Merge commit: `5ebfe9819d33bcbaa17212491c70b9be7f1e2201`

---

## Pending Work

- [ ] Post-deploy observation - watch the first few `ma_permit_tbd` and `unknown_city_manual_quote` leads for copy/CRM accuracy.
- [ ] Live Airtable sync verification - `AIRTABLE_API_TOKEN` was not present locally, so confirm Airtable remains aligned with shipped city data when credentials are available.
- [ ] Workflow maintenance - address GitHub Pages Node 20 deprecation warning / Node 24 compatibility.
- [ ] GHL workflow - trigger on `funnel-error` tag (Norman to build).
- [ ] End-to-end test - break Make, confirm funnel-error contact lands in GHL.
- [ ] Internal links - add links from relevant pages to `/oil-tank-removal-cost`.
- [ ] Point ads to new URL if still pointing to `/oil-tank-removal-ri-promotion/`.
- [ ] Funnel cutover - flip 2 env vars, kill Make 4603576 and 4629605 after approved clean window.
