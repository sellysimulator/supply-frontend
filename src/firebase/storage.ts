import type { FirebaseStorage } from 'firebase/storage'
import { app } from './app'
import { useEmulators } from './config'

let instance: Promise<FirebaseStorage> | null = null

/**
 * Cloud Storage is only ever touched by the administration area, so the SDK is
 * loaded on demand rather than shipped to every visitor who opens the catalog.
 */
export function getStorageInstance(): Promise<FirebaseStorage> {
  if (!instance) {
    instance = import('firebase/storage').then(({ getStorage, connectStorageEmulator }) => {
      const storage = getStorage(app)
      if (useEmulators) {
        connectStorageEmulator(storage, '127.0.0.1', 9199)
      }
      return storage
    })
  }
  return instance
}
