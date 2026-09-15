import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { ADMIN_UID, VISITOR_UID, counterId, createTestEnv, currentHour, validGame } from './helpers'

/**
 * These tests are the real specification of who can do what in Supply. The
 * React app hides the admin interface, but only these rules prevent a
 * hand-written client from writing to the catalog or forging analytics.
 */
let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await createTestEnv()
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'admins', ADMIN_UID), { email: 'admin@example.com', addedAt: new Date() })
    await setDoc(doc(db, 'games', 'beer-game'), validGame())
    await setDoc(doc(db, 'games', 'draft-game'), validGame({ published: false }))
  })
})

const anon = () => testEnv.unauthenticatedContext().firestore()
const visitor = () => testEnv.authenticatedContext(VISITOR_UID).firestore()
const admin = () => testEnv.authenticatedContext(ADMIN_UID).firestore()

describe('games — public read access', () => {
  it('lets anyone read a published game', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'games', 'beer-game')))
  })

  it('hides unpublished games from the public', async () => {
    await assertFails(getDoc(doc(anon(), 'games', 'draft-game')))
  })

  it('allows a catalog query constrained to published games', async () => {
    const q = query(collection(anon(), 'games'), where('published', '==', true))
    await assertSucceeds(getDocs(q))
  })

  it('rejects an unconstrained listing of the catalog', async () => {
    await assertFails(getDocs(collection(anon(), 'games')))
  })

  it('rejects a query that asks for unpublished games', async () => {
    const q = query(collection(anon(), 'games'), where('published', '==', false))
    await assertFails(getDocs(q))
  })

  it('lets an admin read an unpublished game', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'games', 'draft-game')))
  })
})

