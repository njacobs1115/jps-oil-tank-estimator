# JPS Oil Tank Removal — Cost Estimator & Booking System

**Live URL:** https://njacobs1115.github.io/jps-oil-tank-estimator/
**Repo:** https://github.com/njacobs1115/jps-oil-tank-estimator (branch: master)
**Owner:** Norman Jacobs — Jacobs Property Solutions / RemoveMyOilTank.com

---

## The Vision — Read This First

**The goal: eliminate the callback entirely.**

Right now a homeowner finds JPS, fills out a form, and waits for a call back. That's a conversion risk — they shop around, don't pick up, lose interest. The vision is a fully self-serve funnel:

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

The estimator (this repo) handles steps 1–3. The Route Optimizer (separate repo) handles step 4. **These two tools are designed to work as a unit — do not build one without understanding the other.**

### Why It Converts
- No phone number or email required to see the price — lowest possible friction to start
- Customers are most likely to book at the moment they see a price they can live with. In-session booking captures that moment.
- High-ticket = high-anxiety customer. The UI is deliberately calm, clean, and one-decision-at-a-time.
- All job variables captured upfront — no surprises at the job site.

### Related Repo
**Route Optimizer:** https://github.com/njacobs1115/Route-Optimizer-JPS
Live at: `route-optimizer-jps.onrender.com`

---

## Current State — Phase 1 (LIVE)

### The Funnel

**Intro screen** — hero card + checklist, "Get My Price →", no contact info required to start

**4-step wizard:**
1. **Location + exit type** — Basement (reveals exit sub-question: Walkout / Bulkhead / Stairs) / Garage / Outside
   - When Basement is tapped: all 3 location cards compress to slim rows, exit type cards reveal below at full size
2. **Access** — Easy / Not sure / Tight or obstructed
   - Restricted access keeps estimate at "from $600" — no scary range shown. Invoice shows "TBD" with photo note.
3. **Oil level** — Less than ¼ (included) / More than ¼ (+$150 flat) / I don't know
   - 3 options, 2x2 grid style tiles, no sub-text, no emoji
4. **State & City** — RI (no city needed), MA (city autocomplete), CT (city autocomplete)

→ **Results screen** — itemized invoice, live price, "How we price our jobs" expandable, social proof
→ **CTA form** — name, phone, email, notes. Button: "Lock In This Price →"
→ **Success screen** — time-aware: M-F 7am–5pm = "you'll hear from us in the next few minutes", after hours = "first thing [day] morning"

### UX Principles Baked In
- **No scroll required on any quiz step** — each screen fits the viewport. Results screen can scroll.
- **Desktop:** larger fonts (17px card labels, 30px headings) for older readers
- **Mobile:** compact cards, `--vh` fix for iOS Safari, shell locked to viewport height per step
- **Intro screen:** both hero and checklist fit above the fold on desktop and mobile

### Pricing Logic
| Variable | Rule |
|---|---|
| Base removal fee | City-specific from hardcoded `cityData` array (MA: $600–$1,125, CT: $700–$1,075, RI: $600 flat) |
| Restricted access | Shown as TBD — confirmed on call. Estimate bar stays at "from $X" |
| Excess oil (>¼ tank) | +$150 flat fee, never per gallon |
| Permit fee (MA) | City-specific from `cityData` — shown as line item |
| Permit fee (CT) | None — green banner shown |
| Permit fee (RI) | None — green banner shown |
| Unknown city | Soft fallback — state default price, keeps lead in funnel, logs to `jps_unknown_cities` in localStorage |

### City Data
373 MA cities + 70 CT cities hardcoded into `cityData` array in `index.html` — no runtime API calls, instant load. Rebuild with `build-citydata.js` if pricing changes.

### GHL Webhook
`const GHL_WEBHOOK_URL` near line ~1700 of `index.html`. **Currently a placeholder — Norman needs to paste the real GHL webhook URL before this is fully live.**

Payload includes: `name, phone, email, note, location_type, exit_type, access_type, oil_level, excess_oil_fee, state, city, base_removal_fee, estimated_total_low, estimated_total_high, permit_fee, restricted_access, stair_removal, source: "estimator_tool"`

---

## Open Items — Pick Up Here Next Session

1. **GHL webhook URL** — paste real URL into `const GHL_WEBHOOK_URL` in index.html. Nothing fires to GHL without this.
2. **Desktop spacing** — Norman wants desktop layout tighter/better spaced. CSS media query work, no separate file needed.
3. **Copy polish** — Norman is reviewing wording throughout. He may have notes.
4. **Embed on removemyoiltank.com/estimate** — currently standalone on GitHub Pages only.
5. **Phase 2 — Route Optimizer oil constraints** — separate agent working on this. Once done, wire estimator success screen to booking UI.

---

## Phase 2 — Customer Self-Booking (NOT YET BUILT)

### Architecture — Important, Read Before Building

**Do NOT redirect after the webhook.** Fire-and-forget webhook → redirect = race condition. GHL hasn't created the contact yet when the Route Optimizer tries to load it. Breaks intermittently, hard to debug.

**The right approach: single POST to Route Optimizer backend.**

```
Customer submits CTA form
    ↓
Estimator POSTs all job variables + contact info to Route Optimizer backend
    ↓
Route Optimizer backend (server-side):
  1. Creates GHL contact → gets contact ID back
  2. Runs slot logic with oil constraints applied
    ↓
Returns: { contact_id, available_slots: [date1, date2, date3] }
    ↓
Estimator shows date picker — customer picks one
    ↓
Booking confirmed in GHL. Confirmation screen.
```

No API keys in the browser. No race conditions. One round trip.

### Oil Constraints Needed in Route Optimizer
| Estimator variable | Constraint to apply |
|---|---|
| `oil_level: "half_plus"` | Block days at disposal capacity |
| `access_type: "restricted"` | Longer time buffer per slot |

These are already in the GHL webhook payload — Route Optimizer just needs to read them from the GHL contact record.

### Customer-Facing UI Principles
- One decision at a time: "Here are 3 dates. Pick one."
- No scores, no warnings, no efficiency data — logic runs silently
- Same design language as estimator: dark navy header, large tappable cards
- URL toggle: `?mode=customer` vs `?mode=internal`

---

## Tech Stack

| Layer | What | Where |
|---|---|---|
| Estimator | Single HTML file | GitHub Pages (this repo) |
| City pricing | Hardcoded array in index.html | Rebuilt from Airtable when prices change |
| Lead capture | GHL webhook | GHL location `3bkvnPQV7Lj7BZp5dbjr` |
| Booking engine | Route Optimizer backend | Render — `route-optimizer-jps.onrender.com` |
| CRM + automations | GoHighLevel | GHL |
| Pricing data source | Airtable | Base `appUscw3WgCDWkRt9` |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `index.html` | The entire app — HTML, CSS, JS in one file |
| `build-citydata.js` | Node script to rebuild `cityData` from Airtable export |
| `citydata-output.js` | Generated city array (paste into index.html) |
| `patch2.js`, `patch3.js` | One-time patches — already applied, kept for reference |

---

## Deployment

GitHub Pages auto-deploys from `master`. Push → live in ~1 minute.

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git add index.html
git commit -m "description"
git push origin master
```
