/**
 * English copy for the secondary pages (Phase 3C.1). Leads are the approved lines. Greek is in pages.el.ts.
 * Only confirmed facts appear here. The contact values themselves (email, phone) live in site.ts.
 */
export const pagesEn = {
  work: {
    linkLabel: 'View case study',
    lead: 'Client projects, adaptable business solutions, our own products and earlier pigiota314 work.',
    groups: {
      client: {
        heading: 'Client Projects',
        description: 'Digital work delivered for clients, with selected projects explored in detail.',
      },
      solution: {
        heading: 'Business Solutions',
        description: 'Adaptable applications designed around the needs of different businesses.',
      },
      product: {
        heading: 'Our Products',
        description: 'Digital products we develop for our own use and further growth.',
      },
      earlier: {
        heading: 'Earlier Work by pigiota314',
        description: 'Websites, branding, content and digital communication from our wider pigiota314 portfolio, shown separately from TechPi\'s current technology offering.',
      },
    },
    solutionLink: 'Discuss a similar solution',
    highlightsLabel: 'What it includes',
    disciplinesLabel: 'Disciplines',
    filterLabel: 'Filter the work portfolio',
    filterAll: 'All work',
  },
  capabilities: {
    heading: 'What we build.',
    lead: 'Four capabilities, brought together around the problem.',
    covers: 'What it covers',
    indexLabel: 'Capabilities',
    seenIn: 'Seen in',
  },
  about: {
    heading: 'TechPi is the evolution of pigiota314.',
    lead: 'From websites and digital experiences to custom platforms, digital products and intelligent systems.',
    changeHeading: 'What stayed, what changed',
    // From the approved brand brief, section 8 (kept and changed). Not rewritten.
    stayed: {
      label: 'Stayed',
      text: 'The Pi, the circular mark, the blue and cyan family, the client relationships and the people.',
    },
    changed: {
      label: 'Changed',
      text: 'The name is now pronounceable and spellable in any European language, the scope is stated as technology and products, the visual language is refined.',
    },
    // Approved homepage Evolution copy.
    name: 'Pi stays. Tech says where we are going: digital products, platforms and intelligent systems.',
    principlesHeading: 'How we work',
    // The four approved principles. Headings are used as approved. Only the first has supporting copy.
    principles: [
      {
        heading: 'The business problem first.',
        text: 'We start with how an organisation actually works, and choose technology after that.',
      },
      { heading: 'AI where it creates value. Not where it creates noise.' },
      { heading: 'Built to run every day.' },
      { heading: 'Technology built around real business needs.' },
    ] as readonly { heading: string; text?: string }[],
  },
  caseStudy: {
    back: 'Work',
    client: 'Client',
    year: 'Year',
    live: 'Live website',
    liveAria: 'opens the live website',
    overview: 'Overview',
    need: 'The business need',
    built: 'What we built',
    capabilities: 'Capabilities',
    technology: 'Technology',
    outcome: 'Outcome',
    next: 'Next project',
    solution: 'The solution',
    services: 'Scope',
    related: 'Related projects',
    earlier: 'Earlier work by pigiota314. Shown separately from TechPi’s current technology offering.',
  },
  contact: {
    heading: 'Have something worth building?',
    lead: 'Tell us about the problem you need to solve.',
    direct: 'Direct',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    // The town only. No street address is confirmed or shown.
    locationValue: 'Xanthi, Greece',
  },
  /** The quiet closing line on secondary pages: the homepage question, without the Blue surface or the circle. */
  closer: {
    heading: 'Have something worth building?',
    cta: 'Start a project',
  },
};

export type PagesCopy = typeof pagesEn;
