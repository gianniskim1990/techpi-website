import type { Locale } from '../i18n/locales';
import { pathFor } from '../i18n/routes';
import { contactFacts, operatorFacts, registrationFacts } from './site';

/**
 * The Privacy Policy and the Cookies Policy, in English and Greek (Phase 2B).
 *
 * Written from the confirmed facts only (docs/launch/LEGAL_CONTENT_DRAFTS.md, docs/launch/OWNER_DECISIONS_REQUIRED.md):
 * - Operator: the owner's sole proprietorship (site.ts, operatorFacts). TechPi is its brand, not a separate company.
 * - The website sets no cookies of its own, uses no browser storage, no analytics, advertising or tracking, and has no
 *   forms. Contact is by email and telephone only.
 * - Hosting, DNS and security: Cloudflare (Free plan; Bot Fight Mode off; Browser Integrity Check, the Managed Ruleset
 *   and HTTP DDoS protection on). Cloudflare may set strictly necessary security cookies, such as `cf_clearance`, when a
 *   visitor is shown a security check. Never claimed as always present, never claimed as impossible.
 * - Email: hosted by Pointer.gr (cPanel), read through the provider's webmail (Roundcube) and an email program on the
 *   owner's computer (Outlook Classic) over IMAP/SMTP. Outlook Classic is an email program, not a hosting provider, so
 *   no other email processor is named.
 * - Retention: 12 months after the last communication for enquiries that do not lead to work (owner decision).
 * - Search: Google Search Console is the only search tool approved for launch, but it is not yet set up, so the
 *   pages describe it as intended (prospective wording). It is set up through DNS: no script or cookie on the site.
 * - Transfers: described as Cloudflare states them in its own privacy policy (effective 4 November 2025). No contract,
 *   DPA or certification on TechPi's side is claimed, and no absolute statement about TechPi's own transfers is made.
 * - Registration (GEMI and VAT numbers): rendered from registrationFacts in site.ts only once supplied; until then the
 *   pages show neither the numbers nor any label or placeholder for them.
 *
 * Inline links use the form [text](href). Nothing here is a lawyer-approved text, and the pages do not claim to be.
 */

export type LegalBlock = { p: string } | { ul: readonly string[] } | { address: readonly string[] };

export interface LegalSection {
  /** Anchor id, stable across languages so the contents list and links work the same way. */
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
}

export interface LegalPageCopy {
  heading: string;
  lead: string;
  /** ISO date of the current version. */
  updated: string;
  updatedLabel: string;
  updatedText: string;
  contentsLabel: string;
  sections: readonly LegalSection[];
}

const UPDATED = '2026-10-13';
const email = contactFacts.email;
const mail = `[${email}](mailto:${email})`;
const phone = `[${contactFacts.phoneDisplay}](tel:${contactFacts.phoneDial})`;
/** GEMI and VAT numbers, once supplied (site.ts, registrationFacts). Returns no block while neither is set. */
const registration = (locale: Locale): LegalBlock[] => {
  const labels = locale === 'el'
    ? { gemi: 'Αριθμός Γ.Ε.ΜΗ.', vat: 'ΑΦΜ' }
    : { gemi: 'GEMI (General Commercial Registry) number', vat: 'VAT number (ΑΦΜ)' };
  const parts = (['gemi', 'vat'] as const)
    .filter((k) => registrationFacts[k])
    .map((k) => `${labels[k]}: ${registrationFacts[k]}.`);
  return parts.length ? [{ p: parts.join(' ') }] : [];
};
const cloudflarePrivacy = 'https://www.cloudflare.com/privacypolicy/';
const cloudflareCookies = 'https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/';
const dpa = 'https://www.dpa.gr/';
const dpaComplaint = 'https://www.dpa.gr/el/polites/katagelia_stin_arxi';

