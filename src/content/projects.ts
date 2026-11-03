import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/locales';
import type { CapabilityId } from './capabilities';
import { projectsEl } from './projects.el';
import { projectFrom } from './case-study-loader';
import { managedCaseStudies } from './case-studies';
import armansAdmin from '../assets/projects/armans-admin.png';
import armansDevices from '../assets/projects/armans-devices.png';
import logotherapiaSite from '../assets/projects/logotherapia-site.jpg';
import rantevoBookingHome from '../assets/projects/rantevo-booking-home.png';
import rantevoBusinessPage from '../assets/projects/rantevo-business-page.png';
import rocketeerAdmin from '../assets/projects/rocketeer-admin-dashboard.png';
import rocketeerSignIn from '../assets/projects/rocketeer-sign-in.png';

/**
 * TechPi's v1 portfolio: the types and the functions the homepage, the Work index, the Capabilities page and the
 * case-study pages read. Since Task M1B the content itself (both languages, facts, image references) lives in
 * content/case-studies/<slug>/index.json, edited through the admin; the image files stay in src/assets/projects.
 *
 * Every fact comes from the public pigiota314 portfolio, as recorded in docs/content/portfolio-migration.md
 * (which lists each source URL). Nothing here is inferred. There is no field for metrics or results: a case study
 * states outcomes only where the source states them, and then in words.
 *
 * Three different things are kept separate on purpose:
 *   featured    appears in Selected work on the homepage
 *   listed      appears in the Work index (every project here is listed)
 *   caseStudy   has a published case-study page. A project with no `caseStudy` is an index row with no link.
 */

export interface ProjectImage {
  src: ImageMetadata;
  /**
   * The original's size in pixels, declared on purpose. Reading `src.width` or `src.height` marks the original as
   * used, and Astro then also copies the full-size file into dist/ (about 1.3 MB that no page references). The
   * documented `<Image>` only needs `src`. scripts/assets/validate.mjs checks these numbers against the files.
   */
  width: number;
  height: number;
  /** Describes what is shown. Required for every image. */
  alt: string;
  caption?: string;
}

export interface CaseStudy {
  /** The client as named publicly, where the source names one. */
  client?: string;
  year?: number;
  /** The public website of the project, where the source gives one. Shown only on the case-study page. */
  liveUrl?: string;
  overview: readonly string[];
  need: readonly string[];
  built: {
    intro?: string;
    /** What was delivered, item by item. Absent where the source describes the solution in one statement. */
    items?: readonly string[];
  };
  /** The services the source lists for the project, in its words. */
  services?: readonly string[];
  technology?: readonly string[];
  /** Only where the source states real outcomes, and only qualitatively. Absent otherwise. */
  outcome?: readonly string[];
  /** A real capture of the project. Absent where none is published: the page is then led by typography, never by a
   *  stand-in picture. */
  cover?: ProjectImage;
  gallery?: readonly ProjectImage[];
}

export const workGroups = ['client', 'earlier'] as const;
export type WorkGroup = (typeof workGroups)[number];

export interface Project {
  /** Stable, Latin, lower case. Locked in docs/production/routes.md. */
  slug: string;
  /**
   * Work-page grouping: client projects, or earlier pigiota314 work. Since Phase 2H (owner decision, 2026-10-18) the
   * five applications formerly shown as business solutions or an own product are client projects.
   */
  workGroup: WorkGroup;
  name: string;
  category: string;
  summary: string;
  /** Source-backed, scannable functionality labels shown on the Work index (the five web applications). */
  highlights?: readonly string[];
  /** Past creative/marketing disciplines, distinct from TechPi's four current technical capabilities. */
  disciplines?: readonly string[];
  /** Only the four capability ids, and only where the source supports the mapping. */
  capabilities: readonly CapabilityId[];
  featured: boolean;
  /** The real image shown on the homepage and Work rows. Absent: a neutral placeholder is shown. */
  image?: ProjectImage;
  /** Present only for a published case study. */
  caseStudy?: CaseStudy;
  /** The public pigiota314 page this entry was migrated from (internal traceability). */
  source: string;
}

/**
 * The images of the case studies, by the id used in their content files (content/case-studies/<slug>/). Their declared
 * sizes live in those files and are checked against these files by scripts/assets/validate.mjs.
 */
const managedImages = {
  'rocketeer-admin-dashboard': rocketeerAdmin,
  'rocketeer-sign-in': rocketeerSignIn,
  'armans-devices': armansDevices,
  'armans-admin': armansAdmin,
  'logotherapia-site': logotherapiaSite,
  'rantevo-booking-home': rantevoBookingHome,
  'rantevo-business-page': rantevoBusinessPage,
};

