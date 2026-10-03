import type { Dictionary } from './en';

/**
 * DRAFT Greek, for review by the client. Not machine-translated.
 * The navigation labels come from the Gate B prototype's Greek sample.
 * The route-shell strings are provisional placeholders and are replaced in Phase 3D.
 * Typed as Dictionary: a missing or extra key fails `npm run check`.
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
  },
  footer: {
    label: 'Υποσέλιδο',
    // Greek legal line is written in Phase 3D, not invented here. Empty means it is not shown.
    note: '',
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
    note: 'Προσωρινή σελίδα για δοκιμή της δρομολόγησης. Η σελίδα δεν έχει σχεδιαστεί ακόμη.',
  },
  notFound: {
    title: 'Η σελίδα δεν βρέθηκε | TechPi',
    heading: 'Η σελίδα δεν βρέθηκε',
    text: 'Η σελίδα που αναζητάτε δεν υπάρχει.',
    home: 'Επιστροφή στην αρχική σελίδα',
  },
};
