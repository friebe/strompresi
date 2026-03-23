import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/strompresi/' : './';
  // Unique build ID injected into sw.js on every build so the browser
  // always sees a changed sw.js file and triggers the SW update flow.
  const buildId = Date.now().toString(36);
  return {
  base,
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  plugins: [
    {
      name: 'pwa-post-build',
      closeBundle() {
        const isProd = base !== './';

        // Step 1: replace placeholders in sw.js
        //   __BASE__     → absolute base path (or '' for dev)
        //   __CACHE_ID__ → unique per-build cache name so the browser always
        //                  detects a changed sw.js and triggers the update flow
        const swPath = join(process.cwd(), 'dist', 'sw.js');
        try {
          const cacheId = isProd ? `strompresi-${buildId}` : 'strompresi-dev';
          const sw = readFileSync(swPath, 'utf-8');
          writeFileSync(swPath,
            sw.replace(/__BASE__/g, isProd ? base : '')
              .replace(/__CACHE_ID__/g, cacheId)
          );
        } catch (err) {
          console.warn('[pwa] sw.js update failed:', err);
        }

        if (!isProd) return;

        // Step 2: patch manifest.json via JSON parse — no fragile regex on raw text
        const manifestPath = join(process.cwd(), 'dist', 'manifest.json');
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
            id?: string;
            start_url?: string;
            scope?: string;
            icons: { src: string; sizes: string; type: string; purpose: string }[];
          };
          manifest.id = base;
          manifest.start_url = `${base}index.html`;
          manifest.scope = base;
          manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${base}${icon.src}?v=4` }));
          writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        } catch (err) {
          console.warn('[pwa] manifest.json update failed:', err);
        }

        // Step 3: fix SW registration path in the inline <script> of index.html
        // Vite transforms asset href/src attributes automatically via base, but does
        // NOT rewrite plain string literals inside <script> blocks.
        const indexPath = join(process.cwd(), 'dist', 'index.html');
        try {
          const html = readFileSync(indexPath, 'utf-8');
          writeFileSync(indexPath, html.replace(/register\('\.\/sw\.js'\)/, `register('${base}sw.js')`));
        } catch (err) {
          console.warn('[pwa] index.html update failed:', err);
        }
      },
    },
  ],
};
});
