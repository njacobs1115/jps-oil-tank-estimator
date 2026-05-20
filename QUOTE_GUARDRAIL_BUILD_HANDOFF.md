# Quote Guardrail Build Handoff

## Status

Planning and review complete. Runtime code has now been changed locally after this handoff was approved.

Current implementation status: built locally in `booking-funnel.html` and Route Optimizer `server/public-api.ts` / `server/ghl.ts` / `server/funnel-events.ts`; not staged, committed, merged, or deployed.

The live funnel is producing and must be treated as working customer-facing infrastructure. This work is a surgical guardrail/QC fix for fringe pricing uncertainty, not a redesign.

Gauntlet result: **APPROVED WITH CONDITIONS**.

## Why This Exists

Current issue:
- Unknown MA/CT cities can fall back to fake default pricing (`$600` MA / `$700` CT).
- MA jobs with unknown permit fees can flow through booking with unclear permit handling.
- Contact creation and slot lookup can race.
- Step 5 intent persistence in Route Optimizer is not currently a hard gate before appointment creation.

Business rule:
- A booked appointment should feel set in stone.
- Unknown city pricing must not be guessed.
- Verified-city booking conversion should stay as intact as possible.

## Build Boundary

Do not rebuild the funnel.
Do not add new paid lookup APIs.
Do not add Make/GHL SMS paths.
Do not change verified-city pricing behavior except where needed to carry metadata safely.

Touch only what is required to add quote-confidence guardrails and backend enforcement.

## Required Quote States

Use one canonical quote-confidence contract:

- `verified`
- `ma_permit_tbd`
- `unknown_city_manual_quote`

Frontend may display quote state, but backend must recompute/enforce it. Do not trust browser-submitted quote metadata as authoritative.

## Required Customer Behavior

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
- customer must see a clear caveat everywhere relevant

Required copy meaning:
- removal price is set
- permit is required
- typical permit range is `$50-$110`
- exact town permit fee will be confirmed shortly after booking

Do not imply permit is included when it is not known.

### Unknown MA/CT City

City is not in known pricing data.

Required:
- no fallback price
- no date lookup
- no booking
- no "locked", "flat-rate", "what you see is what you pay", or exact total language
- route to confirmed-price request using the same fields as the booking form

Manual quote submit must:
- create/update lead server-side
- apply allowlisted tag `funnel-manual-quote-needed`
- send internal Telegram alert
- store `funnel_request_id`
- never create appointment
- never show booked/scheduled language

## Backend Requirements

Route Optimizer must enforce the contract server-side:

- Unknown-city requests cannot reach `/api/public/find-slots`.
- Unknown-city requests cannot reach `/api/public/book`.
- Manual quote capture must be server-owned; do not use browser-callable arbitrary tagging.
- `funnel-manual-quote-needed` must be allowlisted server-side.
- Step 5 intent persistence must be fail-closed before appointment creation.
- Required persisted intent fields: requested date, requested time, service, address, name, phone, email, and `funnel_request_id`.
- If intent persistence fails, trigger rescue/no-booking behavior. Do not attempt appointment creation.
- Bind any supplied contact ID to submitted identity and `funnel_request_id`; re-lookup or reject on mismatch.
- Add idempotency/dedupe for manual quote alerts and CRM writes.

## Data And Validation

City data validation must block:
- `NaN` removal or permit fees
- duplicate state/city rows with conflicting values
- missing required removal fees
- unsupported states

Known current data defects found during review:
- `Dracut, MA` has `permit_fee: NaN`
- duplicate rows exist for `Falmouth, MA`
- duplicate rows exist for `Brookline, MA`
- duplicate rows exist for `Lebanon, CT`

Norman said Malden, MA was missing from Airtable and was manually added after a customer call. Sync/validation must confirm the live hardcoded table reflects approved Airtable truth before deploy.

## Telemetry

Existing city telemetry is useful and should remain PII-free.

Keep rejecting:
- name
- phone
- email
- address
- ZIP
- contact IDs
- webhook URLs
- raw booking payloads

Allowed additions:
- quote confidence enum
- booking eligible boolean
- city match source enum
- permit status enum
- manual quote reason enum

## Copy Hotspots

Review and update copy in every affected state:

- results hero label/amount/range
- trust banner
- invoice rows
- "Why our price" accordion
- primary CTA and CTA subtext
- checkout heading
- dates screen
- booking review price row
- booking success message and summary
- estimate form heading
- estimate sent screen
- estimate email HTML

Do not patch only one copy location. The same quote state must be reflected consistently through the path.

## Required Tests

Must verify:

- unknown MA city shows confirmed-price request, not fallback price
- unknown CT city shows confirmed-price request, not fallback price
- unknown city cannot call `/find-slots`
- unknown city cannot call `/book`
- unknown city creates/tagged manual quote lead with `funnel-manual-quote-needed`
- MA permit TBD can book but shows caveat on results, checkout, review, success, and CRM metadata
- verified RI/MA/CT booking path still works
- Step 5 intent write failure prevents appointment creation
- delayed lead/contact creation cannot cause final booking without correct contact/intent state
- telemetry remains PII-free
- kill switches/fuses work
- city validation catches NaN and duplicate/conflicting city rows

## Kill Switches / Rollback

Build must include explicit kill/fuse behavior for:

- manual quote alerting
- manual quote capture flood control
- booking enforcement path

Rollback must not silently restore false-confirming unknown-city bookings. If a kill switch disables manual quote capture, unknown-city customers should see a safe customer-facing fallback that does not show price or dates.

## Files To Start With

Estimator:
- `booking-funnel.html`
- `sync-airtable.js`
- `test-funnel.js` or new focused test script

Backend:
- `C:\Users\njaco\JPS\projects\Route-Optimizer-JPS\server\public-api.ts`
- `C:\Users\njaco\JPS\projects\Route-Optimizer-JPS\server\funnel-events.ts`
- `C:\Users\njaco\JPS\projects\Route-Optimizer-JPS\server\ghl.ts`

## Final Instruction

This is approved only inside the conditions above. If the implementation requires a new paid API, a new SMS/Make path, a broad UX rewrite, or booking behavior outside the quote-state contract, stop and re-plan.
