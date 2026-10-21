// Writes the local-only Wrangler configurations used by test/access-e2e.mjs: the admin Worker run in Cloudflare's
// local runtime with Wrangler's documented `access.dev` simulation (no deployment, no real Access, no real identity).
// GitHub is the in-memory mock (test/support/mock-github.mjs) served on 127.0.0.1, with a throwaway key generated for
// the run. Test identities use the reserved .test domain. The generated files are git-ignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const AUD = 'test-aud-0001';
const ok = { ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.test' };
export const cases = [
  { name: 'admin', port: 8911, access: { aud: AUD, identity: { email: 'admin@example.test' } }, vars: ok, expect: 200 },
  { name: 'intruder', port: 8912, access: { aud: AUD, identity: { email: 'intruder@example.test' } }, vars: ok, expect: 403 },
  { name: 'wrong-aud', port: 8913, access: { aud: 'another-app', identity: { email: 'admin@example.test' } }, vars: ok, expect: 403 },
  { name: 'no-access', port: 8914, access: null, vars: ok, expect: 403 },
  { name: 'unconfigured', port: 8915, access: { aud: AUD, identity: { email: 'admin@example.test' } }, vars: { ACCESS_AUD: '', ADMIN_EMAILS: '' }, expect: 503 },
  // A production configuration served anywhere but its own HTTPS hostname (here: local wrangler dev) serves nothing,
  // even to a valid-looking identity: no workers.dev, preview or local exposure (Task M4).
  {
    name: 'production-on-localhost', port: 8916, access: { aud: 'a1b2c3d4'.repeat(8), identity: { email: 'owner@techpi.invalid' } },
    vars: { ACCESS_AUD: 'a1b2c3d4'.repeat(8), ADMIN_EMAILS: 'owner@techpi.invalid' },
    override: { CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main', ADMIN_HOSTNAME: 'admin.techpi.eu', GITHUB_API_BASE: '', ENABLE_TEST_CONTENT: '' }, expect: 503,
  },
];

/** `github`: { apiBase, appId, installationId, privateKey } for the mock, or omitted to leave GitHub unconfigured. */
export function writeConfigs({ assetsDir = '../dist', github } = {}) {
  const dir = path.join(here, '.wrangler-e2e');
  fs.mkdirSync(dir, { recursive: true });
  const gh = github
    ? { GITHUB_API_BASE: github.apiBase, GITHUB_APP_ID: github.appId, GITHUB_APP_INSTALLATION_ID: github.installationId, GITHUB_APP_PRIVATE_KEY: github.privateKey, CONTENT_MODE: 'development', CONTENT_BASE_BRANCH: 'feat/techpi-admin-m4-production-readiness', ENABLE_TEST_CONTENT: 'true' }
    : {};
  return cases.map((c) => {
    const config = {
      name: `techpi-admin-e2e-${c.name}`,
      main: '../../worker/index.js',
      compatibility_date: '2026-10-02',
      assets: { directory: path.posix.join('..', assetsDir), binding: 'ASSETS', run_worker_first: true, not_found_handling: 'single-page-application' },
      workers_dev: false,
      preview_urls: false,
      vars: { ...c.vars, ...gh, ...(c.override ?? {}) },
      dev: { port: c.port, ip: '127.0.0.1' },
      ...(c.access ? { access: { dev: c.access } } : {}),
    };
    const file = path.join(dir, `wrangler.${c.name}.json`);
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    return { ...c, file };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(writeConfigs().map((c) => c.file).join('\n'));
