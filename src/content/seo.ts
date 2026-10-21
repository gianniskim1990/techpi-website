import type { Locale } from '../i18n/locales';
import type { PageKey } from '../i18n/routes';
import type { Project } from './projects';
import { pageDocs } from './pages-content';

/**
 * Search and sharing metadata: the browser title and meta description of every page, in both languages.
 * The same text feeds Open Graph, the Twitter card and the WebPage node of the JSON-LD (src/seo/schema.ts).
 * Strategy and rules: docs/production/seo.md.
 *
 * Rules:
 * - Every description says only what the page itself shows. No metric, result, client claim or endorsement.
 * - Titles name the page first and end with "| TechPi"; the homepage leads with the name.
 * - Greek is written for Greek searches, not translated word for word.
 * - EU Projects: what TechPi builds for EU-funded projects. No implied European Commission endorsement,
 *   accreditation, programme track record or grant consultancy.
 */
export interface PageMeta {
  title: string;
  description: string;
}

/**
 * Since Task M3 each page's title and description live in its file, content/pages/<page>/index.json ("seo" in each
 * language), edited through the admin. The admin and the build apply the same rules as scripts/seo/validate.mjs: the
 * title names TechPi and has at most 70 characters, the description has 70 to 200.
 */
const metaIn = (locale: Locale): Record<PageKey, PageMeta> => ({
  home: pageDocs.home[locale].seo,
  work: pageDocs.work[locale].seo,
  capabilities: pageDocs.capabilities[locale].seo,
  euProjects: pageDocs.euProjects[locale].seo,
  about: pageDocs.about[locale].seo,
  contact: pageDocs.contact[locale].seo,
  privacy: pageDocs.privacy[locale].seo,
  cookies: pageDocs.cookies[locale].seo,
});
export const pageMeta: Record<Locale, Record<PageKey, PageMeta>> = { en: metaIn('en'), el: metaIn('el') };

/**
 * A case study's metadata, from its own published facts: the name and category shown at the top of the page,
 * and the summary shown as its lead. `project` is already in the page's language.
 */
export function caseStudyMeta(project: Project, locale: Locale): PageMeta {
  const full = `${project.name} — ${project.category} | TechPi`;
  // A long category would push the title past what search results show (70 characters): the name and the page's
  // section then, which keeps the two languages distinct.
  const short = `${project.name} | ${locale === 'el' ? 'Έργα' : 'Work'} | TechPi`;
  // Earlier work says so in the description too, so a search result never reads as current TechPi work.
  const origin = project.workGroup === 'earlier' ? (locale === 'el' ? ' Παλαιότερο έργο της pigiota314.' : ' Earlier work by pigiota314.') : '';
  return { title: full.length <= 70 ? full : short, description: project.summary + origin };
}

/**
 * The sharing image, one per language (scripts/brand/derive-social.mjs): the name and the site descriptor in that
 * language. Every page uses its language's image, case studies included (docs/production/seo.md).
 */
export const socialImage = {
  path: { en: '/og/techpi-en.png', el: '/og/techpi-el.png' } satisfies Record<Locale, string>,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: {
    en: 'TECHPI, Digital Products & Technology, beside the TechPi symbol.',
    el: 'TECHPI, Ψηφιακά προϊόντα & τεχνολογία, δίπλα στο σύμβολο της TechPi.',
  } satisfies Record<Locale, string>,
} as const;

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = { en: 'en_US', el: 'el_GR' };
