const { spawnSync } = require('child_process');
const path = require('path');
const { getDesktopEnv } = require('./desktop-env');

const rootDir = path.resolve(__dirname, '..');
const tauriDir = path.join(rootDir, 'src-tauri');

const res = spawnSync('cargo', ['check', ...process.argv.slice(2)], {
  cwd: tauriDir,
  stdio: 'inherit',
  shell: true,
  env: getDesktopEnv()
});

process.exit(res.status || 0);
