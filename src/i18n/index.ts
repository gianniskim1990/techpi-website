import { el } from './el';
import { en, type Dictionary } from './en';
import type { Locale } from './locales';

const dictionaries: Record<Locale, Dictionary> = { en, el };

/** The dictionary for a locale. Locale is always explicit: it comes from the route, never from the browser. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
