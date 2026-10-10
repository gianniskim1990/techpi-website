# Portfolio migration: pigiota314 → TechPi

> **2026-10-10 update — expanded Work catalogue.** The inventory and seven-row recommendations below
> document the original Phase 3C.2 migration, not the current launch candidate. The owner approved
> showcasing all 18 distinct listings from https://pigiota314.eu/case-studies on the TechPi Work page:
> **7 Client Projects, 4 Business Solutions, 1 Our Product and 6 Earlier Work by pigiota314**.
> These are Work index listings, **not 18 full TechPi case-study pages**. Only the original three
> featured projects have TechPi case-study pages at this stage. Existing duplicated/renamed work
> was consolidated; Rantevo.gr is recorded separately from Saloon, with their precise relationship
> still to be confirmed before writing any comparison of the two. Historical creative/marketing
> work is presented in a clearly separate section, without claiming these disciplines belong to
> the four current TechPi capabilities. Current implementation and copy: `src/content/projects.ts`,
> `projects.el.ts`, `pages.en.ts` and `pages.el.ts`.
>
> **2026-10-10 reconciliation audit (live source re-checked).** https://pigiota314.eu/case-studies lists
> exactly 18 case studies, matching the 18 Work entries one to one by stable slug:
>
> | Source case study (slug on pigiota314.eu) | TechPi slug | Section | TechPi page | Real image on the source |
> |---|---|---|---|---|
> | Rocketeeer (`rocketeer`) | `rocketeer` | Client Projects | case study | yes (already used) |
> | Arman's Ethnic Street Food (`armans-ethnic-street-food-online-ordering`) | `armans` | Client Projects | case study | yes (already used) |
> | Logotherapia Xanthi (`logotherapia-xanthi`) | `logotherapia-xanthi` | Client Projects | case study | placeholder (TechPi uses its own capture of the live site) |
> | Mavie (`mavie-website-rebranding`) | `mavie` | Client Projects | index row | placeholder |
> | iliastech (`iliastech`) | `iliastech` | Client Projects | index row | placeholder |
> | Alexandra Apartment (`alexandra-apartment`) | `alexandra-apartment` | Client Projects | index row | placeholder |
> | Blackjack Streetwear (`blackjack-streetwear`) | `blackjack-streetwear` | Client Projects | index row | placeholder |
> | Rantevo.gr (`rantevo`) | `rantevo` | Business Solutions | index row | **yes, 3 screenshots: now used** |
> | Saloon (`saloon`) | `saloon` | Business Solutions | index row | placeholder |
> | Physio (`physio`) | `physio` | Business Solutions | index row | placeholder |
> | Project4You (`project4you`) | `project4you` | Business Solutions | index row | placeholder |
> | Level Up Education App (`level-up-education-app`) | `level-up-education-app` | Our Products | index row | placeholder |
> | Level Up Education (`level-up-education`) | `level-up-education` | Earlier Work | index row | placeholder |
> | Itsallaboutxanthi (`itsallaboutxanthi`) | `itsallaboutxanthi` | Earlier Work | index row | placeholder |
> | Local Xanthi (`local-xanthi`) | `local-xanthi` | Earlier Work | index row | placeholder |
> | Juliette Coffee Roasters (`juliette-coffee-roasters`) | `juliette-coffee-roasters` | Earlier Work | index row | placeholder |
> | Apox FC (`apox-fc`) | `apox-fc` | Earlier Work | index row | placeholder |
> | Emoved (`emoved`) | `emoved` | Earlier Work | index row | placeholder |
>
> - **Rantevo.gr preview added.** The first source screenshot (the public booking homepage),
>   `src/assets/projects/rantevo-booking-home.png`, is its Work row image. The third source screenshot,
>   a signed-in dashboard showing a personal name, is deliberately not used. Every other entry without
>   a TechPi capture keeps the text-only row: the source itself shows "visual placeholder · real
>   screenshot pending" for them, so there is no real media to reuse.
> - **Level Up Education App** stays under Our Products, by the owner's confirmation (2026-10-10),
>   although the source names its client as "Level Up Education". Project4You, Physio and Saloon name
>   the client "Pigiota314"; Rantevo.gr names "rantevo.gr".
> - **Level Up Education** (website and communication, Earlier Work) and **Level Up Education App**
>   (education web application, Our Products) are separate entries with separate source pages.
> - **Open for the owner:** the source styles the brand "Pigiota314" in titles and authorship, while the
>   TechPi copy writes "pigiota314". Not changed.


