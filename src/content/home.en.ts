/**
 * English homepage copy, from the approved Gate B prototype (explorations/phase-2/homepage-prototype).
 * Components take this object as a prop, so the Greek homepage (Phase 3D) is a second object of the same type
 * and no component needs to change. Greek is not written here: it is not invented before 3D.
 *
 * Project and capability data live in projects.ts and capabilities.ts, shared with the Work and Capabilities pages.
 *
 * Nothing below states a metric, an outcome or a technology that is not confirmed.
 *
 * TODO (content, before launch): confirm each project's purpose, scope and capabilities with the client, then add a
 * "Scope" row to `facts`. Project imagery replaces the neutral media placeholders. Contact email, phone and
 * legal entity details are not confirmed, so they are not shown.
 */
export const homeEn = {
  hero: {
    meta: 'Digital Products & Technology',
    statement: ['We design and build', 'digital products.'],
    support: ['Technology built around', 'real business needs.'],
    start: 'Start a project →',
    work: 'Selected work',
  },
  statement: {
    heading: 'We turn business needs into digital products, platforms and intelligent systems.',
    steps: [
      {
        step: 'First',
        title: 'The business problem',
        text: 'We start with how your organisation actually works: who does what, where time is lost, and what has to be true for the project to pay off.',
      },
      {
        step: 'Second',
        title: 'The technology',
        text: 'Only then do we choose the stack, the architecture and where, if anywhere, AI belongs.',
      },
    ],
  },
  work: {
    heading: 'Selected work',
    label: 'Selected work',
    all: 'See all work',
    factsLabel: 'Capabilities',
  },
  capabilities: {
    heading: 'What we build.',
  },
  intelligence: {
    heading: ['AI where it creates value.', 'Not where it creates noise.'],
    lead: 'We add AI to a product when it removes work, improves a decision or answers a question faster. When it does none of these, we leave it out.',
    areas: [
      { title: 'AI integrations', text: 'Language and vision models connected to the systems you already run.' },
      { title: 'Intelligent search', text: 'Search that understands a question and answers from your own content.' },
      { title: 'Assistants', text: 'Task-specific assistants for staff or customers, with clear limits.' },
      { title: 'Automation', text: 'Repetitive steps in a workflow, handled without manual effort.' },
      { title: 'Data-driven workflows', text: 'Routing and decisions informed by the data a process already produces.' },
    ],
  },
  evolution: {
    heading: 'TechPi is the evolution of pigiota314.',
    lead: 'The name changed as the work evolved.',
    text: 'Pi stays. Tech says where we are going: digital products, platforms and intelligent systems.',
    link: 'About TechPi',
  },
  contact: {
    heading: ['Have something', 'worth building?'],
    cta: 'Start a project →',
    region: 'Greece and Europe',
  },
};

export type HomeCopy = typeof homeEn;
