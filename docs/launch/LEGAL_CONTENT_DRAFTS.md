# Legal content drafts: Privacy Policy and Cookies Policy (EN / EL)

Status: **superseded by the implemented pages (Phase 2B).** The published text lives in `src/content/legal.ts` and is
rendered at `/privacy`, `/cookies`, `/el/privacy` and `/el/cookies`. The drafts below are kept as the record of how
the text was derived; do not publish them.

What changed from these drafts, from the owner's confirmed decisions of 2026-10-13: controller Ioannis Kimoundris, Greek
sole proprietorship, Χρ. Μπρωκούμη 30, Ξάνθη (L1–L3); retention 12 months for enquiries that do not lead to work
(L4); Outlook Classic over IMAP/SMTP, so no Microsoft processor (L5); Cloudflare Free with Bot Fight Mode off, so
`cf_clearance` is the example of a possible security cookie (L6); no contract or DPA is claimed, transfers are described
as Cloudflare states them (L7); no external legal review, by the owner's decision (L8); Search Console only (L10). No
GEMI, VAT or postal code is published.

Original status: review drafts prepared 2026-10-13 for owner review. Not legal advice.

Note: this repository is public. Do not write private information (personal home address, ID numbers) into this file;
complete the final texts in a private document and add only the approved public wording to the site.

---

## 0. What the drafts are based on (verified 2026-10-13)

| Fact | Evidence | Status |
|---|---|---|
| The website sets **no cookies** | Live responses from `https://techpi.eu` (HTML, assets, 404, sitemap) carry no `Set-Cookie` header; source code has no `document.cookie` | **Verified** |
| The website uses **no local or session storage**, no IndexedDB, no beacons | Source search (`localStorage`, `sessionStorage`, `indexedDB`, `sendBeacon`, `fetch`): none; browser sweep of production confirmed empty storage | **Verified** |
| **No analytics, advertising or tracking** scripts; no third-party requests | Content Security Policy allows only same-origin scripts; production pages are byte-identical to the build; browser sweep: 0 third-party requests | **Verified** |
| **Fonts and images are self-hosted** (no Google Fonts, no CDN) | Security and SEO validators; browser sweep | **Verified** |
| **No forms**: contact is by `mailto:` and `tel:` links only | Source: no `<form>`; Contact page | **Verified** |
| Website hosted on **Cloudflare** (Workers Static Assets), DNS and TLS on Cloudflare | `Server: cloudflare`, `cf-ray`, Cloudflare nameservers | **Verified** |
| Cloudflare does not currently inject analytics (Web Analytics beacon) or email obfuscation | Live HTML identical to the build | **Verified** |
| Cloudflare **may set strictly necessary security cookies** (`__cf_bm`, `cf_clearance`) if bot protection or a challenge is active | Cloudflare documentation; **none observed** in live tests | **Owner to confirm in the dashboard** (Bot Fight Mode / Security settings) |
| Email `info@techpi.eu` hosted on the owner's **Pointer.gr cPanel server** (`mail.techpi.eu`, `mail2.techpi.eu`) | Owner confirmation; MX records verified | **Verified (DNS) + owner** |
| Mail also accessed through **Roundcube** (on the cPanel server) and **Outlook** | Owner confirmation | **Owner to confirm** whether Outlook is a desktop IMAP client only or a Microsoft account that syncs mail through Microsoft's cloud (that would add Microsoft as a processor) |
| Legal entity, address, VAT, registration | Not confirmed (launch blocker 1) | **Missing** |

Processing activities this site actually involves: (1) people writing to `info@techpi.eu` or calling the published
number; (2) technical data processed by Cloudflare to deliver and protect the website (IP address, request data,
security logs); (3) email hosting and delivery by the email provider. Nothing else.

Legacy policies (`pigiota314.eu/privacy`, `/cookies`, `pigiota314.gr/privacy-policy/`) were read only as reference.
They are not reused: the `.eu` cookie text says no analytics is loaded, while that site loads Google Analytics, and it
mentions a contact form TechPi does not have.

---

## 1. Owner inputs required before any publication

