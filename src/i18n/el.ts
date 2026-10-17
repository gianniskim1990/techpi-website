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
    note: 'TechPi — η εξέλιξη της pigiota314.',
    legalLabel: 'Νομικές πληροφορίες',
  },
  language: {
    label: 'Γλώσσα',
    en: { short: 'EN', name: 'English' },
    el: { short: 'ΕΛ', name: 'Ελληνικά' },
    notTranslated: 'Η σελίδα δεν είναι διαθέσιμη στα ελληνικά',
  },
  pages: {
    home: { heading: 'Αρχική' },
    work: { heading: 'Έργα' },
    capabilities: { heading: 'Δυνατότητες' },
    euProjects: { heading: 'Ευρωπαϊκά έργα' },
    about: { heading: 'Εταιρεία' },
    contact: { heading: 'Επικοινωνία' },
    privacy: { heading: 'Πολιτική Απορρήτου' },
    cookies: { heading: 'Πολιτική Cookies' },
  },
  notFound: {
    title: 'Η σελίδα δεν βρέθηκε | TechPi',
    heading: 'Η σελίδα δεν βρέθηκε',
    text: 'Η σελίδα που αναζητάτε δεν υπάρχει.',
    home: 'Επιστροφή στην αρχική σελίδα',
  },
};
