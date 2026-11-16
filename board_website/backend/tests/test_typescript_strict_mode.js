const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Testing TypeScript Strict Mode Compiler Configuration (Phase 6.2)...\n');

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
const TSCONFIG_PATH = path.join(FRONTEND_DIR, 'tsconfig.app.json');
const PORTFOLIO_PATH = path.join(FRONTEND_DIR, 'src/components/portfolio/PublicPortfolioPage.tsx');
const OVERVIEW_PATH = path.join(FRONTEND_DIR, 'src/components/profile/tabs/ProfileOverviewTab.tsx');
const API_PATH = path.join(FRONTEND_DIR, 'src/services/api.ts');

// 1. Verify tsconfig.app.json strict mode is enabled
console.log('1. Checking tsconfig.app.json configuration:');
assert(fs.existsSync(TSCONFIG_PATH), 'tsconfig.app.json must exist');
const tsconfigSource = fs.readFileSync(TSCONFIG_PATH, 'utf8');
const cleanJson = tsconfigSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
const tsconfig = JSON.parse(cleanJson);

assert.strictEqual(tsconfig.compilerOptions.strict, true, 'tsconfig.app.json must have "strict": true');
console.log('   ✓ compilerOptions.strict is set to true');

// 2. Verify strict typing fixes in source files
console.log('\n2. Verifying strict null-safety annotations in codebase:');

const portfolioSource = fs.readFileSync(PORTFOLIO_PATH, 'utf8');
assert(portfolioSource.includes('map((tag: string) =>'), 'PublicPortfolioPage must explicitly type tag parameter');
console.log('   ✓ PublicPortfolioPage: techStack.map((tag: string) => ...) is strongly typed');

const overviewSource = fs.readFileSync(OVERVIEW_PATH, 'utf8');
assert(overviewSource.includes('map((s: string) => s[0])'), 'ProfileOverviewTab must explicitly type s parameter in initials generator');
console.log('   ✓ ProfileOverviewTab: initials generator .map((s: string) => s[0]) is strongly typed');

const apiSource = fs.readFileSync(API_PATH, 'utf8');
assert(apiSource.includes('targetPath = savedLocalPath || file.name'), 'api.ts uploadDocument must guard savedLocalPath with non-undefined fallback');
console.log('   ✓ api.ts: uploadDocument guarantees non-undefined string path');

// 3. Verify tsc -b compilation execution
console.log('\n3. Executing TypeScript compiler check (tsc -b):');
try {
  execSync('npm run build --prefix board_website/frontend', {
    cwd: path.resolve(__dirname, '../../..'),
    stdio: 'pipe',
  });
  console.log('   ✓ Full strict TypeScript compilation (tsc -b) and Vite build succeeded with 0 errors');
} catch (err) {
  assert.fail(`TypeScript build failed under strict mode: ${err.message}`);
}

console.log('\n✅ All Phase 6.2 TypeScript Strict Mode tests PASSED successfully!\n');
