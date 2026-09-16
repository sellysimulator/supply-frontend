import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import firebaseJson from '../../firebase.json?raw'

/**
 * The theme script in index.html runs inline, before the first paint, so a
 * reader who chose dark never sees a white flash. Firebase Hosting is static
 * and cannot issue a per-request nonce, so the Content-Security-Policy
 * allow-lists that script by the SHA-256 hash of its exact text.
 *
 * Nothing about that arrangement fails loudly on its own: change a single space
 * in the script and the browser simply refuses to run it, the flash comes back,
 * and the build still succeeds. This test is what notices.
 */

type HeaderRule = { source: string; headers: { key: string; value: string }[] }

const hosting = (JSON.parse(firebaseJson) as { hosting: { headers: HeaderRule[] } }).hosting

const policy = hosting.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key === 'Content-Security-Policy')?.value

async function inlineScriptHash(html: string): Promise<string> {
  const match = html.match(/<script>([\s\S]*?)<\/script>/)
  if (!match?.[1]) throw new Error('index.html no longer contains an inline <script>')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1]))
  return `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`
}

describe('content security policy', () => {
  it('is served on every route, alongside the other security headers', () => {
    const everyRoute = hosting.headers.find((rule) => rule.source === '**')
    expect(everyRoute?.headers.map((header) => header.key)).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-Frame-Options',
      ]),
    )
  })

  it('allow-lists the inline theme script by its current hash', async () => {
    expect(policy).toBeDefined()
    expect(policy).toContain(`'${await inlineScriptHash(indexHtml)}'`)
  })

  it('leaves no blanket allowance for inline script, and lets nobody frame the app', () => {
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).not.toContain("'unsafe-inline' 'sha256-")
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })

  it('reaches Supabase for data and images, and defaults to same-origin otherwise', () => {
    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("connect-src 'self' https://*.supabase.co")
    expect(policy).toMatch(/img-src[^;]*https:\/\/\*\.supabase\.co/)
  })
})
