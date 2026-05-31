# Next Session - jps-oil-tank-estimator

## Start Here
1. This assisted-conversion telemetry work is local only. It has not been pushed or deployed.
2. Use clean worktree `C:\Users\njaco\.codex\worktrees\assisted-estimator` for this branch.
3. Original project folder dirt was parked in a recoverable stash; still build/release from the clean worktree.
4. Route Optimizer backend must ship first because the frontend now emits `text_clicked` and `call_clicked`.
5. Preserve the north star: improve non-booker tracking without changing the customer experience or weakening booking/rescue behavior.

## Current Local Branch
- Branch: `codex/assisted-conversion-telemetry`
- Baseline: `origin/master` at `c14090ccd5843239ac748af33bddff1f4b35bac1`
- Modified files:
  - `booking-funnel.html`
  - `test-funnel.js`

## Implemented Locally
- Added `trackAssistedCtaClick(ctaType, ctaLocation, screen)`.
- Existing GA4/GTM names are preserved:
  - `funnel_text_clicked`
  - `funnel_call_clicked`
- Backend event names now emitted by the funnel:
  - `text_clicked`
  - `call_clicked`
- All visible `sms:` / `tel:` paths are tracked with explicit CTA locations.

## Checks Passed
- `npm ci`
- `node test-quote-guardrails.js`
- `node test-funnel.js` with `ANTHROPIC_API_KEY` available locally: 12 passed, 0 failed
- Local Playwright smoke with `navigator.sendBeacon` stubbed, no live telemetry request sent.
- `git diff --check` passed with line-ending warnings only.
- Postflight code-scope scan found no booking, pricing, rescue, GHL, Telegram, Make, webhook, token, or endpoint changes.

## Broader Funnel Harness Result
- `ANTHROPIC_API_KEY` was available locally; no key value was printed or written.
- `node test-funnel.js` ran against its hardcoded GitHub Pages URL, not the local branch file.
- Result: 12 passed, 0 failed.
- Test harness was corrected so `ct-outside-open-quarter` / Stamford, CT expects the existing manual help / confirmed-price path.
- Stamford is not listed in Airtable/city data and should not be direct-bookable.
- Report generated locally at `test-report/index.html`; the folder is gitignored.

## Workspace Hygiene
- Original folder `C:\Users\njaco\JPS\projects\jps-oil-tank-estimator` is clean after parking pre-existing local changes in `stash@{0}`.
- Stash label: `pre-existing dirty state before assisted telemetry clean worktree release pass 2026-05-30`.

## Next Action
After Route Optimizer and estimator diffs are reviewed, keep Gatekeeper approval attached to the handoff. Do not push until Norman approves the complete preflight/postflight results.
