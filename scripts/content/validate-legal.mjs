// Legal-page validator. Run after a build:  node scripts/content/validate-legal.mjs [--dist <dir>]
//
// Runs as part of `npm run build` (package.json), so a broken legal page or footer link fails the build, and with it
// the Cloudflare build, before anything is deployed. Checks the built output only, so it is independent of the
// indexing switch. No dependencies.
//
// 1. The four pages exist (/privacy, /cookies, /el/privacy, /el/cookies), in the right language, with one h1 and h2
//    section headings only, a dated version (<time datetime>), and a contents list whose anchors all resolve.
// 2. Their text is complete: no draft markers ([OWNER INPUT], [LEGAL REVIEW], TODO …), the approved operator name and
//    address, a working mailto: link to the privacy contact, and a link to the other policy in the same language.
// 3. Every built page carries both policy links in its footer, in its own language.
// 4. The street address appears on the Privacy pages only (the footer shows the town, not the address).
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

const PAGES = [
  { file: 'privacy.html', lang: 'en', h1: 'Privacy Policy', other: '/cookies', name: 'Ioannis Kimoundris', street: '30 Chr. Brokoumi Street' },
  { file: 'cookies.html', lang: 'en', h1: 'Cookies Policy', other: '/privacy', name: 'Ioannis Kimoundris' },
  // Greek: the surname stem, which matches the nominative (Κιμούντρης) and the genitive/accusative (Κιμούντρη).
  { file: 'el/privacy.html', lang: 'el', h1: 'Πολιτική Απορρήτου', other: '/el/cookies', name: 'Κιμούντρη', street: 'Χρ. Μπρωκούμη 30' },
  { file: 'el/cookies.html', lang: 'el', h1: 'Πολιτική Cookies', other: '/el/privacy', name: 'Κιμούντρη' },
];
const STREETS = ['30 Chr. Brokoumi Street', 'Χρ. Μπρωκούμη 30', 'Brokoumi', 'Μπρωκούμη'];
const DRAFT = /\[OWNER|\[LEGAL|OWNER INPUT|LEGAL REVIEW|\bTODO\b|\bTBD\b|lorem ipsum|\{\{|\}\}|placeholder/i;
const greek = /[Ͱ-Ͽἀ-῿]/;
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const main = (h) => (h.match(/<main[\s\S]*?<\/main>/) || [''])[0];
const footer = (h) => (h.match(/<footer[\s\S]*?<\/footer>/) || [''])[0];

for (const p of PAGES) {
  const file = path.join(dist, p.file);
  if (!fs.existsSync(file)) {
    failures.push(`${p.file}: missing (run the build first, or pass --dist <build directory>)`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const body = main(html);
  const h1 = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]).trim());
  check((html.match(/<html lang="([^"]+)"/) || [])[1] === p.lang, `${p.file}: html lang is not "${p.lang}"`);
  check(h1.length === 1 && h1[0] === p.h1, `${p.file}: expected one h1 "${p.h1}", found ${JSON.stringify(h1)}`);
  check(!/<h[3-6][\s>]/.test(body), `${p.file}: only h2 section headings are expected below the h1`);
  const h2 = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]).trim());
  check(h2.length >= 5, `${p.file}: ${h2.length} sections, expected at least 5`);
  for (const h of h2) check(p.lang === 'el' ? greek.test(h) : !greek.test(h), `${p.file}: section heading in the wrong language: "${h}"`);
  check(/<time datetime="\d{4}-\d{2}-\d{2}"/.test(body), `${p.file}: no dated version (<time datetime>)`);
  // Contents list: every #anchor resolves to an element id on the page.
  const anchors = [...body.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  check(anchors.length === h2.length, `${p.file}: contents list has ${anchors.length} entries for ${h2.length} sections`);
  for (const a of anchors) check(new RegExp(`id="${a}"`).test(body), `${p.file}: contents link #${a} has no target`);
  // Text: complete, approved facts, contact, cross-link.
  const t = text(body);
  check(!DRAFT.test(t), `${p.file}: draft marker in the text: "${(t.match(DRAFT) || [''])[0]}"`);
  check(t.includes(p.name), `${p.file}: operator name "${p.name}" missing`);
  check(/href="mailto:info@techpi\.eu"/.test(body), `${p.file}: no mailto:info@techpi.eu link`);
  check(body.includes(`href="${p.other}"`), `${p.file}: no link to the other policy (${p.other})`);
  if (p.street) check(t.includes(p.street), `${p.file}: registered address "${p.street}" missing`);
}

// Every page: both policy links in the footer, in the page's language; the street address only on Privacy pages.
const htmlFiles = [];
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(dist, d), { withFileTypes: true })) {
    const rel = path.posix.join(d, e.name);
    if (e.isDirectory()) walk(rel);
    else if (rel.endsWith('.html')) htmlFiles.push(rel);
  }
};
if (fs.existsSync(dist)) walk('');
check(htmlFiles.length > 0, `no HTML files in ${dist}`);
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(dist, f), 'utf8');
  const el = f.startsWith('el/');
  const foot = footer(html);
  for (const target of el ? ['/el/privacy', '/el/cookies'] : ['/privacy', '/cookies']) {
    check(foot.includes(`href="${target}"`), `${f}: footer has no link to ${target}`);
  }
  const isPrivacy = f === 'privacy.html' || f === 'el/privacy.html';
  if (!isPrivacy) for (const s of STREETS) check(!html.includes(s), `${f}: street address "${s}" outside the Privacy page`);
}

if (failures.length) {
  console.log(failures.map((f) => `FAIL ${f}`).join('\n'));
  console.log(`\nLegal page validation: ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(`Legal page validation: ${checks} checks, 0 failures (4 legal pages; footer links on ${htmlFiles.length} pages).`);