Status: **content extraction and editorial preparation (Phase 3C.2).** Internal production documentation. No production code, imagery or routes are changed by this document.
Date: 2026-10-03
Source of truth: the public pigiota314 portfolio, https://pigiota314.gr/portfolio/ (page modified 2026-05-20), and the 18 project pages linked from it, all fetched live on 2026-10-03.

Rules applied:

- Only facts stated on the public project pages are used. Nothing is inferred.
- The template sentence repeated on every page ("Κάθε project αντιμετωπίζεται ως συνδυασμός στρατηγικής, UX/UI, …") is boilerplate and is ignored.
- Content that is visibly copied from another project is ignored (see Logotherapia Xanthi redesign).
- The old service labels (Web Design, SEO, Social Media, Branding, Graphic Design, Digital Marketing, Web Applications) are **not** carried over. They are mapped to the four TechPi capabilities only where the page content supports it.
- **SOWISE+ is removed** from TechPi Work entirely (homepage, `/work`, case-study routes, project data). It does not appear in this portfolio either. EU Projects remains a separate future content stream.
- **cAIrelink is not in the public portfolio.** With no public source, it is not migrated.

---

## 1. Inventory

Eighteen projects are listed on the portfolio page. "Own product" means the source names the client as "Pigiota314".

| # | Project (as on source) | Source URL | Client (source) | Year | Live URL (source) | Old labels |
|---|---|---|---|---|---|---|
| 1 | Rocketeer (Rocketeer Dispatch) | /case-studies/rocketeer-custom-web-application/ | Rocketeer | 2026 | rocketeer.gr | SEO, Web Applications, Web Design |
| 2 | Arman's Ethnic Street Food – online ordering platform | /case-studies/armans-ethnic-street-food-online-ordering/ | Arman's Ethnic Street Food | 2026 | armanstreetfood.gr | Web Applications, Web Design |
| 3 | Λογοθεραπεία Ξάνθη – Website Redesign | /case-studies/logotherapia-xanthi-website-redesign/ | Κέντρο Λογοθεραπείας & Εργοθεραπείας (named after its therapist) | 2026 | logotherapia-xanthi.gr | SEO, Web Design |
| 4 | Level Up Education App | /case-studies/level-up-education-app/ | Level Up Education | 2026 | app.levelupeducation.gr | Web Applications, Web Design |
| 5 | Saloon | /case-studies/saloon/ | Pigiota314 (own product) | 2026 | saloon.pigiota314.gr | Web Applications |
| 6 | Physio | /case-studies/physio/ | Pigiota314 (own product) | 2026 | physio.pigiota314.gr | Web Applications |
| 7 | Project4You | /case-studies/project4you/ | Pigiota314 (own product) | 2026 | project4you.gr | Web Applications, Web Design |
| 8 | Mavie Website Rebranding | /case-studies/mavie-website-rebranding/ | Mavie | 2025 | mavie.gr | Branding, Graphic Design, Web Design |
| 9 | iliastech | /case-studies/iliastech/ | iliastech | 2026 | iliastech.gr | Web Design |
| 10 | Alexandra Apartment | /case-studies/alexandra-apartment/ | Alexandra Apartment | 2025 | alexandra-apartment.gr | SEO, Web Design |
| 11 | Blackjack Streetwear | /case-studies/blackjack-streetwear/ | Blackjack Streetwear | 2025 | none given | Web Design |
| 12 | Level Up Education (website and marketing) | /case-studies/level-up-education/ | Level Up Education | 2026 | levelupeducation.gr | Digital Marketing, SEO, Social Media, Web Design |
| 13 | Logotherapia Xanthi (earlier entry) | /case-studies/logotherapia-xanthi/ | Logotherapia Xanthi | 2026 | logotherapia-xanthi.gr | SEO, Social Media, Web Design |
| 14 | Itsallaboutxanthi | /case-studies/itsallaboutxanthi/ | Itsallaboutxanthi | 2025 | none given | Digital Marketing, Graphic Design, Social Media, Web Design |
| 15 | Juliette Coffee Roasters | /case-studies/juliette-coffee-roasters/ | Juliette Coffee Roasters | 2026 | none given | Digital Marketing, SEO, Social Media |
| 16 | Local Xanthi | /case-studies/local-xanthi/ | Local Xanthi | 2025 | none given | Digital Marketing, Social Media |
| 17 | Apox FC | /case-studies/apox-fc/ | Apox FC | 2025 | none given | Digital Marketing, Graphic Design, Social Media |
| 18 | Emoved | /case-studies/emoved/ | Emoved | 2025 | none given | Branding, Graphic Design |

