import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/locales';
import type { CapabilityId } from './capabilities';
import { projectsEl } from './projects.el';
import armansAdmin from '../assets/projects/armans-admin.png';
import armansDevices from '../assets/projects/armans-devices.png';
import logotherapiaSite from '../assets/projects/logotherapia-site.jpg';
import rantevoBookingHome from '../assets/projects/rantevo-booking-home.png';
import rantevoBusinessPage from '../assets/projects/rantevo-business-page.png';
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

export const workGroups = ['client', 'solution', 'product', 'earlier'] as const;
export type WorkGroup = (typeof workGroups)[number];

export interface Project {
  /** Stable, Latin, lower case. Locked in docs/production/routes.md. */
  slug: string;
  /** Work-page grouping: client commissions, adaptable business solutions, or our own products. */
  workGroup: WorkGroup;
  name: string;
  category: string;
  summary: string;
  /** Source-backed, scannable functionality labels shown on the Work index for business solutions only. */
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

const src = 'https://pigiota314.gr/case-studies/';

export const projects: readonly Project[] = [
  {
    slug: 'rocketeer',
    workGroup: 'client',
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
    workGroup: 'client',
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
    workGroup: 'client',
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
    workGroup: 'product',
    name: 'Level Up Education App',
    category: 'Education management application',
    summary:
      'A web application for managing students, courses and the day-to-day operations of a tutoring centre.',
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}level-up-education-app/`,
    caseStudy: {
      year: 2026,
      liveUrl: 'https://app.levelupeducation.gr/',
      overview: [
        'An education web app for managing students, courses and the digital operations of a tutoring centre.',
      ],
      need: [
        'The day-to-day management of students, classes, absences and communication needed a more organised digital environment.',
      ],
      built: {
        intro:
          'A custom application with user roles, student and class management, and features that can evolve with the centre’s needs.',
      },
      services: ['UX/UI design', 'Web application development', 'Student management', 'Education platform'],
      technology: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
      outcome: [
        'Better internal organisation for the tutoring centre, and room to add further digital capabilities.',
      ],
    },
  },
  {
    slug: 'saloon',
    workGroup: 'solution',
    name: 'Saloon',
    category: 'Booking platform',
    summary:
      'An online appointment and client management platform for salons and beauty businesses, combining customer-facing bookings with an organised daily schedule and administration area.',
    highlights: ['Online appointments', 'Calendar and schedule', 'Client management', 'Mobile-friendly interface'],
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}saloon/`,
    caseStudy: {
      year: 2026,
      overview: [
        'A modern web app for online appointments at beauty businesses, with a public booking page, a client dashboard and features that depend on the plan.',
      ],
      need: [
        'Beauty businesses need a simple, professional way to accept online appointments, organise their clients and reduce day-to-day coordination by phone or message.',
      ],
      built: {
        intro:
          'A SaaS platform with a responsive interface, a public booking page and a management dashboard for clients and services, with features that can grow with each business’s plan.',
      },
      services: [
        'UX/UI design',
        'Web application development',
        'SaaS strategy',
        'Booking system',
        'Client dashboard',
      ],
      technology: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
      outcome: [
        'A more organised, professional online presence for beauty businesses, with easier appointment management and a better experience for their clients.',
      ],
    },
  },
  {
    slug: 'physio',
    workGroup: 'solution',
    name: 'Physio',
    category: 'Appointment management platform',
    summary:
      'A web platform for physiotherapy practices to coordinate appointments, client details and treatment sessions through a clear, responsive interface.',
    highlights: ['Online booking', 'Session scheduling', 'Client organisation', 'Responsive interface'],
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}physio/`,
    caseStudy: {
      year: 2026,
      overview: [
        'A web application for physiotherapists and clinics, with organised management of appointments, clients and sessions.',
      ],
      need: [
        'Physiotherapists needed a simple system that reduces daily coordination by phone and helps them manage their sessions better.',
      ],
      built: {
        intro:
          'A responsive platform focused on a clean user experience, easy appointment booking and a professional online image.',
      },
      services: ['UX/UI design', 'Web application development', 'Booking system', 'SaaS strategy'],
      technology: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
      outcome: [
        'More organised day-to-day operations, and a better experience for both the professional and the client.',
      ],
    },
  },
  {
    slug: 'project4you',
    workGroup: 'solution',
    name: 'Project4You',
    category: 'CMS platform',
    summary:
      'A modular content management platform for building digital invitations and websites, with themes, custom pages and flexible content editing.',
    highlights: ['Modular CMS', 'Themes', 'Digital invitations', 'Custom website pages'],
    capabilities: ['digital-products'],
    featured: false,
    source: `${src}project4you/`,
    caseStudy: {
      year: 2026,
      liveUrl: 'https://www.project4you.gr/',
      overview: [
        'A custom web application that combines CMS logic with the ability to create digital invitations and websites through a modern builder.',
      ],
      need: [
        'A more flexible system was needed, able to support different kinds of digital project, from invitations to full websites.',
      ],
      built: {
        intro:
          'A modular CMS environment focused on easy management, themes, custom pages and features delivered step by step.',
      },
      services: ['Product strategy', 'UX/UI design', 'Web application development', 'CMS architecture'],
      technology: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    },
  },
  {
    slug: 'mavie',
    workGroup: 'client',
    name: 'Mavie',
    category: 'Website rebranding',
    summary: 'A website rebranding and visual refresh with a more modern aesthetic, a cleaner structure and a more cohesive brand presentation.',
    capabilities: ['web-experiences'],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/mavie-website-rebranding',
    caseStudy: {
      client: 'Mavie',
      year: 2025,
      liveUrl: 'https://www.mavie.gr/',
      overview: [
        'A digital image upgrade with a more modern aesthetic, a cleaner structure and a refreshed feel for the brand.',
      ],
      need: ['The existing image needed a refresh, to feel more professional and more modern.'],
      built: {
        intro:
          'A new visual direction with a cleaner interface, an improved structure and a more contemporary brand feel.',
      },
      services: ['Web design', 'Rebranding', 'Graphic design', 'UX/UI'],
      technology: ['WordPress'],
      outcome: ['An improved visual identity and a stronger perceived value of the brand online.'],
    },
  },
  {
    slug: 'iliastech',
    workGroup: 'client',
    name: 'iliastech',
    category: 'Corporate website',
    summary: 'A responsive corporate website with structured content and a clear presentation of services offered by a technology company.',
    capabilities: ['web-experiences'],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/iliastech',
    caseStudy: {
      client: 'iliastech',
      year: 2026,
      liveUrl: 'https://www.iliastech.gr/',
      overview: [
        'A modern corporate website with a clear presentation of services and a professional digital image.',
      ],
      need: [
        'The main need was to present the company’s services clearly and to build a professional image online.',
      ],
      built: {
        intro:
          'A corporate website with structured content, a clean interface and a responsive experience.',
      },
      services: ['Web design', 'Corporate website', 'Content structure', 'Responsive design'],
      technology: ['WordPress'],
      outcome: ['A stronger professional image and a better ability to present services online.'],
    },
  },
  {
    slug: 'alexandra-apartment',
    workGroup: 'client',
    name: 'Alexandra Apartment',
    category: 'Hospitality website',
    summary: 'A hospitality website combining property imagery, clear information and an approach to local search visibility.',
    capabilities: ['web-experiences', 'digital-visibility'],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/alexandra-apartment',
    caseStudy: {
      client: 'Alexandra Apartment',
      year: 2025,
      overview: ['A clean, modern online presence for a tourist accommodation, focused on imagery and trust.'],
      need: [
        'The accommodation needed a professional online presence that builds credibility and clearly presents the experience of staying there.',
      ],
      built: {
        intro:
          'A website with a clear structure, imagery, content and a direction for local search visibility.',
      },
      services: ['Web design', 'Hospitality website', 'Local SEO', 'Content structure'],
      technology: ['WordPress'],
      outcome: ['A more professional image and a better online presentation of the accommodation.'],
    },
  },
  {
    slug: 'blackjack-streetwear',
    workGroup: 'client',
    name: 'Blackjack Streetwear',
    category: 'E-commerce website',
    summary: 'An online store built on WooCommerce, designed around clear product presentation, the mobile experience and a streetwear aesthetic.',
    capabilities: ['web-experiences'],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/blackjack-streetwear',
    caseStudy: {
      client: 'Blackjack Streetwear',
      year: 2025,
      overview: [
        'A modern e-commerce experience for a fashion brand, with clean product presentation and a streetwear aesthetic.',
      ],
      need: [
        'The brand needed an e-commerce environment that showcases its products and keeps the shopping experience clean.',
      ],
      built: {
        intro:
          'An online store focused on product presentation, the mobile experience and an aesthetic tuned to a streetwear audience.',
      },
      services: ['E-shop design', 'Web design', 'WooCommerce setup', 'UX/UI'],
      technology: ['WordPress', 'WooCommerce'],
      outcome: ['A more professional online image and a cleaner browsing and purchasing experience.'],
    },
  },
  {
    slug: 'rantevo',
    workGroup: 'solution',
    name: 'Rantevo.gr',
    category: 'Multi-sector SaaS booking platform',
    summary: 'A web-based appointment platform for service businesses, combining business profiles, service listings and customer bookings.',
    highlights: ['Business profiles', 'Service listings', 'Online appointments', 'Responsive interface'],
    capabilities: ['digital-products'],
    featured: false,
    // The first two of the three screenshots on the source case study: the public booking homepage and the page for
    // businesses. The third, a signed-in dashboard, shows a personal name and is not used.
    image: {
      src: rantevoBookingHome,
      width: 1549,
      height: 679,
      alt: 'The Rantevo.gr homepage: the heading “Book an appointment easily and quickly” and a search form by service, city, date and time.',
    },
    source: 'https://pigiota314.eu/case-studies/rantevo',
    caseStudy: {
      year: 2026,
      overview: [
        'A modern SaaS booking platform for hair salons, beauty centres, physiotherapy clinics and other service professionals.',
      ],
      need: [
        'Many small service businesses still manage appointments by hand, through phone calls, messages and notes. This creates delays, lost time, organisational friction and a limited online presence.',
      ],
      built: {
        intro:
          'A web-based SaaS booking platform with a clean, responsive interface, professional business pages, structured service listings and end-to-end online booking for customers.',
      },
      services: [
        'SaaS development',
        'Web application',
        'UX/UI design',
        'Booking system',
        'Digital product strategy',
      ],
      technology: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
      outcome: [
        'A digital product that supports different types of business, strengthens their online presence and gives professionals and their customers a more organised booking experience.',
      ],
      cover: {
        src: rantevoBookingHome,
        width: 1549,
        height: 679,
        alt: 'The Rantevo.gr homepage: the heading “Book an appointment easily and quickly” and a search form by service, city, date and time.',
        caption: 'The public booking homepage. The screenshots on this page show the Greek-language interface.',
      },
      gallery: [
        {
          src: rantevoBusinessPage,
          width: 1412,
          height: 1194,
          alt: 'The Rantevo.gr page for businesses: the heading “Grow your business with Rantevo”, a short description of the platform and four cards describing what it offers.',
        },
      ],
    },
  },
  {
    slug: 'level-up-education',
    workGroup: 'earlier',
    name: 'Level Up Education',
    category: 'Education website & digital communication',
    summary: 'A coordinated digital presence for an education brand, including its website, SEO content and social media communication.',
    disciplines: ['Web design', 'SEO', 'Content strategy', 'Social media'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/level-up-education',
    caseStudy: {
      client: 'Level Up Education',
      year: 2026,
      liveUrl: 'https://www.levelupeducation.gr/',
      overview: [
        'A complete digital presence for an education brand, covering its website, SEO, social media and content.',
      ],
      need: [
        'Building a professional online presence that inspires trust in students, parents and adult learners.',
      ],
      built: {
        intro:
          'A website with a clear structure, SEO-driven content, social media campaigns and ongoing communication support.',
      },
      services: ['Web design', 'SEO', 'Content strategy', 'Social media management', 'Digital marketing'],
      technology: ['WordPress', 'WPBakery', 'Yoast SEO', 'Meta Ads', 'Google Analytics 4'],
      outcome: [
        'A stronger local image, a better social media presence and more organised content for the brand’s services and activities.',
      ],
    },
  },
  {
    slug: 'itsallaboutxanthi',
    workGroup: 'earlier',
    name: 'Itsallaboutxanthi',
    category: 'Local platform & digital communication',
    summary: 'Website work, social media content and graphic design for a local information platform and its digital presence.',
    disciplines: ['Web design', 'Social media', 'Graphic design', 'Digital marketing'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/itsallaboutxanthi',
    caseStudy: {
      client: 'Itsallaboutxanthi',
      year: 2025,
      overview: [
        'A complete digital presence covering the website, social media, graphic design and digital marketing support.',
      ],
      need: [
        'The project needed a unified image across its website, social media and creative assets, to improve recognition.',
      ],
      built: {
        intro:
          'Support across web design, social media content, graphics and digital marketing activities.',
      },
      services: ['Web design', 'Social media management', 'Graphic design', 'Digital marketing'],
      technology: ['WordPress'],
      outcome: ['A more consistent, recognisable presence that fits its local visibility goals.'],
    },
  },
  {
    slug: 'local-xanthi',
    workGroup: 'earlier',
    name: 'Local Xanthi',
    category: 'Local social media & digital marketing',
    summary: 'Social media content and digital marketing communications aimed at building a consistent presence for a local audience.',
    disciplines: ['Social media', 'Content creation', 'Local promotion'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/local-xanthi',
    caseStudy: {
      client: 'Local Xanthi',
      year: 2025,
      overview: [
        'Social media and digital marketing campaigns with local targeting, and content designed to increase visibility.',
      ],
      need: ['Building a more consistent online presence aimed at a local audience.'],
      built: {
        intro:
          'Content and a communication direction focused on recognition and a connection with the local audience.',
      },
      services: ['Social media management', 'Digital marketing', 'Content creation', 'Local promotion'],
      technology: ['Meta Business Suite'],
      outcome: ['A stronger online presence and more consistent communication.'],
    },
  },
  {
    slug: 'juliette-coffee-roasters',
    workGroup: 'earlier',
    name: 'Juliette Coffee Roasters',
    category: 'Coffee brand digital communication',
    summary: 'Social media content, digital marketing and search visibility support for a coffee brand.',
    disciplines: ['Social media', 'SEO support', 'Content strategy'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/juliette-coffee-roasters',
    caseStudy: {
      client: 'Juliette Coffee Roasters',
      year: 2026,
      overview: [
        'Digital marketing and social media support for a coffee brand, focused on imagery, content and online visibility.',
      ],
      need: [
        'The brand needed consistent online communication, and content that captures its identity and its coffee experience.',
      ],
      built: {
        intro:
          'A content direction, a social media presence and SEO support aimed at better visibility.',
      },
      services: ['Social media management', 'SEO support', 'Content strategy', 'Digital marketing'],
      outcome: ['Stronger recognition and a more consistent online presence.'],
    },
  },
  {
    slug: 'apox-fc',
    workGroup: 'earlier',
    name: 'Apox FC',
    category: 'Sports brand content & design',
    summary: 'Graphic design and social media content supporting consistent communication with a sports audience.',
    disciplines: ['Social media', 'Graphic design', 'Digital marketing'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/apox-fc',
    caseStudy: {
      client: 'Apox FC',
      year: 2025,
      overview: [
        'Content, creative assets and digital marketing support for a sports brand with a strong community presence.',
      ],
      need: [
        'Creating content that resonates with a sports community and strengthens the brand’s social media presence.',
      ],
      built: {
        intro:
          'Graphics, social media content and a communication direction for a consistent online presence.',
      },
      services: ['Social media content', 'Graphic design', 'Digital marketing', 'Community communication'],
      outcome: ['An improved brand image and better communication with the community.'],
    },
  },
  {
    slug: 'emoved',
    workGroup: 'earlier',
    name: 'Emoved',
    category: 'Branding & graphic design',
    summary: 'Graphic assets and visual identity support for a clear and consistent professional brand image.',
    disciplines: ['Brand communication', 'Graphic design', 'Visual identity support'],
    capabilities: [],
    featured: false,
    source: 'https://pigiota314.eu/case-studies/emoved',
    caseStudy: {
      client: 'Emoved',
      year: 2025,
      overview: ['A graphic design project focused on clean visual communication and a professional brand image.'],
      need: ['The project called for clearer, more consistent and more professional visual communication.'],
      built: {
        intro:
          'Design assets and visual materials created to support a cohesive brand.',
      },
      services: ['Graphic design', 'Brand communication', 'Visual identity support'],
      technology: ['Adobe Creative Suite'],
      outcome: ['A more organised and professional visual presence for the brand.'],
    },
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
