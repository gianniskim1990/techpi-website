import { defaultLocale, locales, type Locale } from './locales';

/**
 * The single route map. The language switch, hreflang, canonical URLs and internal links
 * all read from here, so they cannot disagree with each other or with the real routes.
 *
 * URL policy (docs/production/routes.md): no trailing slash on normal pages,
 * and the two language roots keep theirs ("/" and "/el/").
 * Never derive these from Astro.url: with build.format "preserve" it contains ".html".
 */
export const pages = ['home', 'work', 'capabilities', 'euProjects', 'about', 'contact'] as const;
export type PageKey = (typeof pages)[number];

/**
 * The pages shown in the visible navigation: the header, the mobile menu and the footer, in order.
 *
 * EU Projects is deliberately NOT listed. /eu-projects and /el/eu-projects exist as route shells, but no EU-project
 * content is approved for publication, so the unfinished page must not be promoted as if it were complete.
 * Add 'euProjects' back here, between 'capabilities' and 'about', when approved content exists
 * (docs/production/launch-blockers.md). The route, its redirects and its dictionary entries are unchanged.
 */
export const navPages = ['work', 'capabilities', 'about', 'contact'] as const satisfies readonly PageKey[];

/** Slugs are Latin and identical in both languages. */
const slugs: Record<Exclude<PageKey, 'home'>, string> = {
  work: 'work',
  capabilities: 'capabilities',
  euProjects: 'eu-projects',
  about: 'about',
  contact: 'contact',
};

const prefix = (locale: Locale): string => (locale === defaultLocale ? '' : `/${locale}`);

/** The canonical path of a page in a locale. */
export function pathFor(page: PageKey, locale: Locale): string {
  if (page === 'home') return locale === defaultLocale ? '/' : `/${locale}/`;
  return `${prefix(locale)}/${slugs[page]}`;
}

/** The path of a locale's home page, used where there is no equivalent page (for example a 404). */
export function homePathFor(locale: Locale): string {
  return pathFor('home', locale);
}

export interface Alternate {
  /** The hreflang value: a language code, or "x-default". */
  hreflang: Locale | 'x-default';
  path: string;
}

/** Every language version of a page, plus x-default pointing to the default locale. Reciprocal by construction. */
export function alternatesFor(page: PageKey): Alternate[] {
  const versions: Alternate[] = locales.map((locale) => ({ hreflang: locale, path: pathFor(page, locale) }));
  return [...versions, { hreflang: 'x-default', path: pathFor(page, defaultLocale) }];
}

/** The canonical path of a case study. Case studies are English-only until Phase 3D adds the Greek versions. */
export function caseStudyPath(slug: string, locale: Locale = defaultLocale): string {
  return `${prefix(locale)}/work/${slug}`;
}
