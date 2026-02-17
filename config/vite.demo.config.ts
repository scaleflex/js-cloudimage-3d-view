import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/js-cloudimage-3d-view/',
  root: resolve(__dirname, '../demo'),
  build: {
    outDir: resolve(__dirname, '../dist-demo'),
    emptyDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
