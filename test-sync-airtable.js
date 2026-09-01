#!/usr/bin/env node

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  TABLES,
  buildCityDataBlock,
  fetchTable,
  recordToEntry,
  replaceCityData,
  safeJsonString,
  sync,
  validateAndSortEntries,
} = require('./sync-airtable');
const { buildFailureMessage, buildRecoveryMessage, getRunContext, main: notifyMain, sendTelegram } = require('./scripts/notify-sync-telegram');

const ma = TABLES.find(table => table.state === 'MA');
const ct = TABLES.find(table => table.state === 'CT');

function record(table, id, city, removal, permit) {
  const fields = { CityDelta: 999, BaseFee: 1, PermitDestination: 'decoy' };
  fields[table.removalFieldId] = removal;
  fields[table.cityFieldId] = city;
  if (table.permitFieldId && permit !== undefined) fields[table.permitFieldId] = permit;
  return { id, fields };
}

function expectThrow(fn, pattern) { assert.throws(fn, pattern); }

async function run() {
  const workflow = fs.readFileSync(path.join(__dirname, '.github', 'workflows', 'sync-airtable.yml'), 'utf8');
  for (const required of [
    '# Why It Changed',
    '# Check Results',
    '# Known Risks Or Follow-Up Items',
    '# Required Codex Review',
    'customer-facing false confirmations',
    'Step 3 rescue behavior',
    'Step 5 intent preservation before the booking webhook',
    'rescue-path independence from GHL alone',
    'secret/token/webhook/internal-endpoint exposure',
    'regressions in ACK handling',
    'regressions in orphan-sweeper scoping',
  ]) assert.ok(workflow.includes(required), `generated PR review brief missing: ${required}`);

  assert.deepEqual(recordToEntry(record(ma, 'ma1', ' Boston ', 900, 50), ma), { city: 'Boston', state: 'MA', removal_fee: 900, permit_fee: 50 });
  assert.deepEqual(recordToEntry(record(ct, 'ct1', 'Groton', 800), ct), { city: 'Groton', state: 'CT', removal_fee: 800 });
  assert.equal(recordToEntry(record(ma, 'ma2', 'Acton', 700), ma).permit_fee, null);
  assert.equal(recordToEntry(record(ma, 'ma3', 'Acton', 700, ''), ma).permit_fee, null);

  for (const invalid of [undefined, null, '', '   ', 42]) expectThrow(() => recordToEntry(record(ma, 'bad-city', invalid, 700), ma), /city/);
  for (const invalid of [undefined, null, '', '700', 0, -1, NaN, Infinity]) expectThrow(() => recordToEntry(record(ma, 'bad-removal', 'Acton', invalid), ma), /removal fee/);
  for (const invalid of ['0', -1, NaN, Infinity]) expectThrow(() => recordToEntry(record(ma, 'bad-permit', 'Acton', 700, invalid), ma), /permit fee/);
  assert.equal(recordToEntry(record(ma, 'zero-permit', 'Acton', 700, 0), ma).permit_fee, 0);
  expectThrow(() => recordToEntry(record(ma, 'control', 'Bad\nCity', 700), ma), /control/);

  const sorted = validateAndSortEntries([
    { city: 'Worcester', state: 'MA', removal_fee: 900, permit_fee: null },
    { city: 'Boston', state: 'MA', removal_fee: 800, permit_fee: 25 },
    { city: 'Groton', state: 'CT', removal_fee: 700 },
  ]);
  assert.deepEqual(sorted.map(entry => `${entry.state}:${entry.city}`), ['CT:Groton', 'MA:Boston', 'MA:Worcester']);
  expectThrow(() => validateAndSortEntries([]), /No city/);
  expectThrow(() => validateAndSortEntries([
    { city: 'Boston', state: 'MA', removal_fee: 800, permit_fee: null },
    { city: ' boston ', state: 'MA', removal_fee: 900, permit_fee: null },
  ]), /duplicate/);

  const escaped = safeJsonString('A </script> & B\u2028C\u2029');
  assert.equal(escaped.includes('</script>'), false);
  assert.match(escaped, /\\u003c\/script\\u003e/);
  assert.match(escaped, /\\u2028/);
  const block = buildCityDataBlock([{ city: 'A < B', state: 'CT', removal_fee: 700 }]);
  assert.equal(block, buildCityDataBlock([{ city: 'A < B', state: 'CT', removal_fee: 700 }]));

  const original = 'prefix\nlet cityData = [\n  {city:"Old"}\n];\nsuffix';
  const replacement = replaceCityData(original, block);
  assert.ok(replacement.startsWith('prefix\n'));
  assert.ok(replacement.endsWith('\nsuffix'));
  expectThrow(() => replaceCityData('none', block), /found 0/);
  expectThrow(() => replaceCityData(`${original}\n${original}`, block), /found 2/);
  const delimiterCityBlock = buildCityDataBlock([{ city: 'Odd ]; Town', state: 'CT', removal_fee: 700 }]);
  const firstSync = replaceCityData(original, delimiterCityBlock);
  const secondSync = replaceCityData(firstSync, block);
  assert.equal(secondSync, replacement);

  const seenUrls = [];
  let page = 0;
  const records = await fetchTable(ma, {
    token: 'test-token',
    fetchImpl: async url => {
      seenUrls.push(String(url));
      page += 1;
      return { ok: true, json: async () => page === 1 ? { records: [record(ma, 'one', 'Acton', 700)], offset: 'next' } : { records: [record(ma, 'two', 'Boston', 800)] } };
    },
  });
  assert.equal(records.length, 2);
  assert.equal(seenUrls.length, 2);
  for (const urlText of seenUrls) {
    const url = new URL(urlText);
    assert.ok(url.pathname.endsWith(`/${ma.tableId}`));
    assert.equal(url.searchParams.get('returnFieldsByFieldId'), 'true');
    assert.deepEqual(url.searchParams.getAll('fields[]'), [ma.cityFieldId, ma.removalFieldId, ma.permitFieldId]);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jps-airtable-sync-'));
  const htmlFile = path.join(tempDir, 'booking-funnel.html');
  fs.writeFileSync(htmlFile, original, 'utf8');
  let calls = 0;
  const invalidFetch = async () => {
    calls += 1;
    const table = calls === 1 ? ma : ct;
    const result = calls === 1 ? record(table, 'valid', 'Acton', 700) : record(table, 'invalid', 'Groton', 'bad');
    return { ok: true, json: async () => ({ records: [result] }) };
  };
  await assert.rejects(sync({ htmlFile, token: 'test-token', fetchImpl: invalidFetch }), /removal fee/);
  assert.equal(fs.readFileSync(htmlFile, 'utf8'), original);
  fs.rmSync(tempDir, { recursive: true, force: true });

  const failureMessage = buildFailureMessage({ failedAt: '2026-09-01T12:00:00Z', failedStage: 'validation', lastSuccess: null, runUrl: 'https://example.invalid/run' });
  for (const required of ['Sync Airtable City Pricing', 'Failure time (ET)', 'validation', 'Business impact', 'Last known success: unknown', 'Retry status', 'Rollback status', 'Owner: Norman Jacobs', 'Next action']) assert.ok(failureMessage.includes(required), required);
  const recoveryMessage = buildRecoveryMessage({ recoveredAt: '2026-09-02T12:00:00Z', previousFailure: '2026-09-01T12:00:00Z', outcome: 'draft pricing PR created' });
  for (const required of ['Sync Airtable City Pricing', 'Recovery time (ET)', 'draft pricing PR created', 'Business impact', 'Previous failure', 'Retry status', 'Rollback status', 'Owner: Norman Jacobs', 'Review the draft pricing PR']) assert.ok(recoveryMessage.includes(required), required);

  const originalFetch = global.fetch;
  const githubResponses = new Map([
    ['/actions/runs/300/jobs?per_page=100', { jobs: [{ name: 'Sync pricing and prepare draft PR', conclusion: 'failure', steps: [{ name: 'Validate Airtable', conclusion: 'failure' }] }] }],
    ['/actions/workflows/sync-airtable.yml/runs?status=completed&per_page=30', { workflow_runs: [
      { id: 299, conclusion: 'success', updated_at: '2026-09-01T13:00:00Z' },
      { id: 298, conclusion: 'success', updated_at: '2026-08-01T13:00:00Z' },
      { id: 297, conclusion: 'failure', updated_at: '2026-04-01T13:00:00Z' },
    ] }],
    ['/actions/runs/299/jobs?per_page=100', { jobs: [{ name: 'Sync pricing and prepare draft PR', conclusion: 'skipped' }, { name: 'Test Telegram notifications', conclusion: 'success' }] }],
    ['/actions/runs/298/jobs?per_page=100', { jobs: [{ name: 'sync', conclusion: 'failure' }] }],
    ['/actions/runs/297/jobs?per_page=100', { jobs: [{ name: 'sync', conclusion: 'success' }] }],
  ]);
  global.fetch = async url => {
    const pathname = new URL(url).pathname.replace('/repos/owner/repo', '');
    const key = `${pathname}${new URL(url).search}`;
    const data = githubResponses.get(key);
    assert.ok(data, `unexpected GitHub request ${key}`);
    return { ok: true, json: async () => data };
  };
  const context = await getRunContext('token', 'owner/repo', '300');
  assert.equal(context.failedStage, 'Validate Airtable');
  assert.equal(context.previousReal.id, 298);
  assert.equal(context.previousReal.sync_conclusion, 'failure');
  assert.equal(context.lastSuccess.id, 297);
  assert.equal(context.lastSuccess.sync_conclusion, 'success');

  let telegramBody;
  global.fetch = async (url, options) => {
    assert.ok(String(url).startsWith('https://api.telegram.org/bot'));
    telegramBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await sendTelegram('safe message', 'test-token', 'test-chat');
  assert.deepEqual(telegramBody, { chat_id: 'test-chat', text: 'safe message' });
  assert.equal(Object.hasOwn(telegramBody, 'parse_mode'), false);

  let fallbackMessage;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('https://api.github.com/')) return { ok: false, status: 503, json: async () => ({}) };
    fallbackMessage = JSON.parse(options.body).text;
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await notifyMain({
    GITHUB_TOKEN: 'github-token', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '300', SYNC_RESULT: 'failure',
    TELEGRAM_BOT_TOKEN: 'telegram-token', TELEGRAM_CHAT_ID: 'chat-id',
  });
  assert.match(fallbackMessage, /detailed GitHub run context is unavailable/);
  assert.match(fallbackMessage, /github.com\/owner\/repo\/actions\/runs\/300/);

  fallbackMessage = null;
  await assert.rejects(notifyMain({
    GITHUB_TOKEN: 'github-token', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '300', SYNC_RESULT: 'success',
    TELEGRAM_BOT_TOKEN: 'telegram-token', TELEGRAM_CHAT_ID: 'chat-id',
  }), /Recovery-state lookup failed/);
  assert.match(fallbackMessage, /post-sync recovery-state lookup failed/);

  const recoveryResponses = new Map([
    ['/actions/runs/400/jobs?per_page=100', { jobs: [{ name: 'Sync pricing and prepare draft PR', conclusion: 'success', steps: [] }] }],
    ['/actions/workflows/sync-airtable.yml/runs?status=completed&per_page=30', { workflow_runs: [{ id: 399, conclusion: 'failure', updated_at: '2026-09-01T14:00:00Z' }] }],
    ['/actions/runs/399/jobs?per_page=100', { jobs: [{ name: 'Sync pricing and prepare draft PR', conclusion: 'success' }] }],
  ]);
  let recoveredMessage;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('https://api.telegram.org/')) {
      recoveredMessage = JSON.parse(options.body).text;
      return { ok: true, json: async () => ({ ok: true }) };
    }
    const parsed = new URL(url);
    const key = `${parsed.pathname.replace('/repos/owner/repo', '')}${parsed.search}`;
    const data = recoveryResponses.get(key);
    assert.ok(data, `unexpected recovery request ${key}`);
    return { ok: true, json: async () => data };
  };
  await notifyMain({
    GITHUB_TOKEN: 'github-token', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '400', SYNC_RESULT: 'success', SYNC_OUTCOME: 'no pricing changes',
    TELEGRAM_BOT_TOKEN: 'telegram-token', TELEGRAM_CHAT_ID: 'chat-id',
  });
  assert.match(recoveredMessage, /JPS AUTOMATION RECOVERED/);
  assert.match(recoveredMessage, /no pricing changes/);
  global.fetch = originalFetch;

  console.log('test-sync-airtable.js: all tests passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
