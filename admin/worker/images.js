/**
 * Images of NEW case studies (Task M6) and NEW Insights articles (Task M7). An entry created in the admin (M5) has no
 * images; until its draft pull request is merged, the owner can add, replace and remove them:
 *
 *   POST /api/<collection>/<slug>/images          { expectedSha, slot, index?, data, alt, caption? }
 *   POST /api/<collection>/<slug>/images/remove   { expectedSha, slot, index? }
 *   POST /api/<collection>/<slug>/images/use      { expectedSha, slot, index?, id, alt, caption? }: an image already in
 *                                                 the repository, from the media library (Task M8, media.js)
 *   GET  /api/<collection>/<slug>/images/<id>     the image file, for the editor's preview
 *
 * Case studies (`alt` and `caption` in English and Greek): slot `image` (Work-page row), `cover` (top of the page, with an
 * optional caption), `gallery` (after the text, at most 8; `index` to remove one).
 * Articles (English only, `alt` and `caption` as plain strings): slot `cover` (between the head and the text) and
 * `section` with the section's `index` (after that section's text); each with an optional caption.
 *
 * Each change is ONE commit on the entry's draft branch (Git Data API): the image file (<folder>/<slug>-<slot>-<n>.<ext>),
 * the updated content file, and the deletion of any image file the entry no longer uses. So a content file never points
 * to a missing image, and no unused upload is left behind. The branch moves only as a fast-forward.
 *
 * Only for a new entry: an open draft pull request, and no file on the base branch. Every upload is checked from its
 * bytes (admin/shared/image-info.js): a real PNG, JPEG or WebP, at most 3 MB, 320 to 8000 pixels a side, with no embedded
 * EXIF, XMP or text (the repository is public). The admin's upload re-encodes each picture in the browser first, which
 * also removes such data. Nothing is ever written outside the draft branch (assertDraftBranch).
 */
import { imageInfo } from '../shared/image-info.js';
import * as study from '../shared/case-study-content.js';
import * as insight from '../shared/insight-content.js';

/** Where images live (src/content/image-files.ts): any entry may use an image from any of them. */
const IMAGE_FOLDERS = ['src/assets/projects', 'src/assets/insights', 'src/assets/media'];
const MEDIA_FOLDER = 'src/assets/media';
export const IMAGE_LIMITS = { bytes: 3_000_000, minSide: 320, maxSide: 8000, gallery: 8 };
const MAX_BODY = 4_300_000; // base64 of 3 MB, plus the rest of the request
const CONTENT_TYPE = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const BAD = /[\u0000-\u001f\u007f<>]/;

