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

## Key External Services
- **Route Optimizer API**: https://route-optimizer-jps.onrender.com (appointment slots)
- **Make/GHL Webhook**: Lead capture to GoHighLevel CRM
- **Airtable**: Source of truth for city pricing data (synced to hardcoded arrays monthly)

## Code Conventions
- All code lives in `booking-funnel.html` — no build step, no bundler
- Pricing logic uses `answers.oil` (from pricing step cards)
- Oil gauge values use `booking.oilGauge` (from checkout dropdown) — mapped via `apiOilLevel()` for Route Optimizer API calls
- GHL webhook expects capitalized gauge values (`Empty`, `Full`, etc.)
