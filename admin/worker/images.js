/**
 * Images of a new case study (Task M6). A case study created in the admin (M5) has no images; until its draft pull
 * request is merged, the owner can add, replace and remove them here:
 *
 *   POST /api/case-studies/<slug>/images          { expectedSha, slot: 'image' | 'cover' | 'gallery', data, alt: { en, el },
 *                                                   caption?: { en, el } }   add (gallery) or set/replace (image, cover)
 *   POST /api/case-studies/<slug>/images/remove   { expectedSha, slot, index? }
 *   GET  /api/case-studies/<slug>/images/<id>     the image file, for the editor's preview
 *
 * `image` is the row image on the Work page; `cover` leads the case-study page; `gallery` follows the text (at most 8).
 * Each change is ONE commit on the case study's draft branch (Git Data API), containing the image file
 * (src/assets/projects/<slug>-<slot>-<n>.<ext>) and the updated content file, and deleting any image file no longer
 * used. So the content file never points to a missing image, and no unused upload is left behind.
 *
 * Only for a new case study: one with an open draft pull request whose file is not on the base branch. The images of
 * a published case study are not changed here. Every upload is checked from its bytes (admin/shared/image-info.js): a
 * real PNG, JPEG or WebP, at most 3 MB, 320 to 8000 pixels a side, with no embedded EXIF, XMP or text (the repository is
 * public). The admin's upload re-encodes each picture in the browser first, which also removes such data. Nothing is
 * ever written outside the draft branch (assertDraftBranch).
 */
import { imageInfo } from '../shared/image-info.js';
import * as study from '../shared/case-study-content.js';

export const IMAGE_DIR = 'src/assets/projects';
export const IMAGE_LIMITS = { bytes: 3_000_000, minSide: 320, maxSide: 8000, gallery: 8 };
const MAX_BODY = 4_300_000; // base64 of 3 MB, plus the rest of the request
const SLOTS = ['image', 'cover', 'gallery'];
const ALT = { image: 'imageAlt', cover: 'coverAlt', gallery: 'galleryAlts' };
/** The editor's limit for alt text (case-study-content.js: imageAlt, coverAlt and each of galleryAlts). */
const ALT_MAX = study.FIELDS.imageAlt.max;
const CONTENT_TYPE = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const BAD = /[\u0000-\u001f\u007f<>]/;

/**
 * `h`: helpers from api.js (json, fail, repoRequest, readFile, refSha, openDraftPr, assertDraftBranch, b64encode, qs,
 * collection: the case-studies collection).
 */
