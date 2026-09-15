import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Two separate test projects:
 *  - `unit`   — jsdom, React component and pure-logic tests.
 *  - `rules`  — node, Firestore/Storage security-rule tests that talk to the
 *               emulator. Kept apart so `npm test` never silently skips the
 *               rules suite, and so the emulator is only required for `rules`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/__tests__/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'rules',
          environment: 'node',
          globals: true,
          include: ['tests/rules/**/*.test.ts'],
          testTimeout: 20000,
          hookTimeout: 20000,
          fileParallelism: false,
        },
      },
    ],
  },
})
