// Sets the administrator's sign-in password (Task AUTH-P1) without it ever being shown, logged or stored.
// The password is typed twice with hidden input; only a salted PBKDF2-SHA256 verifier is produced (worker/password.js).
//
//   node scripts/set-admin-password.mjs
//       local testing: writes ADMIN_PASSWORD_HASH to admin/.dev.vars (git-ignored), keeping every other line.
//   node scripts/set-admin-password.mjs --stdout | npx wrangler secret put ADMIN_PASSWORD_HASH --config <production config>
//   Add --iterations=20000 (10000 to 100000; default 100000, the Workers maximum) only for the Workers Free plan
//   CPU limit (docs/admin/M4-GO-LIVE.md, section 8).
//       production (separately approved): the verifier goes straight into the Worker secret through the pipe. It is
//       refused if the output is the terminal, so the verifier cannot be displayed by mistake.
//
// Prompts go to stderr; nothing secret is ever printed. Rules: 16 to 256 characters, at least 8 different characters,
// not containing "techpi" or "password".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeVerifier, verifyPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_ITERATIONS, MAX_ITERATIONS } from '../worker/password.js';

const admin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toStdout = process.argv.includes('--stdout');
const iterArg = process.argv.find((a) => a.startsWith('--iterations='));
const iterations = iterArg ? Number(iterArg.split('=')[1]) : MAX_ITERATIONS;
const say = (s) => process.stderr.write(`${s}\n`);

function hidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('Run this in an interactive terminal.'));
    process.stderr.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let value = '';
    const done = (err) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stderr.write('\n');
      err ? reject(err) : resolve(value);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return done();
        if (ch === '\u0003') return done(new Error('Cancelled. Nothing was changed.'));
        if (ch === '\u0008' || ch === '\u007f') value = value.slice(0, -1);
        else if (ch >= ' ') value += ch;
      }
    };
    process.stdin.on('data', onData);
  });
}

/** Why a password is not acceptable, or null. */
export function weakness(password) {
  if (password.length < MIN_PASSWORD_LENGTH) return `It must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `It must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  if (new Set(password).size < 8) return 'It must contain at least 8 different characters.';
  if (/techpi|password/i.test(password)) return 'It must not contain "techpi" or "password".';
  return null;
}

async function main() {
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) throw new Error(`--iterations must be between ${MIN_ITERATIONS} and ${MAX_ITERATIONS}.`);
  if (toStdout && process.stdout.isTTY) throw new Error('--stdout writes the verifier only into a pipe (for example to `npx wrangler secret put ADMIN_PASSWORD_HASH`), never to the screen.');
  const devVars = path.join(admin, '.dev.vars');
  if (!toStdout && !fs.existsSync(devVars)) throw new Error('admin/.dev.vars does not exist. Nothing was changed.');
  say('TechPi Admin password for info@techpi.eu. Typing is hidden.');
  const password = await hidden('New password: ');
  const problem = weakness(password);
  if (problem) throw new Error(`Password not accepted. ${problem} Nothing was changed.`);
  if ((await hidden('Repeat the password: ')) !== password) throw new Error('The two entries differ. Nothing was changed.');
  const verifier = await makeVerifier(password, iterations);
  if (!(await verifyPassword(verifier, password))) throw new Error('Verifier self-check failed. Nothing was changed.');

  if (toStdout) {
    process.stdout.write(verifier);
    say('Verifier sent to the pipe (not shown).');
    return;
  }
  const raw = fs.readFileSync(devVars, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  const kept = lines.filter((l) => !/^\s*ADMIN_PASSWORD_HASH\s*=/.test(l));
  fs.writeFileSync(devVars, [...kept, `ADMIN_PASSWORD_HASH="${verifier}"`].join(eol) + eol);
  say(`Saved ADMIN_PASSWORD_HASH to admin/.dev.vars (verifier only, not shown). Other lines kept: ${kept.length}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    say(e.message);
    process.exitCode = 1;
  });
}
