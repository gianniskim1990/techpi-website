// Sets the administrator's sign-in password (Task AUTH-P1) without it ever being shown, logged or stored.
// The password is typed twice with hidden input; only a salted PBKDF2-SHA256 verifier is produced (worker/password.js).
// Run it in PowerShell (5.1 or 7) or Windows Terminal, from admin/. The password is never a command-line argument, so it
// is not in the command history; prompts go to stderr and nothing secret is printed.
//
//   node scripts/set-admin-password.mjs
//       Local testing: writes ADMIN_PASSWORD_HASH to admin/.dev.vars (git-ignored), keeping every other line.
//
//   node scripts/set-admin-password.mjs --deploy --config wrangler.production.local.jsonc
//       Production (separately approved): ONE `wrangler deploy --secrets-file`, so the code, the LOGIN_LIMITER Durable
//       Object binding and the ADMIN_PASSWORD_HASH secret go live together; password sign-in can never be switched on
//       before the binding exists. Refused unless the configuration has the binding and its migration. `--secrets-file`
//       is additive: every existing Worker secret is kept. The temporary secrets file is outside the repository,
//       readable only by the current user, and overwritten and deleted on every exit path. Build first: npm run build.
//
//   --iterations=20000   (10 000 to 100 000; default 100 000, the Workers maximum) only for the Workers Free plan's
//       10 ms CPU limit. The script prints the time measured on this computer as an ESTIMATE only: Cloudflare's CPU
//       time can be higher. Verify a real sign-in after deploying (docs/admin/M4-GO-LIVE.md, section 8).
//
// Rules: 16 to 256 characters, at least 8 different characters, not containing "techpi" or "password".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeVerifier, parseVerifier, verifyPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_ITERATIONS, MAX_ITERATIONS } from '../worker/password.js';

const admin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const say = (s) => process.stderr.write(`${s}\n`);

/** The command-line options, or an error message. */
export function parseArgs(argv) {
  const known = /^--(deploy|config=.+|iterations=.+)$/;
  const configAt = argv.indexOf('--config');
  const args = configAt >= 0 && argv[configAt + 1] ? [...argv.slice(0, configAt), `--config=${argv[configAt + 1]}`, ...argv.slice(configAt + 2)] : argv;
  const unknown = args.find((a) => !known.test(a));
  // Only the option's name is echoed, never a value (someone might type a password as an argument by mistake).
  if (unknown) return { error: `Unknown option: ${/^--[a-z-]+/.exec(unknown)?.[0] ?? '(a value)'}. Options: --deploy --config <file> --iterations=<n>.` };
  const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const iterations = value('iterations') === undefined ? MAX_ITERATIONS : Number(value('iterations'));
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return { error: `--iterations must be between ${MIN_ITERATIONS} and ${MAX_ITERATIONS}.` };
  const deploy = args.includes('--deploy');
  const config = value('config');
  if (deploy && !config) return { error: '--deploy needs --config <production configuration file>.' };
  if (!deploy && config) return { error: '--config is used only with --deploy.' };
  return { deploy, config, iterations };
}

/** Why a password is not acceptable, or null. */
export function weakness(password) {
  if (password.length < MIN_PASSWORD_LENGTH) return `It must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `It must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  if (new Set(password).size < 8) return 'It must contain at least 8 different characters.';
  if (/techpi|password/i.test(password)) return 'It must not contain "techpi" or "password".';
  return null;
}

/**
 * Applies typed or pasted characters to the hidden input. Enter ends it (CR or LF, as Windows consoles send either),
 * Backspace deletes, Ctrl+C cancels, other control characters are ignored. Returns { value, done, cancelled }.
 */
export function applyKeys(value, chunk) {
  for (const ch of chunk) {
    if (ch === '\r' || ch === '\n') return { value, done: true, cancelled: false };
    if (ch === '\u0003') return { value: '', done: true, cancelled: true };
    if (ch === '\u0008' || ch === '\u007f') value = [...value].slice(0, -1).join('');
    else if (ch >= ' ') value += ch;
  }
  return { value, done: false, cancelled: false };
}

function hidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('Run this in PowerShell or Windows Terminal (an interactive console). Nothing was changed.'));
    process.stderr.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      const r = applyKeys(value, chunk);
      value = r.value;
      if (!r.done) return;
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stderr.write('\n');
      if (r.cancelled) reject(new Error('Cancelled. Nothing was changed.'));
      else resolve(value);
    };
    process.stdin.on('data', onData);
  });
}

const stripJsonc = (t) => t.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');

