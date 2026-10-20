import { defineConfig } from 'vite';

// The admin is a static single-page app. Everything it needs, including the CMS's fonts and locale files, is bundled
// and served from the admin's own origin (no CDN at runtime). `vite build --mode demo --outDir dist-demo` builds the
// local-only demo variant that uses the in-memory test backend.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Sveltia's bundle is large by nature; the warning is not actionable here.
    chunkSizeWarningLimit: 20_000,
  },
});
