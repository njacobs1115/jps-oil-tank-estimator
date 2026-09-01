#!/usr/bin/env node

const WORKFLOW_FILE = 'sync-airtable.yml';
const REAL_JOB_NAMES = new Set(['Sync pricing and prepare draft PR', 'sync']);

function easternTime(value) {
  if (!value) return 'unknown';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'long',
  }).format(new Date(value));
}

function buildFailureMessage(details) {
  return [
    details.test ? 'TEST — JPS automation failure alert' : 'JPS AUTOMATION FAILURE',
    'Job: Sync Airtable City Pricing',
    `Failure time (ET): ${easternTime(details.failedAt)}`,
    `What failed: ${details.failedStage || 'workflow failure; stage unavailable'}`,
    `Business impact: ${details.impact || 'Monthly pricing proposal delayed; live website remains on the last approved pricing.'}`,
    `Last known success: ${details.lastSuccess ? easternTime(details.lastSuccess) : 'unknown'}`,
    'Retry status: Not automatically retried.',
    'Rollback status: Not required; live website pricing was not changed.',
    'Owner: Norman Jacobs',
    `Next action: Review the failed run and rerun after correcting the reported stage${details.runUrl ? `: ${details.runUrl}` : '.'}`,
  ].join('\n');
}

function buildRecoveryMessage(details) {
  return [
    details.test ? 'TEST — JPS automation recovery alert' : 'JPS AUTOMATION RECOVERED',
    'Job: Sync Airtable City Pricing',
    `Recovery time (ET): ${easternTime(details.recoveredAt)}`,
    `Restored behavior: ${details.outcome || 'pricing sync completed successfully'}`,
    'Business impact: The delayed pricing proposal path is operating again; live pricing still changes only after human review and merge.',
    `Previous failure: ${details.previousFailure ? easternTime(details.previousFailure) : 'test failure notification'}`,
    details.test ? 'Retry status: Controlled recovery-message delivery test.' : 'Retry status: Recovery confirmed by a successful real sync.',
    'Rollback status: Not required.',
    'Owner: Norman Jacobs',
    `Next action: ${details.outcome === 'draft pricing PR created' ? 'Review the draft pricing PR and required checks.' : 'No pricing review is needed unless a draft PR was created.'}`,
  ].join('\n');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${options.service || 'Remote service'} request failed with HTTP ${response.status}`);
  const data = await response.json();
  return data;
}

async function githubJson(pathname, token, repository) {
  return requestJson(`https://api.github.com/repos/${repository}${pathname}`, {
    service: 'GitHub',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
}

async function getRealJob(run, token, repository) {
  const data = await githubJson(`/actions/runs/${run.id}/jobs?per_page=100`, token, repository);
  return Array.isArray(data.jobs) ? data.jobs.find(job => REAL_JOB_NAMES.has(job.name) && job.conclusion !== 'skipped') || null : null;
}

async function getRunContext(token, repository, runId) {
  const currentJobs = await githubJson(`/actions/runs/${runId}/jobs?per_page=100`, token, repository);
  const realJob = currentJobs.jobs.find(job => REAL_JOB_NAMES.has(job.name));
  const failedStep = realJob && realJob.steps ? realJob.steps.find(step => step.conclusion === 'failure') : null;
  const runs = await githubJson(`/actions/workflows/${WORKFLOW_FILE}/runs?status=completed&per_page=30`, token, repository);
  const priorRealRuns = [];
  for (const run of runs.workflow_runs || []) {
    if (String(run.id) === String(runId)) continue;
    const priorJob = await getRealJob(run, token, repository);
    if (priorJob) priorRealRuns.push({ ...run, sync_conclusion: priorJob.conclusion });
    if (priorRealRuns.length >= 10) break;
  }
  return {
    failedStage: failedStep ? failedStep.name : realJob ? `job concluded ${realJob.conclusion}` : 'sync job unavailable',
    previousReal: priorRealRuns[0] || null,
    lastSuccess: priorRealRuns.find(run => run.sync_conclusion === 'success') || null,
  };
}

async function sendTelegram(text, token, chatId) {
  if (!token || !chatId) throw new Error('Telegram notification secrets are missing');
  const data = await requestJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', service: 'Telegram', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (data.ok !== true) throw new Error('Telegram rejected the notification');
}

async function main(env = process.env) {
  const mode = env.NOTIFICATION_MODE || 'real';
  const now = new Date().toISOString();
  if (mode === 'test-failure') return sendTelegram(buildFailureMessage({ test: true, failedAt: now, failedStage: 'controlled notification-path test' }), env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  if (mode === 'test-recovery') return sendTelegram(buildRecoveryMessage({ test: true, recoveredAt: now, outcome: 'controlled notification path restored' }), env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);

  const required = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_RUN_ID', 'SYNC_RESULT'];
  for (const name of required) if (!env[name]) throw new Error(`Missing ${name}`);
  const runUrl = `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
  let context;
  try {
    context = await getRunContext(env.GITHUB_TOKEN, env.GITHUB_REPOSITORY, env.GITHUB_RUN_ID);
  } catch (error) {
    const message = buildFailureMessage({
      failedAt: now,
      failedStage: env.SYNC_RESULT === 'success' ? 'post-sync recovery-state lookup failed' : 'sync failed; detailed GitHub run context is unavailable',
      impact: env.SYNC_RESULT === 'success'
        ? 'The pricing sync completed, but recovery status could not be verified; live pricing still requires human review and merge.'
        : undefined,
      runUrl,
    });
    await sendTelegram(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
    if (env.SYNC_RESULT === 'success') throw new Error('Recovery-state lookup failed after the warning was delivered');
    return;
  }
  if (env.SYNC_RESULT !== 'success') {
    const message = buildFailureMessage({ failedAt: now, failedStage: context.failedStage, lastSuccess: context.lastSuccess && context.lastSuccess.updated_at, runUrl });
    return sendTelegram(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  }
  if (context.previousReal && context.previousReal.conclusion === 'failure') {
    const message = buildRecoveryMessage({ recoveredAt: now, previousFailure: context.previousReal.updated_at, outcome: env.SYNC_OUTCOME || 'pricing sync completed successfully' });
    return sendTelegram(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

module.exports = { buildFailureMessage, buildRecoveryMessage, easternTime, getRunContext, main, sendTelegram };
