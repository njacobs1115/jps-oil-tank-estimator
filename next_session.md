# Next Session - jps-oil-tank-estimator
> Last updated: 2026-06-21 ET

## Start Here

The live funnel has the checkout oil-level fee guard deployed. The funnel behavior-tracking work still spans this static estimator repo and Route Optimizer; do not rely on this repo alone for funnel telemetry status.

Critical current truth:
- Estimator PR #40 is merged and deployed to GitHub Pages at merge commit `80574a1ab53327f48721c0cb650863851139f19a`.
- Checkout now blocks before date lookup when Step 3 oil answer is `Less than 1/4` or `I don't know`, but checkout exact oil level is `1/2`, `3/4`, or `Full`.
- The oil warning says: `Please Confirm Oil Level. If the tank contains more than 1/4, a $150 oil disposal fee will apply.`
- `Confirm and update price` changes the pricing answer to `More than 1/4`, recomputes the quote with the $150 fee, and only then proceeds.
- This guard is frontend UX protection; it is not a malicious-use server-side price-integrity control.
- This repo emits anonymous funnel behavior events from `booking-funnel.html`.
- Route Optimizer stores and exports those events from Render.
- Route Optimizer PR #44 is merged and deployed with a protected server-to-server export feed.
- The export feed is data egress only. City/drop-off analysis, spreadsheet sync, dashboards, and CRM joins still belong downstream.
- Do not put the export token, webhook URLs, exact admin endpoint/header details, or internal system details in frontend code or public estimator docs.
- Norman confirmed Make is retired. Do not design around Make, test by breaking Make, or POST to old Make hooks. Treat remaining Make references as legacy cleanup only.
- Route Optimizer may have active concurrent edits. Confirm its current branch/status before touching it, and do not edit it from this estimator-doc lane unless Norman explicitly approves.

## Current State

- Estimator PR #40 is merged and deployed.
- Estimator PR #37 is merged and deployed.
- Route Optimizer PR #39 is merged and deployed.
- Route Optimizer PR #44 is merged and deployed.
- Route Optimizer blank `jobDetails: ""` follow-up PR #40 is merged and deployed.
- Route Optimizer postdeploy handoff PR #41 is merged.
- GitHub Pages deploy for the estimator completed successfully.
- GitHub Pages deploy run `27919233143` for PR #40 completed successfully on 2026-06-21.
- Route Optimizer `/health/funnel` returned `FUNNEL_OK calendar=30 timed=30` on 2026-06-12.
- Route Optimizer protected export rejects unauthenticated requests with `401 Unauthorized`.

## What Is Live Now

- Checkout oil-level fee guard:
  - `quarter` or `no_gauge` at Step 3 plus `1/2`, `3/4`, or `Full` at checkout shows the inline warning.
  - The warning blocks before lead capture, date lookup, and tracking submit side effects.
  - Confirming updates the price state to include the $150 oil disposal fee before proceeding.
- Assisted text/call CTA clicks preserve existing GA4/GTM events:
  - `funnel_text_clicked`
  - `funnel_call_clicked`
- Assisted text/call CTA clicks also emit backend JSONL events:
  - `text_clicked`
  - `call_clicked`
- Backend telemetry uses strict non-PII fields:
  - `cta_type`
  - `cta_location`
  - `screen`
- Route Optimizer now has a protected export endpoint for allowlisted anonymous funnel-event rows.
- Stamford, CT remains manual-help / confirmed-price and is not direct-bookable unless city data changes.
- Route Optimizer treats blank optional `jobDetails` as omitted instead of returning HTTP 400.

## Checks Already Passed

- Estimator:
  - PR #40 `codex-review` and `adversarial-review` passed
  - `node test-quote-guardrails.js` passed after oil guard
  - Local and live GitHub Pages oil guard browser smokes passed with Route Optimizer calls intercepted
  - Live GitHub Pages fetch confirmed new oil guard copy and helper
  - `npm ci`
  - `node test-quote-guardrails.js`
  - `node test-funnel.js` passed: 12 passed, 0 failed
  - Local assisted CTA smoke with `sendBeacon` stubbed
  - Live GitHub Pages assisted CTA smoke with `sendBeacon` stubbed
  - WordPress iframe attribution pass-through browser check