/**
 * Every project, in Work-page order. Since Task M1B each one is managed in the admin: its text in both languages, its
 * locked facts and its images come from content/case-studies/<slug>/index.json (see case-studies.ts). Positions are
 * whole numbers from 1; a case study created in the admin takes the next free one. The build fails if two share one.
 */
export const projects: readonly Project[] = (() => {
  const list = [...managedCaseStudies].sort((x, y) => x.doc.facts.order - y.doc.facts.order);
  list.forEach((x, i) => {
    if (i > 0 && x.doc.facts.order === list[i - 1].doc.facts.order) throw new Error(`Two case studies share display position ${x.doc.facts.order}: ${list[i - 1].slug} and ${x.slug}`);
  });
  return list.map((x) => projectFrom(x.doc, x.slug, managedImages));
})();

/** The portfolio in a language. English is the source; Greek takes its editorial text from projects.el.ts. */
export function projectsIn(locale: Locale): readonly Project[] {
  return locale === 'en' ? projects : projects.map(toGreek);
}

/** Projects shown in Selected work on the homepage, in order. */
export function featuredIn(locale: Locale): readonly Project[] {
  return projectsIn(locale).filter((p) => p.featured);
}

/**
 * Projects with a published case study, in the order of the Work page: by group, then as listed. Drives the
 * case-study routes, "Next project" and the related projects.
 */
export function caseStudiesIn(locale: Locale): readonly Project[] {
  const list = projectsIn(locale).filter((p) => p.caseStudy);
  return workGroups.flatMap((group) => list.filter((p) => p.workGroup === group));
}

/** The case study that follows this one, wrapping from the last back to the first. Deterministic. */
export function nextCaseStudy(slug: string, locale: Locale): Project {
  const list = caseStudiesIn(locale);
  const i = list.findIndex((p) => p.slug === slug);
  const next = list[(i + 1) % list.length];
  if (i < 0 || !next) throw new Error(`No published case study with slug: ${slug}`);
  return next;
}

/** Other published case studies in the same Work group, after the one that follows it. At most three. */
export function relatedCaseStudies(slug: string, locale: Locale): readonly Project[] {
  const list = caseStudiesIn(locale);
  const self = list.find((p) => p.slug === slug);
  if (!self) throw new Error(`No published case study with slug: ${slug}`);
  const next = nextCaseStudy(slug, locale);
  return list.filter((p) => p.workGroup === self.workGroup && p.slug !== slug && p.slug !== next.slug).slice(0, 3);
}

/** The featured case studies that show a capability. Used for "Seen in". */
export function caseStudiesWith(capability: CapabilityId, locale: Locale): readonly Project[] {
  return caseStudiesIn(locale).filter((p) => p.featured && p.capabilities.includes(capability));
}

/**
 * The Greek version of a project: shared facts, Greek text. Fails the build if a project, or a case-study part,
 * has no Greek text, so the Greek site can never silently fall back to English.
 */
function toGreek(p: Project): Project {
  const el = projectsEl[p.slug];
  if (!el) throw new Error(`Missing Greek text for project: ${p.slug}`);
  const image = p.image && { ...p.image, alt: required(el.imageAlt, p.slug, 'imageAlt') };
  const study = p.caseStudy;
  if (!study) return {
    ...p,
    category: el.category,
    summary: el.summary,
    highlights: p.highlights && required(el.highlights, p.slug, 'highlights'),
    disciplines: p.disciplines && required(el.disciplines, p.slug, 'disciplines'),
    image,
  };
  const s = el.caseStudy;
  if (!s) throw new Error(`Missing Greek case study for project: ${p.slug}`);
  const gallery = study.gallery?.map((g, i) => ({ ...g, alt: required(s.galleryAlts?.[i], p.slug, 'galleryAlts') }));
  return {
    ...p,
    category: el.category,
    summary: el.summary,
    // The Work-page lists, as in the branch above: without these, the English arrays from `...p` would show on /el/work.
    highlights: p.highlights && required(el.highlights, p.slug, 'highlights'),
    disciplines: p.disciplines && required(el.disciplines, p.slug, 'disciplines'),
    image,
    caseStudy: {
      ...study,
      client: s.client ?? study.client,
      overview: s.overview,
      need: s.need,
      built: s.built,
      services: study.services && required(s.services, p.slug, 'services'),
      technology: study.technology && required(s.technology, p.slug, 'technology'),
      outcome: study.outcome && required(s.outcome, p.slug, 'outcome'),
      cover: study.cover && {
        ...study.cover,
        alt: required(s.coverAlt, p.slug, 'coverAlt'),
        caption: study.cover.caption && required(s.coverCaption, p.slug, 'coverCaption'),
      },
      gallery,
    },
  };
}

function required<T>(value: T | undefined, slug: string, field: string): T {
  if (value === undefined) throw new Error(`Missing Greek ${field} for project: ${slug}`);
  return value;
}
