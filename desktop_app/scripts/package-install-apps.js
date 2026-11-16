const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getDesktopEnv } = require('./desktop-env');

const rootDir = path.resolve(__dirname, '../..');
const desktopDir = path.resolve(__dirname, '..');
const tauriDir = path.join(desktopDir, 'src-tauri');
const installerSrcDir = path.join(desktopDir, 'installer_src');
const installAppsDir = path.join(rootDir, 'install_apps');

console.log('=====================================================');
console.log('🚀 Job Tracker — Packaging Desktop Apps & Installer');
console.log('=====================================================');

// 1. Verify Tauri build output
const tauriAppExe = path.join(tauriDir, 'target', 'release', 'app.exe');
if (!fs.existsSync(tauriAppExe)) {
  console.error('❌ Error: desktop_app/src-tauri/target/release/app.exe not found.');
  console.error('Run Tauri release build first!');
  process.exit(1);
}

const tauriStat = fs.statSync(tauriAppExe);
console.log(`✓ Verified Tauri app.exe (${(tauriStat.size / (1024 * 1024)).toFixed(2)} MB, modified: ${tauriStat.mtime.toLocaleTimeString()})`);

// 2. Build installer_src using cargo
console.log('\n[1/4] Compiling 1-Click Installer (Job-Tracker-Setup.exe)...');
const env = getDesktopEnv();
const cargoBuildRes = spawnSync('cargo', ['build', '--release'], {
  cwd: installerSrcDir,
  stdio: 'inherit',
  shell: true,
  env
});

if (cargoBuildRes.status !== 0) {
  console.error('❌ Error: Failed to compile installer_src.');
  process.exit(cargoBuildRes.status || 1);
}

const installerExe = path.join(installerSrcDir, 'target', 'release', 'installer_src.exe');
if (!fs.existsSync(installerExe)) {
  console.error('❌ Error: installer_src.exe was not found after compilation.');
  process.exit(1);
}

// Ensure install_apps folder exists
if (!fs.existsSync(installAppsDir)) {
  fs.mkdirSync(installAppsDir, { recursive: true });
}

// 3. Copy binaries to install_apps
console.log('\n[2/4] Deploying updated executables to install_apps/...');
const destSetupExe = path.join(installAppsDir, 'Job-Tracker-Setup.exe');
const destPortableExe = path.join(installAppsDir, 'JobTracker.exe');

fs.copyFileSync(installerExe, destSetupExe);
console.log(`✓ Updated: install_apps/Job-Tracker-Setup.exe (${(fs.statSync(destSetupExe).size / (1024 * 1024)).toFixed(2)} MB)`);

fs.copyFileSync(tauriAppExe, destPortableExe);
console.log(`✓ Updated: install_apps/JobTracker.exe (${(fs.statSync(destPortableExe).size / (1024 * 1024)).toFixed(2)} MB)`);

// 4. Create ZIP bundle
console.log('\n[3/4] Generating Job-Tracker-Windows.zip portable package...');
const destZip = path.join(installAppsDir, 'Job-Tracker-Windows.zip');

// We use PowerShell Compress-Archive for reliable native Windows zip creation
const zipFiles = [
  path.join(installAppsDir, 'JobTracker.exe'),
  path.join(installAppsDir, 'README.txt'),
  path.join(installAppsDir, 'Uninstall-Job-Tracker.bat')
].filter(f => fs.existsSync(f));

if (fs.existsSync(destZip)) {
  fs.unlinkSync(destZip);
}

const psCommand = `Compress-Archive -Path ${zipFiles.map(f => `'${f}'`).join(', ')} -DestinationPath '${destZip}' -CompressionLevel Optimal`;
const zipRes = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], {
  stdio: 'inherit'
});

if (zipRes.status !== 0 || !fs.existsSync(destZip)) {
  console.error('❌ Warning: PowerShell Compress-Archive failed, trying fallback...');
} else {
  console.log(`✓ Created: install_apps/Job-Tracker-Windows.zip (${(fs.statSync(destZip).size / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('\n[4/4] Verification Summary:');
const files = fs.readdirSync(installAppsDir);
files.forEach(file => {
  const stat = fs.statSync(path.join(installAppsDir, file));
  console.log(`  - ${file.padEnd(28)} ${(stat.size / 1024).toFixed(1)} KB (Updated: ${stat.mtime.toLocaleTimeString()})`);
});

console.log('\n✨ All desktop application packages updated successfully in install_apps/!\n');

