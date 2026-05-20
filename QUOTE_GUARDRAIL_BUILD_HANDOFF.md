# Quote Guardrail Build Handoff

## Status

Planning, review, build, deploy, and live smoke are complete.

Current implementation status: live in estimator PR `#32` and Route Optimizer PR `#34`.

- Estimator merge commit: `8d188c030663da0013f455952f13dd72003eb130`.
- Route Optimizer merge commit: `813b9dd87ce11691c421502552f128fc87bb5be1`.
- Live smoke confirmed unknown MA does not fetch dates or book, and Malden MA remains bookable at `$800` with permit caveat.

The live funnel is producing and must be treated as working customer-facing infrastructure. This work was a surgical guardrail/QC fix for fringe pricing uncertainty, not a redesign.

Gauntlet result: approved with conditions. Gatekeeper for the release phase passed with warnings only for existing maintenance items.

## Why This Exists

Original issue:
- Unknown MA/CT cities could fall back to guessed default pricing (`$600` MA / `$700` CT).
- MA jobs with unknown permit fees could flow through booking with unclear permit handling.
- Contact creation and slot lookup could race.
- Step 5 intent persistence needed to be a hard gate before appointment creation.

Business rule:
- A booked appointment should feel set in stone.
- Unknown city pricing must not be guessed.
- Verified-city booking conversion should stay as intact as possible.

## Shipped Contract

Canonical quote-confidence states:
- `verified`
- `ma_permit_tbd`
- `unknown_city_manual_quote`

Frontend displays quote state, but backend enforcement is the final guardrail.

## Customer Behavior

### Verified Quotes

Known city price and permit handling are complete.

Allowed:
- normal exact/locked price copy
- normal `Book My Removal - Pick a Date`
- normal slot lookup and booking

### MA Permit TBD

Known MA base removal price, but town permit fee is unknown.

Allowed:
- booking remains allowed
- customer sees clear permit caveat

Required meaning:
- removal price is set
- permit is required
- typical permit range is `$50-$110`
- exact town permit fee will be confirmed after booking

### Unknown MA/CT City

City is not in known pricing data.

Required behavior now:
- no fallback price
- no date lookup
- no booking
- no locked/flat-rate/exact total language
- route to confirmed-price request using the same fields as the booking form
- server-owned manual quote capture applies `funnel-manual-quote-needed`
- no appointment creation
- no booked/scheduled language

## Backend Requirements Shipped

Route Optimizer enforces:
- Unknown-city requests cannot reach `/api/public/find-slots`.
- Unknown-city requests cannot reach `/api/public/book`.
- Manual quote capture is server-owned.
- `funnel-manual-quote-needed` is allowlisted server-side.
- Step 5 intent persistence is fail-closed before appointment creation.
- Manual quote capture has rate/fuse controls and kill switch `DISABLE_MANUAL_QUOTE_CAPTURE`.

## Data And Validation

City data validation blocks:
- `NaN` removal or permit fees
- duplicate state/city rows with conflicting values
- missing required removal fees
- unsupported states

Data shipped:
- `Malden, MA` at `$800`, permit TBD.
- `Dracut, MA` permit fixed from `NaN` to `null`.
- Duplicate/conflicting `Falmouth, MA`, `Brookline, MA`, and duplicate `Lebanon, CT` removed.

## Telemetry

Quote-state metadata is allowed and PII-free.

Still reject in telemetry:
- name
- phone
- email
- address
- ZIP
- contact IDs
- webhook URLs
- raw booking payloads

## Required Ongoing Checks

Watch the first few live:
- unknown-city manual quote requests
- MA permit-TBD bookings
- date-fetch failures
- booking failures

Do not restart this build as if it is pending. Next work should be post-deploy observation and separate cleanup phases. If future changes require a new paid API, a new SMS/Make path, a broad UX rewrite, or booking behavior outside the quote-state contract, stop and re-plan.
