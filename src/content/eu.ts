import type { Locale } from '../i18n/locales';

/**
 * EU-funded projects: one specialist market within TechPi. Copy for the homepage teaser (home/EuProjects.astro) and
 * the full page (pages/EuProjectsPage.astro), in English and Greek.
 *
 * Source: the services, lifecycle, platform types, partner offer, process and programme references publicly described
 * on the user's own site, pigiota314.eu (/, /eu-project-websites, /digital-platforms, /communication-partners),
 * approved 2026-10-08 as a source. Adapted into TechPi's voice; not copied.
 *
 * Deliberately NOT carried over or claimed:
 *   - any specific EU project, case study, partner, result, or anonymised "experience" item
 *   - work under a specific programme: programmes are named as the kinds of projects the approach is built for
 *   - a guaranteed accessibility level: "designed with WCAG 2.2 AA requirements in mind" (the source's "baseline"
 *     wording waits for the launch copy review)
 *   - any delivery time (the source's "six to ten weeks"), budget or proposal outcome
 *   - procurement or legal arrangements; certifications; SOWISE+ (never mentioned)
 */

interface Item {
  name: string;
  text: string;
}

export interface EuCopy {
  home: { label: string; heading: string; text: string; cta: string; items: readonly string[] };
  page: {
    hero: { heading: string; lead: string; context: string; cta: string };
    infra: { heading: string; text: string; supportLabel: string; support: readonly string[]; audience: string };
    lifecycle: { label: string; heading: string; stages: readonly Item[] };
    websites: {
      heading: string;
      intro: string;
      structureHeading: string;
      structureText: string;
      modelRoot: string;
      model: readonly string[];
      groups: readonly { name: string; items: readonly string[] }[];
    };
    platforms: { heading: string; text: string; items: readonly Item[]; principlesLabel: string; principles: readonly Item[] };
    partners: {
      label: string;
      heading: string;
      text: string;
      whoLabel: string;
      who: readonly string[];
      offerLabel: string;
      offer: readonly Item[];
      cta: string;
    };
    programmes: { heading: string; text: string; list: readonly string[]; also: string; disclaimer: string };
    priorities: { heading: string; items: readonly Item[] };
    process: { heading: string; intro: string; steps: readonly Item[] };
    before: { heading: string; text: string; items: readonly string[]; note: string };
    after: { heading: string; text: string; items: readonly string[] };
    closer: { heading: string; text: string; cta: string };
  };
}

