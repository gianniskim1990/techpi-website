// End-to-end check in Cloudflare's local runtime (workerd via `wrangler dev`), signing in with GitHub through the real
// OAuth redirects against the GitHub mock over HTTP. Local only: nothing is deployed, no real GitHub or identity.
// Checks the sign-in gate for the app, its files and the API; then, as the owner, the whole draft workflow and logout.
// Run: npm run build && node test/access-e2e.mjs        Add --serve to keep the admin case running for a browser check.
import { spawn, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeConfigs } from './make-wrangler-configs.mjs';
import { createMockGitHub, MOCK_OAUTH } from './support/mock-github.mjs';
import { CONNECTED_SLUGS } from '../shared/case-study-content.js';
import { INSIGHT_SLUGS } from '../shared/insight-content.js';
import { PAGE_KEYS } from '../shared/page-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = (p) => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' }) : p.kill('SIGTERM'); } catch {} };
const serve = process.argv.includes('--serve');

const BASE = 'feat/techpi-admin-m4-production-readiness';
const CS_FILE = 'content/case-studies/rocketeer/index.json';
const FILE = 'content/m0-demo/m0-sample-article/index.json';
const read = (rel) => fs.readFileSync(path.join(root, '..', rel), 'utf8').replace(/\r\n/g, '\n');
// The M0 test collection's sample (the dummy file itself is no longer in the repository; Task M4).
const sample = JSON.stringify({ en: { title: 'M0 sample article for the admin proof of concept', summary: 'Dummy content used only to test the TechPi admin.', body: 'Placeholder text for the admin test.' } }, null, 2) + '\n';
const csSample = read(CS_FILE);
const pgFiles = Object.fromEntries(PAGE_KEYS.map((key) => [`content/pages/${key}/index.json`, read(`content/pages/${key}/index.json`)]));
const inFiles = Object.fromEntries(INSIGHT_SLUGS.map((slug) => [`content/insights/${slug}/index.json`, read(`content/insights/${slug}/index.json`)]));
const csFiles = Object.fromEntries(CONNECTED_SLUGS.map((slug) => [`content/case-studies/${slug}/index.json`, read(`content/case-studies/${slug}/index.json`)]));
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { [FILE]: sample, ...csFiles, ...inFiles, ...pgFiles } } });
const MOCK_PORT = 8920;
const mockServer = await gh.listen(MOCK_PORT);
const configs = writeConfigs({ github: { apiBase: `http://127.0.0.1:${MOCK_PORT}`, appId: gh.appId, installationId: gh.installationId, privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }) } });

