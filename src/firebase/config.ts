/**
 * Firebase settings come from the environment rather than a committed literal,
 * because App Check already requires `VITE_RECAPTCHA_SITE_KEY` to be supplied
 * that way — one mechanism for one concern. Copy `.env.example` to `.env` and
 * paste the values from the Firebase console.
 *
 * These identifiers are not secrets; access is controlled by Security Rules and
 * App Check, not by hiding the config.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in the Firebase web app config.`,
    )
  }
  return value
}

export const firebaseConfig = {
  apiKey: required('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: required('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: required('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: required(
    'VITE_FIREBASE_STORAGE_BUCKET',
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: required(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: required('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
}

/** Optional — only present once Analytics is enabled in the console. */
export const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID

export const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

/** App Check debug token for local development, printed by the SDK on first run. */
export const appCheckDebugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN

/** When true, the app talks to the local emulator suite instead of production. */
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'
