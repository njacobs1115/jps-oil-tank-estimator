const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('booking-funnel.html', 'utf8');
const wpTemplate = fs.readFileSync('page-oil-tank-removal-cost.php', 'utf8');

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${name}`);
  }
}

const match = html.match(/let cityData = \[([\s\S]*?)\];/);
assert('cityData block exists', Boolean(match));

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`cityData = [${match[1]}];`, sandbox);
const cityData = sandbox.cityData;

assert('cityData has entries', Array.isArray(cityData) && cityData.length > 0);
assert('no NaN removal fees', cityData.every(row => Number.isFinite(row.removal_fee)));
assert('no NaN permit fees', cityData.every(row => row.permit_fee === undefined || row.permit_fee === null || Number.isFinite(row.permit_fee)));

const seen = new Set();
const duplicates = [];
for (const row of cityData) {
  const key = `${row.state}:${String(row.city).trim().toLowerCase()}`;
  if (seen.has(key)) duplicates.push(key);
  seen.add(key);
}
assert('no duplicate city/state rows', duplicates.length === 0);

const malden = cityData.find(row => row.state === 'MA' && row.city === 'Malden');
assert('Malden MA is present', Boolean(malden));
assert('Malden MA removal fee is 800', malden && malden.removal_fee === 800);

assert('unknown city fallback does not assign MA/CT default prices', !html.includes("answers.cityRemovalFee = answers.state === 'CT' ? 700 : 600"));
assert('manual quote endpoint is wired', html.includes("/api/public/manual-quote"));
assert('unknown-city quote state is wired', html.includes("unknown_city_manual_quote"));
assert('date lookup receives quote state', html.includes("...quoteStatePayload()"));
assert('lead capture timeout remains wired', html.includes("LEAD_CAPTURE_TIMEOUT_MS") && html.includes("signal: controller.signal"));
assert('GHL tank location normalization is wired', html.includes("tankLocation:   ghlTankLocation()"));
assert('GHL exit type normalization is wired', html.includes("exitType:       ghlExitType()"));
assert('GHL pricing oil normalization is wired', html.includes("oil_level_pricing:    ghlPricingOilLevel()"));
assert('GHL remaining oil value is sent', html.includes("remaining_oil:"));
assert('GHL remaining oil gauge value is sent', html.includes("ghlOilLevel:    booking.oilGauge || undefined"));
assert('GHL accessibility only sends live Tight Access option', html.includes("return 'Tight Access'") && !html.includes("return 'Yes';"));
assert('accessible tanks do not send an empty tank access value', !html.includes("tankAccess:     ghlTankAccess()     || ''"));
assert('unsure access sends uppercase job details', html.includes("return 'POTENTIAL ACCESS ISSUES'"));
assert('direct public API payloads carry job details', html.includes("jobDetails:     ghlJobDetails()"));
assert('lead/estimate proxy payloads carry job details', html.includes("job_details:          ghlJobDetails()"));
assert('attribution capture includes Google Ads enhanced params', html.includes("'gbraid'") && html.includes("'wbraid'") && html.includes("'gad_source'") && html.includes("'gad_campaignid'"));
assert('attribution capture preserves first touch values', html.includes("if (!attr[key]) attr[key] = value"));
assert('attribution capture does not persist raw URLs', html.includes("ATTRIBUTION_URL_PARAM_KEYS.indexOf(key)") && html.includes("cleanAttributionUrl"));
assert('funnel telemetry keeps existing non-PII attribution subset', html.includes("function safeTelemetryAttribution()") && html.includes("attribution: safeTelemetryAttribution()"));
assert('lead webhook payload carries attribution object', html.includes("const payload = addAttributionFields({") && html.includes("funnelRequestId: getFunnelRequestId()"));
assert('fallback lead payload carries attribution object', html.includes("ROUTE_OPTIMIZER_URL + '/api/public/capture-lead'") && html.includes("body: JSON.stringify(addAttributionFields({"));
assert('manual quote payload carries attribution object', html.includes("ROUTE_OPTIMIZER_URL + '/api/public/manual-quote'") && html.includes("body: JSON.stringify(addAttributionFields({"));
assert('booking payload carries signed contact token', html.includes("contactToken:   booking.ghlContactToken || undefined"));
assert('booking payload carries attribution object', html.includes("ROUTE_OPTIMIZER_URL + '/api/public/book'") && html.includes("body: JSON.stringify(addAttributionFields({"));
assert('WordPress iframe src carries allowlisted attribution params', wpTemplate.includes('$jps_attribution_keys') && wpTemplate.includes('add_query_arg( $jps_attribution_args, $jps_funnel_base )'));
assert('WordPress iframe src includes parent landing page', wpTemplate.includes("$jps_attribution_args['landing_page']"));

if (process.exitCode) process.exit(process.exitCode);
