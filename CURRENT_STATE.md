# Booking Funnel — Current State
> Source of truth for all funnel IDs, tracking, and live status.
> Last updated: 2026-05-19 late PM (quote guardrail build implemented locally; not merged/deployed)
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

**LIVE ✅ TRACKING VERIFIED ✅ PR #31 DEPLOYED ✅ QUOTE GUARDRAIL BUILD IMPLEMENTED LOCALLY / NOT DEPLOYED ✅**

### Latest Runtime State - 2026-05-19

Current deployed `master` includes PR `#31` funnel-event telemetry:
- Merge commit: `e349d1e4b84987065cf6154a0af13db095920a99`
- Feature commits: `819d85e` and `f540a00`
- Live GitHub Pages `booking-funnel.html` was verified to match current `HEAD` after normalizing line endings.
- Route Optimizer `/health/funnel` returned `FUNNEL_OK calendar=25 timed=25` during review.

Local runtime code has now been changed after the planning/review pass. These changes are not merged or deployed yet.

### Quote Guardrail Build - 2026-05-19 Late PM

Implemented locally in estimator + Route Optimizer:
- Added quote states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Unknown MA/CT cities no longer receive `$600/$700` fallback pricing in the frontend.
- Unknown city path shows confirmed-price request copy, reuses the booking contact fields, posts to Route Optimizer `/api/public/manual-quote`, and does not call `/find-slots` or `/book`.
- MA permit-TBD cities remain bookable but show `$50-$110` permit caveat through results, checkout, review, success, estimate, and CRM payload metadata.
- Frontend now waits for lead/contact capture before slot lookup, removing the known contact/slot race from the normal path.
- Route Optimizer rejects `unknown_city_manual_quote` requests on `/api/public/find-slots` and `/api/public/book`.
- Route Optimizer adds server-owned `/api/public/manual-quote`, allowlisted `funnel-manual-quote-needed`, Telegram alert, contact note, and kill switch `DISABLE_MANUAL_QUOTE_CAPTURE`.
- Route Optimizer booking intent now writes contact fields + a contact note before appointment creation; failure blocks booking instead of continuing.
- Funnel telemetry accepts quote-state metadata while remaining PII-free.
- `sync-airtable.js` now fails validation on NaN fees, duplicates, conflicting city/state rows, missing removal fees, or unsupported states.

City data fixed locally:
- Added `Malden, MA` at removal fee `$800`, permit TBD.
- Changed `Dracut, MA` permit from `NaN` to `null`.
- Removed duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT` rows.

Local checks passed:
- `node test-quote-guardrails.js`
- Route Optimizer TypeScript: `node node_modules\typescript\bin\tsc`
- `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts`
- `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts`
- Playwright local browser smoke via bundled runtime:
  - unknown `Faketown, MA` called `/manual-quote`
  - unknown city did not call `/find-slots`
  - unknown city did not call `/book`
  - `Malden, MA` showed `$800` plus `$50-$110` permit caveat and stayed bookable

### Quote Guardrail Planning - 2026-05-19

Norman approved the guardrail direction after System/Cost/Security/Adversarial/Final Decision review, with conditions.

Problem to fix:
- Unknown MA/CT cities currently get fallback pricing and can continue toward booking.
- MA permit-TBD jobs can book with unclear permit handling.
- Booking/contact sequencing and Step 5 intent persistence need hardening.

Approved direction:
- Keep the producing funnel intact.
- Add quote-confidence states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Unknown MA/CT city must not default to a price, call date lookup, or book.
- Unknown MA/CT city should use confirmed-price request capture with the same fields as booking.
- MA permit TBD can still book, but every customer/CRM touchpoint must clearly state permit is required and usually `$50-$110`, with the exact fee confirmed after booking.
- Backend must recompute/enforce quote state; frontend metadata is advisory only.
- Step 5 intent persistence must be fail-closed before appointment creation.

Primary build handoff:
- `QUOTE_GUARDRAIL_BUILD_HANDOFF.md`

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

### Repo Cleanup - 2026-05-10

PR `#30` cleaned the project state without changing live funnel runtime behavior.

What changed:
- fixed `.gitignore`
- removed old local generated folders and one-off patch/export artifacts from the working folder
- tracked durable `BRAND.md` and `CURRENT_STATE.md`
- refreshed README/session handoff files

Deployment proof:
- PR: `#30`
- Merge commit: `5ebfe9819d33bcbaa17212491c70b9be7f1e2201`
- GitHub Pages run: `25647858704`, completed successfully
- Live `booking-funnel.html` still served `200` and retained the PR `#29` warning code

Known maintenance note:
- GitHub Pages warned that some Actions still run on Node 20. This did not affect the live deploy. Next maintenance PR should verify/update GitHub Actions for Node 24 compatibility before GitHub forces the default later in 2026.

---

## Pending Work

- [ ] **Priority: Quote guardrail PR/deploy** — review the local quote-guardrail changes across estimator + Route Optimizer, then run required review gates before merge/deploy.
- [ ] **Live Airtable sync** — `AIRTABLE_API_TOKEN` was not present locally, so Malden/Airtable sync still needs verified before deploy.
- [ ] Workflow maintenance — address GitHub Pages Node 20 deprecation warning / Node 24 compatibility
- [ ] GHL workflow — trigger on `funnel-error` tag (Norman to build)
- [ ] End-to-end test — break Make, confirm funnel-error contact lands in GHL
- [ ] Internal links — add links from relevant pages to /oil-tank-removal-cost
- [ ] Point ads to new URL (currently pointing to /oil-tank-removal-ri-promotion/)
- [ ] Funnel cutover — flip 2 env vars, kill Make 4603576 + 4629605
