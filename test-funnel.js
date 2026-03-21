/**
 * JPS Booking Funnel — Automated Test Suite
 *
 * Drives Playwright through every major path in the funnel,
 * screenshots each result screen, sends to Claude for visual verification,
 * and outputs an HTML report.
 *
 * Run: node test-funnel.js
 * Requires: ANTHROPIC_API_KEY in environment
 */

const { chromium } = require('@playwright/test');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const STAGING_URL = 'https://njacobs1115.github.io/jps-oil-tank-estimator/booking-funnel.html';
const REPORT_DIR = path.join(__dirname, 'test-report');
const REPORT_FILE = path.join(REPORT_DIR, 'index.html');

// ── Test matrix ──────────────────────────────────────────────────────────────
// Each entry describes one path through the funnel and what we expect to see.
const TEST_PATHS = [
  // RESTRICTED ACCESS — should always route to "Photos Needed To Quote" screen
  {
    id: 'restricted-basement',
    label: 'Basement + Restricted Access → Photos Needed screen',
    steps: { location: 'basement', exit: 'walkout', access: 'restricted', oil: 'quarter', state: 'RI' },
    expectedScreen: 'restricted',
    expectedContent: 'Photos Needed To Quote',
  },
  {
    id: 'restricted-garage',
    label: 'Garage + Restricted Access → Photos Needed screen',
    steps: { location: 'garage', access: 'restricted', oil: 'quarter', state: 'RI' },
    expectedScreen: 'restricted',
    expectedContent: 'Photos Needed To Quote',
  },
  {
    id: 'restricted-outside',
    label: 'Outside + Restricted Access → Photos Needed screen',
    steps: { location: 'outside', access: 'restricted', oil: 'quarter', state: 'RI' },
    expectedScreen: 'restricted',
    expectedContent: 'Photos Needed To Quote',
  },

  // RHODE ISLAND — no permit, flat base price
  {
    id: 'ri-basement-walkout-open-quarter',
    label: 'RI — Basement / Walkout / Open / Quarter tank',
    steps: { location: 'basement', exit: 'walkout', access: 'open', oil: 'quarter', state: 'RI' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ri-basement-stairs-open-halfplus',
    label: 'RI — Basement / Stairs / Open / Half+ tank ($150 oil surcharge)',
    steps: { location: 'basement', exit: 'stairs', access: 'open', oil: 'half_plus', state: 'RI' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ri-garage-unsure-nogauge',
    label: 'RI — Garage / Unsure Access / No Gauge',
    steps: { location: 'garage', access: 'unsure', oil: 'no_gauge', state: 'RI' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ri-outside-open-quarter',
    label: 'RI — Outside / Open / Quarter tank',
    steps: { location: 'outside', access: 'open', oil: 'quarter', state: 'RI' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },

  // MASSACHUSETTS — permit fee varies by city
  {
    id: 'ma-basement-bulkhead-open-quarter-worcester',
    label: 'MA — Basement / Bulkhead / Open / Quarter / Worcester',
    steps: { location: 'basement', exit: 'bulkhead', access: 'open', oil: 'quarter', state: 'MA', city: 'Worcester' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ma-garage-open-halfplus-boston',
    label: 'MA — Garage / Open / Half+ / Boston ($150 oil surcharge)',
    steps: { location: 'garage', access: 'open', oil: 'half_plus', state: 'MA', city: 'Boston' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ma-outside-unsure-nogauge-providence',
    label: 'MA — Outside / Unsure / No Gauge / Brockton',
    steps: { location: 'outside', access: 'unsure', oil: 'no_gauge', state: 'MA', city: 'Brockton' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },

  // CONNECTICUT — no permit
  {
    id: 'ct-outside-open-quarter',
    label: 'CT — Outside / Open / Quarter tank / Stamford',
    steps: { location: 'outside', access: 'open', oil: 'quarter', state: 'CT', city: 'Stamford' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
  {
    id: 'ct-basement-walkout-unsure-nogauge',
    label: 'CT — Basement / Walkout / Unsure / No Gauge / Hartford',
    steps: { location: 'basement', exit: 'walkout', access: 'unsure', oil: 'no_gauge', state: 'CT', city: 'Hartford' },
    expectedScreen: 'results',
    expectedContent: 'Book My Removal',
  },
];

// ── Funnel navigation helpers ─────────────────────────────────────────────────

async function clickCard(page, selector) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 8000 });
  await page.click(selector);
}

async function clickNext(page, btnId) {
  // Wait for button to be enabled, then click
  await page.waitForFunction(
    id => !document.getElementById(id)?.disabled,
    btnId,
    { timeout: 8000 }
  );
  await page.click(`#${btnId}`);
}

async function runPath(page, steps) {
  await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

  // Click the start button on the intro screen
  await page.click('.btn-intro-start');
  await page.waitForSelector('#screen-1.active', { timeout: 8000 });

  // ── Step 1: Location ──────────────────────────────────────────────────────
  await clickCard(page, `button.card[data-value="${steps.location}"]`);

  if (steps.location === 'basement') {
    // Step 1b: Exit type
    await clickNext(page, 'next-1');
    await page.waitForSelector('#screen-1b.active', { timeout: 5000 });
    await clickCard(page, `button.card[data-value="${steps.exit}"]`);
    await clickNext(page, 'next-1b');
  } else {
    await clickNext(page, 'next-1');
  }

  // ── Step 2: Access ────────────────────────────────────────────────────────
  await page.waitForSelector('#screen-2.active', { timeout: 5000 });
  await clickCard(page, `button.card[data-value="${steps.access}"]`);

  await clickNext(page, 'next-2');

  // ── Step 3: Oil level ─────────────────────────────────────────────────────
  await page.waitForSelector('#screen-3.active', { timeout: 5000 });
  await clickCard(page, `button.oil-option-card[data-value="${steps.oil}"]`);
  await clickNext(page, 'next-3');

  // ── Step 4: State + city ──────────────────────────────────────────────────
  // Note: restricted paths still go through steps 3 & 4 — the restricted
  // screen only appears when showResults() fires (after next-4 is clicked).
  await page.waitForSelector('#screen-4.active', { timeout: 5000 });
  await clickCard(page, `button.state-btn[data-value="${steps.state}"]`);

  if (steps.state === 'MA' || steps.state === 'CT') {
    // Both MA and CT require a city for accurate pricing
    await page.waitForSelector('#city-input', { state: 'visible', timeout: 5000 });
    await page.fill('#city-input', steps.city);
    await page.waitForSelector('.autocomplete-list.open .autocomplete-item', { timeout: 8000 });
    await page.click('.autocomplete-list.open .autocomplete-item:first-child');
  }

  await clickNext(page, 'next-4');

  // ── Results — either the price screen or the restricted screen ─────────────
  await page.waitForFunction(() => {
    const results = document.getElementById('screen-results');
    const restricted = document.getElementById('screen-restricted');
    return results?.classList.contains('active') || restricted?.classList.contains('active');
  }, { timeout: 8000 });
}

// ── Claude vision analysis ────────────────────────────────────────────────────

async function analyzeScreenshot(client, screenshotPath, testPath) {
  const imageData = fs.readFileSync(screenshotPath).toString('base64');

  const prompt = `You are QA-testing a booking funnel for an oil tank removal company.

This screenshot shows the result screen after a user completed the following path:
- Location: ${testPath.steps.location}${testPath.steps.exit ? ' / Exit: ' + testPath.steps.exit : ''}
- Access: ${testPath.steps.access}
- Oil level: ${testPath.steps.oil || 'N/A (restricted path)'}
- State: ${testPath.steps.state || 'N/A (restricted path)'}${testPath.steps.city ? ' / City: ' + testPath.steps.city : ''}

Expected screen: ${testPath.expectedScreen === 'restricted' ? '"Photos Needed To Quote" (restricted access screen)' : 'Price results screen with a dollar amount and "Book My Removal" button'}

Please check:
1. Is the correct screen showing (restricted vs results)?
2. Is there a price displayed? Does it look reasonable (roughly $600–$1,200)?
3. Is there a clear call-to-action button visible?
4. Does anything look broken, missing, or visually wrong?
5. If it's a RI or CT path, verify there's no permit fee line (or it shows $0).
6. If oil level was "half_plus", verify there's an oil surcharge (~$150) in the price breakdown.

Respond in this format:
PASS or FAIL
---
[2-3 sentence summary of what you see. If FAIL, describe exactly what's wrong.]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: imageData },
      }, {
        type: 'text',
        text: prompt,
      }],
    }],
  });

  const text = response.content[0].text;
  const passed = text.trim().startsWith('PASS');
  const summary = text.split('---')[1]?.trim() || text;
  return { passed, summary };
}

// ── HTML report builder ───────────────────────────────────────────────────────

function buildReport(results) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  const rows = results.map(r => {
    const statusColor = r.passed ? '#16a34a' : '#dc2626';
    const statusLabel = r.passed ? '✅ PASS' : '❌ FAIL';
    const screenshotSrc = r.screenshotFile
      ? `<a href="${r.screenshotFile}" target="_blank"><img src="${r.screenshotFile}" style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb;margin-top:10px;" /></a>`
      : '<em style="color:#6b7280;">No screenshot</em>';

    return `
    <div style="background:#fff;border-radius:12px;padding:20px;border:1.5px solid ${r.passed ? '#d1fae5' : '#fee2e2'};margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-weight:700;font-size:15px;color:#111827;margin-bottom:4px;">${r.label}</div>
          <div style="font-size:12px;color:#6b7280;font-family:monospace;">${r.id}</div>
        </div>
        <div style="font-weight:700;font-size:15px;color:${statusColor};white-space:nowrap;">${statusLabel}</div>
      </div>
      <div style="margin-top:12px;font-size:14px;color:#374151;line-height:1.6;background:#f9fafb;padding:12px;border-radius:8px;">
        ${r.summary || '<em>No analysis available</em>'}
      </div>
      ${r.error ? `<div style="margin-top:8px;font-size:13px;color:#dc2626;font-family:monospace;">${r.error}</div>` : ''}
      ${screenshotSrc}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Funnel Test Report — ${timestamp}</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: "Open Sans", sans-serif; background: #f5f4f0; color: #111827; margin: 0; padding: 24px; }
    .wrap { max-width: 860px; margin: 0 auto; }
    .header { background: #1a1f2e; color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 6px; font-size: 22px; }
    .header p { margin: 0; font-size: 14px; color: rgba(255,255,255,.6); }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat { background: #fff; border-radius: 10px; padding: 16px 24px; flex: 1; text-align: center; border: 1px solid #e5e7eb; }
    .stat .num { font-size: 32px; font-weight: 700; }
    .stat .lbl { font-size: 13px; color: #6b7280; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Booking Funnel — Test Report</h1>
      <p>Generated ${timestamp} ET &nbsp;·&nbsp; ${total} paths tested &nbsp;·&nbsp; Staging: booking-funnel.html</p>
    </div>
    <div class="summary">
      <div class="stat"><div class="num" style="color:#16a34a;">${passed}</div><div class="lbl">Passed</div></div>
      <div class="stat"><div class="num" style="color:${failed > 0 ? '#dc2626' : '#16a34a'};">${failed}</div><div class="lbl">Failed</div></div>
      <div class="stat"><div class="num">${total}</div><div class="lbl">Total Paths</div></div>
    </div>
    ${rows}
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment.');
    process.exit(1);
  }

  // Set up report directory
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const client = new Anthropic({ apiKey });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  console.log(`\n🧪 Running ${TEST_PATHS.length} funnel paths against staging...\n`);

  for (const testPath of TEST_PATHS) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone-sized
    const page = await context.newPage();
    const screenshotFile = `screenshots/${testPath.id}.png`;
    const screenshotPath = path.join(REPORT_DIR, screenshotFile);

    process.stdout.write(`  → ${testPath.label} ... `);

    let result = { id: testPath.id, label: testPath.label, passed: false, summary: '', screenshotFile: null, error: null };

    try {
      await runPath(page, testPath.steps);

      // Screenshot the active result screen
      if (!fs.existsSync(path.dirname(screenshotPath))) {
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      }
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshotFile = screenshotFile;

      // Claude vision analysis
      const analysis = await analyzeScreenshot(client, screenshotPath, testPath);
      result.passed = analysis.passed;
      result.summary = analysis.summary;

      console.log(result.passed ? '✅ PASS' : '❌ FAIL');
    } catch (err) {
      result.error = err.message;
      result.summary = 'Test threw an error — likely a selector not found or page navigation issue.';
      console.log(`❌ ERROR: ${err.message.split('\n')[0]}`);

      // Try to screenshot whatever is on screen for debugging
      try {
        if (!fs.existsSync(path.dirname(screenshotPath))) {
          fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        }
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshotFile = screenshotFile;
      } catch (_) { /* ignore */ }
    }

    results.push(result);
    await context.close();
  }

  await browser.close();

  // Write report
  const html = buildReport(results);
  fs.writeFileSync(REPORT_FILE, html);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`📄 Report: ${REPORT_FILE}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
