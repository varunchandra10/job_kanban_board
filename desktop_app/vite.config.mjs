import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, '../web_app/frontend'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'src-tauri/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, '../web_app/frontend/index.html'),
        board: path.resolve(__dirname, '../web_app/frontend/board.html'),
        learnings: path.resolve(__dirname, '../web_app/frontend/learnings.html'),
        profile: path.resolve(__dirname, '../web_app/frontend/profile.html'),
      },
    },
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'src-tauri/dist');
        fs.mkdirSync(outDir, { recursive: true });

        const staticFiles = ['logos.json', 'logo.svg', 'favicon.svg'];
        for (const file of staticFiles) {
          const src = path.resolve(__dirname, '../web_app/frontend', file);
          const dest = path.resolve(outDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }

        const vendorSrc = path.resolve(__dirname, '../web_app/frontend/vendor');
        const vendorDest = path.resolve(outDir, 'vendor');
        if (fs.existsSync(vendorSrc)) {
          fs.cpSync(vendorSrc, vendorDest, { recursive: true });
        }
      }
    }
  ],
  server: {
    port: 5173,
    strictPort: true
  }
});
