import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/strompresi/' : './';
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
      name: 'manifest-base-path',
      closeBundle() {
        const swPath = join(process.cwd(), 'dist', 'sw.js');
        try {
          let sw = readFileSync(swPath, 'utf-8');
          sw = sw.replace(/__BASE__/g, base === './' ? '' : base);
          writeFileSync(swPath, sw);
        } catch {
          /* ignore */
        }
        if (base === './') return;
        const manifestPath = join(process.cwd(), 'dist', 'manifest.json');
        try {
          let content = readFileSync(manifestPath, 'utf-8');
          const v = '3';
          content = content.replace(/"icon-maskable-192\.png"/g, `"${base}icon-maskable-192.png?v=${v}"`);
          content = content.replace(/"icon-maskable-512\.png"/g, `"${base}icon-maskable-512.png?v=${v}"`);
          content = content.replace(/"\.\/index\.html"/g, `"${base}index.html"`);
          content = content.replace(/"scope":\s*"\.\/"/, `"scope": "${base}"`);
          if (!content.includes('"id"')) {
            content = content.replace(/"name":/, `"id": "${base}",\n  "name":`);
          }
          writeFileSync(manifestPath, content);

          const indexPath = join(process.cwd(), 'dist', 'index.html');
          let html = readFileSync(indexPath, 'utf-8');
          html = html.replace(/href="\.\/manifest\.json"/, `href="${base}manifest.json"`);
          html = html.replace(/register\('\.\/sw\.js'\)/, `register('${base}sw.js')`);
          writeFileSync(indexPath, html);
        } catch {
          /* ignore */
        }
      },
    },
  ],
};
});
