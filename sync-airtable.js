#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_ID = 'appUscw3WgCDWkRt9';
const TABLES = [
  { tableId: 'tblJFQSsGfEuLmZc5', state: 'MA', cityFieldId: 'fldklfOcr9OvmsYs4', removalFieldId: 'fldH4bVc8wHWZbCEx', permitFieldId: 'fldT5bsqPegN0f8kU' },
  { tableId: 'tblXgn86E0R7hAZqz', state: 'CT', cityFieldId: 'fldXY0M6pwfZHGJxU', removalFieldId: 'fldcyu3jwx8bOIe8k' },
];
const HTML_FILE = path.join(__dirname, 'booking-funnel.html');
const CITY_DATA_PATTERN = /^let cityData = \[\r?\n[\s\S]*?^\];$/gm;

async function fetchTable(table, options = {}) {
  const credential = options.token || process.env.AIRTABLE_API_TOKEN;
  const fetchImpl = options.fetchImpl || fetch;
  if (!credential) throw new Error('Missing AIRTABLE_API_TOKEN env var');
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${table.tableId}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    for (const fieldId of [table.cityFieldId, table.removalFieldId, table.permitFieldId].filter(Boolean)) url.searchParams.append('fields[]', fieldId);
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${credential}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Airtable ${table.state} request failed with HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.records) || (data.offset != null && typeof data.offset !== 'string')) throw new Error(`Airtable ${table.state} returned an unexpected response shape`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  if (records.length === 0) throw new Error(`Airtable ${table.state} returned zero records`);
  return records;
}

function validateCity(value, recordId, state) {
  if (typeof value !== 'string') throw new Error(`${state} record ${recordId}: city must be text`);
  const city = value.trim();
  if (!city) throw new Error(`${state} record ${recordId}: city is blank`);
  if (city.length > 100) throw new Error(`${state} record ${recordId}: city is too long`);
  if (/[\u0000-\u001f\u007f]/.test(city)) throw new Error(`${state} record ${recordId}: city contains control characters`);
  return city;
}

function validateNumber(value, label, recordId, state, allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new Error(`${state} record ${recordId}: ${label} is invalid`);
  return value;
}

function recordToEntry(record, table) {
  if (!record || typeof record.id !== 'string' || !record.fields || typeof record.fields !== 'object' || Array.isArray(record.fields)) throw new Error(`Airtable ${table.state} returned an invalid record`);
  const entry = {
    city: validateCity(record.fields[table.cityFieldId], record.id, table.state),
    state: table.state,
    removal_fee: validateNumber(record.fields[table.removalFieldId], 'removal fee', record.id, table.state),
  };
  if (table.permitFieldId) {
    const permit = record.fields[table.permitFieldId];
    entry.permit_fee = permit == null || permit === '' ? null : validateNumber(permit, 'permit fee', record.id, table.state, true);
  }
  return entry;
}

function compareCodePoints(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

function validateAndSortEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('No city pricing entries were produced');
  const seen = new Set();
  for (const entry of entries) {
    if (!TABLES.some(table => table.state === entry.state)) throw new Error(`${entry.city}: unsupported state ${entry.state}`);
    const key = `${entry.state}:${entry.city.trim().toLowerCase()}`;
    if (seen.has(key)) throw new Error(`${entry.city}, ${entry.state}: duplicate city row`);
    seen.add(key);
  }
  return [...entries].sort((a, b) => compareCodePoints(a.state, b.state) || compareCodePoints(a.city.toLowerCase(), b.city.toLowerCase()));
}

function safeJsonString(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function formatEntry(entry) {
  const permitPart = Object.hasOwn(entry, 'permit_fee') ? `,permit_fee:${entry.permit_fee === null ? 'null' : entry.permit_fee}` : '';
  return `  {city:${safeJsonString(entry.city)},state:"${entry.state}",removal_fee:${entry.removal_fee}${permitPart}}`;
}

function buildCityDataBlock(entries) { return `let cityData = [\n${entries.map(formatEntry).join(',\n')}\n];`; }

function replaceCityData(html, newBlock) {
  const matches = [...html.matchAll(CITY_DATA_PATTERN)];
  if (matches.length !== 1) throw new Error(`Expected exactly one cityData block; found ${matches.length}`);
  const match = matches[0];
  return html.slice(0, match.index) + newBlock + html.slice(match.index + match[0].length);
}

async function collectEntries(options = {}) {
  const entries = [];
  for (const table of TABLES) {
    const records = await fetchTable(table, options);
    for (const record of records) entries.push(recordToEntry(record, table));
  }
  return validateAndSortEntries(entries);
}

async function sync(options = {}) {
  const htmlFile = options.htmlFile || HTML_FILE;
  const entries = await collectEntries(options);
  const original = fs.readFileSync(htmlFile, 'utf8');
  const updated = replaceCityData(original, buildCityDataBlock(entries));
  if (updated !== original) fs.writeFileSync(htmlFile, updated, 'utf8');
  return { changed: updated !== original, count: entries.length };
}

async function main() {
  const result = await sync();
  console.log(result.changed ? `Prepared booking-funnel.html with ${result.count} validated cities.` : `Validated ${result.count} cities; booking-funnel.html is unchanged.`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

module.exports = { TABLES, buildCityDataBlock, collectEntries, fetchTable, formatEntry, recordToEntry, replaceCityData, safeJsonString, sync, validateAndSortEntries };
