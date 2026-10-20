/**
 * Admin API: read and draft-save the content the admin manages. Nothing here can write to `main` or merge.
 *
 *   GET  /api/session                       who is signed in (from Cloudflare Access) and whether GitHub is configured
 *   GET  /api/<collection>                  the collection's entries on the content base branch, with their open drafts
 *   GET  /api/<collection>/<slug>           one entry: its draft version if a draft is open, otherwise the base version
 *   POST /api/<collection>/<slug>/draft     save the entry as a draft: commit to cms/<collection>/<slug>, open or update one
 *                                           draft pull request into the base branch
 *
 * Collections: `m0-demo` (Task A1, dummy content) and `case-studies` (Tasks M1A and M1B: exactly the 18 published case
 * studies; any other slug is refused). The repository, branch names and file paths are decided here, never taken from the request. Saves are
 * checked against the version the editor loaded (the file's Git blob SHA), so a stale or conflicting edit is refused
 * instead of overwriting newer work. Commit messages and pull requests carry no personal data.
 */
import { REPO, GitHubError, githubConfig, repoRequest } from './github.js';
import * as demo from '../shared/m0-content.js';
import * as study from '../shared/case-study-content.js';

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const fail = (status, message, extra = {}) => json(status, { error: { message, ...extra } });
const MAX_BODY = 64 * 1024;
const DEFAULT_BASE = 'feat/techpi-admin-m1b-all-case-studies';
const PUBLIC_NOTE = 'This repository is public, so this draft is publicly visible on GitHub.';

/** The branch drafts are based on and pull requests target. Never `main`, and never a draft branch. */
export function baseBranch(env) {
  const b = String(env.CONTENT_BASE_BRANCH ?? '').trim() || DEFAULT_BASE;
  if (b === 'main' || b.startsWith('cms/') || !/^[A-Za-z0-9._/-]{1,100}$/.test(b) || b.includes('..')) return null;
  return b;
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
    summary: (slug, data) => ({ slug, name: data.facts?.name ?? slug, category: data.en?.category ?? '', summary: data.en?.summary ?? '', hasGreek: Boolean(data.el) }),
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

async function session(env, identity) {
  const cfg = githubConfig(env);
  const base = baseBranch(env);
  return json(200, {
    email: identity.email,
    repository: `${REPO.owner}/${REPO.name}`,
    baseBranch: base,
    github: { configured: cfg.configured && Boolean(base), missing: [...cfg.missing, ...(base ? [] : ['CONTENT_BASE_BRANCH'])] },
    connected: { caseStudies: study.CONNECTED_SLUGS },
    publishing: false,
  });
}

async function listEntries(env, base, col) {
  const slugs = await col.slugs(env, base);
  const prs = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'open', base, per_page: '100' })}`);
  const drafts = new Map((prs.data || []).filter((p) => p.head?.ref?.startsWith(col.branchPrefix) && sameRepo(p)).map((p) => [p.head.ref.slice(col.branchPrefix.length), { number: p.number, url: p.html_url, draft: Boolean(p.draft) }]));
  const entries = [];
  for (const slug of slugs) {
    const file = await readFile(env, col.path(slug), base);
    const data = file && col.parse(file.text, slug);
    if (!data) continue;
    entries.push({ ...col.summary(slug, data), draft: drafts.get(slug) ?? null });
  }
  return json(200, { baseBranch: base, entries });
}

async function getEntry(env, base, col, slug) {
  const branch = col.branch(slug);
  const pr = await openDraftPr(env, base, branch);
  const branchExists = pr ? Boolean(await refSha(env, branch)) : false;
  const ref = pr && branchExists ? branch : base;
  const file = await readFile(env, col.path(slug), ref);
  if (!file) return fail(404, col.notAvailable);
  const content = col.parse(file.text, slug);
  if (!content) return fail(502, 'This entry’s file is not valid. It was not loaded.');
  return json(200, { slug, content, sha: file.sha, source: ref === base ? 'published' : 'draft', baseBranch: base, draft: pr ? { branch, ...pr } : null });
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

  const checked = col.check(body, currentDoc);
  if (!checked.ok) return fail(422, 'Some fields need attention.', { fields: checked.errors });
  const text = checked.text;
  if (text === current.text) {
    return json(200, { slug, sha: current.sha, changed: false, commit: null, baseBranch: base, draft: pr ? { branch, ...pr } : null });
  }

  if (!onDraft) {
    const baseSha = await refSha(env, base);
    if (!baseSha) return fail(503, 'The content base branch does not exist.');
    if (branchSha) await repoRequest(env, 'PATCH', `/git/refs/heads/${branch}`, { body: { sha: baseSha, force: true } });
    else await repoRequest(env, 'POST', '/git/refs', { body: { ref: `refs/heads/${branch}`, sha: baseSha } });
    branchSha = baseSha;
  }

  const put = await repoRequest(env, 'PUT', `/contents/${path}`, {
    body: { message: col.commit(slug), content: b64encode(text), sha: current.sha, branch },
    expect: [409],
  });
  if (put.status === 409) return fail(409, 'This entry changed since you opened it. Reload to see the latest version, then make your change again.', { conflict: true });
  const newSha = put.data?.content?.sha ?? current.sha;
  const commit = put.data?.commit ? { sha: put.data.commit.sha, url: put.data.commit.html_url } : null;

  let draft = pr;
  if (!draft && commit) {
    const created = await repoRequest(env, 'POST', '/pulls', {
      body: { title: col.prTitle(slug, checked.title).slice(0, 200), head: branch, base, draft: true, body: `${col.prBody}\n\n${PUBLIC_NOTE}` },
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
    const col = Object.hasOwn(COLLECTIONS, parts[0]) ? COLLECTIONS[parts[0]] : null;
    if (!col) return fail(404, 'Not found.');
    const base = baseBranch(env);
    if (!base) return fail(503, 'The content base branch is not configured, or is not allowed in this version (never main).');
    if (!githubConfig(env).configured) return fail(503, `The GitHub connection is not configured (${githubConfig(env).missing.join(', ')}).`);
    if (parts.length === 1) return request.method === 'GET' ? await listEntries(env, base, col) : fail(405, 'Method not allowed.');
    const slug = parts[1];
    if (!demo.isSlug(slug)) return fail(400, 'Invalid entry name.');
    if (!col.allowed(slug)) return fail(404, col.notAvailable);
    if (parts.length === 2) return request.method === 'GET' ? await getEntry(env, base, col, slug) : fail(405, 'Method not allowed.');
    if (parts.length === 3 && parts[2] === 'draft') return request.method === 'POST' ? await saveDraft(env, base, col, slug, request) : fail(405, 'Method not allowed.');
    return fail(404, 'Not found.');
  } catch (err) {
    if (err instanceof GitHubError) {
      if (err.detail) console.error(`github error: ${err.detail}`); // method, path and status only; never headers or tokens
      return fail(err.status, err.userMessage);
    }
    console.error('admin api error:', err?.name ?? 'Error');
    return fail(500, 'Something went wrong in the admin. Nothing was saved.');
  }
}
