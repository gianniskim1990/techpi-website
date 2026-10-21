/**
 * Email and password sign-in for the single administrator (Task AUTH-P1). Optional: it is enabled only when the
 * ADMIN_PASSWORD_HASH Worker secret is set, and GitHub sign-in (auth.js) keeps working beside it.
 *
 *   POST /auth/password   a same-origin HTML form (email, password). Only ADMIN_EMAIL can sign in; there is no
 *                         registration, no other user and no password reset.
 *
 * The password is never stored: ADMIN_PASSWORD_HASH is a salted PBKDF2-SHA256 verifier,
 * `pbkdf2-sha256$<iterations>$<salt>$<hash>` (base64url), made locally by scripts/set-admin-password.mjs. Every attempt
 * is counted first by the LoginLimiter Durable Object (strongly consistent, shared by every Worker instance and every
 * Cloudflare location): at most 5 attempts per client IP per 15 minutes and 20 in total per hour. The session is the
 * same signed cookie as for GitHub (session.js), bound to the current verifier: changing the password ends every
 * password session.
 *
 * A malformed ADMIN_PASSWORD_HASH, or the secret without the LOGIN_LIMITER binding, disables only this sign-in (503 on
 * /auth/password, no form); GitHub sign-in keeps working. The verifier is trimmed, so a trailing newline added by a
 * shell pipe does not break it. In production it is uploaded together with the code and the binding in one deploy
 * (scripts/set-admin-password.mjs --deploy).
 */
import { b64url, randomToken, sameString, seal, cookie, clearCookie, SESSION_COOKIE, OAUTH_COOKIE, SESSION_TTL } from './session.js';

export const ADMIN_EMAIL = 'info@techpi.eu';
export const MIN_PASSWORD_LENGTH = 16;
export const MAX_PASSWORD_LENGTH = 256;
/** Cloudflare Workers refuse PBKDF2 above 100 000 iterations; below 10 000 is too weak. */
export const MAX_ITERATIONS = 100000;
export const MIN_ITERATIONS = 10000;
export const LIMITS = {
  client: { max: 5, window: 15 * 60 * 1000 },
  all: { max: 20, window: 60 * 60 * 1000 },
};

const te = new TextEncoder();
const VERIFIER = /^pbkdf2-sha256\$(\d{5,6})\$([A-Za-z0-9_-]{22,64})\$([A-Za-z0-9_-]{43})$/;
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