/** What stops a production deploy with this configuration (empty when it is ready). Never reads a secret. */
export function deployConfigProblems(configText) {
  let c;
  try { c = JSON.parse(stripJsonc(configText)); } catch { return ['The configuration is not valid JSONC.']; }
  const problems = [];
  if (!(c.durable_objects?.bindings ?? []).some((b) => b.name === 'LOGIN_LIMITER' && b.class_name === 'LoginLimiter')) problems.push('It has no LOGIN_LIMITER Durable Object binding (copy "durable_objects" from wrangler.production.example.jsonc).');
  if (!(c.migrations ?? []).some((m) => (m.new_sqlite_classes ?? []).includes('LoginLimiter'))) problems.push('It has no migration creating LoginLimiter (copy "migrations" from wrangler.production.example.jsonc).');
  if (c.vars?.CONTENT_MODE !== 'production') problems.push('It is not a production configuration (CONTENT_MODE must be "production").');
  if (c.workers_dev !== false || c.preview_urls !== false) problems.push('workers_dev and preview_urls must both be false.');
  for (const k of ['ADMIN_PASSWORD_HASH', 'SESSION_SECRET', 'GITHUB_OAUTH_CLIENT_SECRET', 'GITHUB_APP_PRIVATE_KEY']) if (c.vars && k in c.vars) problems.push(`${k} must not be a plain variable.`);
  return problems;
}

/**
 * Writes { ADMIN_PASSWORD_HASH } to an owner-only temporary file outside the repository, calls `run(file)` and always
 * overwrites and deletes the file afterwards. Returns run's result.
 */
export async function withSecretsFile(verifier, run, { tmp = os.tmpdir(), restrict = restrictToOwner } = {}) {
  const dir = fs.mkdtempSync(path.join(tmp, 'techpi-admin-password-'));
  const file = path.join(dir, 'secrets.json');
  try {
    fs.writeFileSync(file, JSON.stringify({ ADMIN_PASSWORD_HASH: verifier }), { mode: 0o600 });
    restrict(dir, file);
    return await run(file);
  } finally {
    try { if (fs.existsSync(file)) { fs.writeFileSync(file, crypto.randomBytes(Math.max(64, fs.statSync(file).size))); fs.unlinkSync(file); } } catch {}
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function restrictToOwner(dir, file) {
  if (process.platform !== 'win32') return;
  const me = os.userInfo().username;
  execFileSync('icacls', [dir, '/inheritance:r', '/grant:r', `${me}:(OI)(CI)F`], { stdio: 'ignore' });
  execFileSync('icacls', [file, '/inheritance:r', '/grant:r', `${me}:F`], { stdio: 'ignore' });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.error) throw new Error(opts.error);
  const devVars = path.join(admin, '.dev.vars');
  let configPath;
  if (opts.deploy) {
    configPath = path.resolve(admin, opts.config);
    if (!fs.existsSync(configPath)) throw new Error('The configuration file does not exist. Nothing was changed.');
    const problems = deployConfigProblems(fs.readFileSync(configPath, 'utf8'));
    if (problems.length) throw new Error(`Not deploying: ${problems.join(' ')} Nothing was changed.`);
    if (!fs.existsSync(path.join(admin, 'dist', 'index.html'))) throw new Error('Build the admin first (npm run build). Nothing was changed.');
  } else if (!fs.existsSync(devVars)) {
    throw new Error('admin/.dev.vars does not exist. Nothing was changed.');
  }

  say('TechPi Admin password for info@techpi.eu. Typing is hidden; nothing is shown.');
  const password = await hidden('New password: ');
  const problem = weakness(password);
  if (problem) throw new Error(`Password not accepted. ${problem} Nothing was changed.`);
  if ((await hidden('Repeat the password: ')) !== password) throw new Error('The two entries differ. Nothing was changed.');
  const started = process.hrtime.bigint();
  const verifier = await makeVerifier(password, opts.iterations);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  if (!(await verifyPassword(verifier, password)) || !parseVerifier(verifier)) throw new Error('Verifier self-check failed. Nothing was changed.');
  say(`Verifier made with ${opts.iterations} iterations; about ${ms.toFixed(1)} ms on this computer. This is an estimate only: Cloudflare's CPU time can differ, so verify a real sign-in after deploying.`);

  if (!opts.deploy) {
    const raw = fs.readFileSync(devVars, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const lines = raw.split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
    const kept = lines.filter((l) => !/^\s*ADMIN_PASSWORD_HASH\s*=/.test(l));
    fs.writeFileSync(devVars, [...kept, `ADMIN_PASSWORD_HASH="${verifier}"`].join(eol) + eol);
    say(`Saved ADMIN_PASSWORD_HASH to admin/.dev.vars (verifier only, not shown). Other lines kept: ${kept.length}.`);
    return;
  }

  const wrangler = path.join(admin, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const code = await withSecretsFile(verifier, (file) => {
    say('Deploying code, LOGIN_LIMITER and ADMIN_PASSWORD_HASH together (existing secrets are kept)...');
    // node runs wrangler directly: no npx.ps1 (blocked by PowerShell's execution policy), no shell, no secret in arguments.
    return spawnSync(process.execPath, [wrangler, 'deploy', '--config', configPath, '--secrets-file', file], { cwd: admin, stdio: 'inherit' }).status;
  });
  say(`wrangler deploy exited with code ${code}. The temporary secrets file was deleted.`);
  if (code !== 0) process.exitCode = code ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    say(e.message);
    process.exitCode = 1;
  });
}
