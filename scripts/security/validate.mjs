/**
 * Checks the security properties of a finished build. Run from the repository root after a build:
 *
 *   node scripts/security/validate.mjs [--dist <dir>]
 *
 * No dependency. Exits 1 on any failure. What and why: docs/production/security.md.
 * - Every page carries Astro's CSP <meta>, early enough to cover the body, with no 'unsafe-inline' or 'unsafe-eval'
 *   for scripts and styles. Inline style attributes (style-src-attr) are the only relaxation, and that is checked.
 * - Every inline script and <style> block in the page matches a hash in that page's policy.
 * - _headers carries the agreed headers on /* (note: Cloudflare does not apply them to 404 responses), the noindex rule only on the *.workers.dev host pattern, no global
 *   X-Robots-Tag, and no HSTS (that is a launch decision for the custom domain).
 * - Nothing that must not ship is in the output: source maps, env files, Markdown, the brand masters.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const i = args.indexOf('--dist');
const DIST = i >= 0 ? args[i + 1] : 'dist';

let checks = 0;
let failures = 0;
const check = (cond, where, msg) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL ${where}: ${msg}`);
  }
};

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(path.join(DIST, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else files.push(rel);
  }
};
walk('');

// --- Pages ---
const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`;
const pages = files.filter((f) => f.endsWith('.html'));
// 6 pages and 18 case studies in each of two languages (48), and a 404 per language.
check(pages.length === 50, 'build', `${pages.length} pages, expected 50`);
for (const f of pages) {
  const html = fs.readFileSync(path.join(DIST, f), 'utf8');
  const metas = [...html.matchAll(/<meta http-equiv="content-security-policy" content="([^"]*)">/g)].map((m) => m[1]);
  check(metas.length === 1, f, `${metas.length} CSP meta elements`);
  if (metas.length !== 1) continue;
  const policy = Object.fromEntries(
    metas[0].split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
      const [name, ...values] = d.split(/\s+/);
      return [name, values];
    }),
  );
  check(policy['default-src']?.join(' ') === "'self'", f, `default-src ${policy['default-src']}`);
  check(policy['object-src']?.join(' ') === "'none'", f, 'object-src none');
  check(policy['base-uri']?.join(' ') === "'self'", f, 'base-uri self');
  for (const d of ['script-src', 'style-src']) {
    const v = policy[d] || [];
    check(v.includes("'self'"), f, `${d} allows 'self'`);
    check(!v.some((x) => /unsafe-(inline|eval|hashes)|^\*$|^https?:$|^data:$/.test(x)), f, `${d} has no unsafe or wildcard source: ${v.join(' ')}`);
  }
  check(!policy['script-src-attr'] && !policy['script-src-elem'] && !policy['style-src-elem'], f, 'no script/style element or script attribute override');
  check(policy['style-src-attr']?.join(' ') === "'unsafe-inline'", f, "style-src-attr 'unsafe-inline' (build-time style attributes)");
  // The meta comes before the body, and every executable inline script after it, and every <style>, is hashed.
  const metaAt = html.indexOf('http-equiv="content-security-policy"');
  check(metaAt > 0 && metaAt < html.indexOf('<body'), f, 'CSP meta inside <head>');
  for (const m of html.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)) {
    if (m.index < metaAt) continue; // the head bootstrap precedes the policy; see security.md
    check(policy['script-src'].includes(sha(m[1])), f, `inline script not hashed: ${m[1].slice(0, 50)}`);
  }
  for (const m of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) check(policy['style-src'].includes(sha(m[1])), f, `<style> not hashed: ${m[1].slice(0, 50)}`);
  check(!/\son[a-z]+="/.test(html), f, 'no inline event handler attribute');
  check(!/<script[^>]+src="(https?:)?\/\//.test(html), f, 'no third-party script');
  check(!/fonts\.(googleapis|gstatic)\.com|googletagmanager|google-analytics|gtag\(|fbq\(|plausible|hotjar|clarity\.ms/.test(html), f, 'no third-party font, analytics or pixel');
}

// --- _headers ---
const headersFile = path.join(DIST, '_headers');
check(fs.existsSync(headersFile), '_headers', 'present in the build');
if (fs.existsSync(headersFile)) {
  const rules = [];
  let current;
  for (const raw of fs.readFileSync(headersFile, 'utf8').split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) rules.push((current = { pattern: raw.trim(), headers: {} }));
    else {
      const [name, ...rest] = raw.trim().split(':');
      current.headers[name.trim().toLowerCase()] = rest.join(':').trim();
    }
  }
  const all = rules.find((r) => r.pattern === '/*');
  const h = all ? all.headers : {};
  check(h['x-content-type-options'] === 'nosniff', '_headers', 'X-Content-Type-Options nosniff');
  check(h['referrer-policy'] === 'strict-origin-when-cross-origin', '_headers', 'Referrer-Policy');
  check(h['x-frame-options'] === 'DENY', '_headers', 'X-Frame-Options DENY');
  check(/frame-ancestors 'none'/.test(h['content-security-policy'] || ''), '_headers', "CSP frame-ancestors 'none'");
  check(!/script-src|style-src|default-src/.test(h['content-security-policy'] || ''), '_headers', 'header CSP leaves scripts and styles to the hashed meta policy');
  check(/camera=\(\)/.test(h['permissions-policy'] || ''), '_headers', 'Permissions-Policy');
  check(h['cross-origin-opener-policy'] === 'same-origin', '_headers', 'COOP same-origin');
  const robots = rules.filter((r) => 'x-robots-tag' in r.headers);
  check(robots.length === 1 && robots[0].pattern === 'https://:worker.:account.workers.dev/*', '_headers', `X-Robots-Tag only on the *.workers.dev host rule: ${robots.map((r) => r.pattern)}`);
  check(!rules.some((r) => 'strict-transport-security' in r.headers), '_headers', 'no HSTS before the custom domain is validated');
  check(!rules.some((r) => 'access-control-allow-origin' in r.headers), '_headers', 'no CORS allowance');
}

// --- What must not ship ---
const forbidden = files.filter((f) => /\.(map|md|mdx|ts|env|log|psd|ai|zip)$|(^|\/)\.env|(^|\/)\.dev\.vars|brand-source|node_modules|(^|\/)\./.test(f));
check(forbidden.length === 0, 'build', `files that must not ship: ${forbidden.join(', ')}`);
check(!files.some((f) => f.endsWith('.js') && /sourceMappingURL/.test(fs.readFileSync(path.join(DIST, f), 'utf8'))), 'build', 'no source map reference');

console.log(`\nSecurity validation (${DIST}): ${checks} checks, ${failures} failures.`);
process.exit(failures ? 1 : 0);
