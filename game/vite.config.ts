import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único HTML com código e arte embutidos, jogável offline.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000, target: 'es2020' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
