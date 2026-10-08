import type { Locale } from '../i18n/locales';

/**
 * EU-funded projects as a service offering: what TechPi can build for European projects and consortia.
 * Approved 2026-10-08 as a target market and service page. It is NOT a portfolio: no specific EU project, programme
 * participation, partner, result or certification is claimed anywhere here. Programmes are named only as examples
 * of the kinds of programmes TechPi can support ("suitable for projects funded through programmes such as…").
 * SOWISE+ is never mentioned (docs/production/launch-blockers.md).
 *
 * Used by the homepage section (home/EuProjects.astro) and the page (pages/EuProjectsPage.astro).
 */
export interface EuCopy {
  home: {
    label: string;
    heading: string;
    text: string;
    cta: string;
  };
  page: {
    description: string;
    heading: string;
    lead: string;
    statement: string;
    buildHeading: string;
    whoHeading: string;
    programmes: string;
    approachHeading: string;
    closer: string;
  };
  services: readonly { name: string; text: string }[];
  audiences: readonly string[];
  approach: readonly { name: string; text: string }[];
}

const en: EuCopy = {
  home: {
    label: 'EU-funded projects',
    heading: 'Digital infrastructure for EU-funded projects.',
    text: 'We design and build project websites, platforms, web applications and digital tools for European projects and collaborative programmes.',
    cta: 'Explore EU Projects',
  },
  page: {
    description:
      'Project websites, digital platforms, web applications and data tools for EU-funded projects and consortia, designed and built by TechPi.',
    heading: 'Technology for EU-funded projects.',
    lead: 'European projects often need more than a public website. They need digital systems that support communication, collaboration, data, stakeholders and long-term project delivery.',
    statement: 'TechPi designs and builds those systems.',
    buildHeading: 'What we build',
    whoHeading: 'Who it is for',
    programmes:
      'Suitable for projects funded through programmes such as Horizon Europe, Interreg, Erasmus+, LIFE and Digital Europe.',
    approachHeading: 'How we build it',
    closer: 'Need a digital platform for your project?',
  },
  services: [
    {
      name: 'Project websites',
      text: 'The public home of a project: its aims, partners, outputs and news, structured for the audiences it has to reach.',
    },
    {
      name: 'Custom platforms and portals',
      text: 'Shared spaces for registrations, resources, applications or pilot activities, built around how the project actually runs.',
    },
    {
      name: 'Web applications',
      text: 'Purpose-built tools for the tasks a work package defines, from data collection to training and matchmaking.',
    },
    {
      name: 'Dashboards and data tools',
      text: 'Clear views of indicators, outputs and datasets, for the consortium or for the public.',
    },
    {
      name: 'Stakeholder and community platforms',
      text: 'Places where stakeholders, communities and end users can take part, contribute and stay involved.',
    },
    {
      name: 'Internal collaboration tools',
      text: 'Focused tools that help partners in different countries coordinate work, documents and decisions.',
    },
    {
      name: 'Technical maintenance and support',
      text: 'Updates, monitoring and support through the life of the project and, where it is planned, beyond it.',
    },
  ],
  audiences: [
    'Project coordinators',
    'Consortium partners',
    'Universities and research organisations',
    'Innovation organisations',
    'SMEs taking part in European programmes',
    'Public and non-profit organisations',
  ],
  approach: [
    { name: 'Accessibility', text: 'Considered from the first layout, not added at the end.' },
    {
      name: 'Multilingual architecture',
      text: 'Content structured for several languages from the start, so partners can publish in their own.',
    },
    {
      name: 'GDPR-aware implementation',
      text: 'Personal data collected only where it is needed, with privacy considered in every form and integration.',
    },
    { name: 'Maintainability', text: 'Clear code and content models that the next person can work with.' },
    { name: 'Long-term support', text: 'Support planned for the life of the project and the period after it.' },
    { name: 'Performance', text: 'Fast, light pages that work on ordinary connections and devices.' },
    {
      name: 'Clear content architecture',
      text: 'Information organised for every audience a project has to reach, from the public to specialists.',
    },
    {
      name: 'Integration with project workflows',
      text: 'Connected to the tools a consortium already uses, instead of adding one more.',
    },
  ],
};

