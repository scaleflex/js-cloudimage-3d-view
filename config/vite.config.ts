import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/react/**/*', 'tests/**/*'],
      rollupTypes: true,
      tsconfigPath: resolve(__dirname, '../tsconfig.build.json'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, '../src/index.ts'),
      name: 'CI3DView',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'js-cloudimage-3d-view.esm.js';
        if (format === 'cjs') return 'js-cloudimage-3d-view.cjs.js';
        return 'js-cloudimage-3d-view.min.js';
      },
    },
    rollupOptions: {
      external: ['three', /^three\/.*/],
      output: {
        exports: 'named',
        globals: (id: string) => {
          if (id === 'three' || id.startsWith('three/')) return 'THREE';
          return id;
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    outDir: resolve(__dirname, '../dist'),
    emptyDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
