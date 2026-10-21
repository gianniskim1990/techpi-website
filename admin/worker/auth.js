/**
 * Sign-in with GitHub (Task AUTH-G1). Replaces Cloudflare Access. The only resources served without a session are the
 * sign-in page and the three OAuth endpoints below; everything else (the app, its static files and the API) requires a
 * valid session cookie for the one allowed GitHub account. Nothing is stored server-side.
 *
 *   GET  /auth/login     starts sign-in: a fresh random `state` and PKCE verifier, sealed into a 10-minute cookie
 *                        (__Host-techpi_oauth); any existing session is cleared (no session fixation); redirect to GitHub.
 *   GET  /auth/callback  GitHub returns here with `code` and `state`. The state must match the sealed cookie (constant
 *                        time), the cookie is cleared whatever happens (single use: a replayed callback fails), the code
 *                        is exchanged server-side with the client secret and the PKCE verifier, the account is read from
 *                        GitHub's authenticated /user endpoint, and only ADMIN_GITHUB_USER_ID (the numeric ID) gets a
 *                        session. The GitHub user token is then revoked: the admin never keeps or sends it anywhere.
 *   POST /auth/logout    clears the session (same-origin requests only).
 *
 * The session cookie (__Host-techpi_session) is HMAC-signed (session.js), HttpOnly, Secure, SameSite=Lax, host-only,
 * and expires 8 hours after sign-in. Every request re-checks its signature, expiry and that its user ID is the
 * configured one, so changing ADMIN_GITHUB_USER_ID or SESSION_SECRET ends every session at once.
 *
 * GitHub docs: Generating a user access token for a GitHub App (web application flow, PKCE S256 only, exact
 * redirect_uri match, client secret required).
 */
import { authConfig, isProduction, oauthBase } from './config.js';
import { apiBase } from './github.js';
import {
  SESSION_COOKIE, OAUTH_COOKIE, SESSION_TTL, OAUTH_TTL, seal, open, readCookie, cookie, clearCookie, randomToken, pkceChallenge, sameString,
} from './session.js';

const UA = { 'User-Agent': 'techpi-admin', 'X-GitHub-Api-Version': '2022-11-28' };

/** The callback URL GitHub must redirect to: exactly the one registered in the GitHub App's settings. */
export function callbackUrl(env, url) {
  return isProduction(env) ? `https://${String(env.ADMIN_HOSTNAME).trim().toLowerCase()}/auth/callback` : `${url.origin}/auth/callback`;
}

/**
 * The signed-in owner for this request, or null. Checks the session cookie's signature, purpose and expiry, and that it
 * belongs to the configured GitHub user ID.
 */
export async function sessionIdentity(request, env) {
  const cfg = authConfig(env);
  if (!cfg.ok) return null;
  const data = await open(env.SESSION_SECRET, 'session', readCookie(request, SESSION_COOKIE));
  if (!data || String(data.uid) !== cfg.userId || typeof data.sid !== 'string') return null;
  return { uid: cfg.userId, login: typeof data.login === 'string' ? data.login : '' };
}

/**
 * Cross-site request protection for the API and sign-out. A request is accepted only if it carries the admin's own
 * header (a cross-origin page cannot send it without a CORS preflight, which this Worker never answers), and, for writes,
 * a JSON body, an Origin equal to this admin's own origin, and no cross-site Fetch Metadata.
 * Returns null when the request may proceed, or { status, message }.
 */
export function checkSameOrigin(request) {
  const url = new URL(request.url);
  if (request.headers.get('X-TechPi-Admin') !== '1') return { status: 403, message: 'Missing admin request header.' };
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return { status: 403, message: 'Cross-site requests are not allowed.' };
  if (request.method === 'GET' || request.method === 'HEAD') return null;
  const origin = request.headers.get('Origin');
  if (!origin || origin !== url.origin) return { status: 403, message: 'Cross-origin requests are not allowed.' };
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return { status: 415, message: 'Send JSON.' };
  return null;
}

