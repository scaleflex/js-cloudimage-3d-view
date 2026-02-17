import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: resolve(__dirname, '../demo/react-demo'),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../dist-react-demo'),
    emptyDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