let failures = 0;
const lines = [];
const check = (name, ok, detail) => { if (!ok) failures++; lines.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`); };

for (const c of serve ? configs.filter((x) => x.name === 'owner') : configs) {
  const proc = spawn(process.execPath, [wrangler, 'dev', '--config', c.file, '--log-level', 'error'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));
  const origin = `http://127.0.0.1:${c.port}`;
  let res = null;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try { res = await fetch(`${origin}/`, { signal: AbortSignal.timeout(3000) }); break; } catch { await sleep(1000); }
  }
  if (!res) { check(`${c.name}: Worker starts`, false, log.slice(-600)); kill(proc); continue; }
  if (serve) { console.log(`Admin: ${origin}/ (Sign in with GitHub signs in at the mock as ${MOCK_OAUTH.user.login})  mock GitHub on :${MOCK_PORT}. Ctrl+C to stop.`); await new Promise(() => {}); }

  // Sign in through the redirects, carrying the cookies by hand (as a browser would).
  let cookie = '';
  if (c.signIn) {
    gh.state.oauthUser = c.signIn.as === 'owner' ? { ...MOCK_OAUTH.user } : { id: 7654321, login: 'someone-else' };
    const jar = (r) => r.headers.getSetCookie().map((x) => x.split(';')[0]).filter((x) => !x.endsWith('='));
    const login = await fetch(`${origin}/auth/login`, { redirect: 'manual' });
    if (c.signIn.expect === 503) check(`${c.name}: sign-in refused -> ${login.status}`, login.status === 503 && login.headers.getSetCookie().length === 0);
    else {
      const authorize = new URL(login.headers.get('location'));
      check(`${c.name}: /auth/login redirects to GitHub with PKCE S256`, login.status === 303 && authorize.searchParams.get('code_challenge_method') === 'S256' && authorize.searchParams.get('redirect_uri') === `${origin}/auth/callback`);
      const atGitHub = await fetch(authorize, { redirect: 'manual' });
      const back = await fetch(atGitHub.headers.get('location'), { redirect: 'manual', headers: { Cookie: jar(login).join('; ') } });
      const got = jar(back);
      check(`${c.name}: callback -> ${back.status}`, back.status === c.signIn.expect && (c.signIn.expect === 303 ? got.some((x) => x.startsWith('__Host-techpi_session=')) : got.length === 0));
      cookie = got.join('; ');
    }
  }
  if (cookie) res = await fetch(`${origin}/`, { headers: { Cookie: cookie } });
  const body = await res.text();
  check(`${c.name}: GET / -> ${res.status}`, res.status === c.expect && (c.expect === 200 ? /<html/i.test(body) : !/type="module"/.test(body)), `want ${c.expect}, x-robots=${res.headers.get('x-robots-tag')}`);
  const asset = await fetch(`${origin}/techpi-symbol.png`, { headers: { Cookie: cookie } }).catch(() => null);
  check(`${c.name}: static file gated -> ${asset?.status}`, asset?.status === c.expect);
  const api = { 'X-TechPi-Admin': '1', Cookie: cookie };
  const s = await fetch(`${origin}/api/session`, { headers: api }).catch(() => null);
  check(`${c.name}: GET /api/session -> ${s?.status}`, s?.status === c.expect);

  if (c.expect === 200) {
    const sess = await s.json();
    check('admin: the session is the GitHub owner', sess.login === MOCK_OAUTH.user.login && sess.signedInWith === 'github' && sess.github.configured === true, JSON.stringify(sess));
    const post = await fetch(`${origin}/`, { method: 'POST', body: 'x', headers: { Cookie: cookie } });
    check(`admin: POST / -> ${post.status}`, post.status === 405);
    const cross = await fetch(`${origin}/api/m0-demo/m0-sample-article/draft`, { method: 'POST', headers: { ...api, Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
    check(`admin: cross-origin save -> ${cross.status}`, cross.status === 403);
    const noHeader = await fetch(`${origin}/api/m0-demo`, { headers: { Cookie: cookie } });
    check(`admin: API without the admin header -> ${noHeader.status}`, noHeader.status === 403);

    const list = await (await fetch(`${origin}/api/m0-demo`, { headers: api })).json();
    check('admin: list reads the demo entry through the Worker', list.entries?.[0]?.slug === 'm0-sample-article', JSON.stringify(list).slice(0, 200));
    const entry = await (await fetch(`${origin}/api/m0-demo/m0-sample-article`, { headers: api })).json();
    const content = structuredClone(entry.content);
    content.en.title = 'M0 sample article, edited end to end';
    const save = async (expectedSha) => fetch(`${origin}/api/m0-demo/m0-sample-article/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, expectedSha }) });
    const r1 = await save(entry.sha);
    const d1 = await r1.json();
    check(`admin: first save -> ${r1.status}, draft PR #${d1.draft?.number}`, r1.status === 200 && d1.draft?.draft === true && d1.draft.branch === 'cms/m0-demo/m0-sample-article');
    content.en.summary = 'Second save, same draft pull request.';
    const r2 = await save(d1.sha);
    const d2 = await r2.json();
    check(`admin: second save updates PR #${d2.draft?.number}`, r2.status === 200 && d2.draft?.number === d1.draft?.number && gh.state.prs.length === 1);
    const stale = await save(entry.sha);
    check(`admin: stale save -> ${stale.status}`, stale.status === 409);
    check('admin: main and the base branch unchanged', gh.fileOn('main', 'README.md') === 'main' && gh.fileOn(BASE, FILE) === sample);
    check('admin: every write went to the draft branch', gh.state.writes.every((w) => w.branch.startsWith('cms/')), `${gh.state.writes.length} writes`);
    // Task M1A: the Rocketeer case study
    const csList = await (await fetch(`${origin}/api/case-studies`, { headers: api })).json();
    check(`admin: case-study list has all 18 in order (${csList.entries?.length})`, JSON.stringify(csList.entries?.map((e) => e.slug)) === JSON.stringify(CONNECTED_SLUGS));
    const other = await fetch(`${origin}/api/case-studies/new-project`, { headers: api });
    check(`admin: a slug outside the 18 is refused -> ${other.status}`, other.status === 404);
    const cs = await (await fetch(`${origin}/api/case-studies/rocketeer`, { headers: api })).json();
    const csEdit = { en: structuredClone(cs.content.en), el: structuredClone(cs.content.el) };
    csEdit.en.summary = 'A custom web application that organises delivery requests, drivers and assignments in one place. Edited end to end.';
    csEdit.el.summary = 'Web εφαρμογή που οργανώνει σε ένα σημείο αιτήματα διανομής, οδηγούς και αναθέσεις. Δοκιμή.';
    const csSave = (content, expectedSha) => fetch(`${origin}/api/case-studies/rocketeer/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, expectedSha }) });
    const c1 = await csSave(csEdit, cs.sha); const cd1 = await c1.json();
    check(`admin: Rocketeer save -> ${c1.status}, draft PR #${cd1.draft?.number} into ${gh.state.prs.at(-1)?.base.ref}`, c1.status === 200 && cd1.draft?.branch === 'cms/case-studies/rocketeer' && gh.state.prs.at(-1)?.base.ref === BASE);
    csEdit.en.category = 'Delivery operations platform (edited)';
    csEdit.el.category = 'Πλατφόρμα διαχείρισης διανομών (δοκιμή)';
    const c2 = await csSave(csEdit, cd1.sha); const cd2 = await c2.json();
    check(`admin: second Rocketeer save updates PR #${cd2.draft?.number}`, c2.status === 200 && cd2.draft?.number === cd1.draft?.number && gh.state.prs.length === 2);
    const cStale = await csSave(csEdit, cs.sha);
    check(`admin: stale Rocketeer save -> ${cStale.status}`, cStale.status === 409);
    const savedDoc = JSON.parse(gh.fileOn('cms/case-studies/rocketeer', CS_FILE));
    const baseDoc = JSON.parse(csSample);
    check('admin: Rocketeer facts and images unchanged by the save', JSON.stringify(savedDoc.facts) === JSON.stringify(baseDoc.facts) && JSON.stringify(savedDoc.images) === JSON.stringify(baseDoc.images));
    // A differently shaped case study gets its own branch and PR, and Rocketeer's draft is not touched.
    const lg = await (await fetch(`${origin}/api/case-studies/logotherapia-xanthi`, { headers: api })).json();
    const lgEdit = { en: structuredClone(lg.content.en), el: structuredClone(lg.content.el) };
    lgEdit.en.coverCaption = 'Edited caption, end to end.';
    lgEdit.el.coverCaption = 'Νέα λεζάντα, δοκιμή.';
    const l1 = await fetch(`${origin}/api/case-studies/logotherapia-xanthi/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: lgEdit, expectedSha: lg.sha }) });
    const ld1 = await l1.json();
    check(`admin: Logotherapia save -> ${l1.status}, its own PR #${ld1.draft?.number}`, l1.status === 200 && ld1.draft?.branch === 'cms/case-studies/logotherapia-xanthi' && ld1.draft.number !== cd1.draft?.number && gh.state.prs.length === 3);
    check('admin: case studies are isolated (each branch has only its own change)', gh.fileOn('cms/case-studies/logotherapia-xanthi', CS_FILE) === csSample && JSON.parse(gh.fileOn('cms/case-studies/rocketeer', 'content/case-studies/logotherapia-xanthi/index.json')).en.coverCaption === JSON.parse(csFiles['content/case-studies/logotherapia-xanthi/index.json']).en.coverCaption);
    // Task M2: Insights articles
    const postDraft = (p, content, expectedSha) => fetch(`${origin}/api/${p}/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, expectedSha }) });
    const inList = await (await fetch(`${origin}/api/insights`, { headers: api })).json();
    check(`admin: Insights list has the 7 articles in order (${inList.entries?.length})`, JSON.stringify(inList.entries?.map((e) => e.slug)) === JSON.stringify(INSIGHT_SLUGS));
    const noArt = await fetch(`${origin}/api/insights/new-article`, { headers: api });
    check(`admin: an unknown article is refused -> ${noArt.status}`, noArt.status === 404);
    const NOTE = 'how-analytics-can-support-dissemination-reporting';
    const art = await (await fetch(`${origin}/api/insights/${NOTE}`, { headers: api })).json();
    const artEdit = { en: structuredClone(art.content.en) };
    artEdit.en.note = artEdit.en.note.replace('[Cookies Policy](/cookies)', '[Cookies Policy](/cookies), end to end');
    const a1 = await postDraft(`insights/${NOTE}`, artEdit, art.sha); const ad1 = await a1.json();
    check(`admin: article save -> ${a1.status}, draft PR #${ad1.draft?.number} on ${ad1.draft?.branch}`, a1.status === 200 && ad1.draft?.branch === `cms/insights/${NOTE}` && gh.state.prs.at(-1)?.base.ref === BASE);
    artEdit.en.title += ' (again)';
    const a2 = await postDraft(`insights/${NOTE}`, artEdit, ad1.sha); const ad2 = await a2.json();
    check(`admin: second article save updates PR #${ad2.draft?.number}`, a2.status === 200 && ad2.draft?.number === ad1.draft?.number);
    const aStale = await postDraft(`insights/${NOTE}`, artEdit, art.sha);
    check(`admin: stale article save -> ${aStale.status}`, aStale.status === 409);
    const evil = structuredClone(artEdit); evil.en.note = 'See [this](https://evil.example).';
    const a3 = await postDraft(`insights/${NOTE}`, evil, ad2.sha);
    check(`admin: an external link is refused -> ${a3.status}`, a3.status === 422);
    const greek = { ...structuredClone(artEdit), el: artEdit.en };
    const a4 = await postDraft(`insights/${NOTE}`, greek, ad2.sha);
    check(`admin: a Greek version is refused -> ${a4.status}`, a4.status === 422);
    check('admin: Insights base files unchanged, and the article draft holds only its own change', Object.entries(inFiles).every(([f, t]) => gh.fileOn(BASE, f) === t) && gh.fileOn(`cms/insights/${NOTE}`, CS_FILE) === csSample);
    // Task M3: website pages
    const pgList = await (await fetch(`${origin}/api/pages`, { headers: api })).json();
    check(`admin: pages list has the 8 pages in order (${pgList.entries?.length})`, JSON.stringify(pgList.entries?.map((e) => e.slug)) === JSON.stringify(PAGE_KEYS));
    const noPage = await fetch(`${origin}/api/pages/new-page`, { headers: api });
    check(`admin: an unknown page is refused -> ${noPage.status}`, noPage.status === 404);
    const pgPost = (key, content, expectedSha) => fetch(`${origin}/api/pages/${key}/draft`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, expectedSha }) });
    const ab = await (await fetch(`${origin}/api/pages/about`, { headers: api })).json();
    const abEdit = { en: structuredClone(ab.content.en), el: structuredClone(ab.content.el) };
    abEdit.en.changeHeading = 'What stayed and what changed';
    const p1 = await pgPost('about', abEdit, ab.sha); const pd1 = await p1.json();
    abEdit.el.changeHeading = 'Τι έμεινε και τι άλλαξε, δοκιμή';
    const p2 = await pgPost('about', abEdit, pd1.sha); const pd2 = await p2.json();
    check(`admin: About saved in English then Greek -> ${p1.status}/${p2.status}, one PR #${pd2.draft?.number}`, p1.status === 200 && p2.status === 200 && pd1.draft?.number === pd2.draft?.number && pd2.draft?.branch === 'cms/pages/about');
    const pStale = await pgPost('about', abEdit, ab.sha);
    check(`admin: stale page save -> ${pStale.status}`, pStale.status === 409);
    const pv = await (await fetch(`${origin}/api/pages/privacy`, { headers: api })).json();
    const pvEdit = { en: structuredClone(pv.content.en), el: structuredClone(pv.content.el) };
    const who = pvEdit.en.sections.findIndex((x) => x.id === 'who-we-are');
    const blk = pvEdit.en.sections[who].blocks.findIndex((x) => x.p?.includes('{{email}}'));
    const literal = structuredClone(pvEdit); literal.en.sections[who].blocks[blk].p = 'Email: info@techpi.eu. Telephone: {{phone}}.';
    const p3 = await pgPost('privacy', literal, pv.sha);
    check(`admin: a typed email in a legal page is refused -> ${p3.status}`, p3.status === 422);
    pvEdit.en.sections[who].blocks[blk].p = 'Telephone: {{phone}}. Email: {{email}}.';
    const p4 = await pgPost('privacy', pvEdit, pv.sha); const pd4 = await p4.json();
    const pr4 = gh.state.prs.find((p) => p.number === pd4.draft?.number);
    check(`admin: Privacy saved with moved references -> ${p4.status}, PR #${pd4.draft?.number} flags owner legal review`, p4.status === 200 && /owner’s review/.test(pr4?.body ?? ''));
    check('admin: page drafts hold only their own change; the base pages are unchanged', Object.entries(pgFiles).every(([f, t]) => gh.fileOn(BASE, f) === t) && gh.fileOn('cms/pages/about', 'content/pages/privacy/index.json') === pgFiles['content/pages/privacy/index.json'] && gh.fileOn('cms/pages/privacy', CS_FILE) === csSample);
    check('admin: main and the base still unchanged after Rocketeer saves', gh.fileOn('main', 'README.md') === 'main' && Object.entries(csFiles).every(([f, t]) => gh.fileOn(BASE, f) === t));
    // Logout ends the session in the browser.
    const out = await fetch(`${origin}/auth/logout`, { method: 'POST', headers: { ...api, Origin: origin, 'Content-Type': 'application/json' }, body: '{}' });
    const cleared = out.headers.getSetCookie();
    check(`admin: logout -> ${out.status}, cookies cleared`, out.status === 200 && cleared.some((x) => x.startsWith('__Host-techpi_session=;') && x.includes('Max-Age=0')));
    const afterOut = await fetch(`${origin}/api/session`, { headers: { 'X-TechPi-Admin': '1' } });
    check(`admin: without the cookie after logout -> ${afterOut.status}`, afterOut.status === 401);
    check('admin: the GitHub user tokens were revoked', [...gh.state.userTokens.values()].every((t) => t.revoked));
    check('admin: Worker log has no credentials', !/ghs_|ghu_|PRIVATE KEY|Bearer |mock-client-secret|test-session-secret/.test(log));
  }
  kill(proc);
  await sleep(1500);
}
mockServer.close();
console.log(lines.join('\n'));
console.log(`\nLocal end-to-end (workerd + GitHub sign-in + mock GitHub): ${failures} failures`);
process.exit(failures ? 1 : 0);
