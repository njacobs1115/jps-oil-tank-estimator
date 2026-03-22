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
	height: 100vh; /* initial height — grows via postMessage resize */
	border: none;
	display: block;
}

#jps-intro {
	max-width: 640px;
	margin: 40px auto 8px;
	padding: 0 20px;
	font-family: inherit;
}

#jps-intro h1 {
	font-size: 1.6rem;
	font-weight: 700;
	margin: 0 0 10px;
	color: #1a1a1a;
}

#jps-intro p {
	font-size: 1rem;
	color: #444;
	margin: 0;
	line-height: 1.5;
}
</style>

<div id="jps-intro">
	<h1>How Much Does Oil Tank Removal Cost?</h1>
	<p>Get an instant price estimate below. JPS charges a flat rate with no hidden fees — oil disposal included, fully insured. Serving Rhode Island, Massachusetts, and Connecticut.</p>
</div>

<iframe
	id="jps-funnel-frame"
	src="https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html"
	title="Oil Tank Removal Cost Estimator"
></iframe>

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
