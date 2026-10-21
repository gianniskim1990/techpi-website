import type { AboutCopy, CapabilitiesCopy, ContactCopy, PagesCopy, WorkCopy } from './pages.en';
import { copyOf } from './pages-content';

/**
 * Greek copy for the secondary pages and the case-study template (Phase 3D). Since Task M3 the copy of the Work,
 * Capabilities, About and Contact pages lives in content/pages/<page>/index.json ("el"), edited through the admin.
 * What stays here is shared by several pages: the case-study template labels and the closing line.
 */
export const pagesEl: PagesCopy = {
  work: copyOf<WorkCopy>('work', 'el'),
  capabilities: copyOf<CapabilitiesCopy>('capabilities', 'el'),
  about: copyOf<AboutCopy>('about', 'el'),
  caseStudy: {
    back: 'Έργα',
    client: 'Πελάτης',
    year: 'Έτος',
    live: 'Ιστότοπος',
    liveAria: 'ανοίγει τον ιστότοπο του έργου',
    overview: 'Επισκόπηση',
    need: 'Η επιχειρηματική ανάγκη',
    built: 'Τι φτιάξαμε',
    capabilities: 'Δυνατότητες',
    technology: 'Τεχνολογία',
    outcome: 'Αποτέλεσμα',
    next: 'Επόμενο έργο',
    solution: 'Η λύση',
    services: 'Αντικείμενο έργου',
    related: 'Σχετικά έργα',
    context: 'Πλαίσιο έργου',
    earlierTag: 'Παλαιότερο έργο της pigiota314',
    earlier: 'Το έργο ανήκει στο χαρτοφυλάκιο της pigiota314 και παρουσιάζεται ξεχωριστά από τις σημερινές τεχνολογικές υπηρεσίες της TechPi.',
  },
  contact: copyOf<ContactCopy>('contact', 'el'),
  closer: {
    heading: 'Έχετε κάτι που αξίζει να χτιστεί;',
    cta: 'Ξεκινήστε ένα έργο',
  },
};
