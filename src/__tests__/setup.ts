import '@testing-library/jest-dom/vitest'

/**
 * Firebase is never initialised in unit tests: `src/firebase/app.ts` would
 * demand real credentials. Tests cover the pure logic and the presentation
 * components; the rules and data paths are covered against the emulator in
 * tests/rules/.
 */
