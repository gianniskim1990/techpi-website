# TechPi content model

Status: **locked** after the Phase 3 review. Planning only. No content files are created.
Date: 2026-10-02 (revised after approval)

## 1. Locked approach

**Local, typed content in the repository. No CMS for v1.** Case studies are Markdown with typed front matter. Interface and localisation copy are typed EN and EL dictionaries.

| Content | Form | Why |
|---|---|---|
| Case studies | One Markdown file per project per language, with typed front matter | Structured facts plus a long-form narrative. Easy to add: one file, no code |
| Capabilities | One small data file per capability per language | Reused on the homepage and on the capabilities page |
| Interface copy and page copy | Typed dictionaries, one per language | Short strings, tied to layout. A missing Greek string becomes a build error |
| Site facts | One typed data file (company details, contact, social links) | Used by the footer, the contact page and structured data, so they can never disagree |
| Layout and composition | Code | The design is hand-composed. It should not be editable as content |

### Why not the alternatives, for now

| Option | Verdict | Reason |
|---|---|---|
| A headless CMS | Not yet | A handful of case studies edited a few times a year does not justify a second system, an account to secure, an API to depend on at build time and a preview workflow to maintain. |
| MDX | Not yet | Plain Markdown is enough for a narrative with images. MDX becomes useful only if case studies need custom components inside the prose. The switch is easy and local to the project template. |
| Everything in code | No | Case studies are the part of the site that will grow. They should be addable without touching components. |

### When to revisit

Introduce a CMS if any of these become true:

- Someone who does not use Git needs to publish.
- A news or insights section is added, with frequent posts.
- The number of case studies passes about fifteen.

### A future CMS must not affect routes

The architecture keeps that migration possible without changing a single URL:

- **Routes come from data, not from storage.** A case study's URL is built from its `slug` field and the route map. Where the content lives is invisible to the router.
- **The schema is the contract.** Pages read typed entries through one content layer. A CMS would supply entries of the same shape, including the same slugs and locale, in place of the local files.
- **Components never read files directly.** They receive typed data, so swapping the source touches the content layer only.
- **Slugs are explicit and stable.** They are never derived from a title or from a CMS identifier.
- Two migration paths stay open: a git-based CMS editing the same Markdown files, or a headless CMS feeding the same schema at build time. Either keeps the site static.

## 2. Case study schema

Typed and validated at build time. A field marked optional may be absent. Nothing here contains project facts. Those are supplied by TechPi.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | yes | The project name, as the client writes it |
| `slug` | text, explicit | yes | Latin, lower case, identical in both languages. Locked at launch: `cairelink`, `armans`, `sowise-plus` |
| `locale` | `en` or `el` | yes | From the folder |
| `status` | `draft` or `published` | yes | Drafts are never built for production |
| `order` | number | yes | Position in the work index |
| `featured` | boolean | yes | Whether it appears in Selected work on the homepage |
| `category` | text | yes | The short label, for example "Healthcare platform" |
| `summary` | text, one sentence | yes | Used on the homepage panel, the index and in metadata |
| `purpose` | text | yes | The business purpose |
| `scope` | list of text | yes | What TechPi did |
| `technology` | list of text | optional | Shown only when confirmed |
| `capabilities` | list of capability ids | yes | From a fixed set of four. Validated |
| `client` | text | optional | Only where the client may be named |
| `year` | number or range | optional | Only where confirmed |
| `cover` | image | yes | With alt text in this language, width and height |
| `gallery` | list of images | optional | Each with alt text and an optional caption |
| `imageryPolicy` | `standard` or `demo-only` | yes | See section 4 |
| `externalUrl` | URL | optional | A link to the live product |
| `eu` | object | optional | See below |
| `seo.title`, `seo.description` | text | optional | Override the defaults |
| `seo.image` | image | optional | Override the Open Graph image |
| body | Markdown | optional | The long-form narrative |

### EU project data

Present only on EU-funded projects.

| Field | Notes |
|---|---|
| `programme` | The funding programme |
| `projectTitle` | The official project title |
| `acronym` | If different from the case-study title |
| `grantNumber` | The grant agreement number |
| `role` | TechPi's role in the consortium |
| `coordinator` | The coordinating organisation |
| `period` | Start and end |
| `projectUrl` | The official project site |
| `fundingStatement` | The acknowledgement text required by the programme |
| `showEmblem` | Whether the EU emblem must be displayed |

EU-funded projects usually carry visibility obligations: the emblem and a funding statement. The exact wording and whether it applies to a partner's own website depends on the programme and the grant agreement. This must be confirmed with the project coordinator before the SOWISE+ page is published. The schema makes room for it. It does not assume the answer.

## 3. No invented facts: enforced, not just promised

The rule from Phase 1 becomes a build check.

- Every unconfirmed value is written as a marked placeholder during development.
- **The production build fails if any published entry contains a placeholder marker**, an empty required field, or a missing image alt text.
- `status: draft` entries are excluded from production builds, the sitemap and the homepage.
- There are no fields for performance metrics, results or testimonials. If TechPi and a client later confirm a result, a field is added deliberately.

This means a case study cannot go live half-finished by accident.

## 4. Imagery

| Rule | Detail |
|---|---|
| Real captures only | No fabricated dashboards or stock imagery |
| `demo-only` projects | cAIrelink is marked `demo-only`: every image must use demo, mock or redacted data, with no patient or sensitive medical information. A reviewer signs off each image before publication |
| Alt text | Required per image, per language |
| Dimensions | Stored, so the layout never shifts |
| Source files | Kept in the repository at full size. The build generates the responsive versions |
| Until images exist | The typographic placeholder from the prototype, which is honest and neutral |

## 5. Capabilities

Four entries with fixed ids: `digital-products`, `web-experiences`, `intelligence`, `digital-visibility`.

| Field | Notes |
|---|---|
| `id` | Fixed. Referenced by case studies |
| `name` | Per language |
| `summary` | One sentence. Used on the homepage index |
| `items` | The short list shown beside the summary |
| `body` | Longer text for the capabilities page |
| `order` | Digital visibility stays last |

The guardrails from Phase 1 apply to the copy: Digital visibility is described in terms of structure, performance and measurement, and never as campaigns or lead generation.

## 6. Interface and page copy

- One typed dictionary per language, with the same keys. English defines the shape. Greek must satisfy it, so a missing or extra key is a type error.
- Keys are named by meaning (`hero.statement`, `contact.question`), not by position.
- Line breaks in display statements are part of the content, per language, because Greek breaks differently. The hero statement stores its lines, not a single string.
- No string is built by joining fragments. Word order differs between the languages.
- Greek copy is written and curated by hand. There is no machine translation step anywhere in the build.

## 7. What stays in code

- The composition of each homepage section.
- The arc, the edge, the masks and the Contact resolution.
- Navigation structure and order.
- Structured data templates.

## 8. Site facts, all still to confirm

One file feeds the footer, the contact page and the structured data.

Legal name. Registered address. Email. Phone. Company registration and VAT numbers. Social profile URLs. Founding year, if it is to be stated.

None of these is assumed. Until they are supplied, the build guard in section 3 keeps the affected pages out of production.

## 9. Status

Locked: local typed content, Markdown case studies with typed front matter, typed EN and EL dictionaries, no CMS for v1, routes independent of the content source.

Content inputs still needed from TechPi. These are not architecture decisions:

1. Case-study facts and Greek text, per project, before that project is published.
2. Who signs off imagery for `demo-only` projects.
3. The EU visibility requirements for SOWISE+, confirmed with the coordinator.
