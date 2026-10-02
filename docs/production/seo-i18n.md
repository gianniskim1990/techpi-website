# TechPi SEO, visibility and internationalisation

Status: **locked** after the Phase 3 review. Planning only.
Date: 2026-10-02 (revised after approval)
Related: `routes.md` for URLs, canonicals and hreflang.

## 1. Internationalisation architecture

### 1.1 Structure

| Element | Plan |
|---|---|
| Default language | English, unprefixed |
| Greek | Under `/el/` |
| Slugs | Latin, identical in both languages, no trailing slash on normal pages |
| `lang` | `lang="en"` or `lang="el"` on the document, set by the route. `lang` on any inline text in the other language |
| Direction | Left to right for both |
| Routing | Astro's i18n architecture where appropriate: a default locale without a prefix and Greek as a prefixed locale. Greek pages are real static files under `el/`, not a runtime switch |
| Locale redirect | None. No redirection by browser language or location. Language switching is always user-controlled |
| hreflang | Reciprocal `en` and `el`, with `x-default` to English |

### 1.2 One route map

A single typed map lists every page with its path in each language. It is the only source for:

- the language switch
- hreflang annotations
- the sitemap alternates
- internal links

Because everything reads the same map, the language switch, the hreflang set and the sitemap cannot disagree.

### 1.3 Translated content

| Content | Where it lives |
|---|---|
| Interface and page copy | Typed dictionaries, `en` and `el`, with identical keys |
| Case studies and capabilities | One file per language |
| Metadata: title and description | Per page, per language |
| Open Graph title, description and image text | Per page, per language |
| Image alt text | Per language |
| Structured data text | Per language, with `inLanguage` |
| Formatting | Dates and numbers through the platform's locale formatting, never by hand |

### 1.4 Rules

- **No machine translation anywhere in the build.** Greek is written and curated by hand, and reviewed by the client.
- English defines the shape of the dictionary. A missing Greek key fails the build.
- Standard pages must exist in both languages before launch.
- Display statements store their own line breaks per language.
- Greek uppercase labels rely on `lang="el"` so accents are handled by convention.
- Layouts allow about 25% more text length for Greek, and Greek display sizes follow the rules set in the prototype.
- No automatic redirection by browser language.

## 2. Metadata

Every page, in both languages:

| Tag | Rule |
|---|---|
| `title` | Unique. The page subject first, then "TechPi". About 60 characters |
| `meta description` | Unique, plain, descriptive. About 150 characters. Written, not generated |
| `canonical` | Self-referencing, absolute |
| `hreflang` | `en`, `el`, `x-default` |
| Open Graph | `og:title`, `og:description`, `og:url`, `og:type`, `og:image` with dimensions and alt, `og:site_name`, `og:locale` and `og:locale:alternate` |
| Social card | Large image card |
| `robots` | Indexable on production pages. `noindex` on not-found pages and on every preview deployment |
| Theme and icons | The favicon set and manifest, once the final assets exist |

Open Graph images: a designed default per language, and one per case study from its cover. Text inside an image is language-specific, so the Greek pages get Greek images.

A single metadata builder produces all of this from the route map and the page's content, so no page assembles its own tags.

## 3. Structured data

JSON-LD, generated from the same data files as the visible page, so the two can never disagree. Only what is true and visible on the page is marked up.

| Type | Where | Content |
|---|---|---|
| `Organization` | Every page | Name, legal name, URL, logo, contact point, address, social profiles (`sameAs`), and `alternateName` for pigiota314. All company facts are still to confirm |
| `WebSite` | Homepage, both languages | Name, URL, `inLanguage`, publisher |
| `BreadcrumbList` | Work index, case studies, and the secondary pages | Home, section, page |
| `CreativeWork` | Each case study | Name, description, creator (TechPi), `about`, `inLanguage`, URL, image, and funding information where it is an EU project |
| `Service` | Capabilities page, one per capability | Name, description, provider. Optional, see below |

Notes:

- **`alternateName: pigiota314`** on the organisation is the most useful single line for the rebrand. It tells search systems the two names are one entity.
- The logo field needs the final vector mark exported as an image. Until then it is omitted, not filled with a provisional file.
- No `SearchAction`. The site has no search.
- No ratings, reviews, prices, FAQ markup for content that is not a real FAQ, or any type chosen for a hoped-for visual result. Marking up things that are not on the page is against search guidelines and erodes trust.
- `Service` markup is modest in value. It is included only if the capabilities page content is substantial enough to deserve it.
- Every template is validated in CI.

## 4. Sitemap and robots

- `sitemap.xml` with every published URL in both languages, in canonical form, and their alternates. Drafts, previews and not-found pages are excluded.
- `robots.txt` names the sitemap and follows the crawler policy in section 6.3. The final rules are written at launch.
- Worker Preview URLs are blocked from indexing by response header. This is separate from the production `robots.txt` and must not leak into it.

## 5. Technical foundation

The things that actually move rankings and visibility are mostly structural, and the architecture provides them by default:

