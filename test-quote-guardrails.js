const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('booking-funnel.html', 'utf8');

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

if (process.exitCode) process.exit(process.exitCode);
