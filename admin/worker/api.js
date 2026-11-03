/**
 * Admin API: read and draft-save the content the admin manages. Nothing here can write to `main` or merge.
 *
 *   GET  /api/session                       who is signed in (the GitHub session) and whether GitHub is configured
 *   GET  /api/<collection>                  the collection's entries on the content base branch, with their open drafts
 *   GET  /api/<collection>/<slug>           one entry: its draft version if a draft is open, otherwise the base version
 *   POST /api/<collection>/<slug>/draft     save the entry as a draft: commit to cms/<collection>/<slug>, open or update one
 *                                           draft pull request into the base branch
 *   /api/case-studies/<slug>/images[...]     add, replace, remove and preview the images of a NEW case study (images.js)
 *   POST /api/<collection>                  create a new entry (case studies and articles only, Task M5): the file is written
 *                                           on a new cms/<collection>/<slug> branch and one draft pull request is opened.
 *                                           Nothing is published until that pull request is merged.
 *
 * Collections: `case-studies` and `insights` (whatever is in content/case-studies and content/insights on the base
 * branch, plus new entries that so far exist only in an open draft pull request), `pages` (the 8 website pages);
 * `m0-demo` (Task A1 test content) exists only in development with ENABLE_TEST_CONTENT=true. Entry names must be valid
 * addresses; an entry that does not exist is answered with 404. The repository, base branch, draft branch names and file paths are decided here and in config.js,
 * never taken from the request. The base branch is `main` only in production mode (config.js).
 *
 * Writes (Task M4): every write goes through assertDraftBranch, so only `cms/<collection>/<slug>` branches are ever
 * created, reset or committed to; never `main`, never the base. A draft branch is reused while its draft pull request
 * into the base is open. A leftover branch is reset to the base only when it is exactly the head of a closed pull request
 * (a finished test or draft); an open pull request for another base, or commits no closed pull request accounts for,
 * block the save instead. Saves are checked against the version the editor loaded (the file's Git blob SHA), so a stale
 * or conflicting edit is refused instead of overwriting newer work. There is no publish, merge or delete endpoint:
 * publishing is the owner's review and merge of the pull request on GitHub. Commits and PRs carry no personal data.
 */
import { REPO, GitHubError, githubConfig, repoRequest } from './github.js';
import * as demo from '../shared/m0-content.js';
import * as study from '../shared/case-study-content.js';
import * as insight from '../shared/insight-content.js';
import * as page from '../shared/page-content.js';
import { contentConfig } from './config.js';
import { imageRoutes } from './images.js';

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const fail = (status, message, extra = {}) => json(status, { error: { message, ...extra } });
const MAX_BODY = 64 * 1024;
const PUBLIC_NOTE = 'This repository is public, so this draft is publicly visible on GitHub.';
const REVIEW_NOTE = 'Saving in the admin is not publishing. To publish: review the changes in this pull request, wait for the required checks to pass, mark it ready for review and merge it. The website is rebuilt from the base branch after the merge.';

/** The branch a save may write to: a `cms/<collection>/<slug>` draft branch, never the base and never `main`. */
const DRAFT_BRANCH = /^cms\/(?:case-studies|insights|pages|m0-demo)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
export class WriteRefused extends Error {}
/** Every write goes through this guard: no Worker code path can write to `main` or to the base branch. */
export function assertDraftBranch(branch, base) {
  if (!DRAFT_BRANCH.test(branch) || branch === base || branch === 'main') throw new WriteRefused(`Refused to write to "${branch}".`);
  return branch;
}

/**
 * What differs between collections. `parse` turns a file's text into a document (or null), `check` validates a save
 * against the current document and returns { ok, errors, text }, and `summary` is what the list shows.
 */
