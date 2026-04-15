# Booking Funnel — Reading Guide
> Read this section first, every session. Then continue to the project context below.

## Session Start — Read in This Order
1. **`next_session.md`** (this repo root) — open items from last session
2. **`last_session.md`** (this repo root) — what was done last session
3. **The rest of this file** — project context, code conventions, external services

## Key URLs & IDs
- **Live funnel:** removemyoiltank.com/oil-tank-removal-cost
- **GA4:** G-SN22KH6SF1 | **GTM:** GTM-T39Z96C (v79 live, workspace 113)
- **Book webhook (Make):** scenario 4603576 | **Estimate webhook (Make):** scenario 4629605
- **Ads conversion:** "Funnel - Booking Confirmed" | ID: 852463092 | Label: RHHyCJ6tj40cEPrpYD
- **Route Optimizer API:** https://route-optimizer-jps.onrender.com

## Hard Rules
- `submitEstimate()` and `submitCheckout()` are separate code paths — do not assume state from one exists in the other
- Pricing logic uses `answers.oil` (pricing step cards), booking uses `booking.oilGauge` (checkout dropdown)
- `buildEstimateEmail()` computes its own total from `answers.*` — does NOT use `booking.estimatedPrice`

---

# CLAUDE.md — Project Preferences & Context

## Decision Principles
- **Automation first**: Always prefer automated solutions over manual ones. If a human has to remember to do it, assume 40%+ chance it won't happen. Only fall back to manual if the tradeoff is truly unbearable.
- **Keep it simple**: Single-page HTML app deployed on GitHub Pages. Avoid adding infrastructure (databases, servers) unless clearly justified.

## Project Overview
- JPS Oil Tank Removal Cost Estimator & Booking Funnel
- Live at: https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html
- Owner: Norman Jacobs (Jacobs Property Solutions / RemoveMyOilTank.com)
- Single HTML file (`booking-funnel.html`) with all CSS/JS inline
- City pricing data is hardcoded in the HTML, synced monthly from Airtable via GitHub Action

## TODO for Norman
- [ ] Add `AIRTABLE_API_TOKEN` secret to GitHub repo: https://github.com/njacobs1115/jps-oil-tank-estimator/settings/secrets/actions — paste your Airtable PAT (needs `data.records:read` scope on base `appUscw3WgCDWkRt9`)
- [ ] After adding the secret, go to Actions tab → "Sync Airtable City Pricing" → "Run workflow" to do the first sync and fix stale prices (e.g. Groton CT)

## Key External Services
- **Route Optimizer API**: https://route-optimizer-jps.onrender.com (appointment slots)
- **Make/GHL Webhook**: Lead capture to GoHighLevel CRM
- **Make Estimate Webhook**: Sends estimate emails via Gmail (scenario: "Estimator - Email Estimate")
- **Airtable**: Source of truth for city pricing data (synced to hardcoded arrays monthly)

## Code Conventions
- All code lives in `booking-funnel.html` — no build step, no bundler
- Pricing logic uses `answers.oil` (from pricing step cards)
- Oil gauge values use `booking.oilGauge` (from checkout dropdown) — mapped via `apiOilLevel()` for Route Optimizer API calls
- GHL webhook expects capitalized gauge values (`Empty`, `Full`, etc.)
- **Estimate flow** uses `buildEstimateEmail()` which computes its own total from `answers.*` — does NOT use `booking.estimatedPrice` (that's only set in the checkout/booking flow)
- **Important**: `submitEstimate()` and `submitCheckout()` are separate paths — don't assume state from one exists in the other