export function imageRoutes(h) {
  const col = h.collection;

  /** The draft of a new case study, or an error response. */
  async function newDraft(env, base, slug) {
    const branch = col.branch(slug);
    const pr = await h.openDraftPr(env, base, branch);
    const head = pr ? await h.refSha(env, branch) : null;
    if (!pr || !head) return { error: h.fail(409, 'Images can be added only to a new case study with an open draft. Create the case study first.') };
    if (await h.readFile(env, col.path(slug), base)) return { error: h.fail(409, 'This case study is already on the website. Its images are not changed in the admin.') };
    const file = await h.readFile(env, col.path(slug), branch);
    if (!file) return { error: h.fail(404, col.notAvailable) };
    const doc = col.parse(file.text, slug);
    if (!doc) return { error: h.fail(502, 'This case study’s file is not valid.') };
    return { branch, head, file, doc, pr };
  }

  /** The image files on a ref, by id (file name without extension). */
  async function filesOn(env, ref) {
    const dir = await h.repoRequest(env, 'GET', `/contents/${IMAGE_DIR}?${h.qs({ ref })}`, { expect: [404] });
    const out = {};
    for (const f of Array.isArray(dir.data) ? dir.data : []) if (f.type === 'file') out[f.name.replace(/\.[a-z]+$/i, '')] = { name: f.name, sha: f.sha };
    return out;
  }

  /** One commit with every change: { path: base64 content | null to delete }. Null when the branch moved meanwhile. */
  async function commit(env, base, branch, head, message, changes) {
    h.assertDraftBranch(branch, base);
    const parent = await h.repoRequest(env, 'GET', `/git/commits/${head}`);
    const tree = [];
    const shas = {};
    for (const [path, content] of Object.entries(changes)) {
      if (content === null) { tree.push({ path, mode: '100644', type: 'blob', sha: null }); continue; }
      const blob = await h.repoRequest(env, 'POST', '/git/blobs', { body: { content, encoding: 'base64' } });
      shas[path] = blob.data.sha;
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.data.sha });
    }
    const t = await h.repoRequest(env, 'POST', '/git/trees', { body: { base_tree: parent.data.tree.sha, tree } });
    const c = await h.repoRequest(env, 'POST', '/git/commits', { body: { message, tree: t.data.sha, parents: [head] } });
    // Not forced: GitHub refuses the update if the branch no longer points at `head`, so a concurrent save is never lost.
    const moved = await h.repoRequest(env, 'PATCH', `/git/refs/heads/${h.assertDraftBranch(branch, base)}`, { body: { sha: c.data.sha, force: false }, expect: [409, 422] });
    return moved.status === 200 ? { sha: c.data.sha, url: c.data.html_url ?? null, shas } : null;
  }

  const ids = (doc) => [doc.images.image, doc.images.cover, ...(doc.images.gallery ?? [])].filter(Boolean).map((x) => x.id);
  /** The content file as stored: canonical key order for the images too. */
  const serialize = (doc) => {
    const images = Object.fromEntries(['image', 'cover', 'gallery'].filter((k) => doc.images[k] !== undefined).map((k) => [k, doc.images[k]]));
    return study.serializeDocument({ facts: doc.facts, images }, { en: doc.en, el: doc.el });
  };

  async function readJsonBody(request) {
    if (Number(request.headers.get('Content-Length')) > MAX_BODY) return { error: h.fail(413, 'The image is too large: at most 3 MB.') };
    const raw = await request.text();
    if (raw.length > MAX_BODY) return { error: h.fail(413, 'The image is too large: at most 3 MB.') };
    try { return { body: JSON.parse(raw) }; } catch { return { error: h.fail(400, 'The request is not valid JSON.') }; }
  }

  /** Validates plain text per language; returns { value } or adds errors. */
  function texts(input, prefix, max, required, errors) {
    const value = {};
    for (const l of study.LOCALES) {
      const raw = input?.[l];
      const v = typeof raw === 'string' ? raw.trim() : '';
      if (!v) { if (required) errors[`${prefix}.${l}`] = l === 'en' ? 'Describe the image in English.' : 'Describe the image in Greek.'; continue; }
      if (BAD.test(v)) errors[`${prefix}.${l}`] = 'Plain text only: no line breaks or < > characters.';
      else if (v.length > max) errors[`${prefix}.${l}`] = `At most ${max} characters (now ${v.length}).`;
      else value[l] = v;
    }
    return value;
  }

  async function finish(env, base, slug, d, next, changes, message) {
    const problems = study.validateDocument(next, slug).problems;
    if (problems.length) return h.fail(422, 'The case study would not be valid.', { fields: { entry: problems.join(' ') } });
    const jsonPath = col.path(slug);
    const text = serialize(next);
    // Image files no longer used by this case study are deleted in the same commit.
    const before = new Set(ids(d.doc));
    const after = new Set(ids(next));
    const files = await filesOn(env, d.branch);
    for (const id of before) if (!after.has(id) && files[id] && id.startsWith(`${slug}-`)) changes[`${IMAGE_DIR}/${files[id].name}`] = null;
    changes[jsonPath] = h.b64encode(text);
    const c = await commit(env, base, d.branch, d.head, message, changes);
    if (!c) return h.fail(409, 'This case study changed on GitHub while the image was being saved. Reload and try again. Nothing was changed.', { conflict: true });
    return h.json(200, { slug, sha: c.shas[jsonPath], content: next, commit: { sha: c.sha, url: c.url }, draft: { branch: d.branch, ...d.pr }, isNew: true });
  }

  async function add(env, base, slug, request) {
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const expectedSha = typeof body?.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null;
    if (!expectedSha) return h.fail(400, 'The version you edited is missing. Reload the case study and try again.');
    if (!SLOTS.includes(body.slot)) return h.fail(400, 'Unknown image place.');
    const d = await newDraft(env, base, slug);
    if (d.error) return d.error;
    if (d.file.sha !== expectedSha) return h.fail(409, 'This case study changed since you opened it. Reload, then add the image again.', { conflict: true });

    const errors = {};
    let bytes = null;
    if (typeof body.data !== 'string' || !body.data || body.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) errors.file = 'Choose an image file.';
    else bytes = Uint8Array.from(atob(body.data), (ch) => ch.charCodeAt(0));
    const info = bytes && imageInfo(bytes);
    if (bytes && bytes.length > IMAGE_LIMITS.bytes) errors.file = 'The image is too large: at most 3 MB.';
    else if (bytes && !info) errors.file = 'This is not a PNG, JPEG or WebP image.';
    else if (info && info.metadata.length) errors.file = `This image contains embedded data (${info.metadata.join(', ')}), which can include where a photo was taken. Upload it through the admin, which removes it.`;
    else if (info && (Math.min(info.width, info.height) < IMAGE_LIMITS.minSide || Math.max(info.width, info.height) > IMAGE_LIMITS.maxSide)) errors.file = `The image must be ${IMAGE_LIMITS.minSide} to ${IMAGE_LIMITS.maxSide} pixels on each side (it is ${info.width} × ${info.height}).`;
    const alt = texts(body.alt, 'alt', ALT_MAX, true, errors);
    const hasCaption = body.slot === 'cover' && body.caption && (body.caption.en?.trim() || body.caption.el?.trim());
    const caption = hasCaption ? texts(body.caption, 'caption', study.FIELDS.coverCaption.max, true, errors) : null;
    if (body.slot === 'gallery' && (d.doc.images.gallery?.length ?? 0) >= IMAGE_LIMITS.gallery) errors.file = `A case study has at most ${IMAGE_LIMITS.gallery} gallery images.`;
    if (Object.keys(errors).length) return h.fail(422, 'Some fields need attention.', { fields: errors });

    // A new file name for every upload: <slug>-<slot>-<n>, n one more than any this case study has used on the branch.
    const files = await filesOn(env, d.branch);
    const used = Object.keys(files).map((id) => id.match(new RegExp(`^${slug}-(?:image|cover|gallery)-(\\d+)$`))?.[1]).filter(Boolean).map(Number);
    const id = `${slug}-${body.slot}-${Math.max(0, ...used) + 1}`;
    const ref = { id, width: info.width, height: info.height };
    const next = structuredClone(d.doc);
    if (body.slot === 'gallery') {
      next.images.gallery = [...(next.images.gallery ?? []), ref];
      for (const l of study.LOCALES) next[l].galleryAlts = [...(next[l].galleryAlts ?? []), alt[l]];
    } else {
      next.images[body.slot] = ref;
      for (const l of study.LOCALES) next[l][ALT[body.slot]] = alt[l];
      if (body.slot === 'cover') for (const l of study.LOCALES) { if (caption) next[l].coverCaption = caption[l]; else delete next[l].coverCaption; }
    }
    const verb = body.slot === 'gallery' ? 'add a gallery image to' : d.doc.images[body.slot] ? `replace the ${body.slot === 'image' ? 'row image' : 'cover'} of` : `add a ${body.slot === 'image' ? 'row image' : 'cover'} to`;
    return finish(env, base, slug, d, next, { [`${IMAGE_DIR}/${id}.${info.ext}`]: body.data }, `Draft: ${verb} ${slug} (TechPi Admin)`);
  }

  async function remove(env, base, slug, request) {
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const expectedSha = typeof body?.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null;
    if (!expectedSha) return h.fail(400, 'The version you edited is missing. Reload the case study and try again.');
    if (!SLOTS.includes(body.slot)) return h.fail(400, 'Unknown image place.');
    const d = await newDraft(env, base, slug);
    if (d.error) return d.error;
    if (d.file.sha !== expectedSha) return h.fail(409, 'This case study changed since you opened it. Reload, then try again.', { conflict: true });
    const next = structuredClone(d.doc);
    if (body.slot === 'gallery') {
      const i = body.index;
      if (!Number.isInteger(i) || i < 0 || i >= (next.images.gallery?.length ?? 0)) return h.fail(404, 'There is no such gallery image.');
      next.images.gallery.splice(i, 1);
      for (const l of study.LOCALES) next[l].galleryAlts.splice(i, 1);
      if (!next.images.gallery.length) {
        delete next.images.gallery;
        for (const l of study.LOCALES) delete next[l].galleryAlts;
      }
    } else {
      if (!next.images[body.slot]) return h.fail(404, 'There is no such image.');
      delete next.images[body.slot];
      for (const l of study.LOCALES) {
        delete next[l][ALT[body.slot]];
        if (body.slot === 'cover') delete next[l].coverCaption;
      }
    }
    return finish(env, base, slug, d, next, {}, `Draft: remove an image from ${slug} (TechPi Admin)`);
  }

  /** The image file, for the editor's preview: only an image this case study uses, served with its real type. */
  async function get(env, base, slug, id) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return h.fail(400, 'Invalid image name.');
    const branch = col.branch(slug);
    const pr = await h.openDraftPr(env, base, branch);
    const ref = pr && (await h.refSha(env, branch)) ? branch : base;
    const file = await h.readFile(env, col.path(slug), ref);
    const doc = file && col.parse(file.text, slug);
    if (!doc || !ids(doc).includes(id)) return h.fail(404, 'This case study has no such image.');
    const found = (await filesOn(env, ref))[id];
    if (!found) return h.fail(404, 'The image file is missing.');
    const blob = await h.repoRequest(env, 'GET', `/git/blobs/${found.sha}`);
    const bytes = Uint8Array.from(atob(String(blob.data?.content ?? '').replace(/\s+/g, '')), (ch) => ch.charCodeAt(0));
    const info = imageInfo(bytes);
    if (!info) return h.fail(502, 'The stored file is not an image.');
    return new Response(bytes, { status: 200, headers: { 'Content-Type': CONTENT_TYPE[info.ext], 'Content-Disposition': 'inline' } });
  }

  return { add, remove, get };
}
