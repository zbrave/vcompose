import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['@modelcontextprotocol/sdk', 'yaml', 'zod'],
  alias: {
    '@vdc/lib': '../../src/lib',
    '@vdc/store': '../../src/store',
    '@vdc/data': '../../src/data',
  },
});
