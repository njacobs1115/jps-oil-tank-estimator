# JPS Oil Tank Removal — Cost Estimator & Booking System

**Live URL:** https://njacobs1115.github.io/jps-oil-tank-estimator/
**Repo:** https://github.com/njacobs1115/jps-oil-tank-estimator (branch: master)
**Owner:** Norman Jacobs — Jacobs Property Solutions / RemoveMyOilTank.com

---

## The Vision — Read This First

**The goal: eliminate the callback entirely.**

Right now a homeowner finds JPS, calls or fills out a form, and waits. Someone calls them back, walks through the job, quotes a price, and tries to schedule. That's 2–3 touchpoints before a job is confirmed. Every touchpoint is a conversion risk — they shop around, don't pick up, lose interest.

The vision is a fully self-serve funnel:

```
Customer answers 4 questions
    ↓
They see their exact price — itemized, transparent, no surprises
    ↓
They enter their contact info
    ↓
They see 3 available appointment dates and pick one
    ↓
Job confirmed. No callback needed.
```

The estimator (this repo) handles steps 1–3. The Route Optimizer (separate repo) handles step 4. Together they form one seamless funnel. **These two tools are designed to work as a unit — do not build one without understanding the other.**

### Why It Works
- Customers are most likely to book at the moment they see a price they can live with. In-session booking captures that moment. A callback 20 minutes later does not.
- All job variables (tank size, oil level, access difficulty, city) are captured upfront — no surprises at the job site, no upsell awkwardness.
- The Route Optimizer already knows capacity (3 jobs/day max) and geography. With oil constraints added, it can filter slots automatically — no human has to eyeball the calendar.
- High-ticket service = high-anxiety customer. A clean, transparent, self-serve experience signals professionalism and builds trust before anyone picks up the phone.

### Related Repo
**Route Optimizer:** https://github.com/njacobs1115/Route-Optimizer-JPS
Live at: `route-optimizer-jps.onrender.com`
This is the slot-finding and booking engine. Phase 2 requires both repos to talk to each other.

---

## What This Is (Technical)

A single-file HTML/CSS/JS lead capture and pricing tool for residential oil tank removal in RI, MA, and CT. Homeowners answer 4 questions, get an itemized price estimate, and submit their contact info. No backend, no framework, no build step — just one `index.html` deployed via GitHub Pages.

**This is Phase 1.** The end goal (Phase 2) is that after submitting their info, the customer sees available appointment dates and books on the spot — no callback needed. See the Phase 2 section below before touching anything.

---

## Phase 1 — Current State (LIVE)

### The 4-Step Wizard
1. **Location + exit type** — Basement (with sub-question: Walkout / Bulkhead / Stairs) / Garage / Outside
2. **Access** — Clear / Unsure / Restricted
3. **Oil level** — Empty / ¼ or less / More than ½ / No gauge
4. **State & City** — RI (no city needed), MA (city autocomplete), CT (city autocomplete). City input displays with state abbreviation (e.g. "Thompson, CT")

→ **Results screen** — itemized invoice with live price
→ **CTA form** — name, phone, email, notes
→ **Success screen** — time-aware message (business hours vs. after hours)

### Pricing Logic
| Variable | Rule |
|---|---|
| Base removal fee | City-specific from hardcoded `cityData` array (MA: $600–$1,125, CT: $700–$1,075, RI: $600 flat) |
| Restricted access | +$600 surcharge, confirmed on-site |
| Excess oil (>½ tank) | +$150 flat fee |
| Permit fee (MA) | City-specific from `cityData` — shown as line item |
| Permit fee (CT) | None — green "no permit fee" banner shown |
| Permit fee (RI) | None — green "no permit fee" banner shown |
| Unknown city | Soft fallback — state default price, logged to localStorage as `jps_unknown_cities` |

### City Data
All 373 MA cities and 70 CT cities are hardcoded into a `cityData` array inside `index.html`. No runtime Airtable API calls — instant load. If pricing changes, regenerate the array from Airtable and paste it back in.

- MA entries: `{ city, state: "MA", removal_fee, permit_fee }`
- CT entries: `{ city, state: "CT", removal_fee }` (no permit)
- Source: Airtable base `appUscw3WgCDWkRt9` — MA table `tblJFQSsGfEuLmZc5`, CT table `tblXgn86E0R7hAZqz`

---

## Webhooks & Integrations

