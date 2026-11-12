import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': src },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [`${src}/shared/styles`],
      },
    },
  },
  worker: { format: 'es' },
  optimizeDeps: {
    include: ['brain.js/dist/neural-network.js'],
  },
});
