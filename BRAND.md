# BRAND.md — RemoveMyOilTank.com
> Source of truth for visual identity on all JPS customer-facing work.
> Designer reads this before touching any design.
> Last updated: 2026-04-01
> Source: Verified against live site (homepage + /oil-tank-removal-cost/) 2026-04-01

---

## Brand Identity

**Company:** Jacobs Property Solutions (JPS)
**Brand name:** RemoveMyOilTank.com
**Service:** Above-ground residential oil tank removal — RI, MA, CT only
**Positioning:** Professional, direct, trustworthy. 400+ 5-star reviews. Flat-rate pricing.
**Tone:** Clear and confident. No fluff. Homeowner-friendly, not contractor-jargon.

---

## Color Palette

| Name | Hex | Usage |
|---|---|---|
| JPS Orange | `#e8722a` | Primary CTA buttons, key accents |
| JPS Navy | `#1a1f2e` | Nav background, dark sections, headers |
| White | `#ffffff` | Button text on orange, page backgrounds |
| Dark Gray | `#333333` | Body text, secondary nav text |

**CTA color is orange (`#e8722a`), not yellow.** Yellow (`#fbf80b`) appears in the Themify theme defaults but is NOT the active brand CTA color — confirmed from /oil-tank-removal-cost/ CSS custom properties.

### Contrast Notes (WCAG AA)
- White text on `#e8722a` orange: ~3.1:1 — passes AA for UI components and large text (18px+). Fails for normal body text. Do not use orange as a background for body-size text blocks.
- White text on `#1a1f2e` navy: ~14:1 — passes AAA. Reliable for all text sizes.
- `#333333` on white: ~12.6:1 — passes AAA.

---

## Typography

**Heading font:** Inherits from Themify Ultra theme — confirmed sans-serif. Exact family not exposed via CSS on live pages (theme-level setting). Treat as system sans-serif for spec purposes until Norman confirms.
**Body font:** Same as above.
**Nav font:** Uppercase, tracking applied via Themify. All-caps nav labels are the established convention.

---

## Button Style

**Primary CTA button:**
- Background: `#e8722a`
- Text: `#ffffff`
- Border radius: 10px
- Box shadow: yes (depth effect)
- Minimum height: 44px (touch target requirement — D5)
- Text: White, bold, sentence-case or ALL CAPS depending on context

**Secondary / ghost button:** Not yet documented on live site. Recommend outline style with `#e8722a` border and text on white background when needed.

---

## Navigation

**Background:** `#1a1f2e` (navy)
**Text color:** White (on navy background)
**Style:** All-caps labels, horizontal top bar, dropdown for Services
**Mobile breakpoint:** 900px — hamburger menu activates
**Sticky:** Yes — nav sticks on scroll

---

## Voice and Tone

- Direct. Homeowners are stressed and want answers fast.
- No jargon. "We remove your oil tank" not "we provide comprehensive decommissioning services."
- Numbers up front. "$600 flat rate" not "competitive pricing."
- Action-oriented. Every headline should imply a next step.

---

## Pre-Flight Checklist (run before presenting designs to Norman)

- [ ] WCAG AA contrast verified for all color choices
- [ ] Mobile layout tested at 375px (iPhone SE)
- [ ] Touch targets confirmed minimum 44px on all interactive elements
