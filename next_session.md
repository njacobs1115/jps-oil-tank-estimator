# Next Session - jps-oil-tank-estimator

## Start Here
1. Confirm whether the user is asking about the live quote-state mismatch fix or a new funnel issue.
2. If it is the mismatch fix, start from live/current state, not the old hung PR story.
3. Do not reintroduce a second checkout state/city selector unless Norman explicitly asks for that UX.

## Current Live State
- PR `#29` is merged and deployed.
- Live behavior: checkout city/ZIP is checked against the state selected during the quote.
- If address state appears different, the customer stays on checkout and sees a warning.
- Customer can correct the address in place or go back to the quote state step.
- Normal RI/MA/CT checkout paths were smoke-tested and still reach date lookup.

## Important Guardrails
- Do not touch routing logic, Maps/API logic, slot ranking, booking confirmation, webhook URLs, GHL payload fields, Telegram/rescue logic, pricing formula, or tracking events unless explicitly requested.
- `submitEstimate()` and `submitCheckout()` are separate code paths. Do not assume shared state.
- Before any future merge/deploy, run the required review/gate process again.
- Approval token `1228` was used for the PR `#29` merge/deploy only; do not reuse it for new scope.

## Open Items
1. **Optional live manual QA** - Norman already tested and said it seems to work. If more proof is needed, test one real browser path per state without submitting a real booking.
2. **GHL workflow** - Norman to build trigger on `funnel-error` tag -> SMS/email Norman with contact name + phone + price.
3. **End-to-end rescue test** - after GHL workflow exists, intentionally break Make or use an approved safe test path and confirm `funnel-error` contact lands in GHL with all required fields.
4. **Internal links** - add links from relevant site pages pointing to `/oil-tank-removal-cost`.
5. **Ads destination** - point ads to the new URL only after the end-to-end rescue path is proven.

## First Action Next Session
Ask what Norman wants to verify next. If he asks about the deployed mismatch fix, inspect the live page and PR `#29` state first, then proceed from the deployed `master` commit `7a7ce96`.
