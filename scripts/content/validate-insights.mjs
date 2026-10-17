// Insights validator. Run after a build:  node scripts/content/validate-insights.mjs [--dist <dir>]
//
// Runs as part of `npm run build` (package.json), so a broken or incomplete Insights page fails the build, and with it
// the Cloudflare build, before anything is deployed. Reads the built output only. No dependencies.
//
// The expected articles are written out here on purpose, independent of src/content/insights.ts: the legacy slug, the
// date the source page displays, and the section headings of the source article (pigiota314.eu/insights, read in full
// on 2026-10-16; docs/content/insights-migration.md). So an article that loses a section, a slug or its date fails.
//
// 1. The index and the seven articles exist at /insights and /insights/<legacy slug>; nothing else under insights/,
//    and no Greek Insights page anywhere (English only, routes.md section 4.1).
// 2. Each article: English, one h1, a real body (every source section heading present, and more than the lead), the
//    source date in a <time>, a link back to /insights, no draft or placeholder text, no reading time, no author line.
// 3. The index lists the seven articles in the source order, each card linking to its own article.
// 4. Canonicals are self-referencing; no hreflang; the language switch offers the Greek EU Projects page as a labelled
//    fallback, never a Greek article; no page in the build links to /el/insights.
// 5. No analytics, tag manager or third-party script on any page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const i = args.indexOf('--dist');
const dist = i >= 0 ? path.resolve(args[i + 1]) : path.join(root, 'dist');
const ORIGIN = 'https://techpi.eu';
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

