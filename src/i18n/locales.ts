export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];

/** English is the default locale and has no URL prefix. */
export const defaultLocale: Locale = 'en';