const COLLECTIONS = {
  [demo.COLLECTION.name]: {
    folder: demo.COLLECTION.folder,
    branchPrefix: demo.COLLECTION.branchPrefix,
    path: demo.entryPath,
    branch: demo.draftBranch,
    allowed: demo.isSlug,
    notAvailable: 'This entry does not exist.',
    slugs: async (env, base) => {
      const dir = await repoRequest(env, 'GET', `/contents/${demo.COLLECTION.folder}?${qs({ ref: base })}`, { expect: [404] });
      return dir.status === 404 ? [] : (dir.data || []).filter((d) => d.type === 'dir' && demo.isSlug(d.name)).map((d) => d.name);
    },
    summary: (slug, data) => ({ slug, title: data.en?.title ?? slug, summary: data.en?.summary ?? '', hasGreek: Boolean(data.el) }),
    parse: (text) => parseJson(text),
    check: (body) => {
      const v = demo.validateEntry(body.content);
      return v.ok ? { ok: true, text: demo.serializeEntry(v.value), title: v.value.en.title } : { ok: false, errors: v.errors };
    },
    prTitle: (slug, title) => `Draft: ${title}`,
    prBody: 'Draft saved in the TechPi Admin. Not published: merging this pull request is a separate, deliberate step.',
    commit: (slug) => `Draft: update ${slug} (TechPi Admin)`,
  },
  [study.CASE_STUDY.name]: {
    folder: study.CASE_STUDY.folder,
    branchPrefix: study.CASE_STUDY.branchPrefix,
    path: study.entryPath,
    branch: study.draftBranch,
    allowed: study.isSlug, // a valid address; whether the case study exists is decided by its file
    notAvailable: 'There is no such case study in the admin.',
    slugs: (env, base) => dirSlugs(env, base, study.CASE_STUDY.folder, study.isSlug),
    summary: (slug, data) => ({ slug, name: data.facts?.name ?? slug, category: data.en?.category ?? '', summary: data.en?.summary ?? '', hasGreek: Boolean(data.el), workGroup: data.facts?.workGroup ?? null, featured: Boolean(data.facts?.featured), order: data.facts?.order ?? null }),
    // Work-page order.
    sort: (a, b) => (a.order ?? 0) - (b.order ?? 0),
    create: {
      check: (body, ctx) => {
        const v = study.validateNew(body.content, { order: ctx.order, taken: ctx.taken, year: new Date().getUTCFullYear() });
        return v.ok ? { ok: true, slug: v.doc.facts.slug, text: study.serializeDocument(v.doc, v.doc), title: `New case study: ${v.doc.facts.name}` } : { ok: false, errors: v.errors };
      },
      prBody: (slug) => `Draft saved in the TechPi Admin: a new case study. Merging this pull request publishes it at /work/${slug} and /el/work/${slug}, at the end of its group on the Work page. It has no images (the admin cannot upload them yet) and is not featured on the homepage; its facts and sections are locked from now on.`,
      commit: (slug) => `Draft: new case study ${slug} (TechPi Admin)`,
    },
    // The file must be valid and must belong to the slug it is stored under.
    parse: (text, slug) => {
      const doc = parseJson(text);
      return doc && study.validateDocument(doc, slug).ok ? doc : null;
    },
    check: (body, current) => {
      // The browser sends only the editable text. The locked facts and images always come from the current file.
      const v = study.validateEditable(body.content, current);
      return v.ok ? { ok: true, text: study.serializeDocument(current, v.value), title: `${current.facts.name} case study` } : { ok: false, errors: v.errors };
    },
    prTitle: (slug, title) => `Draft: ${title}`,
    prBody: 'Draft saved in the TechPi Admin. The text of one case study changes; its facts, images and sections are locked. Not published: merging this pull request into the development branch does not change techpi.eu.',
    commit: (slug) => `Draft: update ${slug} case study (TechPi Admin)`,
  },
  [insight.INSIGHT.name]: {
    folder: insight.INSIGHT.folder,
    branchPrefix: insight.INSIGHT.branchPrefix,
    path: insight.entryPath,
    branch: insight.draftBranch,
    allowed: insight.isSlug, // a valid address; whether the article exists is decided by its file
    notAvailable: 'There is no such Insights article in the admin.',
    slugs: (env, base) => dirSlugs(env, base, insight.INSIGHT.folder, insight.isSlug),
    summary: (slug, data) => ({ slug, title: data.en?.title ?? slug, category: data.en?.category ?? '', published: data.facts?.published ?? null, publishedText: data.facts?.publishedText ?? '', order: data.facts?.order ?? null, hasGreek: false }),
    // Newest first, as on the site: by date, then position.
    sort: (a, b) => String(b.published).localeCompare(String(a.published)) || (a.order ?? 0) - (b.order ?? 0),
    // A stored file is read even if a related article or a linked page is not on the base branch (so it can be corrected);
    // a save is checked against what is on the base branch (ctx.known).
    parse: (text, slug) => {
      const doc = parseJson(text);
      return doc && insight.validateDocument(doc, slug, insight.ANY_KNOWN).ok ? doc : null;
    },
    check: (body, current, slug, ctx) => {
      // The browser sends only { en }. The slug, position, publication date and source always come from the current file.
      // Existing references may stay; a newly added related article or link must exist on the base branch.
      const v = insight.validateEditable(body.content, current, insight.withReferencesOf(ctx?.known, current));
      return v.ok ? { ok: true, text: insight.serializeDocument(current, v.value), title: `Insights: ${v.value.en.title}` } : { ok: false, errors: v.errors };
    },
    prTitle: (slug, title) => `Draft: ${title}`,
    prBody: 'Draft saved in the TechPi Admin. The text of one English Insights article changes; its address, publication date, source and section structure are locked. Not published: merging this pull request into the development branch does not change techpi.eu.',
    commit: (slug) => `Draft: update ${slug} article (TechPi Admin)`,
    create: {
      check: (body, ctx) => {
        const v = insight.validateNew(body.content, { order: ctx.order, taken: ctx.taken, known: ctx.known, today: new Date().toISOString().slice(0, 10) });
        return v.ok ? { ok: true, slug: v.doc.facts.slug, text: insight.serializeDocument(v.doc, v.doc), title: `New article: ${v.doc.en.title}` } : { ok: false, errors: v.errors };
      },
      prBody: (slug) => `Draft saved in the TechPi Admin: a new English Insights article. Merging this pull request publishes it at /insights/${slug} and lists it on /insights by its publication date. Its address, date and section structure are locked from now on.`,
      commit: (slug) => `Draft: new article ${slug} (TechPi Admin)`,
    },
  },
  [page.PAGE.name]: {
    folder: page.PAGE.folder,
    branchPrefix: page.PAGE.branchPrefix,
    path: page.entryPath,
    branch: page.draftBranch,
    allowed: page.isPage, // exactly the 8 existing pages; any other key is refused
    notAvailable: 'There is no such page in the admin.',
    slugs: async () => page.PAGE_KEYS,
    summary: (key, data) => ({ slug: key, name: page.pageInfo(key)?.name ?? key, kind: data.facts?.kind ?? 'page', paths: data.facts?.paths ?? null, title: data.en?.seo?.title ?? '', hasGreek: Boolean(data.el) }),
    parse: (text, key) => {
      const doc = parseJson(text);
      return doc && page.validateDocument(doc, key).ok ? doc : null;
    },
    check: (body, current, key) => {
      // The browser sends only { en, el }. Facts (URLs, legal version date) always come from the current file.
      const v = page.validateEditable(body.content, current, key);
      return v.ok ? { ok: true, text: page.serializeDocument(current, v.value), title: `${page.pageInfo(key)?.name ?? key} page` } : { ok: false, errors: v.errors };
    },
    prTitle: (key, title) => `Draft: ${title}`,
    prBody: 'Draft saved in the TechPi Admin. The English and Greek copy of one website page changes; its address, structure and facts are locked. Not published: merging this pull request into the development branch does not change techpi.eu.',
    prBodyLegal: 'Draft saved in the TechPi Admin. The English and Greek text of one legal page changes; its section anchors, version date, references to site facts and protected statements are locked. A technically valid change is not a legally approved one: this policy change needs the owner’s review before it is merged. Not published: merging this pull request into the development branch does not change techpi.eu.',
    commit: (key) => `Draft: update ${key} page (TechPi Admin)`,
  },
};

