import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The admin is a static single-page app. Everything it needs, including fonts, is bundled and served from the admin's
// own origin (no CDN at runtime). Two entries:
//   index.html        the custom TechPi Admin (talks only to this Worker's /api; never to GitHub directly)
//   sveltia-m0.html   the legacy M0 Sveltia CMS, kept until the custom admin's GitHub flow is proven, then removed
// `vite build --mode demo --outDir dist-demo` builds the local-only demo variant of the legacy M0 CMS.
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Sveltia's bundle is large by nature; the warning is not actionable here.
    chunkSizeWarningLimit: 20_000,
    rollupOptions: { input: { index: 'index.html', sveltia: 'sveltia-m0.html' } },
  },
});