const en: EuCopy = {
  home: {
    label: 'EU-funded projects',
    heading: 'Digital infrastructure for EU-funded projects.',
    text: 'We design and build project websites, platforms, web applications and digital tools for European projects and collaborative programmes.',
    cta: 'Explore EU Projects',
    items: [
      'Project websites',
      'Custom platforms and portals',
      'Web applications',
      'Dashboards and data tools',
      'Stakeholder and community platforms',
      'Long-term technical support',
    ],
  },
  page: {
    hero: {
      heading: 'Technology for EU-funded projects.',
      lead: 'We design and build websites, digital platforms, web applications and technical systems for European research, innovation and cooperation projects.',
      context:
        'From project launch and partner communication to deliverables, stakeholder engagement, reporting and long-term sustainability.',
      cta: 'Discuss your project',
    },
    infra: {
      heading: 'A digital infrastructure for the full project lifecycle.',
      text: 'An EU project website should do more than present the project. It is a working tool for the partners, the stakeholders and the communities the project serves, and it has to keep working from the first month to the last, and after.',
      supportLabel: 'What it may need to support',
      support: [
        'Partners',
        'Stakeholders',
        'Project outputs',
        'Communication',
        'Dissemination',
        'Events',
        'Publications',
        'Reporting',
        'Results',
        'Long-term visibility',
      ],
      audience:
        'For project coordinators, consortium partners, universities, research organisations, SMEs and public organisations.',
    },
    lifecycle: {
      label: 'The project lifecycle',
      heading: 'Six stages, one connected system.',
      stages: [
        { name: 'Launch', text: 'Project identity, public presence and the structure of the consortium.' },
        { name: 'Communicate', text: 'News, events, partner communication and ongoing updates.' },
        { name: 'Publish', text: 'Deliverables, publications, outputs and resources, organised and easy to find.' },
        { name: 'Engage', text: 'Routes for stakeholders: registrations, communities and portals.' },
        { name: 'Measure', text: 'Analytics, communication KPIs and data that is useful for reporting.' },
        { name: 'Sustain', text: 'A maintainable presence that stays useful after the project ends.' },
      ],
    },
    websites: {
      heading: 'EU project websites',
      intro:
        'A specialist service for project websites built for communication, dissemination and long-term impact, and around the way research, innovation and cooperation projects actually communicate.',
      structureHeading: 'Structure before visuals.',
      structureText:
        'Every project is organised differently. We design the information architecture first, around the project’s partners, work packages, deliverables, results, events and stakeholders, and only then the visual design. The content model follows the project’s communication plan, instead of forcing every EU project into the same template.',
      modelRoot: 'Project',
      model: ['Partners', 'Work packages', 'Deliverables', 'Results', 'Events', 'Stakeholders'],
      groups: [
        {
          name: 'Content and structure',
          items: [
            'Project identity and public-facing story',
            'Consortium and partner presentation',
            'Work packages and objectives',
            'News and events',
            'Deliverables and publication libraries',
            'Results and impact pages',
            'Stakeholder engagement routes',
          ],
        },
        {
          name: 'Build',
          items: [
            'Multilingual-ready architecture',
            'Accessible, responsive development',
            'SEO, discoverability and structured content',
          ],
        },
        {
          name: 'Operation',
          items: ['Analytics and KPI measurement', 'Maintenance and technical support'],
        },
      ],
    },
    platforms: {
      heading: 'When a project needs more than a website.',
      text: 'For projects with more complex communication, collaboration, knowledge or operational needs, TechPi designs and builds custom web applications and digital platforms, shaped around the requirement rather than a template.',
      items: [
        { name: 'Stakeholder portals', text: 'Restricted spaces for partners, advisory boards or networks.' },
        { name: 'Knowledge repositories', text: 'Searchable libraries of publications, deliverables and outputs.' },
        { name: 'Event registration systems', text: 'Registration, attendance and follow-up in one place.' },
        { name: 'Member and partner areas', text: 'Private resources, contacts and community tools.' },
        { name: 'Project dashboards', text: 'Operational views for partners and coordinators.' },
        { name: 'Data and results interfaces', text: 'Clear front ends for datasets, models and project outputs.' },
        { name: 'Learning platforms', text: 'Courses, modules and assessments for training activities.' },
        { name: 'Custom workflow tools', text: 'Tools for the way a specific project actually operates.' },
      ],
      principlesLabel: 'Three principles',
      principles: [
        { name: 'Requirement-led', text: 'Technology is chosen around the real project requirement, not habit.' },
        { name: 'Integrated', text: 'The platform works cleanly with the project’s wider digital ecosystem.' },
        { name: 'Scalable', text: 'The architecture can evolve as the project, its users and its data grow.' },
      ],
    },
    partners: {
      label: 'For communication and dissemination partners',
      heading: 'The technology partner behind the communication strategy.',
      text: 'Communication agencies, consultancies and research communication teams can work with TechPi as their external design and development capacity, without expanding their own technical team.',
      whoLabel: 'We work with',
      who: [
        'Communication agencies',
        'Dissemination consultancies',
        'Proposal-development teams',
        'Project-management consultancies',
        'Research communication teams',
      ],
      offerLabel: 'What we offer',
      offer: [
        { name: 'White-label delivery', text: 'Development under your brand and within your client relationship.' },
        { name: 'Direct subcontracting', text: 'Clear scope, deliverables and accountability.' },
        { name: 'Proposal-stage technical input', text: 'Technical thinking for the website or platform a proposal describes.' },
        { name: 'Scope and indicative estimates', text: 'A realistic technical scope and indicative effort, for planning.' },
        { name: 'Rapid setup after the grant agreement', text: 'A quick start once the project begins.' },
        { name: 'Several active projects', text: 'Capacity for more than one project at a time.' },
        { name: 'Maintenance retainers', text: 'Predictable support through the life of the project.' },
        { name: 'Technical support', text: 'A dependable technical contact when something needs attention.' },
        { name: 'Clear handover and documentation', text: 'Documented systems that others can pick up.' },
        { name: 'Direct communication', text: 'Straight answers from the people doing the work.' },
      ],
      cta: 'Discuss a partnership',
    },
    programmes: {
      heading: 'Programmes and project types',
      text: 'Our approach is built around the way European projects communicate, including projects under programmes and networks such as:',
      list: [
        'Horizon Europe',
        'Interreg',
        'Erasmus+',
        'European Digital Innovation Hubs',
        'European research and innovation projects',
      ],
      also: 'We can also technically support projects funded through programmes such as LIFE and Digital Europe.',
      disclaimer:
        'TechPi is an independent technology company and is not affiliated with or endorsed by these programmes or the European Commission.',
    },
    priorities: {
      heading: 'Technical priorities',
      items: [
        { name: 'Accessible by design', text: 'Designed with WCAG 2.2 AA requirements in mind, from the first layout.' },
        { name: 'Multilingual-ready', text: 'Languages can be added later without redesigning the components.' },
        { name: 'Maintainable', text: 'Clear code and content models that others can work with.' },
        { name: 'Performance-focused', text: 'Fast, light pages on ordinary connections and devices.' },
        { name: 'Structured for discoverability', text: 'Clear structure and structured content for search and answer engines.' },
        { name: 'Built for long project lifecycles', text: 'Planned to stay useful for years, not months.' },
        { name: 'Easy content management', text: 'Partners can publish news, events and deliverables without a developer.' },
        { name: 'Clear analytics and reporting', text: 'Measurement tied to the project’s communication objectives.' },
        { name: 'Integration-ready', text: 'Connected to the tools a project already uses, where that is useful.' },
      ],
    },
    process: {
      heading: 'How we work together',
      intro: 'A predictable process, so coordinators and partners always know what happens next.',
      steps: [
        { name: 'Discovery and requirements', text: 'The project, its audiences, its partners and its communication goals, understood first.' },
        { name: 'Content and information architecture', text: 'The structure and the content model, agreed before any design.' },
        { name: 'UX and UI design', text: 'Interfaces designed for the project’s audiences and reviewed with the team.' },
        { name: 'Development', text: 'Built, connected to the tools that matter and ready for content.' },
        { name: 'Testing and launch', text: 'Accessibility, performance and cross-device checks before going live.' },
        { name: 'Maintenance and growth', text: 'Updates, new sections and improvements as the project develops.' },
      ],
    },
    before: {
      heading: 'Before the project starts',
      text: 'TechPi can support teams at proposal stage, before implementation begins.',
      items: [
        'Technical requirements',
        'Architecture recommendations',
        'Indicative effort and scope',
        'Technical feasibility',
        'Planning the website and platform needs of a proposal',
      ],
      note: 'Estimates at this stage are indicative and depend on the final scope.',
    },
    after: {
      heading: 'Throughout the project, and after',
      text: 'A project’s digital infrastructure changes as the project does.',
      items: [
        'Content and feature updates',
        'New deliverables and results areas',
        'Event support',
        'Platform improvements',
        'Monitoring',
        'Technical maintenance',
        'Post-project sustainability',
      ],
    },
    closer: {
      heading: 'Planning an EU-funded project or digital platform?',
      text: 'Tell us what your consortium, organisation or communication team needs. We can help define the right structure, technology and delivery approach.',
      cta: 'Discuss your project',
    },
  },
};