All source URLs are under `https://pigiota314.gr`.

---

## 2. Classification and mapping

Capabilities: **DP** Digital products, **WE** Web experiences, **IN** Intelligence, **DV** Digital visibility.

| # | Project | Facts available | Facts missing | TechPi capabilities | Status | Proposed slug | Homepage |
|---|---|---|---|---|---|---|---|
| 1 | Rocketeer | Overview, need (three user groups), solution (seven specific features), qualitative results, stack (React, TypeScript, Tailwind CSS, Supabase, Supabase Auth, Leaflet, OpenStreetMap), 2 images, live URL, client, year | Metrics, scope split by role, start date | DP | **Ready for case study** | `rocketeer` | **Yes** |
| 2 | Arman's Ethnic Street Food | Overview, need, solution, qualitative results, implementation features (PWA, payment integration, admin dashboard, order management), 2 images, live URL, client, year | Framework or stack names, metrics | DP, WE | **Ready for case study** | `armans` | **Yes** |
| 3 | Logotherapia Xanthi (redesign) | Overview, need, solution, services (website redesign, UI/UX, responsive, content structure, WordPress development, on-page SEO, performance optimisation), live URL, client, year | **Any project image**, a genuine results section, metrics | WE, DV | **Ready for case study** (text), blocked on imagery | `logotherapia-xanthi` | **Yes** |
| 4 | Level Up Education App | One sentence each for overview, need, solution, result. Stack (React, TypeScript, Supabase, Tailwind CSS), live URL, client, year | Detail, images | DP | Work index only | `level-up-education` | No |
| 5 | Saloon | Short overview, need, solution (public booking page, dashboard, clients, services, plan-based features), stack, live URL, year | Detail, images, any client deployment | DP | Work index only | `saloon` | No |
| 6 | Physio | One sentence each, stack, live URL, year | Detail, images | DP | Work index only | `physio` | No |
| 7 | Project4You | One sentence each (CMS for websites and digital invitations, modular, themes), stack, live URL, year | Detail, images | DP | Work index only | `project4you` | No |
| 8 | Mavie | One sentence each (website rebrand on WordPress), live URL, year | Detail, images | WE | Work index only, **not recommended for v1** | `mavie` | No |
| 9 | iliastech | One sentence each (corporate website on WordPress), live URL, year | Detail, images | WE | Work index only, **not recommended for v1** | `iliastech` | No |
| 10 | Alexandra Apartment | One sentence each (hospitality website, WordPress, local SEO direction), live URL, year | Detail, images | WE, DV | Work index only, **not recommended for v1** | `alexandra-apartment` | No |
| 11 | Blackjack Streetwear | One sentence each (e-shop on WordPress and WooCommerce), year | Live URL, detail, images | WE | Work index only, **not recommended for v1** | `blackjack-streetwear` | No |
| 12 | Level Up Education (website and marketing) | One sentence each. Website, SEO content, social media campaigns. Tools include WordPress, WPBakery, Yoast SEO, Meta Ads, GA4 | Detail, images | WE, DV (the social media and ads part has no TechPi capability) | Insufficient source content | — | No |
| 13 | Logotherapia Xanthi (earlier entry) | Thin. Same live URL as #3 | — | — | **Excluded: duplicate of #3** | — | No |
| 14 | Itsallaboutxanthi | Thin. Website plus social, graphics, marketing | Live URL, detail | — | Excluded: marketing-led, thin | — | No |
| 15 | Juliette Coffee Roasters | Thin. Social media and SEO support | Live URL, detail | — | Excluded: no TechPi product or web work shown | — | No |
| 16 | Local Xanthi | Thin. Social media only | Everything technical | — | Excluded: social media only | — | No |
| 17 | Apox FC | Thin. Social content and graphics | Everything technical | — | Excluded: social media and graphics only | — | No |
| 18 | Emoved | Thin. Graphic design | Everything technical | — | Excluded: graphic design only | — | No |

