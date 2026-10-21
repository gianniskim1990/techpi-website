// Checks the 16 built page versions (8 pages x EN/EL, in dist/) against their content files: the title and meta
// description, the self canonical, the hreflang pair and x-default, Open Graph (type, URL, title, description, locale),
// the JSON-LD page node's name and description, and the sitemap entry. Run after the site build, from the repository root:
//   node admin/scripts/verify-pages-output.mjs [--dist <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, PATHS } from '../shared/page-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const at = args.indexOf('--dist');
const dist = at >= 0 ? path.resolve(args[at + 1]) : path.join(root, 'dist');
const ORIGIN = 'https://techpi.eu';
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (h, attr, name) => { const m = h.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? dec(m[1]) : null; };
const fileOf = (p) => (p === '/' ? 'index.html' : p === '/el/' ? 'el/index.html' : `${p.slice(1)}.html`);
let checks = 0;
const fails = [];
const ck = (ok, msg) => { checks++; if (!ok) fails.push(msg); };
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');

for (const { key } of PAGES) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, 'content', 'pages', key, 'index.json'), 'utf8'));
  for (const locale of ['en', 'el']) {
    const p = PATHS[key][locale];
    const url = ORIGIN + p;
    const where = `${key} (${locale}) ${p}`;
    const h = fs.readFileSync(path.join(dist, fileOf(p)), 'utf8');
    const seo = doc[locale].seo;
    ck(new RegExp(`<html lang="${locale}"`).test(h), `${where}: lang`);
    ck(dec(h.match(/<title>([^<]*)<\/title>/)[1]) === seo.title, `${where}: title`);
    ck(meta(h, 'name', 'description') === seo.description, `${where}: meta description`);
    ck((h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] === url, `${where}: canonical`);
    ck(h.includes(`<link rel="alternate" hreflang="en" href="${ORIGIN}${PATHS[key].en}">`) && h.includes(`<link rel="alternate" hreflang="el" href="${ORIGIN}${PATHS[key].el}">`) && h.includes(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}${PATHS[key].en}">`), `${where}: hreflang pair and x-default`);
    ck(meta(h, 'property', 'og:title') === seo.title && meta(h, 'property', 'og:description') === seo.description && meta(h, 'property', 'og:url') === url, `${where}: Open Graph title, description, URL`);
    ck(meta(h, 'property', 'og:type') === 'website' && meta(h, 'property', 'og:locale') === (locale === 'el' ? 'el_GR' : 'en_US'), `${where}: Open Graph type and locale`);
    const graph = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] ?? [j]; });
    // The page node (WebPage, or CollectionPage / AboutPage / ContactPage where the page is one), by its #webpage id.
    const page = graph.find((n) => n['@id'] === `${url}#webpage`);
    ck(Boolean(page) && /Page$/.test(page['@type']) && page.url === url && page.name === seo.title && page.description === seo.description && page.inLanguage === locale, `${where}: JSON-LD page node`);
    ck(sitemap.includes(`<loc>${url}</loc>`), `${where}: in the sitemap`);
  }
}
console.log(`Page output check: ${checks} checks, ${fails.length} failures (8 pages, 16 language versions).`);
for (const f of fails) console.log('  FAIL ' + f);
process.exit(fails.length ? 1 : 0);
