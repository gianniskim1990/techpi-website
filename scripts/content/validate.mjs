// Locale validator for the Work index. Run after a build:  node scripts/content/validate.mjs [--dist <dir>]
//
// The Greek Work page (/el/work) must show its project lists in Greek: the highlights of business solutions and the
// disciplines and capabilities lines of every row. src/content/projects.ts merges the Greek text in toGreek(); a field
// left out there falls back to the English array silently, because the Greek page is built from the same components.
// This check reads the built pages, so it catches any such fallback whatever its cause:
// 1. /work and /el/work have the same rows, the same number of lists and the same number of items per list.
// 2. Every Greek list item and every Greek "label: value" line contains at least one Greek letter.
// 3. No Greek list item or line is identical to its English counterpart (a copied English string).
//
// Brand and technology names (SEO, CMS, Social media) may stay in Latin inside a Greek item; rule 2 checks the whole
// item or line, so they are allowed as long as the rest is Greek. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const i = args.indexOf('--dist');
const dist = i >= 0 ? path.resolve(args[i + 1]) : path.join(root, 'dist');
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').trim();
/** Every project row of a Work page: its name, its list items and its "label: value" lines. */
function rows(file) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  return [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<\/main>)/g)].map((m) => ({
    name: decode(m[1].replace(/<[^>]+>/g, ' ')),
    lists: [...m[2].matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((u) => [...u[1].matchAll(/<li[^>]*>([^<]*)<\/li>/g)].map((x) => decode(x[1]))),
    lines: [...m[2].matchAll(/<p class="caps"[^>]*><span[^>]*>[^<]*<\/span>([^<]*)<\/p>/g)].map((x) => decode(x[1])),
  }));
}
const greek = /[Ͱ-Ͽἀ-῿]/;

const en = rows('work.html');
const el = rows('el/work.html');
check(en.length > 0, 'no project rows found on /work (markup changed? update this validator)');
check(en.length === el.length, `/work has ${en.length} rows, /el/work has ${el.length}`);
let items = 0;
let lines = 0;
for (let r = 0; r < Math.min(en.length, el.length); r++) {
  const a = en[r];
  const b = el[r];
  const where = `/el/work row ${r + 1} (${b.name})`;
  check(a.lists.length === b.lists.length, `${where}: ${b.lists.length} lists, English row has ${a.lists.length}`);
  check(a.lines.length === b.lines.length, `${where}: ${b.lines.length} label lines, English row has ${a.lines.length}`);
  b.lists.forEach((list, l) => {
    check(list.length === (a.lists[l] || []).length, `${where}, list ${l + 1}: ${list.length} items, English has ${(a.lists[l] || []).length}`);
    list.forEach((item, k) => {
      items++;
      check(greek.test(item), `${where}, list ${l + 1}: item not in Greek: "${item}"`);
      check(item !== (a.lists[l] || [])[k], `${where}, list ${l + 1}: item identical to English: "${item}"`);
    });
  });
  b.lines.forEach((line, l) => {
    lines++;
    check(greek.test(line), `${where}: line not in Greek: "${line}"`);
    check(line !== a.lines[l], `${where}: line identical to English: "${line}"`);
  });
}
check(items > 0 && lines > 0, `expected list items and label lines on /el/work, found ${items} and ${lines}`);

if (failures.length) {
  console.log(failures.map((f) => `FAIL ${f}`).join('\n'));
  console.log(`\nContent locale validation: ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(`Content locale validation: ${checks} checks, 0 failures (${el.length} rows, ${items} Greek list items, ${lines} Greek label lines on /el/work).`);
