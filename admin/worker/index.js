/**
 * TechPi admin Worker (M0). Serves the static admin app, and only to an authorised administrator.
 *
 * Authentication is Cloudflare Access, attached to this Worker (Workers > techpi-admin > Access). Access runs before
 * the Worker; the Worker then checks the result itself, server-side, on every request:
 *   1. The admin must be configured (ACCESS_AUD and ADMIN_EMAILS set). Otherwise nothing is served: fail closed.
 *   2. `ctx.access` must exist, i.e. Cloudflare Access authenticated this request. It is undefined otherwise.
 *   3. Its audience must be this Access application's audience tag.
 *   4. The signed-in email must be on the ADMIN_EMAILS allowlist.
 * Only GET and HEAD are served: the Worker has no write endpoints. Content is written by the CMS, in the
 * administrator's browser, to GitHub with the administrator's own repository-scoped token; the Worker holds no
 * GitHub credential.
 *
 * ctx.access: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
 */

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  // Sveltia CMS needs inline styles (documented in its CSP guide); scripts never run inline.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' blob: data: https://avatars.githubusercontent.com",
  "media-src 'self' blob:",
  "frame-src blob:",
  "manifest-src 'self' blob:",
  "connect-src 'self' blob: data: https://api.github.com https://www.githubstatus.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function deny(status, message) {
  return withSecurityHeaders(new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
}

/** The allowlist from the ADMIN_EMAILS variable: comma-separated, case-insensitive. */
function allowlist(env) {
  return String(env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns null if the request is authorised, or the refusal response. */
export async function authorise(request, env, ctx) {
  const admins = allowlist(env);
  if (!env.ACCESS_AUD || admins.length === 0) return deny(503, 'The admin is not configured.');
  if (!ctx || !ctx.access) return deny(403, 'Sign-in through Cloudflare Access is required.');
  if (ctx.access.aud !== env.ACCESS_AUD) return deny(403, 'This sign-in is not for the TechPi admin.');
  let identity;
  try {
    identity = await ctx.access.getIdentity();
  } catch {
    return deny(403, 'The sign-in could not be verified.');
  }
  const email = typeof identity?.email === 'string' ? identity.email.trim().toLowerCase() : '';
  if (!email || !admins.includes(email)) return deny(403, 'This account is not an administrator.');
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const refusal = await authorise(request, env, ctx);
    if (refusal) return refusal;
    if (request.method !== 'GET' && request.method !== 'HEAD') return deny(405, 'Method not allowed.');
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