const parseJson = (text) => { try { return JSON.parse(text); } catch { return null; } };
const b64encode = (text) => { const bytes = new TextEncoder().encode(text); let s = ''; for (const x of bytes) s += String.fromCharCode(x); return btoa(s); };
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(String(b64).replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
function qs(o) { return new URLSearchParams(o).toString(); }
const sameRepo = (p) => p.head?.repo?.full_name === `${REPO.owner}/${REPO.name}`;

/** The entry folders of a collection on a branch; null when the collection's folder is not on that branch at all. */
async function dirSlugs(env, ref, folder, valid) {
  const dir = await repoRequest(env, 'GET', `/contents/${folder}?${qs({ ref })}`, { expect: [404] });
  if (dir.status === 404 || !Array.isArray(dir.data)) return null;
  return dir.data.filter((d) => d.type === 'dir' && valid(d.name)).map((d) => d.name);
}
/** The case studies and articles on the base branch: what related articles and links may point to. */
async function knownOnBase(env, base) {
  const [caseStudies, insights] = await Promise.all([
    dirSlugs(env, base, study.CASE_STUDY.folder, study.isSlug),
    dirSlugs(env, base, insight.INSIGHT.folder, insight.isSlug),
  ]);
  return { caseStudies: caseStudies ?? [], insights: insights ?? [] };
}
/** Open draft pull requests of a collection into the base, by entry slug. */
async function openDrafts(env, base, col) {
  const prs = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'open', base, per_page: '100' })}`);
  return new Map((prs.data || []).filter((p) => p.head?.ref?.startsWith(col.branchPrefix) && sameRepo(p)).map((p) => [p.head.ref.slice(col.branchPrefix.length), { number: p.number, url: p.html_url, draft: Boolean(p.draft) }]));
}

async function refSha(env, branch) {
  const r = await repoRequest(env, 'GET', `/git/ref/heads/${branch}`, { expect: [404] });
  return r.status === 404 ? null : r.data?.object?.sha ?? null;
}
async function readFile(env, path, ref) {
  const r = await repoRequest(env, 'GET', `/contents/${path}?${qs({ ref })}`, { expect: [404] });
  if (r.status === 404 || !r.data || Array.isArray(r.data)) return null;
  return { sha: r.data.sha, text: b64decode(r.data.content) };
}
async function openDraftPr(env, base, branch) {
  const r = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'open', head: `${REPO.owner}:${branch}`, base, per_page: '10' })}`);
  const pr = (r.data || []).find((p) => p.head?.ref === branch && p.base?.ref === base && sameRepo(p));
  return pr ? { number: pr.number, url: pr.html_url, draft: Boolean(pr.draft) } : null;
}

