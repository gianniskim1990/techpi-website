// End-to-end check in Cloudflare's local runtime (workerd via `wrangler dev`), using Wrangler's documented `access.dev`
// simulation and the GitHub mock over HTTP. Local only: nothing is deployed, no real Access, identity or GitHub.
// Checks the Access gate for the app, its files and the API; then, as the administrator, the whole draft workflow.
// Run: npm run build && node test/access-e2e.mjs        Add --serve to keep the admin case running for a browser check.
import { spawn, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeConfigs } from './make-wrangler-configs.mjs';
import { createMockGitHub } from './support/mock-github.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = (p) => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' }) : p.kill('SIGTERM'); } catch {} };
const serve = process.argv.includes('--serve');

const BASE = 'feat/techpi-admin-m0';
const FILE = 'content/m0-demo/m0-sample-article/index.json';
const sample = fs.readFileSync(path.join(root, '..', FILE), 'utf8');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { [FILE]: sample } } });
const MOCK_PORT = 8920;
const mockServer = await gh.listen(MOCK_PORT);
const configs = writeConfigs({ github: { apiBase: `http://127.0.0.1:${MOCK_PORT}`, appId: gh.appId, installationId: gh.installationId, privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }) } });

let failures = 0;
const lines = [];
const check = (name, ok, detail) => { if (!ok) failures++; lines.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`); };

for (const c of serve ? configs.filter((x) => x.name === 'admin') : configs) {
  const proc = spawn(process.execPath, [wrangler, 'dev', '--config', c.file, '--log-level', 'error'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));
  const origin = `http://127.0.0.1:${c.port}`;
  let res = null;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try { res = await fetch(`${origin}/`, { signal: AbortSignal.timeout(3000) }); break; } catch { await sleep(1000); }
  }
  if (!res) { check(`${c.name}: Worker starts`, false, log.slice(-600)); kill(proc); continue; }
  if (serve) { console.log(`Admin (simulated Access as admin@example.test): ${origin}/  mock GitHub on :${MOCK_PORT}. Ctrl+C to stop.`); await new Promise(() => {}); }

  const body = await res.text();
  check(`${c.name}: GET / -> ${res.status}`, res.status === c.expect && (c.expect === 200 ? /<html/i.test(body) : !/type="module"/.test(body)), `want ${c.expect}, x-robots=${res.headers.get('x-robots-tag')}`);
  const asset = await fetch(`${origin}/techpi-symbol.png`).catch(() => null);
  check(`${c.name}: static file gated -> ${asset?.status}`, asset?.status === c.expect);
  const api = { 'X-TechPi-Admin': '1' };
  const s = await fetch(`${origin}/api/session`, { headers: api }).catch(() => null);
  check(`${c.name}: GET /api/session -> ${s?.status}`, s?.status === c.expect);

  if (c.expect === 200) {
    const sess = await s.json();
    check('admin: session email is the Access identity', sess.email === 'admin@example.test' && sess.github.configured === true, JSON.stringify(sess));
    const post = await fetch(`${origin}/`, { method: 'POST', body: 'x' });
    check(`admin: POST / -> ${post.status}`, post.status === 405);
    const cross = await fetch(`${origin}/api/m0-demo/m0-sample-article/draft`, { method: 'POST', headers: { ...api, Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
    check(`admin: cross-origin save -> ${cross.status}`, cross.status === 403);
    const noHeader = await fetch(`${origin}/api/m0-demo`);
    check(`admin: API without the admin header -> ${noHeader.status}`, noHeader.status === 403);

    const list = await (await fetch(`${origin}/api/m0-demo`, { headers: api })).json();
    check('admin: list reads the demo entry through the Worker', list.entries?.[0]?.slug === 'm0-sample-article', JSON.stringify(list).slice(0, 200));
    const entry = await (await fetch(`${origin}/api/m0-demo/m0-sample-article`, { headers: api })).json();
    const content = structuredClone(entry.content);
    content.en.title = 'M0 sample article, edited end to end';
    const save = async (expectedSha) => fetch(`${origin}/api/m0-demo/m0-sample-article/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, expectedSha }) });
    const r1 = await save(entry.sha);
    const d1 = await r1.json();
    check(`admin: first save -> ${r1.status}, draft PR #${d1.draft?.number}`, r1.status === 200 && d1.draft?.draft === true && d1.draft.branch === 'cms/m0-demo/m0-sample-article');
    content.en.summary = 'Second save, same draft pull request.';
    const r2 = await save(d1.sha);
    const d2 = await r2.json();
    check(`admin: second save updates PR #${d2.draft?.number}`, r2.status === 200 && d2.draft?.number === d1.draft?.number && gh.state.prs.length === 1);
    const stale = await save(entry.sha);
    check(`admin: stale save -> ${stale.status}`, stale.status === 409);
    check('admin: main and the base branch unchanged', gh.fileOn('main', 'README.md') === 'main' && gh.fileOn(BASE, FILE) === sample);
    check('admin: every write went to the draft branch', gh.state.writes.every((w) => w.branch === 'cms/m0-demo/m0-sample-article'), `${gh.state.writes.length} writes`);
    check('admin: Worker log has no credentials', !/ghs_|PRIVATE KEY|Bearer /.test(log));
  }
  kill(proc);
  await sleep(1500);
}
mockServer.close();
console.log(lines.join('\n'));
console.log(`\nLocal end-to-end (workerd + simulated Access + mock GitHub): ${failures} failures`);
process.exit(failures ? 1 : 0);
