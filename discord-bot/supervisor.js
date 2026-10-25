const { spawn } = require('child_process');

const SHIFT_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours max per runner
const HANDOVER_LEAD_TIME_MS = 5 * 60 * 1000; // Trigger next runner 5 minutes before shift ends (at 4h 55m)
const startTime = Date.now();

let child = null;
let isShuttingDown = false;
let handoverDispatched = false;

async function dispatchNextRunner() {
  if (handoverDispatched) return;
  handoverDispatched = true;

  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    console.log('[Supervisor] GITHUB_REPOSITORY or GITHUB_TOKEN not provided. Relying on fallback cron schedule.');
    return;
  }

  console.log(`[Supervisor] Shift reaching 5 hours. Dispatching next relay runner for ${repo}...`);

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/bot-runner.yml/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Wavelength-Supervisor',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (res.status === 204 || res.ok) {
      console.log('[Supervisor] ✅ Next relay runner successfully dispatched! Concurrency handover in progress.');
    } else {
      const text = await res.text();
      console.warn(`[Supervisor] Handover dispatch returned status ${res.status}:`, text);
    }
  } catch (err) {
    console.error('[Supervisor] Error dispatching next relay runner:', err.message);
  }
}

function startBot() {
  if (isShuttingDown) return;

  console.log('[Supervisor] Launching Wavelength bot process (dist/index.js)...');
  child = spawn('node', ['dist/index.js'], { stdio: 'inherit' });

  child.on('close', (code, signal) => {
    console.log(`[Supervisor] Bot process closed with code ${code}, signal ${signal}`);
    child = null;

    if (!isShuttingDown && Date.now() - startTime < SHIFT_DURATION_MS) {
      console.log('[Supervisor] Auto-restarting bot in 3 seconds...');
      setTimeout(startBot, 3000);
    }
  });

  child.on('error', (err) => {
    console.error('[Supervisor] Process execution error:', err.message);
  });
}

// 1. Handover timer: Dispatch next runner at 4 hours 55 minutes
setTimeout(() => {
  dispatchNextRunner();
}, SHIFT_DURATION_MS - HANDOVER_LEAD_TIME_MS);

// 2. Clean Shift Completion timer: Exit cleanly at 5 hours
setTimeout(() => {
  console.log('[Supervisor] 5-hour runner shift completed cleanly. Retiring current runner.');
  isShuttingDown = true;
  if (child) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 4000);
}, SHIFT_DURATION_MS);

// 3. Graceful shutdown on cancellation / SIGTERM
process.on('SIGTERM', () => {
  console.log('[Supervisor] Received SIGTERM. Cleaning up child bot process...');
  isShuttingDown = true;
  if (child) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGINT', () => {
  console.log('[Supervisor] Received SIGINT. Cleaning up child bot process...');
  isShuttingDown = true;
  if (child) child.kill('SIGINT');
  setTimeout(() => process.exit(0), 1000);
});

// Launch bot
startBot();
