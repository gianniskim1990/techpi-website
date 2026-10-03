/**
 * The four capabilities. This is the whole taxonomy: nothing else is a capability.
 * Fixed ids (docs/production/content-model.md section 5). Case studies reference them by id.
 * English text, from the approved homepage. Greek arrives in Phase 3D as a second object of the same type.
 */
export const capabilityIds = ['digital-products', 'web-experiences', 'intelligence', 'digital-visibility'] as const;
export type CapabilityId = (typeof capabilityIds)[number];

export interface Capability {
  id: CapabilityId;
  name: string;
  summary: string;
  items: readonly string[];
}

/** In display order. Digital visibility stays last. */
export const capabilities: readonly Capability[] = [
  {
    id: 'digital-products',
    name: 'Digital products',
    summary: 'Custom web applications, SaaS products and platforms, from first idea to a system that runs every day.',
    items: ['Product strategy', 'UX and UI design', 'Engineering', 'Operation and support'],
  },
  {
    id: 'web-experiences',
    name: 'Web experiences',
    summary: 'Corporate websites and e-commerce that carry a brand and a business.',
    items: ['Design', 'Content structure', 'Development', 'Commerce'],
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    summary: 'AI and automation applied to specific problems inside real workflows.',
    items: ['AI integrations', 'Assistants', 'Intelligent search', 'Automation'],
  },
  {
    id: 'digital-visibility',
    name: 'Digital visibility',
    summary:
      'Making sure the right people, and the search and AI systems they ask, can find and understand what you have built.',
    items: [
      'Search strategy and SEO',
      'Generative engine optimisation (GEO)',
      'AI visibility',
      'Technical performance and measurement',
    ],
  },
];

const byId = new Map(capabilities.map((c) => [c.id, c]));

export function capabilityName(id: CapabilityId): string {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown capability id: ${id}`);
  return found.name;
}
