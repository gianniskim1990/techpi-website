// @ts-check
import { defineConfig } from 'astro/config';

// Phase 3A foundation. Verified against Astro 7.3.5.
export default defineConfig({
  // Used to build absolute canonical and hreflang URLs from the route map.
  site: 'https://techpi.eu',

  // Fully static. No adapter, no server rendering.
  output: 'static',

  // Canonical form: no trailing slash on normal pages (/work), directory roots keep theirs (/ and /el/).
  // For prerendered pages Astro does not enforce this: the hosting platform does (Cloudflare's
  // "auto-trailing-slash" asset handling, see wrangler.jsonc). 'never' was tried and rejected: in the dev
  // server it makes the canonical Greek root /el/ return 404. 'ignore' lets dev serve both forms.
  // The canonical form is produced by src/i18n/routes.ts and checked against the real build output.
  trailingSlash: 'ignore',

  build: {
    // Write src/pages/work.astro as work.html and src/pages/el/index.astro as el/index.html.
    // Note: with this format Astro.url.pathname contains ".html" for normal pages,
    // so canonical URLs are built from src/i18n/routes.ts and never from Astro.url.
    format: 'preserve',
  },

  // English is the default locale and has no prefix. Greek lives under /el/.
  // No fallback and no redirectToDefaultLocale: Astro must not create any automatic locale redirect.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'el'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // No Markdown is rendered. Off, because Shiki's inline styles cannot meet the Content Security Policy below.
  markdown: {
    syntaxHighlight: false,
  },

  // Content Security Policy (docs/production/security.md). Astro writes a <meta> policy into every page with a hash
  // for each inline script and <style> block it emits, so the hashes always match the build. Inline `style`
  // attributes (build-time layout values such as --i, --x, left, width) are allowed through style-src-attr alone, so
  // no inline <style> element or script runs without a hash. frame-ancestors cannot be set in a
  // <meta> policy, so it is sent as a header (public/_headers), with the rest of the security headers.
  security: {
    csp: {
      directives: ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"],
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
});