/** What differs between case studies and articles. */
const KINDS = {
  'case-studies': {
    folder: 'src/assets/projects',
    locales: study.LOCALES,
    altMax: study.FIELDS.imageAlt.max,
    captionMax: study.FIELDS.coverCaption.max,
    slots: ['image', 'cover', 'gallery'],
    label: { image: 'row image', cover: 'cover', gallery: 'gallery image' },
    refs: (doc) => [doc.images.image, doc.images.cover, ...(doc.images.gallery ?? [])].filter(Boolean),
    captioned: (slot) => slot === 'cover',
    has: (doc, slot) => (slot === 'gallery' ? false : Boolean(doc.images[slot])),
    full: (doc, slot) => (slot === 'gallery' && (doc.images.gallery?.length ?? 0) >= IMAGE_LIMITS.gallery ? `A case study has at most ${IMAGE_LIMITS.gallery} gallery images.` : null),
    set(next, slot, _index, ref, alt, caption) {
      const key = { image: 'imageAlt', cover: 'coverAlt', gallery: 'galleryAlts' }[slot];
      if (slot === 'gallery') {
        next.images.gallery = [...(next.images.gallery ?? []), ref];
        for (const l of study.LOCALES) next[l].galleryAlts = [...(next[l].galleryAlts ?? []), alt[l]];
        return;
      }
      next.images[slot] = ref;
      for (const l of study.LOCALES) {
        next[l][key] = alt[l];
        if (slot === 'cover') { if (caption) next[l].coverCaption = caption[l]; else delete next[l].coverCaption; }
      }
    },
    unset(next, slot, index) {
      if (slot === 'gallery') {
        if (!Number.isInteger(index) || index < 0 || index >= (next.images.gallery?.length ?? 0)) return 'There is no such gallery image.';
        next.images.gallery.splice(index, 1);
        for (const l of study.LOCALES) next[l].galleryAlts.splice(index, 1);
        if (!next.images.gallery.length) {
          delete next.images.gallery;
          for (const l of study.LOCALES) delete next[l].galleryAlts;
        }
        return null;
      }
      if (!next.images[slot]) return 'There is no such image.';
      delete next.images[slot];
      for (const l of study.LOCALES) {
        delete next[l][slot === 'image' ? 'imageAlt' : 'coverAlt'];
        if (slot === 'cover') delete next[l].coverCaption;
      }
      return null;
    },
    valid: (doc, slug) => study.validateDocument(doc, slug).problems,
    serialize(doc) {
      const images = Object.fromEntries(['image', 'cover', 'gallery'].filter((k) => doc.images[k] !== undefined).map((k) => [k, doc.images[k]]));
      return study.serializeDocument({ facts: doc.facts, images }, { en: doc.en, el: doc.el });
    },
  },
  insights: {
    folder: 'src/assets/insights',
    locales: ['en'],
    altMax: insight.IMAGE_RULES.alt.max,
    captionMax: insight.IMAGE_RULES.caption.max,
    slots: ['cover', 'section'],
    label: { cover: 'cover', section: 'section image' },
    refs: (doc) => [doc.images?.cover, ...Object.values(doc.images?.sections ?? {})].filter(Boolean),
    captioned: () => true,
    has: (doc, slot, index) => (slot === 'cover' ? Boolean(doc.images?.cover) : Boolean(doc.images?.sections?.[String(index)])),
    full: (doc, slot, index) => (slot === 'section' && (!Number.isInteger(index) || index < 0 || index >= doc.en.sections.length) ? 'There is no such section.' : null),
    set(next, slot, index, ref, alt, caption) {
      next.images = next.images ?? {};
      const target = slot === 'cover' ? next.en : next.en.sections[index];
      const [altKey, captionKey] = slot === 'cover' ? ['coverAlt', 'coverCaption'] : ['imageAlt', 'imageCaption'];
      if (slot === 'cover') next.images.cover = ref;
      else next.images.sections = { ...(next.images.sections ?? {}), [String(index)]: ref };
      target[altKey] = alt.en;
      if (caption) target[captionKey] = caption.en; else delete target[captionKey];
    },
    unset(next, slot, index) {
      if (slot === 'cover') {
        if (!next.images?.cover) return 'There is no such image.';
        delete next.images.cover;
        delete next.en.coverAlt;
        delete next.en.coverCaption;
      } else {
        const key = String(index);
        if (!next.images?.sections?.[key]) return 'There is no such image.';
        delete next.images.sections[key];
        if (!Object.keys(next.images.sections).length) delete next.images.sections;
        delete next.en.sections[index].imageAlt;
        delete next.en.sections[index].imageCaption;
      }
      if (next.images && !Object.keys(next.images).length) delete next.images;
      return null;
    },
    // Related articles and links are not what changes here: check them for form only (as a stored file is read).
    valid: (doc, slug) => insight.validateDocument(doc, slug, insight.ANY_KNOWN).problems,
    serialize(doc) {
      const images = doc.images ? Object.fromEntries(['cover', 'sections'].filter((k) => doc.images[k] !== undefined).map((k) => [k, doc.images[k]])) : undefined;
      const sections = images?.sections ? { ...images, sections: Object.fromEntries(Object.entries(images.sections).sort(([a], [b]) => Number(a) - Number(b))) } : images;
      return insight.serializeDocument({ facts: doc.facts, ...(sections ? { images: sections } : {}) }, { en: doc.en });
    },
  },
};

/**
 * One commit on a draft branch with every change (Git Data API): { path: base64 content | { sha } of a blob already in
 * the repository | null to delete }. The branch moves only as a fast-forward from `head`: null when it moved meanwhile.
 * `h`: helpers from api.js. Used for entry images here and for the media library (media.js).
 */
export async function commitChanges(h, env, base, branch, head, message, changes) {
  h.assertDraftBranch(branch, base);
  const parent = await h.repoRequest(env, 'GET', `/git/commits/${head}`);
  const tree = [];
  const shas = {};
  for (const [path, content] of Object.entries(changes)) {
    if (content === null) { tree.push({ path, mode: '100644', type: 'blob', sha: null }); continue; }
    const sha = typeof content === 'object' ? content.sha : (await h.repoRequest(env, 'POST', '/git/blobs', { body: { content, encoding: 'base64' } })).data.sha;
    shas[path] = sha;
    tree.push({ path, mode: '100644', type: 'blob', sha });
  }
  const t = await h.repoRequest(env, 'POST', '/git/trees', { body: { base_tree: parent.data.tree.sha, tree } });
  const c = await h.repoRequest(env, 'POST', '/git/commits', { body: { message, tree: t.data.sha, parents: [head] } });
  // Not forced: GitHub refuses the update if the branch no longer points at `head`, so a concurrent save is never lost.
  const moved = await h.repoRequest(env, 'PATCH', `/git/refs/heads/${h.assertDraftBranch(branch, base)}`, { body: { sha: c.data.sha, force: false }, expect: [409, 422] });
  return moved.status === 200 ? { sha: c.data.sha, url: c.data.html_url ?? null, shas } : null;
}

