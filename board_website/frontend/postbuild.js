import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.join(__dirname, 'dist');
const indexHtml = path.join(dist, 'index.html');

if (fs.existsSync(indexHtml)) {
  // 1. Copy index.html to 404.html for static CDNs fallback
  fs.copyFileSync(indexHtml, path.join(dist, '404.html'));

  // 2. Pre-generate physical directories and HTML files for all known client routes
  const routes = ['job-applications', 'board', 'applications', 'learnings', 'profile'];
  routes.forEach(route => {
    const routeDir = path.join(dist, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'));
    fs.copyFileSync(indexHtml, path.join(dist, `${route}.html`));
  });

  // 3. Ensure vercel.json is present in dist
  const vercelConfig = {
    rewrites: [
      {
        source: '/(.*)',
        destination: '/index.html'
      }
    ]
  };
  fs.writeFileSync(path.join(dist, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));

  console.log('[Postbuild] Generated 404.html and static route fallbacks for:', routes.join(', '));
} else {
  console.warn('[Postbuild] index.html not found in dist. Skipping fallback generation.');
}