/** All pull requests (any state, any base) whose head is this draft branch. */
async function prsForBranch(env, branch) {
  const r = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'all', head: `${REPO.owner}:${branch}`, per_page: '100' })}`);
  return (r.data || []).filter((p) => p.head?.ref === branch && sameRepo(p));
}

async function session(env, identity) {
  const gh = githubConfig(env);
  const cfg = contentConfig(env);
  return json(200, {
    login: identity.login,
    signedInWith: identity.method ?? 'github',
    repository: `${REPO.owner}/${REPO.name}`,
    mode: cfg.mode,
    baseBranch: cfg.base,
    github: { configured: gh.configured && cfg.ok, missing: gh.missing, problems: cfg.problems },
    // Case studies and articles are listed live (GET /api/case-studies, /api/insights): new ones can be created.
    connected: { pages: page.PAGE_KEYS, testContent: cfg.testContent },
    create: ['case-studies', 'insights'],
    // Publishing is manual: the owner reviews and merges each draft pull request on GitHub. There is no merge endpoint.
    publishing: 'github',
  });
}

async function listEntries(env, base, col, ctx) {
  const slugs = await col.slugs(env, base);
  // A base branch without the collection's folder is a configuration mistake (for example main before the admin content
  // has been merged into it): say so instead of showing an empty list.
  if (slugs === null) return fail(503, `The content files are not on ${base} yet. The admin must not be pointed at a branch before its content has been merged there.`);
  const drafts = await openDrafts(env, base, col);
  const entries = [];
  let missing = 0;
  for (const slug of slugs) {
    const file = await readFile(env, col.path(slug), base);
    if (!file) { missing++; continue; }
    const data = col.parse(file.text, slug, ctx);
    if (!data) continue;
    entries.push({ ...col.summary(slug, data), draft: drafts.get(slug) ?? null, isNew: false });
  }
  // A base branch without any of the collection's files is a configuration mistake (for example main before the admin
  // content has been merged into it): say so instead of showing an empty list.
  if (slugs.length && missing === slugs.length) return fail(503, `The content files are not on ${base} yet. The admin must not be pointed at a branch before its content has been merged there.`);
  // New entries: open drafts whose entry is not on the base branch yet, read from their draft branch.
  if (col.create) {
    for (const [slug, draft] of drafts) {
      if (slugs.includes(slug) || !col.allowed(slug)) continue;
      const file = await readFile(env, col.path(slug), col.branch(slug));
      const data = file && col.parse(file.text, slug, ctx);
      if (data) entries.push({ ...col.summary(slug, data), draft, isNew: true });
    }
  }
  if (col.sort) entries.sort(col.sort);
  return json(200, { baseBranch: base, entries });
}

/**
 * Creates a new case study or article: validates it (with the next free position and the addresses already taken),
 * then writes its file on a new cms/<collection>/<slug> branch and opens one draft pull request into the base. Never
 * touches the base branch or main (assertDraftBranch), and never another entry's file.
 */
async function createEntry(env, base, col, request, ctx) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, 'The entry is too large.');
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, 'The request is not valid JSON.'); }

  // What is taken, and the next free position: everything on the base branch and every open draft of this collection.
  const onBase = await col.slugs(env, base);
  if (onBase === null) return fail(503, `The content files are not on ${base} yet. The admin must not be pointed at a branch before its content has been merged there.`);
  const drafts = await openDrafts(env, base, col);
  let order = 0;
  for (const slug of onBase) {
    const file = await readFile(env, col.path(slug), base);
    const doc = file && parseJson(file.text);
    if (Number.isInteger(doc?.facts?.order)) order = Math.max(order, doc.facts.order);
  }
  for (const slug of drafts.keys()) {
    if (onBase.includes(slug) || !col.allowed(slug)) continue;
    const file = await readFile(env, col.path(slug), col.branch(slug));
    const doc = file && parseJson(file.text);
    if (Number.isInteger(doc?.facts?.order)) order = Math.max(order, doc.facts.order);
  }
  const checked = col.create.check(body, { order: order + 1, taken: [...onBase, ...drafts.keys()], known: ctx.known });
  if (!checked.ok) return fail(422, 'Some fields need attention.', { fields: checked.errors });
  const slug = checked.slug;
  const branch = assertDraftBranch(col.branch(slug), base);
  const path = col.path(slug);

  const baseSha = await refSha(env, base);
  if (!baseSha) return fail(503, 'The content base branch does not exist.');
  const branchSha = await refSha(env, branch);
  if (branchSha) {
    // A leftover branch is reused only when it is exactly the head of a closed pull request (an abandoned draft).
    const prs = await prsForBranch(env, branch);
    const open = prs.find((p) => p.state === 'open');
    if (open) return fail(409, `There is already an open draft pull request (#${open.number}) for this address. Open that draft instead, or close it on GitHub. Nothing was saved.`, { blocked: true, pr: { number: open.number, url: open.html_url } });
    if (!prs.some((p) => p.state === 'closed' && p.head?.sha === branchSha)) {
      return fail(409, `The branch ${branch} already holds work that is not part of a closed pull request. It was not overwritten and nothing was saved. Choose another address, or review or delete that branch on GitHub.`, { blocked: true });
    }
    await repoRequest(env, 'PATCH', `/git/refs/heads/${assertDraftBranch(branch, base)}`, { body: { sha: baseSha, force: true } });
  } else {
    await repoRequest(env, 'POST', '/git/refs', { body: { ref: `refs/heads/${assertDraftBranch(branch, base)}`, sha: baseSha } });
  }
  // The file must not exist yet on the new branch (it would mean the entry exists on the base after all).
  if (await readFile(env, path, branch)) return fail(409, 'An entry with this address already exists. Nothing was saved.');

  const put = await repoRequest(env, 'PUT', `/contents/${path}`, {
    body: { message: col.create.commit(slug), content: b64encode(checked.text), branch: assertDraftBranch(branch, base) },
    expect: [409, 422],
  });
  if (put.status !== 200 && put.status !== 201) return fail(409, 'The entry could not be created because something changed at the same time. Reload and try again. Nothing was published.');
  const sha = put.data?.content?.sha ?? null;
  const commit = put.data?.commit ? { sha: put.data.commit.sha, url: put.data.commit.html_url } : null;
  const created = await repoRequest(env, 'POST', '/pulls', {
    body: { title: `Draft: ${checked.title}`.slice(0, 200), head: assertDraftBranch(branch, base), base, draft: true, body: `${col.create.prBody(slug)}\n\n${REVIEW_NOTE}\n\n${PUBLIC_NOTE}` },
    expect: [422],
  });
  const draft = created.status === 422 ? await openDraftPr(env, base, branch) : { number: created.data.number, url: created.data.html_url, draft: Boolean(created.data.draft) };
  return json(201, { slug, sha, changed: true, commit, baseBranch: base, draft: draft ? { branch, ...draft } : null, isNew: true });
}