/** Reads an upload's JSON body (an image as base64 and its text), refusing anything larger than an image allows. */
export async function readImageBody(h, request, max = MAX_BODY) {
  if (Number(request.headers.get('Content-Length')) > max) return { error: h.fail(413, 'The image is too large: at most 3 MB.') };
  const raw = await request.text();
  if (raw.length > max) return { error: h.fail(413, 'The image is too large: at most 3 MB.') };
  try { return { body: JSON.parse(raw) }; } catch { return { error: h.fail(400, 'The request is not valid JSON.') }; }
}

/** The bytes of a base64 upload checked as an image (see the top of this file): { bytes, info } or { error } (a message). */
export function checkUpload(data) {
  if (typeof data !== 'string' || !data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return { error: 'Choose an image file.' };
  const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
  const info = imageInfo(bytes);
  if (bytes.length > IMAGE_LIMITS.bytes) return { error: 'The image is too large: at most 3 MB.' };
  if (!info) return { error: 'This is not a PNG, JPEG or WebP image.' };
  if (info.metadata.length) return { error: `This image contains embedded data (${info.metadata.join(', ')}), which can include where a photo was taken. Upload it through the admin, which removes it.` };
  if (Math.min(info.width, info.height) < IMAGE_LIMITS.minSide || Math.max(info.width, info.height) > IMAGE_LIMITS.maxSide) return { error: `The image must be ${IMAGE_LIMITS.minSide} to ${IMAGE_LIMITS.maxSide} pixels on each side (it is ${info.width} × ${info.height}).` };
  return { bytes, info };
}

/** A stored blob's bytes. */
export async function blobBytes(h, env, sha) {
  const blob = await h.repoRequest(env, 'GET', `/git/blobs/${sha}`);
  return Uint8Array.from(atob(String(blob.data?.content ?? '').replace(/\s+/g, '')), (ch) => ch.charCodeAt(0));
}
export { CONTENT_TYPE };

/**
 * `h`: helpers from api.js (json, fail, repoRequest, readFile, refSha, openDraftPr, assertDraftBranch, b64encode, qs);
 * `name`, `col`: the collection (case-studies or insights) and its definition in api.js.
 */
export function imageRoutes(h, name, col) {
  const kind = KINDS[name];
  const noun = name === 'insights' ? 'article' : 'case study';
  /** This entry's own uploads: <slug>-<slot>-<n> (never a library image: shared/media-content.js isMediaId). */
  const ownUpload = (slug) => new RegExp(`^${slug}-(?:${kind.slots.join('|')})-\\d+$`);

  /** The draft of a new entry, or an error response. */
  async function newDraft(env, base, slug) {
    const branch = col.branch(slug);
    const pr = await h.openDraftPr(env, base, branch);
    const head = pr ? await h.refSha(env, branch) : null;
    if (!pr || !head) return { error: h.fail(409, `Images can be added only to a new ${noun} with an open draft. Create the ${noun} first.`) };
    if (await h.readFile(env, col.path(slug), base)) return { error: h.fail(409, `This ${noun} is already on the website. Its images are not changed in the admin.`) };
    const file = await h.readFile(env, col.path(slug), branch);
    if (!file) return { error: h.fail(404, col.notAvailable) };
    const doc = col.parse(file.text, slug);
    if (!doc) return { error: h.fail(502, `This ${noun}’s file is not valid.`) };
    return { branch, head, file, doc, pr };
  }

  /** The image files of a folder (this collection's by default) on a ref, by id (file name without extension). */
  async function filesOn(env, ref, folder = kind.folder) {
    const dir = await h.repoRequest(env, 'GET', `/contents/${folder}?${h.qs({ ref })}`, { expect: [404] });
    const out = {};
    for (const f of Array.isArray(dir.data) ? dir.data : []) if (f.type === 'file') out[f.name.replace(/\.[a-z]+$/i, '')] = { name: f.name, sha: f.sha };
    return out;
  }

  const readJsonBody = (request) => readImageBody(h, request);

  /** Plain text per language (articles: one English string). Returns { en, el? } or adds errors. */
  function texts(input, prefix, max, required, errors) {
    const value = {};
    const one = kind.locales.length === 1;
    for (const l of kind.locales) {
      const raw = one ? input : input?.[l];
      const at = one ? prefix : `${prefix}.${l}`;
      const v = typeof raw === 'string' ? raw.trim() : '';
      if (!v) { if (required) errors[at] = one ? 'Describe the image.' : l === 'en' ? 'Describe the image in English.' : 'Describe the image in Greek.'; continue; }
      if (BAD.test(v)) errors[at] = 'Plain text only: no line breaks or < > characters.';
      else if (v.length > max) errors[at] = `At most ${max} characters (now ${v.length}).`;
      else value[l] = v;
    }
    return value;
  }
  const hasText = (input) => (kind.locales.length === 1 ? typeof input === 'string' && input.trim() : input && kind.locales.some((l) => typeof input[l] === 'string' && input[l].trim()));

  async function finish(env, base, slug, d, next, changes, message) {
    const problems = kind.valid(next, slug);
    if (problems.length) return h.fail(422, `The ${noun} would not be valid.`, { fields: { entry: problems.join(' ') } });
    const jsonPath = col.path(slug);
    // Image files no longer used by this entry are deleted in the same commit: its own uploads (named after it), and a
    // library image it brought into its draft that is not on the base branch (Task M8). Library and other entries' images
    // on the base branch are never touched.
    const after = new Set(kind.refs(next).map((x) => x.id));
    const dropped = [...new Set(kind.refs(d.doc).map((x) => x.id))].filter((id) => !after.has(id));
    if (dropped.length) {
      const own = ownUpload(slug);
      const files = await filesOn(env, d.branch);
      for (const id of dropped) if (own.test(id) && files[id]) changes[`${kind.folder}/${files[id].name}`] = null;
      if (dropped.some((id) => !own.test(id))) {
        const [onBranch, onBase] = await Promise.all([filesOn(env, d.branch, MEDIA_FOLDER), filesOn(env, base, MEDIA_FOLDER)]);
        for (const id of dropped) if (!own.test(id) && onBranch[id] && !onBase[id]) changes[`${MEDIA_FOLDER}/${onBranch[id].name}`] = null;
      }
    }
    changes[jsonPath] = h.b64encode(kind.serialize(next));
    const c = await commitChanges(h, env, base, d.branch, d.head, message, changes);
    if (!c) return h.fail(409, `This ${noun} changed on GitHub while the image was being saved. Reload and try again. Nothing was changed.`, { conflict: true });
    return h.json(200, { slug, sha: c.shas[jsonPath], content: next, commit: { sha: c.sha, url: c.url }, draft: { branch: d.branch, ...d.pr }, isNew: true });
  }

  const version = (body) => (typeof body?.expectedSha === 'string' && /^[0-9a-f]{40}$/.test(body.expectedSha) ? body.expectedSha : null);

  async function add(env, base, slug, request) {
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const expectedSha = version(body);
    if (!expectedSha) return h.fail(400, `The version you edited is missing. Reload the ${noun} and try again.`);
    if (!kind.slots.includes(body.slot)) return h.fail(400, 'Unknown image place.');
    const d = await newDraft(env, base, slug);
    if (d.error) return d.error;
    if (d.file.sha !== expectedSha) return h.fail(409, `This ${noun} changed since you opened it. Reload, then add the image again.`, { conflict: true });

    const errors = {};
    const full = kind.full(d.doc, body.slot, body.index);
    if (full) errors.file = full;
    const upload = checkUpload(body.data);
    const info = upload.info;
    if (upload.error) errors.file = full ?? upload.error;
    const alt = texts(body.alt, 'alt', kind.altMax, true, errors);
    const caption = kind.captioned(body.slot) && hasText(body.caption) ? texts(body.caption, 'caption', kind.captionMax, true, errors) : null;
    if (Object.keys(errors).length) return h.fail(422, 'Some fields need attention.', { fields: errors });

    // A new file name for every upload: <slug>-<slot>-<n>, n one more than any this entry has used on the branch.
    const files = await filesOn(env, d.branch);
    const used = Object.keys(files).filter((id) => ownUpload(slug).test(id)).map((id) => Number(id.slice(id.lastIndexOf('-') + 1)));
    const id = `${slug}-${body.slot}-${Math.max(0, ...used) + 1}`;
    const ref = { id, width: info.width, height: info.height };
    const next = structuredClone(d.doc);
    const replacing = kind.has(d.doc, body.slot, body.index);
    kind.set(next, body.slot, body.index, ref, alt, caption);
    const what = kind.label[body.slot];
    const message = `Draft: ${replacing ? `replace the ${what} of` : `add a ${what} to`} ${slug} (TechPi Admin)`;
    return finish(env, base, slug, d, next, { [`${kind.folder}/${id}.${info.ext}`]: body.data }, message);
  }

  async function remove(env, base, slug, request) {
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const expectedSha = version(body);
    if (!expectedSha) return h.fail(400, `The version you edited is missing. Reload the ${noun} and try again.`);
    if (!kind.slots.includes(body.slot)) return h.fail(400, 'Unknown image place.');
    const d = await newDraft(env, base, slug);
    if (d.error) return d.error;
    if (d.file.sha !== expectedSha) return h.fail(409, `This ${noun} changed since you opened it. Reload, then try again.`, { conflict: true });
    const next = structuredClone(d.doc);
    const missing = kind.unset(next, body.slot, body.index);
    if (missing) return h.fail(404, missing);
    return finish(env, base, slug, d, next, {}, `Draft: remove an image from ${slug} (TechPi Admin)`);
  }

  /** The image file, for the editor's preview: only an image this entry uses, served with its real type. */
  async function get(env, base, slug, id) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return h.fail(400, 'Invalid image name.');
    const branch = col.branch(slug);
    const pr = await h.openDraftPr(env, base, branch);
    const ref = pr && (await h.refSha(env, branch)) ? branch : base;
    const file = await h.readFile(env, col.path(slug), ref);
    const doc = file && col.parse(file.text, slug);
    if (!doc || !kind.refs(doc).some((x) => x.id === id)) return h.fail(404, `This ${noun} has no such image.`);
    // Its own upload, or an image from another folder (the library, or another entry's) that it uses.
    let found = (await filesOn(env, ref))[id];
    for (const folder of IMAGE_FOLDERS) if (!found && folder !== kind.folder) found = (await filesOn(env, ref, folder))[id];
    if (!found) return h.fail(404, 'The image file is missing.');
    const bytes = await blobBytes(h, env, found.sha);
    const info = imageInfo(bytes);
    if (!info) return h.fail(502, 'The stored file is not an image.');
    return new Response(bytes, { status: 200, headers: { 'Content-Type': CONTENT_TYPE[info.ext], 'Content-Disposition': 'inline' } });
  }

  /**
   * Uses an image already in the repository (Task M8): from the media library (also one still in the library's draft),
   * or another case study's or article's. { expectedSha, slot, index?, id, alt, caption? }, like `add` without the file.
   * The file itself is not copied: the entry refers to it by id. When the draft branch does not have it yet (a library
   * image not merged yet, or merged after this draft began), it is added to the draft in the same commit, unchanged, so
   * the draft builds on its own.
   */
  async function use(env, base, slug, request) {
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const expectedSha = version(body);
    if (!expectedSha) return h.fail(400, `The version you edited is missing. Reload the ${noun} and try again.`);
    if (!kind.slots.includes(body.slot)) return h.fail(400, 'Unknown image place.');
    const d = await newDraft(env, base, slug);
    if (d.error) return d.error;
    if (d.file.sha !== expectedSha) return h.fail(409, `This ${noun} changed since you opened it. Reload, then choose the image again.`, { conflict: true });

    const errors = {};
    const full = kind.full(d.doc, body.slot, body.index);
    if (full) errors.file = full;
    const found = typeof body.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.id) ? await h.locateImage(env, base, body.id) : null;
    if (!found) errors.file = errors.file ?? 'This image is not in the media library (any more). Reload the library and choose again.';
    const alt = texts(body.alt, 'alt', kind.altMax, true, errors);
    const caption = kind.captioned(body.slot) && hasText(body.caption) ? texts(body.caption, 'caption', kind.captionMax, true, errors) : null;
    if (Object.keys(errors).length) return h.fail(422, 'Some fields need attention.', { fields: errors });

    const info = imageInfo(await blobBytes(h, env, found.sha));
    if (!info) return h.fail(502, 'The stored file is not an image.');
    const changes = {};
    const onDraft = await h.repoRequest(env, 'GET', `/contents/${found.path}?${h.qs({ ref: d.branch })}`, { expect: [404] });
    if (onDraft.status === 404) changes[found.path] = { sha: found.sha };
    const next = structuredClone(d.doc);
    const replacing = kind.has(d.doc, body.slot, body.index);
    kind.set(next, body.slot, body.index, { id: found.id, width: info.width, height: info.height }, alt, caption);
    const what = kind.label[body.slot];
    return finish(env, base, slug, d, next, changes, `Draft: use ${found.id} from the media library as ${replacing ? 'the new' : 'a'} ${what} of ${slug} (TechPi Admin)`);
  }

  return { add, remove, get, use };
}