describe('games — write access', () => {
  it('refuses catalog writes from anonymous visitors', async () => {
    await assertFails(setDoc(doc(anon(), 'games', 'new-game'), validGame()))
  })

  it('refuses catalog writes from a signed-in non-admin', async () => {
    await assertFails(setDoc(doc(visitor(), 'games', 'new-game'), validGame()))
  })

  it('refuses a non-admin publishing an existing game', async () => {
    await assertFails(updateDoc(doc(visitor(), 'games', 'draft-game'), { published: true }))
  })

  it('refuses a non-admin deleting a game', async () => {
    await assertFails(deleteDoc(doc(visitor(), 'games', 'beer-game')))
  })

  it('lets an admin create a valid game', async () => {
    await assertSucceeds(
      setDoc(doc(admin(), 'games', 'new-game'), {
        ...validGame(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('lets an admin delete a game', async () => {
    await assertSucceeds(deleteDoc(doc(admin(), 'games', 'beer-game')))
  })

  it('rejects a game whose launch URL is not https', async () => {
    await assertFails(
      setDoc(doc(admin(), 'games', 'insecure'), {
        ...validGame({ launchUrl: 'http://example.com/game' }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('rejects a game with an unknown field', async () => {
    await assertFails(
      setDoc(doc(admin(), 'games', 'extra-field'), {
        ...validGame({ isFeatured: true }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('rejects a game whose maximum players is below its minimum', async () => {
    await assertFails(
      setDoc(doc(admin(), 'games', 'bad-range'), {
        ...validGame({ minPlayers: 8, maxPlayers: 2 }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })
})

describe('admins — role storage', () => {
  it('lets a user check their own role', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'admins', ADMIN_UID)))
  })

  it("refuses reading someone else's role", async () => {
    await assertFails(getDoc(doc(visitor(), 'admins', ADMIN_UID)))
  })

  it('refuses listing the administrators', async () => {
    await assertFails(getDocs(collection(admin(), 'admins')))
  })

  it('refuses self-promotion to administrator', async () => {
    await assertFails(
      setDoc(doc(visitor(), 'admins', VISITOR_UID), {
        email: 'x@example.com',
        addedAt: new Date(),
      }),
    )
  })

  it('refuses an existing admin adding another admin from the client', async () => {
    await assertFails(
      setDoc(doc(admin(), 'admins', 'someone-else'), {
        email: 'y@example.com',
        addedAt: new Date(),
      }),
    )
  })
})

describe('clickCounts — anonymous analytics', () => {
  const hour = currentHour()
  const id = counterId('beer-game', hour)

  const seedCounter = async (count: number, docId = id) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'clickCounts', docId), {
        gameId: docId.split('_')[0],
        hour,
        clickCount: count,
      })
    })
  }

  it('lets an anonymous visitor open a counter at one', async () => {
    await assertSucceeds(
      setDoc(doc(anon(), 'clickCounts', id), { gameId: 'beer-game', hour, clickCount: 1 }),
    )
  })

  it('lets an anonymous visitor increment an existing counter by one', async () => {
    await seedCounter(41)
    await assertSucceeds(
      setDoc(
        doc(anon(), 'clickCounts', id),
        { gameId: 'beer-game', hour, clickCount: increment(1) },
        { merge: true },
      ),
    )
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDoc(doc(context.firestore(), 'clickCounts', id))
      expect(snapshot.data()?.clickCount).toBe(42)
    })
  })

  it('refuses a counter that opens above one', async () => {
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', id), { gameId: 'beer-game', hour, clickCount: 500 }),
    )
  })

  it('refuses an increment larger than one', async () => {
    await seedCounter(10)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', id), { gameId: 'beer-game', hour, clickCount: 9999 }),
    )
  })

  it('refuses decrementing a counter', async () => {
    await seedCounter(10)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', id), { gameId: 'beer-game', hour, clickCount: 9 }),
    )
  })

  it('refuses changing which game a counter belongs to', async () => {
    await seedCounter(10)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', id), { gameId: 'other-game', hour, clickCount: 11 }),
    )
  })

  it('refuses smuggling an extra field into a counter', async () => {
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', id), {
        gameId: 'beer-game',
        hour,
        clickCount: 1,
        visitorId: 'abc-123',
      }),
    )
  })

  it('refuses a counter whose id does not match its game', async () => {
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', counterId('other-game', hour)), {
        gameId: 'beer-game',
        hour,
        clickCount: 1,
      }),
    )
  })

  it('refuses a counter for a game that does not exist', async () => {
    const missing = counterId('no-such-game', hour)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', missing), {
        gameId: 'no-such-game',
        hour,
        clickCount: 1,
      }),
    )
  })

  it('refuses a counter for an unpublished game', async () => {
    const draft = counterId('draft-game', hour)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', draft), { gameId: 'draft-game', hour, clickCount: 1 }),
    )
  })

  it('refuses back-dating a counter to an old hour', async () => {
    const old = new Date(hour.getTime() - 48 * 60 * 60 * 1000)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', counterId('beer-game', old)), {
        gameId: 'beer-game',
        hour: old,
        clickCount: 1,
      }),
    )
  })

  it('refuses an hour that is not truncated to the hour', async () => {
    const skewed = new Date(hour.getTime() + 37 * 60 * 1000)
    await assertFails(
      setDoc(doc(anon(), 'clickCounts', counterId('beer-game', hour)), {
        gameId: 'beer-game',
        hour: skewed,
        clickCount: 1,
      }),
    )
  })

  it('keeps the counters unreadable by the public', async () => {
    await seedCounter(10)
    await assertFails(getDoc(doc(anon(), 'clickCounts', id)))
    await assertFails(getDocs(collection(anon(), 'clickCounts')))
  })

  it('keeps the counters unreadable by a signed-in non-admin', async () => {
    await seedCounter(10)
    await assertFails(getDocs(collection(visitor(), 'clickCounts')))
  })

  it('lets an admin read the counters', async () => {
    await seedCounter(10)
    await assertSucceeds(getDocs(collection(admin(), 'clickCounts')))
  })

  it('refuses deleting a counter, even as an admin', async () => {
    await seedCounter(10)
    await assertFails(deleteDoc(doc(anon(), 'clickCounts', id)))
    await assertFails(deleteDoc(doc(admin(), 'clickCounts', id)))
  })
})

describe('unknown collections', () => {
  it('denies reads and writes outside the modelled collections', async () => {
    await assertFails(getDoc(doc(anon(), 'secrets', 'x')))
    await assertFails(setDoc(doc(admin(), 'secrets', 'x'), { value: 1 }))
  })
})
