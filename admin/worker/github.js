/**
 * GitHub App client for the admin Worker. Server-side only: the App's private key and the installation tokens never
 * leave the Worker, are never logged, and never appear in a response.
 *
 * Flow (GitHub docs, "Authenticating as a GitHub App installation"):
 *   1. Sign a JWT (RS256, valid 9 minutes) with the App's private key; issuer = App ID.
 *   2. Exchange it for an installation access token (valid 1 hour), narrowed to this one repository and to the three
 *      permissions the admin needs (contents: write, pull_requests: write, metadata: read).
 *   3. Cache that token in memory until 5 minutes before it expires; on a 401 from GitHub, drop it and retry once.
 *
 * Configuration (Worker variables and secrets; never committed):
 *   GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID   variables
 *   GITHUB_APP_PRIVATE_KEY                       secret (the PEM file GitHub provides; PKCS#1 or PKCS#8)
 *   GITHUB_API_BASE                              optional, local testing only: honoured only for http://127.0.0.1
 */

export const REPO = { owner: 'gianniskim1990', name: 'techpi-website' };
const API = 'https://api.github.com';
const PERMISSIONS = { contents: 'write', pull_requests: 'write', metadata: 'read' };

/** A GitHub failure, with a message that is safe to show to the administrator. */
export class GitHubError extends Error {
  constructor(status, userMessage, detail = '') {
    super(userMessage);
    this.status = status;
    this.userMessage = userMessage;
    this.detail = detail;
  }
}

export function apiBase(env) {
  const v = String(env.GITHUB_API_BASE ?? '');
  return /^http:\/\/127\.0\.0\.1:\d+$/.test(v) ? v : API;
}

export function githubConfig(env) {
  const appId = String(env.GITHUB_APP_ID ?? '').trim();
  const installationId = String(env.GITHUB_APP_INSTALLATION_ID ?? '').trim();
  const key = String(env.GITHUB_APP_PRIVATE_KEY ?? '');
  const missing = [];
  if (!/^\d+$/.test(appId)) missing.push('GITHUB_APP_ID');
  if (!/^\d+$/.test(installationId)) missing.push('GITHUB_APP_INSTALLATION_ID');
  if (!/-----BEGIN (RSA )?PRIVATE KEY-----/.test(key.replace(/\\n/g, '\n'))) missing.push('GITHUB_APP_PRIVATE_KEY');
  return { configured: missing.length === 0, missing, appId, installationId, key };
}

// ---------- key handling and JWT ----------
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const utf8 = (s) => new TextEncoder().encode(s);

function derLength(n) {
  if (n < 0x80) return [n];
  const out = [];
  while (n > 0) { out.unshift(n & 0xff); n >>= 8; }
  return [0x80 | out.length, ...out];
}
/** Wraps a PKCS#1 RSAPrivateKey in a PKCS#8 PrivateKeyInfo, which is what WebCrypto imports. */
export function pkcs1ToPkcs8(pkcs1) {
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]; // rsaEncryption, NULL
  const version = [0x02, 0x01, 0x00];
  const octet = [0x04, ...derLength(pkcs1.length), ...pkcs1];
  const body = [...version, ...algorithm, ...octet];
  return new Uint8Array([0x30, ...derLength(body.length), ...body]);
}

export async function importPrivateKey(pem) {
  const text = pem.replace(/\\n/g, '\n').trim();
  const m = text.match(/-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]+?)-----END (RSA )?PRIVATE KEY-----/);
  if (!m) throw new GitHubError(503, 'The GitHub App private key is not in PEM format.');
  const der = Uint8Array.from(atob(m[2].replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const pkcs8 = m[1] ? pkcs1ToPkcs8(der) : der;
  try {
    return await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  } catch {
    throw new GitHubError(503, 'The GitHub App private key could not be read.');
  }
}

export async function appJwt(appId, key, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = b64url(utf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64url(utf8(JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 540, iss: appId })));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(signature)}`;
}

// ---------- installation token ----------
let cache = null; // { id, token, expiresAt }
export const resetTokenCache = () => { cache = null; };

async function installationToken(env, cfg, { refresh = false } = {}) {
  const id = `${cfg.appId}/${cfg.installationId}`;
  if (!refresh && cache && cache.id === id && cache.expiresAt - Date.now() > 5 * 60 * 1000) return cache.token;
  const key = await importPrivateKey(cfg.key);
  const jwt = await appJwt(cfg.appId, key);
  let res;
  try {
    res = await fetch(`${apiBase(env)}/app/installations/${cfg.installationId}/access_tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'techpi-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositories: [REPO.name], permissions: PERMISSIONS }),
    });
  } catch {
    throw new GitHubError(502, 'GitHub could not be reached. Try again in a moment.');
  }
  if (!res.ok) {
    cache = null;
    if (res.status === 401) throw new GitHubError(503, 'GitHub rejected the admin’s app credentials. Check the App ID and private key.');
    if (res.status === 404) throw new GitHubError(503, 'The GitHub App is not installed on this repository, or the installation ID is wrong.');
    if (res.status === 422 || res.status === 403) throw new GitHubError(503, 'The GitHub App does not have the permissions the admin needs on this repository.');
    throw new GitHubError(502, 'GitHub could not create an access token. Try again in a moment.');
  }
  const data = await res.json();
  cache = { id, token: data.token, expiresAt: Date.parse(data.expires_at) || Date.now() + 50 * 60 * 1000 };
  return cache.token;
}

/**
 * Calls the GitHub REST API for this repository. `path` is relative to /repos/<owner>/<repo> and is built by the
 * Worker, never taken from the browser. Returns { status, data }. Throws GitHubError for failures the caller does not
 * expect (pass `expect: [404, 409]` to receive those statuses instead).
 */
export async function repoRequest(env, method, path, { body, expect = [] } = {}) {
  const cfg = githubConfig(env);
  if (!cfg.configured) throw new GitHubError(503, `The GitHub connection is not configured (${cfg.missing.join(', ')}).`);
  const url = `${apiBase(env)}/repos/${REPO.owner}/${REPO.name}${path}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await installationToken(env, cfg, { refresh: attempt > 0 });
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'techpi-admin', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new GitHubError(502, 'GitHub could not be reached. Try again in a moment.');
    }
    if (res.status === 401 && attempt === 0) { cache = null; continue; } // expired or revoked token: get a new one once
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.ok || expect.includes(res.status)) return { status: res.status, data };
    if (res.status === 401) throw new GitHubError(503, 'GitHub rejected the admin’s access. Check the GitHub App installation.');
    if (res.status === 403) throw new GitHubError(503, 'GitHub refused this action. The GitHub App may be missing a permission, or a limit was reached.');
    if (res.status === 404) throw new GitHubError(404, 'GitHub could not find this content.');
    if (res.status === 409 || res.status === 422) throw new GitHubError(409, 'GitHub refused the change because it conflicts with the current version.');
    throw new GitHubError(502, 'GitHub had a problem. Try again in a moment.', `${method} ${path} -> ${res.status}`);
  }
  throw new GitHubError(503, 'GitHub rejected the admin’s access. Check the GitHub App installation.');
}
