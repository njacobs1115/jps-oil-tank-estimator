# Last Session - 2026-05-20 Early AM

## What Changed
- Shipped the approved quote-guardrail implementation.
- Estimator PR `#32` merged/deployed.
- Matching Route Optimizer PR `#34` merged/deployed.
- Estimator merge commit: `8d188c030663da0013f455952f13dd72003eb130`.
- Route Optimizer merge commit: `813b9dd87ce11691c421502552f128fc87bb5be1`.

## Estimator Changes
- Added canonical quote states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Removed unknown MA/CT fallback pricing from the customer path.
- Unknown city shows confirmed-price request copy, not a price.
- Unknown city submit uses the booking contact fields but calls `/api/public/manual-quote`.
- Unknown city path does not call date lookup or booking.
- MA permit-TBD remains bookable and says permit is required, usually `$50-$110`, exact fee confirmed shortly after booking.
- Normal verified-city booking path remains intact.
- Lead/contact capture now has an 8-second timeout before slot lookup.
- Added focused test: `test-quote-guardrails.js`.
- Codex review found a P1 lead-capture hang risk; fixed before merge.

## City Data
- Added `Malden, MA` at removal fee `$800`, permit TBD.
- Fixed `Dracut, MA` permit from `NaN` to `null`.
- Removed duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT`.
- Added validation to `sync-airtable.js` so future syncs fail on NaN fees, duplicate/conflicting city rows, missing removal fees, or unsupported states.
- `AIRTABLE_API_TOKEN` was not present locally, so live Airtable sync was not run.

## Backend Changes In Route Optimizer
- `server/public-api.ts`: quote-state schema, manual quote rejection on `/find-slots` and `/book`, `/api/public/manual-quote`, manual quote tag/alert/note, kill switch, and fail-closed booking intent persistence.
- `server/ghl.ts`: added `addContactNote`.
- `server/funnel-events.ts`: added quote-state telemetry fields and manual quote events.
- Added `server/public-api-quote-state.test.ts`.

## Verification
- `node test-quote-guardrails.js` passed.
- `node node_modules\typescript\bin\tsc` passed in Route Optimizer.
- `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts` passed.
- `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts` passed.
- `git diff --check` passed in both repos.
- Route Optimizer `/health/funnel` returned `FUNNEL_OK calendar=25 timed=25`.
- Backend live tests confirmed unknown manual-quote state returns `409 manual_quote_required` on `/find-slots` and `/book`.
- Browser smoke passed using the live GitHub Pages funnel: unknown `Faketown, MA` called `/manual-quote`, did not call `/find-slots`, and did not call `/book`.
- Browser smoke confirmed `Malden, MA` shows `$800` and `$50-$110` permit caveat and remains bookable.
- Live custom page loaded the funnel frame.
- Direct live date fetch for known-bookable `Malden, MA` returned slots.
- No real contact or appointment was created during browser smoke; write endpoints were intercepted.

## Still Required
- Watch the first few live manual-quote and MA permit-TBD leads.
- Verify Airtable sync/live truth for Malden and cleaned city data when Airtable credentials are available.
- Address GitHub Actions Node 20 deprecation warning in a maintenance PR.
- Keep Route Optimizer dependency audit/cleanup separate from this shipped guardrail phase.
