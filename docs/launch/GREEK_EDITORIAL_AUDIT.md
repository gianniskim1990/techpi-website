# Greek editorial audit (Phase 2F)

Date: **2026-10-18**. Base: `main` at `1ca478b`. Branch `feat/phase-2f-greek-editorial` (Draft PR, not merged).
Scope: all **26 published Greek pages**, read from the built output (`dist/el/**`): visible text, buttons,
navigation, cards, footers, image alt text, accessible labels, `<title>`, meta descriptions and Open Graph text.
Each Greek page was compared with its English counterpart and with the shared project facts (`src/content/projects.ts`).
The 8 English-only Insights pages are out of scope (no Greek version exists).

**Who did this.** This audit was carried out by Claude (an AI model), not by a native-speaking human editor. It does
**not** replace the native-speaker sign-off required by launch blocker 8 / checklist P0-8, which stays open.

Severity: **Critical** (wrong meaning, a false or risky claim, broken UI) · **Important** (clearly unnatural or
ungrammatical Greek, ambiguity, terminology that breaks the approved glossary) · **Polish** (more natural or more
consistent wording, same meaning). "Safe" = can be changed without legal interpretation, owner knowledge, client
approval or new evidence.

## 1. Summary

| | Count |
|---|---|
| Pages audited | **26 / 26** |
| Pages with no finding | 15 |
| Confirmed issues fixed | **33**: 0 Critical, 9 Important, 24 Polish |
| Owner decisions (not changed) | 10 |
| Orthography | 1,654 distinct Greek words checked automatically: no polysyllabic word without an accent; every word with two accents is a correct enclitic form (e.g. «περιήγησής σας», «ταυτότητά μας»). No spelling error was found by reading either |

Pages changed in the build: `/el/`, `/el/work`, `/el/capabilities`, `/el/eu-projects`, `/el/contact`, `/el/work/mavie`,
`/el/work/level-up-education`, `/el/work/itsallaboutxanthi`, `/el/work/local-xanthi`, `/el/work/juliette-coffee-roasters`,
`/el/work/apox-fc`. No English page changed.

## 2. Page-by-page matrix

| # | URL | Assessment | Findings |
|---|---|---|---|
| 1 | `/el/` | Good; one unnatural fragment | G-01, G-02, G-03 |
| 2 | `/el/work` | Good | G-07, G-08, G-09; owner O-1, O-2, O-3 |
| 3 | `/el/capabilities` | Good; one unnatural fragment (shared with the homepage) | G-01, G-04, G-05, G-06 |
| 4 | `/el/eu-projects` | Mostly good; the longest page and the most calques | G-10 to G-24; owner O-4 |
| 5 | `/el/about` | Good | None; owner O-5 |
| 6 | `/el/contact` | Good | G-25 |
| 7 | `/el/privacy` | Good, precise legal Greek | None (not edited: legal text); owner O-7 |
| 8 | `/el/cookies` | Good, precise legal Greek | None (not edited: legal text); owner O-7 |
| 9 | `/el/work/rocketeer` | Good | None |
| 10 | `/el/work/armans` | Good | None |
| 11 | `/el/work/logotherapia-xanthi` | Good | None; rights O-10 |
| 12 | `/el/work/mavie` | Good; one calque | G-26 |
| 13 | `/el/work/iliastech` | Good | None |
| 14 | `/el/work/alexandra-apartment` | Good | None |
| 15 | `/el/work/blackjack-streetwear` | Good | None |
| 16 | `/el/work/saloon` | Good | None; owner O-8 |
| 17 | `/el/work/physio` | Good | None |
| 18 | `/el/work/project4you` | Good | None (its Work-row highlight: G-09) |
| 19 | `/el/work/rantevo` | Good | None |
| 20 | `/el/work/level-up-education-app` | Good | None; owner O-2 |
| 21 | `/el/work/level-up-education` | Good; one noun fragment | G-31 |
| 22 | `/el/work/itsallaboutxanthi` | Glossary break (Latin "digital marketing", "web design") | G-27 |
| 23 | `/el/work/local-xanthi` | Glossary break; one noun fragment | G-28, G-32 |
| 24 | `/el/work/juliette-coffee-roasters` | Glossary break | G-29 |
| 25 | `/el/work/apox-fc` | Glossary break; one noun fragment | G-30, G-33 |
| 26 | `/el/work/emoved` | Good | None |

Shared interface (header, mobile menu, footer, language switch, legal line, "Δείτε το έργο", "Ξεκινήστε ένα έργο",
"Συζητήστε μια αντίστοιχη λύση", the Greek 404): correct and consistent on every page; no finding.

## 3. Confirmed issues, all fixed

