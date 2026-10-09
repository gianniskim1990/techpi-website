import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/locales';
import type { CapabilityId } from './capabilities';
import { projectsEl } from './projects.el';
import armansAdmin from '../assets/projects/armans-admin.png';
import armansDevices from '../assets/projects/armans-devices.png';
import logotherapiaSite from '../assets/projects/logotherapia-site.jpg';
import rocketeerAdmin from '../assets/projects/rocketeer-admin-dashboard.png';
import rocketeerSignIn from '../assets/projects/rocketeer-sign-in.png';

/**
 * The single source of truth for TechPi's v1 portfolio. The homepage, the Work index, the Capabilities page and the
 * case-study pages all read from here. English text. Greek arrives in Phase 3D.
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
    items: readonly string[];
  };
  technology?: readonly string[];
  /** Only where the source states real outcomes, and only qualitatively. Absent otherwise. */
  outcome?: readonly string[];
  cover: ProjectImage;
  gallery?: readonly ProjectImage[];
}

export interface Project {
  /** Stable, Latin, lower case. Locked in docs/production/routes.md. */
  slug: string;
  name: string;
  category: string;
  summary: string;
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

const src = 'https://pigiota314.gr/case-studies/';

export const projects: readonly Project[] = [
  {
    slug: 'rocketeer',
    name: 'Rocketeer',
    category: 'Delivery operations platform',
    summary: 'A custom web application that organises delivery requests, drivers and assignments in one place.',
    capabilities: ['digital-products'],
    featured: true,
    source: `${src}rocketeer-custom-web-application/`,
    image: {
      src: rocketeerAdmin,
      width: 2612,
      height: 980,
      alt: 'The Rocketeer administration dashboard: a side menu, summary counts for pending and active requests, businesses and drivers, and a list of recent requests.',
    },
    caseStudy: {
      client: 'Rocketeer',
      year: 2026,
      liveUrl: 'https://rocketeer.gr/',
      overview: [
        'Rocketeer Dispatch is a custom web application for running a delivery service. It brings partner businesses, the administrator and drivers into one digital environment, where requests are created, assigned and followed through to delivery.',
      ],
      need: [
        'Three groups needed different things from the same system. Partner businesses needed a simple way to submit delivery or shift requests. Drivers needed a clear view of their current and upcoming assignments and of the status of each request. The administrator needed full oversight of requests, drivers, businesses, assignments and key financial figures.',
        'All of it had to be fast and simple to use in real operating conditions, where decisions are made on the spot.',
      ],
      built: {
        items: [
          'Role-based dashboards for administrators, businesses and drivers, each showing only what that role needs',
          'An admin panel for managing businesses, drivers, requests and assignments',
          'A business panel for creating delivery or shift requests',
          'A driver panel showing active and upcoming assignments',
          'Manual driver assignment, so the administrator keeps control',
          'A request flow that keeps new requests manageable even when no driver is immediately available',
          'A mobile-friendly interface for everyday use by drivers and businesses',
        ],
      },
      technology: [
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Supabase, including Supabase Auth',
        'Leaflet and OpenStreetMap',
      ],
      outcome: [
        'Businesses, drivers and requests are managed in one place.',
        'Active and upcoming assignments are clearer.',
        'Less need for constant coordination by phone or message.',
        'Easier everyday use on mobile devices for drivers and businesses.',
        'A base that can be extended with further features.',
      ],
      cover: {
        src: rocketeerAdmin,
        width: 2612,
        height: 980,
        alt: 'The Rocketeer administration dashboard: a side menu, summary counts for pending and active requests, businesses and drivers, and a list of recent requests.',
      },
      gallery: [
        {
          src: rocketeerSignIn,
          width: 1018,
          height: 850,
          alt: 'The Rocketeer sign-in screen, with the Rocketeer logo above an email and password form.',
        },
      ],
    },
  },
  {
    slug: 'armans',
    name: 'Arman’s Ethnic Street Food',
    category: 'Direct ordering platform',
    summary: 'A platform that lets the restaurant take orders directly from its customers.',
    capabilities: ['digital-products', 'web-experiences'],
    featured: true,
    source: `${src}armans-ethnic-street-food-online-ordering/`,
    image: {
      src: armansDevices,
      width: 940,
      height: 788,
      alt: 'The Arman’s Ethnic Street Food website shown on a laptop, a tablet and a phone.',
    },
    caseStudy: {
      client: 'Arman’s Ethnic Street Food',
      year: 2026,
      liveUrl: 'https://armanstreetfood.gr/',
      overview: [
        'A custom online ordering platform for Arman’s Ethnic Street Food. Customers browse the digital menu, add items to their basket and complete the order on the restaurant’s own website. A separate management environment lets the business run its products, orders and the overall flow of the system.',
      ],
      need: [
        'The restaurant needed its own online ordering channel: easy for customers, and giving the business more control over its digital orders without depending entirely on third-party marketplace platforms.',
        'The experience had to reflect the brand and keep ordering quick, especially on mobile. Behind it, the business needed one central system for the menu and incoming orders.',
      ],
      built: {
        intro:
          'One platform that combines the restaurant’s website, digital menu, basket, checkout and order management.',
        items: [
          'An administration dashboard for the menu and for orders',
          'Support for different payment methods',
          'A mobile-first build that works across phones, tablets and desktops',
          'Progressive Web App support, for an app-like experience directly in the browser',
        ],
      },
      technology: [
        'Custom web application',
        'Progressive Web App',
        'Responsive web development',
        'Online payment integration',
        'Custom administration dashboard',
        'Order management system',
      ],
      outcome: [
        'The restaurant has its own direct channel for online orders.',
        'Its online presence, menu and ordering sit in one branded experience.',
        'The business has more control over the menu, the orders and the customer experience.',
      ],
      cover: {
        src: armansDevices,
        width: 940,
        height: 788,
        alt: 'The Arman’s Ethnic Street Food website shown on a laptop, a tablet and a phone.',
      },
      gallery: [
        {
          src: armansAdmin,
          width: 1711,
          height: 1265,
          alt: 'The management area of the Arman’s website, with four sections: menu, settings, orders and statistics.',
        },
      ],
    },
  },
  {
    slug: 'logotherapia-xanthi',
    name: 'Logotherapia Xanthi',
    category: 'Therapy centre website',
    summary:
      'A redesigned website for a speech and occupational therapy centre in Xanthi, organised so families can find information and get in touch easily.',
    capabilities: ['web-experiences', 'digital-visibility'],
    featured: true,
    source: `${src}logotherapia-xanthi-website-redesign/`,
    image: {
      src: logotherapiaSite,
      width: 2880,
      height: 1800,
      alt: 'The Logotherapia Xanthi website: the site navigation above a section explaining speech therapy and occupational therapy.',
    },
    caseStudy: {
      client: 'Speech and Occupational Therapy Centre, Xanthi',
      year: 2026,
      liveUrl: 'https://logotherapia-xanthi.gr/',
      overview: [
        'A redesign of the website of a speech and occupational therapy centre in Xanthi, aiming for a more modern, friendly and usable presence. The design reflects the centre’s human, child-centred character while keeping a clean, professional image.',
        'Content is organised so parents can easily find the services offered, the conditions treated, the therapy space and how to make contact.',
      ],
      need: [
        'The existing site needed renewing to present the centre’s services and approach more clearly. The main challenge was to organise a wide range of information simply for parents, without the site feeling cold or overly clinical.',
        'It also needed modern navigation that works on every device and leads visitors quickly to the information and contact details they need.',
      ],
      built: {
        items: [
          'A clear information architecture, with separate sections for services, conditions, the therapy space, insurance funds and contact',
          'A design with soft colours, readable typography, photography of the therapy environment and clear calls to action for an assessment or appointment',
          'A responsive layout for phones, tablets and desktops',
          'A content structure that helps both visitors and search engines understand the centre’s services',
        ],
      },
      technology: ['WordPress', 'Responsive design', 'On-page SEO', 'Performance optimisation'],
      cover: {
        src: logotherapiaSite,
        width: 2880,
        height: 1800,
        alt: 'The Logotherapia Xanthi website: the site navigation above a section explaining speech therapy and occupational therapy.',
        caption: 'A capture of the live website.',
      },
    },
  },
  {
    slug: 'level-up-education-app',
    name: 'Level Up Education App',
    category: 'Education management application',
    summary:
      'A web application for managing students, courses and the day-to-day operations of a tutoring centre.',
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}level-up-education-app/`,
  },
  {
    slug: 'saloon',
    name: 'Saloon',
    category: 'Booking platform',
    summary:
      'An online booking web application for beauty businesses, with a public booking page, a client dashboard and plan-based features.',
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}saloon/`,
  },
  {
    slug: 'physio',
    name: 'Physio',
    category: 'Appointment management platform',
    summary: 'A platform for physiotherapists and physiotherapy clinics to organise appointments and sessions.',
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}physio/`,
  },
  {
    slug: 'project4you',
    name: 'Project4You',
    category: 'CMS platform',
    summary: 'A CMS web application for creating digital invitations and websites, built on builder-style logic.',
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}project4you/`,
  },
];

