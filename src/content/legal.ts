import type { Locale } from '../i18n/locales';
import { pathFor } from '../i18n/routes';
import { contactFacts, operatorFacts, registrationFacts } from './site';
import { copyOf, pageDocs } from './pages-content';

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
 * - Search: Google Search Console is the only search tool approved for launch. The techpi.eu Domain property was
 *   verified on 2026-10-16 (owner-confirmed), so the pages say so. They do not say that a sitemap was submitted, that
 *   the site is indexed or that reports exist: none of that is true yet. Set up through DNS: no script or cookie on the
 *   site.
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

/**
 * The text of both policies lives in content/pages/privacy/index.json and content/pages/cookies/index.json since Task
 * M3, edited through the admin. Values that come from site.ts, the routes or the constants above are written there as
 * tokens and resolved here, so a file never holds a stale copy of a fact; whole generated blocks are
 * { dynamic: 'operatorAddress' | 'registration' }. The version date and its displayed text are locked facts of the files.
 */
type FileBlock = { p: string } | { ul: readonly string[] } | { address: readonly string[] } | { dynamic: 'operatorAddress' | 'registration' };
interface LegalFileCopy { heading: string; lead: string; updatedLabel: string; contentsLabel: string; sections: readonly { id: string; heading: string; blocks: readonly FileBlock[] }[] }

const tokens = (locale: Locale): Record<string, string> => ({
  email: mail,
  phone,
  'operator.name': operatorFacts.name[locale],
  'operator.town': operatorFacts.town[locale],
  'path.privacy': pathFor('privacy', locale),
  'path.cookies': pathFor('cookies', locale),
  'url.cloudflarePrivacy': cloudflarePrivacy,
  'url.cloudflareCookies': cloudflareCookies,
  'url.dpa': dpa,
  'url.dpaComplaint': dpaComplaint,
});
const resolve = (text: string, locale: Locale): string =>
  text.replace(/\{\{([a-zA-Z.]+)\}\}/g, (_, name: string) => {
    const value = tokens(locale)[name];
    if (value === undefined) throw new Error(`Unknown legal reference {{${name}}}`);
    return value;
  });
const blocksFrom = (blocks: readonly FileBlock[], locale: Locale): LegalBlock[] =>
  blocks.flatMap((b): LegalBlock[] => {
    if ('p' in b) return [{ p: resolve(b.p, locale) }];
    if ('ul' in b) return [{ ul: b.ul.map((x) => resolve(x, locale)) }];
    if ('address' in b) return [{ address: b.address }];
    if (b.dynamic === 'operatorAddress') return [{ address: [`${operatorFacts.name[locale]} (TechPi)`, ...operatorFacts.address[locale]] }];
    return registration(locale);
  });
const pageFrom = (page: 'privacy' | 'cookies', locale: Locale): LegalPageCopy => {
  const doc = pageDocs[page];
  const c = copyOf<LegalFileCopy>(page, locale);
  return {
    heading: c.heading,
    lead: c.lead,
    updated: doc.facts.updated as string,
    updatedLabel: c.updatedLabel,
    updatedText: (doc.facts.updatedText as { en: string; el: string })[locale],
    contentsLabel: c.contentsLabel,
    sections: c.sections.map((sec) => ({ id: sec.id, heading: sec.heading, blocks: blocksFrom(sec.blocks, locale) })),
  };
};
const en: Record<'privacy' | 'cookies', LegalPageCopy> = { privacy: pageFrom('privacy', 'en'), cookies: pageFrom('cookies', 'en') };
const el: Record<'privacy' | 'cookies', LegalPageCopy> = { privacy: pageFrom('privacy', 'el'), cookies: pageFrom('cookies', 'el') };

export const legalCopy: Record<Locale, Record<'privacy' | 'cookies', LegalPageCopy>> = { en, el };