/** The parts of a verifier, or null if it is malformed. */
export function parseVerifier(value) {
  const m = VERIFIER.exec(String(value ?? '').trim());
  if (!m) return null;
  const iterations = Number(m[1]);
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return null;
  return { iterations, salt: fromB64url(m[2]), hash: fromB64url(m[3]) };
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

/** A new verifier for `password` (used by the setup script and the tests). */
export async function makeVerifier(password, iterations = MAX_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iterations}$${b64url(salt)}$${b64url(await derive(password, salt, iterations))}`;
}

/** Constant-time check of `password` against a verifier. */
export async function verifyPassword(verifier, password) {
  const v = parseVerifier(verifier);
  if (!v || typeof password !== 'string') return false;
  const got = await derive(password, v.salt, v.iterations);
  let diff = got.length ^ v.hash.length;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (v.hash[i] ?? 0);
  return diff === 0;
}

/** Whether password sign-in is enabled, and what stops it. Never returns a secret. */
export function passwordConfig(env) {
  const raw = String(env.ADMIN_PASSWORD_HASH ?? '').trim();
  if (!raw) return { enabled: false, problems: [] };
  const problems = [];
  if (!parseVerifier(raw)) problems.push('ADMIN_PASSWORD_HASH is not a valid password verifier.');
  if (typeof env.LOGIN_LIMITER?.idFromName !== 'function') problems.push('The LOGIN_LIMITER rate limiter is not bound.');
  return { enabled: problems.length === 0, problems };
}

/** A short tag of the current verifier, kept in password sessions: a new password ends the old sessions. */
export async function verifierTag(env) {
  return b64url(await crypto.subtle.digest('SHA-256', te.encode(`techpi-admin:verifier:${String(env.ADMIN_PASSWORD_HASH ?? '').trim()}`))).slice(0, 22);
}

// ---------- brute-force protection ----------
const windowEnd = (rec, limit) => rec.start + limit.window;
const blockedFor = (rec, limit, now) => (rec && now < windowEnd(rec, limit) && rec.n >= limit.max ? Math.ceil((windowEnd(rec, limit) - now) / 1000) : 0);
const bump = (rec, limit, now) => (!rec || now >= windowEnd(rec, limit) ? { n: 1, start: now } : { n: rec.n + 1, start: rec.start });

/**
 * Durable Object counting sign-in attempts. A single instance (named "admin-login") serves every request, so the
 * counts are exact across Worker instances and locations. Client IPs are stored only as truncated SHA-256 hashes.
 */
export class LoginLimiter {
  constructor(state, env, clock = () => Date.now()) {
    this.storage = state.storage;
    this.now = clock;
  }

  async fetch(request) {
    const { op, client } = await request.json().catch(() => ({}));
    if (typeof client !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(client)) return Response.json({ error: 'bad request' }, { status: 400 });
    const now = this.now();
    const [c, all] = await Promise.all([this.storage.get(`client:${client}`), this.storage.get('all')]);
    if (op === 'attempt') {
      const wait = Math.max(blockedFor(c, LIMITS.client, now), blockedFor(all, LIMITS.all, now));
      if (wait) return Response.json({ ok: false, retryAfter: wait });
      await this.storage.put({ [`client:${client}`]: bump(c, LIMITS.client, now), all: bump(all, LIMITS.all, now) });
      return Response.json({ ok: true });
    }
    if (op === 'success') {
      // The owner's own sign-in does not count against them.
      await this.storage.delete(`client:${client}`);
      if (all && now < windowEnd(all, LIMITS.all)) await this.storage.put('all', { n: Math.max(0, all.n - 1), start: all.start });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'bad request' }, { status: 400 });
  }
}

async function limiter(env, op, client) {
  const stub = env.LOGIN_LIMITER.get(env.LOGIN_LIMITER.idFromName('admin-login'));
  const res = await stub.fetch('https://login-limiter/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, client }) });
  if (!res.ok) throw new Error(`limiter ${res.status}`);
  return res.json();
}

async function clientKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  return b64url(await crypto.subtle.digest('SHA-256', te.encode(`techpi-admin:client:${ip}`))).slice(0, 22);
}

// ---------- POST /auth/password ----------
/** Same-origin form checks: the request must come from this admin's own sign-in page. */
function formRefusal(request) {
  const url = new URL(request.url);
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return 'Cross-site sign-in is not allowed.';
  if (request.headers.get('Origin') !== url.origin) return 'This sign-in was not sent from the TechPi Admin.';
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/x-www-form-urlencoded')) return 'Send the sign-in form.';
  return null;
}

/**
 * Handles the password sign-in form. `page(status, message)` renders the sign-in page. Returns a Response.
 */
export async function passwordLogin(request, env, page) {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });
  const cfg = passwordConfig(env);
  if (cfg.problems.length) {
    // Fail closed for the password only: the secret is set but cannot be used safely. GitHub sign-in is unaffected.
    console.error(`auth: password sign-in is misconfigured (${cfg.problems.length} problem(s)); refused`);
    return page(503, 'Password sign-in is not available. Use Sign in with GitHub.');
  }
  if (!cfg.enabled) return new Response('Not found.', { status: 404 });
  const refused = formRefusal(request);
  if (refused) return page(403, refused);
  if (Number(request.headers.get('Content-Length') || 0) > 4096) return page(413, 'The sign-in form is too large.');
  const text = await request.text();
  if (text.length > 4096) return page(413, 'The sign-in form is too large.');
  const form = new URLSearchParams(text);
  const email = (form.get('email') ?? '').trim().toLowerCase();
  const password = form.get('password') ?? '';

  const client = await clientKey(request);
  let gate;
  try {
    gate = await limiter(env, 'attempt', client);
  } catch {
    console.error('auth: the sign-in rate limiter is unavailable; password sign-in refused');
    return page(503, 'Sign-in is temporarily unavailable. Try again in a moment.');
  }
  if (!gate.ok) {
    const res = page(429, `Too many sign-in attempts. Try again in ${Math.max(1, Math.ceil(gate.retryAfter / 60))} minute(s).`);
    res.headers.set('Retry-After', String(gate.retryAfter));
    return res;
  }

  // The password is always checked (when its length is acceptable), so a wrong email takes as long as a wrong password.
  const passwordOk = password.length > 0 && password.length <= MAX_PASSWORD_LENGTH && (await verifyPassword(env.ADMIN_PASSWORD_HASH, password));
  if (!(sameString(email, ADMIN_EMAIL) && passwordOk)) {
    console.error('auth: password sign-in refused');
    return page(401, 'The email or password is incorrect.');
  }
  try {
    await limiter(env, 'success', client);
  } catch {
    // The attempt was counted; the sign-in itself is valid.
  }
  const session = await seal(env.SESSION_SECRET, 'session', { sid: randomToken(16), m: 'password', login: ADMIN_EMAIL, pv: await verifierTag(env) }, SESSION_TTL);
  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', clearCookie(OAUTH_COOKIE));
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, SESSION_TTL));
  return new Response(null, { status: 303, headers });
}
