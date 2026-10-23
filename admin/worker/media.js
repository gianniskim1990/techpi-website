/**
 * The media library (Task M8), like the one in WordPress: images are uploaded once, browsed in one place, and used by
 * any new case study or article (images.js, `use`).
 *
 *   GET  /api/media                  every image: the library's, and the images case studies and articles already use
 *   POST /api/media                  upload to the library { data, thumb, title, alt?, caption? }
 *   GET  /api/media/<id>/thumb       a small copy, for the library view (the full image when there is none)
 *   GET  /api/media/<id>/file        the image itself
 *   POST /api/media/<id>             edit a library image's title, default alt text and caption { expectedSha, ... }
 *   POST /api/media/<id>/delete      remove a library image no page uses
 *
 * Every library change is a commit on ONE draft branch, cms/media/library, with one draft pull request into the base
 * (opened with the first change, reused until it is merged or closed). Nothing is published until the owner merges it;
 * a library image is not on the website at all until a page uses it (scripts/media/used-media.mjs). The images of case
 * studies and articles are listed read-only: they are changed through their entry. A library image in use, or one only
 * in an entry's draft, cannot be deleted. Uploads are checked from their bytes exactly like entry images (images.js).
 */
import * as media from '../shared/media-content.js';
import { imageInfo } from '../shared/image-info.js';
import { commitChanges, readImageBody, checkUpload, blobBytes, CONTENT_TYPE } from './images.js';

const IMAGE_FILE = /^src\/assets\/(projects|insights|media)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.(png|jpe?g|webp)$/;
const ENTRY_FILE = /^content\/(case-studies|insights)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/index\.json$/;
const ENTRY = {
  'case-studies': { refs: (doc) => [doc.images?.image, doc.images?.cover, ...(doc.images?.gallery ?? [])], title: (doc, slug) => doc.facts?.name ?? slug, prefix: 'cms/case-studies/' },
  insights: { refs: (doc) => [doc.images?.cover, ...Object.values(doc.images?.sections ?? {})], title: (doc, slug) => doc.en?.title ?? slug, prefix: 'cms/insights/' },
};
const MAX_EDIT = 16 * 1024;
const MAX_UPLOAD = 4_700_000; // an image of 3 MB and its small copy, as base64
const PR_TITLE = 'Draft: media library changes';
const PR_BODY = 'Media library changes saved in the TechPi Admin: images uploaded to the library, their details edited, or removed. A library image is not on the website until a case study or article uses it; merging this pull request keeps these changes in the library.';

const parseJson = (text) => { try { return JSON.parse(text); } catch { return null; } };
const textOf = (bytes) => new TextDecoder().decode(bytes);

/**
 * `h`: helpers from api.js (json, fail, repoRequest, readFile, refSha, openDraftPr, prsForBranch, assertDraftBranch,
 * b64encode, qs, notes).
 */
