import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
  /** Re-runs the loader; used by the retry action on error states. */
  reload: () => void
}

/**
 * Runs an async loader and exposes loading/error/data in one shape, so every
 * page renders the same LoadingSection / ErrorState / EmptyState trio instead
 * of inventing its own.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error(String(cause)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // `loader` is intentionally excluded: callers pass an inline closure, and
    // the explicit `deps` list is what decides when a reload is needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
