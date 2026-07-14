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

### Checkout Oil-Level Fee Protection

Before date lookup, `submitCheckout()` also compares the Step 3 oil pricing answer with the exact oil level selected at checkout. If the customer was priced as `Less than 1/4` or `I don't know` but selects `1/2`, `3/4`, or `Full` at checkout, the funnel stays on checkout and shows:

> Please Confirm Oil Level. If the tank contains more than 1/4, a $150 oil disposal fee will apply.

`Confirm and update price` changes the pricing answer to `More than 1/4`, recomputes the quote with the $150 fee, and only then proceeds to date lookup. This keeps the displayed price, booking payloads, and customer acknowledgement consistent.

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

Anonymous funnel behavior telemetry is emitted from this repo and collected by Route Optimizer. Route Optimizer PR #44 added a protected server-to-server export feed. The export feed is data egress only; downstream city/drop-off reporting, spreadsheet sync, dashboards, and CRM joins should be built outside Render. Keep export tokens, webhook URLs, and internal endpoint details out of frontend code and public estimator docs.

---

## Open Items — Pick Up Here Next Session

1. **Funnel-event export verification** — Route Optimizer PR #44 shipped the protected export feed, but the first authenticated pull returned only 4 rows over an 89-day window. Verify GitHub Pages event emission -> public telemetry POST -> Render JSONL persistence -> protected export before building downstream reporting.
2. **Downstream report layer** — after the production data path is proven, build the server-side pull/reporting layer that uses the export token to load city/drop-off patterns into a dashboard, spreadsheet, or reporting store.
3. **Legacy Make cleanup** — Norman confirmed Make is retired. Do not test by breaking Make or build new Make paths. Verify live Route Optimizer env no longer depends on legacy `MAKE_*` values, then remove/neutralize retired Make-era code through PR/review gates.
4. **GHL workflow** — Norman to build or verify trigger on `funnel-error` tag -> SMS/email Norman with contact name + phone + price.
5. **End-to-end rescue test** — after the rescue workflow is verified, use an approved safe test path to confirm `funnel-error` contact handling and failure rescue without touching retired Make hooks.
6. **Internal links** — add links from relevant site pages to `/oil-tank-removal-cost`.
7. **Ads destination** — point ads to new URL only after rescue path is proven.
8. **Airtable pricing sync** — add/verify `AIRTABLE_API_TOKEN`, run sync workflow, and confirm stale prices are repaired.

---

## Customer Self-Booking (LIVE)

### Architecture — Important, Read Before Building

**Do NOT redirect after a fire-and-forget lead webhook.** Fire-and-forget webhook -> redirect = race condition. GHL may not have created the contact yet when Route Optimizer tries to book. Breaks intermittently, hard to debug.

**The current approach: Route Optimizer owns the server-side booking work.**

```
Customer submits CTA form
    ↓
Estimator sends contact/job details to Route Optimizer lead capture and requests slots
    ↓
Route Optimizer backend:
  1. Captures/preserves the GHL lead when possible
  2. Runs slot logic with oil constraints applied
    ↓
Returns: { contact_id, available_slots: [date1, date2, date3] }
    ↓
Estimator shows date picker — customer picks one
    ↓
Estimator POSTs the selected date/time to Route Optimizer `/api/public/book`
    ↓
Route Optimizer persists booking intent to the GHL contact before appointment creation
    ↓
Booking succeeds in GHL. Confirmation screen.
```

No API keys in the browser. No public webhook URLs in the frontend.

The code still has separate lead/date/booking calls, and `submitEstimate()` remains separate from `submitCheckout()`. Do not collapse these paths without a fresh cross-repo review.

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
| Lead capture | Route Optimizer public API -> GHL | No public webhook URL in frontend |
| Booking engine | Route Optimizer backend | Render — `route-optimizer-jps.onrender.com` |
| Funnel event export | Protected Route Optimizer endpoint | Server-to-server only; downstream reporting still separate |
| CRM + automations | GoHighLevel | GHL |
| Pricing data source | Airtable | Base `appUscw3WgCDWkRt9` |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `AGENTS.md` | Shared agent rules, protected funnel invariants, and review requirements |
| `PROJECT_DECISIONS.md` | Durable decision log explaining why major funnel guardrails and integrations work the way they do |
| `CLAUDE.md` | Claude/session operating context and current live guardrails |
| `CURRENT_STATE.md` | Current live status, IDs, pending work, and latest deployed change |
| `BRAND.md` | Visual identity and customer-facing design rules |
| `booking-funnel.html` | The live booking funnel — HTML, CSS, JS in one file |
| `index.html` | Older estimator/static entry kept for reference; contains retired Make-era code and is not the live funnel |
| `sync-airtable.js` | Node script to refresh `cityData` from Airtable |
| `last_session.md` | Most recent session closeout |
| `next_session.md` | Next-session starting point and open items |

---

## Deployment

GitHub Pages auto-deploys from `master` after approved merge. This is a critical approval repo: use branch -> PR -> `codex-review` + `adversarial-review`, then wait for approval before merge. Do not push directly to `master`.

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git add booking-funnel.html
git commit -m "description"
git push origin <branch-name>
```
