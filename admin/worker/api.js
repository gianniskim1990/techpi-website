/**
 * Admin API: read and draft-save the content the admin manages. Nothing here can write to `main` or merge.
 *
 *   GET  /api/session                       who is signed in (the GitHub session) and whether GitHub is configured
 *   GET  /api/<collection>                  the collection's entries on the content base branch, with their open drafts
 *   GET  /api/<collection>/<slug>           one entry: its draft version if a draft is open, otherwise the base version
 *   POST /api/<collection>/<slug>/draft     save the entry as a draft: commit to cms/<collection>/<slug>, open or update one
 *                                           draft pull request into the base branch
 *
 * Collections: `case-studies` (the 18 published case studies), `insights` (the 7 English articles) and `pages` (the 8
 * website pages); `m0-demo` (Task A1 test content) exists only in development with ENABLE_TEST_CONTENT=true. Any other
 * slug is refused. The repository, base branch, draft branch names and file paths are decided here and in config.js,
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
    allowed: study.isConnected, // exactly the 18 published case studies; any other slug is refused
    notAvailable: 'There is no such case study in the admin.',
    slugs: async () => study.CONNECTED_SLUGS,
    summary: (slug, data) => ({ slug, name: data.facts?.name ?? slug, category: data.en?.category ?? '', summary: data.en?.summary ?? '', hasGreek: Boolean(data.el), workGroup: data.facts?.workGroup ?? null, featured: Boolean(data.facts?.featured), order: data.facts?.order ?? null }),
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
    allowed: insight.isInsight, // exactly the 7 existing articles; any other slug is refused
    notAvailable: 'There is no such Insights article in the admin.',
    slugs: async () => insight.INSIGHT_SLUGS,
    summary: (slug, data) => ({ slug, title: data.en?.title ?? slug, category: data.en?.category ?? '', published: data.facts?.published ?? null, publishedText: data.facts?.publishedText ?? '', hasGreek: false }),
    parse: (text, slug) => {
      const doc = parseJson(text);
      return doc && insight.validateDocument(doc, slug).ok ? doc : null;
    },
    check: (body, current) => {
      // The browser sends only { en }. The slug, position, publication date and source always come from the current file.
      const v = insight.validateEditable(body.content, current);
      return v.ok ? { ok: true, text: insight.serializeDocument(current, v.value), title: `Insights: ${v.value.en.title}` } : { ok: false, errors: v.errors };
    },
    prTitle: (slug, title) => `Draft: ${title}`,
    prBody: 'Draft saved in the TechPi Admin. The text of one English Insights article changes; its address, publication date, source and section structure are locked. Not published: merging this pull request into the development branch does not change techpi.eu.',
    commit: (slug) => `Draft: update ${slug} article (TechPi Admin)`,
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
    connected: { caseStudies: study.CONNECTED_SLUGS, insights: insight.INSIGHT_SLUGS, pages: page.PAGE_KEYS, testContent: cfg.testContent },
    // Publishing is manual: the owner reviews and merges each draft pull request on GitHub. There is no merge endpoint.
    publishing: 'github',
  });
}

async function listEntries(env, base, col) {
  const slugs = await col.slugs(env, base);
  const prs = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'open', base, per_page: '100' })}`);
  const drafts = new Map((prs.data || []).filter((p) => p.head?.ref?.startsWith(col.branchPrefix) && sameRepo(p)).map((p) => [p.head.ref.slice(col.branchPrefix.length), { number: p.number, url: p.html_url, draft: Boolean(p.draft) }]));
  const entries = [];
  let missing = 0;
  for (const slug of slugs) {
    const file = await readFile(env, col.path(slug), base);
    if (!file) { missing++; continue; }
    const data = col.parse(file.text, slug);
    if (!data) continue;
    entries.push({ ...col.summary(slug, data), draft: drafts.get(slug) ?? null });
  }
  // A base branch without any of the collection's files is a configuration mistake (for example main before the admin
  // content has been merged into it): say so instead of showing an empty list.
  if (slugs.length && missing === slugs.length) return fail(503, `The content files are not on ${base} yet. The admin must not be pointed at a branch before its content has been merged there.`);
  return json(200, { baseBranch: base, entries });
}

async function getEntry(env, base, col, slug) {
  const branch = col.branch(slug);
  const pr = await openDraftPr(env, base, branch);
  const branchSha = await refSha(env, branch);
  const ref = pr && branchSha ? branch : base;
  const file = await readFile(env, col.path(slug), ref);
  if (!file) return fail(404, col.notAvailable);
  const content = col.parse(file.text, slug);
  if (!content) return fail(502, 'This entry’s file is not valid. It was not loaded.');
  // A draft branch that belongs to an open pull request for another base (for example an old development PR) is never
  // reused or reset; the editor is told before anything is typed.
  let elsewhere = null;
  if (!pr && branchSha) {
    const other = (await prsForBranch(env, branch)).find((p) => p.state === 'open');
    if (other) elsewhere = { number: other.number, url: other.html_url, base: other.base?.ref ?? null };
  }
  return json(200, { slug, content, sha: file.sha, source: ref === base ? 'published' : 'draft', baseBranch: base, draft: pr ? { branch, ...pr } : null, elsewhere });
}

async function saveDraft(env, base, col, slug, request) {
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
  const currentDoc = col.parse(current.text, slug);
  if (!currentDoc) return fail(502, 'This entry’s file is not valid, so it cannot be saved over.');

  const checked = col.check(body, currentDoc, slug);
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
    if (parts.length === 1) return request.method === 'GET' ? await listEntries(env, base, col) : fail(405, 'Method not allowed.');
    const slug = parts[1];
    if (!demo.isSlug(slug)) return fail(400, 'Invalid entry name.');
    if (!col.allowed(slug)) return fail(404, col.notAvailable);
    if (parts.length === 2) return request.method === 'GET' ? await getEntry(env, base, col, slug) : fail(405, 'Method not allowed.');
    if (parts.length === 3 && parts[2] === 'draft') return request.method === 'POST' ? await saveDraft(env, base, col, slug, request) : fail(405, 'Method not allowed.');
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