### Make Webhook — Lead Submission (LIVE)
On form submit, a POST fires to a Make (formerly Integromat) webhook (`GHL_WEBHOOK_URL` constant near line 1827 of `index.html`). This is connected and live — leads flow into Make for routing to GHL and any other automations.

Payload fields:
```
name, phone, email, note,
tank_size, location_type, exit_type, access_type, oil_level,
base_removal_fee, excess_oil_fee, permit_fee,
estimated_total_low, estimated_total_high,
restricted_access, stair_removal,
state, city,
source: "estimator_tool",

// Attribution / UTM (see section below)
utm_source, utm_medium, utm_campaign, utm_term, utm_content,
gclid, gad_source, fbclid, msclkid,
landing_page, landing_page_full, referrer
```

All job variables are intentionally included — Phase 2 needs them.

### Make Webhook — Weekly City Report
A second webhook fires once per 7 days on page load. It aggregates city selections from `localStorage` and sends a summary report. Useful for spotting unknown cities and regional demand patterns.

---

## UTM & Attribution Tracking

Full-funnel attribution is captured automatically on page load and included in every webhook payload.

### Tracked Parameters

| Category | Parameters |
|---|---|
| Standard UTM | `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` |
| Google Ads | `gclid`, `gad_source` |
| Facebook / Meta | `fbclid` |
| Microsoft Ads | `msclkid` |
| Page context | `landing_page` (URL without query), `landing_page_full` (complete URL), `referrer`, `timestamp` |

### How It Works
1. On page load, all URL query params are read via `URLSearchParams`
2. Values are stored in `sessionStorage` under `jps_attribution` so they survive in-page navigation
3. If a visitor arrives with new query params, they overwrite any previously stored values
4. `landing_page`, `landing_page_full`, `referrer`, and `timestamp` are always captured — even without UTM params
5. On form submit, all attribution fields are merged into the webhook payload

### Testing Attribution Locally

Paste this in your browser console while on the estimator page to simulate a Google Ads click:

```js
window.location.search = '?utm_source=google&utm_medium=cpc&utm_campaign=spring_test&utm_term=oil+tank+removal&utm_content=ad_v2&gclid=test_gclid_123&fbclid=test_fb_456';
```

The page reloads with UTM params in the URL — exactly like a real visitor clicking an ad. Fill out the estimator normally and submit. Check the Make execution log and GHL contact — you should see all normal lead data plus the UTM/attribution fields.

---

## Key Functions Reference

| Function | Purpose |
|---|---|
| `startEstimator()` | Show quiz, hide intro screen |
| `goToStep(n)` | Navigate between wizard screens 1–4 |
| `selectLocation(el)` | Basement/Garage/Outside selection; shows exit sub-question if basement |
| `selectCard(el, type)` | Generic card selection (access, oil) |
| `selectState(el)` | State selection; conditionally shows city input |
| `onCityInput(input)` | City autocomplete from `cityData` array |
| `selectCity(city, fee, removalFee)` | Confirm matched city, lock in pricing |
| `selectCityFallback(city)` | Fallback for unknown city; uses state-level pricing |
| `computePricing()` | Calculate total and display itemized invoice |
| `updateEstimateBar()` | Update floating price bar at bottom |
| `submitCTA()` | Validate form, build payload, fire webhook |
| `showSuccess(name)` | Show success screen with time-aware message |
| `syncCityReport()` | Weekly city selection report via webhook |

---

## localStorage / sessionStorage Keys

| Key | Storage | Purpose |
|---|---|---|
| `jps_city_log` | localStorage | Array of city selections with timestamps (up to 500 entries) |
| `jps_unknown_cities` | localStorage | Set of unrecognized city:state combos |
| `jps_city_log_last_sync` | localStorage | Timestamp of last weekly city report sync |
| `jps_attribution` | sessionStorage | UTM + landing page + referrer data for current session |

---

## Dev Mode & Debugging

- If `GHL_WEBHOOK_URL` is not set or is `'PASTE_GHL_WEBHOOK_URL_HERE'`, form submission skips the webhook and logs the full payload to the browser console
- All key events log to console with `[Estimator]` prefix
- Form submission payload is logged: `console.log('[Estimator] Submitting to GHL:', payload)`
- Webhook errors are caught and logged; the success screen still shows (graceful degradation)

---

## Tech Stack