const en: Record<'privacy' | 'cookies', LegalPageCopy> = {
  privacy: {
    heading: 'Privacy Policy',
    lead: 'What personal data we process when you visit techpi.eu or contact us, why, for how long, and how to exercise your rights.',
    updated: UPDATED,
    updatedLabel: 'Last updated',
    updatedText: '13 October 2026',
    contentsLabel: 'On this page',
    sections: [
      {
        id: 'who-we-are',
        heading: 'Who we are',
        blocks: [
          { p: `TechPi is the commercial brand of ${operatorFacts.name.en}, a sole proprietorship (ατομική επιχείρηση) established in Greece. TechPi is not a separate company. ${operatorFacts.name.en} is the controller of the personal data described in this policy.` },
          { address: [`${operatorFacts.name.en} (TechPi)`, ...operatorFacts.address.en] },
          ...registration('en'),
          { p: `Email: ${mail}. Telephone: ${phone}.` },
          { p: 'For any question about this policy or about your personal data, write to us at the email address above.' },
        ],
      },
      {
        id: 'scope',
        heading: 'What this policy covers',
        blocks: [
          { p: 'This policy covers the website techpi.eu (including the addresses that redirect to it, such as techpi.gr) and enquiries you send us by email or telephone.' },
          { p: 'It does not cover other websites or applications, including the websites of our clients that we link to. They have their own notices.' },
        ],
      },
      {
        id: 'data',
        heading: 'What data we process',
        blocks: [
          { p: '**When you contact us.** If you email or call us, we receive the information you choose to give us: usually your name, your email address or telephone number, your organisation, the content of your message and any files you attach. During a call we may note what is needed to follow up.' },
          { p: '**When you visit the website.** To deliver the website and protect it from abuse, our hosting and security provider processes technical information about each request: your IP address, the date and time, the page requested, information your browser sends (such as its type and language) and security signals derived from these. We do not use this information to identify you or to build a profile.' },
          { p: '**What we do not do.** The website has no forms and no user accounts. It does not use analytics, advertising, tracking or profiling tools, and it does not load fonts or scripts from other companies. See the [Cookies Policy](' + pathFor('cookies', 'en') + ').' },
        ],
      },
      {
        id: 'purposes',
        heading: 'Why we process it, and on what legal basis',
        blocks: [
          {
            ul: [
              'To answer your enquiry, prepare a proposal or quotation and discuss a possible project: steps taken at your request before entering into a contract (Article 6(1)(b) GDPR). Where an enquiry does not concern a possible contract, our legitimate interest in replying to messages sent to us (Article 6(1)(f) GDPR).',
              'To deliver the website and keep it secure, including protection against automated attacks: our legitimate interest in operating a secure website (Article 6(1)(f) GDPR).',
              'If we work together: performing our contract with you or your organisation (Article 6(1)(b) GDPR), and keeping invoices, accounting records and related correspondence as tax and commercial law require (Article 6(1)(c) GDPR).',
              'Where necessary, to establish, exercise or defend legal claims: our legitimate interest (Article 6(1)(f) GDPR).',
            ],
          },
          { p: 'We do not rely on your consent for any of this processing, we do not make decisions about you by automated means, and we do not use your data for marketing.' },
          { p: 'You do not have to give us personal data. Without contact details, however, we cannot reply to you.' },
        ],
      },
      {
        id: 'providers',
        heading: 'Service providers',
        blocks: [
          { p: 'We use a small number of providers who process data on our behalf, only as needed for the services below:' },
          {
            ul: [
              `**Cloudflare** hosts the website and provides its network, domain name (DNS) and security services, for techpi.eu and techpi.gr. It processes the technical information described above. Cloudflare explains its own processing in its [privacy policy](${cloudflarePrivacy}).`,
              '**Pointer.gr** hosts our email. Messages sent to and from @techpi.eu addresses are stored on its servers. We read our mail through the provider\'s webmail and through an email program on our own computer, which keeps a copy of the messages it downloads.',
            ],
          },
          { p: 'We intend to use Google Search Console to see how techpi.eu appears in Google Search. It is set up through our domain settings, not through code on this website, so it adds no script or cookie here. It provides aggregated search reports and does not send us data about individual visitors.' },
          { p: 'We do not sell personal data and we do not share it with third parties for their own marketing.' },
        ],
      },
      {
        id: 'transfers',
        heading: 'International transfers',
        blocks: [
          { p: `Cloudflare is a United States company with a global network, so technical request data may be processed outside the European Economic Area, including in the United States. In its [privacy policy](${cloudflarePrivacy}), Cloudflare states that for transfers from the EEA to the United States it relies on its certification under the EU–U.S. Data Privacy Framework and, should that certification lapse, on standard contractual clauses.` },
        ],
      },
      {
        id: 'retention',
        heading: 'How long we keep data',
        blocks: [
          {
            ul: [
              '**Enquiries that do not lead to a collaboration** (including requests for a quotation): 12 months after our most recent communication. After that we delete them, or anonymise them, unless a specific legal obligation or a justified need, such as an ongoing dispute, requires us to keep them longer.',
              '**Clients:** contracts, invoices, accounting records and related correspondence are kept for as long as the collaboration lasts and afterwards for as long as applicable tax and commercial law requires. These periods are set by law and can be longer than 12 months.',
              '**Technical data of website visits:** we do not run our own web server and do not keep our own visitor logs. Cloudflare processes request data under its own retention practices, described in its privacy policy.',
            ],
          },
          { p: 'The same periods apply to the copies of emails kept on our own computer.' },
        ],
      },
      {
        id: 'rights',
        heading: 'Your rights',
        blocks: [
          { p: 'Under the General Data Protection Regulation (GDPR) you have the right to:' },
          {
            ul: [
              'access the personal data we hold about you and receive a copy of it;',
              'have inaccurate data corrected and incomplete data completed;',
              'have your data erased, where the law allows;',
              'restrict how we use your data in certain cases;',
              'object to processing based on our legitimate interests;',
              'receive data you gave us in a structured, commonly used format, where processing is based on a contract.',
            ],
          },
          { p: `To exercise a right, write to ${mail}. We may ask for information to confirm your identity. We reply within one month of receiving your request; where a request is complex, this may be extended by up to two further months, and we will tell you if so. Exercising your rights is free of charge.` },
        ],
      },
      {
        id: 'complaints',
        heading: 'Complaints',
        blocks: [
          { p: 'If you believe we have not handled your personal data correctly, please contact us first so that we can try to resolve the matter. You also have the right to lodge a complaint with a supervisory authority. In Greece this is the Hellenic Data Protection Authority:' },
          { address: ['Hellenic Data Protection Authority (Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα)', '1-3 Kifisias Avenue, 115 23 Athens, Greece'] },
          { p: `Website: [www.dpa.gr](${dpa}). Complaints: [how to submit a complaint](${dpaComplaint}) (in Greek). You may also complain to the supervisory authority of the EU country where you live or work.` },
        ],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        blocks: [
          { p: 'We update this policy when the way we process personal data changes, for example if we add a contact form or an analytics tool. The date at the top shows the current version.' },
        ],
      },
    ],
  },
  cookies: {
    heading: 'Cookies Policy',
    lead: 'TechPi does not use cookies for analytics, advertising or tracking. This page explains the security cookies our hosting provider may set, and how you can control cookies.',
    updated: UPDATED,
    updatedLabel: 'Last updated',
    updatedText: '13 October 2026',
    contentsLabel: 'On this page',
    sections: [
      {
        id: 'cookies',
        heading: 'What cookies are',
        blocks: [
          { p: 'Cookies are small text files that a website stores in your browser. Similar technologies, such as local storage, keep information on your device in other ways. In this policy, "cookies" covers both.' },
        ],
      },
      {
        id: 'our-use',
        heading: 'Cookies used by TechPi',
        blocks: [
          { p: 'techpi.eu does not set cookies of its own and does not store information on your device through local or session storage.' },
          {
            ul: [
              'No analytics: we do not use Google Analytics or any other analytics service.',
              'No advertising or social tracking: no Meta Pixel, no advertising networks, no tracking or profiling.',
              'No fonts, scripts or embedded content loaded from other companies.',
            ],
          },
          { p: 'We intend to use Google Search Console to see how the website appears in Google Search. It is set up through our domain settings, not through code on this website, so it adds no script or cookie here.' },
        ],
      },
      {
        id: 'security',
        heading: 'Security cookies from our hosting provider',
        blocks: [
          { p: 'techpi.eu is delivered and protected by Cloudflare. To keep the website available and to protect it from automated attacks, Cloudflare checks incoming requests. In some situations, for example when a request looks unusual and a security check is shown, Cloudflare may set a cookie in your browser, such as `cf_clearance`, which records that the check was passed so that it is not repeated.' },
          { p: 'These cookies are not set on every visit. They are used only for security, are strictly necessary to provide the website securely, and are not used by us or by Cloudflare for analytics or advertising. Strictly necessary cookies do not require consent under the ePrivacy rules (Directive 2002/58/EC and Greek Law 3471/2006).' },
          { p: `Cloudflare describes the cookies its services can set in its [cookie documentation](${cloudflareCookies}). Cloudflare also processes the request data described in our [Privacy Policy](${pathFor('privacy', 'en')}).` },
        ],
      },
      {
        id: 'banner',
        heading: 'Why there is no cookie banner',
        blocks: [
          { p: 'A consent banner is needed for cookies that are not strictly necessary, such as analytics or advertising cookies. techpi.eu uses none, so it does not show one.' },
        ],
      },
      {
        id: 'control',
        heading: 'How to control cookies',
        blocks: [
          { p: 'You can view, block and delete cookies in your browser settings at any time. If you block strictly necessary security cookies, a security check may not complete and some requests may be refused.' },
        ],
      },
      {
        id: 'other-sites',
        heading: 'Links to other websites',
        blocks: [
          { p: 'Our case studies link to our clients\' websites. Those websites, and any other site you reach through a link, may use their own cookies under their own policies. Email and telephone links open the email or telephone app on your device.' },
        ],
      },
      {
        id: 'changes',
        heading: 'Future changes',
        blocks: [
          { p: 'If we ever add analytics or any other technology that stores information on your device and is not strictly necessary, we will update this policy first and, where the law requires it, ask for your consent before it is used.' },
        ],
      },
      {
        id: 'who-we-are',
        heading: 'Who we are',
        blocks: [
          { p: `techpi.eu is operated by ${operatorFacts.name.en}, a sole proprietorship in ${operatorFacts.town.en}, under the brand TechPi. Questions about cookies: ${mail}. How we handle personal data is explained in our [Privacy Policy](${pathFor('privacy', 'en')}).` },
        ],
      },
    ],
  },
};

