const { spawnSync } = require('child_process');
const path = require('path');
const { getDesktopEnv } = require('./desktop-env');

const rootDir = path.resolve(__dirname, '..');
const tauriDir = path.join(rootDir, 'src-tauri');

const subCmd = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'check';
const extraArgs = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv.slice(3) : process.argv.slice(2);

const res = spawnSync('cargo', [subCmd, ...extraArgs], {
  cwd: tauriDir,
  stdio: 'inherit',
  shell: true,
  env: getDesktopEnv()
});

process.exit(res.status || 0);
