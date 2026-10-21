/**
 * Signed, short-lived tokens in cookies (Task AUTH-G1). No server-side storage: a token is
 * `<payload>.<signature>`, base64url, where the signature is HMAC-SHA256 over a purpose label and the payload, keyed by the
 * SESSION_SECRET Worker secret. A token signed for one purpose (the OAuth round trip) can never be used for another (the
 * session). Expiry is part of the signed payload. Rotating SESSION_SECRET invalidates every token at once.
 *
 * Cookies use the `__Host-` prefix: Secure, Path=/, no Domain attribute (host-only), so no other host, subdomain or path
 * can set or read them. They are HttpOnly and SameSite=Lax.
 */
const te = new TextEncoder();
const td = new TextDecoder();

export const SESSION_COOKIE = '__Host-techpi_session';
export const OAUTH_COOKIE = '__Host-techpi_oauth';
/** A session lasts 8 hours from sign-in (absolute, not extended by activity). */
export const SESSION_TTL = 8 * 60 * 60;
/** The GitHub round trip (sign-in page to callback) must finish within 10 minutes. */
export const OAUTH_TTL = 10 * 60;
/** SESSION_SECRET must be at least this long (characters); 64 random base64 characters are recommended. */
export const MIN_SECRET_LENGTH = 32;

export const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
/** `n` cryptographically random bytes, base64url. */
export const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
/** PKCE S256: base64url(SHA-256(verifier)). */
export async function pkceChallenge(verifier) {
  return b64url(await crypto.subtle.digest('SHA-256', te.encode(verifier)));
}

const keys = new Map();
async function hmacKey(secret) {
  if (!keys.has(secret)) keys.set(secret, crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
  return keys.get(secret);
}
const signed = (purpose, payload) => te.encode(`techpi-admin:${purpose}:${payload}`);

/** Seals `data` for `purpose`, valid for `ttl` seconds from `now`. */
export async function seal(secret, purpose, data, ttl, now = Math.floor(Date.now() / 1000)) {
  const payload = b64url(te.encode(JSON.stringify({ ...data, v: 1, p: purpose, iat: now, exp: now + ttl })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), signed(purpose, payload));
  return `${payload}.${b64url(sig)}`;
}

/** Opens a token sealed for `purpose`. Returns its data, or null if it is malformed, forged, for another purpose or expired. */
export async function open(secret, purpose, token, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string' || token.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const [payload, sig] = token.split('.');
  let ok = false;
  try {
    // crypto.subtle.verify compares in constant time.
    ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), signed(purpose, payload));
  } catch {
    return null;
  }
  if (!ok) return null;
  let data;
  try { data = JSON.parse(td.decode(fromB64url(payload))); } catch { return null; }
  if (!data || data.v !== 1 || data.p !== purpose || !Number.isInteger(data.exp) || !Number.isInteger(data.iat)) return null;
  if (data.exp <= now || data.iat > now + 60) return null;
  return data;
}

/** The value of a cookie in the request, or null. Only the first occurrence counts. */
export function readCookie(request, name) {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** A Set-Cookie value for a host-only, Secure, HttpOnly, SameSite=Lax cookie. maxAge 0 deletes it. */
export const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
export const clearCookie = (name) => cookie(name, '', 0);

/** Constant-time comparison of two short strings (for the OAuth state). */
export function sameString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
