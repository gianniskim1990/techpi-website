import type { Dictionary } from './en';

/**
 * Greek interface strings (Phase 3D). Written in Greek, not machine-translated. Navigation labels come from the
 * approved Gate B Greek sample. Typed as Dictionary: a missing or extra key fails `npm run check`.
 */
export const el: Dictionary = {
  site: {
    name: 'TECHPI',
    descriptor: 'Ψηφιακά προϊόντα & τεχνολογία',
  },
  skipLink: 'Μετάβαση στο περιεχόμενο',
  nav: {
    label: 'Κύρια πλοήγηση',
    work: 'Έργα',
    capabilities: 'Δυνατότητες',
    euProjects: 'Ευρωπαϊκά έργα',
    about: 'Εταιρεία',
    contact: 'Επικοινωνία',
    menu: 'Μενού',
    close: 'Κλείσιμο',
  },
  footer: {
    // The accessible name of the footer navigation (not visible).
    label: 'Δευτερεύουσα πλοήγηση',
    note: 'TechPi, πρώην pigiota314.',
  },
  language: {
    label: 'Γλώσσα',
    en: { short: 'EN', name: 'English' },
    el: { short: 'ΕΛ', name: 'Ελληνικά' },
  },
  pages: {
    home: { title: 'TechPi | Ψηφιακά προϊόντα & τεχνολογία', heading: 'Αρχική' },
    work: { title: 'Έργα | TechPi', heading: 'Έργα' },
    capabilities: { title: 'Δυνατότητες | TechPi', heading: 'Δυνατότητες' },
    euProjects: { title: 'Ευρωπαϊκά έργα | TechPi', heading: 'Ευρωπαϊκά έργα' },
    about: { title: 'Εταιρεία | TechPi', heading: 'Εταιρεία' },
    contact: { title: 'Επικοινωνία | TechPi', heading: 'Επικοινωνία' },
  },
  shell: {
    note: 'Η σελίδα βρίσκεται υπό προετοιμασία.',
  },
  notFound: {
    title: 'Η σελίδα δεν βρέθηκε | TechPi',
    heading: 'Η σελίδα δεν βρέθηκε',
    text: 'Η σελίδα που αναζητάτε δεν υπάρχει.',
    home: 'Επιστροφή στην αρχική σελίδα',
  },
};
