import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/lib/__mocks__/app-environment.ts'),
      '$app/navigation': path.resolve('./src/lib/__mocks__/app-navigation.ts'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/lib/**/*.svelte'
      ],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/**/*.d.ts',
        'src/lib/__mocks__/**',
        'src/lib/server/storage/sqlite.ts',
        'src/lib/server/storage/postgres.ts',
        'src/lib/server/storage/pg-schema.ts',
        'src/lib/server/storage/sqlite-schema.ts',
        'src/lib/server/storage/schema.ts',
        'src/lib/server/db/index.ts',
        'src/lib/server/init.ts'
      ]
    }
  },
});
