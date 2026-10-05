/**
 * English copy for the secondary pages (Phase 3C.1). Leads are the approved lines. Greek arrives in Phase 3D.
 * Only confirmed facts appear here. Contact details (email, phone) are not confirmed, so they are not here.
 */
export const pagesEn = {
  work: {
    linkLabel: 'View case study',
    lead: 'Products, platforms and systems, each built around a real business need.',
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
    lead: 'The name changed as the work evolved.',
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
  },
  contact: {
    heading: 'Have something worth building?',
    lead: 'Tell us about the problem you need to solve.',
    direct: 'Direct',
    location: 'Location',
    locationValue: 'Greece and Europe',
  },
  /** The quiet closing line on secondary pages: the homepage question, without the Blue surface or the circle. */
  closer: {
    heading: 'Have something worth building?',
    cta: 'Start a project →',
  },
};

export type PagesCopy = typeof pagesEn;
