/**
 * The media library (Task M8), from GET /api/media: the library's images and the images case studies and articles use,
 * with the library's open draft pull request. Shared by the Media page and the "Choose from the library" pickers in the
 * image dialogs, and reloaded after every library change.
 *
 * Small copies are fetched by content hash (a hash always means the same bytes), a few at a time, and kept for the
 * session: the admin's policy allows images from itself and data: URLs only, so each is held as a data: URL.
 */
import { api } from './api.js';

export const library = $state({ loaded: false, loading: false, error: null, items: [], pending: null });
export const thumbs = $state({}); // content hash -> data: URL, or null while loading

export async function loadLibrary() {
  if (library.loading) return;
  library.loading = true;
  try {
    const r = await api.listMedia();
    library.items = r.items;
    library.pending = r.pending;
    library.error = null;
    library.loaded = true;
  } catch (e) {
    library.error = e.message;
  } finally {
    library.loading = false;
  }
}

const queue = [];
let running = 0;
/** Asks for an image's small copy (or the image, by its `file` hash); it appears in `thumbs` when loaded. */
export function wantThumb(sha) {
  if (!sha || thumbs[sha] !== undefined) return;
  thumbs[sha] = null;
  queue.push(sha);
  pump();
}
function pump() {
  while (running < 4 && queue.length) {
    const sha = queue.shift();
    running++;
    api.getMediaBlob(sha)
      .then((url) => { thumbs[sha] = url; })
      .catch(() => { delete thumbs[sha]; })
      .finally(() => { running--; pump(); });
  }
}
/** Keeps a just-uploaded image's preview, so it shows without fetching it back. */
export const keepThumb = (sha, url) => { if (sha && url) thumbs[sha] = url; };

export const STATUS = {
  new: { label: 'New', hint: 'Uploaded to the library’s draft: kept in the library when its pull request is merged.' },
  removing: { label: 'Removing', hint: 'Removed in the library’s draft: gone when its pull request is merged.' },
  edited: { label: 'Edited', hint: 'Details changed in the library’s draft.' },
};
export const statusOf = (item) => (item.status === 'published' ? (item.edited ? 'edited' : null) : item.status);
export const placeOf = (u) => `${u.collection === 'case-studies' ? 'Case study' : 'Article'}: ${u.title}${u.draft && !u.published ? ' (draft)' : ''}`;
export const linkOf = (u) => `#/${u.collection === 'case-studies' ? 'case-studies' : 'articles'}/${u.slug}`;