| ID | Page(s) | Problematic wording | Corrected wording | Reason | Severity | Safe |
|---|---|---|---|---|---|---|
| G-01 | `/el/`, `/el/capabilities` | «Ώστε οι σωστοί άνθρωποι, και τα συστήματα αναζήτησης και τεχνητής νοημοσύνης που χρησιμοποιούν, να βρίσκουν και να κατανοούν αυτό που έχετε φτιάξει.» | «Για να βρίσκουν και να κατανοούν αυτό που έχετε φτιάξει οι σωστοί άνθρωποι, καθώς και οι μηχανές αναζήτησης και τα συστήματα τεχνητής νοημοσύνης που χρησιμοποιούν.» | A sentence cannot start with «Ώστε» (calque of "So the right people…"); «μηχανές αναζήτησης» is the standard term | Important | Yes |
| G-02 | `/el/` (EU teaser) | «Μακροχρόνια τεχνική υποστήριξη» | «Μακροπρόθεσμη τεχνική υποστήριξη» | "Long-term" support is «μακροπρόθεσμη» | Polish | Yes |
| G-03 | `/el/` (meta) | «…με τεχνητή νοημοσύνη όπου έχει αξία.» | «…όπου προσφέρει αξία.» | More natural collocation | Polish | Yes |
| G-04 | `/el/capabilities` | «Σε έργα» (label before project links) | «Ενδεικτικά έργα» | «Σε έργα» reads as an incomplete phrase | Polish | Yes |
| G-05 | `/el/capabilities` (meta) | «…γύρω από το πρόβλημα που λύνουμε.» | «…γύρω από το πρόβλημα που χρειάζεται λύση.» | The sentence is in the third person («Τι φτιάχνει η TechPi»); «λύνουμε» switched to the first | Polish | Yes |
| G-06 | `/el/capabilities` | «Τέσσερις δυνατότητες, που συνδυάζονται…» | «Τέσσερις δυνατότητες που συνδυάζονται…» | Restrictive relative clause: no comma | Polish | Yes |
| G-07 | `/el/work` | «…παλαιότερες δουλειές της pigiota314.» | «…παλαιότερα έργα της pigiota314.» | Matches the section heading «Παλαιότερα έργα της pigiota314»; more formal | Polish | Yes |
| G-08 | `/el/work` (meta) | «Έργα της TechPi: … δικά μας προϊόντα …» | «… τα δικά της προϊόντα …» | Third person throughout the sentence | Polish | Yes |
| G-09 | `/el/work` (Project4You row) | «Εξατομικευμένες σελίδες» | «Προσαρμοσμένες σελίδες» | Same term as the summary and case study ("custom pages") | Polish | Yes |
| G-10 | `/el/eu-projects` (heading, meta) | «Τεχνολογία για ευρωπαϊκά χρηματοδοτούμενα έργα.»; meta «…για ευρωπαϊκά χρηματοδοτούμενα έργα έρευνας, καινοτομίας και συνεργασίας.» | «Τεχνολογία για έργα με ευρωπαϊκή χρηματοδότηση.»; «…για έργα έρευνας, καινοτομίας και συνεργασίας με ευρωπαϊκή χρηματοδότηση.» | Calque of "EU-funded"; the natural Greek is «με ευρωπαϊκή χρηματοδότηση». (The heading is also the EU Projects Service name in the structured data, which follows automatically) | Important | Yes |
| G-11 | `/el/eu-projects` | «Η ιστοσελίδα ενός ευρωπαϊκού έργου δεν αρκεί να το παρουσιάζει.» | «Δεν αρκεί η ιστοσελίδα ενός ευρωπαϊκού έργου να το παρουσιάζει.» | Ungrammatical subject of «αρκεί» | Important | Yes |
| G-12 | `/el/eu-projects` | «Τι μπορεί να χρειάζεται να υποστηρίζει» | «Τι μπορεί να χρειαστεί να υποστηρίξει» | Natural aspect for a possibility | Polish | Yes |
| G-13 | `/el/eu-projects` | «Μακροχρόνια προβολή», «μακροχρόνιο αντίκτυπο» | «Μακροπρόθεσμη προβολή», «μακροπρόθεσμο αντίκτυπο» | "Long-term" visibility/impact | Polish | Yes |
| G-14 | `/el/eu-projects` | «…μακροχρόνιο αντίκτυπο, και γύρω από τον τρόπο που επικοινωνούν πραγματικά τα έργα…» | «…μακροπρόθεσμο αντίκτυπο, με βάση τον τρόπο που επικοινωνούν πραγματικά τα έργα…» | Dangling «και γύρω από» | Polish | Yes |
| G-15 | `/el/eu-projects` | «…αντί να χωρά κάθε ευρωπαϊκό έργο στο ίδιο πρότυπο.» | «…αντί να στριμώχνει κάθε ευρωπαϊκό έργο στο ίδιο πρότυπο.» | «χωρά» is intransitive and gives the wrong subject; English: "instead of forcing every EU project into the same template" | Important | Yes |
| G-16 | `/el/eu-projects` | «Λειτουργική εικόνα για εταίρους και συντονιστές.» | «Επισκόπηση της λειτουργίας του έργου για εταίρους και συντονιστές.» | «Λειτουργική εικόνα» ("functional picture") does not say "operational view" | Polish | Yes |
| G-17 | `/el/eu-projects` | «…και μέσα στη δική σας σχέση με τον πελάτη.» | «…, στο πλαίσιο της δικής σας σχέσης με τον πελάτη.» | Literal translation | Polish | Yes |
| G-18 | `/el/eu-projects` | «Τεχνική σκέψη για την ιστοσελίδα…» | «Τεχνική προσέγγιση για την ιστοσελίδα…» | «Τεχνική σκέψη» is a calque of "technical thinking" | Polish | Yes |
| G-19 | `/el/eu-projects` | «Ένας αξιόπιστος τεχνικός σύνδεσμος όταν κάτι χρειάζεται προσοχή.» | «Ένα αξιόπιστο σημείο επαφής για τεχνικά θέματα, όταν κάτι χρειάζεται προσοχή.» | "Point of contact" is «σημείο επαφής»; «σύνδεσμος» also means "link" | Polish | Yes |
| G-20 | `/el/eu-projects` | «…όπως έργα στο πλαίσιο προγραμμάτων και δικτύων όπως:» | «…για παράδειγμα έργα στο πλαίσιο προγραμμάτων και δικτύων όπως:» | Repeated «όπως» | Polish | Yes |
| G-21 | `/el/eu-projects` | «Μπορούμε επίσης να υποστηρίξουμε τεχνικά έργα που χρηματοδοτούνται από προγράμματα όπως τα LIFE και Digital Europe.» | «Μπορούμε επίσης να υποστηρίξουμε σε τεχνικό επίπεδο έργα που χρηματοδοτούνται…» | Ambiguous: could read as "technical projects". The English says TechPi can *technically support* such projects; no programme claim changes | Important | Yes |
| G-22 | `/el/eu-projects` | «…τις απαιτήσεις του WCAG 2.2 AA…» | «…τις απαιτήσεις των WCAG 2.2, επίπεδο AA…» | WCAG are guidelines (plural); the level named as such. Meaning unchanged ("with WCAG 2.2 AA requirements in mind") | Polish | Yes |
| G-23 | `/el/eu-projects` | «Για μακρούς κύκλους έργων» | «Για έργα μεγάλης διάρκειας» | Calque of "long project lifecycles" | Polish | Yes |
| G-24 | `/el/eu-projects` | «Σχεδιασμός των αναγκών μιας πρότασης σε ιστοσελίδα και πλατφόρμα» | «…για ιστοσελίδα και πλατφόρμα» | Wrong preposition | Polish | Yes |
| G-25 | `/el/contact` (meta) | «…web συστήματα…» | «…συστήματα web…» | Greek word order for the borrowed modifier | Polish | Yes |
| G-26 | `/el/work/mavie` | «…ισχυρότερη εικόνα αξίας του brand στο διαδίκτυο.» | «…ενισχυμένη αντιληπτή αξία του brand στο διαδίκτυο.» | «εικόνα αξίας» is unclear; the English says "a stronger perceived value of the brand online" | Polish | Yes |
| G-27 | `/el/work/itsallaboutxanthi` | «…υποστήριξη digital marketing.»; «Υποστήριξη σε web design, … ενέργειες digital marketing.» | «…υποστήριξη ψηφιακού μάρκετινγκ.»; «Υποστήριξη σε σχεδιασμό ιστοσελίδων, … ενέργειες ψηφιακού μάρκετινγκ.» | Approved glossary (Phase 2C): «Ψηφιακό μάρκετινγκ», «Σχεδιασμός ιστοσελίδων»; the same page's scope list already used them | Important | Yes |
| G-28 | `/el/work/local-xanthi` | «Καμπάνιες social media και digital marketing…» | «Καμπάνιες social media και ψηφιακού μάρκετινγκ…» | Glossary | Important | Yes |
| G-29 | `/el/work/juliette-coffee-roasters` | «Υποστήριξη digital marketing και social media…» | «Υποστήριξη ψηφιακού μάρκετινγκ και social media…» | Glossary | Important | Yes |
| G-30 | `/el/work/apox-fc` | «…υποστήριξη digital marketing…» | «…υποστήριξη ψηφιακού μάρκετινγκ…» | Glossary | Important | Yes |
| G-31 | `/el/work/level-up-education` | «Η δημιουργία μιας επαγγελματικής παρουσίας…» (Πλαίσιο έργου) | «Στόχος ήταν η δημιουργία μιας επαγγελματικής παρουσίας…» | A noun fragment as the whole section; same treatment as Emoved (Phase 2E) | Polish | Yes |
| G-32 | `/el/work/local-xanthi` | «Η δημιουργία μιας πιο συνεπούς παρουσίας στο διαδίκτυο, με στόχο το τοπικό κοινό.» | «Στόχος ήταν η δημιουργία μιας πιο συνεπούς παρουσίας στο διαδίκτυο, για το τοπικό κοινό.» | Fragment; avoids «στόχος… με στόχο» | Polish | Yes |
| G-33 | `/el/work/apox-fc` | «Η δημιουργία περιεχομένου που…» | «Στόχος ήταν η δημιουργία περιεχομένου που…» | Fragment | Polish | Yes |

