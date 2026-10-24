const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getDesktopEnv } = require('./desktop-env');

const rootDir = path.resolve(__dirname, '../..');
const desktopDir = path.resolve(__dirname, '..');
const desktopEnv = getDesktopEnv();

const keyFile = path.join(desktopDir, 'src-tauri', 'jobtracker_updater.key');
if (!desktopEnv.TAURI_SIGNING_PRIVATE_KEY && fs.existsSync(keyFile)) {
  desktopEnv.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(keyFile, 'utf8').trim();
}

console.log('[Desktop Build] Launching Tauri build...');

const child = spawn('npx', ['tauri', 'build', ...process.argv.slice(2)], {
  cwd: desktopDir,
  stdio: 'inherit',
  shell: true,
  env: desktopEnv
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
