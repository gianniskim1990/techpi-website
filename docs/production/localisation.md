# TechPi localisation (Phase 3D)

Status: **Greek site complete for the current content.** Not indexed: the whole site stays `noindex` until launch.
Date: 2026-10-05

## 1. How it is built

- One component per page, rendered once per language from `src/pages/` and `src/pages/el/`. The English and Greek pages share the same markup and design.
- Copy lives in typed files with the same shape in both languages, so a missing Greek string fails `npm run check`:
  - Homepage: `src/content/home.en.ts`, `home.el.ts`
  - Secondary pages and the case-study template: `src/content/pages.en.ts`, `pages.el.ts`
  - Interface strings: `src/i18n/en.ts`, `el.ts`
  - Capabilities: both languages in `src/content/capabilities.ts`
- Project **facts** are shared in `src/content/projects.ts` (slugs, names, capabilities, media, years, URLs, sources). Greek **editorial text** for each project is in `src/content/projects.el.ts`, keyed by slug. The build fails if a project or a case-study part has no Greek text.
- Greek display headings use 0.88 of the English size (`--greek-display` in `tokens.css`), as set in `design-system.md` section 3. Body and interface sizes are unchanged. Uppercase labels drop Greek accents correctly because each page declares `lang="el"`.
- Two small Greek-only layout adjustments: tighter desktop navigation gaps (the Greek labels are longer and would otherwise touch the homepage arc), and a narrower About lead so the About arc still passes clear of it.

## 2. Route pairs

Every pair has a self canonical, reciprocal `hreflang="en"` and `hreflang="el"`, and `x-default` pointing to English. The language switch (header, footer and mobile menu) links each page to its exact counterpart.

| English | Greek |
|---|---|
| `/` | `/el/` |
| `/work` | `/el/work` |
| `/capabilities` | `/el/capabilities` |
| `/eu-projects` | `/el/eu-projects` (placeholder in both languages) |
| `/about` | `/el/about` |
| `/contact` | `/el/contact` |
| `/work/rocketeer` | `/el/work/rocketeer` |
| `/work/armans` | `/el/work/armans` |
| `/work/logotherapia-xanthi` | `/el/work/logotherapia-xanthi` |

Slugs are Latin and identical in both languages. Index-only projects have no route in either language. The not-found page exists in both languages and links to each home page.

## 3. Terminology (fixed, used everywhere)

| English | Greek |
|---|---|
| Digital products | Ψηφιακά προϊόντα |
| Web experiences | Διαδικτυακές εμπειρίες |
| Intelligence | Ευφυή συστήματα |
| Digital visibility | Ψηφιακή ορατότητα |
| Work / Capabilities / EU Projects / About / Contact | Έργα / Δυνατότητες / Ευρωπαϊκά έργα / Εταιρεία / Επικοινωνία |
| Menu / Close | Μενού / Κλείσιμο |
| View case study | Δείτε το έργο |
| Next project | Επόμενο έργο |
| Start a project | Ξεκινήστε ένα έργο |
| AI | τεχνητή νοημοσύνη (written out in running text) |

"Intelligence" is rendered as "Ευφυή συστήματα" rather than a literal "Νοημοσύνη", which reads incomplete on its own in Greek. It matches "ευφυή συστήματα" in the brand statement.

## 4. Deliberately not translated

- Names: TechPi, pigiota314, Pi, Tech (in the evolution line), Rocketeer, Rocketeer Dispatch, Arman's Ethnic Street Food, Logotherapia Xanthi, Level Up Education App, Saloon, Physio, Project4You.
- Technology and established industry terms: React, TypeScript, Tailwind CSS, Supabase, Supabase Auth, Leaflet, OpenStreetMap, WordPress, Progressive Web App, SaaS, CMS, UX, UI, SEO, On-page SEO, Generative Engine Optimisation (GEO), web (as in "web εφαρμογή"), responsive, builder, tablet, laptop, email.

## 5. Remaining Greek and content blockers

- The Greek homepage has a meta description. The English homepage still has none (no approved English line yet).
- Open Graph tags do not exist yet in either language. They arrive with the final social images.
- EU Projects stays a placeholder in both languages until its facts are confirmed. Since Phase 3F it is not in the visible navigation.
- Contact now shows the confirmed email, phone and town in both languages ("Xanthi, Greece" / "Ξάνθη, Ελλάδα"). The contact form, Privacy, Cookies and legal entity details are still missing in both languages. See `launch-blockers.md`.
- The Greek copy should get a final read by a native-speaking TechPi reviewer before launch.
