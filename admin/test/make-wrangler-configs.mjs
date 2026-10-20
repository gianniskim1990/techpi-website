// Writes the local-only Wrangler configurations used by test/access-e2e.mjs: the admin Worker run in Cloudflare's
// local runtime with Wrangler's documented `access.dev` simulation (no deployment, no real Access, no real identity).
// Test identities use the reserved .test domain. The generated files are git-ignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const AUD = 'test-aud-0001';
export const cases = [
  { name: 'admin', port: 8911, access: { aud: AUD, identity: { email: 'admin@example.test' } }, vars: { ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.test' }, expect: 200 },
  { name: 'intruder', port: 8912, access: { aud: AUD, identity: { email: 'intruder@example.test' } }, vars: { ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.test' }, expect: 403 },
  { name: 'wrong-aud', port: 8913, access: { aud: 'another-app', identity: { email: 'admin@example.test' } }, vars: { ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.test' }, expect: 403 },
  { name: 'no-access', port: 8914, access: null, vars: { ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.test' }, expect: 403 },
  { name: 'unconfigured', port: 8915, access: { aud: AUD, identity: { email: 'admin@example.test' } }, vars: { ACCESS_AUD: '', ADMIN_EMAILS: '' }, expect: 503 },
];

export function writeConfigs(assetsDir = '../dist-demo') {
  const dir = path.join(here, '.wrangler-e2e');
  fs.mkdirSync(dir, { recursive: true });
  return cases.map((c) => {
    const config = {
      name: `techpi-admin-e2e-${c.name}`,
      main: '../../worker/index.js',
      compatibility_date: '2026-10-02',
      assets: { directory: path.posix.join('..', assetsDir), binding: 'ASSETS', run_worker_first: true, not_found_handling: 'single-page-application' },
      workers_dev: false,
      preview_urls: false,
      vars: c.vars,
      dev: { port: c.port, ip: '127.0.0.1' },
      ...(c.access ? { access: { dev: c.access } } : {}),
    };
    const file = path.join(dir, `wrangler.${c.name}.json`);
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    return { ...c, file };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(writeConfigs().map((c) => c.file).join('\n'));
