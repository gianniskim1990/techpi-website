// Checks the built Insights pages (dist/) against the content files: titles, descriptions, canonicals, Open Graph,
// Article JSON-LD, the displayed date, related links in order, the sitemap, the note's internal link, the index order,
// and that no Greek Insights route exists. Run after the site build, from the repository root:
//   node admin/scripts/verify-insights-output.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSIGHT_SLUGS } from '../shared/insight-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'dist');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (h, attr, name) => { const m = h.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? dec(m[1]) : null; };
let checks = 0;
const fails = [];
const ck = (ok, msg) => { checks++; if (!ok) fails.push(msg); };
const hrefs = (h) => [...h.matchAll(/href="\/insights\/([a-z0-9-]+)"/g)].map((m) => m[1]);

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const index = fs.readFileSync(path.join(dist, 'insights.html'), 'utf8');
ck(JSON.stringify([...new Set(hrefs(index))]) === JSON.stringify(INSIGHT_SLUGS), 'index lists the 7 articles in order');
for (const s of INSIGHT_SLUGS) {
  const d = JSON.parse(fs.readFileSync(path.join(root, 'content', 'insights', s, 'index.json'), 'utf8'));
  const h = fs.readFileSync(path.join(dist, 'insights', `${s}.html`), 'utf8');
  const url = `https://techpi.eu/insights/${s}`;
  ck(dec(h.match(/<title>([^<]*)<\/title>/)[1]) === d.en.meta.title, `${s}: title`);
  ck(meta(h, 'name', 'description') === d.en.meta.description, `${s}: meta description`);
  ck((h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] === url, `${s}: canonical`);
  ck(meta(h, 'property', 'og:type') === 'article' && meta(h, 'property', 'og:url') === url && meta(h, 'property', 'og:title') === d.en.meta.title, `${s}: Open Graph`);
  ck(Boolean(meta(h, 'property', 'article:published_time')?.startsWith(d.facts.published)), `${s}: article:published_time`);
  ck(!/<link rel="alternate" hreflang=/.test(h), `${s}: no hreflang alternates`);
  const ld = JSON.stringify([...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])));
  ck(ld.includes(`"datePublished":"${d.facts.published}`) && ld.includes(JSON.stringify(d.en.title)), `${s}: Article JSON-LD headline and datePublished`);
  ck(new RegExp(`<time datetime="${d.facts.published}"[^>]*>${d.facts.publishedText}</time>`).test(h), `${s}: displayed date`);
  const rel = h.split('class="related-list"')[1] ?? '';
  ck(JSON.stringify(hrefs(rel.split('</ul>')[0])) === JSON.stringify(d.en.related), `${s}: related links in order`);
  ck(sitemap.includes(`<loc>${url}</loc>`), `${s}: in the sitemap`);
  if (d.en.note) ck(/class="note"/.test(h) && h.includes('href="/cookies"'), `${s}: the note and its internal link`);
}
ck(!fs.existsSync(path.join(dist, 'el', 'insights.html')) && !fs.existsSync(path.join(dist, 'el', 'insights')), 'no Greek Insights route');
ck(!sitemap.includes('/el/insights'), 'no Greek Insights URL in the sitemap');
console.log(`Insights output check: ${checks} checks, ${fails.length} failures.`);
for (const f of fails) console.log('  FAIL ' + f);
process.exit(fails.length ? 1 : 0);
