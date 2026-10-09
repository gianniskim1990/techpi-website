import type { Locale } from '../i18n/locales';
import type { PageKey } from '../i18n/routes';
import type { Project } from './projects';

/**
 * Search and sharing metadata: the browser title and meta description of every page, in both languages.
 * The same text feeds Open Graph, the Twitter card and the WebPage node of the JSON-LD (src/seo/schema.ts).
 * Strategy and rules: docs/production/seo.md.
 *
 * Rules:
 * - Every description says only what the page itself shows. No metric, result, client claim or endorsement.
 * - Titles name the page first and end with "| TechPi"; the homepage leads with the name.
 * - Greek is written for Greek searches, not translated word for word.
 * - EU Projects: what TechPi builds for EU-funded projects. No implied European Commission endorsement,
 *   accreditation, programme track record or grant consultancy.
 */
export interface PageMeta {
  title: string;
  description: string;
}

export const pageMeta: Record<Locale, Record<PageKey, PageMeta>> = {
  en: {
    home: {
      title: 'TechPi — Digital Products & Technology',
      description:
        'TechPi designs and builds digital products, web experiences and intelligent systems, turning fragmented tools into connected technology, with AI where it adds value.',
    },
    work: {
      title: 'Work — Digital Products & Platforms | TechPi',
      description:
        'Explore TechPi client projects, adaptable business solutions and original products: digital platforms, websites and applications for real business needs.',
    },
    capabilities: {
      title: 'Capabilities — Products, Web & AI | TechPi',
      description:
        'What TechPi builds: digital products and platforms, websites and web experiences, AI and automation, and digital visibility, brought together around the problem.',
    },
    euProjects: {
      title: 'Websites & Digital Platforms for EU Projects | TechPi',
      description:
        'TechPi designs and builds project websites, digital platforms and web applications for EU-funded research, innovation and cooperation projects.',
    },
    about: {
      title: 'About — Technology Built Around Business Needs | TechPi',
      description:
        'TechPi, the evolution of pigiota314, designs and builds digital products, platforms and intelligent systems around real business needs.',
    },
    contact: {
      title: 'Contact — Start a Project | TechPi',
      description:
        'Start a project with TechPi: digital products, platforms, web systems and other technology projects. Tell us about the problem you need to solve.',
    },
  },
  el: {
    home: {
      title: 'TechPi — Ψηφιακά προϊόντα & τεχνολογία',
      description:
        'Η TechPi φτιάχνει ψηφιακά προϊόντα, ιστότοπους και ευφυή συστήματα: από αποσπασματικά εργαλεία σε συνδεδεμένη τεχνολογία, με τεχνητή νοημοσύνη όπου έχει αξία.',
    },
    work: {
      title: 'Έργα — Ψηφιακά προϊόντα & πλατφόρμες | TechPi',
      description:
        'Δείτε έργα πελατών της TechPi, ευέλικτες λύσεις για επιχειρήσεις και δικά μας ψηφιακά προϊόντα: πλατφόρμες, ιστοσελίδες και εφαρμογές.',
    },
    capabilities: {
      title: 'Δυνατότητες — Εφαρμογές, ιστότοποι & AI | TechPi',
      description:
        'Τι φτιάχνει η TechPi: ψηφιακά προϊόντα και πλατφόρμες, ιστότοπους, τεχνητή νοημοσύνη και αυτοματισμούς, και ψηφιακή ορατότητα, γύρω από το πρόβλημα που λύνουμε.',
    },
    euProjects: {
      title: 'Ιστοσελίδες & ψηφιακές πλατφόρμες για ευρωπαϊκά έργα | TechPi',
      description:
        'Η TechPi σχεδιάζει και αναπτύσσει ιστοσελίδες, ψηφιακές πλατφόρμες και web εφαρμογές για ευρωπαϊκά χρηματοδοτούμενα έργα έρευνας, καινοτομίας και συνεργασίας.',
    },
    about: {
      title: 'Η εταιρεία — Τεχνολογία για πραγματικές ανάγκες | TechPi',
      description:
        'Η TechPi είναι η εξέλιξη της pigiota314. Σχεδιάζει και αναπτύσσει ψηφιακά προϊόντα, πλατφόρμες και ευφυή συστήματα για επιχειρήσεις.',
    },
    contact: {
      title: 'Επικοινωνία — Ξεκινήστε ένα έργο | TechPi',
      description:
        'Ξεκινήστε ένα έργο με την TechPi: ψηφιακά προϊόντα, πλατφόρμες, web συστήματα και άλλα τεχνολογικά έργα. Πείτε μας ποιο πρόβλημα θέλετε να λύσετε.',
    },
  },
};

/**
 * A case study's metadata, from its own published facts: the name and category shown at the top of the page,
 * and the summary shown as its lead. `project` is already in the page's language.
 */
export function caseStudyMeta(project: Project): PageMeta {
  return { title: `${project.name} — ${project.category} | TechPi`, description: project.summary };
}

/**
 * The sharing image, one per language (scripts/brand/derive-social.mjs): the name and the site descriptor in that
 * language. Every page uses its language's image, case studies included (docs/production/seo.md).
 */
export const socialImage = {
  path: { en: '/og/techpi-en.png', el: '/og/techpi-el.png' } satisfies Record<Locale, string>,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: {
    en: 'TECHPI, Digital Products & Technology, beside the TechPi symbol.',
    el: 'TECHPI, Ψηφιακά προϊόντα & τεχνολογία, δίπλα στο σύμβολο της TechPi.',
  } satisfies Record<Locale, string>,
} as const;

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = { en: 'en_US', el: 'el_GR' };
