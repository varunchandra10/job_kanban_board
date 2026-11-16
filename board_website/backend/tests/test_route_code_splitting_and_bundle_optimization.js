const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing Route-Level Code Splitting & Bundle Optimization (Phase 6.1)...\n');

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
const APP_TSX_PATH = path.join(FRONTEND_DIR, 'src/App.tsx');
const VITE_CONFIG_PATH = path.join(FRONTEND_DIR, 'vite.config.ts');
const DIST_ASSETS_DIR = path.join(FRONTEND_DIR, 'dist/assets');

// 1. Verify App.tsx implements React.lazy on all route targets
console.log('1. Checking App.tsx React.lazy route definitions:');
assert(fs.existsSync(APP_TSX_PATH), 'App.tsx must exist');
const appSource = fs.readFileSync(APP_TSX_PATH, 'utf8');

const expectedLazyRoutes = [
  'LandingPage',
  'ApplicationsPage',
  'LearningsPage',
  'CareerProfile',
  'DsaPracticePage',
  'StandaloneClipperPage',
  'PrivacyPage',
  'TermsPage',
  'PublicPortfolioPage',
];

expectedLazyRoutes.forEach(routeName => {
  const pattern = new RegExp(`const\\s+${routeName}\\s*=\\s*React\\.lazy`);
  assert(pattern.test(appSource), `App.tsx must define ${routeName} with React.lazy`);
  console.log(`   ✓ ${routeName} is dynamically code-split via React.lazy`);
});

// Verify Suspense wrappers
assert(appSource.includes('<Suspense') && appSource.includes('fallback='), 'App.tsx must wrap lazy routes in <Suspense>');
console.log('   ✓ App.tsx implements <Suspense> with accessible fallback boundaries');

// 2. Verify all route components provide default exports
console.log('\n2. Verifying default exports on all lazy-loaded route modules:');
const routeFiles = [
  'src/components/applications/ApplicationsPage.tsx',
  'src/components/learnings/LearningsPage.tsx',
  'src/components/profile/CareerProfile.tsx',
  'src/components/dsa/DsaPracticePage.tsx',
  'src/components/portfolio/PublicPortfolioPage.tsx',
  'src/components/clipper/StandaloneClipperPage.tsx',
  'src/components/landing/LandingPage.tsx',
  'src/components/legal/PrivacyPage.tsx',
  'src/components/legal/TermsPage.tsx',
];

routeFiles.forEach(relPath => {
  const filePath = path.join(FRONTEND_DIR, relPath);
  assert(fs.existsSync(filePath), `${relPath} must exist`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('export default'), `${relPath} must provide an export default for React.lazy`);
  console.log(`   ✓ ${relPath} exports default`);
});

// 3. Verify vite.config.ts manualChunks configuration
console.log('\n3. Verifying vite.config.ts Rollup manualChunks optimization:');
assert(fs.existsSync(VITE_CONFIG_PATH), 'vite.config.ts must exist');
const viteConfigSource = fs.readFileSync(VITE_CONFIG_PATH, 'utf8');
assert(viteConfigSource.includes('manualChunks'), 'vite.config.ts must configure manualChunks');
assert(viteConfigSource.includes('vendor-react'), 'vite.config.ts must chunk vendor-react');
assert(viteConfigSource.includes('vendor-icons'), 'vite.config.ts must chunk vendor-icons');
console.log('   ✓ vite.config.ts isolates vendor-react and vendor-icons chunks');

// 4. Verify generated build artifacts in dist/assets
console.log('\n4. Verifying production build chunk outputs in dist/assets:');
assert(fs.existsSync(DIST_ASSETS_DIR), 'dist/assets directory must exist (run build first)');
const assetFiles = fs.readdirSync(DIST_ASSETS_DIR);

// Look for route chunks
const hasLandingChunk = assetFiles.some(f => f.startsWith('LandingPage-') && f.endsWith('.js'));
const hasPortfolioChunk = assetFiles.some(f => f.startsWith('PublicPortfolioPage-') && f.endsWith('.js'));
const hasCareerChunk = assetFiles.some(f => f.startsWith('CareerProfile-') && f.endsWith('.js'));
const hasVendorReactChunk = assetFiles.some(f => f.startsWith('vendor-react-') && f.endsWith('.js'));
const hasVendorIconsChunk = assetFiles.some(f => f.startsWith('vendor-icons-') && f.endsWith('.js'));

assert(hasLandingChunk, 'LandingPage chunk must be emitted separately');
assert(hasPortfolioChunk, 'PublicPortfolioPage chunk must be emitted separately');
assert(hasCareerChunk, 'CareerProfile chunk must be emitted separately');
assert(hasVendorReactChunk, 'vendor-react chunk must be emitted separately');
assert(hasVendorIconsChunk, 'vendor-icons chunk must be emitted separately');

// Verify main index bundle size is under 500 kB (eliminating the oversized chunk warning)
const indexFile = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
assert(indexFile, 'index bundle file must exist');
const indexStats = fs.statSync(path.join(DIST_ASSETS_DIR, indexFile));
const indexSizeKb = Math.round(indexStats.size / 1024);

console.log(`   ✓ Emitted discrete route chunks (LandingPage, PublicPortfolioPage, CareerProfile, etc.)`);
console.log(`   ✓ Emitted discrete vendor chunks (vendor-react, vendor-icons)`);
console.log(`   ✓ Main application index bundle size: ${indexSizeKb} kB (Threshold: < 500 kB)`);
assert(indexSizeKb < 500, `Main index bundle (${indexSizeKb} kB) must be under 500 kB`);

console.log('\n✅ All Phase 6.1 Route Code-Splitting & Bundle Optimization tests PASSED successfully!\n');
