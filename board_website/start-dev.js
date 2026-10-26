/**
 * Dual development runner for Board Website
 * Concurrently starts:
 *   1. Backend Express server on http://localhost:3000
 *   2. Frontend Vite dev server on http://localhost:5173
 */
const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWin = process.platform === 'win32';

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '🚀 Launching Job Tracker Kanban Board (Full-Stack Dev)...');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');

function runProcess(name, command, args, cwd, colorCode) {
  const prefix = `\x1b[${colorCode}m[${name}]\x1b[0m `;
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  proc.stdout.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.log(`${prefix}${line}`);
    });
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.error(`${prefix}\x1b[31m${line}\x1b[0m`);
    });
  });

  proc.on('close', code => {
    console.log(`${prefix}Process exited with code ${code}`);
  });

  return proc;
}

// Start backend
const backendProc = runProcess(
  'Backend',
  'node',
  ['server.js'],
  path.join(rootDir, 'backend'),
  '34' // Blue
);

// Start frontend
const frontendProc = runProcess(
  'Frontend',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'frontend'),
  '32' // Green
);

function shutdown() {
  console.log('\n\x1b[33m%s\x1b[0m', '[Orchestrator] Stopping development servers...');
  if (isWin) {
    if (backendProc?.pid) {
      spawn('taskkill', ['/pid', backendProc.pid.toString(), '/T', '/F'], { shell: true });
    }
    if (frontendProc?.pid) {
      spawn('taskkill', ['/pid', frontendProc.pid.toString(), '/T', '/F'], { shell: true });
    }
  } else {
    backendProc?.kill('SIGINT');
    frontendProc?.kill('SIGINT');
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
