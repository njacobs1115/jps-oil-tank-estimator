# Next Session - jps-oil-tank-estimator

## Start Here
1. Review local diffs in this repo and `C:\Users\njaco\JPS\projects\Route-Optimizer-JPS`.
2. Treat quote guardrail implementation as built locally, not deployed.
3. Keep this surgical. Do not redesign the producing funnel.
4. Run required review/gate process before merge/deploy.

## Current State
- PR `#29`, `#30`, and `#31` are merged/deployed.
- Local quote-guardrail build is implemented after gauntlet approval.
- Runtime changes are not staged, committed, merged, or deployed.
- `AIRTABLE_API_TOKEN` was not available locally, so Airtable live sync still needs verification.

## What Was Built Locally
- Added quote states: `verified`, `ma_permit_tbd`, `unknown_city_manual_quote`.
- Unknown MA/CT city now shows confirmed-price request copy instead of `$600/$700` fallback.
- Unknown city path reuses booking contact fields, posts to `/api/public/manual-quote`, and never calls `/find-slots` or `/book`.
- MA permit-TBD stays bookable with `$50-$110` permit caveat through visible funnel copy and payload metadata.
- Frontend waits for lead/contact capture before fetching slots.
- Route Optimizer rejects manual-quote state on `/find-slots` and `/book`.
- Route Optimizer adds server-owned `/manual-quote`, `funnel-manual-quote-needed`, Telegram alert, contact note, and `DISABLE_MANUAL_QUOTE_CAPTURE`.
- Booking intent persistence is now fail-closed before appointment creation via contact fields + contact note.
- Funnel telemetry schema accepts quote-state metadata and remains PII-free.
- `sync-airtable.js` now validates NaN/duplicate/conflicting city data.

## City Data Fixed Locally
- `Malden, MA` added at `$800`, permit TBD.
- `Dracut, MA` permit changed from `NaN` to `null`.
- Duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT` rows removed.

## Checks Passed
- Estimator: `node test-quote-guardrails.js`
- Route Optimizer: `node node_modules\typescript\bin\tsc`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts`
- Route Optimizer: `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts`
- Local Playwright smoke: unknown `Faketown, MA` called `/manual-quote`, did not call `/find-slots` or `/book`; `Malden, MA` showed `$800 + permit` and stayed bookable.

## Next Action
Inspect diffs, run review gates, then prepare coordinated PR/deploy for estimator + Route Optimizer. Do not deploy one side blindly without checking the compatibility window.
