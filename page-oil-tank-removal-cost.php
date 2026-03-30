<?php
/**
 * Page template for /oil-tank-removal-cost
 *
 * Renders the JPS booking funnel without Themify builder chrome.
 * WordPress applies this automatically to any page whose slug is
 * "oil-tank-removal-cost" (page-{slug}.php template hierarchy).
 *
 * How tracking works:
 *   - get_header() loads the site's GTM container (GTM-T39Z96C) as normal.
 *   - The funnel runs inside an iframe from njacobs1115.github.io.
 *   - The funnel sends GTM events via window.parent.postMessage().
 *   - The listener below catches those events and pushes them to this
 *     page's dataLayer, where GTM picks them up exactly as if the funnel
 *     were embedded directly on this page.
 *
 * To revert: delete this file. WordPress falls back to Themify instantly.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<style>
/* Hide all Themify / theme chrome — this page is funnel-only */
#header,
.header-wrap,
#footer,
.footer-wrap,
#colophon,
#sidebar,
.sidebar-wrap,
.breadcrumb,
.page-title-wrap,
.builder-banner-wrap,
.site-header,
.site-footer,
.nav-container {
	display: none !important;
}

html,
body {
	margin: 0 !important;
	padding: 0 !important;
	overflow-y: auto !important;
	height: auto !important;
}

#pagewrap,
#body-wrap,
#page,
#content,
.site-content,
.content-wrap,
.container {
	padding: 0 !important;
	margin: 0 !important;
	max-width: none !important;
}

#jps-funnel-frame {
	width: 100%;
	height: 560px; /* initial height — overwritten by postMessage resize on load */
	border: none;
	display: block;
}

