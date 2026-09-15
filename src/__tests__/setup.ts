import '@testing-library/jest-dom/vitest'
import i18n from '../i18n'

/**
 * The Supabase client is never constructed in unit tests: `src/supabase/client.ts`
 * would demand real project credentials. Tests cover the pure logic and the
 * presentation components, with the data layer mocked. The access rules are
 * verified separately against the database by supabase/verify.sql.
 */

/* Components read their text through the shared i18next instance, so it is
   initialised here and pinned to English — assertions in these tests quote the
   English copy. */
await i18n.changeLanguage('en')

/* jsdom has no matchMedia, which ThemeProvider uses to follow the operating
   system setting. The stub reports "light" and never changes. */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
