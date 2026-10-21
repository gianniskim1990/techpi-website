/**
 * TechPi admin Worker. Every request, for the app and for the API, is checked server-side first, in this order:
 *   1. production mode only (config.js): the request is for the configured admin hostname over HTTPS, and no
 *      local-test setting is present. Otherwise nothing is served (503): no workers.dev, preview or local exposure.
 *   2. Cloudflare Access (auth.js): the Access identity, its audience, the email allowlist; fail closed.
 * API requests must also pass the same-origin checks (auth.js) and are handled by api.js; everything else is a static
 * file of the admin app (GET/HEAD only). Static files and the API are protected the same way: there is no bypass.
 *
 * The admin talks only to this Worker (`connect-src 'self'`): it never contacts GitHub directly and never holds a
 * GitHub credential.
 */
import { authorise, checkSameOrigin } from './auth.js';
import { handleApi } from './api.js';
import { productionProblems } from './config.js';

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
  "form-action 'none'",
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isApi = path === '/api' || path.startsWith('/api/');
    const problems = productionProblems(env, url);
    if (problems.length) {
      console.error(`admin: production configuration refused the request (${problems.length} problem(s))`);
      return deny(503, `The admin is not available here. ${problems.join(' ')}`, isApi);
    }
    const auth = await authorise(env, ctx);
    if (!auth.identity) return deny(auth.status, auth.message, isApi);
    if (isApi) {
      const refused = checkSameOrigin(request);
      if (refused) return deny(refused.status, refused.message, true);
      return withSecurityHeaders(await handleApi(request, env, auth.identity));
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return deny(405, 'Method not allowed.', false);
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
