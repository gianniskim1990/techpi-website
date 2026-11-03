// Canonical redirects for content pages, generated at build time (Task M5).
//
// Every case study (/work/<slug>, /el/work/<slug>) and every Insights article (/insights/<slug>) answers its two other
// forms, "<path>/" and "<path>.html", with a 301 to "<path>" (routes.md; Cloudflare's automatic handling alone would
// answer 307). These pages come from content files that the admin can create, so their rules are written from the
// finished build, not kept by hand in public/_redirects. The rules of every other page stay in public/_redirects.
//
// Called by the build (astro.config.mjs, astro:build:done). scripts/content/validate-redirects.mjs then checks the result
// like any other rule: exactly two per page, 301, no chain, every target a built page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SECTIONS = ['work', 'el/work', 'insights'];
const MARK = '# Case studies and Insights articles: generated at build time from the built pages (scripts/redirects/page-rules.mjs).';

/** The content pages in a build: /work/<slug>, /el/work/<slug>, /insights/<slug>, sorted. */
export function contentPages(dist) {
  const out = [];
  for (const section of SECTIONS) {
    const dir = path.join(dist, section);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) if (f.endsWith('.html')) out.push(`/${section}/${f.slice(0, -'.html'.length)}`);
  }
  return out;
}

/** Appends the two rules of each content page to dist/_redirects, skipping a source that already has a rule. `dist`: a
 *  path or a file: URL (as Astro passes it). Returns the number of rules written. */
export function writePageRules(dist) {
  if (dist instanceof URL) dist = fileURLToPath(dist);
  const file = path.join(dist, '_redirects');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const sources = new Set(current.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]));
  const rules = [];
  for (const p of contentPages(dist)) for (const variant of [`${p}/`, `${p}.html`]) if (!sources.has(variant)) rules.push(`${variant} ${p}  301`);
  if (!rules.length) return 0;
  fs.writeFileSync(file, `${current.replace(/\s*$/, '\n')}${MARK}\n${rules.join('\n')}\n`);
  return rules.length;
}
