import { describe, expect, it } from 'vitest'
import mergeWorkflow from '../../.github/workflows/firebase-hosting-merge.yml?raw'
import pullRequestWorkflow from '../../.github/workflows/firebase-hosting-pull-request.yml?raw'

/**
 * Both hosting workflows build the bundle that Firebase serves. A missing
 * Supabase secret used to build cleanly into a blank page, so each build step
 * must turn on the guard in requireSupabaseEnv.ts, and the gates must run
 * before anything is deployed.
 */

const GATES_IN_ORDER = [
  '- run: npm ci',
  '- run: npm run lint',
  '- run: npm test',
  '- run: npm run build',
  'FirebaseExtended/action-hosting-deploy@v0',
]

const BUILD_ENV = [
  "REQUIRE_SUPABASE_ENV: '1'",
  'VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}',
  'VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}',
]

/** What is wrong with a hosting workflow; empty when nothing is. Comment lines are ignored. */
function checkHostingWorkflow(text: string): string[] {
  const body = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
  const problems: string[] = []

  let cursor = 0
  for (const needle of GATES_IN_ORDER) {
    const at = body.indexOf(needle, cursor)
    if (at < 0) problems.push(`missing or out of order: ${needle}`)
    else cursor = at
  }

  const build = body.indexOf('- run: npm run build')
  const deploy = body.indexOf('FirebaseExtended/action-hosting-deploy@v0')
  const buildStep = build >= 0 && deploy > build ? body.slice(build, deploy) : ''
  for (const needle of BUILD_ENV) {
    if (!buildStep.includes(needle)) problems.push(`build step lacks ${needle}`)
  }
  return problems
}

describe('hosting workflows', () => {
  it.each([
    ['firebase-hosting-merge.yml', mergeWorkflow],
    ['firebase-hosting-pull-request.yml', pullRequestWorkflow],
  ])('%s runs the gates and builds with the Supabase guard on', (_name, text) => {
    expect(checkHostingWorkflow(text)).toEqual([])
  })

  it('the checker rejects a build without the guard, with it commented out, or with it on another step', () => {
    const flag = "          REQUIRE_SUPABASE_ENV: '1'\n"
    expect(checkHostingWorkflow(mergeWorkflow.replace(flag, ''))).not.toEqual([])
    expect(
      checkHostingWorkflow(mergeWorkflow.replace(flag, "          # REQUIRE_SUPABASE_ENV: '1'\n")),
    ).not.toEqual([])
    expect(
      checkHostingWorkflow(mergeWorkflow.replace(flag, '') + `\n    env:\n${flag}`),
    ).not.toEqual([])
  })

  it('the checker rejects a missing gate', () => {
    expect(checkHostingWorkflow(mergeWorkflow.replace('- run: npm test', ''))).not.toEqual([])
  })
})
