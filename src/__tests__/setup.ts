import '@testing-library/jest-dom/vitest'

/**
 * The Supabase client is never constructed in unit tests: `src/supabase/client.ts`
 * would demand real project credentials. Tests cover the pure logic and the
 * presentation components, with the data layer mocked. The access rules are
 * verified separately against the database by supabase/verify.sql.
 */