/* ── Below-fold content ── */
:root{--jps-navy:#1a1f2e;--jps-orange:#e8722a;--jps-orange-dark:#d4621e;--jps-brand:#16a34a;--jps-text:#111827;--jps-text-mid:#374151;--jps-muted:#6b7280;--jps-border:#e5e7eb;--jps-bg:#ffffff;--jps-warm-bg:#f5f4f0;--jps-radius:16px;--jps-radius-sm:10px;--jps-shadow-sm:0 1px 2px rgba(0,0,0,.06);}
.jps-divider{border:none;border-top:1px solid var(--jps-border);margin:0;}
#jps-seo-content{background:var(--jps-warm-bg);padding:60px 20px 0;font-family:"Open Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
.jps-section{max-width:680px;margin:0 auto 60px;}
.jps-section-title{font-size:26px;font-weight:800;color:var(--jps-navy);margin-bottom:14px;line-height:1.2;}
.jps-section-lead{font-size:15px;line-height:1.7;color:var(--jps-text-mid);margin-bottom:24px;}
.jps-cost-card{background:linear-gradient(135deg,#1e2740 0%,#111827 100%);color:#fff;border-radius:var(--jps-radius);padding:28px 28px 28px 32px;margin-bottom:16px;display:flex;align-items:center;gap:28px;}
.jps-cost-left{flex-shrink:0;}
.jps-cost-eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--jps-brand);margin-bottom:6px;}
.jps-cost-price{font-size:56px;font-weight:800;color:#fff;line-height:1;}
.jps-cost-right{border-left:1px solid rgba(255,255,255,.12);padding-left:28px;}
.jps-cost-desc{font-size:15px;color:rgba(255,255,255,.75);line-height:1.6;}
.jps-cost-note{margin-top:10px;font-size:12px;color:rgba(255,255,255,.4);}
.jps-includes-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.jps-include-item{background:var(--jps-bg);border:1px solid var(--jps-border);border-radius:var(--jps-radius-sm);padding:13px 16px;display:flex;align-items:center;gap:12px;font-size:14px;font-weight:600;color:var(--jps-text);box-shadow:var(--jps-shadow-sm);}
.jps-check{width:22px;height:22px;min-width:22px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--jps-brand);font-weight:800;}
.jps-faq-list{display:flex;flex-direction:column;gap:6px;}
.jps-faq-item{background:var(--jps-bg);border:1px solid var(--jps-border);border-radius:var(--jps-radius-sm);overflow:hidden;box-shadow:var(--jps-shadow-sm);}
.jps-faq-item summary{padding:18px 20px;font-size:15px;font-weight:700;color:var(--jps-navy);cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;list-style:none;user-select:none;-webkit-user-select:none;}
.jps-faq-item summary::-webkit-details-marker{display:none;}
.jps-faq-toggle{width:26px;height:26px;min-width:26px;background:var(--jps-warm-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--jps-muted);font-weight:400;}
.jps-faq-answer{padding:16px 20px 18px;font-size:15px;line-height:1.7;color:var(--jps-text-mid);border-top:1px solid var(--jps-border);}
.jps-area-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.jps-area-card{background:var(--jps-bg);border:1px solid var(--jps-border);border-radius:var(--jps-radius-sm);padding:18px 16px;box-shadow:var(--jps-shadow-sm);}
.jps-area-state-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--jps-orange);margin-bottom:14px;}
.jps-area-cities{list-style:none;display:flex;flex-direction:column;gap:7px;padding:0;margin:0;}
.jps-area-cities li{font-size:13px;color:var(--jps-text-mid);display:flex;align-items:center;gap:8px;line-height:1.3;}
.jps-area-cities li::before{content:'';width:5px;height:5px;min-width:5px;border-radius:50%;background:var(--jps-brand);}
.jps-area-cities .jps-more{font-size:12px;color:var(--jps-muted);font-style:italic;}
.jps-cta-band{background:linear-gradient(135deg,#1e2740 0%,#111827 100%);border-radius:var(--jps-radius);padding:36px 32px;text-align:center;max-width:680px;margin:0 auto 60px;}
.jps-cta-band h2{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;line-height:1.2;}
.jps-cta-band p{font-size:14px;color:rgba(255,255,255,.55);margin-bottom:22px;}
.jps-cta-btn{display:inline-block;background:var(--jps-orange);color:#fff;border:none;border-radius:10px;padding:15px 36px;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 6px 20px rgba(232,114,42,.4);}
#jps-page-footer{background:var(--jps-navy);color:rgba(255,255,255,.45);text-align:center;font-size:13px;padding:22px 20px;line-height:1.6;}
#jps-page-footer a{color:rgba(255,255,255,.55);text-decoration:none;}
.jps-footer-sep{margin:0 10px;opacity:.3;}
@media(max-width:540px){.jps-cost-card{flex-direction:column;align-items:flex-start;gap:16px;padding:24px;}.jps-cost-right{border-left:none;border-top:1px solid rgba(255,255,255,.12);padding-left:0;padding-top:16px;}.jps-cost-price{font-size:44px;}.jps-section-title{font-size:22px;}}
@media(max-width:700px){.jps-area-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:480px){.jps-includes-grid{grid-template-columns:1fr;}.jps-area-grid{grid-template-columns:1fr;}}

</style>

<iframe
	id="jps-funnel-frame"
	src="https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html"
	title="Oil Tank Removal Cost Estimator"
	scrolling="no"
></iframe>

<div style="background:var(--jps-warm-bg);padding:32px 20px 0;text-align:center;">
	<p style="margin:0 auto;max-width:680px;font-size:15px;color:var(--jps-text-mid);font-family:'Open Sans',sans-serif;">Not ready to book yet? Here's everything you need to know.</p>
</div>

<div id="jps-seo-content">

	<div class="jps-section">
		<h2 class="jps-section-title">How Much Does Oil Tank Removal Cost in Rhode Island, Massachusetts &amp; Connecticut?</h2>
		<p class="jps-section-lead">One flat rate covers everything — removal, disposal, and full cleanup. No add-ons. No surprises. You know the exact price before we show up.</p>
		<div class="jps-cost-card">
			<div class="jps-cost-left">
				<div class="jps-cost-eyebrow">Flat Rate</div>
				<div class="jps-cost-price">$600</div>
			</div>
			<div class="jps-cost-right">
				<div class="jps-cost-desc">Above-ground residential oil tank removal anywhere in Rhode Island, Massachusetts, or Connecticut. Every job. Every time.</div>
				<div class="jps-cost-note">Price includes all labor, certified disposal, remaining oil removal &amp; full site cleanup.</div>
			</div>
		</div>
		<div class="jps-includes-grid">
			<div class="jps-include-item"><span class="jps-check">&#10003;</span>Tank removal &amp; disposal</div>
			<div class="jps-include-item"><span class="jps-check">&#10003;</span>Remaining oil &amp; sludge removed</div>
			<div class="jps-include-item"><span class="jps-check">&#10003;</span>Fill pipes removed</div>
			<div class="jps-include-item"><span class="jps-check">&#10003;</span>Foundation holes sealed</div>
		</div>
	</div>

	<div class="jps-section">
		<h2 class="jps-section-title">Common Questions</h2>
		<div class="jps-faq-list">

			<details class="jps-faq-item">
				<summary>How much does oil tank removal cost in Rhode Island?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Most above-ground residential oil tank removals in Rhode Island start at $600. No permit required in Rhode Island. Use the calculator above for your exact price.</div>
			</details>

			<details class="jps-faq-item">
				<summary>How much does oil tank removal cost in Massachusetts?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Most above-ground residential oil tank removals in Massachusetts start at $600. We serve eastern and central MA — Boston, Worcester, New Bedford, Fall River, Plymouth, and surrounding communities. Massachusetts requires a permit for this work — we handle the entire filing process. Use the calculator above for your exact price.</div>
			</details>

			<details class="jps-faq-item">
				<summary>How much does oil tank removal cost in Connecticut?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Most above-ground residential oil tank removals in Connecticut start at $600. No permit required in Connecticut. We serve northeastern CT communities near the Rhode Island border. Use the calculator above for your exact price.</div>
			</details>

			<details class="jps-faq-item">
				<summary>What's included in the price?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Complete removal and disposal of your oil tank, including all remaining oil and sludge. Fill pipes are removed from the foundation and the holes are sealed. That's what every job includes.</div>
			</details>

			<details class="jps-faq-item">
				<summary>How long does the job take?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Most jobs are done in 90 minutes or less from the time we arrive. The area is left broom swept when we're finished.</div>
			</details>

			<details class="jps-faq-item">
				<summary>Do I need a permit for oil tank removal in Massachusetts, Rhode Island, or Connecticut?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">Massachusetts requires a permit for above-ground residential oil tank removal — we handle the entire process, and it's included in your $600 price. Rhode Island and Connecticut do not require a permit.</div>
			</details>

			<details class="jps-faq-item">
				<summary>Do you remove underground or buried tanks?<span class="jps-faq-toggle">+</span></summary>
				<div class="jps-faq-answer">No. We specialize exclusively in above-ground residential oil tank removal. Underground tanks require excavation, environmental testing, and different licensing — that's a separate service entirely. If you have a buried tank, you'll need a UST (underground storage tank) specialist.</div>
			</details>

		</div>
	</div>

	<div class="jps-section">
		<h2 class="jps-section-title">Where We Work</h2>
		<p class="jps-section-lead">We cover all of Rhode Island, eastern and central Massachusetts, and northeastern Connecticut.</p>
		<div class="jps-area-grid">
			<div class="jps-area-card">
				<div class="jps-area-state-label">Rhode Island</div>
				<ul class="jps-area-cities">
					<li>Providence</li><li>Warwick</li><li>Cranston</li><li>Pawtucket</li>
					<li>East Providence</li><li>Woonsocket</li><li>Johnston</li>
					<li>North Providence</li><li>Lincoln</li>
					<li class="jps-more">+ all RI communities</li>
				</ul>
			</div>
			<div class="jps-area-card">
				<div class="jps-area-state-label">Massachusetts</div>
				<ul class="jps-area-cities">
					<li>Boston</li><li>Worcester</li><li>Brockton</li><li>New Bedford</li>
					<li>Fall River</li><li>Quincy</li><li>Plymouth</li><li>Taunton</li>
					<li>Attleboro</li>
					<li class="jps-more">+ eastern &amp; central MA</li>
				</ul>
			</div>
			<div class="jps-area-card">
				<div class="jps-area-state-label">Connecticut</div>
				<ul class="jps-area-cities">
					<li>Putnam</li><li>Thompson</li><li>Killingly</li>
					<li>Plainfield</li><li>Northeastern CT</li>
				</ul>
			</div>
		</div>
	</div>

</div>

<div class="jps-cta-band">
	<h2>Ready to Get Your Exact Price?</h2>
	<p>Takes 30 seconds. No contact info required to see your price.</p>
	<button class="jps-cta-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})">Get My Exact Price &rarr;</button>
</div>

<footer id="jps-page-footer">
	<a href="https://www.removemyoiltank.com">RemoveMyOilTank.com</a><span class="jps-footer-sep">|</span>Jacobs Property Solutions<span class="jps-footer-sep">|</span><a href="tel:+14013893200">(401) 389-3200</a><span class="jps-footer-sep">|</span>Serving RI, MA &amp; CT
	<br><span style="font-size:12px;opacity:.6;margin-top:6px;display:block;">&copy; <?php echo date('Y'); ?> Jacobs Property Solutions &mdash; Licensed &amp; Insured</span>
</footer>

<script>
/**
 * Bridge: relay GTM events from the cross-origin funnel iframe to this
 * page's dataLayer so GTM (GTM-T39Z96C) can fire GA4 and Google Ads tags.
 *
 * Security: only accepts messages originating from njacobs1115.github.io.
 * The funnel sends { type: 'funnel_dataLayer_event', payload: { event: '...' } }.
 */
( function () {
	'use strict';
	window.addEventListener( 'message', function ( e ) {
		if ( e.origin !== 'https://njacobs1115.github.io' ) { return; }
		if ( ! e.data ) { return; }

		// GTM event bridge
		if ( e.data.type === 'funnel_dataLayer_event' ) {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push( e.data.payload );
		}

		// Auto-resize iframe to fit funnel content
		if ( e.data.type === 'funnel_resize' ) {
			var frame = document.getElementById( 'jps-funnel-frame' );
			if ( frame && e.data.height ) {
				frame.style.height = e.data.height + 'px';
			}
		}
	} );
}() );
</script>

<?php get_footer(); ?>
