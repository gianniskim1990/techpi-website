/**
 * English homepage copy, from the approved Gate B prototype (explorations/phase-2/homepage-prototype).
 * Components take this object as a prop, so the Greek homepage (Phase 3D) is a second object of the same type
 * and no component needs to change. Greek is not written here: it is not invented before 3D.
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
    projects: [
      {
        id: 'cairelink',
        name: 'cAIrelink',
        category: 'Healthcare platform',
        summary: 'A custom web application for healthcare.',
        capabilities: 'Digital products, Intelligence',
      },
      {
        id: 'armans',
        name: 'Arman’s Ethnic Street Food',
        wordmark: 'Arman’s',
        category: 'Direct ordering platform',
        summary: 'A platform that lets the restaurant take orders directly from its customers.',
        capabilities: 'Digital products, Web experiences',
      },
      {
        id: 'sowise',
        name: 'SOWISE+',
        category: 'EU-funded digital platform',
        summary: 'The digital platform of an EU-funded project.',
        capabilities: 'Web experiences, EU projects',
      },
    ],
    factsLabel: 'Capabilities',
  },
  capabilities: {
    heading: 'What we build.',
    items: [
      {
        title: 'Digital products',
        text: 'Custom web applications, SaaS products and platforms, from first idea to a system that runs every day.',
        list: ['Product strategy', 'UX and UI design', 'Engineering', 'Operation and support'],
      },
      {
        title: 'Web experiences',
        text: 'Corporate websites and e-commerce that carry a brand and a business.',
        list: ['Design', 'Content structure', 'Development', 'Commerce'],
      },
      {
        title: 'Intelligence',
        text: 'AI and automation applied to specific problems inside real workflows.',
        list: ['AI integrations', 'Assistants', 'Intelligent search', 'Automation'],
      },
      {
        title: 'Digital visibility',
        text: 'Making sure the right people, and the search and AI systems they ask, can find and understand what you have built.',
        list: [
          'Search strategy and SEO',
          'Generative engine optimisation (GEO)',
          'AI visibility',
          'Technical performance and measurement',
        ],
      },
    ],
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
