import type { Locale } from '../i18n/locales';

/**
 * The four capabilities. This is the whole taxonomy: nothing else is a capability.
 * Fixed ids (docs/production/content-model.md section 5). Case studies reference them by id, and the ids are also
 * the anchors on the Capabilities page in both languages.
 * English text from the approved homepage. Greek written in Phase 3D: one fixed Greek name per capability, used
 * everywhere on the site (docs/production/localisation.md).
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
const byLocale: Record<Locale, readonly Capability[]> = {
  en: [
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
  ],
  el: [
    {
      id: 'digital-products',
      name: 'Ψηφιακά προϊόντα',
      summary:
        'Ειδικά σχεδιασμένες web εφαρμογές, προϊόντα SaaS και πλατφόρμες, από την πρώτη ιδέα έως ένα σύστημα που λειτουργεί κάθε μέρα.',
      items: ['Στρατηγική προϊόντος', 'Σχεδιασμός UX και UI', 'Ανάπτυξη λογισμικού', 'Λειτουργία και υποστήριξη'],
    },
    {
      id: 'web-experiences',
      name: 'Διαδικτυακές εμπειρίες',
      summary: 'Εταιρικοί ιστότοποι και ηλεκτρονικά καταστήματα που εκφράζουν μια μάρκα και στηρίζουν μια επιχείρηση.',
      items: ['Σχεδιασμός', 'Δομή περιεχομένου', 'Ανάπτυξη', 'Ηλεκτρονικό εμπόριο'],
    },
    {
      id: 'intelligence',
      name: 'Ευφυή συστήματα',
      summary: 'Τεχνητή νοημοσύνη και αυτοματισμοί, εφαρμοσμένοι σε συγκεκριμένα προβλήματα μέσα σε πραγματικές ροές εργασίας.',
      items: ['Ενσωμάτωση τεχνητής νοημοσύνης', 'Ψηφιακοί βοηθοί', 'Έξυπνη αναζήτηση', 'Αυτοματισμοί'],
    },
    {
      id: 'digital-visibility',
      name: 'Ψηφιακή ορατότητα',
      summary:
        'Ώστε οι σωστοί άνθρωποι, και τα συστήματα αναζήτησης και τεχνητής νοημοσύνης που χρησιμοποιούν, να βρίσκουν και να κατανοούν αυτό που έχετε φτιάξει.',
      items: [
        'Στρατηγική αναζήτησης και SEO',
        'Generative Engine Optimisation (GEO)',
        'Ορατότητα σε συστήματα τεχνητής νοημοσύνης',
        'Τεχνική απόδοση και μέτρηση',
      ],
    },
  ],
};

/** The four capabilities in a language, in display order. */
export function capabilitiesIn(locale: Locale): readonly Capability[] {
  return byLocale[locale];
}

/** The display name of a capability in a language. */
export function capabilityName(id: CapabilityId, locale: Locale): string {
  const found = byLocale[locale].find((c) => c.id === id);
  if (!found) throw new Error(`Unknown capability id: ${id}`);
  return found.name;
}
