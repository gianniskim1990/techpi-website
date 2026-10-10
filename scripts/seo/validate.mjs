/**
 * Validates the search and sharing metadata of a finished build. Run from the repository root after a build:
 *
 *   node scripts/seo/validate.mjs              checks dist/ as a normal build: every page must be noindex
 *   node scripts/seo/validate.mjs --indexable  checks a PUBLIC_ALLOW_INDEXING=true build: the content pages
 *                                              must be indexable, the 404s must not
 *   --dist <dir>                               another output directory
 *
 * No dependency: plain string and regular-expression parsing of Astro's own output, which is regular. Exits 1 on
 * any failure. The expected route list is written out here on purpose, independent of src/i18n/routes.ts, so a
 * route that disappears or appears by accident is caught. Rules: docs/production/seo.md.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const expectIndexable = args.includes('--indexable');
const distIndex = args.indexOf('--dist');
const DIST = distIndex >= 0 ? args[distIndex + 1] : 'dist';
const ORIGIN = 'https://techpi.eu';

// Every project on the Work page has a case study, in the order of the Work page (src/content/projects.ts).
const CASE_STUDIES = [
  'rocketeer', 'armans', 'logotherapia-xanthi', 'mavie', 'iliastech', 'alexandra-apartment', 'blackjack-streetwear',
  'saloon', 'physio', 'project4you', 'rantevo',
  'level-up-education-app',
  'level-up-education', 'itsallaboutxanthi', 'local-xanthi', 'juliette-coffee-roasters', 'apox-fc', 'emoved',
];
const CONTENT = ['/', '/work', ...CASE_STUDIES.map((slug) => `/work/${slug}`), '/capabilities', '/eu-projects', '/about', '/contact'];
const ROUTES = [...CONTENT.map((p) => ({ path: p, locale: 'en' })), ...CONTENT.map((p) => ({ path: p === '/' ? '/el/' : `/el${p}`, locale: 'el' }))];
const NOT_FOUND = [
  { file: '404.html', locale: 'en' },
  { file: 'el/404.html', locale: 'el' },
];
const counterpart = (p) => (p === '/' ? '/el/' : p === '/el/' ? '/' : p.startsWith('/el/') ? p.slice(3) : `/el${p}`);
const fileFor = (p) => (p === '/' ? 'index.html' : p === '/el/' ? 'el/index.html' : `${p.slice(1)}.html`);
const OG_LOCALE = { en: 'en_US', el: 'el_GR' };
const FORBIDDEN_TYPES = ['Review', 'AggregateRating', 'FAQPage', 'SearchAction', 'Product', 'SoftwareApplication', 'Article', 'Rating'];
const FORBIDDEN_KEYS = ['sameAs', 'foundingDate', 'numberOfEmployees', 'legalName', 'vatID', 'taxID', 'award', 'aggregateRating', 'review', 'potentialAction'];
const LEAKS = [/localhost/i, /127\.0\.0\.1/, /workers\.dev/i, /pages\.dev/i, /pigiota314\.(eu|gr|com)/i];

let failures = 0;
let checks = 0;
const fail = (where, msg) => {
  failures++;
  console.log(`FAIL ${where}: ${msg}`);
};
const check = (cond, where, msg) => {
  checks++;
  if (!cond) fail(where, msg);
};

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : undefined;
};

function parse(html) {
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';
  const metas = [...head.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]);
  const links = [...head.matchAll(/<link\s[^>]*>/g)].map((m) => m[0]);
  const metaAll = (key, value) => metas.filter((t) => attr(t, key) === value).map((t) => attr(t, 'content'));
  const meta = (key, value) => metaAll(key, value)[0];
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] || '';
  return {
    lang: (html.match(/<html lang="([^"]*)"/) || [])[1],
    title: decode((head.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
    titles: (head.match(/<title>/g) || []).length,
    description: meta('name', 'description'),
    descriptions: metaAll('name', 'description').length,
    robots: metaAll('name', 'robots'),
    canonicals: links.filter((t) => attr(t, 'rel') === 'canonical').map((t) => attr(t, 'href')),
    alternates: links.filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang')).map((t) => ({ hreflang: attr(t, 'hreflang'), href: attr(t, 'href') })),
    og: (p) => meta('property', `og:${p}`),
    ogAll: (p) => metaAll('property', `og:${p}`),
    tw: (p) => meta('name', `twitter:${p}`),
    ld,
    h1: (body.match(/<h1[\s>]/g) || []).length,
    head,
  };
}

function allNodes(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => allNodes(v, out));
  else if (value && typeof value === 'object') {
    out.push(value);
    Object.values(value).forEach((v) => allNodes(v, out));
  }
  return out;
}

const read = (rel) => fs.readFileSync(path.join(DIST, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(DIST, rel));

// --- Content pages ---
const seenTitles = new Map();
const seenDescriptions = new Map();
const idsByPage = new Map();
let indexableCount = 0;

for (const route of ROUTES) {
  const where = route.path;
  const file = fileFor(route.path);
  if (!exists(file)) {
    fail(where, `missing ${file}`);
    continue;
  }
  const html = read(file);
  const p = parse(html);
  const url = ORIGIN + route.path;

  check(p.lang === route.locale, where, `lang="${p.lang}", expected ${route.locale}`);
  check(p.titles === 1 && p.title.length > 0, where, 'exactly one non-empty <title>');
  check(p.title.length <= 70, where, `title is ${p.title.length} characters (over 70)`);
  check(/TechPi/.test(p.title), where, 'title names TechPi');
  check(p.descriptions === 1 && p.description, where, 'exactly one meta description');
  if (p.description) check(p.description.length >= 70 && p.description.length <= 200, where, `description is ${p.description.length} characters (70 to 200)`);
  check(p.h1 === 1, where, `${p.h1} h1 elements, expected 1`);

  // Robots: exactly one tag in a normal build, none in an indexable one.
  if (expectIndexable) {
    check(p.robots.length === 0, where, `robots meta present in an indexable build: ${p.robots.join(' / ')}`);
    if (p.robots.length === 0) indexableCount++;
  } else {
    check(p.robots.length === 1 && p.robots[0] === 'noindex, nofollow', where, `robots must be "noindex, nofollow", got ${JSON.stringify(p.robots)}`);
  }

  // Canonical: one, absolute, self-referencing, production origin, no query or fragment.
  check(p.canonicals.length === 1, where, `${p.canonicals.length} canonical links`);
  check(p.canonicals[0] === url, where, `canonical ${p.canonicals[0]}, expected ${url}`);

  // hreflang: en, el, x-default; reciprocal; x-default is the English page.
  const alt = Object.fromEntries(p.alternates.map((a) => [a.hreflang, a.href]));
  check(p.alternates.length === 3, where, `${p.alternates.length} hreflang links, expected 3`);
  const enPath = route.locale === 'en' ? route.path : counterpart(route.path);
  const elPath = route.locale === 'el' ? route.path : counterpart(route.path);
  check(alt.en === ORIGIN + enPath, where, `hreflang en ${alt.en}`);
  check(alt.el === ORIGIN + elPath, where, `hreflang el ${alt.el}`);
  check(alt['x-default'] === ORIGIN + enPath, where, `x-default ${alt['x-default']}`);
  const other = parse(read(fileFor(counterpart(route.path))));
  const back = other.alternates.find((a) => a.hreflang === route.locale);
  check(back && back.href === url, where, 'the counterpart page links back (reciprocal hreflang)');

  // Open Graph and Twitter.
  check(p.og('type') === 'website', where, 'og:type website');
  check(p.og('site_name') === 'TechPi', where, 'og:site_name');
  check(p.og('title') === p.title, where, 'og:title matches the title');
  check(p.og('description') === p.description, where, 'og:description matches the description');
  check(p.og('url') === url, where, `og:url ${p.og('url')}`);
  check(p.og('locale') === OG_LOCALE[route.locale], where, `og:locale ${p.og('locale')}`);
  const altLocales = p.ogAll('locale:alternate');
  check(altLocales.length === 1 && altLocales[0] === OG_LOCALE[route.locale === 'en' ? 'el' : 'en'], where, `og:locale:alternate ${altLocales}`);
  const image = p.og('image');
  check(image === `${ORIGIN}/og/techpi-${route.locale}.png`, where, `og:image ${image}`);
  if (image && image.startsWith(ORIGIN)) check(exists(image.slice(ORIGIN.length + 1)), where, `og:image file missing in the build: ${image}`);
  check(p.og('image:width') === '1200' && p.og('image:height') === '630', where, 'og:image size 1200 x 630');
  check(Boolean(p.og('image:alt')), where, 'og:image:alt');
  check(p.tw('card') === 'summary_large_image', where, 'twitter:card summary_large_image');
  check(p.tw('title') === p.title && p.tw('description') === p.description, where, 'twitter title and description');
  check(p.tw('image') === image, where, 'twitter:image');
  check(!/twitter:(site|creator)/.test(p.head), where, 'no Twitter handle (none is confirmed)');

  // JSON-LD: one block, valid JSON, the expected nodes, nothing invented.
  check(p.ld.length === 1, where, `${p.ld.length} JSON-LD blocks`);
  let graph = [];
  try {
    const data = JSON.parse(p.ld[0] || 'null');
    check(data && data['@context'] === 'https://schema.org' && Array.isArray(data['@graph']), where, 'JSON-LD has @context and @graph');
    graph = data['@graph'] || [];
  } catch (e) {
    fail(where, `JSON-LD does not parse: ${e.message}`);
  }
  const byType = (t) => graph.filter((n) => n['@type'] === t);
  const org = byType('Organization')[0];
  check(org && org['@id'] === `${ORIGIN}/#organization` && org.url === `${ORIGIN}/` && org.name === 'TechPi', where, 'Organization node');
  if (org) {
    check(org.email === 'info@techpi.eu' && org.telephone === '+30 697 594 6984', where, 'Organization contact facts');
    const logo = org.logo && org.logo.url;
    check(logo === `${ORIGIN}/techpi-logo.png` && exists('techpi-logo.png'), where, `Organization logo ${logo}`);
  }
  const site = byType('WebSite')[0];
  check(site && site['@id'] === `${ORIGIN}/#website` && site.publisher && site.publisher['@id'] === `${ORIGIN}/#organization`, where, 'WebSite node linked to the Organization');
  const page = graph.find((n) => n['@id'] === `${url}#webpage`);
  check(page && page.url === url && page.name === p.title && page.description === p.description && page.inLanguage === route.locale, where, 'WebPage node: url, name, description, inLanguage');
  if (page) check(page.isPartOf && page.isPartOf['@id'] === `${ORIGIN}/#website`, where, 'WebPage isPartOf the WebSite');
  const isCase = /\/work\/./.test(route.path);
  const crumbs = byType('BreadcrumbList')[0];
  if (isCase) {
    const items = crumbs ? crumbs.itemListElement : [];
    check(items.length === 3, where, 'breadcrumb Home, Work, case study');
    check(items[0] && items[0].item === ORIGIN + (route.locale === 'el' ? '/el/' : '/') && items[1] && items[1].item === ORIGIN + (route.locale === 'el' ? '/el/work' : '/work') && items[2] && items[2].item === url, where, 'breadcrumb URLs');
    check(page && page.breadcrumb && page.breadcrumb['@id'] === `${url}#breadcrumb`, where, 'WebPage links its breadcrumb');
  } else check(!crumbs, where, 'no breadcrumb outside the case studies');
  const services = byType('Service');
  const wantServices = route.path.endsWith('/capabilities') ? 4 : route.path.endsWith('/eu-projects') ? 2 : 0;
  check(services.length === wantServices, where, `${services.length} Service nodes, expected ${wantServices}`);
  for (const s of services) check(s.provider && s.provider['@id'] === `${ORIGIN}/#organization` && s.name && s.description, where, `Service ${s['@id']} has name, description and provider`);
  const nodes = allNodes(graph);
  for (const n of nodes) {
    if (FORBIDDEN_TYPES.includes(n['@type'])) fail(where, `forbidden schema type ${n['@type']}`);
    for (const k of FORBIDDEN_KEYS) if (k in n) fail(where, `forbidden schema property ${k}`);
  }
  checks++;
  // Every @id is on the production origin, and every reference resolves within the page's graph.
  const ids = new Set(graph.map((n) => n['@id']).filter(Boolean));
  for (const n of nodes) {
    if (n['@id'] && !String(n['@id']).startsWith(`${ORIGIN}/`)) fail(where, `@id not on ${ORIGIN}: ${n['@id']}`);
    if (n['@id'] && Object.keys(n).length === 1 && !ids.has(n['@id']) && !nodes.some((m) => m !== n && m['@id'] === n['@id'] && Object.keys(m).length > 1)) fail(where, `unresolved reference ${n['@id']}`);
  }
  checks++;
  idsByPage.set(where, ids);

  // URL hygiene in the head: absolute production URLs only, no development or preview origin.
  for (const re of LEAKS) check(!re.test(p.head), where, `head contains ${re}`);
  for (const u of p.head.matchAll(/(?:content|href)="(https?:\/\/[^"]+)"/g)) check(u[1].startsWith(`${ORIGIN}/`), where, `URL off the production origin: ${u[1]}`);
  check(!/[?#]/.test(p.canonicals[0] || '') , where, 'canonical has no query or fragment');

  const dupT = seenTitles.get(p.title);
  check(!dupT, where, `title duplicates ${dupT}`);
  seenTitles.set(p.title, where);
  const dupD = seenDescriptions.get(p.description);
  check(!dupD, where, `description duplicates ${dupD}`);
  seenDescriptions.set(p.description, where);
}

// The Organization and WebSite @ids are the same on every page.
const orgIds = new Set([...idsByPage.values()].map((s) => [...s].filter((i) => /#(organization|website)$/.test(i)).sort().join(',')));
check(orgIds.size === 1, 'schema', 'Organization and WebSite @ids identical on every page');

// --- 404 pages: never indexable, no canonical, no hreflang, no sharing metadata, right language ---
for (const nf of NOT_FOUND) {
  if (!exists(nf.file)) {
    fail(nf.file, 'missing');
    continue;
  }
  const p = parse(read(nf.file));
  check(p.lang === nf.locale, nf.file, `lang ${p.lang}`);
  check(p.robots.length === 1 && p.robots[0] === 'noindex, nofollow', nf.file, `robots ${JSON.stringify(p.robots)} (must be noindex in every build)`);
  check(p.canonicals.length === 0, nf.file, 'no canonical');
  check(p.alternates.length === 0, nf.file, 'no hreflang');
  check(!p.og('url') && p.ld.length === 0, nf.file, 'no og:url and no JSON-LD');
  check(p.h1 === 1, nf.file, 'one h1');
}

// --- Every built HTML file is either a known route or a 404 ---
const htmlFiles = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(path.join(DIST, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else if (e.name.endsWith('.html')) htmlFiles.push(rel);
  }
};
walk('');
const known = new Set([...ROUTES.map((r) => fileFor(r.path)), ...NOT_FOUND.map((n) => n.file)]);
check(htmlFiles.length === ROUTES.length + NOT_FOUND.length, 'build', `${htmlFiles.length} HTML files, expected ${ROUTES.length + NOT_FOUND.length}`);
for (const f of htmlFiles) check(known.has(f), 'build', `unexpected page ${f}`);

// --- Sitemap ---
if (!exists('sitemap.xml')) fail('sitemap.xml', 'missing');
else {
  const xml = read('sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  check(xml.startsWith('<?xml') && xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9'), 'sitemap.xml', 'XML sitemap namespace');
  check(locs.length === ROUTES.length, 'sitemap.xml', `${locs.length} URLs, expected ${ROUTES.length}`);
  check(new Set(locs).size === locs.length, 'sitemap.xml', 'no duplicate URL');
  const expected = new Set(ROUTES.map((r) => ORIGIN + r.path));
  for (const l of locs) check(expected.has(l), 'sitemap.xml', `unexpected URL ${l}`);
  for (const e of expected) check(locs.includes(e), 'sitemap.xml', `missing URL ${e}`);
  check(!/<lastmod>/.test(xml), 'sitemap.xml', 'no lastmod (no real dates exist)');
  for (const re of LEAKS) check(!re.test(xml), 'sitemap.xml', `contains ${re}`);
}

// --- robots.txt ---
if (!exists('robots.txt')) fail('robots.txt', 'missing');
else {
  const txt = read('robots.txt');
  const lines = txt.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  check(lines.includes('User-agent: *') && lines.includes('Allow: /'), 'robots.txt', 'allows all crawling (so noindex can be read)');
  check(!lines.some((l) => /^Disallow:\s*\S/i.test(l)), 'robots.txt', 'no Disallow rule');
  check(lines.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt', 'references the sitemap');
  check(!lines.some((l) => /^User-agent:\s*[^\s*]/i.test(l)), 'robots.txt', 'no crawler-specific rules (AI crawler policy is undecided)');
}

// --- Assets ---
for (const f of ['og/techpi-en.png', 'og/techpi-el.png']) {
  if (!exists(f)) {
    fail(f, 'missing');
    continue;
  }
  const b = fs.readFileSync(path.join(DIST, f));
  check(b.readUInt32BE(16) === 1200 && b.readUInt32BE(20) === 630, f, 'PNG is 1200 x 630');
  check(b.length < 300 * 1024, f, `${b.length} bytes (under 300 KB)`);
}
check(!fs.existsSync(path.join(DIST, 'brand-source')), 'build', 'no brand-source master shipped');

console.log(
  `\nSEO validation (${expectIndexable ? 'indexable build' : 'normal build'}, ${DIST}): ${checks} checks, ${failures} failures.` +
    (expectIndexable ? ` Indexable content pages: ${indexableCount} of ${ROUTES.length}.` : failures ? '' : ' Every page noindex.'),
);
process.exit(failures ? 1 : 0);