const SOURCE = [
  { slug: 'what-every-eu-project-website-should-include', date: '2025-09-12', headings: ['Start from the project’s communication objectives', 'The structural minimum', 'Long-term dissemination, not just launch'] },
  { slug: 'common-mistakes-in-horizon-europe-project-websites', date: '2025-08-21', headings: ['Treating the website as a one-off deliverable', 'Overloaded homepages', 'Hidden deliverables and publications'] },
  { slug: 'how-to-structure-deliverables-and-publications', date: '2025-07-18', headings: ['Start with the content model', 'Design for browsing, not just searching'] },
  { slug: 'accessibility-considerations-for-project-websites', date: '2025-06-09', headings: ['Accessibility is part of the brief', 'Where teams usually fall short'] },
  { slug: 'preparing-a-website-brief-during-the-proposal-stage', date: '2025-05-14', headings: ['Describe the website as a working tool'] },
  { slug: 'what-communication-partners-should-ask-a-web-development-supplier', date: '2025-04-22', headings: ['Process and communication', 'Architecture and accessibility'] },
  { slug: 'how-analytics-can-support-dissemination-reporting', date: '2025-03-30', headings: ['Tie metrics to objectives'] },
];
const DRAFT = /lorem ipsum|placeholder|\bTODO\b|\bTBD\b|\[OWNER|coming soon|\{\{|\}\}/i;
const TRACKERS = /googletagmanager|gtag\(|google-analytics|analytics\.js|plausible|matomo|hotjar|clarity\.ms|connect\.facebook|fbq\(/i;

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (h) => decode(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(dist, rel));
const main = (h) => (h.match(/<main[\s\S]*?<\/main>/) || [''])[0];
const head = (h) => (h.match(/<head>([\s\S]*?)<\/head>/) || ['', ''])[1];
const hrefs = (h) => [...h.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => decode(m[1]));

if (!exists('insights.html')) {
  console.log(`FAIL ${path.join(dist, 'insights.html')} not found: run the build first, or pass --dist <build directory>.`);
  process.exit(1);
}

/** Checks shared by the index and the articles: language, canonical, no hreflang, the honest language switch. */
function common(file, pagePath) {
  const html = read(file);
  const h = head(html);
  check(/<html lang="en"/.test(html), `${pagePath}: lang="en"`);
  check((html.match(/<h1[\s>]/g) || []).length === 1, `${pagePath}: one h1`);
  check(h.includes(`<link rel="canonical" href="${ORIGIN}${pagePath}">`), `${pagePath}: self-referencing canonical`);
  check(!/hreflang=/.test(h), `${pagePath}: no hreflang in the head (English only)`);
  check(!/og:locale:alternate/.test(h), `${pagePath}: no og:locale:alternate`);
  // Header and footer switches: EN is this page, ΕΛ is the labelled fallback to the Greek EU Projects page.
  const switches = [...html.matchAll(/<a\b[^>]*hreflang="el"[^>]*>/g)].map((m) => m[0]).filter((a) => /data-fallback/.test(a));
  check(switches.length >= 2, `${pagePath}: the language switch marks Greek as a fallback (${switches.length} switches)`);
  for (const a of switches) {
    check(/href="\/el\/eu-projects"/.test(a), `${pagePath}: Greek fallback goes to /el/eu-projects`);
    check(/aria-label="ΕΛ, Ελληνικά\. Η σελίδα δεν είναι διαθέσιμη στα ελληνικά/.test(a), `${pagePath}: the fallback says, in Greek, that no Greek version exists`);
  }
  check(/Available in English only\./.test(text(main(html))), `${pagePath}: visible English-only notice`);
  check(!DRAFT.test(text(main(html))), `${pagePath}: no draft or placeholder text`);
  return html;
}

// 1. Files.
const built = fs.existsSync(path.join(dist, 'insights')) ? fs.readdirSync(path.join(dist, 'insights')).sort() : [];
const want = SOURCE.map((a) => `${a.slug}.html`).sort();
check(JSON.stringify(built) === JSON.stringify(want), `insights/ holds exactly the seven articles: ${built.join(', ')}`);
check(!exists('el/insights.html') && !exists('el/insights'), 'no Greek Insights page is built');

// 3. Index.
const index = common('insights.html', '/insights');
const cards = [...main(index).matchAll(/<a class="title" href="([^"]+)"/g)].map((m) => m[1]);
check(JSON.stringify(cards) === JSON.stringify(SOURCE.map((a) => `/insights/${a.slug}`)), `/insights: seven cards in source order, each to its article: ${cards.join(' ')}`);

// 2. Articles.
for (const a of SOURCE) {
  const pagePath = `/insights/${a.slug}`;
  const file = `insights/${a.slug}.html`;
  if (!exists(file)) {
    failures.push(`${pagePath}: missing`);
    continue;
  }
  const html = common(file, pagePath);
  const body = main(html);
  const h2 = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
  for (const heading of a.headings) check(h2.includes(heading), `${pagePath}: section "${heading}" present`);
  const sections = [...body.matchAll(/<section aria-labelledby="s\d+-h"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => text(m[1]));
  check(sections.length === a.headings.length, `${pagePath}: ${sections.length} body sections, expected ${a.headings.length}`);
  const words = sections.join(' ').split(' ').length;
  check(words >= 25, `${pagePath}: a real body (${words} words in the sections)`);
  check(sections.every((s) => s.split(' ').length > s.split(' ').slice(0, 9).length), `${pagePath}: every section has text under its heading`);
  check(body.includes(`<time datetime="${a.date}"`),`${pagePath}: the source date ${a.date} shown in a <time>`);
  check(hrefs(body).includes('/insights'), `${pagePath}: links back to /insights`);
  check(!/min read|reading time/i.test(text(body)) && !/\bBy [A-Z][a-z]+ [A-Z][a-z]+/.test(text(body)), `${pagePath}: no reading time or author line`);
  check(/<article\b/.test(body) && /<header class="head"/.test(body), `${pagePath}: semantic <article> with a header`);
  check(!/Pigiota314 can support|Discuss your project/.test(text(body)), `${pagePath}: no legacy pigiota314 call to action`);
  for (const h of hrefs(body).filter((x) => x.startsWith('/insights/'))) check(SOURCE.some((s) => `/insights/${s.slug}` === h), `${pagePath}: related link ${h} resolves`);
}

// 4 and 5. Whole build.
const all = [];
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(dist, d), { withFileTypes: true })) {
    const rel = path.posix.join(d, e.name);
    if (e.isDirectory()) walk(rel);
    else if (rel.endsWith('.html')) all.push(rel);
  }
};
walk('');
for (const f of all) {
  const html = read(f);
  check(!/\/el\/insights/.test(html), `${f}: no link to /el/insights`);
  check(!TRACKERS.test(html), `${f}: no analytics or tag manager`);
  check(!/<script[^>]+src="https?:\/\//.test(html), `${f}: no third-party script`);
}
// The Greek footer and the Greek EU Projects page do not point to English-only articles.
for (const f of all.filter((x) => x.startsWith('el/'))) check(!hrefs(read(f)).some((h) => h.startsWith('/insights')), `${f}: no link to the English-only Insights from a Greek page`);
// The English footer links to the index on every English page.
for (const f of all.filter((x) => !x.startsWith('el/'))) check(/<footer[\s\S]*href="\/insights"[\s\S]*<\/footer>/.test(read(f)), `${f}: English footer links to /insights`);

if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log(`\nInsights validation: ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(`Insights validation: ${checks} checks, 0 failures (index + 7 articles; ${all.length} pages scanned).`);
