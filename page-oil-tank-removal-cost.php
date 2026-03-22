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
	min-height: 100vh;
	border: none;
	display: block;
}
</style>

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
		if ( ! e.data || e.data.type !== 'funnel_dataLayer_event' ) { return; }
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push( e.data.payload );
	} );
}() );
</script>

<?php get_footer(); ?>
