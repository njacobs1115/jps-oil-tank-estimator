# Booking Funnel - Current State
> Source of truth for funnel IDs, tracking, and live status.
> Last updated: 2026-06-21 ET (oil-level checkout fee guard deployed)
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

## Legacy Make References - Retired

Norman confirmed on 2026-06-12 that JPS no longer uses Make. Do not design, test, or troubleshoot the booking funnel as if Make is an active dependency.

Current repo/code reality:
- The live `booking-funnel.html` sends customer traffic to Route Optimizer public endpoints.
- Route Optimizer still contains legacy proxy endpoint names for lead and estimate capture. Treat those as decommission/cleanup surfaces unless live Render env verification proves otherwise.
- Legacy `index.html` still contains retired Make-era webhook code. It is not the live funnel entrypoint and must not be used for future funnel work.
- Do not POST to old Make hooks, do not "break Make" as a test strategy, and do not add Make back into new workflow design.

Remaining cleanup:
- Verify live Render env no longer depends on legacy `MAKE_*` values before deleting Route Optimizer proxy code.
- Remove or neutralize the legacy Make-era code in `index.html` through the normal branch -> PR -> review lane.
- Update Route Optimizer docs when that repo is not under active concurrent editing.

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

**LIVE - TRACKING VERIFIED - QUOTE/OIL GUARDRAILS DEPLOYED - ROUTE OPTIMIZER EXPORT FEED DEPLOYED**

### Checkout Oil-Level Fee Guard - Live - 2026-06-21 ET

Estimator PR `#40` is merged and deployed.
- PR: https://github.com/njacobs1115/jps-oil-tank-estimator/pull/40
- Merge commit: `80574a1ab53327f48721c0cb650863851139f19a`
- GitHub Pages deploy run: `27919233143`

Live behavior:
- If the Step 3 pricing oil answer is `Less than 1/4` or `I don't know`, but checkout exact oil level is `1/2`, `3/4`, or `Full`, checkout shows an inline oil warning before date lookup.
- Warning copy:
  - `Please Confirm Oil Level.`
  - `If the tank contains more than 1/4, a $150 oil disposal fee will apply.`
- `Confirm and update price` changes the pricing answer to `More than 1/4`, recomputes the quote with the $150 fee, and then proceeds.
- The guard blocks before booking state save, `funnel_info_submitted`, lead capture, date lookup, manual quote, or booking calls.
- Existing checkout city/state mismatch guard remains first and separate.

Verification:
- `node test-quote-guardrails.js` passed.
- Local, clean-branch, and live GitHub Pages browser smokes passed with Route Optimizer calls intercepted.
- Live GitHub Pages fetch returned `200` and contained the new oil-warning copy and helper.
- WordPress wrapper direct shell fetch returned `403 Forbidden`, so deployed verification used the GitHub Pages funnel directly.

What did not change:
- No Route Optimizer code changed.
- No GHL, Telegram, ACK handling, orphan sweeper, rescue behavior, endpoint URLs, webhook URLs, or secrets changed.
- No `submitEstimate()` behavior changed.

### Funnel Behavior Tracking and Export - Live Cross-Repo State - 2026-06-12 ET

This estimator repo is the frontend event emitter. Route Optimizer is the backend collection/export layer on Render.

Estimator state:
- Estimator PR `#37` is merged and deployed.
- `booking-funnel.html` preserves existing GA4/GTM events `funnel_text_clicked` and `funnel_call_clicked`.
- It also sends anonymous backend telemetry events such as `text_clicked` and `call_clicked`.
- Anonymous telemetry must remain PII-free. Do not add names, phone numbers, email, address, tokens, webhook URLs, or internal endpoint details to frontend telemetry payloads.

Route Optimizer state:
- Route Optimizer PR `#39` added assisted CTA funnel telemetry.
- Route Optimizer PR `#44` added the protected funnel-event export feed and is merged/deployed.
- PR #44 merge commit: `140961d384a01fd8fd0b5f0c36fb1f379ccee7bf`.
- The protected export feed exports allowlisted anonymous funnel-event rows only. It is not a Render-hosted analytics/reporting layer.
- Keep exact endpoint/header/env-var details in Route Optimizer operational docs or the approved secret/runbook lane, not in public estimator docs.

Live checks on 2026-06-12:
- `https://route-optimizer-jps.onrender.com/health` returned `200 OK`.
- `https://route-optimizer-jps.onrender.com/health/funnel` returned `200 FUNNEL_OK calendar=30 timed=30`.
- The protected export feed rejected an unauthenticated request with `401 Unauthorized`.

