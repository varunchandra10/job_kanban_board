const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'frontend', 'src');
const outputFile = path.join(__dirname, '..', 'frontend', 'app.js');

if (!fs.existsSync(srcDir)) {
  console.error(`Error: Source directory "${srcDir}" does not exist.`);
  process.exit(1);
}

const files = fs.readdirSync(srcDir)
  .filter(f => f.endsWith('.js'))
  .sort();

console.log(`Merging ${files.length} modules from frontend/src into frontend/app.js...`);

let bundleContent = `// ==========================================================================\n` +
                    `// Job Tracker Kanban Board - Client Application Bundle\n` +
                    `// Automatically generated from frontend/src/*.js - DO NOT EDIT app.js DIRECTLY!\n` +
                    `// To rebuild: npm run build:app (or node scripts/merge-frontend.js)\n` +
                    `// ==========================================================================\n\n`;

for (const file of files) {
  const filePath = path.join(srcDir, file);
  const content = fs.readFileSync(filePath, 'utf8').trim();
  bundleContent += `// --------------------------------------------------------------------------\n`;
  bundleContent += `// MODULE: ${file}\n`;
  bundleContent += `// --------------------------------------------------------------------------\n`;
  bundleContent += content + `\n\n`;
  console.log(`  + Bundled: ${file}`);
}

fs.writeFileSync(outputFile, bundleContent, 'utf8');
console.log(`Bundle generated at ${outputFile} (${bundleContent.length} bytes, ${bundleContent.split('\n').length} lines).`);

// Validate JavaScript syntax of the bundle
try {
  execSync(`node -c "${outputFile}"`, { stdio: 'inherit' });
  console.log('✓ Syntax validation PASSED: frontend/app.js has zero syntax errors.');
} catch (err) {
  console.error('✗ Syntax validation FAILED on generated frontend/app.js:', err.message);
  process.exit(1);
}
