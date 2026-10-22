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
  contactForm: {
    heading: 'Στείλτε μας μήνυμα',
    name: 'Ονοματεπώνυμο',
    email: 'Email',
    organisation: 'Επιχείρηση ή οργανισμός',
    optional: 'προαιρετικό',
    message: 'Το έργο ή η ερώτησή σας',
    messageHint: 'Τι θέλετε να λύσετε και ό,τι άλλο πρέπει να γνωρίζουμε.',
    timeframe: 'Χρονοδιάγραμμα',
    timeframes: {
      '': 'Δεν έχει οριστεί',
      asap: 'Το συντομότερο δυνατό',
      '1-3-months': 'Σε 1–3 μήνες',
      '3-6-months': 'Σε 3–6 μήνες',
      later: 'Αργότερα',
    },
    submit: 'Αποστολή μηνύματος',
    sending: 'Αποστολή…',
    privacy: 'Χρησιμοποιούμε τα στοιχεία σας μόνο για να σας απαντήσουμε.',
    privacyLink: 'Πολιτική Απορρήτου',
    successHeading: 'Ευχαριστούμε. Το μήνυμά σας στάλθηκε.',
    successText: 'Θα σας απαντήσουμε με email.',
    errors: {
      name: 'Συμπληρώστε το ονοματεπώνυμό σας.',
      email: 'Συμπληρώστε μια έγκυρη διεύθυνση email.',
      organisation: 'Συντομεύστε το όνομα της επιχείρησης ή του οργανισμού.',
      message: 'Περιγράψτε το έργο ή την ερώτησή σας με τουλάχιστον 10 χαρακτήρες.',
      timeframe: 'Επιλέξτε χρονοδιάγραμμα από τη λίστα.',
      invalid: 'Ελέγξτε τα επισημασμένα πεδία.',
      verification: 'Δεν ήταν δυνατό να επιβεβαιωθεί ότι το μήνυμα στάλθηκε από άνθρωπο. Δοκιμάστε ξανά.',
      rateLimited: 'Πολλά μηνύματα σε σύντομο χρόνο. Περιμένετε ένα λεπτό και δοκιμάστε ξανά.',
      unavailable: 'Η φόρμα δεν είναι διαθέσιμη αυτή τη στιγμή. Στείλτε μας email στο {email}.',
      failed: 'Το μήνυμά σας δεν στάλθηκε. Δοκιμάστε ξανά ή στείλτε μας email στο {email}.',
    },
    noscript: 'Η φόρμα χρειάζεται JavaScript. Μπορείτε να μας στείλετε email στο {email} ή να μας τηλεφωνήσετε.',
  },
};