| Layer | What | Where |
|---|---|---|
| Estimator | Single HTML file | GitHub Pages (this repo) |
| City pricing data | Hardcoded array in index.html | Rebuilt from Airtable when prices change |
| Lead capture | Make webhook → GHL | Make scenario receives form submissions, routes to GHL |
| Slot logic + booking | Route Optimizer backend | Render — `route-optimizer-jps.onrender.com` |
| CRM + automations | GoHighLevel | GHL |
| Job/pricing data source | Airtable | Base `appUscw3WgCDWkRt9` |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `index.html` | The entire estimator app — HTML, CSS, and JS in one file |
| `README.md` | This documentation |

---

## Deployment

GitHub Pages auto-deploys from the `master` branch. Push to master → live in ~1 minute.

```bash
git add index.html
git commit -m "description of change"
git push origin master
```

---

## Phase 2 — Customer Self-Booking (NOT YET BUILT)

### The Goal
After submitting their contact info, the customer immediately sees the 3 soonest available appointment dates and books with one tap. No sales callback needed. Same session, zero friction.

### Why It Matters
The current flow ends at "we'll call you." Every callback is a conversion risk — the customer has time to shop around, change their mind, or just not pick up. Booking in-session, while they're engaged and the price is fresh, eliminates that window.

### The Architecture

**Do not use a webhook redirect.** Redirecting after a fire-and-forget webhook causes a race condition — the Route Optimizer would try to load the customer's data before GHL has finished creating the contact. It will break intermittently and be hard to debug.

**The right approach: single POST to the Route Optimizer backend.**

```
Customer submits CTA form
    ↓
Estimator POSTs to Route Optimizer backend endpoint
(all job variables + name/phone/email — same payload as current GHL webhook)
    ↓
Route Optimizer backend (server-side, no CORS issues):
  Step 1 — Creates GHL contact via API → gets contact ID back
  Step 2 — Runs slot logic with oil constraints applied
    ↓
Returns JSON: { contact_id, available_slots: [date1, date2, date3] }
    ↓
Estimator renders date picker: "Here are your 3 soonest dates"
Customer taps one → booking confirmed in GHL
    ↓
Confirmation screen
```

All GHL API calls happen server-side in the Route Optimizer backend. No API keys in the browser. No race conditions. One round trip.

### Oil Constraints (must be implemented in Route Optimizer before Phase 2 UI is built)
The Route Optimizer currently does geographic clustering and capacity checks (3 jobs/day max). It needs to also apply:

| Variable from estimator | Constraint |
|---|---|
| `oil_level: "half_plus"` | Blocks days already at oil disposal capacity |
| `access_type: "restricted"` | Adds longer time buffer per slot |
| `tank_size: "330"` | Heavier job — affects crew capacity |

These variables are already being sent in the webhook payload from the estimator. The Route Optimizer just needs to read them.

### Customer-Facing UI Principles
The internal Route Optimizer UI is data-heavy — that's correct for Norman/VA use. The customer-facing booking UI must be the opposite:

- **One decision at a time.** "Here are 3 dates. Pick one."
- **No scores, no warnings, no efficiency metrics** — all logic runs silently in the background
- **Same design language as the estimator** — dark navy header, large tappable cards, clean invoice style
- **High-ticket = high-anxiety.** The UI must calm them down, not overwhelm them. They have a tank in their basement, possible contamination concerns, permit paperwork, and a $600–$1,200 bill. Every screen should feel like a professional, trusted service.

Suggested toggle: `?mode=customer` vs `?mode=internal` on the Route Optimizer URL.

---

## Open Items Before Phase 2 Can Start

1. ~~**Webhook URL**~~ — **DONE.** Make webhook connected and firing on form submit
2. ~~**UTM / Attribution tracking**~~ — **DONE.** Full UTM, gclid, fbclid, msclkid, landing page, and referrer tracking live
3. **Route Optimizer oil constraints** — must be implemented and tested before customer-facing booking UI is built
4. **Route Optimizer backend endpoint** — new POST endpoint needed that creates GHL contact + returns available slots in one call
5. **Copy/messaging polish** — Norman is handling the wording throughout the estimator
6. **Embed on removemyoiltank.com/estimate** — currently standalone on GitHub Pages

---

## Related Systems

- **Route Optimizer:** https://github.com/njacobs1115/Route-Optimizer-JPS — live at `route-optimizer-jps.onrender.com`
- **GHL:** CRM, pipeline, SMS/email automations, appointment booking
- **Airtable base `appUscw3WgCDWkRt9`:** MA and CT city pricing, job records
