# Funnel Attribution Custom Fields

This document defines the purpose of the GHL attribution custom fields used by the booking funnel. These fields exist to answer one question: how did this customer first reach JPS before they converted through a call, text, form, estimate request, or funnel booking?

## Core Rule

These are first-touch attribution fields. Once a real value is present, do not overwrite it during later booking, follow-up, appointment, or job-completion automation.

The fields describe the customer's acquisition path into the website. They are not the job lifecycle source of truth and are not the final offline conversion record.

`First Touch Locked` is the write gate for this whole group. Before any first-touch field is changed or updated, the automation must check the lock field. If it is already marked yes, do not touch first-touch fields. If it is blank/no and any first-touch field is written, mark `First Touch Locked` yes in the same write path.

## System Boundary

First-touch attribution belongs only to public customer acquisition and first website/funnel conversion paths. The funnel, Route Optimizer public endpoints, and Hetzner funnel webhook handlers should be treated as one unit when changing this layer.

The Route Optimizer internal booking tool is outside this attribution boundary. Internal bookings handled by staff/Kelly are operational scheduling actions for customers already being handled in CRM. Those internal booking paths must not write First Touch Source, Medium, Campaign, GCLID, Landing Page, Conversion Time, Referrer, or First Touch Locked.

Do not put first-touch writes in a generic GHL helper that is shared by public funnel paths and internal booking tools. Keep the attribution helper scoped to public funnel/contact-entry paths so internal scheduling cannot accidentally stamp or lock acquisition fields.

## Field Meanings

| Field | Purpose | Correct value | Do not use for |
|---|---|---|---|
| First Touch Source | Where the customer came from | `google`, `facebook`, `bing`, `gbp`, `main_website`, `direct`, referring site name | Funnel status, appointment status, or generic `booking_funnel` when a real acquisition source is known |
| First Touch Medium | The channel type | `cpc`, `organic`, `local`, `referral`, `social`, `email`, `sms`, `direct` | Service type, lead status, or funnel step |
| First Touch Campaign | The named campaign or marketing effort, only when real campaign data exists | Actual `utm_campaign` or platform campaign value | Invented labels, inferred campaign names, ad group notes, customer notes, or job details |
| First Touch GCLID | Google click ID for ad attribution | Raw `gclid` from the first landing URL | Manually invented IDs |
| First Touch Landing Page | The first real website page the customer landed on | `https://www.removemyoiltank.com/oil-tank-removal-cost/?utm_source=google&utm_medium=cpc...` | The embedded GitHub Pages funnel URL, except direct testing/staging |
| First Touch Referrer | The previous page or site, if available | `https://www.google.com/`, GBP/referral URL, or referring website | Replacement for UTM source when source is already known |
| First Touch Conversion Time | When the customer converted on the website | Timestamp of the call, text, form submit, estimate request, manual quote request, or funnel booking | Job completion time or final offline conversion time |
| First Touch Locked | Write-once gate for the first-touch group | `Yes` after any first-touch field is written | Reporting channel, lead status, or lifecycle status |

## Landing Page vs Funnel URL

The landing page is the customer acquisition landing page, usually on `removemyoiltank.com`.

The embedded funnel app URL, such as `https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html`, is the conversion app URL. It should not be stored as the first-touch landing page for production traffic when the customer arrived through a parent website page.

If the funnel is embedded in WordPress, the parent page should pass the parent landing page and attribution query parameters into the iframe. The funnel should preserve that parent landing page as the first-touch landing page.

## Standard Funnel Booking Attribution Shape

For a Google Ads visitor who books through the funnel, the intended attribution shape is:

```json
{
  "first_touch_source": "google",
  "first_touch_medium": "cpc",
  "first_touch_campaign": "oil_tank_removal_ri",
  "first_touch_content": "search_ad_variant_a",
  "first_touch_term": "oil tank removal near me",
  "gclid": "google-click-id",
  "landing_page": "https://www.removemyoiltank.com/oil-tank-removal-cost/?utm_source=google&utm_medium=cpc&utm_campaign=oil_tank_removal_ri",
  "referrer": "https://www.google.com/",
  "conversion_page": "https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html",
  "conversion_type": "funnel_booking",
  "first_touch_conversion_time": "2026-05-31T14:30:00.000Z"
}
```

Only include `first_touch_campaign`, `first_touch_content`, and `first_touch_term` when that campaign data is actually available from UTM parameters, ad click metadata, or another trusted campaign source. Do not invent campaign values from the service, city, job type, or funnel path.

`conversion_page` and `conversion_type` are explanatory values. They are separate from first-touch landing page and should use separate fields if stored in GHL.

## First Touch Lock

`First Touch Locked` prevents accidental attribution drift. The lock is not the reporting source; it is a control flag.

Before writing any of these fields, the system must:

1. Read the current contact.
2. Check `First Touch Locked`.
3. If locked is yes, skip all first-touch writes.
4. If locked is blank/no, write the available first-touch fields.
5. If any first-touch field was written, set `First Touch Locked` to yes.

This applies even when only one field is available. For example, if the only trustworthy first-touch value is `source = google`, writing that source should also lock the first-touch group. Later automations should not come back and overwrite it with a funnel status, appointment source, native GHL value, or a new website session.

## Conversion Time vs Job Completion

First Touch Conversion Time is the time the customer became a lead or booking through a website action. Examples:

- They clicked to call from the funnel.
- They clicked to text from the funnel.
- They submitted the estimate email form.
- They requested a confirmed price.
- They submitted contact info and booked/requested an appointment.

This is not the time the job was completed.

The actual job completion is the downstream offline conversion event. That future offline conversion should be based on the completed job record, appointment/job status, payment, or another job-completion source of truth. It should not reuse First Touch Conversion Time.

## Reporting Hierarchy

When judging where a customer came from, prefer:

1. First-touch custom fields.
2. Click IDs such as `gclid`, `gbraid`, or `wbraid`.
3. Parent landing page and referrer.
4. Native GHL attribution.
5. True unknown.

Native GHL source may show `Unknown`, `Other`, or a generic integration source even when the custom first-touch fields contain the useful attribution. Do not treat native GHL source as the primary truth layer for funnel attribution.

## Implementation Guardrails

- Preserve first-touch values; do not overwrite non-empty values on later updates.
- Check `First Touch Locked` before changing any first-touch field.
- If any first-touch field is written, set `First Touch Locked` to yes.
- Only public funnel/contact-entry paths may write first-touch fields.
- Route Optimizer internal booking tools must not write or lock first-touch fields.
- Store the parent website landing page, not the iframe app URL, when parent context is available.
- Store source and medium as acquisition fields, not as funnel status fields.
- Store campaign only when real campaign data exists.
- Store website conversion time separately from job completion time.
- Keep customer-facing booking, rescue, Telegram, GA4/GTM, and failure behavior unchanged when editing attribution writes.