async function getEntry(env, base, col, slug, ctx) {
  const branch = col.branch(slug);
  const pr = await openDraftPr(env, base, branch);
  const branchSha = await refSha(env, branch);
  const ref = pr && branchSha ? branch : base;
  const file = await readFile(env, col.path(slug), ref);
  if (!file) return fail(404, col.notAvailable);
  const content = col.parse(file.text, slug, ctx);
  if (!content) return fail(502, 'This entry’s file is not valid. It was not loaded.');
  // A new entry exists only on its draft branch until its pull request is merged.
  const isNew = ref !== base && col.create ? !(await readFile(env, col.path(slug), base)) : false;
  // A draft branch that belongs to an open pull request for another base (for example an old development PR) is never
  // reused or reset; the editor is told before anything is typed.
  let elsewhere = null;
  if (!pr && branchSha) {
    const other = (await prsForBranch(env, branch)).find((p) => p.state === 'open');
    if (other) elsewhere = { number: other.number, url: other.html_url, base: other.base?.ref ?? null };
  }
  return json(200, { slug, content, sha: file.sha, source: ref === base ? 'published' : 'draft', baseBranch: base, draft: pr ? { branch, ...pr } : null, elsewhere, isNew });
}

async function saveDraft(env, base, col, slug, request, ctx) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, 'The entry is too large.');
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, 'The request is not valid JSON.'); }
  const expectedSha = typeof body?.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null;
  if (!expectedSha) return fail(400, 'The version you edited is missing. Reload the entry and try again.');
  const branch = col.branch(slug);
  const path = col.path(slug);

  const pr = await openDraftPr(env, base, branch);
  let branchSha = await refSha(env, branch);
  const onDraft = Boolean(pr && branchSha);
  // The version the edit started from: the open draft if there is one, otherwise the base. A leftover branch (from a
  // closed draft) is not a starting point.
  const current = await readFile(env, path, onDraft ? branch : base);
  if (!current) return fail(404, col.notAvailable);
  if (current.sha !== expectedSha) return fail(409, 'This entry changed since you opened it. Reload to see the latest version, then make your change again.', { conflict: true });
  const currentDoc = col.parse(current.text, slug, ctx);
  if (!currentDoc) return fail(502, 'This entry’s file is not valid, so it cannot be saved over.');

  const checked = col.check(body, currentDoc, slug, ctx);
  if (!checked.ok) return fail(422, 'Some fields need attention.', { fields: checked.errors });
  const text = checked.text;
  if (text === current.text) {
    return json(200, { slug, sha: current.sha, changed: false, commit: null, baseBranch: base, draft: pr ? { branch, ...pr } : null });
  }

  assertDraftBranch(branch, base);
  if (!onDraft) {
    const baseSha = await refSha(env, base);
    if (!baseSha) return fail(503, 'The content base branch does not exist.');
    if (branchSha) {
      // A leftover branch is reset only when it is exactly the head of a closed pull request (a finished or abandoned
      // draft). An open pull request for another base, or commits that no closed pull request accounts for, are never
      // overwritten: the save is refused and nothing changes.
      const prs = await prsForBranch(env, branch);
      const open = prs.find((p) => p.state === 'open');
      if (open) return fail(409, `This entry already has an open draft pull request (#${open.number}) for another base branch (${open.base?.ref ?? 'unknown'}). Close or merge it on GitHub first. Nothing was saved.`, { blocked: true, pr: { number: open.number, url: open.html_url } });
      if (!prs.some((p) => p.state === 'closed' && p.head?.sha === branchSha)) {
        return fail(409, `The draft branch ${branch} holds work that is not part of a closed pull request. It was not overwritten and nothing was saved. Review or delete that branch on GitHub, then save again.`, { blocked: true });
      }
      await repoRequest(env, 'PATCH', `/git/refs/heads/${assertDraftBranch(branch, base)}`, { body: { sha: baseSha, force: true } });
    } else {
      await repoRequest(env, 'POST', '/git/refs', { body: { ref: `refs/heads/${assertDraftBranch(branch, base)}`, sha: baseSha } });
    }
    branchSha = baseSha;
  }

  const put = await repoRequest(env, 'PUT', `/contents/${path}`, {
    body: { message: col.commit(slug), content: b64encode(text), sha: current.sha, branch: assertDraftBranch(branch, base) },
    expect: [409],
  });
  if (put.status === 409) return fail(409, 'This entry changed since you opened it. Reload to see the latest version, then make your change again.', { conflict: true });
  const newSha = put.data?.content?.sha ?? current.sha;
  const commit = put.data?.commit ? { sha: put.data.commit.sha, url: put.data.commit.html_url } : null;

  let draft = pr;
  if (!draft && commit) {
    const created = await repoRequest(env, 'POST', '/pulls', {
      body: { title: col.prTitle(slug, checked.title).slice(0, 200), head: assertDraftBranch(branch, base), base, draft: true, body: `${(page.isLegal(slug) && col.prBodyLegal) || col.prBody}\n\n${REVIEW_NOTE}\n\n${PUBLIC_NOTE}` },
      expect: [422],
    });
    draft = created.status === 422 ? await openDraftPr(env, base, branch) : { number: created.data.number, url: created.data.html_url, draft: Boolean(created.data.draft) };
  }
  return json(200, { slug, sha: newSha, changed: Boolean(commit), commit, baseBranch: base, draft: draft ? { branch, ...draft } : null });
}

