import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The TechPi Admin is a static single-page app. Everything it needs, including fonts, is bundled and served from the
// admin's own origin (no CDN at runtime). It talks only to its Worker's /api, never to GitHub directly.
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
