import { describe, expect, it } from 'vitest'
import type { Plugin } from 'vite'
import { requireSupabaseEnv, supabaseEnvProblems } from '../../requireSupabaseEnv'

/**
 * Vite inlines every `VITE_*` variable at build time, and a missing repository
 * variable reaches the build as an empty string. The build used to succeed
 * anyway, and `src/supabase/client.ts` then threw on import in the browser:
 * the live catalog was a blank page behind two green deploys. The guard turns
 * that into a red build, but only when the workflows ask for it.
 */

const URL_OK = 'https://abcdefghijklmnopqrst.supabase.co'
const KEY_OK = 'sb_publishable_test'
const VALID = { VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_PUBLISHABLE_KEY: KEY_OK }

/** Runs the plugin's buildStart hook with a context whose `error` throws, as the bundler's does. */
function runBuildStart(plugin: Plugin): void {
  const hook = plugin.buildStart
  const handler = typeof hook === 'function' ? hook : hook?.handler
  const context = {
    error(message: string): never {
      throw new Error(message)
    },
  }
  handler?.call(context as never, {} as never)
}

describe('supabaseEnvProblems', () => {
  it('reports both variables when neither is set', () => {
    const problems = supabaseEnvProblems({})
    expect(problems).toHaveLength(2)
    expect(problems.join('\n')).toContain('VITE_SUPABASE_URL')
    expect(problems.join('\n')).toContain('VITE_SUPABASE_PUBLISHABLE_KEY')
  })

  it.each(['', '   '])('reports an empty project URL (%j)', (value) => {
    const problems = supabaseEnvProblems({ ...VALID, VITE_SUPABASE_URL: value })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('VITE_SUPABASE_URL')
  })

  it.each(['', '   '])('reports an empty publishable key (%j)', (value) => {
    const problems = supabaseEnvProblems({ ...VALID, VITE_SUPABASE_PUBLISHABLE_KEY: value })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('VITE_SUPABASE_PUBLISHABLE_KEY')
  })

  // The Content-Security-Policy in firebase.json lets the page reach
  // `https://*.supabase.co` and nothing else, so any other origin builds a
  // catalog whose every request the browser refuses.
  it.each([
    'http://abcdefghijklmnopqrst.supabase.co',
    'https://supply-catalog.web.app',
    'https://abcdefghijklmnopqrst.supabase.in',
    'https://abcdefghijklmnopqrst.supabase.co/rest/v1',
    'https://abcdefghijklmnopqrst.supabase.co.example.com',
    'https://supabase.co',
    'abcdefghijklmnopqrst.supabase.co',
  ])('reports a project URL the Content-Security-Policy would block: %s', (value) => {
    const problems = supabaseEnvProblems({ ...VALID, VITE_SUPABASE_URL: value })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('VITE_SUPABASE_URL')
  })

  it.each([URL_OK, `${URL_OK}/`])('accepts a project URL and a key: %s', (value) => {
    expect(supabaseEnvProblems({ ...VALID, VITE_SUPABASE_URL: value })).toEqual([])
  })
})

describe('requireSupabaseEnv', () => {
  it('runs only for builds, never for the dev server', () => {
    expect(requireSupabaseEnv(VALID, '1').apply).toBe('build')
  })

  it('fails the build and names every problem when REQUIRE_SUPABASE_ENV is 1', () => {
    const plugin = requireSupabaseEnv(
      { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
      '1',
    )
    expect(() => runBuildStart(plugin)).toThrow(
      /VITE_SUPABASE_URL[\s\S]*VITE_SUPABASE_PUBLISHABLE_KEY/,
    )
  })

  it('lets a deploy build through when both variables are valid', () => {
    expect(() => runBuildStart(requireSupabaseEnv(VALID, '1'))).not.toThrow()
  })

  // Local builds and the test toolchain run with no Supabase settings at all.
  it.each([undefined, '', '0', 'true'])('stays out of the way when the flag is %j', (flag) => {
    expect(() => runBuildStart(requireSupabaseEnv({}, flag))).not.toThrow()
  })
})