No fact, claim, programme reference, client, ownership statement, date, technology or legal text was changed.
Terminology kept by decision: SaaS, SEO, UX/UI, CMS, social media, brand, branding, rebranding, e-shop, web,
WordPress, React, Supabase and other product and technology names; programme names (Horizon Europe, Interreg,
Erasmus+, LIFE, Digital Europe) in their official English form.

## 4. Owner decisions (not changed)

| ID | Page(s) | Wording | Question | Why not changed |
|---|---|---|---|---|
| O-1 | Site-wide | «ιστότοπος» and «ιστοσελίδα» are both used for "website" (e.g. «Ιστότοπος κέντρου θεραπείας», «Εταιρική ιστοσελίδα», «Ιστοσελίδες ευρωπαϊκών έργων») | Choose one term for "website" in categories and headings (recommended: «ιστότοπος» in formal copy, or keep «ιστοσελίδα», which most Greek clients use) | A glossary decision that touches categories, titles and the Work index; both words are correct |
| O-2 | `/el/work`, `/el/work/level-up-education-app` | Level Up Education App under «Δικά μας προϊόντα» («για δική μας χρήση») | Is the application TechPi's own product, or a client's? (existing decision O12) | Ownership needs owner knowledge |
| O-3 | `/el/work` (and `/work`) | «…με επιλεγμένα έργα παρουσιασμένα αναλυτικά.» | Every project now has its own page; keep or reword in both languages | Changes the English copy too |
| O-4 | `/el/eu-projects` (and EN) | «Η TechPi είναι ανεξάρτητη εταιρεία τεχνολογίας…» | TechPi is a sole proprietorship's brand, not a separate company (Privacy: «δεν είναι χωριστή εταιρεία»). Consider «ανεξάρτητη επιχείρηση τεχνολογίας» in both languages | Touches the legal-identity wording and the English disclaimer |
| O-5 | `/el/about` | «Χτισμένο για να λειτουργεί κάθε μέρα.» | An approved principle line with no subject (as in English); keep or make explicit | Approved brand line |
| O-6 | Closing invitation, every page | «Έχετε κάτι που αξίζει να χτιστεί;» | Literal of "worth building"; correct and memorable. Keep, or «να υλοποιηθεί» | Approved brand line |
| O-7 | `/el/privacy`, `/el/cookies` | «…πριν τη χρησιμοποιήσουμε» (formal: «πριν από τη χρήση της»); «Το techpi.eu λειτουργεί από τον Ιωάννη Κιμούντρη…» (passive calque; e.g. «Τον ιστότοπο techpi.eu λειτουργεί ο Ιωάννης Κιμούντρης…») | Optional style edits to legal text | Legal pages are not edited without the owner's approval of the exact wording (L8 is pending) |
| O-8 | `/el/work/saloon` | «…λειτουργίες ανάλογα με το πλάνο» | Keep «πλάνο» (common in SaaS) or «πακέτο συνδρομής» | Product terminology |
| O-9 | `/el/capabilities` | Title «Δυνατότητες — Εφαρμογές, ιστότοποι & AI» | Keep "AI" in the title (short) while running text says «τεχνητή νοημοσύνη» | Title length; both acceptable |
| O-10 | Case studies with screenshots | Client screenshots, Logotherapia imagery, client names and links | Rights and permissions | Not verifiable from the repository (launch blocker 10, checklist P0-9) |

## 5. Testing

Recorded in `TECHPI_LAUNCH_STATUS.md` (Phase 2F) and in the Draft PR.
