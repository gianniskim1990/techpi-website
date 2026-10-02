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
});