Current concern:
- The first authenticated export pull after PR #44 returned only 4 rows over an 89-day window: 3 `funnel_started`, 1 `text_clicked`, and no booking/date/slot signals.
- That is too sparse/test-like for real production funnel activity.
- Before building the downstream dashboard/spreadsheet/reporting layer, verify the full production path: GitHub Pages event emission -> public telemetry POST -> Render JSONL persistence -> protected export.

What did not change in PR #44:
- No booking logic changed.
- No GHL write logic changed.
- No Telegram alerting changed.
- No pricing logic changed.
- No frontend/customer-facing copy changed.
- No rescue behavior changed.
- No ACK handling changed.
- No orphan sweeper behavior changed.

### Assisted Conversion Telemetry - Historical Implementation Note - 2026-05-30 ET

Local worktree:
`C:\Users\njaco\.codex\worktrees\assisted-estimator`

Branch:
`codex/assisted-conversion-telemetry`

Baseline:
`origin/master` at `c14090ccd5843239ac748af33bddff1f4b35bac1`

Modified file:
- `booking-funnel.html`
- `test-funnel.js`

What changed locally:
- Added `trackAssistedCtaClick(ctaType, ctaLocation, screen)`.
- Preserved existing GA4/GTM events `funnel_text_clicked` and `funnel_call_clicked`.
- Added backend funnel-event telemetry for assisted CTA clicks using `text_clicked` and `call_clicked`.
- Tracked visible `sms:` / `tel:` paths with explicit CTA locations.
- Updated `test-funnel.js` so Stamford, CT expects the existing manual help / confirmed-price path because Stamford is not listed in Airtable/city data and should not be direct-bookable.

What did not change:
- No booking, date lookup, manual quote, pricing, rescue, Telegram, GHL, Make, or WordPress wrapper behavior changed.
- No visible SMS reference code was added.
- No anonymous GHL contact creation was added.
- This work later shipped through estimator PR #37 and matching Route Optimizer telemetry work.

Checks passed:
- `npm ci`
- `node test-quote-guardrails.js`
- `node test-funnel.js` with `ANTHROPIC_API_KEY` available locally: 12 passed, 0 failed
- local Playwright smoke with `navigator.sendBeacon` stubbed; no live telemetry request sent; verified both `text_clicked` and `call_clicked`
- `git diff --check` passed with line-ending warnings only
- postflight code-scope scan found no booking, pricing, rescue, GHL, Telegram, Make, webhook, token, or endpoint changes

Broader funnel harness:
- `ANTHROPIC_API_KEY` was available locally; no key value was printed or written.
- `node test-funnel.js` ran against its hardcoded GitHub Pages URL, not the local branch file.
- Result after harness correction: 12 passed, 0 failed.
- Corrected path: `ct-outside-open-quarter` / Stamford, CT now expects manual help / confirmed-price behavior.
- Stamford is not listed in Airtable/city data and should not be direct-bookable.
- Report generated locally at `test-report/index.html`; the folder is gitignored.

Workspace hygiene:
- Current canonical local folder is `C:\AI Workspaces\JPS\repos\jps-oil-tank-estimator`; older notes may refer to the pre-migration path under `C:\Users\njaco\JPS\projects`.
- Stash label: `pre-existing dirty state before assisted telemetry clean worktree release pass 2026-05-30`.

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

- [ ] Verify the live funnel-event data-production path before assuming reporting is the only missing layer.
- [ ] Build the downstream pull/reporting layer that uses the Route Optimizer export token server-side to load city/drop-off patterns into dashboards, spreadsheets, or a reporting store.
- [ ] Post-deploy observation - watch the first few `ma_permit_tbd` and `unknown_city_manual_quote` leads for copy/CRM accuracy.
- [ ] Live Airtable sync verification - `AIRTABLE_API_TOKEN` was not present locally, so confirm Airtable remains aligned with shipped city data when credentials are available.
- [ ] Workflow maintenance - address GitHub Pages Node 20 deprecation warning / Node 24 compatibility.
- [ ] GHL workflow - trigger on `funnel-error` tag (Norman to build).
- [ ] End-to-end rescue test - use an approved safe test path, not Make, to confirm failure rescue and `funnel-error` handling.
- [ ] Internal links - add links from relevant pages to `/oil-tank-removal-cost`.
- [ ] Point ads to new URL if still pointing to `/oil-tank-removal-ri-promotion/`.
- [ ] Legacy Make cleanup - verify no live Render dependency remains, then remove or neutralize retired Make-era code and docs through PR/review gates.
