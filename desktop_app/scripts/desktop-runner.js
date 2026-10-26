#!/usr/bin/env node
/**
 * Desktop Runner for Job Tracker
 * Launches the embedded Express engine in Desktop Mode with:
 * - Local SQLite DB in %APPDATA%\JobTracker\tracker.db
 * - Storage in Google Drive (via service account)
 * - Tauri WebView2 desktop window
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const desktopDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'board_website/backend');
process.env.APP_MODE = 'desktop';

console.log('[Desktop Runner] Starting local backend engine in Desktop Mode...');

const serverProcess = spawn('node', ['server.js'], {
  cwd: backendDir,
  shell: true,
  env: { ...process.env, APP_MODE: 'desktop' },
  stdio: 'inherit'
});

function checkServerReady(retries = 40, delayMs = 300) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const interval = setInterval(() => {
      attempt++;
      const req = http.get('http://127.0.0.1:3000/health', (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          console.log('[Desktop Runner] Local server is healthy on http://127.0.0.1:3000');
          resolve();
        }
      });
      req.on('error', () => {
        if (attempt >= retries) {
          clearInterval(interval);
          reject(new Error('Server failed to start within timeout.'));
        }
      });
    }, delayMs);
  });
}

async function main() {
  try {
    await checkServerReady();
    console.log('[Desktop Runner] Launching Tauri desktop application...');
    
    const { getDesktopEnv } = require('./desktop-env');
    const desktopEnv = getDesktopEnv();

    const tauriProcess = spawn('npx', ['tauri', 'dev', '--no-watch'], {
      cwd: desktopDir,
      stdio: 'inherit',
      shell: true,
      env: desktopEnv
    });

    tauriProcess.on('exit', (code) => {
      console.log(`[Desktop Runner] Desktop window closed (code ${code}). Shutting down server...`);
      serverProcess.kill();
      process.exit(code || 0);
    });

    process.on('SIGINT', () => {
      serverProcess.kill();
      tauriProcess.kill();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      serverProcess.kill();
      tauriProcess.kill();
      process.exit(0);
    });
  } catch (err) {
    console.error('[Desktop Runner] Error:', err.message);
    serverProcess.kill();
    process.exit(1);
  }
}

main();
