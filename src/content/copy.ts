import type { Locale } from '../i18n/locales';
import { homeEl } from './home.el';
import { homeEn, type HomeCopy } from './home.en';
import { pagesEl } from './pages.el';
import { pagesEn, type PagesCopy } from './pages.en';

/** Page copy by language. Locale is always explicit: it comes from the route, never from the browser. */
export const homeCopy: Record<Locale, HomeCopy> = { en: homeEn, el: homeEl };
export const pagesCopy: Record<Locale, PagesCopy> = { en: pagesEn, el: pagesEl };
