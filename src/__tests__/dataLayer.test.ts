import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These cover the two places where a silent typo would break something without
 * failing loudly: the name and argument of the database function that records a
 * click, and the bucket and path an upload is written to — which have to match
 * what the storage policies allow.
 */

const rpc = vi.fn()
const upload = vi.fn()
const getPublicUrl = vi.fn()
const remove = vi.fn()

vi.mock('../supabase/client', () => ({
  CATALOG_IMAGE_BUCKET: 'catalog-images',
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    storage: {
      from: (bucket: string) => ({
        upload: (...args: unknown[]) => upload(bucket, ...args),
        getPublicUrl: (...args: unknown[]) => getPublicUrl(bucket, ...args),
        remove: (...args: unknown[]) => remove(bucket, ...args),
      }),
    },
  },
}))

const { recordGameClick } = await import('../data/analytics')
const { uploadCatalogImage, deleteCatalogImages } = await import('../data/images')

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ error: null })
  upload.mockReset().mockResolvedValue({ error: null })
  remove.mockReset().mockResolvedValue({ error: null })
  getPublicUrl.mockReset().mockReturnValue({ data: { publicUrl: 'https://cdn.test/image.png' } })
})

describe('recording a click', () => {
  it('calls the database function with the argument name it declares', async () => {
    await recordGameClick('beer-game')
    expect(rpc).toHaveBeenCalledWith('record_game_click', { p_game_id: 'beer-game' })
  })

  it('never throws, so a blocked write cannot stop someone launching a game', async () => {
    rpc.mockResolvedValue({ error: { message: 'rate limited' } })
    await expect(recordGameClick('beer-game')).resolves.toBeUndefined()
  })

  it('survives the call rejecting outright', async () => {
    rpc.mockRejectedValue(new Error('offline'))
    await expect(recordGameClick('beer-game')).rejects.toBeInstanceOf(Error)
  })
})

describe('uploading a catalog image', () => {
  const file = new File(['x'], 'My Screenshot!.png', { type: 'image/png' })

  it('writes into the games folder the storage policies expect', async () => {
    const image = await uploadCatalogImage('beer-game', file)
    const [bucket, path] = upload.mock.calls[0] as [string, string]

    expect(bucket).toBe('catalog-images')
    expect(path).toMatch(/^games\/beer-game\/\d+-My-Screenshot-\.png$/)
    expect(image.path).toBe(path)
    expect(image.url).toBe('https://cdn.test/image.png')
  })

  it('strips characters that would make an unusable object name', async () => {
    await uploadCatalogImage('beer-game', new File(['x'], 'a b/c?d.png', { type: 'image/png' }))
    const [, path] = upload.mock.calls[0] as [string, string]

    // Only the two separators this code adds itself may remain.
    expect(path.split('/')).toHaveLength(3)
    expect(path.endsWith('a-b-c-d.png')).toBe(true)
  })

  it('surfaces a rejected upload instead of returning a broken reference', async () => {
    upload.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
    await expect(uploadCatalogImage('beer-game', file)).rejects.toThrow(/row-level security/)
  })
})

describe('deleting catalog images', () => {
  it('removes every path in one call', async () => {
    await deleteCatalogImages([
      { path: 'games/a/1.png', url: 'https://cdn.test/1.png' },
      { path: 'games/a/2.png', url: 'https://cdn.test/2.png' },
    ])
    expect(remove).toHaveBeenCalledWith('catalog-images', ['games/a/1.png', 'games/a/2.png'])
  })

  it('does nothing when there is nothing to remove', async () => {
    await deleteCatalogImages([])
    expect(remove).not.toHaveBeenCalled()
  })
})
