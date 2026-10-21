// Writes the local-only Wrangler configurations used by test/access-e2e.mjs: the admin Worker run in Cloudflare's
// local runtime, signing in with GitHub through the OAuth flow against the GitHub mock (test/support/mock-github.mjs)
// served on 127.0.0.1, with a throwaway key generated for the run. No deployment, no real GitHub, no real identity:
// the client and session secrets are the tests' own values. The generated files are git-ignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authEnv } from './support/auth.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// `signIn`: the GitHub account that signs in at the mock ('owner', another account, or none), and the callback status.
export const cases = [
  { name: 'owner', port: 8911, signIn: { as: 'owner', expect: 303 }, vars: authEnv, expect: 200 },
  { name: 'other-account', port: 8912, signIn: { as: 'other', expect: 403 }, vars: authEnv, expect: 401 },
  { name: 'no-session', port: 8913, signIn: null, vars: authEnv, expect: 401 },
  { name: 'unconfigured', port: 8915, signIn: null, vars: { ...authEnv, ADMIN_GITHUB_USER_ID: '', SESSION_SECRET: '' }, expect: 503 },
  // A production configuration served anywhere but its own HTTPS hostname (here: local wrangler dev) serves nothing,
  // not even the sign-in: no workers.dev, preview or local exposure (Task M4).
  {
    name: 'production-on-localhost', port: 8916, signIn: { as: 'owner', expect: 503 },
    vars: { ...authEnv, SESSION_SECRET: 'prod-like-secret-for-tests-only-9f8e7d6c5b4a39281706' },
    override: { CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main', ADMIN_HOSTNAME: 'admin.techpi.eu', GITHUB_API_BASE: '', GITHUB_OAUTH_BASE: '', ENABLE_TEST_CONTENT: '' }, expect: 503,
  },
];

/** `github`: { apiBase, appId, installationId, privateKey } for the mock, or omitted to leave GitHub unconfigured. */
export function writeConfigs({ assetsDir = '../dist', github } = {}) {
  const dir = path.join(here, '.wrangler-e2e');
  fs.mkdirSync(dir, { recursive: true });
  const gh = github
    ? { GITHUB_API_BASE: github.apiBase, GITHUB_OAUTH_BASE: github.apiBase, GITHUB_APP_ID: github.appId, GITHUB_APP_INSTALLATION_ID: github.installationId, GITHUB_APP_PRIVATE_KEY: github.privateKey, CONTENT_MODE: 'development', CONTENT_BASE_BRANCH: 'feat/techpi-admin-m4-production-readiness', ENABLE_TEST_CONTENT: 'true' }
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
    };
    const file = path.join(dir, `wrangler.${c.name}.json`);
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    return { ...c, file };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(writeConfigs().map((c) => c.file).join('\n'));
