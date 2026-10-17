import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react'

/**
 * Reveals an element the first time it scrolls into view, after an optional
 * stagger delay. The caller turns `revealed` into the `is-in` class that the
 * `.tile-enter` rule in index.css keys off.
 *
 * Reveals immediately — with no observer and no timer — when the reader has asked
 * for reduced motion, and when IntersectionObserver is unavailable. jsdom
 * implements no IntersectionObserver, so under test every tile is revealed on
 * mount and nothing needs stubbing in setup.ts; that same guard is the real
 * production fallback, which is why it is preferred to a stub.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>({
  delayMs = 0,
  rootMargin = '0px 0px -40px 0px',
}: { delayMs?: number; rootMargin?: string } = {}): {
  ref: RefCallback<T>
  revealed: boolean
} {
  const [revealed, setRevealed] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const timerRef = useRef<number | null>(null)

  /* Held in a ref so changing the stagger never tears down the observer, and
     synced in an effect rather than during render. */
  const delayRef = useRef(delayMs)
  useEffect(() => {
    delayRef.current = delayMs
  }, [delayMs])

  const ref = useCallback<RefCallback<T>>(
    (node) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!node) return

      const skip =
        typeof IntersectionObserver === 'undefined' ||
        (typeof window !== 'undefined' &&
          (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false))

      if (skip) {
        setRevealed(true)
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            observer.unobserve(entry.target)
            timerRef.current = window.setTimeout(() => setRevealed(true), delayRef.current)
          }
        },
        { rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [rootMargin],
  )

  useEffect(
    () => () => {
      observerRef.current?.disconnect()
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return { ref, revealed }
}
