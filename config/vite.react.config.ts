import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/react/**/*.ts', 'src/react/**/*.tsx', 'src/core/types.ts'],
      rollupTypes: true,
      tsconfigPath: resolve(__dirname, '../tsconfig.build.json'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, '../src/react/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        return 'index.cjs';
      },
    },
    rollupOptions: {
      external: [
        'three',
        /^three\/.*/,
        'web-ifc',
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^js-cloudimage-3d-view/,
      ],
    },
    sourcemap: true,
    outDir: resolve(__dirname, '../dist/react'),
    emptyDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
