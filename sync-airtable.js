#!/usr/bin/env node
/**
 * sync-airtable.js
 * Pulls city pricing from Airtable (Massachusetts + Connecticut tables)
 * and updates the hardcoded cityData array in booking-funnel.html.
 *
 * Requires env var: AIRTABLE_API_TOKEN (personal access token)
 *
 * Usage:  AIRTABLE_API_TOKEN=pat... node sync-airtable.js
 */

const fs = require('fs');
const path = require('path');

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN;
if (!AIRTABLE_TOKEN) {
  console.error('Missing AIRTABLE_API_TOKEN env var');
  process.exit(1);
}

const BASE_ID = 'appUscw3WgCDWkRt9';
const TABLES = [
  { name: 'Massachusetts Pricing', state: 'MA', hasPermitFee: true },
  { name: 'Connecticut Pricing',   state: 'CT', hasPermitFee: false },
];

const HTML_FILE = path.join(__dirname, 'booking-funnel.html');

// Airtable list-records endpoint (max 100 per page, paginate with offset)
async function fetchTable(tableName) {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Airtable ${tableName}: HTTP ${resp.status} — ${body}`);
    }

    const data = await resp.json();
    records.push(...data.records);
    offset = data.offset || null;
  } while (offset);

  return records;
}

function normalizeFieldName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function findField(fields, ...candidates) {
  for (const key of Object.keys(fields)) {
    const norm = normalizeFieldName(key);
    if (candidates.some(c => norm.includes(c))) return fields[key];
  }
  return undefined;
}

function recordToEntry(record, state, hasPermitFee) {
  const f = record.fields;
  const city = findField(f, 'city', 'town', 'name');
  const removalFee = findField(f, 'removal', 'price', 'fee', 'cost');
  const permitFee = hasPermitFee ? findField(f, 'permit') : undefined;

  if (!city || removalFee == null) {
    console.warn(`  Skipping record ${record.id} — missing city or removal fee`, f);
    return null;
  }

  const entry = {
    city: String(city).trim(),
    state,
    removal_fee: Number(removalFee),
  };

  if (hasPermitFee) {
    entry.permit_fee = permitFee != null ? Number(permitFee) : null;
  }

  return entry;
}

function formatEntry(e) {
  const permitPart = 'permit_fee' in e
    ? `,permit_fee:${e.permit_fee === null ? 'null' : e.permit_fee}`
    : '';
  return `  {city:${JSON.stringify(e.city)},state:"${e.state}",removal_fee:${e.removal_fee}${permitPart}}`;
}

function validateEntries(entries) {
  const seen = new Map();
  const errors = [];

  for (const entry of entries) {
    const key = `${entry.state}:${entry.city.trim().toLowerCase()}`;
    if (!['MA', 'CT'].includes(entry.state)) {
      errors.push(`${entry.city}: unsupported state ${entry.state}`);
    }
    if (!Number.isFinite(entry.removal_fee) || entry.removal_fee <= 0) {
      errors.push(`${entry.city}, ${entry.state}: invalid removal_fee ${entry.removal_fee}`);
    }
    if ('permit_fee' in entry && entry.permit_fee !== null && (!Number.isFinite(entry.permit_fee) || entry.permit_fee < 0)) {
      errors.push(`${entry.city}, ${entry.state}: invalid permit_fee ${entry.permit_fee}`);
    }

    const prior = seen.get(key);
    if (prior) {
      const priorPermit = 'permit_fee' in prior ? prior.permit_fee : null;
      const permit = 'permit_fee' in entry ? entry.permit_fee : null;
      if (prior.removal_fee !== entry.removal_fee || priorPermit !== permit) {
        errors.push(`${entry.city}, ${entry.state}: duplicate conflicting pricing`);
      } else {
        errors.push(`${entry.city}, ${entry.state}: duplicate row`);
      }
    }
    seen.set(key, entry);
  }

  if (errors.length) {
    console.error('Airtable pricing validation failed:');
    errors.slice(0, 25).forEach(err => console.error(`  - ${err}`));
    if (errors.length > 25) console.error(`  ...and ${errors.length - 25} more`);
    process.exit(1);
  }
}

async function main() {
  console.log('Fetching city data from Airtable...');

  const allEntries = [];
  for (const table of TABLES) {
    console.log(`  Table: ${table.name}`);
    const records = await fetchTable(table.name);
    console.log(`    ${records.length} records`);

    for (const rec of records) {
      const entry = recordToEntry(rec, table.state, table.hasPermitFee);
      if (entry) allEntries.push(entry);
    }
  }

  console.log(`Total: ${allEntries.length} cities`);
  validateEntries(allEntries);

  // Build the new cityData block
  const lines = allEntries.map(formatEntry);
  const newBlock = 'let cityData = [\n' + lines.join(',\n') + '\n];';

  // Read the HTML and replace
  let html = fs.readFileSync(HTML_FILE, 'utf8');

  const pattern = /let cityData = \[[\s\S]*?\];/;
  if (!pattern.test(html)) {
    console.error('Could not find cityData array in booking-funnel.html');
    process.exit(1);
  }

  html = html.replace(pattern, newBlock);
  fs.writeFileSync(HTML_FILE, html, 'utf8');

  console.log(`Updated booking-funnel.html with ${allEntries.length} cities.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
