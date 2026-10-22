import type { Plugin } from 'vite'

/** The build-time variables `src/supabase/client.ts` cannot construct the client without. */
const REQUIRED_SUPABASE_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'] as const

/**
 * A Supabase project URL, `https://<ref>.supabase.co`. The Content-Security-Policy
 * in firebase.json lets the page reach `https://*.supabase.co` and no other
 * origin, so a bundle built against anything else has every request refused.
 * supabase-js adds the trailing slash itself, so one is allowed here.
 */
const PROJECT_URL = /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/

/**
 * What is wrong with the Supabase settings a bundle is about to be built with;
 * empty when nothing is. Values are never echoed: CI masks them anyway, and a
 * key pasted into the wrong secret should not reach a build log.
 */
export function supabaseEnvProblems(env: Record<string, string | undefined>): string[] {
  return REQUIRED_SUPABASE_VARS.flatMap((key) => {
    const value = (env[key] ?? '').trim()
    if (!value) return [`${key} is empty — set the repository secret ${key}.`]
    if (key === 'VITE_SUPABASE_URL' && !PROJECT_URL.test(value))
      return [
        `${key} is not a Supabase project URL (https://<ref>.supabase.co), the only origin the Content-Security-Policy in firebase.json allows.`,
      ]
    return []
  })
}

/**
 * Fails the build when the Supabase settings are missing or not a project URL,
 * but only when `REQUIRE_SUPABASE_ENV=1`, which both hosting workflows set on
 * their build step.
 *
 * `.env` is gitignored, so CI has these values only through repository secrets.
 * A missing secret reaches the build as an empty string, Vite inlines it, and
 * the build still succeeds; `src/supabase/client.ts` then throws on import in
 * the browser and the live catalog is a blank page behind a green deploy. This
 * turns that into a red build.
 *
 * It is opt-in because `npm run build` also runs where empty is fine: locally
 * without a `.env`, and in any toolchain check that never serves the bundle.
 */
export function requireSupabaseEnv(
  env: Record<string, string | undefined>,
  flag: string | undefined,
): Plugin {
  return {
    name: 'selly:require-supabase-env',
    apply: 'build',
    buildStart() {
      if (flag !== '1') return

      const problems = supabaseEnvProblems(env)
      if (problems.length > 0) {
        this.error(
          'Refusing to build a deploy bundle with no Supabase project configured:\n' +
            problems.map((p) => `  - ${p}`).join('\n'),
        )
      }
    },
  }
}
