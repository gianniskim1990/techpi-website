// Canonical-redirect validator. Run after a build:  node scripts/content/validate-redirects.mjs [--dist <dir>]
//
// Runs as part of `npm run build` (package.json). Reads dist/_redirects (copied from public/_redirects) and the built
// pages only, so the published routes come from the build itself, not from a list kept here. No dependencies.
//
// 1. Every rule is "<source> <target> 301": no other status, no wildcard, no splat, no placeholder, no external target.
// 2. No duplicate source. No rule on a canonical URL (a built page). No chain: no target is itself a source. No loop.
// 3. Every target is a canonical URL that the build serves (a built page), so a redirect never lands on a 404.
// 4. Every published case study (dist/work/<slug>.html and dist/el/work/<slug>.html), and every Insights page, has
//    exactly its two rules: "<path>/" and "<path>.html", both 301 to "<path>". Case studies: 18 x 2 languages x 2 = 72.
// 5. No rule for a case study that is not published (an unknown slug keeps its 404).
//
// Behaviour at the edge (301, Location, query string kept, canonical 200, unknown 404) is checked separately against a
// running server: scripts/redirects/verify-live.mjs. Astro dev and astro preview do not apply _redirects.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const i = args.indexOf('--dist');
const dist = i >= 0 ? path.resolve(args[i + 1]) : path.join(root, 'dist');
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

const file = path.join(dist, '_redirects');
if (!fs.existsSync(file)) {
  console.log(`FAIL ${file} not found: run the build first, or pass --dist <build directory>.`);
  process.exit(1);
}

// The canonical URLs the build serves: every HTML file except the 404s.
const pages = new Set();
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(dist, d), { withFileTypes: true })) {
    const rel = path.posix.join(d, e.name);
    if (e.isDirectory()) walk(rel);
    else if (rel.endsWith('.html') && !rel.endsWith('404.html')) pages.add('/' + rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''));
  }
};
walk('');

const rules = fs
  .readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));

// 1, 2, 3.
const sources = new Map();
for (const r of rules) {
  const [from, to, status] = r;
  check(r.length === 3 && status === '301', `rule "${r.join(' ')}": expected "<source> <target> 301"`);
  check(/^\/[^\s*:]*$/.test(from) && /^\/[^\s*:]*$/.test(to), `rule "${r.join(' ')}": source and target must be plain site paths`);
  check(!sources.has(from), `duplicate source ${from}`);
  sources.set(from, to);
  check(!pages.has(from), `${from} is a canonical URL and must not redirect`);
  check(pages.has(to), `${from} -> ${to}: the target is not a page the build serves`);
}
for (const [from, to] of sources) check(!sources.has(to), `chain: ${from} -> ${to} -> ${sources.get(to)}`);

// 4 and 5. The published case studies and the Insights pages, read from the build.
const caseStudies = [...pages].filter((p) => /^\/(el\/)?work\/[^/]+$/.test(p));
const en = caseStudies.filter((p) => !p.startsWith('/el/')).map((p) => p.slice('/work/'.length)).sort();
const el = caseStudies.filter((p) => p.startsWith('/el/')).map((p) => p.slice('/el/work/'.length)).sort();
check(en.length > 0 && JSON.stringify(en) === JSON.stringify(el), `case studies differ between languages: en ${en.length}, el ${el.length}`);
const insights = [...pages].filter((p) => p === '/insights' || p.startsWith('/insights/'));
let caseRules = 0;
for (const p of [...caseStudies, ...insights]) {
  for (const variant of [`${p}/`, `${p}.html`]) {
    check(sources.get(variant) === p, `missing or wrong rule: ${variant} -> ${p} 301 (found ${sources.get(variant) ?? 'none'})`);
    if (caseStudies.includes(p) && sources.get(variant) === p) caseRules++;
  }
}
const caseSources = [...sources.keys()].filter((s) => /^\/(el\/)?work\/[^/]+(\/|\.html)$/.test(s));
check(caseSources.length === caseStudies.length * 2, `${caseSources.length} case-study rules, expected ${caseStudies.length * 2}`);
for (const s of caseSources) check(caseStudies.includes(s.replace(/(\/|\.html)$/, '')), `${s}: rule for a case study that is not published`);

if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log(`\nRedirect validation: ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(
  `Redirect validation: ${checks} checks, 0 failures (${rules.length} rules; ${en.length} case studies x 2 languages: ${caseRules} case-study rules; ${insights.length} Insights pages).`,
);
