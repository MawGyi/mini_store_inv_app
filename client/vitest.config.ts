import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.svelte-kit'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/components/Inventory*.svelte',
        'src/lib/services/api.ts',
        'src/lib/stores/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test-setup.ts',
        'src/**/__tests__/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/lib/components/InventoryList.svelte': {
          branches: 75,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/lib/components/InventoryManagementForm.svelte': {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/services/api.ts': {
          branches: 85,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
  },
});
