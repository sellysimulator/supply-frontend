import { app } from './app'
import { measurementId, useEmulators } from './config'

/**
 * Google Analytics for site-level traffic. Supply's own admin dashboard reports
 * game launches from Firestore; page-level traffic is read in the Firebase
 * console instead, which is the only place a static frontend can get it from
 * without a backend API.
 *
 * Loaded on demand so the Analytics SDK never blocks first paint.
 */
export async function initSiteAnalytics(): Promise<void> {
  if (!measurementId || useEmulators) return

  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    if (await isSupported()) getAnalytics(app)
  } catch {
    /* Analytics is non-essential; never let it break the page. */
  }
}
