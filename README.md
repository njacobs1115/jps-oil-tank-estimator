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
Customer answers 5 questions
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

A single-file HTML/CSS/JS lead capture and pricing tool for residential oil tank removal in RI, MA, and CT. Homeowners answer 5 questions, get an itemized price estimate, and submit their contact info. No backend, no framework, no build step — just one `index.html` deployed via GitHub Pages.

**This is Phase 1.** The end goal (Phase 2) is that after submitting their info, the customer sees available appointment dates and books on the spot — no callback needed. See the Phase 2 section below before touching anything.

---

## Phase 1 — Current State (LIVE)

### The 5-Step Wizard
1. **Tank size** — 275 gal / 330 gal / Not sure
2. **Location + exit type** — Basement (with sub-question: Walkout / Bulkhead / Stairs) / Garage / Outside
3. **Access** — Clear / Unsure / Restricted
4. **Oil level** — Empty / ¼ or less / More than ½ / No gauge
5. **State & City** — RI (no city needed), MA (city autocomplete), CT (city autocomplete)

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
All 373 MA cities and 70 CT cities are hardcoded into a `cityData` array inside `index.html`. No runtime Airtable API calls — instant load. If pricing changes, re-run `build-citydata.js` to regenerate the array and paste it back in.

- MA entries: `{ city, state: "MA", removal_fee, permit_fee }`
- CT entries: `{ city, state: "CT", removal_fee }` (no permit)
- Source: Airtable base `appUscw3WgCDWkRt9` — MA table `tblJFQSsGfEuLmZc5`, CT table `tblXgn86E0R7hAZqz`

### GHL Webhook
On form submit, a POST fires to `GHL_WEBHOOK_URL` (defined near line 1500 of `index.html`). Currently a placeholder — Norman needs to paste the real URL before this goes fully live.

Payload fields:
```
name, phone, email, note,
tank_size, location_type, exit_type, access_type, oil_level,
excess_oil_fee, state, city,
base_removal_fee, estimated_total_low, estimated_total_high,
permit_fee, restricted_access, stair_removal,
source: "estimator_tool"
```

All job variables are intentionally included — Phase 2 needs them.

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

These variables are already being sent in the GHL payload from the estimator. The Route Optimizer just needs to read them.

### Customer-Facing UI Principles
The internal Route Optimizer UI is data-heavy — that's correct for Norman/VA use. The customer-facing booking UI must be the opposite:

- **One decision at a time.** "Here are 3 dates. Pick one."
- **No scores, no warnings, no efficiency metrics** — all logic runs silently in the background
- **Same design language as the estimator** — dark navy header, large tappable cards, clean invoice style
- **High-ticket = high-anxiety.** The UI must calm them down, not overwhelm them. They have a tank in their basement, possible contamination concerns, permit paperwork, and a $600–$1,200 bill. Every screen should feel like a professional, trusted service.

Suggested toggle: `?mode=customer` vs `?mode=internal` on the Route Optimizer URL.

---

## Tech Stack

| Layer | What | Where |
|---|---|---|
| Estimator | Single HTML file | GitHub Pages (this repo) |
| City pricing data | Hardcoded array in index.html | Rebuilt from Airtable when prices change |
| Lead capture | GHL webhook | GHL location `3bkvnPQV7Lj7BZp5dbjr` |
| Slot logic + booking | Route Optimizer backend | Render — `route-optimizer-jps.onrender.com` |
| CRM + automations | GoHighLevel | GHL |
| Job/pricing data source | Airtable | Base `appUscw3WgCDWkRt9` |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `index.html` | The entire estimator app — HTML, CSS, and JS in one file |
| `build-citydata.js` | Node script to regenerate `cityData` array from Airtable export |
| `citydata-output.js` | Generated city array output (paste contents into index.html) |
| `patch2.js`, `patch3.js` | One-time patch scripts — already applied, kept for reference |

---

## Deployment

GitHub Pages auto-deploys from the `master` branch. Push to master → live in ~1 minute.

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git add index.html
git commit -m "description of change"
git push origin master
```

---

## Open Items Before Phase 2 Can Start

1. **GHL webhook URL** — Norman needs to paste the real URL into `const GHL_WEBHOOK_URL` (~line 1500 of index.html)
2. **Route Optimizer oil constraints** — must be implemented and tested before customer-facing booking UI is built
3. **Route Optimizer backend endpoint** — new POST endpoint needed that creates GHL contact + returns available slots in one call
4. **Copy/messaging polish** — Norman is handling the wording throughout the estimator
5. **Embed on removemyoiltank.com/estimate** — currently standalone on GitHub Pages

---

## Related Systems

- **Route Optimizer:** https://github.com/njacobs1115/Route-Optimizer-JPS — live at `route-optimizer-jps.onrender.com`
- **GHL:** CRM, pipeline, SMS/email automations, appointment booking
- **Airtable base `appUscw3WgCDWkRt9`:** MA and CT city pricing, job records