const el: EuCopy = {
  home: {
    label: 'Ευρωπαϊκά έργα',
    heading: 'Ψηφιακές λύσεις για ευρωπαϊκά έργα.',
    text: 'Σχεδιάζουμε και αναπτύσσουμε ιστοσελίδες, πλατφόρμες, εφαρμογές και ψηφιακά εργαλεία για ευρωπαϊκά έργα και συνεργατικά προγράμματα.',
    cta: 'Λύσεις για ευρωπαϊκά έργα',
    items: [
      'Ιστοσελίδες έργων',
      'Ειδικές πλατφόρμες και πύλες',
      'Web εφαρμογές',
      'Πίνακες ελέγχου και εργαλεία δεδομένων',
      'Πλατφόρμες για φορείς και κοινότητες',
      'Μακροχρόνια τεχνική υποστήριξη',
    ],
  },
  page: {
    hero: {
      heading: 'Τεχνολογία για ευρωπαϊκά χρηματοδοτούμενα έργα.',
      lead: 'Σχεδιάζουμε και αναπτύσσουμε ιστοσελίδες, ψηφιακές πλατφόρμες, web εφαρμογές και τεχνικά συστήματα για ευρωπαϊκά έργα έρευνας, καινοτομίας και συνεργασίας.',
      context:
        'Από την έναρξη του έργου και την επικοινωνία των εταίρων έως τα παραδοτέα, τη συμμετοχή των ενδιαφερόμενων φορέων, την αναφορά αποτελεσμάτων και τη βιωσιμότητα μετά το τέλος του.',
      cta: 'Συζητήστε το έργο σας',
    },
    infra: {
      heading: 'Ψηφιακή υποδομή για ολόκληρο τον κύκλο ζωής του έργου.',
      text: 'Η ιστοσελίδα ενός ευρωπαϊκού έργου δεν αρκεί να το παρουσιάζει. Είναι εργαλείο δουλειάς για τους εταίρους, τους ενδιαφερόμενους φορείς και τις κοινότητες στις οποίες απευθύνεται το έργο, και πρέπει να λειτουργεί από τον πρώτο μήνα έως τον τελευταίο, και μετά.',
      supportLabel: 'Τι μπορεί να χρειάζεται να υποστηρίζει',
      support: [
        'Εταίρους',
        'Ενδιαφερόμενους φορείς',
        'Παραδοτέα και αποτελέσματα εργασιών',
        'Επικοινωνία',
        'Διάχυση',
        'Εκδηλώσεις',
        'Δημοσιεύσεις',
        'Αναφορές',
        'Αποτελέσματα',
        'Μακροχρόνια προβολή',
      ],
      audience:
        'Για συντονιστές έργων, εταίρους κοινοπραξιών, πανεπιστήμια, ερευνητικούς οργανισμούς, ΜμΕ και δημόσιους φορείς.',
    },
    lifecycle: {
      label: 'Ο κύκλος ζωής του έργου',
      heading: 'Έξι στάδια, ένα συνδεδεμένο σύστημα.',
      stages: [
        { name: 'Έναρξη', text: 'Ταυτότητα του έργου, δημόσια παρουσία και η δομή της κοινοπραξίας.' },
        { name: 'Επικοινωνία', text: 'Νέα, εκδηλώσεις, επικοινωνία των εταίρων και συνεχής ενημέρωση.' },
        { name: 'Δημοσίευση', text: 'Παραδοτέα, δημοσιεύσεις, αποτελέσματα και υλικό, οργανωμένα και εύκολα στην αναζήτηση.' },
        { name: 'Συμμετοχή', text: 'Διαδρομές για τους ενδιαφερόμενους φορείς: εγγραφές, κοινότητες και πύλες.' },
        { name: 'Μέτρηση', text: 'Αναλυτικά στοιχεία, δείκτες επικοινωνίας και δεδομένα χρήσιμα για τις αναφορές.' },
        { name: 'Βιωσιμότητα', text: 'Μια παρουσία που συντηρείται εύκολα και παραμένει χρήσιμη μετά το τέλος του έργου.' },
      ],
    },
    websites: {
      heading: 'Ιστοσελίδες ευρωπαϊκών έργων',
      intro:
        'Μια εξειδικευμένη υπηρεσία για ιστοσελίδες έργων, σχεδιασμένες για επικοινωνία, διάχυση και μακροχρόνιο αντίκτυπο, και γύρω από τον τρόπο που επικοινωνούν πραγματικά τα έργα έρευνας, καινοτομίας και συνεργασίας.',
      structureHeading: 'Πρώτα η δομή, μετά η εικόνα.',
      structureText:
        'Κάθε έργο είναι οργανωμένο διαφορετικά. Σχεδιάζουμε πρώτα την αρχιτεκτονική της πληροφορίας, γύρω από τους εταίρους, τα πακέτα εργασίας, τα παραδοτέα, τα αποτελέσματα, τις εκδηλώσεις και τους ενδιαφερόμενους φορείς του έργου, και μόνο μετά τον οπτικό σχεδιασμό. Η δομή του περιεχομένου ακολουθεί το σχέδιο επικοινωνίας του έργου, αντί να χωρά κάθε ευρωπαϊκό έργο στο ίδιο πρότυπο.',
      modelRoot: 'Έργο',
      model: ['Εταίροι', 'Πακέτα εργασίας', 'Παραδοτέα', 'Αποτελέσματα', 'Εκδηλώσεις', 'Φορείς'],
      groups: [
        {
          name: 'Περιεχόμενο και δομή',
          items: [
            'Ταυτότητα και δημόσια αφήγηση του έργου',
            'Παρουσίαση της κοινοπραξίας και των εταίρων',
            'Πακέτα εργασίας και στόχοι',
            'Νέα και εκδηλώσεις',
            'Βιβλιοθήκες παραδοτέων και δημοσιεύσεων',
            'Σελίδες αποτελεσμάτων και αντίκτυπου',
            'Διαδρομές συμμετοχής για τους ενδιαφερόμενους φορείς',
          ],
        },
        {
          name: 'Υλοποίηση',
          items: [
            'Αρχιτεκτονική έτοιμη για πολλές γλώσσες',
            'Προσβάσιμη, responsive ανάπτυξη',
            'SEO, ευρεσιμότητα και δομημένο περιεχόμενο',
          ],
        },
        {
          name: 'Λειτουργία',
          items: ['Αναλυτικά στοιχεία και μέτρηση δεικτών', 'Συντήρηση και τεχνική υποστήριξη'],
        },
      ],
    },
    platforms: {
      heading: 'Όταν ένα έργο χρειάζεται κάτι περισσότερο από μια ιστοσελίδα.',
      text: 'Για έργα με πιο σύνθετες ανάγκες επικοινωνίας, συνεργασίας, γνώσης ή λειτουργίας, η TechPi σχεδιάζει και αναπτύσσει ειδικές web εφαρμογές και ψηφιακές πλατφόρμες, χτισμένες γύρω από την ανάγκη και όχι γύρω από ένα πρότυπο.',
      items: [
        { name: 'Πύλες ενδιαφερόμενων φορέων', text: 'Ιδιωτικοί χώροι για εταίρους, συμβουλευτικές επιτροπές ή δίκτυα.' },
        { name: 'Αποθετήρια γνώσης', text: 'Βιβλιοθήκες δημοσιεύσεων, παραδοτέων και αποτελεσμάτων με αναζήτηση.' },
        { name: 'Συστήματα εγγραφών σε εκδηλώσεις', text: 'Εγγραφές, παρουσίες και επόμενα βήματα σε ένα σημείο.' },
        { name: 'Χώροι μελών και εταίρων', text: 'Ιδιωτικό υλικό, επαφές και εργαλεία κοινότητας.' },
        { name: 'Πίνακες ελέγχου έργου', text: 'Λειτουργική εικόνα για εταίρους και συντονιστές.' },
        { name: 'Διεπαφές δεδομένων και αποτελεσμάτων', text: 'Καθαρή παρουσίαση συνόλων δεδομένων, μοντέλων και αποτελεσμάτων.' },
        { name: 'Πλατφόρμες εκπαίδευσης', text: 'Μαθήματα, ενότητες και αξιολογήσεις για εκπαιδευτικές δράσεις.' },
        { name: 'Ειδικά εργαλεία ροών εργασίας', text: 'Εργαλεία για τον τρόπο που λειτουργεί πραγματικά ένα συγκεκριμένο έργο.' },
      ],
      principlesLabel: 'Τρεις αρχές',
      principles: [
        { name: 'Με βάση την ανάγκη', text: 'Η τεχνολογία επιλέγεται με βάση την πραγματική ανάγκη του έργου, όχι από συνήθεια.' },
        { name: 'Ενσωματωμένη', text: 'Η πλατφόρμα λειτουργεί αρμονικά με το ευρύτερο ψηφιακό οικοσύστημα του έργου.' },
        { name: 'Επεκτάσιμη', text: 'Η αρχιτεκτονική εξελίσσεται καθώς μεγαλώνουν το έργο, οι χρήστες και τα δεδομένα του.' },
      ],
    },
    partners: {
      label: 'Για συνεργάτες επικοινωνίας και διάχυσης',
      heading: 'Ο τεχνολογικός συνεργάτης πίσω από τη στρατηγική επικοινωνίας.',
      text: 'Εταιρείες επικοινωνίας, σύμβουλοι και ομάδες επικοινωνίας της έρευνας μπορούν να συνεργάζονται με την TechPi ως εξωτερική ομάδα σχεδιασμού και ανάπτυξης, χωρίς να μεγαλώνουν τη δική τους τεχνική ομάδα.',
      whoLabel: 'Συνεργαζόμαστε με',
      who: [
        'Εταιρείες επικοινωνίας',
        'Συμβούλους διάχυσης',
        'Ομάδες σύνταξης προτάσεων',
        'Συμβούλους διαχείρισης έργων',
        'Ομάδες επικοινωνίας της έρευνας',
      ],
      offerLabel: 'Τι προσφέρουμε',
      offer: [
        { name: 'Υλοποίηση white-label', text: 'Ανάπτυξη με το δικό σας όνομα και μέσα στη δική σας σχέση με τον πελάτη.' },
        { name: 'Άμεση υπεργολαβία', text: 'Σαφές αντικείμενο, παραδοτέα και ευθύνη.' },
        { name: 'Τεχνική συμβολή στην πρόταση', text: 'Τεχνική σκέψη για την ιστοσελίδα ή την πλατφόρμα που περιγράφει μια πρόταση.' },
        { name: 'Αντικείμενο και ενδεικτικές εκτιμήσεις', text: 'Ρεαλιστικό τεχνικό αντικείμενο και ενδεικτική εκτίμηση εργασίας, για τον σχεδιασμό.' },
        { name: 'Γρήγορη εκκίνηση μετά τη συμφωνία επιχορήγησης', text: 'Άμεσο ξεκίνημα μόλις αρχίσει το έργο.' },
        { name: 'Πολλά έργα ταυτόχρονα', text: 'Δυνατότητα για περισσότερα από ένα έργα κάθε φορά.' },
        { name: 'Συμβόλαια συντήρησης', text: 'Προβλέψιμη υποστήριξη σε όλη τη διάρκεια του έργου.' },
        { name: 'Τεχνική υποστήριξη', text: 'Ένας αξιόπιστος τεχνικός σύνδεσμος όταν κάτι χρειάζεται προσοχή.' },
        { name: 'Καθαρή παράδοση και τεκμηρίωση', text: 'Τεκμηριωμένα συστήματα που μπορούν να συνεχίσουν και άλλοι.' },
        { name: 'Άμεση επικοινωνία', text: 'Ξεκάθαρες απαντήσεις από τους ανθρώπους που κάνουν τη δουλειά.' },
      ],
      cta: 'Συζητήστε μια συνεργασία',
    },
    programmes: {
      heading: 'Προγράμματα και είδη έργων',
      text: 'Η προσέγγισή μας είναι χτισμένη γύρω από τον τρόπο που επικοινωνούν τα ευρωπαϊκά έργα, όπως έργα στο πλαίσιο προγραμμάτων και δικτύων όπως:',
      list: [
        'Horizon Europe',
        'Interreg',
        'Erasmus+',
        'Ευρωπαϊκοί Κόμβοι Ψηφιακής Καινοτομίας',
        'Ευρωπαϊκά έργα έρευνας και καινοτομίας',
      ],
      also: 'Μπορούμε επίσης να υποστηρίξουμε τεχνικά έργα που χρηματοδοτούνται από προγράμματα όπως τα LIFE και Digital Europe.',
      disclaimer:
        'Η TechPi είναι ανεξάρτητη εταιρεία τεχνολογίας και δεν συνδέεται με αυτά τα προγράμματα ή την Ευρωπαϊκή Επιτροπή, ούτε έχει την έγκρισή τους.',
    },
    priorities: {
      heading: 'Τεχνικές προτεραιότητες',
      items: [
        { name: 'Προσβάσιμο από τον σχεδιασμό', text: 'Σχεδιασμένο με γνώμονα τις απαιτήσεις του WCAG 2.2 AA, από την πρώτη διάταξη.' },
        { name: 'Έτοιμο για πολλές γλώσσες', text: 'Νέες γλώσσες προστίθενται αργότερα χωρίς επανασχεδιασμό.' },
        { name: 'Εύκολο στη συντήρηση', text: 'Καθαρός κώδικας και δομή περιεχομένου, με τα οποία μπορούν να δουλέψουν και άλλοι.' },
        { name: 'Με έμφαση στην απόδοση', text: 'Γρήγορες, ελαφριές σελίδες σε συνηθισμένες συνδέσεις και συσκευές.' },
        { name: 'Δομημένο για ευρεσιμότητα', text: 'Σαφής δομή και δομημένο περιεχόμενο για μηχανές αναζήτησης και απαντήσεων.' },
        { name: 'Για μακρούς κύκλους έργων', text: 'Σχεδιασμένο να μένει χρήσιμο για χρόνια, όχι για μήνες.' },
        { name: 'Εύκολη διαχείριση περιεχομένου', text: 'Οι εταίροι δημοσιεύουν νέα, εκδηλώσεις και παραδοτέα χωρίς προγραμματιστή.' },
        { name: 'Σαφή στοιχεία και αναφορές', text: 'Μέτρηση συνδεδεμένη με τους στόχους επικοινωνίας του έργου.' },
        { name: 'Έτοιμο για διασυνδέσεις', text: 'Σύνδεση με τα εργαλεία που ήδη χρησιμοποιεί ένα έργο, όπου έχει νόημα.' },
      ],
    },
    process: {
      heading: 'Πώς συνεργαζόμαστε',
      intro: 'Μια προβλέψιμη διαδικασία, ώστε συντονιστές και εταίροι να ξέρουν πάντα ποιο είναι το επόμενο βήμα.',
      steps: [
        { name: 'Ανάλυση και απαιτήσεις', text: 'Πρώτα κατανοούμε το έργο, το κοινό του, τους εταίρους και τους στόχους επικοινωνίας του.' },
        { name: 'Περιεχόμενο και αρχιτεκτονική πληροφορίας', text: 'Η δομή και το μοντέλο περιεχομένου, συμφωνημένα πριν από τον σχεδιασμό.' },
        { name: 'Σχεδιασμός UX και UI', text: 'Διεπαφές σχεδιασμένες για το κοινό του έργου και ελεγμένες μαζί με την ομάδα.' },
        { name: 'Ανάπτυξη', text: 'Υλοποίηση, σύνδεση με τα εργαλεία που χρειάζονται και προετοιμασία για το περιεχόμενο.' },
        { name: 'Έλεγχοι και δημοσίευση', text: 'Έλεγχοι προσβασιμότητας, απόδοσης και συμβατότητας συσκευών πριν από τη δημοσίευση.' },
        { name: 'Συντήρηση και εξέλιξη', text: 'Ενημερώσεις, νέες ενότητες και βελτιώσεις καθώς προχωρά το έργο.' },
      ],
    },
    before: {
      heading: 'Πριν ξεκινήσει το έργο',
      text: 'Η TechPi μπορεί να υποστηρίξει ομάδες στο στάδιο της πρότασης, πριν αρχίσει η υλοποίηση.',
      items: [
        'Τεχνικές απαιτήσεις',
        'Προτάσεις αρχιτεκτονικής',
        'Ενδεικτική εκτίμηση εργασίας και αντικειμένου',
        'Τεχνική σκοπιμότητα',
        'Σχεδιασμός των αναγκών μιας πρότασης σε ιστοσελίδα και πλατφόρμα',
      ],
      note: 'Οι εκτιμήσεις σε αυτό το στάδιο είναι ενδεικτικές και εξαρτώνται από το τελικό αντικείμενο.',
    },
    after: {
      heading: 'Σε όλη τη διάρκεια του έργου, και μετά',
      text: 'Η ψηφιακή υποδομή ενός έργου αλλάζει μαζί με το έργο.',
      items: [
        'Ενημερώσεις περιεχομένου και λειτουργιών',
        'Νέες ενότητες παραδοτέων και αποτελεσμάτων',
        'Υποστήριξη εκδηλώσεων',
        'Βελτιώσεις πλατφόρμας',
        'Παρακολούθηση',
        'Τεχνική συντήρηση',
        'Βιωσιμότητα μετά το τέλος του έργου',
      ],
    },
    closer: {
      heading: 'Σχεδιάζετε ένα ευρωπαϊκό έργο ή μια ψηφιακή πλατφόρμα;',
      text: 'Πείτε μας τι χρειάζεται η κοινοπραξία, ο οργανισμός ή η ομάδα επικοινωνίας σας. Μπορούμε να βοηθήσουμε να οριστούν η σωστή δομή, η τεχνολογία και ο τρόπος υλοποίησης.',
      cta: 'Συζητήστε το έργο σας',
    },
  },
};

export const euCopy: Record<Locale, EuCopy> = { en, el };
