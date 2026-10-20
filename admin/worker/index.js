/**
 * TechPi admin Worker. Every request, for the app and for the API, is authorised server-side first (auth.js:
 * Cloudflare Access identity, audience, email allowlist; fail closed). API requests must also pass the same-origin
 * checks (auth.js) and are handled by api.js; everything else is a static file of the admin app (GET/HEAD only).
 *
 * The custom admin talks only to this Worker (`connect-src 'self'`): it never contacts GitHub directly. The legacy
 * Sveltia page of M0 (/sveltia-m0.html), kept until the custom admin's GitHub flow is proven, is the only page allowed
 * to reach api.github.com.
 */
import { authorise, checkSameOrigin } from './auth.js';
import { handleApi } from './api.js';

const LEGACY_PAGE = '/sveltia-m0.html';
const csp = (legacy) => [
  "default-src 'none'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  // Inline styles are needed by the rich-text editor and by Sveltia; scripts never run inline.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' blob: data:" + (legacy ? ' https://avatars.githubusercontent.com' : ''),
  "media-src 'self' blob:",
  "frame-src blob:",
  "manifest-src 'self' blob:",
  "connect-src 'self'" + (legacy ? ' blob: data: https://api.github.com https://www.githubstatus.com' : ''),
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
};

function withSecurityHeaders(response, path) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(BASE_HEADERS)) headers.set(name, value);
  headers.set('Content-Security-Policy', csp(path === LEGACY_PAGE));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const deny = (status, message, path, isApi) =>
  withSecurityHeaders(
    isApi
      ? new Response(JSON.stringify({ error: { message } }), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
      : new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
    path,
  );

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const isApi = path === '/api' || path.startsWith('/api/');
    const auth = await authorise(env, ctx);
    if (!auth.identity) return deny(auth.status, auth.message, path, isApi);
    if (isApi) {
      const refused = checkSameOrigin(request);
      if (refused) return deny(refused.status, refused.message, path, true);
      return withSecurityHeaders(await handleApi(request, env, auth.identity), path);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return deny(405, 'Method not allowed.', path, false);
    return withSecurityHeaders(await env.ASSETS.fetch(request), path);
  },
};
