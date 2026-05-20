# Next Session - jps-oil-tank-estimator

## Start Here
1. Treat the quote guardrails as live. Do not rebuild them unless live evidence says they are broken.
2. Start with post-deploy observation: recent leads, manual quote captures, MA permit-TBD jobs, and funnel errors.
3. Keep cleanup work separate from the shipped guardrail phase.
4. Preserve the producing funnel and do not weaken tracking, rescue behavior, or backend enforcement.

## Current State
- Estimator PR `#32` is merged/deployed.
- Matching Route Optimizer PR `#34` is merged/deployed.
- Estimator merge commit: `8d188c030663da0013f455952f13dd72003eb130`.
- Route Optimizer merge commit: `813b9dd87ce11691c421502552f128fc87bb5be1`.
- `AIRTABLE_API_TOKEN` was not available locally, so live Airtable sync/alignment still needs verification.

## What Is Live Now
- Quote states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Unknown MA/CT city shows confirmed-price request copy instead of `$600/$700` fallback.
- Unknown city path uses booking contact fields, posts to `/api/public/manual-quote`, and never calls `/find-slots` or `/book`.
- MA permit-TBD stays bookable with `$50-$110` permit caveat through visible funnel copy and payload metadata.
- Frontend waits for lead/contact capture before fetching slots.
- Route Optimizer rejects manual-quote state on `/find-slots` and `/book`.
- Route Optimizer manual quote capture applies `funnel-manual-quote-needed`, sends Telegram alert, writes a contact note, and has `DISABLE_MANUAL_QUOTE_CAPTURE`.
- Booking intent persistence is fail-closed before appointment creation via contact fields and contact note.
- Funnel telemetry accepts quote-state metadata and remains PII-free.
- `sync-airtable.js` validates NaN/duplicate/conflicting city data.

## City Data Shipped
- `Malden, MA` added at `$800`, permit TBD.
- `Dracut, MA` permit changed from `NaN` to `null`.
- Duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT` rows removed.

## Checks Passed
- Estimator: `node test-quote-guardrails.js`
- Route Optimizer: `node node_modules\typescript\bin\tsc`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts`
- Live backend smoke: unknown manual-quote state returned `409 manual_quote_required` on `/find-slots` and `/book`.
- Live browser smoke: unknown `Faketown, MA` called `/manual-quote`, did not call `/find-slots` or `/book`; `Malden, MA` showed `$800 + permit` and stayed bookable.
- Live date-fetch smoke: known-bookable `Malden, MA` returned slots from `/api/public/find-slots`.

## Next Action
Check real post-deploy leads/errors first. Then handle follow-ups in separate scoped phases: Airtable sync verification, GHL rescue workflows, GitHub Actions Node 20 maintenance, and Route Optimizer cleanup/dependency audit.