- Route Optimizer:
  - `node node_modules\typescript\bin\tsc`
  - `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts` passed: 38 passed, 0 failed
  - `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts` passed: 40 passed, 0 failed
  - `node node_modules\tsx\dist\cli.cjs script\build.ts`
  - live no-write smoke for `jobDetails: ""`
- Route Optimizer export release:
  - PR #44 merged at `140961d384a01fd8fd0b5f0c36fb1f379ccee7bf`
  - `node node_modules\tsx\dist\cli.cjs server\funnel-events-export.test.ts` passed: 69 passed, 0 failed
  - `node node_modules\tsx\dist\cli.cjs server\funnel-events.test.ts` passed: 38 passed, 0 failed
  - `node node_modules\tsx\dist\cli.cjs server\public-api-quote-state.test.ts` passed: 56 passed, 0 failed
  - `node node_modules\typescript\bin\tsc --noEmit` passed
  - `node node_modules\tsx\dist\cli.cjs script\build.ts` passed
  - live `/health`: `200 OK`
  - live `/health/funnel`: `200 FUNNEL_OK calendar=30 timed=30`
  - live unauthenticated export check: `401 Unauthorized`

## Known Follow-Ups

- Active local workspace warning: `C:\AI Workspaces\JPS\repos\jps-oil-tank-estimator` may still be on `codex/sync-funnel-export-docs`, behind `origin/master`, with older dirty doc edits and local oil-guard copies. Start new code work from fresh `origin/master` or reconcile deliberately.
- The clean PR #40 release worktree was removed during workspace migration; the branch remains available locally.
- Reverse oil mismatch remains out of scope: Step 3 `More than 1/4` with checkout gauge at or below `1/4` still keeps the surcharge. Handle separately only if Norman asks.
- First priority: verify the live data-production path before building the downstream report layer. The first authenticated export pull after PR #44 returned only 4 rows over an 89-day window:
  - 3 `funnel_started`
  - 1 `text_clicked`
  - no booking/date/slot signals
  This looks too sparse/test-like for real production funnel activity. Trace GitHub Pages funnel event emission -> public telemetry POST -> Render JSONL persistence -> protected export.
- Build the downstream pull/reporting layer only after the data-production path is proven. That layer should use the export token server-side to load city/drop-off patterns into a dashboard, spreadsheet, or reporting store.
- Dependency audit remediation is the next maintenance item:
  - Estimator: `npm ci` reported one existing moderate dependency warning.
  - Route Optimizer: `npm ci` reported existing dependency audit warnings.
  - Keep remediation separate from funnel behavior changes. Run `npm audit`, identify vulnerable packages, choose safe upgrades, run full tests/build, and use PR/review/deploy gates.
- Legacy Make cleanup is separate from reporting work. The active funnel does not use `index.html`, but that file still contains retired Make-era code and should be removed or neutralized through the normal review lane.
- Estimator local untracked `SECURITY_AUDIT_2026-06-03.md` remains unrelated and untouched. It came from the June 3 security audit and should not be committed as-is.

## Recommended First Checks Next Session

- `git status --short --branch`
- `git fetch origin master --prune`
- `git log --oneline --decorate -5 origin/master`
- Estimator: `gh pr list --state all --limit 10 --json number,title,state,isDraft,updatedAt,mergedAt,headRefName,url`
- Estimator PR #40: `gh pr view 40 --json state,mergedAt,mergeCommit,url`
- Route Optimizer: `gh pr view 44 --json state,mergedAt,mergeCommit,title,url`
- Route Optimizer health: `Invoke-WebRequest https://route-optimizer-jps.onrender.com/health -UseBasicParsing`
- Route Optimizer health: `Invoke-WebRequest https://route-optimizer-jps.onrender.com/health/funnel -UseBasicParsing`
- Route Optimizer export protection check: use the exact protected export path from Route Optimizer operational docs or approved private runbook, then confirm unauthenticated access returns `401`.
- Stale Make scan: `rg -n "\bMake\b|MAKE_|make\.com" .`