| Property | How it is provided |
|---|---|
| Complete HTML on first response | Static generation. Every word of copy is in the HTML |
| Nothing hidden behind scripts | No client rendering. Reveals are visual only |
| Semantic structure | One `h1`, ordered headings, landmarks, lists and definition lists for facts |
| Fast pages | The performance budget in `architecture.md` |
| Stable URLs | Fixed slugs and a single slash convention |
| Descriptive links | Link text says where it goes. No "click here" |
| Images | Descriptive alt text, dimensions, modern formats |
| Internal linking | Case studies link to capabilities and to each other. Capabilities link to relevant work. EU Projects links to funded case studies |
| Mobile | The same content and markup at every width |

## 6. Traditional SEO, GEO and AI visibility

The three share one foundation. A system that answers questions, whether a search engine or an AI assistant, can only use what it can fetch, parse and trust. The plan is to be easy to fetch, easy to parse and specific enough to be worth citing.

### 6.1 What the architecture does

1. **Crawlable, complete text.** Every page is full HTML without scripts. AI crawlers often do not run JavaScript, so this matters more for them than for traditional search.
2. **A clear entity.** One consistent statement of who TechPi is, what it does and where, repeated identically in visible copy, metadata and structured data. The About page states it in plain sentences.
3. **Continuity of identity.** "TechPi, formerly pigiota314" in visible text and in structured data.
4. **Specific, verifiable content.** Case studies that say what was built, for whom, with what scope and technology. Specifics are what get quoted. This is also why invented or vague content is harmful, not just dishonest.
5. **Self-contained passages.** Each capability and each case study opens with one or two sentences that make sense when lifted out of the page.
6. **Plain headings that match real questions.** "What we build", not a slogan. Where a real question is commonly asked, it can be answered directly on the relevant page.
7. **Two real languages.** Hand-written Greek with correct hreflang gives proper coverage for Greek-language queries, in search and in assistants.
8. **Freshness signals.** Accurate modification dates in the sitemap. Dated content where dates are real.
9. **Structured data that mirrors the page.** See section 3.

### 6.2 What is deliberately not done

- No hidden text, no keyword lists, no pages written for crawlers.
- No markup types that do not describe the page.
- No invented question-and-answer blocks to capture AI answers.
- No claims in structured data that are absent from the visible page.
- No "AI SEO" plugins or meta tags. There is no recognised markup that makes a page rank in AI answers.

### 6.3 Crawler policy (locked)

**There is no blanket block against AI-related crawlers.** Crawlers are treated in two groups, because they do different things and call for different decisions.

| Group | What it does | Policy |
|---|---|---|
| **Search and discovery** | Traditional search engine crawlers, and the crawlers and fetchers that answer engines and assistants use to find, retrieve and cite pages in response to a user's question | **Allowed,** where doing so supports TechPi's visibility. Being found and cited is the purpose of the site |
| **Training** | Crawlers that collect content to train models, with no direct link to a user finding TechPi | **A separate policy decision.** Allow or disallow is decided on its own merits at launch. It does not follow automatically from the search decision |

Rules for implementation:

1. **The launch `robots.txt` must not accidentally block a search or discovery crawler that is meant to be allowed.** A rule aimed at training crawlers must be written narrowly enough not to catch them.
2. **No wildcard rule by keyword.** Blocking anything with "AI" or "bot" in its name would remove TechPi from answer engines.
3. **The final rules are not written yet.** Crawler names, the split between each vendor's search and training agents, and their stated policies change. They are re-verified against each vendor's current documentation at launch, in Phase 3H, and the file is written then.
4. **Each rule is documented.** The launch file is accompanied by a short record of which crawler each line addresses, which group it belongs to, and why.
5. **`robots.txt` is a request, not access control.** Nothing confidential is published on the assumption that a crawler will obey it.
6. **A check before launch** confirms, crawler by crawler, that every search and discovery agent on the allow list can fetch the homepage, a case study and the sitemap.

This separation is consistent with the Digital visibility capability: visibility in search and in answer engines is wanted, and the question of training use is kept honest and distinct.

### 6.4 One optional, low-cost item, flagged honestly

| Item | Position |
|---|---|
| `llms.txt` | A proposed convention for giving AI systems a plain summary of a site. It costs almost nothing to publish, but there is no confirmation that the major systems use it. It can be added as a courtesy. Nothing is planned around it |

### 6.5 Consistency with what TechPi sells

Digital visibility is one of the four capabilities. The site should be a quiet demonstration of it: fast, structured, specific, bilingual and honest. That is a better proof than any markup trick.

## 7. Measurement

- Search console properties for the domain, covering both languages.
- Cookieless analytics, so visits can be measured without a consent banner.
- A crawl of the built site in CI: broken links, missing metadata, duplicate titles, missing alt text, hreflang reciprocity.
- After launch: indexing status of both language versions, and queries by language.

## 8. Status

Locked: English unprefixed and Greek under `/el/`, `lang="en"` and `lang="el"`, reciprocal hreflang, no automatic locale redirect, one route map, and the crawler policy in section 6.3.

Deferred to launch by design, in Phase 3H:

1. The final `robots.txt` rules, after crawler names and policies are re-verified.
2. The training-crawler decision.

Small implementation choices, settled during the relevant stage. None affects the architecture:

1. `og:locale` values: `en_GB` or `en_US` for English, `el_GR` for Greek.
2. Whether to publish `llms.txt`.
3. Whether the capabilities page content justifies `Service` structured data.
4. The analytics product.

Inputs needed from TechPi: the company facts for `Organization` (legal name, address, contact details, social profiles).
