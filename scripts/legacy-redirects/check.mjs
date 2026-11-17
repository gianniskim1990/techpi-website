// Checks the pigiota314.gr -> techpi.eu redirect (docs/launch/PIGIOTA314_GR_REDIRECT.md).
//
//   node scripts/legacy-redirects/check.mjs                       live site, after the upload
//   node scripts/legacy-redirects/check.mjs --base http://127.0.0.1:8080 --local
//                                                                 a local Apache test (Host header set to pigiota314.gr)
//
// For every row of pigiota314-gr.tsv, with and without the trailing slash: 301 straight to the expected techpi.eu URL
// (or 410), the query string dropped, ASCII case ignored. Then: unmapped paths answer 410; robots.txt, wp-login.php and
// the old sitemap keep working. Live only: www and http variants, one hop to a 200 on techpi.eu, the product subdomains
// answer as before (never redirected to techpi.eu).
// GET only. Exits 1 on any failure. No dependencies.
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMap } from './build-htaccess.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const local = args.includes('--local');
const base = new URL(arg('--base', 'https://pigiota314.gr'));
const rows = readMap(path.join(path.dirname(fileURLToPath(import.meta.url)), 'pigiota314-gr.tsv'));

let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

/** One GET, no redirects followed. `host` overrides the Host header (the local test). */
function get(url, host) {
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const req = lib.request(u, { method: 'GET', headers: { host: host || u.host, 'user-agent': 'techpi-redirect-check' }, timeout: 20000 }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location || '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (e) => resolve({ status: 0, location: '', error: e.message }));
    req.end();
  });
}

const enc = (p) => encodeURI(p);
const at = (p, origin = base.origin) => origin + enc(p);
const hostHeader = local ? 'pigiota314.gr' : undefined;

async function expectRule(r, p, origin = base.origin) {
  const res = await get(at(p, origin), hostHeader);
  const label = `${origin}${p}`;
  if (r.status === '410') return check(res.status === 410, `${label}: expected 410, got ${res.status} ${res.location}`);
  check(res.status === 301 && res.location === r.to, `${label}: expected 301 -> ${r.to}, got ${res.status} ${res.location || res.error || ''}`);
}

const variants = (p) => {
  if (p === '/') return ['/'];
  const bare = p.replace(/\/+$/, '');
  return [bare, bare + '/'];
};

// 1. Every mapped path, both forms.
const queue = [];
for (const r of rows) for (const p of variants(r.from)) queue.push(() => expectRule(r, p));
// ASCII case ignored, query string dropped.
const portfolio = rows.find((r) => r.from === '/portfolio/');
queue.push(() => expectRule(portfolio, '/PORTFOLIO/'));
queue.push(async () => {
  const res = await get(at('/portfolio/') + '?utm_source=test&p=1', hostHeader);
  check(res.status === 301 && res.location === portfolio.to, `query string not dropped: ${res.status} ${res.location}`);
});
// 2. Unmapped paths are gone (robots.txt too: a 4xx means "no restrictions", so crawlers always reach the redirects,
// even when the old WordPress fails); what the owner and crawlers still need keeps working.
for (const p of ['/not-a-page/', '/feed/', '/2019/05/01/anything/', '/xmlrpc.php', '/robots.txt']) {
  queue.push(async () => { const res = await get(at(p), hostHeader); check(res.status === 410, `${p}: expected 410, got ${res.status} ${res.location}`); });
}
for (const p of ['/wp-login.php', '/sitemap_index.xml']) {
  queue.push(async () => { const res = await get(at(p), hostHeader); check(res.status === 200, `${p}: expected 200 (kept), got ${res.status} ${res.location}`); });
}

if (!local) {
  // 3. www and http: still one hop to the same target.
  const sample = rows.filter((r) => r.status === '301').filter((_, i) => i % 10 === 0);
  for (const r of sample) {
    queue.push(() => expectRule(r, r.from, 'https://www.pigiota314.gr'));
    queue.push(() => expectRule(r, r.from, 'http://pigiota314.gr'));
    queue.push(() => expectRule(r, r.from, 'http://www.pigiota314.gr'));
  }
  // 4. Each distinct target is a 200 on techpi.eu (no second hop).
  for (const to of new Set(rows.filter((r) => r.status === '301').map((r) => r.to))) {
    queue.push(async () => { const res = await get(to); check(res.status === 200, `target ${to}: expected 200, got ${res.status} ${res.location}`); });
  }
  // 5. Product subdomains and mail web hosts: never sent to techpi.eu.
  for (const sub of ['saloon', 'physio', 'aesthetic', 'business', 'agents', 'airbnb', 'proposal', 'demo', 'hair']) {
    queue.push(async () => {
      const res = await get(`https://${sub}.pigiota314.gr/`);
      check(res.status > 0 && res.status < 500 && !res.location.includes('techpi.eu'), `${sub}.pigiota314.gr: ${res.status} ${res.location || res.error || ''}`);
    });
  }
}

// A few at a time, so the old server is not flooded.
async function run(limit = 4) {
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (i < queue.length) await queue[i++](); }));
}
await run();

console.log(`${checks} checks, ${failures.length} failures`);
for (const f of failures.slice(0, Number(arg("--show", 50)))) console.log('  FAIL ' + f);
if (failures.length > Number(arg("--show", 50))) console.log(`  ... and ${failures.length - Number(arg("--show", 50))} more`);
process.exit(failures.length ? 1 : 0);
