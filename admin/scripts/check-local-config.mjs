// Preflight for the local real-GitHub test (docs/admin/A1.md, section 6). Run in admin/:
//   node scripts/check-local-config.mjs            offline checks only
//   node scripts/check-local-config.mjs --github   also a READ-ONLY GitHub check (token + read the demo file; no writes)
// It never prints, logs or copies the private key: it reports only whether each check passed.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { githubConfig, importPrivateKey, repoRequest, GitHubError } from '../worker/github.js';
import { contentConfig } from '../worker/config.js';

const admin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = (name, ok, hint = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${!ok && hint ? `\n     → ${hint}` : ''}`); return ok; };
const git = (...args) => { try { return execFileSync('git', args, { cwd: admin, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

// Minimal .dev.vars (dotenv) reader: KEY=value, optional quotes, \n escapes are left for the Worker to handle.
const readVars = (file) => {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1');
  }
  return out;
};
const stripComments = (t) => t.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');

const devVars = path.join(admin, '.dev.vars');
const localCfg = path.join(admin, 'wrangler.local.jsonc');
for (const f of ['.dev.vars', 'wrangler.local.jsonc']) {
  check(`${f} is ignored by Git`, git('check-ignore', '-q', f) !== null, 'Do not continue: the file would be committable.');
  check(`${f} is not tracked by Git`, !git('ls-files', f), `Run: git rm --cached admin/${f}`);
}
if (!check('wrangler.local.jsonc exists', fs.existsSync(localCfg), 'Copy wrangler.local.example.jsonc to wrangler.local.jsonc.')) process.exit(1);
if (!check('.dev.vars exists', fs.existsSync(devVars), 'Create it with the command in docs/admin/A1.md, section 6.')) process.exit(1);

const cfg = JSON.parse(stripComments(fs.readFileSync(localCfg, 'utf8')));
const vars = readVars(devVars);
check('.dev.vars contains only GITHUB_APP_PRIVATE_KEY', Object.keys(vars).length === 1 && 'GITHUB_APP_PRIVATE_KEY' in vars, 'Keep other settings in wrangler.local.jsonc.');
check('wrangler.local.jsonc has no private key', !/PRIVATE KEY/.test(fs.readFileSync(localCfg, 'utf8')), 'Remove the key from wrangler.local.jsonc; it belongs only in .dev.vars.');
const env = { ...cfg.vars, ...vars };
const gh = githubConfig(env);
check('GitHub App ID and installation ID are set', !gh.missing.includes('GITHUB_APP_ID') && !gh.missing.includes('GITHUB_APP_INSTALLATION_ID'), 'Fill both in wrangler.local.jsonc.');
check('private key looks like a PEM key', !gh.missing.includes('GITHUB_APP_PRIVATE_KEY'), 'Recreate .dev.vars with the command in A1.md.');
let keyOk = false;
try { await importPrivateKey(env.GITHUB_APP_PRIVATE_KEY ?? ''); keyOk = true; } catch {}
check('private key can be loaded for signing', keyOk, 'The file may be truncated or not the GitHub App key. Recreate .dev.vars.');
check('Access simulation is configured', Boolean(cfg.access?.dev?.identity?.email) && cfg.access.dev.aud === env.ACCESS_AUD && env.ADMIN_EMAILS?.split(',').map((s) => s.trim()).includes(cfg.access.dev.identity.email));
const content = contentConfig(env);
check('content mode and base branch are valid (main only in production mode)', content.ok, content.problems.join(' '));
check('local testing uses development mode', content.mode === 'development', 'Production mode only serves the admin hostname over HTTPS; use CONTENT_MODE=development locally.');
check('admin is built (dist/index.html)', fs.existsSync(path.join(admin, 'dist', 'index.html')), 'Run: npm run build');

if (process.argv.includes('--github') && results.every(Boolean)) {
  try {
    const ref = await repoRequest(env, 'GET', `/git/ref/heads/${env.CONTENT_BASE_BRANCH}`);
    check(`GitHub: installation token issued, base branch readable (${String(ref.data?.object?.sha).slice(0, 7)})`, Boolean(ref.data?.object?.sha));
    const file = await repoRequest(env, 'GET', `/contents/content/pages/home/index.json?ref=${encodeURIComponent(env.CONTENT_BASE_BRANCH)}`);
    check('GitHub: the Home page file is readable on the base branch', file.data?.type === 'file');
  } catch (e) {
    check('GitHub read-only check', false, e instanceof GitHubError ? e.userMessage : 'Unexpected error (details not shown).');
  }
}
const ok = results.every(Boolean);
console.log(`\n${ok ? 'Ready.' : 'Not ready.'} Nothing was written to GitHub.`);
process.exit(ok ? 0 : 1);
