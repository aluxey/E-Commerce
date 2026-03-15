import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const PACKAGE_CHUNKS = [
  ['react-vendor', ['react', 'react-dom']],
  ['router', ['react-router', 'react-router-dom']],
  ['i18n', ['i18next', 'react-i18next']],
  ['supabase', ['@supabase']],
  ['stripe', ['@stripe']],
  ['markdown', ['react-markdown']],
  ['icons', ['lucide-react']],
];

function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined;

  for (const [chunkName, packages] of PACKAGE_CHUNKS) {
    if (packages.some(pkg => id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/${pkg}`))) {
      return chunkName;
    }
  }

  return 'vendor';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