export function mediaRoutes(h) {
  const BRANCH = media.MEDIA.branch;

  /** Every file on a ref: path -> blob SHA (one request). */
  async function treeOf(env, ref) {
    const r = await h.repoRequest(env, 'GET', `/git/trees/${encodeURIComponent(ref)}?${h.qs({ recursive: '1' })}`);
    if (r.data?.truncated) throw Object.assign(new Error('tree truncated'), { name: 'TreeTruncated' });
    return new Map((r.data?.tree ?? []).filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
  }
  /** The images in a tree, by id: { path, sha, folder, ext }. */
  function imagesIn(tree) {
    const out = new Map();
    for (const [path, sha] of tree) {
      const m = path.match(IMAGE_FILE);
      if (m && !out.has(m[2])) out.set(m[2], { path, sha, folder: m[1], ext: m[3] === 'jpeg' ? 'jpg' : m[3] });
    }
    return out;
  }
  /** The library's open draft: { head, pr } or null. */
  async function pending(env, base) {
    const pr = await h.openDraftPr(env, base, BRANCH);
    const head = pr ? await h.refSha(env, BRANCH) : null;
    return pr && head ? { head, pr } : null;
  }

  /**
   * Which entries use which image: every case study and article on the base branch, and every open draft of one.
   * id -> [{ collection, slug, title, published, draft }]; `sizes`: id -> { width, height } as the entries declare them.
   */
  async function usage(env, base, baseTree) {
    const entries = new Map(); // collection/slug -> { collection, slug, title, published: Set, draft: Set }
    const sizes = new Map();
    const add = (collection, slug, doc, where) => {
      const key = `${collection}/${slug}`;
      const e = entries.get(key) ?? { collection, slug, title: ENTRY[collection].title(doc, slug), published: new Set(), draft: new Set() };
      for (const ref of ENTRY[collection].refs(doc)) {
        if (!ref?.id) continue;
        e[where].add(ref.id);
        if (!sizes.has(ref.id)) sizes.set(ref.id, { width: ref.width, height: ref.height });
      }
      if (where === 'draft') e.title = ENTRY[collection].title(doc, slug);
      entries.set(key, e);
    };
    for (const [path, sha] of baseTree) {
      const m = path.match(ENTRY_FILE);
      if (!m) continue;
      const doc = parseJson(textOf(await blobBytes(h, env, sha)));
      if (doc) add(m[1], m[2], doc, 'published');
    }
    const prs = await h.repoRequest(env, 'GET', `/pulls?${h.qs({ state: 'open', base, per_page: '100' })}`);
    for (const p of prs.data ?? []) {
      const branch = p.head?.ref ?? '';
      const collection = Object.keys(ENTRY).find((c) => branch.startsWith(ENTRY[c].prefix));
      if (!collection || p.head?.repo?.full_name !== h.repoName) continue;
      const slug = branch.slice(ENTRY[collection].prefix.length);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue;
      const file = await h.readFile(env, `content/${collection}/${slug}/index.json`, branch);
      const doc = file && parseJson(file.text);
      if (doc) add(collection, slug, doc, 'draft');
    }
    const out = new Map();
    for (const e of entries.values()) {
      for (const id of new Set([...e.published, ...e.draft])) {
        const list = out.get(id) ?? [];
        list.push({ collection: e.collection, slug: e.slug, title: e.title, published: e.published.has(id), draft: e.draft.has(id) });
        out.set(id, list);
      }
    }
    out.sizes = sizes;
    return out;
  }

  /** A library image's details on a tree (null when missing or not valid). */
  async function detailsIn(env, tree, id) {
    const sha = tree.get(media.detailsPath(id));
    if (!sha) return null;
    const doc = parseJson(textOf(await blobBytes(h, env, sha)));
    return doc && media.validateDetails(doc, id).ok ? { doc, sha } : null;
  }

  function item(id, image, details, extra) {
    const d = details?.doc;
    return {
      id,
      folder: image.folder,
      library: image.folder === 'media',
      title: d?.title ?? id,
      width: d?.width ?? extra.width ?? null,
      height: d?.height ?? extra.height ?? null,
      ext: image.ext,
      uploaded: d?.uploaded ?? null,
      alt: d?.alt ?? null,
      caption: d?.caption ?? null,
      sha: details?.sha ?? null,
      status: extra.status,
      edited: Boolean(extra.edited),
      usedBy: extra.usedBy ?? [],
      // The content hashes of the image and its small copy, for GET /api/media/blobs/<sha>.
      file: image.sha ?? null,
      thumb: extra.thumb ?? image.sha ?? null,
    };
  }
  const thumbIn = (tree, id) => tree.get(media.thumbPath(id, 'webp')) ?? tree.get(media.thumbPath(id, 'jpg'));

  async function list(env, base) {
    const p = await pending(env, base);
    const baseTree = await treeOf(env, base);
    const tree = p ? await treeOf(env, p.head) : baseTree;
    const onBase = imagesIn(baseTree);
    const onRef = imagesIn(tree);
    const used = await usage(env, base, baseTree);
    const items = [];
    for (const id of new Set([...onRef.keys(), ...onBase.keys()])) {
      const image = onRef.get(id) ?? onBase.get(id);
      const usedBy = used.get(id) ?? [];
      if (image.folder !== 'media') {
        // An image of a case study or an article: on the base branch only (entry drafts keep their uploads to themselves).
        if (!onBase.has(id)) continue;
        items.push(item(id, onBase.get(id), null, { status: 'published', usedBy, ...(used.sizes.get(id) ?? {}) }));
        continue;
      }
      const status = onRef.has(id) && onBase.has(id) ? 'published' : onRef.has(id) ? 'new' : 'removing';
      const details = await detailsIn(env, status === 'removing' ? baseTree : tree, id);
      const edited = status === 'published' && tree.get(media.detailsPath(id)) !== baseTree.get(media.detailsPath(id));
      items.push(item(id, image, details, { status, edited, usedBy, thumb: thumbIn(status === 'removing' ? baseTree : tree, id) }));
    }
    // Library first, newest upload first; then the entries' images by name.
    items.sort((a, b) => Number(b.library) - Number(a.library) || String(b.uploaded ?? '').localeCompare(String(a.uploaded ?? '')) || a.id.localeCompare(b.id));
    return h.json(200, { baseBranch: base, pending: p ? { branch: BRANCH, ...p.pr } : null, items });
  }
  /**
   * The library's draft branch, ready for a commit: the open draft's head, or a branch started from the base. A leftover
   * branch is reset only when it is exactly the head of a closed pull request, like an entry's draft branch (api.js).
   */
  async function startBranch(env, base) {
    const p = await pending(env, base);
    if (p) return { head: p.head, pr: p.pr };
    const baseSha = await h.refSha(env, base);
    if (!baseSha) return { error: h.fail(503, 'The content base branch does not exist.') };
    const branchSha = await h.refSha(env, BRANCH);
    if (branchSha) {
      const prs = await h.prsForBranch(env, BRANCH);
      const open = prs.find((x) => x.state === 'open');
      if (open) return { error: h.fail(409, `The media library already has an open draft pull request (#${open.number}) for another base branch (${open.base?.ref ?? 'unknown'}). Close or merge it on GitHub first. Nothing was saved.`, { blocked: true }) };
      if (!prs.some((x) => x.state === 'closed' && x.head?.sha === branchSha)) {
        return { error: h.fail(409, `The branch ${BRANCH} holds work that is not part of a closed pull request. It was not overwritten and nothing was saved. Review or delete that branch on GitHub, then try again.`, { blocked: true }) };
      }
      await h.repoRequest(env, 'PATCH', `/git/refs/heads/${h.assertDraftBranch(BRANCH, base)}`, { body: { sha: baseSha, force: true } });
    } else {
      await h.repoRequest(env, 'POST', '/git/refs', { body: { ref: `refs/heads/${h.assertDraftBranch(BRANCH, base)}`, sha: baseSha } });
    }
    return { head: baseSha, pr: null };
  }
  /** Commits on the library branch, then opens its draft pull request if it has none: { draft } or { error }. */
  async function save(env, base, start, message, changes) {
    const c = await commitChanges(h, env, base, BRANCH, start.head, message, changes);
    if (!c) return { error: h.fail(409, 'The media library changed on GitHub at the same time. Reload and try again. Nothing was changed.', { conflict: true }) };
    let pr = start.pr;
    if (!pr) {
      const created = await h.repoRequest(env, 'POST', '/pulls', {
        body: { title: PR_TITLE, head: h.assertDraftBranch(BRANCH, base), base, draft: true, body: `${PR_BODY}\n\n${h.notes}` },
        expect: [422],
      });
      pr = created.status === 422 ? await h.openDraftPr(env, base, BRANCH) : { number: created.data.number, url: created.data.html_url, draft: Boolean(created.data.draft) };
    }
    return { commit: { sha: c.sha, url: c.url }, shas: c.shas, draft: pr ? { branch: BRANCH, ...pr } : null };
  }

  /** A small copy for the library view: a WebP or JPEG of at most THUMB.side pixels, with no embedded data. */
  function checkThumb(data) {
    if (typeof data !== 'string' || !data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
    const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
    const info = imageInfo(bytes);
    if (!info || !['webp', 'jpg'].includes(info.ext) || info.metadata.length || bytes.length > media.THUMB.bytes || Math.max(info.width, info.height) > media.THUMB.side) return null;
    return info;
  }

  async function upload(env, base, request) {
    const { body, error } = await readImageBody(h, request, MAX_UPLOAD);
    if (error) return error;
    const errors = {};
    const file = checkUpload(body?.data);
    if (file.error) errors.file = file.error;
    const thumb = checkThumb(body?.thumb);
    if (!thumb && !errors.file) errors.file = 'The preview of this image could not be made. Try again, or try another image.';
    const v = media.validateEditable({ title: body?.title, alt: body?.alt, caption: body?.caption });
    if (!v.ok) Object.assign(errors, v.errors);
    if (Object.keys(errors).length) return h.fail(422, 'Some fields need attention.', { fields: errors });

    const start = await startBranch(env, base);
    if (start.error) return start.error;
    const [baseTree, tree] = await Promise.all([treeOf(env, base), treeOf(env, start.head)]);
    const ids = new Set([...imagesIn(baseTree).keys(), ...imagesIn(tree).keys()]);
    for (const t of [baseTree, tree]) for (const path of t.keys()) if (path.startsWith(`${media.MEDIA.details}/`)) ids.add(path.split('/')[2]);
    const id = media.newMediaId(v.value.title, (x) => ids.has(x));
    if (!id) return h.fail(409, 'Too many images share this title. Choose another title.');
    const fixed = { id, width: file.info.width, height: file.info.height, ext: file.info.ext, thumb: `thumb.${thumb.ext}`, uploaded: new Date().toISOString().slice(0, 10) };
    const s = await save(env, base, start, `Draft: add ${id} to the media library (TechPi Admin)`, {
      [media.imagePath(id, fixed.ext)]: body.data,
      [media.thumbPath(id, thumb.ext)]: body.thumb,
      [media.detailsPath(id)]: h.b64encode(media.serializeDetails(fixed, v.value)),
    });
    if (s.error) return s.error;
    const details = { doc: { ...fixed, ...v.value }, sha: s.shas[media.detailsPath(id)] };
    const image = { folder: 'media', ext: fixed.ext, sha: s.shas[media.imagePath(id, fixed.ext)] };
    return h.json(201, { item: item(id, image, details, { status: 'new', thumb: s.shas[media.thumbPath(id, thumb.ext)] }), commit: s.commit, pending: s.draft });
  }

  async function edit(env, base, id, request) {
    const raw = await request.text();
    if (raw.length > MAX_EDIT) return h.fail(413, 'The details are too long.');
    const body = parseJson(raw);
    if (!body) return h.fail(400, 'The request is not valid JSON.');
    const expectedSha = typeof body.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null;
    if (!expectedSha) return h.fail(400, 'The version you edited is missing. Reload the library and try again.');
    const p = await pending(env, base);
    const file = await h.readFile(env, media.detailsPath(id), p ? BRANCH : base);
    const doc = file && parseJson(file.text);
    if (!doc || !media.validateDetails(doc, id).ok) return h.fail(404, 'There is no such image in the media library.');
    if (file.sha !== expectedSha) return h.fail(409, 'This image’s details changed since you opened them. Reload, then make your change again.', { conflict: true });
    const v = media.validateEditable(body);
    if (!v.ok) return h.fail(422, 'Some fields need attention.', { fields: v.errors });
    const text = media.serializeDetails(doc, v.value);
    if (text === file.text) return h.json(200, { id, sha: file.sha, changed: false, pending: p ? { branch: BRANCH, ...p.pr } : null });
    const start = p ? { head: p.head, pr: p.pr } : await startBranch(env, base);
    if (start.error) return start.error;
    const s = await save(env, base, start, `Draft: edit the details of ${id} in the media library (TechPi Admin)`, { [media.detailsPath(id)]: h.b64encode(text) });
    if (s.error) return s.error;
    return h.json(200, { id, sha: s.shas[media.detailsPath(id)], changed: true, commit: s.commit, pending: s.draft });
  }

  async function remove(env, base, id) {
    const p = await pending(env, base);
    const baseTree = await treeOf(env, base);
    const tree = p ? await treeOf(env, p.head) : baseTree;
    const image = imagesIn(tree).get(id);
    if (!image || image.folder !== 'media') {
      if (imagesIn(baseTree).get(id)?.folder === 'media') return h.fail(409, 'This image is already being removed: merge the media library’s draft pull request to finish.');
      if (image) return h.fail(409, 'This image belongs to a case study or an article. It is changed through that entry, not in the library.');
      return h.fail(404, 'There is no such image in the media library.');
    }
    const usedBy = (await usage(env, base, baseTree)).get(id) ?? [];
    if (usedBy.length) return h.fail(409, `This image is used by ${usedBy.map((u) => `“${u.title}”`).join(', ')}. Remove it there first.`, { usedBy });
    const start = p ? { head: p.head, pr: p.pr } : await startBranch(env, base);
    if (start.error) return start.error;
    const changes = { [image.path]: null };
    for (const path of tree.keys()) if (path.startsWith(`${media.MEDIA.details}/${id}/`)) changes[path] = null;
    const s = await save(env, base, start, `Draft: remove ${id} from the media library (TechPi Admin)`, changes);
    if (s.error) return s.error;
    return h.json(200, { id, removed: true, published: imagesIn(baseTree).has(id), commit: s.commit, pending: s.draft });
  }

  /** The image (or its small copy) for the admin's view, served with its real type. */
  async function file(env, base, id, which) {
    const p = await pending(env, base);
    const baseTree = await treeOf(env, base);
    const tree = p ? await treeOf(env, p.head) : baseTree;
    const image = imagesIn(tree).get(id) ?? imagesIn(baseTree).get(id);
    if (!image) return h.fail(404, 'There is no such image.');
    let sha = image.sha;
    if (which === 'thumb' && image.folder === 'media') {
      const t = [...tree, ...baseTree].find(([path]) => path === media.thumbPath(id, 'webp') || path === media.thumbPath(id, 'jpg'));
      if (t) sha = t[1];
    }
    const bytes = await blobBytes(h, env, sha);
    const info = imageInfo(bytes);
    if (!info) return h.fail(502, 'The stored file is not an image.');
    return new Response(bytes, { status: 200, headers: { 'Content-Type': CONTENT_TYPE[info.ext], 'Content-Disposition': 'inline', 'Cache-Control': 'private, max-age=300' } });
  }

  /**
   * An image or small copy by its content hash (from the list): one request, and the same hash is always the same bytes,
   * so the browser may keep it. Only image bytes are ever served (a hash of any other file is refused).
   */
  async function blob(env, sha) {
    const r = await h.repoRequest(env, 'GET', `/git/blobs/${sha}`, { expect: [404, 422] });
    if (r.status !== 200) return h.fail(404, 'There is no such image.');
    const bytes = Uint8Array.from(atob(String(r.data?.content ?? '').replace(/\s+/g, '')), (ch) => ch.charCodeAt(0));
    const info = imageInfo(bytes);
    if (!info) return h.fail(404, 'There is no such image.');
    return new Response(bytes, { status: 200, headers: { 'Content-Type': CONTENT_TYPE[info.ext], 'Content-Disposition': 'inline', 'Cache-Control': 'private, max-age=86400, immutable' } });
  }

  /**
   * An image an entry may use (images.js `use`): on the base branch in any of the three folders, or in the library's
   * open draft. { id, path, sha, onBase } or null.
   */
  async function locate(env, base, id) {
    const onBase = imagesIn(await treeOf(env, base)).get(id);
    if (onBase) return { id, path: onBase.path, sha: onBase.sha, onBase: true };
    const p = await pending(env, base);
    const draft = p ? imagesIn(await treeOf(env, p.head)).get(id) : null;
    return draft?.folder === 'media' ? { id, path: draft.path, sha: draft.sha, onBase: false } : null;
  }

  return { list, upload, edit, remove, file, blob, locate };
}
