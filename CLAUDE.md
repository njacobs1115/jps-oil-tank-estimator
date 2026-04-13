# CLAUDE.md — Project Preferences & Context

## Decision Principles
- **Automation first**: Always prefer automated solutions over manual ones. If a human has to remember to do it, assume 40%+ chance it won’t happen. Only fall back to manual if the tradeoff is truly unbearable.
- **Keep it simple**: Single-page HTML app deployed on GitHub Pages. Avoid adding infrastructure (databases, servers) unless clearly justified.

## Project Overview
- JPS Oil Tank Removal Cost Estimator & Booking Funnel
- Deployed via GitHub Pages
- Single HTML file (`booking-funnel.html`) with all CSS/JS inline
- City pricing data is hardcoded in the HTML, synced monthly from Airtable via GitHub Action

## TODO for Norman
- [ ] Add `AIRTABLE_API_TOKEN` secret to this repo's GitHub Actions secrets (needs `data.records:read` scope on the pricing base)
- [ ] After adding the secret, go to Actions tab → “Sync Airtable City Pricing” → “Run workflow” to do the first sync

## Key External Services
- **Route Optimizer API**: Hosted on Render (URL in env config) — appointment slots
- **CRM Webhook**: Lead capture to GoHighLevel CRM (proxied through Route Optimizer)
- **Estimate Webhook**: Sends estimate emails (proxied through Route Optimizer)
- **Airtable**: Source of truth for city pricing data (synced to hardcoded arrays monthly)

## Code Conventions
- All code lives in `booking-funnel.html` — no build step, no bundler
- Pricing logic uses `answers.oil` (from pricing step cards)
- Oil gauge values use `booking.oilGauge` (from checkout dropdown) — mapped via `apiOilLevel()` for Route Optimizer API calls
- GHL webhook expects capitalized gauge values (`Empty`, `Full`, etc.)
- **Estimate flow** uses `buildEstimateEmail()` which computes its own total from `answers.*` — does NOT use `booking.estimatedPrice` (that’s only set in the checkout/booking flow)
- **Important**: `submitEstimate()` and `submitCheckout()` are separate paths — don’t assume state from one exists in the other
