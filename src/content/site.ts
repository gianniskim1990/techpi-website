/**
 * Confirmed public facts about TechPi, in one place so the pages that show them cannot disagree.
 * Only facts approved for public display belong here. Nothing is inferred.
 *
 * Confirmed 2026-10-07: email, phone, and the town. Not confirmed, so deliberately absent: street address,
 * legal entity name, company registration, VAT, social profiles, office hours. See docs/production/launch-blockers.md.
 */
export const contactFacts = {
  email: 'info@techpi.eu',
  /** The number as it is shown to visitors. */
  phoneDisplay: '+30 697 594 6984',
  /** The same number as a dialable value, for the tel: link. International format, no spaces. */
  phoneDial: '+306975946984',
} as const;
