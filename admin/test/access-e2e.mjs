// End-to-end check of the Access gate in Cloudflare's local runtime (workerd via `wrangler dev`), using Wrangler's
// documented `access.dev` simulation. Local only: nothing is deployed and no real Access or identity is involved.
// Run: node test/access-e2e.mjs   (needs `npm run build -- --mode demo --outDir dist-demo` first)
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeConfigs } from './make-wrangler-configs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = (p) => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' }) : p.kill('SIGTERM'); } catch {} };

let failures = 0;
for (const c of writeConfigs()) {
  const proc = spawn(process.execPath, [wrangler, 'dev', '--config', c.file, '--log-level', 'error'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));
  let res = null;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try { res = await fetch(`http://127.0.0.1:${c.port}/`, { signal: AbortSignal.timeout(3000) }); break; } catch { await sleep(1000); }
  }
  const lines = [];
  if (!res) { failures++; console.log(`FAIL ${c.name}: Worker did not start within 60 s\n${log.slice(-800)}`); kill(proc); continue; }
  const body = await res.text();
  const ok = res.status === c.expect && (c.expect === 200 ? /<html/i.test(body) : !/type="module"/.test(body));
  lines.push(`${ok ? 'PASS' : 'FAIL'} ${c.name.padEnd(12)} GET / -> ${res.status} (want ${c.expect}) csp=${res.headers.get('content-security-policy') ? 'yes' : 'no'} x-robots=${res.headers.get('x-robots-tag')}`);
  if (!ok) failures++;
  // A static asset must be gated exactly like the page (run_worker_first).
  const asset = await fetch(`http://127.0.0.1:${c.port}/techpi-symbol.png`).catch(() => null);
  const assetOk = asset && asset.status === c.expect;
  lines.push(`${assetOk ? 'PASS' : 'FAIL'} ${c.name.padEnd(12)} GET /techpi-symbol.png -> ${asset?.status} (want ${c.expect})`);
  if (!assetOk) failures++;
  if (c.expect === 200) {
    const post = await fetch(`http://127.0.0.1:${c.port}/`, { method: 'POST', body: 'x' }).catch(() => null);
    const postOk = post && post.status === 405;
    lines.push(`${postOk ? 'PASS' : 'FAIL'} ${c.name.padEnd(12)} POST / -> ${post?.status} (want 405)`);
    if (!postOk) failures++;
  }
  console.log(lines.join('\n'));
  kill(proc);
  await sleep(1500);
}
console.log(`\nAccess gate e2e: ${failures} failures`);
process.exit(failures ? 1 : 0);
