import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

/**
 * Translations for the whole interface. Every visible string lives in
 * `locales/<language>.json`; components read them through `useTranslation()`
 * and never hold English text of their own.
 *
 * The two files must carry exactly the same keys — `src/__tests__/i18n.test.ts`
 * fails the build if they drift apart, which is how a forgotten translation is
 * caught rather than shipped as a silent fallback to English.
 */

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/** Where the reader's choice is remembered, alongside the theme's key. */
export const LANGUAGE_STORAGE_KEY = 'supply-language'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    // `es-MX` and `es-ES` are served the `es` bundle rather than falling back
    // to English.
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    // React escapes interpolated values already.
    interpolation: { escapeValue: false },
  })

/** Keeps <html lang> honest, which is what screen readers and translation
 *  tools read to choose a voice and a dictionary. */
function applyDocumentLanguage(language: string) {
  document.documentElement.lang = language.split('-')[0] ?? 'en'
}

i18n.on('languageChanged', applyDocumentLanguage)
applyDocumentLanguage(i18n.resolvedLanguage ?? 'en')

export default i18n