const el: EuCopy = {
  home: {
    label: 'Ευρωπαϊκά έργα',
    heading: 'Ψηφιακές λύσεις για ευρωπαϊκά έργα.',
    text: 'Σχεδιάζουμε και αναπτύσσουμε ιστοσελίδες, πλατφόρμες, εφαρμογές και ψηφιακά εργαλεία για ευρωπαϊκά έργα και συνεργατικά προγράμματα.',
    cta: 'Λύσεις για ευρωπαϊκά έργα',
  },
  page: {
    description:
      'Ιστοσελίδες έργων, ψηφιακές πλατφόρμες, web εφαρμογές και εργαλεία δεδομένων για ευρωπαϊκά χρηματοδοτούμενα έργα και κοινοπραξίες, από την TechPi.',
    heading: 'Τεχνολογία για ευρωπαϊκά χρηματοδοτούμενα έργα.',
    lead: 'Τα ευρωπαϊκά έργα χρειάζονται συχνά κάτι περισσότερο από έναν δημόσιο ιστότοπο. Χρειάζονται ψηφιακά συστήματα που στηρίζουν την επικοινωνία, τη συνεργασία, τα δεδομένα, τους ενδιαφερόμενους φορείς και την υλοποίηση του έργου σε βάθος χρόνου.',
    statement: 'Η TechPi σχεδιάζει και αναπτύσσει αυτά τα συστήματα.',
    buildHeading: 'Τι φτιάχνουμε',
    whoHeading: 'Για ποιους',
    programmes:
      'Κατάλληλο για έργα που χρηματοδοτούνται από προγράμματα όπως τα Horizon Europe, Interreg, Erasmus+, LIFE και Digital Europe.',
    approachHeading: 'Πώς το χτίζουμε',
    closer: 'Χρειάζεστε μια ψηφιακή πλατφόρμα για το έργο σας;',
  },
  services: [
    {
      name: 'Ιστοσελίδες έργων',
      text: 'Η δημόσια παρουσία ενός έργου: στόχοι, εταίροι, παραδοτέα και νέα, οργανωμένα για το κοινό που πρέπει να φτάσουν.',
    },
    {
      name: 'Ειδικές πλατφόρμες και πύλες',
      text: 'Κοινοί χώροι για εγγραφές, υλικό, αιτήσεις ή πιλοτικές δράσεις, χτισμένοι γύρω από το πώς λειτουργεί πραγματικά το έργο.',
    },
    {
      name: 'Web εφαρμογές',
      text: 'Εργαλεία για τις εργασίες που ορίζει ένα πακέτο εργασίας, από τη συλλογή δεδομένων έως την εκπαίδευση και τη διασύνδεση.',
    },
    {
      name: 'Πίνακες ελέγχου και εργαλεία δεδομένων',
      text: 'Καθαρή εικόνα δεικτών, παραδοτέων και συνόλων δεδομένων, για την κοινοπραξία ή για το κοινό.',
    },
    {
      name: 'Πλατφόρμες για φορείς και κοινότητες',
      text: 'Χώροι όπου ενδιαφερόμενοι φορείς, κοινότητες και τελικοί χρήστες συμμετέχουν, συνεισφέρουν και παραμένουν ενεργοί.',
    },
    {
      name: 'Εργαλεία εσωτερικής συνεργασίας',
      text: 'Στοχευμένα εργαλεία που βοηθούν εταίρους σε διαφορετικές χώρες να συντονίζουν εργασίες, έγγραφα και αποφάσεις.',
    },
    {
      name: 'Τεχνική συντήρηση και υποστήριξη',
      text: 'Ενημερώσεις, παρακολούθηση και υποστήριξη σε όλη τη διάρκεια του έργου και, όπου προβλέπεται, μετά από αυτό.',
    },
  ],
  audiences: [
    'Συντονιστές έργων',
    'Εταίροι κοινοπραξιών',
    'Πανεπιστήμια και ερευνητικοί οργανισμοί',
    'Φορείς καινοτομίας',
    'ΜμΕ που συμμετέχουν σε ευρωπαϊκά προγράμματα',
    'Δημόσιοι και μη κερδοσκοπικοί οργανισμοί',
  ],
  approach: [
    { name: 'Προσβασιμότητα', text: 'Λαμβάνεται υπόψη από την πρώτη διάταξη, δεν προστίθεται στο τέλος.' },
    {
      name: 'Πολυγλωσσική αρχιτεκτονική',
      text: 'Περιεχόμενο δομημένο για πολλές γλώσσες από την αρχή, ώστε κάθε εταίρος να δημοσιεύει στη δική του.',
    },
    {
      name: 'Υλοποίηση με γνώμονα τον GDPR',
      text: 'Προσωπικά δεδομένα μόνο όπου χρειάζονται, με την ιδιωτικότητα να εξετάζεται σε κάθε φόρμα και διασύνδεση.',
    },
    { name: 'Συντηρησιμότητα', text: 'Καθαρός κώδικας και δομή περιεχομένου, με τα οποία μπορεί να δουλέψει και ο επόμενος.' },
    {
      name: 'Μακροχρόνια υποστήριξη',
      text: 'Υποστήριξη σχεδιασμένη για τη διάρκεια του έργου και την περίοδο μετά από αυτό.',
    },
    { name: 'Απόδοση', text: 'Γρήγορες, ελαφριές σελίδες που λειτουργούν σε συνηθισμένες συνδέσεις και συσκευές.' },
    {
      name: 'Σαφής αρχιτεκτονική περιεχομένου',
      text: 'Πληροφορία οργανωμένη για κάθε κοινό που πρέπει να φτάσει ένα έργο, από το ευρύ κοινό έως τους ειδικούς.',
    },
    {
      name: 'Διασύνδεση με τις ροές του έργου',
      text: 'Σύνδεση με τα εργαλεία που ήδη χρησιμοποιεί η κοινοπραξία, αντί για ένα ακόμη.',
    },
  ],
};

export const euCopy: Record<Locale, EuCopy> = { en, el };
