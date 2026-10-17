// Runtime redirect check against a running server: the local Cloudflare runtime (`npx wrangler dev`) or a Preview URL.
//
//   node scripts/redirects/verify-live.mjs --base http://127.0.0.1:8787 [--dist dist]
//
// Not part of the build (it needs a server). Astro dev and astro preview do not apply public/_redirects, so they are not
// valid targets for this check. For every rule in <dist>/_redirects:
//   - the source answers 301 with a Location that resolves to the rule's target on the same origin (one hop);
//   - with a query string, the Location keeps it unchanged;
//   - the target answers 200 (no second redirect, no 404).
// Then unknown case-study and Insights slugs, in both forms, answer 404 (not a redirect to the homepage).
// GET only. Exits 1 on any failure. No dependencies.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg('--base');
const dist = arg('--dist', 'dist');
if (!base) {
  console.log('Usage: node scripts/redirects/verify-live.mjs --base <origin> [--dist <dir>]');
  process.exit(2);
}
const origin = new URL(base).origin;
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };
const get = (p) => fetch(origin + p, { redirect: 'manual', headers: { 'user-agent': 'techpi-redirect-check' } });

const rules = fs
  .readFileSync(path.join(dist, '_redirects'), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));

const targets = new Set();
let caseRules = 0;
for (const [from, to] of rules) {
  for (const query of ['', '?ref=check&x=1']) {
    const res = await get(from + query);
    const loc = res.headers.get('location');
    const resolved = loc ? new URL(loc, origin + from) : null;
    check(res.status === 301, `${from}${query}: status ${res.status}, expected 301`);
    check(
      resolved && resolved.origin === origin && resolved.pathname === to && resolved.search === query,
      `${from}${query}: Location ${loc}, expected ${to}${query}`,
    );
    await res.arrayBuffer().catch(() => {});
  }
  if (/^\/(el\/)?work\/[^/]+(\/|\.html)$/.test(from)) caseRules++;
  targets.add(to);
}
for (const to of targets) {
  const res = await get(to);
  check(res.status === 200, `${to}: status ${res.status}, expected 200 (a target must be the final URL)`);
  await res.arrayBuffer().catch(() => {});
}
for (const p of ['/work/not-a-case-study', '/work/not-a-case-study/', '/work/not-a-case-study.html', '/el/work/not-a-case-study', '/el/work/not-a-case-study/', '/insights/not-an-article', '/el/insights']) {
  const res = await get(p);
  check(res.status === 404, `${p}: status ${res.status}, expected 404`);
  await res.arrayBuffer().catch(() => {});
}

if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log(`\nLive redirect check (${origin}): ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(`Live redirect check (${origin}): ${checks} checks, 0 failures (${rules.length} rules, ${caseRules} case-study rules, each with and without a query string; ${targets.size} targets 200; unknown slugs 404).`);