/** The portfolio in a language. English is the source; Greek takes its editorial text from projects.el.ts. */
export function projectsIn(locale: Locale): readonly Project[] {
  return locale === 'en' ? projects : projects.map(toGreek);
}

/** Projects shown in Selected work on the homepage, in order. */
export function featuredIn(locale: Locale): readonly Project[] {
  return projectsIn(locale).filter((p) => p.featured);
}

/** Projects with a published case study, in a fixed order. Drives the case-study routes and "Next project". */
export function caseStudiesIn(locale: Locale): readonly Project[] {
  return projectsIn(locale).filter((p) => p.caseStudy);
}

/** The case study that follows this one, wrapping from the last back to the first. Deterministic. */
export function nextCaseStudy(slug: string, locale: Locale): Project {
  const list = caseStudiesIn(locale);
  const i = list.findIndex((p) => p.slug === slug);
  const next = list[(i + 1) % list.length];
  if (i < 0 || !next) throw new Error(`No published case study with slug: ${slug}`);
  return next;
}

/** Published case studies that show a capability. Used for "Seen in". */
export function caseStudiesWith(capability: CapabilityId, locale: Locale): readonly Project[] {
  return caseStudiesIn(locale).filter((p) => p.capabilities.includes(capability));
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
  if (!study) return { ...p, category: el.category, summary: el.summary, image };
  const s = el.caseStudy;
  if (!s) throw new Error(`Missing Greek case study for project: ${p.slug}`);
  const gallery = study.gallery?.map((g, i) => ({ ...g, alt: required(s.galleryAlts?.[i], p.slug, 'galleryAlts') }));
  return {
    ...p,
    category: el.category,
    summary: el.summary,
    image,
    caseStudy: {
      ...study,
      client: s.client ?? study.client,
      overview: s.overview,
      need: s.need,
      built: s.built,
      technology: study.technology && required(s.technology, p.slug, 'technology'),
      outcome: study.outcome && required(s.outcome, p.slug, 'outcome'),
      cover: {
        ...study.cover,
        alt: s.coverAlt,
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
