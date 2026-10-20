/**
 * Admin API (Task A1): read and draft-save the isolated M0 demo collection. Nothing here can write to `main` or merge.
 *
 *   GET  /api/session                 who is signed in (from Cloudflare Access) and whether GitHub is configured
 *   GET  /api/m0-demo                 the collection's entries on the content base branch, with their open drafts
 *   GET  /api/m0-demo/<slug>          one entry: its draft version if a draft is open, otherwise the base version
 *   POST /api/m0-demo/<slug>/draft    save the entry as a draft: commit to cms/m0-demo/<slug>, open or update one
 *                                     draft pull request into the base branch
 *
 * The repository, branch names and file paths are decided here, never taken from the request. Saves are checked
 * against the version the editor loaded (the file's Git blob SHA), so a stale or conflicting edit is refused instead of
 * overwriting newer work. Commit messages and pull requests carry no personal data.
 */
import { REPO, GitHubError, githubConfig, repoRequest } from './github.js';
import { COLLECTION, entryPath, draftBranch, isSlug, validateEntry, serializeEntry } from '../shared/m0-content.js';

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const fail = (status, message, extra = {}) => json(status, { error: { message, ...extra } });
const MAX_BODY = 64 * 1024;

/** The branch drafts are based on and pull requests target. Never `main` in Task A1. */
export function baseBranch(env) {
  const b = String(env.CONTENT_BASE_BRANCH ?? '').trim() || 'feat/techpi-admin-m0';
  if (b === 'main' || b.startsWith(COLLECTION.branchPrefix.split('/')[0] + '/') || !/^[A-Za-z0-9._/-]{1,100}$/.test(b) || b.includes('..')) return null;
  return b;
}

const b64encode = (text) => { const bytes = new TextEncoder().encode(text); let s = ''; for (const x of bytes) s += String.fromCharCode(x); return btoa(s); };
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(String(b64).replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
const qs = (o) => new URLSearchParams(o).toString();

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
  const pr = (r.data || []).find((p) => p.head?.ref === branch && p.base?.ref === base && p.head?.repo?.full_name === `${REPO.owner}/${REPO.name}`);
  return pr ? { number: pr.number, url: pr.html_url, draft: Boolean(pr.draft) } : null;
}
const parseEntry = (text) => { try { return JSON.parse(text); } catch { return null; } };

async function session(env, identity) {
  const cfg = githubConfig(env);
  const base = baseBranch(env);
  return json(200, {
    email: identity.email,
    repository: `${REPO.owner}/${REPO.name}`,
    baseBranch: base,
    github: { configured: cfg.configured && Boolean(base), missing: [...cfg.missing, ...(base ? [] : ['CONTENT_BASE_BRANCH'])] },
    publishing: false,
  });
}

async function listEntries(env, base) {
  const dir = await repoRequest(env, 'GET', `/contents/${COLLECTION.folder}?${qs({ ref: base })}`, { expect: [404] });
  const slugs = dir.status === 404 ? [] : (dir.data || []).filter((d) => d.type === 'dir' && isSlug(d.name)).map((d) => d.name);
  const prs = await repoRequest(env, 'GET', `/pulls?${qs({ state: 'open', base, per_page: '100' })}`);
  const drafts = new Map((prs.data || []).filter((p) => p.head?.ref?.startsWith(COLLECTION.branchPrefix) && p.head?.repo?.full_name === `${REPO.owner}/${REPO.name}`).map((p) => [p.head.ref.slice(COLLECTION.branchPrefix.length), { number: p.number, url: p.html_url, draft: Boolean(p.draft) }]));
  const entries = [];
  for (const slug of slugs) {
    const file = await readFile(env, entryPath(slug), base);
    const data = file && parseEntry(file.text);
    if (!data) continue;
    entries.push({ slug, title: data.en?.title ?? slug, summary: data.en?.summary ?? '', hasGreek: Boolean(data.el), draft: drafts.get(slug) ?? null });
  }
  return json(200, { baseBranch: base, entries });
}

