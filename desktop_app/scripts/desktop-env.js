/**
 * Desktop Environment Helper for Job Tracker
 * Automatically detects and configures:
 * 1. Cargo binary path (~/.cargo/bin)
 * 2. Visual Studio MSVC toolchain (link.exe / Hostx64) if not already in PATH
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

function getCargoBin() {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  if (!userProfile) return null;
  const cargoBin = path.join(userProfile, '.cargo', 'bin');
  return fs.existsSync(cargoBin) ? cargoBin : null;
}

function hasCommand(cmd) {
  try {
    execSync(`where.exe ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

function getMsvcBin() {
  if (process.platform !== 'win32') return null;
  if (hasCommand('link.exe')) return null; // already available

  const vswherePaths = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
  ];

  let vsWhere = vswherePaths.find(p => fs.existsSync(p));
  let installPath = '';

  if (vsWhere) {
    try {
      installPath = execFileSync(vsWhere, [
        '-latest',
        '-products', '*',
        '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property', 'installationPath'
      ], { encoding: 'utf8' }).trim();
    } catch (_) {}
  }

  // Fallback scan if vswhere didn't return
  if (!installPath) {
    const candidates = [
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise'
    ];
    installPath = candidates.find(c => fs.existsSync(c)) || '';
  }

  if (!installPath) return null;

  const msvcRoot = path.join(installPath, 'VC', 'Tools', 'MSVC');
  if (!fs.existsSync(msvcRoot)) return null;

  try {
    const versions = fs.readdirSync(msvcRoot).sort().reverse();
    for (const ver of versions) {
      const hostX64 = path.join(msvcRoot, ver, 'bin', 'Hostx64', 'x64');
      if (fs.existsSync(path.join(hostX64, 'link.exe'))) {
        return hostX64;
      }
    }
  } catch (_) {}

  return null;
}

function getDesktopEnv() {
  const currentPath = process.env.PATH || '';
  const pathsToAdd = [];

  const cargoBin = getCargoBin();
  if (cargoBin && !currentPath.includes(cargoBin)) {
    pathsToAdd.push(cargoBin);
  }

  const msvcBin = getMsvcBin();
  if (msvcBin && !currentPath.includes(msvcBin)) {
    pathsToAdd.push(msvcBin);
  }

  const newPath = pathsToAdd.length > 0 ? `${pathsToAdd.join(';')};${currentPath}` : currentPath;

  return {
    ...process.env,
    PATH: newPath
  };
}

if (require.main === module) {
  console.log('[desktop-env] Cargo path:', getCargoBin());
  console.log('[desktop-env] MSVC bin:', getMsvcBin());
  console.log('[desktop-env] Enhanced PATH configured successfully.');
}

module.exports = {
  getCargoBin,
  getMsvcBin,
  getDesktopEnv
};
