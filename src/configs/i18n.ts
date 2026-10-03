export const i18n = {
  defaultLocale: 'en',

  // *** DX edit
  locales: ['en'],
  langDirection: {
    en: 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
