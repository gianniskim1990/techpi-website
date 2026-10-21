/**
 * TechPi admin Worker. Every request, for the app and for the API, is checked server-side first, in this order:
 *   1. production mode only (config.js): the request is for the configured admin hostname over HTTPS, and no
 *      local-test setting is present. Otherwise nothing is served (503): no workers.dev, preview or local exposure.
 *   2. the sign-in configuration (config.js) is complete. Otherwise nothing is served (503): fail closed.
 *   3. /auth/login, /auth/callback, /auth/logout, /auth/password (auth.js, password.js): GitHub and, when enabled,
 *      email and password sign-in; the only unauthenticated endpoints.
 *   4. a valid session: the one allowed GitHub user ID, or the administrator's password (auth.js). Without it: the
 *      sign-in page for page requests, 401 for the API and for static files. There is no bypass for static assets or the API.
 * API requests must also pass the same-origin checks (auth.js) and are handled by api.js; everything else is a static
 * file of the admin app (GET/HEAD only).
 *
 * The admin talks only to this Worker (`connect-src 'self'`): it never contacts GitHub directly and never holds a
 * GitHub credential.
 */
import { checkSameOrigin, handleAuth, sessionIdentity, signInPage } from './auth.js';
import { handleApi } from './api.js';
import { authConfig, productionProblems } from './config.js';

// The Durable Object class that counts password sign-in attempts (password.js) must be exported by the main module.
export { LoginLimiter } from './password.js';

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  // Inline styles are used by the editor components; scripts never run inline.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  // The sign-in page posts its email and password form to this origin only (/auth/password).
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const BASE_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Content-Security-Policy': CSP,
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(BASE_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const deny = (status, message, isApi) =>
  withSecurityHeaders(
    isApi
      ? new Response(JSON.stringify({ error: { message } }), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
      : new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
  );

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isApi = path === '/api' || path.startsWith('/api/');
    const problems = productionProblems(env, url);
    if (problems.length) {
      console.error(`admin: production configuration refused the request (${problems.length} problem(s))`);
      return deny(503, `The admin is not available here. ${problems.join(' ')}`, isApi);
    }
    const auth = authConfig(env);
    if (!auth.ok) {
      console.error(`admin: sign-in is not configured (${auth.problems.length} problem(s))`);
      return deny(503, 'The admin is not configured.', isApi);
    }
    // A password sign-in problem (a malformed ADMIN_PASSWORD_HASH, or the secret without the LOGIN_LIMITER binding)
    // disables only the password sign-in (password.js); GitHub sign-in keeps working.
    const authResponse = await handleAuth(request, env);
    if (authResponse) return withSecurityHeaders(authResponse);
    const identity = await sessionIdentity(request, env);
    if (!identity) {
      if (isApi) return withSecurityHeaders(new Response(JSON.stringify({ error: { message: 'Sign in to continue.', signIn: '/' } }), { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
      const looksLikePage = (request.method === 'GET' || request.method === 'HEAD') && !/\.[a-z0-9]{1,8}$/i.test(path);
      return withSecurityHeaders(looksLikePage ? signInPage(401, '', env) : new Response('Sign in to continue.', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
    }
    if (isApi) {
      const refused = checkSameOrigin(request);
      if (refused) return deny(refused.status, refused.message, true);
      return withSecurityHeaders(await handleApi(request, env, identity));
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return deny(405, 'Method not allowed.', false);
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
