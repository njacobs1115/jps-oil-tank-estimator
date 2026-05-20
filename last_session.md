# Last Session - 2026-05-19

## What Changed
- Built the approved quote-guardrail implementation locally.
- No code was staged, committed, merged, or deployed.
- Estimator frontend and Route Optimizer backend were both changed.

## Estimator Changes
- Added canonical quote states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Removed unknown MA/CT fallback pricing from the customer path.
- Unknown city now shows confirmed-price request copy, not a price.
- Unknown city submit uses the booking contact fields but calls `/api/public/manual-quote`.
- Unknown city path does not call date lookup or booking.
- MA permit-TBD remains bookable and says permit is required, usually `$50-$110`, exact fee confirmed shortly after booking.
- Normal verified-city booking path remains intact.
- Lead/contact capture now completes before slot lookup starts.
- Added focused local test: `test-quote-guardrails.js`.

## City Data
- Added `Malden, MA` at removal fee `$800`, permit TBD.
- Fixed `Dracut, MA` permit from `NaN` to `null`.
- Removed duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT`.
- Added validation to `sync-airtable.js` so future syncs fail on NaN fees, duplicate/conflicting city rows, missing removal fees, or unsupported states.
- `AIRTABLE_API_TOKEN` was not present locally, so live Airtable sync was not run.

## Backend Changes In Route Optimizer
- `server/public-api.ts`
  - added quote-state schema fields
  - rejects `unknown_city_manual_quote` on `/find-slots` and `/book`
  - added `/api/public/manual-quote`
  - applies allowlisted `funnel-manual-quote-needed`
  - sends Telegram alert with dedupe
  - adds kill switch `DISABLE_MANUAL_QUOTE_CAPTURE`
  - writes booking intent contact fields + contact note before appointment creation
  - blocks booking if intent persistence fails
- `server/ghl.ts`
  - added `addContactNote`
- `server/funnel-events.ts`
  - added quote-state telemetry fields and manual quote events
- Added `server/public-api-quote-state.test.ts`.

## Verification
- `node test-quote-guardrails.js` passed.
- `node node_modules\typescript\bin\tsc` passed in Route Optimizer.
- `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts` passed.
- `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts` passed.
- Browser smoke passed using local `booking-funnel.html`:
  - unknown `Faketown, MA` showed manual quote copy
  - submitted to `/manual-quote`
  - did not call `/find-slots`
  - did not call `/book`
  - `Malden, MA` showed `$800` and `$50-$110` permit caveat
  - `Malden, MA` remained bookable

## Still Required
- Review diffs carefully.
- Run required review/gate process before merge/deploy.
- Verify Airtable sync/live truth for Malden and cleaned city data.
- Coordinate estimator + Route Optimizer deploy order.