| # | Input | Used in |
|---|---|---|
| L1 | Legal name of the controller (company or sole trader name) | Privacy §1, Cookies §1 |
| L2 | Legal form, registered address (business address, not a private home address unless legally required and approved), and, if applicable, GEMI number and VAT number | Privacy §1, footer |
| L3 | Contact for privacy requests (proposed: `info@techpi.eu`) | Privacy §1, §9 |
| L4 | Retention period for enquiry emails that do not lead to work, and for client correspondence (accounting law may require longer periods for contract records) | Privacy §6 |
| L5 | Whether Outlook syncs mail through a Microsoft account (processor list) | Privacy §5 |
| L6 | Cloudflare plan and whether Bot Fight Mode / challenges are enabled (security cookies) | Cookies §2 |
| L7 | Whether Cloudflare's Data Processing Addendum and Pointer's terms have been accepted for this account, and the transfer mechanism Cloudflare relies on (Cloudflare's DPA references the EU-U.S. Data Privacy Framework and Standard Contractual Clauses) | Privacy §7 |
| L8 | Legal review of the proposed legal bases (§4) | Privacy §4 |
| L9 | Effective date and version number | Both |
| L10 | Whether an analytics tool will be added (`ANALYTICS_RECOMMENDATION.md`); if so, both policies change before it goes live | Both |

---

## 2. Privacy Policy — English draft

> **Privacy Policy**
> Last updated: `[OWNER INPUT: date]`
>
> **1. Who we are**
> This website, techpi.eu, is operated by `[OWNER INPUT L1: legal name]`, `[OWNER INPUT L2: legal form, registered
> address, GEMI/VAT if applicable]` ("TechPi", "we"). TechPi is the evolution of the studio previously known as
> pigiota314. For any question about this policy or your personal data, contact us at
> `[OWNER INPUT L3: info@techpi.eu]`.
>
> **2. What this policy covers**
> This policy explains what personal data we process when you visit techpi.eu or contact us by email or telephone.
> It does not cover the websites of our clients or of third parties that we link to; they have their own policies.
>
> **3. What data we process**
> - **When you contact us.** If you email us or call us, we receive the information you choose to share: usually your
>   name, email address or phone number, your organisation and the content of your message.
> - **When you visit the website.** To deliver the website securely, our hosting provider processes technical data
>   such as your IP address, the date and time of the request, the page requested, your browser's user agent and
>   security-related signals. We do not use this data to identify you or to build a profile.
> - **What we do not do.** The website has no forms and no user accounts, sets no cookies, uses no analytics,
>   advertising or tracking tools, and loads no fonts or scripts from third parties.
>
> **4. Why we process it and on what legal basis** `[LEGAL REVIEW L8]`
> - To answer your enquiry and discuss a possible project: steps taken at your request before entering into a contract
>   (Article 6(1)(b) GDPR) or, where no contract is contemplated, our legitimate interest in replying to messages sent
>   to us (Article 6(1)(f) GDPR).
> - To operate, secure and protect the website against abuse: our legitimate interest in providing a secure website
>   (Article 6(1)(f) GDPR).
> - Where we keep records because the law requires it (for example accounting records when we work together):
>   compliance with a legal obligation (Article 6(1)(c) GDPR).
>
> **5. Who processes data on our behalf**
> - **Cloudflare, Inc.** hosts the website and provides its network, security and DNS services. Cloudflare processes
>   technical request data to deliver and protect the website.
> - **Our email hosting provider** (`[OWNER INPUT: Pointer.gr service and company name as in the contract]`) stores
>   and delivers email sent to and from `@techpi.eu` addresses.
> - `[OWNER INPUT L5: include only if applicable — Microsoft, if email is synchronised through a Microsoft account]`
> We do not sell your personal data and we do not share it with third parties for their own marketing.
>
> **6. How long we keep data** `[OWNER INPUT L4]`
> - Enquiries that do not lead to a collaboration: `[period]`.
> - Correspondence and records related to a collaboration: for the duration of the collaboration and afterwards for
>   the period required by tax and commercial law: `[period]`.
> - Technical logs held by our hosting provider: according to the provider's retention schedule `[OWNER INPUT: confirm
>   from the Cloudflare plan]`.
>
> **7. International transfers** `[LEGAL REVIEW L7]`
> Cloudflare operates a global network, and technical request data may be processed outside the European Economic
> Area. Such transfers rely on the safeguards in Cloudflare's Data Processing Addendum `[confirm: EU-U.S. Data Privacy
> Framework and/or Standard Contractual Clauses]`.
>
> **8. Your rights**
> Under the GDPR you have the right to access your data, to have it corrected or erased, to restrict or object to its
> processing and to data portability, where these rights apply. You can exercise them by writing to
> `[OWNER INPUT L3]`. You also have the right to lodge a complaint with the Hellenic Data Protection Authority
> (www.dpa.gr) or the supervisory authority of your country.
>
> **9. Changes to this policy**
> We will update this policy when our processing changes, for example if we add a contact form or an analytics tool.
> The date at the top shows the latest version.

---

## 3. Πολιτική Απορρήτου — Ελληνικό σχέδιο

> **Πολιτική Απορρήτου**
> Τελευταία ενημέρωση: `[OWNER INPUT: ημερομηνία]`
>
> **1. Ποιοι είμαστε**
> Ο ιστότοπος techpi.eu λειτουργεί από `[OWNER INPUT L1: επωνυμία]`, `[OWNER INPUT L2: νομική μορφή, έδρα,
> αριθμός ΓΕΜΗ / ΑΦΜ εφόσον υπάρχουν]` («TechPi», «εμείς»). Η TechPi είναι η εξέλιξη του στούντιο που ήταν γνωστό
> ως pigiota314. Για κάθε ερώτηση σχετικά με την πολιτική αυτή ή τα προσωπικά σας δεδομένα, επικοινωνήστε μαζί μας στο
> `[OWNER INPUT L3: info@techpi.eu]`.
>
> **2. Τι καλύπτει η πολιτική**
> Η πολιτική εξηγεί ποια προσωπικά δεδομένα επεξεργαζόμαστε όταν επισκέπτεστε το techpi.eu ή επικοινωνείτε μαζί μας
> με email ή τηλέφωνο. Δεν καλύπτει τους ιστότοπους πελατών ή τρίτων στους οποίους παραπέμπουμε· αυτοί έχουν δικές
> τους πολιτικές.
>
> **3. Ποια δεδομένα επεξεργαζόμαστε**
> - **Όταν επικοινωνείτε μαζί μας.** Αν μας στείλετε email ή μας τηλεφωνήσετε, λαμβάνουμε όσα στοιχεία επιλέγετε να
>   μας δώσετε: συνήθως ονοματεπώνυμο, διεύθυνση email ή αριθμό τηλεφώνου, τον οργανισμό σας και το περιεχόμενο του
>   μηνύματος.
> - **Όταν επισκέπτεστε τον ιστότοπο.** Για να παρέχεται ο ιστότοπος με ασφάλεια, ο πάροχος φιλοξενίας επεξεργάζεται
>   τεχνικά δεδομένα, όπως τη διεύθυνση IP, την ημερομηνία και ώρα του αιτήματος, τη σελίδα που ζητήθηκε, τον τύπο
>   του προγράμματος περιήγησης και ενδείξεις ασφαλείας. Δεν χρησιμοποιούμε αυτά τα δεδομένα για να σας ταυτοποιήσουμε
>   ή για να δημιουργήσουμε προφίλ.
> - **Τι δεν κάνουμε.** Ο ιστότοπος δεν έχει φόρμες ούτε λογαριασμούς χρηστών, δεν τοποθετεί cookies, δεν χρησιμοποιεί
>   εργαλεία στατιστικών, διαφήμισης ή παρακολούθησης και δεν φορτώνει γραμματοσειρές ή scripts από τρίτους.
>
> **4. Γιατί επεξεργαζόμαστε τα δεδομένα και με ποια νομική βάση** `[LEGAL REVIEW L8]`
> - Για να απαντήσουμε στο αίτημά σας και να συζητήσουμε ένα πιθανό έργο: ενέργειες κατόπιν αιτήματός σας πριν από τη
>   σύναψη σύμβασης (άρθρο 6 παρ. 1 στοιχ. β΄ ΓΚΠΔ) ή, όταν δεν προκύπτει σύμβαση, το έννομο συμφέρον μας να
>   απαντούμε στα μηνύματα που λαμβάνουμε (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).
> - Για τη λειτουργία, την ασφάλεια και την προστασία του ιστότοπου από κατάχρηση: το έννομο συμφέρον μας για έναν
>   ασφαλή ιστότοπο (άρθρο 6 παρ. 1 στοιχ. στ΄ ΓΚΠΔ).
> - Όταν τηρούμε αρχεία επειδή το απαιτεί ο νόμος (π.χ. λογιστικά αρχεία όταν συνεργαζόμαστε): συμμόρφωση με νομική
>   υποχρέωση (άρθρο 6 παρ. 1 στοιχ. γ΄ ΓΚΠΔ).
>
> **5. Ποιοι επεξεργάζονται δεδομένα για λογαριασμό μας**
> - **Cloudflare, Inc.**: φιλοξενεί τον ιστότοπο και παρέχει υπηρεσίες δικτύου, ασφάλειας και DNS. Επεξεργάζεται τεχνικά
>   δεδομένα αιτημάτων για να παρέχει και να προστατεύει τον ιστότοπο.
> - **Ο πάροχος φιλοξενίας email** (`[OWNER INPUT: υπηρεσία Pointer.gr και επωνυμία όπως στη σύμβαση]`): αποθηκεύει και
>   διακινεί τα μηνύματα προς και από διευθύνσεις `@techpi.eu`.
> - `[OWNER INPUT L5: μόνο εφόσον ισχύει — Microsoft, αν το email συγχρονίζεται μέσω λογαριασμού Microsoft]`
> Δεν πουλάμε τα προσωπικά σας δεδομένα και δεν τα μοιραζόμαστε με τρίτους για δικούς τους σκοπούς προώθησης.
>
> **6. Για πόσο χρόνο τηρούμε τα δεδομένα** `[OWNER INPUT L4]`
> - Αιτήματα που δεν οδηγούν σε συνεργασία: `[διάστημα]`.
> - Αλληλογραφία και αρχεία που αφορούν συνεργασία: για τη διάρκεια της συνεργασίας και στη συνέχεια για το διάστημα
>   που απαιτεί η φορολογική και εμπορική νομοθεσία: `[διάστημα]`.
> - Τεχνικά αρχεία καταγραφής του παρόχου φιλοξενίας: σύμφωνα με τους χρόνους τήρησης του παρόχου
>   `[OWNER INPUT: επιβεβαίωση από το πρόγραμμα Cloudflare]`.
>
> **7. Διαβιβάσεις εκτός ΕΟΧ** `[LEGAL REVIEW L7]`
> Η Cloudflare λειτουργεί παγκόσμιο δίκτυο και τεχνικά δεδομένα αιτημάτων μπορεί να υποβάλλονται σε επεξεργασία εκτός
> του Ευρωπαϊκού Οικονομικού Χώρου. Οι διαβιβάσεις αυτές βασίζονται στις εγγυήσεις της Σύμβασης Επεξεργασίας Δεδομένων
> της Cloudflare `[επιβεβαίωση: Πλαίσιο Προστασίας Δεδομένων ΕΕ-ΗΠΑ ή/και Τυποποιημένες Συμβατικές Ρήτρες]`.
>
> **8. Τα δικαιώματά σας**
> Σύμφωνα με τον ΓΚΠΔ έχετε δικαίωμα πρόσβασης στα δεδομένα σας, διόρθωσης ή διαγραφής τους, περιορισμού της
> επεξεργασίας ή εναντίωσης σε αυτήν, καθώς και φορητότητας, όπου εφαρμόζονται. Μπορείτε να τα ασκήσετε γράφοντας στο
> `[OWNER INPUT L3]`. Έχετε επίσης δικαίωμα να υποβάλετε καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού
> Χαρακτήρα (www.dpa.gr) ή στην εποπτική αρχή της χώρας σας.
>
> **9. Αλλαγές στην πολιτική**
> Θα ενημερώνουμε την πολιτική όταν αλλάζει η επεξεργασία, για παράδειγμα αν προσθέσουμε φόρμα επικοινωνίας ή εργαλείο
> στατιστικών. Η ημερομηνία στην αρχή δείχνει την πιο πρόσφατη έκδοση.

---

## 4. Cookies Policy — English draft

> **Cookies Policy**
> Last updated: `[OWNER INPUT: date]`
>
> **1. Summary**
> techpi.eu does not use cookies for analytics, advertising, personalisation or tracking, and it does not store any
> information on your device through local storage or similar technologies. Because of this, the website does not show
> a cookie banner. The website is operated by `[OWNER INPUT L1]`.
>
> **2. Security cookies set by our hosting provider** `[OWNER INPUT L6: keep only if applicable]`
> Our hosting and security provider, Cloudflare, may set strictly necessary cookies (such as `__cf_bm` or
> `cf_clearance`) when it needs to distinguish people from automated traffic or to complete a security check. These
> cookies are used only for security, do not track you across websites, and are exempt from consent because they are
> strictly necessary to provide the website securely. `[If no such feature is enabled: replace with "We do not currently
> use any security cookies."]`
>
> **3. Links to other websites**
> Case studies link to our clients' websites. Those websites may use their own cookies, under their own policies.
>
> **4. Your choices**
> You can delete or block cookies in your browser settings at any time. Blocking strictly necessary security cookies
> may prevent a security check from completing.
>
> **5. Changes**
> If we ever add analytics or another tool that stores information on your device, we will update this policy first
> and, where the law requires it, ask for your consent before the tool is used.
>
> Questions: `[OWNER INPUT L3]`.

---

## 5. Πολιτική Cookies — Ελληνικό σχέδιο

> **Πολιτική Cookies**
> Τελευταία ενημέρωση: `[OWNER INPUT: ημερομηνία]`
>
> **1. Σε συντομία**
> Το techpi.eu δεν χρησιμοποιεί cookies για στατιστικά, διαφήμιση, εξατομίκευση ή παρακολούθηση και δεν αποθηκεύει
> πληροφορίες στη συσκευή σας μέσω τοπικής αποθήκευσης ή παρόμοιων τεχνολογιών. Γι' αυτό ο ιστότοπος δεν εμφανίζει
> μήνυμα συγκατάθεσης για cookies. Ο ιστότοπος λειτουργεί από `[OWNER INPUT L1]`.
>
> **2. Cookies ασφαλείας του παρόχου φιλοξενίας** `[OWNER INPUT L6: μόνο εφόσον ισχύει]`
> Ο πάροχος φιλοξενίας και ασφάλειας, η Cloudflare, μπορεί να τοποθετήσει απολύτως απαραίτητα cookies (όπως `__cf_bm`
> ή `cf_clearance`) όταν χρειάζεται να ξεχωρίσει τους ανθρώπους από την αυτοματοποιημένη κίνηση ή να ολοκληρώσει
> έλεγχο ασφαλείας. Χρησιμοποιούνται μόνο για λόγους ασφάλειας, δεν σας παρακολουθούν σε άλλους ιστότοπους και δεν
> απαιτούν συγκατάθεση, επειδή είναι απολύτως απαραίτητα για την ασφαλή λειτουργία του ιστότοπου. `[Αν δεν είναι
> ενεργή καμία τέτοια λειτουργία: «Δεν χρησιμοποιούμε σήμερα cookies ασφαλείας.»]`
>
> **3. Σύνδεσμοι προς άλλους ιστότοπους**
> Οι μελέτες περίπτωσης παραπέμπουν στους ιστότοπους των πελατών μας, οι οποίοι μπορεί να χρησιμοποιούν δικά τους
> cookies, σύμφωνα με τις δικές τους πολιτικές.
>
> **4. Οι επιλογές σας**
> Μπορείτε να διαγράψετε ή να αποκλείσετε τα cookies από τις ρυθμίσεις του προγράμματος περιήγησης οποιαδήποτε στιγμή.
> Ο αποκλεισμός απολύτως απαραίτητων cookies ασφαλείας μπορεί να εμποδίσει την ολοκλήρωση ενός ελέγχου ασφαλείας.
>
> **5. Αλλαγές**
> Αν προσθέσουμε εργαλείο στατιστικών ή άλλο εργαλείο που αποθηκεύει πληροφορίες στη συσκευή σας, θα ενημερώσουμε
> πρώτα την πολιτική και, όπου το απαιτεί ο νόμος, θα ζητήσουμε τη συγκατάθεσή σας πριν χρησιμοποιηθεί.
>
> Ερωτήσεις: `[OWNER INPUT L3]`.

---

## 6. Publishing notes (for the later implementation phase)

- Pages to add: `/privacy`, `/cookies`, `/el/privacy`, `/el/cookies`, added to the route map, sitemap (48 → 52 URLs),
  hreflang pairs and the footer of every page. The SEO and security validators' expected counts change with them.
- These pages are the destinations for the legacy `/privacy`, `/cookies` and `/privacy-policy/` redirects
  (`migration-audit/REDIRECT_MAPPING.md`, HOLD rows).
- Greek text needs the native-speaker editorial read (launch blocker 8) and the legal review.
- Publish only after every marker above is resolved, and re-verify §0 (no cookies, no storage) on the final build.
