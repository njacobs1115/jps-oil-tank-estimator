# Next Session - jps-oil-tank-estimator
> Last updated: 2026-05-31 ET

## Start Here

The assisted-conversion telemetry work is live in both systems. Do not treat the telemetry branches as pending implementation work.

Critical attribution decision: first-touch attribution fields are acquisition fields only. Public funnel/contact-entry paths may write them through the `First Touch Locked` gate, but Route Optimizer internal booking tools used by staff/Kelly must not write or lock first-touch fields. Read `PROJECT_DECISIONS.md` and `docs/workflows/funnel-attribution-custom-fields.md` before changing attribution behavior.

## Current State

- Estimator PR #37 is merged and deployed.
- Route Optimizer PR #39 is merged and deployed.
- Route Optimizer blank `jobDetails: ""` follow-up PR #40 is merged and deployed.
- Route Optimizer postdeploy handoff PR #41 is merged.
- GitHub Pages deploy for the estimator completed successfully.
- Route Optimizer `/health/funnel` returned `FUNNEL_OK calendar=19 timed=19` after deploy.

## What Is Live Now

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
- Stamford, CT remains manual-help / confirmed-price and is not direct-bookable unless city data changes.
- Route Optimizer treats blank optional `jobDetails` as omitted instead of returning HTTP 400.

## Checks Already Passed

- Estimator:
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

## Known Follow-Ups

- Dependency audit remediation is the next maintenance item:
  - Estimator: `npm ci` reported one existing moderate dependency warning.
  - Route Optimizer: `npm ci` reported existing dependency audit warnings.
  - Keep remediation separate from funnel behavior changes. Run `npm audit`, identify vulnerable packages, choose safe upgrades, run full tests/build, and use PR/review/deploy gates.
- Continue post-deploy observation of real assisted text/call behavior in analytics and backend JSONL before designing the read-only matching report.

## Recommended First Checks Next Session

- `git status --short --branch`
- Estimator: `gh pr view 37 --json state,mergedAt,mergeCommit`
- Route Optimizer: `gh pr view 40 --json state,mergedAt,mergeCommit`
- Route Optimizer health: `Invoke-WebRequest https://route-optimizer-jps.onrender.com/health/funnel -UseBasicParsing`
