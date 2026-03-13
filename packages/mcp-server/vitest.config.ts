import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@vdc/lib': path.resolve(__dirname, '../../src/lib'),
      '@vdc/store': path.resolve(__dirname, '../../src/store'),
      '@vdc/data': path.resolve(__dirname, '../../src/data'),
    },
  },
  test: {
    root: '.',
  },
});