Notes on mapping:

- **Old "SEO" on Rocketeer** is a mislabel on the source (the page has no SEO content). Rocketeer maps to Digital products only.
- **Arman's** maps to Web experiences as well because the source says the platform combines the restaurant's website, menu, basket, checkout and order management.
- **Logotherapia Xanthi** maps to Digital visibility because the source explicitly states on-page SEO and a content structure that helps search engines understand the services.
- **Intelligence: no portfolio project supports it.** None is mapped. The capability stays on TechPi as a stated capability, with no "Seen in" link until real work exists.
- Social media, graphic design and branding work have no TechPi capability and are not migrated.
- Context descriptors (healthcare, hospitality, B2B, logistics, education) go in `category`, never in `capabilities`.

### 2.1 Source defects found

- **Logotherapia Xanthi redesign:** the "Results" section and the second tools list (React, TypeScript, Supabase, Leaflet, OpenStreetMap…) are copied word for word from the Rocketeer page. Both are ignored. Only its first services list (which names WordPress) is used.
- The portfolio page lists two separate Logotherapia Xanthi entries for the same site. Only the redesign is migrated.
- Saloon, Physio and Project4You name the client as "Pigiota314". They are the company's own products, not client work, and two run on `pigiota314.gr` subdomains.

---

## 3. Homepage Featured Work (three)

| Order | Project | Why |
|---|---|---|
| 1 | **Rocketeer** | The strongest evidence of the new positioning: a B2B operational system with three user roles, real-time coordination needs, and a named modern stack. Clearly "Digital Products & Technology" |
| 2 | **Arman's Ethnic Street Food** | A customer-facing product with a business purpose stated plainly (an own ordering channel, less dependence on marketplaces), plus an admin system, PWA and payments. Different user and sector from Rocketeer |
| 3 | **Logotherapia Xanthi** | Gives the selection range: a technically sound web experience with information architecture and search visibility, for a therapy centre. It is the only other project with enough source content for a full case study |

Considered and not chosen: **Level Up Education App** fits the product positioning but the source gives one sentence per section, so it cannot carry a case study; **Saloon, Physio, Project4You** are own products with thin pages and no images.

If a fully product-led selection is preferred later, Level Up Education App is the natural replacement for slot 3, once more source material exists.

**Imagery blocker for slot 3:** the Logotherapia Xanthi page has no images. A cover capture of the live site is needed before it can appear as a case study (see section 5).

---

## 4. Work index plan

`/work` shows the broader curated portfolio, not only the homepage three.

| Order | Project | Row links to |
|---|---|---|
| 1 | Rocketeer | case study |
| 2 | Arman's Ethnic Street Food | case study |
| 3 | Logotherapia Xanthi | case study (once its cover exists) |
| 4 | Level Up Education App | no link (index only) |
| 5 | Saloon | no link |
| 6 | Physio | no link |
| 7 | Project4You | no link |

Seven rows stays below the eight-row guidance in the secondary-page spec. The four WordPress brochure and e-shop projects (Mavie, iliastech, Alexandra Apartment, Blackjack Streetwear) are source-sufficient for index rows but **not recommended for v1**: they are thin, they dilute the product positioning, and none has images. They can be added later as index rows without design changes.

**Decision needed:** how to present the three own products (Saloon, Physio, Project4You). Proposed category labels make it explicit, for example "Booking platform, TechPi product". Their live URLs on `pigiota314.gr` subdomains should not be linked from TechPi until they move.