// ---------- the sign-in page ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** The minimal sign-in page: no script, no external resource, no reflected input (messages are fixed strings). */
export function signInPage(status, message = '') {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Sign in · TechPi Admin</title>
<style>
:root{color-scheme:light;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f2ee;color:#0b1220}
main{width:min(380px,calc(100% - 32px));padding:32px 28px;background:#fbfaf7;border:1px solid #e6e2da;border-radius:12px;box-shadow:0 1px 2px rgb(8 14 30/.06)}
.brand{font-weight:600;letter-spacing:.14em;font-size:15px}.brand span{font-weight:400;letter-spacing:normal;color:#5b6475;margin-left:8px;padding-left:10px;border-left:1px solid #d9d4ca}
h1{font-size:22px;font-weight:500;margin:24px 0 8px}p{margin:0 0 20px;color:#3d4655;font-size:15px;line-height:1.5}
.msg{padding:10px 12px;border-radius:8px;background:#fbe9e7;color:#9b2c20;font-size:14px}
a.btn{display:flex;justify-content:center;align-items:center;gap:8px;padding:11px 16px;border-radius:8px;background:#0841c8;color:#fff;font-weight:600;text-decoration:none}
a.btn:hover{background:#06349f}a.btn:focus-visible{outline:3px solid #6fd3f2;outline-offset:2px}
</style></head>
<body><main>
<div class="brand">TECHPI<span>Admin</span></div>
<h1>Sign in</h1>
${message ? `<p class="msg" role="alert">${esc(message)}</p>` : '<p>Only the owner’s GitHub account can sign in.</p>'}
<a class="btn" href="/auth/login">Sign in with GitHub</a>
</main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- GitHub calls (server-side only) ----------
async function exchangeCode(env, url, code, verifier) {
  let res;
  try {
    res = await fetch(`${oauthBase(env)}/login/oauth/access_token`, {
      method: 'POST',
      headers: { ...UA, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: authConfig(env).clientId,
        client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl(env, url),
        code_verifier: verifier,
      }),
    });
  } catch {
    return { error: 'unreachable' };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || typeof data.access_token !== 'string' || !data.access_token) return { error: res.ok ? 'rejected' : 'failed' };
  return { token: data.access_token };
}

async function githubUser(env, token) {
  let res;
  try {
    res = await fetch(`${apiBase(env)}/user`, { headers: { ...UA, Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` } });
  } catch {
    return { error: 'unreachable' };
  }
  if (!res.ok) return { error: res.status === 401 || res.status === 403 ? 'rejected' : 'failed' };
  const data = await res.json().catch(() => null);
  if (!data || !Number.isSafeInteger(data.id)) return { error: 'failed' };
  return { id: String(data.id), login: typeof data.login === 'string' ? data.login.slice(0, 39) : '' };
}

/** Revokes the user token (best effort): the admin needs it only to read the account once. */
async function revoke(env, token) {
  const { clientId } = authConfig(env);
  try {
    await fetch(`${apiBase(env)}/applications/${encodeURIComponent(clientId)}/token`, {
      method: 'DELETE',
      headers: { ...UA, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${clientId}:${env.GITHUB_OAUTH_CLIENT_SECRET}`)}` },
      body: JSON.stringify({ access_token: token }),
    });
  } catch {
    console.error('auth: the GitHub user token could not be revoked (it expires on its own)');
  }
}

const redirect = (location, cookies) => {
  const headers = new Headers({ Location: location });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(null, { status: 303, headers });
};
const withCookies = (response, cookies) => {
  for (const c of cookies) response.headers.append('Set-Cookie', c);
  return response;
};

// ---------- the endpoints ----------
async function login(request, env) {
  const url = new URL(request.url);
  const state = randomToken(32);
  const verifier = randomToken(48); // 64 characters, within PKCE's 43 to 128
  const sealed = await seal(env.SESSION_SECRET, 'oauth', { state, verifier }, OAUTH_TTL);
  const authorize = new URL(`${oauthBase(env)}/login/oauth/authorize`);
  authorize.search = new URLSearchParams({
    client_id: authConfig(env).clientId,
    redirect_uri: callbackUrl(env, url),
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
    allow_signup: 'false',
    prompt: 'select_account',
  }).toString();
  // A new sign-in always starts without a session: nothing from before can be carried into it.
  return redirect(authorize.toString(), [cookie(OAUTH_COOKIE, sealed, OAUTH_TTL), clearCookie(SESSION_COOKIE)]);
}

async function callback(request, env) {
  const url = new URL(request.url);
  // The round-trip cookie is single use: it is cleared on every outcome, so a replayed callback can never succeed.
  const done = [clearCookie(OAUTH_COOKIE)];
  const fail = (status, message) => withCookies(signInPage(status, message), done);
  if (url.searchParams.get('error')) return fail(403, 'Sign-in was cancelled on GitHub.');
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(code) || !/^[A-Za-z0-9_-]{20,100}$/.test(state)) return fail(400, 'The sign-in link is incomplete. Start again.');
  const round = await open(env.SESSION_SECRET, 'oauth', readCookie(request, OAUTH_COOKIE));
  if (!round || !sameString(round.state, state) || typeof round.verifier !== 'string') return fail(400, 'This sign-in has expired or was not started here. Start again.');

  const exchanged = await exchangeCode(env, url, code, round.verifier);
  if (exchanged.error) {
    console.error(`auth: code exchange ${exchanged.error}`);
    return fail(exchanged.error === 'rejected' ? 403 : 502, exchanged.error === 'rejected' ? 'GitHub did not accept this sign-in. Start again.' : 'GitHub could not be reached. Try again in a moment.');
  }
  const user = await githubUser(env, exchanged.token);
  await revoke(env, exchanged.token);
  if (user.error) {
    console.error(`auth: reading the GitHub account ${user.error}`);
    return fail(user.error === 'rejected' ? 403 : 502, 'The GitHub account could not be verified. Start again.');
  }
  if (user.id !== authConfig(env).userId) {
    console.error('auth: sign-in refused for a GitHub account that is not the owner');
    return fail(403, 'This GitHub account is not allowed to use the TechPi Admin.');
  }
  const session = await seal(env.SESSION_SECRET, 'session', { sid: randomToken(16), uid: user.id, login: user.login }, SESSION_TTL);
  return redirect('/', [...done, cookie(SESSION_COOKIE, session, SESSION_TTL)]);
}

function logout() {
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  return withCookies(json(200, { signedOut: true }), [clearCookie(SESSION_COOKIE), clearCookie(OAUTH_COOKIE)]);
}

/** Handles /auth/*. Returns a Response, or null when the path is not an auth endpoint. */
export async function handleAuth(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/auth/login') return request.method === 'GET' ? login(request, env) : new Response('Method not allowed.', { status: 405 });
  if (path === '/auth/callback') return request.method === 'GET' ? callback(request, env) : new Response('Method not allowed.', { status: 405 });
  if (path === '/auth/logout') {
    if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });
    const refused = checkSameOrigin(request);
    if (refused) return new Response(JSON.stringify({ error: { message: refused.message } }), { status: refused.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    return logout();
  }
  if (path === '/auth' || path.startsWith('/auth/')) return new Response('Not found.', { status: 404 });
  return null;
}
