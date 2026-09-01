# Airtable City-Pricing Sync Repair

Ticket: JPS-43
Risk lane: Critical
Status: Implemented locally; not pushed, merged, deployed, or enabled

## Verified cause

The monthly script selected Airtable fields using partial field-name matches and object-key order. Decoy fields such as City Delta, Base Fee, and Permit Destination could be selected before the intended fields. June, July, and August validation then rejected the malformed generated values before publication. May predated that validation and reached the combined commit/push step, where it failed; the detailed stderr has expired. Rejection by protected master is the leading explanation, but cannot be proven from the retained May log. The workflow had no Telegram failure or recovery notification.

## Narrow repair

- Read only the verified Airtable table and field IDs.
- Validate every record with strict types before opening or writing the funnel file.
- Generate deterministic, inline-script-safe city data.
- Run deterministic tests before any Airtable request.
- When data changes, create a unique branch and draft PR instead of pushing master.
- Send actionable Telegram failure and recovery messages, with an isolated delivery-test mode.

## Explicit exclusions

This repair does not change `booking-funnel.html`, WordPress/PHP, Airtable records or schema, the pricing formula, booking behavior, customer copy, GHL, unrelated workflows, merge behavior, deployment, or publication.

## External configuration and acceptance

- The `city-pricing-sync-production` GitHub Environment exists and is restricted to protected `master` only.
- `AIRTABLE_API_TOKEN`, `SYNC_PR_TOKEN`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` are stored at environment scope. The prior repository-scoped Airtable secret was removed.
- Airtable access is limited to `data.records:read` on the one verified pricing base and passed a live read-only request against the Massachusetts pricing table.
- The GitHub automation credential is limited to this repository with Contents read/write, Pull requests read/write, required Metadata read, no account permissions, and a 90-day expiration. It cannot administer, approve, merge, deploy, or bypass protection.
- Both controlled TEST Telegram messages were delivered successfully on 2026-09-01.
- Prove an automation-created draft PR starts `codex-review`, `adversarial-review`, and `JPS hygiene`.

## Rollback

Revert the repair PR or disable the scheduled workflow. Generated pricing proposals are draft PRs and can be closed without changing the live website. WordPress and Airtable require no rollback.

## GateKeeper review

### 1. VERDICT

APPROVED WITH WARNINGS

### 2. EXECUTIVE RISK SUMMARY

- The five approved files were reviewed for credentials, untrusted Airtable content, CI permissions, logging, draft-PR publication, and Telegram failure behavior.
- No secret, customer data, webhook credential, frontend credential, or direct production-push path was found in the change.
- The protected environment, least-privilege Airtable and GitHub credentials, and controlled Telegram delivery are now verified.
- Publication is approved only through the repair PR. Merge and production scheduling remain separately gated until an automation-created draft PR proves all required checks start.

### 3. FINDINGS

- **Severity:** LOW
- **Title:** Owner accepted continued use of the existing Telegram alert credential
- **Exact Location:** GitHub repository environment `city-pricing-sync-production`
- **Why It Matters:** The existing alert credential was deliberately reused after Norman accepted the alert-only risk and directed the work to continue.
- **Abuse Scenario:** Unauthorized possession could send messages as the alert bot but cannot change Airtable, GitHub, WordPress, pricing, or customer bookings.
- **Required Fix:** No blocker under the recorded owner decision. Rotate separately if Norman later wants a dedicated estimator alert identity.

### 4. SECRET / EXPOSURE AUDIT RESULT

No committed secrets, tokens, credentials, webhook credentials, customer data, unnecessary business-sensitive data, client-side secrets, or raw provider responses were found. Secret names are references only. Environment separation and provider permissions were verified without committing values.

### 5. PRE-SHIP CHECKLIST STATUS

- [x] secrets absent from code
- [x] endpoints protected or not applicable
- [x] logs clean
- [x] workflow permissions minimal in code
- [x] data handling acceptable
- [x] environment separation configured and verified
- [x] code failure modes acceptable
- [x] docs/examples redacted
- [x] automation input validation acceptable
- [x] CI/CD publication limited to a draft branch/PR

### 6. FINAL RELEASE DECISION

Approved to commit, push, and open the repair PR. Do not merge, deploy, or declare production readiness until the repair PR checks pass, Norman approves merge, and a later automation-created pricing draft proves all required checks start.