async function getEntry(env, base, slug) {
  const branch = draftBranch(slug);
  const pr = await openDraftPr(env, base, branch);
  const branchExists = pr ? Boolean(await refSha(env, branch)) : false;
  const ref = pr && branchExists ? branch : base;
  const file = await readFile(env, entryPath(slug), ref);
  if (!file) return fail(404, 'This entry does not exist.');
  const content = parseEntry(file.text);
  if (!content) return fail(502, 'This entry’s file is not valid JSON.');
  return json(200, { slug, content, sha: file.sha, source: ref === base ? 'published' : 'draft', baseBranch: base, draft: pr ? { branch, ...pr } : null });
}

async function saveDraft(env, base, slug, request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, 'The entry is too large.');
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, 'The request is not valid JSON.'); }
  const expectedSha = typeof body?.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null;
  if (!expectedSha) return fail(400, 'The version you edited is missing. Reload the entry and try again.');
  const check = validateEntry(body.content);
  if (!check.ok) return fail(422, 'Some fields need attention.', { fields: check.errors });
  const text = serializeEntry(check.value);
  const branch = draftBranch(slug);
  const path = entryPath(slug);

  const pr = await openDraftPr(env, base, branch);
  let branchSha = await refSha(env, branch);
  let current;
  if (pr && branchSha) {
    current = await readFile(env, path, branch);
  } else {
    // No open draft: the edit starts from the base version. A leftover branch (from a closed draft) starts over.
    current = await readFile(env, path, base);
    if (current && current.sha === expectedSha && text === current.text) {
      return json(200, { slug, sha: current.sha, changed: false, commit: null, baseBranch: base, draft: null });
    }
    if (current && current.sha === expectedSha) {
      const baseSha = await refSha(env, base);
      if (!baseSha) return fail(503, 'The content base branch does not exist.');
      if (branchSha) await repoRequest(env, 'PATCH', `/git/refs/heads/${branch}`, { body: { sha: baseSha, force: true } });
      else await repoRequest(env, 'POST', '/git/refs', { body: { ref: `refs/heads/${branch}`, sha: baseSha } });
      branchSha = baseSha;
    }
  }
  if (!current) return fail(404, 'This entry does not exist.');
  if (current.sha !== expectedSha) return fail(409, 'This entry changed since you opened it. Reload to see the latest version, then make your change again.', { conflict: true });

  let newSha = current.sha;
  let commit = null;
  if (text !== current.text) {
    const put = await repoRequest(env, 'PUT', `/contents/${path}`, {
      body: { message: `Draft: update ${slug} (TechPi Admin)`, content: b64encode(text), sha: current.sha, branch },
      expect: [409],
    });
    if (put.status === 409) return fail(409, 'This entry changed since you opened it. Reload to see the latest version, then make your change again.', { conflict: true });
    newSha = put.data?.content?.sha ?? newSha;
    commit = put.data?.commit ? { sha: put.data.commit.sha, url: put.data.commit.html_url } : null;
  }

  let draft = pr;
  if (!draft && commit) {
    const created = await repoRequest(env, 'POST', '/pulls', {
      body: {
        title: `Draft: ${check.value.en.title}`.slice(0, 200),
        head: branch,
        base,
        draft: true,
        body: 'Draft saved in the TechPi Admin. Not published: merging this pull request is a separate, deliberate step.\n\nThis repository is public, so this draft is publicly visible on GitHub.',
      },
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
    if (parts[0] !== COLLECTION.name) return fail(404, 'Not found.');
    const base = baseBranch(env);
    if (!base) return fail(503, 'The content base branch is not configured, or is not allowed in this version (never main).');
    if (!githubConfig(env).configured) return fail(503, `The GitHub connection is not configured (${githubConfig(env).missing.join(', ')}).`);
    if (parts.length === 1) return request.method === 'GET' ? await listEntries(env, base) : fail(405, 'Method not allowed.');
    const slug = parts[1];
    if (!isSlug(slug)) return fail(400, 'Invalid entry name.');
    if (parts.length === 2) return request.method === 'GET' ? await getEntry(env, base, slug) : fail(405, 'Method not allowed.');
    if (parts.length === 3 && parts[2] === 'draft') return request.method === 'POST' ? await saveDraft(env, base, slug, request) : fail(405, 'Method not allowed.');
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
