# JPS Oil Tank Removal — Cost Estimator & Booking System

**Live URL:** https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html
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
→ **Checkout form** — name, phone, email, address, exact oil gauge, then date lookup
→ **Booking review + success screen** — customer reviews selected slot, then booking confirmation/rescue behavior handles success or failure

### Checkout Quote-State Protection

The state selected during the quote is the quote state. Checkout does not ask the customer to pick state again.

Before date lookup, `submitCheckout()` compares the checkout city/ZIP against the quoted state using local RI/MA/CT ZIP-prefix and city-table detection. If the checkout address appears to be in a different state, the funnel stays on checkout and shows a plain warning:

> You were quoted for [state]. This address looks like [state]. Please confirm your address. A different state may affect price.

The customer can correct city/ZIP in place or return to step 4 to update the quote state. This protects pricing accuracy without changing routing logic, Maps/API behavior, slot ranking, booking confirmation, webhook URLs, GHL payload fields, Telegram/rescue logic, pricing formula, or tracking events.

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
| Unknown MA/CT city | No fallback price. Customer sees confirmed-price request path; funnel calls `/api/public/manual-quote` and does not fetch dates or book. |

### City Data
City pricing is hardcoded into `cityData` in `booking-funnel.html` for instant load. Rebuild with `sync-airtable.js` if pricing changes. Validation fails on NaN fees, duplicate/conflicting city rows, missing removal fees, or unsupported states.

### GHL / Route Optimizer Integration

The live booking funnel uses Route Optimizer public endpoints for lead capture, date lookup, and booking. Do not expose secrets or webhook URLs in frontend changes. Keep booking confirmation, rescue behavior, Telegram alerts, and GHL payload fields intact unless explicitly approved.

---

## Open Items — Pick Up Here Next Session

1. **GHL workflow** — Norman to build trigger on `funnel-error` tag -> SMS/email Norman with contact name + phone + price.
2. **End-to-end rescue test** — after GHL workflow exists, intentionally break Make or use an approved safe test path and confirm `funnel-error` contact lands in GHL with all required fields.
3. **Internal links** — add links from relevant site pages to `/oil-tank-removal-cost`.
4. **Ads destination** — point ads to new URL only after rescue path is proven.
5. **Airtable pricing sync** — add/verify `AIRTABLE_API_TOKEN`, run sync workflow, and confirm stale prices are repaired.

---

## Customer Self-Booking (LIVE)

### Architecture — Important, Read Before Building

**Do NOT redirect after the webhook.** Fire-and-forget webhook -> redirect = race condition. GHL may not have created the contact yet when the Route Optimizer tries to load it. Breaks intermittently, hard to debug.

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

These values are already part of the booking flow. Do not change Route Optimizer constraints from this repo unless the Route Optimizer side is reviewed at the same time.

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
| City pricing | Hardcoded array in `booking-funnel.html` | Rebuilt from Airtable with `sync-airtable.js` |
| Lead capture | GHL webhook | GHL location `3bkvnPQV7Lj7BZp5dbjr` |
| Booking engine | Route Optimizer backend | Render — `route-optimizer-jps.onrender.com` |
| CRM + automations | GoHighLevel | GHL |
| Pricing data source | Airtable | Base `appUscw3WgCDWkRt9` |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `AGENTS.md` | Shared agent rules, protected funnel invariants, and review requirements |
| `CLAUDE.md` | Claude/session operating context and current live guardrails |
| `CURRENT_STATE.md` | Current live status, IDs, pending work, and latest deployed change |
| `BRAND.md` | Visual identity and customer-facing design rules |
| `booking-funnel.html` | The live booking funnel — HTML, CSS, JS in one file |
| `index.html` | Older estimator/static entry kept for reference |
| `sync-airtable.js` | Node script to refresh `cityData` from Airtable |
| `last_session.md` | Most recent session closeout |
| `next_session.md` | Next-session starting point and open items |

---

## Deployment

GitHub Pages auto-deploys from `master`. Push → live in ~1 minute.

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git add booking-funnel.html
git commit -m "description"
git push origin master
```
