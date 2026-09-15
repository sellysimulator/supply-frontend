import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/app'
import { counterId, truncateToHour, type HourlyCount } from './clickMetrics'

/**
 * Anonymous game-click analytics.
 *
 * A click increments a single counter document per game per hour. Nothing that
 * could identify a visitor is written or read: no name, email, UID, cookie,
 * session id or address. The only facts recorded are *which* game was opened
 * and *in which hour*.
 *
 * firestore.rules allows an unauthenticated client to create a counter at 1 or
 * raise it by exactly 1, and nothing else — App Check is what makes repeating
 * that write expensive for a bot.
 */

const CLICK_COUNTS = 'clickCounts'

export * from './clickMetrics'

/**
 * Records one click. Deliberately best-effort: a blocked or failed analytics
 * write must never stop someone launching a game, so failures are logged and
 * swallowed.
 */
export async function recordGameClick(gameId: string): Promise<void> {
  const now = new Date()
  try {
    await setDoc(
      doc(db, CLICK_COUNTS, counterId(gameId, now)),
      {
        gameId,
        hour: Timestamp.fromDate(truncateToHour(now)),
        clickCount: increment(1),
      },
      { merge: true },
    )
  } catch (error) {
    console.warn('Could not record game click', error)
  }
}

function toHourlyCount(snapshot: QueryDocumentSnapshot<DocumentData>): HourlyCount {
  const data = snapshot.data()
  return {
    gameId: data.gameId,
    hour: (data.hour as Timestamp).toDate(),
    clickCount: data.clickCount ?? 0,
  }
}

/**
 * Every counter from the last `days` days. Administrators only — the rules deny
 * this read to everyone else, including the visitors who wrote the counters.
 */
export async function listRecentClicks(days = 30): Promise<HourlyCount[]> {
  const since = truncateToHour(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
  const snapshot = await getDocs(
    query(collection(db, CLICK_COUNTS), where('hour', '>=', Timestamp.fromDate(since))),
  )
  return snapshot.docs.map(toHourlyCount).sort((a, b) => a.hour.getTime() - b.hour.getTime())
}
