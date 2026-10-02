# techpi-website
Official website of TechPi — Digital Products &amp; Technology

## Development

Astro, static output. Requires Node 24 (see `.node-version`).

```bash
npm install
npm run dev       # development server
npm run check     # Astro and TypeScript checks
npm run build     # production build into dist/
npm run preview   # serve dist/ locally. Not authoritative for Cloudflare URL behaviour
```

To check how Cloudflare serves the build, run `npx wrangler dev` after `npm run build`.

Documentation is in `docs/`. Design studies in `explorations/` are never deployed. Source brand files in `brand-source/` are never deployed.
