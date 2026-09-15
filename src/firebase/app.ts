import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { appCheckDebugToken, firebaseConfig, recaptchaSiteKey, useEmulators } from './config'

/**
 * Single Firebase entry point. Everything else in the app imports `auth`, `db`
 * from here, so initialisation order — App Check before the first
 * Firestore call — is guaranteed.
 */
export const app = initializeApp(firebaseConfig)

/* ─── App Check ───────────────────────────────────────────────────────────────
   Attests that requests come from this site, which is what keeps the public,
   unauthenticated analytics counters from being driven up by a script. Security
   Rules constrain *what* may be written; App Check constrains *who* may write.

   Locally, set VITE_APPCHECK_DEBUG_TOKEN and register the token in the console
   under App Check → Apps → Manage debug tokens.
   ────────────────────────────────────────────────────────────────────────────*/
if (appCheckDebugToken) {
  // Read by the App Check SDK during initialisation.
  ;(
    globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
  ).FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebugToken
}

if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
} else if (!useEmulators && import.meta.env.PROD) {
  // Fail loudly rather than shipping a build whose analytics writes will be
  // rejected once enforcement is switched on.
  console.error('VITE_RECAPTCHA_SITE_KEY is not set — App Check is disabled for this build.')
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

googleProvider.setCustomParameters({ prompt: 'select_account' })

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  // Storage connects to its emulator inside firebase/storage.ts, where the SDK
  // is loaded on demand.
}
