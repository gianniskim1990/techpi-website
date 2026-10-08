import type { APIRoute } from 'astro';
import { caseStudiesIn } from '../content/projects';
import { locales } from '../i18n/locales';
import { caseStudyPath, pages, pathFor } from '../i18n/routes';

/**
 * The XML sitemap, generated at build time from the same route map as the pages, canonical URLs and hreflang,
 * so it cannot list a URL the site does not serve or miss one it does. Content pages only, in both languages:
 * no 404, no redirect source, no trailing-slash variant. No <lastmod>: the site has no real modification dates,
 * and an invented one is worse than none (docs/production/seo.md).
 *
 * The sitemap is published even while the site is noindex. It is harmless then: every page it lists says noindex.
 */
export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('astro.config.mjs must set `site`.');
  const paths = locales.flatMap((locale) => [
    ...pages.map((page) => pathFor(page, locale)),
    ...caseStudiesIn(locale).map((project) => caseStudyPath(project.slug, locale)),
  ]);
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