/** The images of new case studies (images.js, Task M6), with the helpers above. */
const images = imageRoutes({ json, fail, repoRequest, readFile, refSha, openDraftPr, assertDraftBranch, b64encode, qs, collection: COLLECTIONS[study.CASE_STUDY.name] });

/** Routes an authenticated, same-origin API request. */
export async function handleApi(request, env, identity) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, '').split('/').slice(2); // after /api
  try {
    if (parts[0] === 'session' && parts.length === 1) return request.method === 'GET' ? await session(env, identity) : fail(405, 'Method not allowed.');
    const cfg = contentConfig(env);
    const col = Object.hasOwn(COLLECTIONS, parts[0]) ? COLLECTIONS[parts[0]] : null;
    // The M0 test collection exists only in development, and only when explicitly enabled.
    if (!col || (parts[0] === demo.COLLECTION.name && !cfg.testContent)) return fail(404, 'Not found.');
    if (!cfg.ok) return fail(503, `The content branch is not configured: ${cfg.problems.join(' ')}`);
    const base = cfg.base;
    if (!githubConfig(env).configured) return fail(503, `The GitHub connection is not configured (${githubConfig(env).missing.join(', ')}).`);
    // What related articles and links may point to: only needed (and only fetched) for the Insights collection.
    const ctx = parts[0] === insight.INSIGHT.name ? { known: await knownOnBase(env, base) } : {};
    if (parts.length === 1) {
      if (request.method === 'GET') return await listEntries(env, base, col, ctx);
      if (request.method === 'POST' && col.create) return await createEntry(env, base, col, request, ctx);
      return fail(405, 'Method not allowed.');
    }
    const slug = parts[1];
    if (!demo.isSlug(slug)) return fail(400, 'Invalid entry name.');
    if (!col.allowed(slug)) return fail(404, col.notAvailable);
    if (parts[0] === study.CASE_STUDY.name && parts[2] === 'images') {
      if (parts.length === 3) return request.method === 'POST' ? await images.add(env, base, slug, request) : fail(405, 'Method not allowed.');
      if (parts.length === 4 && parts[3] === 'remove' && request.method === 'POST') return await images.remove(env, base, slug, request);
      if (parts.length === 4) return request.method === 'GET' ? await images.get(env, base, slug, parts[3]) : fail(405, 'Method not allowed.');
      return fail(404, 'Not found.');
    }
    if (parts.length === 2) return request.method === 'GET' ? await getEntry(env, base, col, slug, ctx) : fail(405, 'Method not allowed.');
    if (parts.length === 3 && parts[2] === 'draft') return request.method === 'POST' ? await saveDraft(env, base, col, slug, request, ctx) : fail(405, 'Method not allowed.');
    return fail(404, 'Not found.');
  } catch (err) {
    if (err instanceof WriteRefused) {
      console.error('admin api: write refused by the draft-branch guard');
      return fail(403, 'This save would write outside a draft branch, so it was refused. Nothing was saved.');
    }
    if (err instanceof GitHubError) {
      if (err.detail) console.error(`github error: ${err.detail}`); // method, path and status only; never headers or tokens
      return fail(err.status, err.userMessage);
    }
    console.error('admin api error:', err?.name ?? 'Error');
    return fail(500, 'Something went wrong in the admin. Nothing was saved.');
  }
}