---

## 5. Media

| Project | Available on source | Recommended cover | Supporting |
|---|---|---|---|
| Rocketeer | `wp-content/uploads/2026/05/Στιγμιότυπο-οθόνης-2026-08-27-105228.png` (full screen), `…-105326-1024x384.png` (wide crop) | The full-screen capture (105228) | The wide crop (105326) |
| Arman's | `wp-content/uploads/2026/09/armanstreetfood.gr_.png` (full page), `arman2-1024x757.png` | `arman2` (1024×757, closer to 16:10) | The full-page capture |
| Logotherapia Xanthi | **None** | A new capture of the live site (logotherapia-xanthi.gr), desktop and mobile | Interior page captures |
| Level Up Education App, Saloon, Physio, Project4You | None | Neutral placeholder on the Work index | — |

- All files are pigiota314's own public portfolio uploads, so they can move to TechPi. They are **not downloaded in this step.**
- Arman's 1024-wide variant is a WordPress-resized copy. The original full-size uploads should be requested from the WordPress media library rather than scraped.
- No stock imagery is used anywhere. A project without a real capture keeps the neutral placeholder.

---

## 6. Case-study drafts (English, TechPi tone)

Source facts only. Each draft follows the approved block order. Sections with no supported content are omitted.

### 6.1 Rocketeer (`/work/rocketeer`)

- **Category:** Delivery operations platform
- **Summary:** A custom web application that organises delivery requests, drivers and assignments in one place.
- **Facts:** Client: Rocketeer. Year: 2026. Capabilities: Digital products. Live: rocketeer.gr

**Overview.** Rocketeer Dispatch is a custom web application for running a delivery service. It brings partner businesses, the administrator and drivers into one digital environment, where requests are created, assigned and followed through to delivery.

**The business need.** Three groups needed different things from the same system. Partner businesses needed a simple way to submit delivery or shift requests. Drivers needed a clear view of their current and upcoming assignments and the status of each request. The administrator needed full oversight of requests, drivers, businesses, assignments and key financial figures. All of it had to be fast and simple to use in real operating conditions, where decisions are made on the spot.

**What we built.**
- Role-based dashboards for administrators, businesses and drivers, each showing only what that role needs
- An admin panel for managing businesses, drivers, requests and assignments
- A business panel for creating delivery or shift requests
- A driver panel showing active and upcoming assignments
- Manual driver assignment, so the administrator keeps control
- A request flow that keeps new requests manageable even when no driver is immediately available
- A mobile-friendly interface for everyday use by drivers and businesses

**Technology.** React, TypeScript, Tailwind CSS, Supabase with Supabase Auth and role-based access, and maps built on Leaflet and OpenStreetMap.

**Outcome** (qualitative, as stated in the source; no figures are claimed). Businesses, drivers and requests are managed centrally. Active and upcoming assignments are clearer. There is less need for constant coordination by phone or message. The system is a base that can be extended with further features.

### 6.2 Arman's Ethnic Street Food (`/work/armans`)

- **Category:** Direct ordering platform
- **Summary:** A platform that lets the restaurant take orders directly from its customers. *(the approved homepage line, still accurate)*
- **Facts:** Client: Arman's Ethnic Street Food. Year: 2026. Capabilities: Digital products, Web experiences. Live: armanstreetfood.gr

**Overview.** A custom online ordering platform for Arman's Ethnic Street Food. Customers browse the digital menu, add items to their basket and complete the order on the restaurant's own website. A separate management environment lets the business run its products, orders and the overall flow of the system.

**The business need.** The restaurant needed its own online ordering channel: easy for customers, and giving the business more control over its digital orders without depending entirely on third-party marketplace platforms. The experience had to reflect the brand and keep ordering quick, especially on mobile. Behind it, the business needed one central system for the menu and incoming orders.

**What we built.** One platform that combines the restaurant's website, digital menu, basket, checkout and order management. An administration dashboard for the menu and orders. Support for different payment methods. A mobile-first build that works across phones, tablets and desktops, with Progressive Web App support for an app-like experience directly in the browser.

