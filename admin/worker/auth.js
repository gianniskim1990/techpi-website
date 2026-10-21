/**
 * Server-side checks that run before anything is served (M0, unchanged in behaviour):
 *   1. The admin must be configured (ACCESS_AUD and ADMIN_EMAILS). Otherwise nothing is served: fail closed.
 *   2. `ctx.access` must exist, i.e. Cloudflare Access authenticated this request.
 *   3. Its audience must be this Access application's audience tag.
 *   4. The signed-in email must be on the ADMIN_EMAILS allowlist.
 * The identity comes only from Cloudflare (ctx.access), never from anything the browser sends.
 * ctx.access: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
 */

/** The allowlist from the ADMIN_EMAILS variable: comma-separated, case-insensitive. */
export function allowlist(env) {
  return String(env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns { identity } when the request is authorised, or { status, message } when it must be refused. */
export async function authorise(env, ctx) {
  const admins = allowlist(env);
  if (!env.ACCESS_AUD || admins.length === 0) return { status: 503, message: 'The admin is not configured.' };
  if (!ctx || !ctx.access) return { status: 403, message: 'Sign-in through Cloudflare Access is required.' };
  if (ctx.access.aud !== env.ACCESS_AUD) return { status: 403, message: 'This sign-in is not for the TechPi admin.' };
  let identity;
  try {
    identity = await ctx.access.getIdentity();
  } catch {
    return { status: 403, message: 'The sign-in could not be verified.' };
  }
  const email = typeof identity?.email === 'string' ? identity.email.trim().toLowerCase() : '';
  if (!email || !admins.includes(email)) return { status: 403, message: 'This account is not an administrator.' };
  return { identity: { email } };
}

/**
 * Cross-site request protection for the API. A request is accepted only if it carries the admin's own header (a
 * cross-origin page cannot send it without a CORS preflight, which this Worker never answers), and, for writes, a JSON
 * body, an Origin equal to this admin's own origin, and no cross-site Fetch Metadata.
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
