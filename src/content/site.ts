/**
 * Confirmed public facts about TechPi, in one place so the pages that show them cannot disagree.
 * Only facts approved for public display belong here. Nothing is inferred.
 *
 * Confirmed 2026-10-07: email, phone, and the town. Confirmed 2026-10-13 for the legal pages: the operator (below).
 * Not confirmed, so deliberately absent: postal code, social profiles, office hours. VAT and GEMI numbers: see
 * registrationFacts below.
 * See docs/production/launch-blockers.md.
 */
export const contactFacts = {
  email: 'info@techpi.eu',
  /** The number as it is shown to visitors. */
  phoneDisplay: '+30 697 594 6984',
  /** The same number as a dialable value, for the tel: link. International format, no spaces. */
  phoneDial: '+306975946984',
} as const;

/**
 * Who operates TechPi, approved by the owner on 2026-10-13 for public use on the Privacy and Cookies pages and the
 * footer. TechPi is the commercial brand of a Greek sole proprietorship, not a separate company or legal entity.
 * The street address is shown on the Privacy page only.
 */
export const operatorFacts = {
  name: { en: 'Ioannis Kimoundris', el: 'Ιωάννης Κιμούντρης' },
  legalForm: { en: 'Sole proprietorship', el: 'Ατομική επιχείρηση' },
  town: { en: 'Xanthi, Greece', el: 'Ξάνθη, Ελλάδα' },
  address: { en: ['30 Chr. Brokoumi Street', 'Xanthi, Greece'], el: ['Χρ. Μπρωκούμη 30', 'Ξάνθη, Ελλάδα'] },
} as const;

/**
 * The business's registration identifiers, which Greek law requires on the website of a business that is registered
 * in GEMI and subject to VAT, as TechPi is (owner-confirmed 2026-10-13):
 * - the GEMI number: Law 4919/2022, Article 22(3)(d) ("στους διαδικτυακούς τόπους του υπόχρεου");
 * - the trade register and registration number, and the VAT identification number: Presidential Decree 131/2003,
 *   Article 4(1)(d) and (g) (the e-Commerce Directive 2000/31/EC, Article 5).
 *
 * Both identifiers have been supplied and expressly approved by the owner for publication.
 * They appear in the "Who we are" section of the Privacy pages (EN and EL).
 * GEMI number supplied with public registry link: https://publicity.businessportal.gr/company/151838746000
 * Check both values and their presence in the built Privacy pages; do not use example values.
 */
export const registrationFacts: { gemi: string | null; vat: string | null } = {
  gemi: '151838746000',
  vat: '142536715',
};
