import type { PageKey } from '../i18n/routes';
import { validateDocument } from '../../admin/shared/page-content.js';
import home from '../../content/pages/home/index.json';
import work from '../../content/pages/work/index.json';
import capabilities from '../../content/pages/capabilities/index.json';
import euProjects from '../../content/pages/eu-projects/index.json';
import about from '../../content/pages/about/index.json';
import contact from '../../content/pages/contact/index.json';
import privacy from '../../content/pages/privacy/index.json';
import cookies from '../../content/pages/cookies/index.json';

/**
 * The 8 website pages, managed in the admin since Task M3: one file each, content/pages/<key>/index.json, holding the
 * page's own copy and its search title and description in English and Greek (and, for the legal pages, the version
 * date). Listed explicitly: a file is published only when it is listed here. Every file is validated on every build
 * (admin/shared/page-content.js), so an invalid draft fails the build instead of reaching the site.
 *
 * Shared data keeps its single source of truth and is not in these files: contact facts, operator and registration
 * (site.ts), the capabilities (capabilities.ts), case studies, Insights, the shell labels (i18n) and the copy shared
 * by several pages (pages.en.ts / pages.el.ts: case-study labels and the closing line).
 */
const files = { home, work, capabilities, 'eu-projects': euProjects, about, contact, privacy, cookies } as const;

function checked<T>(key: keyof typeof files): T {
  const doc = files[key];
  const result = validateDocument(doc, key);
  if (!result.ok) throw new Error(`Invalid page content/pages/${key}/index.json:\n  ${result.problems.join('\n  ')}`);
  return doc as unknown as T;
}

export interface PageMetaCopy { seo: { title: string; description: string } }
export interface PageDoc<T> {
  facts: { key: string; pageKey: PageKey; paths: { en: string; el: string }; kind: 'page' | 'legal'; updated?: string; updatedText?: { en: string; el: string } };
  en: T & PageMetaCopy;
  el: T & PageMetaCopy;
}

/** The page files, validated, by the site's page key. */
export const pageDocs = {
  home: checked<PageDoc<Record<string, unknown>>>('home'),
  work: checked<PageDoc<Record<string, unknown>>>('work'),
  capabilities: checked<PageDoc<Record<string, unknown>>>('capabilities'),
  euProjects: checked<PageDoc<Record<string, unknown>>>('eu-projects'),
  about: checked<PageDoc<Record<string, unknown>>>('about'),
  contact: checked<PageDoc<Record<string, unknown>>>('contact'),
  privacy: checked<PageDoc<Record<string, unknown>>>('privacy'),
  cookies: checked<PageDoc<Record<string, unknown>>>('cookies'),
} satisfies Record<PageKey, PageDoc<Record<string, unknown>>>;

/** A page's copy in a language, without its search metadata. */
export function copyOf<T>(page: PageKey, locale: 'en' | 'el', ...drop: string[]): T {
  const { seo: _seo, ...rest } = pageDocs[page][locale];
  for (const k of drop) delete (rest as Record<string, unknown>)[k];
  return rest as unknown as T;
}
