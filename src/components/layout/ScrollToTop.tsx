import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Returns to the top of the page on navigation, so a route change does not
 *  land the reader halfway down the next page. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