**Technology.** Custom web application, Progressive Web App, responsive web development, online payment integration, custom administration dashboard, order management system. *(The source names no framework, so none is stated.)*

**Outcome** (qualitative, as stated in the source). The restaurant has its own direct channel for online orders. Its online presence, menu and ordering sit in one branded experience, and the business has more control over the menu, orders and the customer experience.

### 6.3 Logotherapia Xanthi (`/work/logotherapia-xanthi`)

- **Category:** Therapy centre website
- **Summary:** A redesigned website for a speech and occupational therapy centre in Xanthi, organised so families can find information and get in touch easily.
- **Facts:** Client: Speech and Occupational Therapy Centre, Xanthi. Year: 2026. Capabilities: Web experiences, Digital visibility. Live: logotherapia-xanthi.gr

**Overview.** A redesign of the centre's website, aiming for a more modern, friendly and usable presence. The design reflects the centre's human, child-centred character while keeping a clean, professional image. Content is organised so parents can easily find the services offered, the conditions treated, the therapy space and how to make contact.

**The business need.** The existing site needed renewing to present the centre's services and approach more clearly. The main challenge was to organise a wide range of information simply for parents, without the site feeling cold or overly clinical, and to provide modern navigation that works on every device and leads visitors quickly to the information and contact details they need.

**What we built.** A clear information architecture with separate sections for services, conditions, the therapy space, insurance funds and contact. Soft colours, readable typography, photography of the therapy environment and clear calls to action for an assessment or appointment. A responsive layout for phones, tablets and desktops, and a content structure that helps both visitors and search engines understand the centre's services.

**Technology.** WordPress, responsive design, on-page SEO and performance optimisation.

**Outcome.** Omitted. The source's results section belongs to another project.

**Naming note:** the source names the centre after its therapist. The TechPi case study uses the project name "Logotherapia Xanthi" and the centre's description, not the person's name, unless TechPi prefers otherwise.

### 6.4 Next project order

Rocketeer → Arman's → Logotherapia Xanthi → Rocketeer.

---

## 7. Changes to the current TechPi data (plan only, not applied)

`src/content/projects.ts` currently holds provisional data: cAIrelink, Arman's, SOWISE+.

| Current entry | Plan |
|---|---|
| cAIrelink | **Remove.** Not in the public portfolio |
| Arman's | **Keep**, now supported by the source. Category and summary unchanged. Capabilities `digital-products`, `web-experiences`, confirmed by source |
| SOWISE+ | **Remove** everywhere, with its `context` value |
| (new) Rocketeer | **Add**, featured. Capabilities `digital-products` |
| (new) Logotherapia Xanthi | **Add**, featured. Capabilities `web-experiences`, `digital-visibility` |
| (new) Level Up Education App, Saloon, Physio, Project4You | **Add** as index-only rows. Capabilities `digital-products` |

Consequences to apply in implementation:

- `capabilitiesConfirmed` becomes true for migrated projects, because the mapping is now source-backed.
- `routes.md` locked slugs change: `cairelink` and `sowise-plus` are dropped; `rocketeer` and `logotherapia-xanthi` are added; `armans` stays.
- The homepage Selected Work changes its three projects and their text. That is a visible homepage change and is done in the implementation step, not here.
- "Seen in" links on Capabilities can be switched on for Digital products, Web experiences and Digital visibility once case studies publish. Intelligence keeps none.

---

## 8. Gaps that genuinely block publishing

1. **Logotherapia Xanthi has no imagery.** It needs a capture of the live site before its case study (and its homepage slot) can go live.
2. **Original full-size images** for Rocketeer and Arman's should come from the WordPress media library. The scraped files are resized or screen captures.
3. **Own products (Saloon, Physio, Project4You):** a decision is needed on how TechPi presents its own products, and their `pigiota314.gr` subdomain URLs should not be linked.
4. **Greek case-study text** is written in Phase 3D from the Greek source pages.

Not blockers: no metrics exist and none are needed. Permission is not a blocker for the migrated projects, because they are already published publicly by the same company under its previous name.
