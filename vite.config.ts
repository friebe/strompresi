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
        if (base === './') return;
        const manifestPath = join(process.cwd(), 'dist', 'manifest.json');
        try {
          let content = readFileSync(manifestPath, 'utf-8');
          const v = '2';
          content = content.replace(/"icon-maskable-192\.png"/g, `"${base}icon-maskable-192.png?v=${v}"`);
          content = content.replace(/"icon-maskable-512\.png"/g, `"${base}icon-maskable-512.png?v=${v}"`);
          content = content.replace(/"\.\/index\.html"/g, `"${base}index.html"`);
          writeFileSync(manifestPath, content);
        } catch {
          /* manifest might not exist in dev */
        }
      },
    },
  ],
};
});