const el: Record<'privacy' | 'cookies', LegalPageCopy> = {
  privacy: {
    heading: 'Πολιτική Απορρήτου',
    lead: 'Ποια προσωπικά δεδομένα επεξεργαζόμαστε όταν επισκέπτεστε το techpi.eu ή επικοινωνείτε μαζί μας, για ποιον λόγο, για πόσο διάστημα και πώς μπορείτε να ασκήσετε τα δικαιώματά σας.',
    updated: UPDATED,
    updatedLabel: 'Τελευταία ενημέρωση',
    updatedText: '13 Οκτωβρίου 2026',
    contentsLabel: 'Σε αυτή τη σελίδα',
    sections: [
      {
        id: 'who-we-are',
        heading: 'Ποιοι είμαστε',
        blocks: [
          { p: `Η TechPi είναι η εμπορική ονομασία της ατομικής επιχείρησης του Ιωάννη Κιμούντρη, με έδρα στην Ελλάδα. Η TechPi δεν είναι χωριστή εταιρεία. Υπεύθυνος επεξεργασίας για τα προσωπικά δεδομένα που περιγράφονται σε αυτή την πολιτική είναι ο ${operatorFacts.name.el}.` },
          { address: [`${operatorFacts.name.el} (TechPi)`, ...operatorFacts.address.el] },
          ...registration('el'),
          { p: `Email: ${mail}. Τηλέφωνο: ${phone}.` },
          { p: 'Για κάθε ερώτηση σχετικά με αυτή την πολιτική ή με τα προσωπικά σας δεδομένα, γράψτε μας στη διεύθυνση email παραπάνω.' },
        ],
      },
      {
        id: 'scope',
        heading: 'Τι καλύπτει η πολιτική',
        blocks: [
          { p: 'Η πολιτική καλύπτει τον ιστότοπο techpi.eu (μαζί με τις διευθύνσεις που ανακατευθύνουν σε αυτόν, όπως το techpi.gr) και τα μηνύματα και τις κλήσεις που μας απευθύνετε με email ή τηλέφωνο.' },
          { p: 'Δεν καλύπτει άλλους ιστότοπους ή εφαρμογές, όπως τους ιστότοπους των πελατών μας στους οποίους παραπέμπουμε. Αυτοί έχουν τις δικές τους πολιτικές.' },
        ],
      },
      {
        id: 'data',
        heading: 'Ποια δεδομένα επεξεργαζόμαστε',
        blocks: [
          { p: '**Όταν επικοινωνείτε μαζί μας.** Αν μας στείλετε email ή μας τηλεφωνήσετε, λαμβάνουμε όσα στοιχεία επιλέγετε να μας δώσετε: συνήθως το όνομά σας, τη διεύθυνση email ή τον αριθμό τηλεφώνου σας, τον οργανισμό σας, το περιεχόμενο του μηνύματος και τυχόν συνημμένα αρχεία. Σε μια κλήση μπορεί να κρατήσουμε σημειώσεις για όσα χρειάζονται για τη συνέχεια.' },
          { p: '**Όταν επισκέπτεστε τον ιστότοπο.** Για να παρέχεται ο ιστότοπος και να προστατεύεται από κατάχρηση, ο πάροχος φιλοξενίας και ασφάλειας επεξεργάζεται τεχνικές πληροφορίες για κάθε αίτημα: τη διεύθυνση IP σας, την ημερομηνία και ώρα, τη σελίδα που ζητήθηκε, πληροφορίες που στέλνει το πρόγραμμα περιήγησής σας (όπως τον τύπο και τη γλώσσα του) και ενδείξεις ασφαλείας που προκύπτουν από αυτές. Δεν χρησιμοποιούμε αυτές τις πληροφορίες για να σας ταυτοποιήσουμε ή για να δημιουργήσουμε προφίλ.' },
          { p: '**Τι δεν κάνουμε.** Ο ιστότοπος δεν έχει φόρμες ούτε λογαριασμούς χρηστών. Δεν χρησιμοποιεί εργαλεία στατιστικών, διαφήμισης, παρακολούθησης ή δημιουργίας προφίλ και δεν φορτώνει γραμματοσειρές ή scripts από άλλες εταιρείες. Δείτε την [Πολιτική Cookies](' + pathFor('cookies', 'el') + ').' },
        ],
      },
      {
        id: 'purposes',
        heading: 'Για ποιον σκοπό και με ποια νομική βάση',
        blocks: [
          {
            ul: [
              'Για να απαντήσουμε στο μήνυμά σας, να ετοιμάσουμε πρόταση ή προσφορά και να συζητήσουμε ένα πιθανό έργο: ενέργειες κατόπιν αιτήματός σας πριν από τη σύναψη σύμβασης (άρθρο 6 παρ. 1 στοιχ. β΄ ΓΚΠΔ). Όταν ένα μήνυμα δεν αφορά πιθανή σύμβαση, το έννομο συμφέρον μας να απαντάμε στα μηνύματα που λαμβάνουμε (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).',
              'Για να παρέχεται ο ιστότοπος με ασφάλεια, μαζί με την προστασία από αυτοματοποιημένες επιθέσεις: το έννομο συμφέρον μας για τη λειτουργία ενός ασφαλούς ιστότοπου (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).',
              'Αν συνεργαστούμε: την εκτέλεση της σύμβασης με εσάς ή τον οργανισμό σας (άρθρο 6 παρ. 1 στοιχ. β΄ ΓΚΠΔ) και την τήρηση τιμολογίων, λογιστικών αρχείων και της σχετικής αλληλογραφίας, όπως απαιτεί η φορολογική και εμπορική νομοθεσία (άρθρο 6 παρ. 1 στοιχ. γ΄ ΓΚΠΔ).',
              'Όπου χρειάζεται, για τη θεμελίωση, άσκηση ή υποστήριξη νομικών αξιώσεων: το έννομο συμφέρον μας (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).',
            ],
          },
          { p: 'Καμία από αυτές τις επεξεργασίες δεν βασίζεται στη συγκατάθεσή σας, δεν λαμβάνουμε αποφάσεις για εσάς με αυτοματοποιημένα μέσα και δεν χρησιμοποιούμε τα δεδομένα σας για σκοπούς προώθησης.' },
          { p: 'Δεν είστε υποχρεωμένοι να μας δώσετε προσωπικά δεδομένα. Χωρίς στοιχεία επικοινωνίας, όμως, δεν μπορούμε να σας απαντήσουμε.' },
        ],
      },
      {
        id: 'providers',
        heading: 'Πάροχοι υπηρεσιών',
        blocks: [
          { p: 'Χρησιμοποιούμε λίγους παρόχους, οι οποίοι επεξεργάζονται δεδομένα για λογαριασμό μας μόνο όσο χρειάζεται για τις παρακάτω υπηρεσίες:' },
          {
            ul: [
              `Η **Cloudflare** φιλοξενεί τον ιστότοπο και παρέχει τις υπηρεσίες δικτύου, ονομάτων τομέα (DNS) και ασφάλειας για τα techpi.eu και techpi.gr. Επεξεργάζεται τις τεχνικές πληροφορίες που περιγράφονται παραπάνω. Η Cloudflare εξηγεί τη δική της επεξεργασία στην [πολιτική απορρήτου](${cloudflarePrivacy}) της.`,
              'Η **Pointer.gr** φιλοξενεί το email μας. Τα μηνύματα προς και από διευθύνσεις @techpi.eu αποθηκεύονται στους διακομιστές της. Διαβάζουμε την αλληλογραφία μας μέσω του webmail του παρόχου και μέσω προγράμματος email στον δικό μας υπολογιστή, το οποίο κρατά αντίγραφο των μηνυμάτων που κατεβάζει.',
            ],
          },
          { p: 'Σκοπεύουμε να χρησιμοποιήσουμε το Google Search Console για να βλέπουμε πώς εμφανίζεται το techpi.eu στην Αναζήτηση Google. Ρυθμίζεται μέσω των ρυθμίσεων του τομέα μας και όχι με κώδικα σε αυτόν τον ιστότοπο, επομένως δεν προσθέτει script ή cookie εδώ. Παρέχει συγκεντρωτικές αναφορές αναζήτησης και δεν μας στέλνει δεδομένα για μεμονωμένους επισκέπτες.' },
          { p: 'Δεν πουλάμε προσωπικά δεδομένα και δεν τα μοιραζόμαστε με τρίτους για δικούς τους σκοπούς προώθησης.' },
        ],
      },
      {
        id: 'transfers',
        heading: 'Διαβιβάσεις εκτός ΕΟΧ',
        blocks: [
          { p: `Η Cloudflare είναι αμερικανική εταιρεία με παγκόσμιο δίκτυο, επομένως τεχνικά δεδομένα αιτημάτων μπορεί να υποβάλλονται σε επεξεργασία εκτός του Ευρωπαϊκού Οικονομικού Χώρου, μεταξύ άλλων στις Ηνωμένες Πολιτείες. Στην [πολιτική απορρήτου](${cloudflarePrivacy}) της, η Cloudflare αναφέρει ότι για διαβιβάσεις από τον ΕΟΧ προς τις Ηνωμένες Πολιτείες βασίζεται στην πιστοποίησή της στο Πλαίσιο Προστασίας Δεδομένων ΕΕ-ΗΠΑ και, αν η πιστοποίηση αυτή πάψει να ισχύει, σε τυποποιημένες συμβατικές ρήτρες.` },
        ],
      },
      {
        id: 'retention',
        heading: 'Για πόσο διάστημα τηρούμε τα δεδομένα',
        blocks: [
          {
            ul: [
              '**Μηνύματα που δεν οδηγούν σε συνεργασία** (μαζί με τα αιτήματα προσφοράς): 12 μήνες από την τελευταία μας επικοινωνία. Μετά τα διαγράφουμε ή τα ανωνυμοποιούμε, εκτός αν συγκεκριμένη νομική υποχρέωση ή δικαιολογημένη ανάγκη, όπως μια εκκρεμής διαφορά, απαιτεί να τα κρατήσουμε περισσότερο.',
              '**Πελάτες:** συμβάσεις, τιμολόγια, λογιστικά αρχεία και η σχετική αλληλογραφία τηρούνται για όσο διαρκεί η συνεργασία και στη συνέχεια για όσο απαιτεί η ισχύουσα φορολογική και εμπορική νομοθεσία. Τα διαστήματα αυτά ορίζονται από τον νόμο και μπορεί να ξεπερνούν τους 12 μήνες.',
              '**Τεχνικά δεδομένα επισκέψεων:** δεν λειτουργούμε δικό μας διακομιστή ιστού και δεν τηρούμε δικά μας αρχεία καταγραφής επισκεπτών. Η Cloudflare επεξεργάζεται τα δεδομένα αιτημάτων σύμφωνα με τις δικές της πρακτικές τήρησης, όπως τις περιγράφει στην πολιτική απορρήτου της.',
            ],
          },
          { p: 'Τα ίδια διαστήματα ισχύουν και για τα αντίγραφα των μηνυμάτων που κρατά ο υπολογιστής μας.' },
        ],
      },
      {
        id: 'rights',
        heading: 'Τα δικαιώματά σας',
        blocks: [
          { p: 'Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (ΓΚΠΔ) έχετε δικαίωμα:' },
          {
            ul: [
              'πρόσβασης στα προσωπικά σας δεδομένα που τηρούμε και λήψης αντιγράφου τους·',
              'διόρθωσης ανακριβών δεδομένων και συμπλήρωσης ελλιπών·',
              'διαγραφής των δεδομένων σας, όπου το επιτρέπει ο νόμος·',
              'περιορισμού της επεξεργασίας σε ορισμένες περιπτώσεις·',
              'εναντίωσης σε επεξεργασία που βασίζεται στο έννομο συμφέρον μας·',
              'λήψης των δεδομένων που μας δώσατε σε δομημένη και κοινώς χρησιμοποιούμενη μορφή, όταν η επεξεργασία βασίζεται σε σύμβαση.',
            ],
          },
          { p: `Για να ασκήσετε ένα δικαίωμα, γράψτε στο ${mail}. Μπορεί να ζητήσουμε στοιχεία για να επιβεβαιώσουμε την ταυτότητά σας. Απαντάμε μέσα σε έναν μήνα από τη λήψη του αιτήματος· αν το αίτημα είναι σύνθετο, η προθεσμία μπορεί να παραταθεί έως δύο ακόμη μήνες και θα σας ενημερώσουμε σχετικά. Η άσκηση των δικαιωμάτων σας είναι δωρεάν.` },
        ],
      },
      {
        id: 'complaints',
        heading: 'Καταγγελίες',
        blocks: [
          { p: 'Αν πιστεύετε ότι δεν χειριστήκαμε σωστά τα προσωπικά σας δεδομένα, επικοινωνήστε πρώτα μαζί μας, ώστε να προσπαθήσουμε να λύσουμε το ζήτημα. Έχετε επίσης δικαίωμα να υποβάλετε καταγγελία σε εποπτική αρχή. Στην Ελλάδα αρμόδια είναι η Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα:' },
          { address: ['Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα', 'Λ. Κηφισίας 1-3, 115 23 Αθήνα'] },
          { p: `Ιστότοπος: [www.dpa.gr](${dpa}). Καταγγελίες: [υποβολή καταγγελίας στην Αρχή](${dpaComplaint}). Μπορείτε επίσης να απευθυνθείτε στην εποπτική αρχή της χώρας της ΕΕ όπου ζείτε ή εργάζεστε.` },
        ],
      },
      {
        id: 'changes',
        heading: 'Αλλαγές στην πολιτική',
        blocks: [
          { p: 'Ενημερώνουμε την πολιτική όταν αλλάζει ο τρόπος με τον οποίο επεξεργαζόμαστε προσωπικά δεδομένα, για παράδειγμα αν προσθέσουμε φόρμα επικοινωνίας ή εργαλείο στατιστικών. Η ημερομηνία στην αρχή δείχνει την τρέχουσα έκδοση.' },
        ],
      },
    ],
  },
  cookies: {
    heading: 'Πολιτική Cookies',
    lead: 'Η TechPi δεν χρησιμοποιεί cookies για στατιστικά, διαφήμιση ή παρακολούθηση. Εδώ εξηγούμε τα cookies ασφαλείας που μπορεί να ορίσει ο πάροχος φιλοξενίας μας και πώς ελέγχετε τα cookies.',
    updated: UPDATED,
    updatedLabel: 'Τελευταία ενημέρωση',
    updatedText: '13 Οκτωβρίου 2026',
    contentsLabel: 'Σε αυτή τη σελίδα',
    sections: [
      {
        id: 'cookies',
        heading: 'Τι είναι τα cookies',
        blocks: [
          { p: 'Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύει ένας ιστότοπος στο πρόγραμμα περιήγησής σας. Παρόμοιες τεχνολογίες, όπως η τοπική αποθήκευση (local storage), κρατούν πληροφορίες στη συσκευή σας με άλλους τρόπους. Σε αυτή την πολιτική, ο όρος «cookies» καλύπτει και τα δύο.' },
        ],
      },
      {
        id: 'our-use',
        heading: 'Cookies που χρησιμοποιεί η TechPi',
        blocks: [
          { p: 'Το techpi.eu δεν ορίζει δικά του cookies και δεν αποθηκεύει πληροφορίες στη συσκευή σας μέσω τοπικής αποθήκευσης ή αποθήκευσης συνεδρίας.' },
          {
            ul: [
              'Χωρίς στατιστικά: δεν χρησιμοποιούμε το Google Analytics ή άλλη υπηρεσία στατιστικών.',
              'Χωρίς διαφήμιση ή παρακολούθηση: χωρίς Meta Pixel, χωρίς διαφημιστικά δίκτυα, χωρίς παρακολούθηση ή δημιουργία προφίλ.',
              'Χωρίς γραμματοσειρές, scripts ή ενσωματωμένο περιεχόμενο από άλλες εταιρείες.',
            ],
          },
          { p: 'Σκοπεύουμε να χρησιμοποιήσουμε το Google Search Console για να βλέπουμε πώς εμφανίζεται ο ιστότοπος στην Αναζήτηση Google. Ρυθμίζεται μέσω των ρυθμίσεων του τομέα μας και όχι με κώδικα σε αυτόν τον ιστότοπο, επομένως δεν προσθέτει script ή cookie εδώ.' },
        ],
      },
      {
        id: 'security',
        heading: 'Cookies ασφαλείας του παρόχου φιλοξενίας',
        blocks: [
          { p: 'Το techpi.eu παρέχεται και προστατεύεται από την Cloudflare. Για να παραμένει ο ιστότοπος διαθέσιμος και να προστατεύεται από αυτοματοποιημένες επιθέσεις, η Cloudflare ελέγχει τα εισερχόμενα αιτήματα. Σε ορισμένες περιπτώσεις, για παράδειγμα όταν ένα αίτημα φαίνεται ασυνήθιστο και εμφανίζεται έλεγχος ασφαλείας, η Cloudflare μπορεί να ορίσει ένα cookie στο πρόγραμμα περιήγησής σας, όπως το `cf_clearance`, το οποίο καταγράφει ότι ο έλεγχος ολοκληρώθηκε, ώστε να μην επαναλαμβάνεται.' },
          { p: 'Τα cookies αυτά δεν ορίζονται σε κάθε επίσκεψη. Χρησιμοποιούνται μόνο για λόγους ασφάλειας, είναι απολύτως απαραίτητα για την ασφαλή παροχή του ιστότοπου και δεν χρησιμοποιούνται ούτε από εμάς ούτε από την Cloudflare για στατιστικά ή διαφήμιση. Τα απολύτως απαραίτητα cookies δεν απαιτούν συγκατάθεση σύμφωνα με τους κανόνες για την ιδιωτικότητα στις ηλεκτρονικές επικοινωνίες (Οδηγία 2002/58/ΕΚ και ν. 3471/2006).' },
          { p: `Η Cloudflare περιγράφει τα cookies που μπορούν να ορίσουν οι υπηρεσίες της στην [τεκμηρίωσή της για τα cookies](${cloudflareCookies}) (στα αγγλικά). Η Cloudflare επεξεργάζεται επίσης τα δεδομένα αιτημάτων που περιγράφονται στην [Πολιτική Απορρήτου](${pathFor('privacy', 'el')}) μας.` },
        ],
      },
      {
        id: 'banner',
        heading: 'Γιατί δεν εμφανίζεται μήνυμα για cookies',
        blocks: [
          { p: 'Μήνυμα συγκατάθεσης χρειάζεται για cookies που δεν είναι απολύτως απαραίτητα, όπως τα cookies στατιστικών ή διαφήμισης. Το techpi.eu δεν χρησιμοποιεί τέτοια cookies, γι\' αυτό δεν εμφανίζει τέτοιο μήνυμα.' },
        ],
      },
      {
        id: 'control',
        heading: 'Πώς ελέγχετε τα cookies',
        blocks: [
          { p: 'Μπορείτε να δείτε, να αποκλείσετε και να διαγράψετε cookies από τις ρυθμίσεις του προγράμματος περιήγησής σας οποιαδήποτε στιγμή. Αν αποκλείσετε τα απολύτως απαραίτητα cookies ασφαλείας, ένας έλεγχος ασφαλείας μπορεί να μην ολοκληρωθεί και ορισμένα αιτήματα μπορεί να απορριφθούν.' },
        ],
      },
      {
        id: 'other-sites',
        heading: 'Σύνδεσμοι προς άλλους ιστότοπους',
        blocks: [
          { p: 'Οι μελέτες περίπτωσης παραπέμπουν στους ιστότοπους των πελατών μας. Αυτοί, όπως και κάθε άλλος ιστότοπος στον οποίο φτάνετε μέσω συνδέσμου, μπορεί να χρησιμοποιούν δικά τους cookies σύμφωνα με τις δικές τους πολιτικές. Οι σύνδεσμοι email και τηλεφώνου ανοίγουν την αντίστοιχη εφαρμογή της συσκευής σας.' },
        ],
      },
      {
        id: 'changes',
        heading: 'Μελλοντικές αλλαγές',
        blocks: [
          { p: 'Αν προσθέσουμε ποτέ εργαλείο στατιστικών ή άλλη τεχνολογία που αποθηκεύει πληροφορίες στη συσκευή σας και δεν είναι απολύτως απαραίτητη, θα ενημερώσουμε πρώτα αυτή την πολιτική και, όπου το απαιτεί ο νόμος, θα ζητήσουμε τη συγκατάθεσή σας πριν τη χρησιμοποιήσουμε.' },
        ],
      },
      {
        id: 'who-we-are',
        heading: 'Ποιοι είμαστε',
        blocks: [
          { p: `Το techpi.eu λειτουργεί από τον Ιωάννη Κιμούντρη, ατομική επιχείρηση στην Ξάνθη, με την επωνυμία TechPi. Ερωτήσεις για τα cookies: ${mail}. Πώς χειριζόμαστε τα προσωπικά δεδομένα εξηγείται στην [Πολιτική Απορρήτου](${pathFor('privacy', 'el')}) μας.` },
        ],
      },
    ],
  },
};

export const legalCopy: Record<Locale, Record<'privacy' | 'cookies', LegalPageCopy>> = { en, el };
