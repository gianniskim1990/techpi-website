/**
 * The public website's Worker. The site itself is static (Cloudflare Workers Static Assets): wrangler.jsonc sends only
 * /api/* to this script (`run_worker_first`), and every other request goes straight to the static files, with their
 * _redirects, _headers and 404 page exactly as before. The one route here is the contact form endpoint (contact.js).
 */
import { handleContact } from './contact.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env);
    // Only /api/* is routed here. Anything else (should the routing ever change) is served as a static file.
    if (!pathname.startsWith('/api/') && env.ASSETS) return env.ASSETS.fetch(request);
    return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  },
};
