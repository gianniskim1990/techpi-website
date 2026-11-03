<script>
  /**
   * The image places of a NEW Insights article (Task M7): a cover between the head and the text, and one image after any
   * section's text. Each upload, replacement or removal is saved to the draft on GitHub at once, as one commit with the
   * image file and the updated article (worker/images.js). Alt text is required (English: articles are English only);
   * a caption is optional. Alt text and captions are then edited with the article's other text.
   * Disabled while the text has unsaved changes, so an image change never conflicts with them.
   * Each place takes a new upload or an image from the media library (Task M8), which is referred to, not copied.
   */
  import Icon from './Icon.svelte';
  import Dialog from './Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { prepareImage, MAX_SIDE } from '../lib/images.js';
  import MediaPicker from './MediaPicker.svelte';
  import { thumbs } from '../lib/media.svelte.js';

  let { slug, doc, sha, previews = {}, disabled = false, onchange } = $props();

  let open = $state(false);
  let place = $state({ slot: 'cover', index: undefined });
  let prepared = $state(null);
  let preparing = $state(false);
  let fileError = $state(null);
  let alt = $state('');
  let caption = $state('');
  let errors = $state({});
  let busy = $state(false);
  let removing = $state(null);
  let source = $state('upload'); // or 'library'
  let picked = $state(null);

  const refOf = (slot, index) => (slot === 'cover' ? doc.images?.cover : doc.images?.sections?.[String(index)]) ?? null;
  const places = $derived([
    { slot: 'cover', index: undefined, label: 'Cover', hint: 'Between the head and the text.' },
    ...doc.en.sections.map((s, i) => ({ slot: 'section', index: i, label: `Section ${i + 1}`, hint: s.heading || 'After this section’s text.' })),
  ]);
  const keyOf = (p) => `${p.slot}-${p.index ?? ''}`;

  function start(p) {
    place = { slot: p.slot, index: p.index, label: p.label };
    prepared = null;
    fileError = null;
    errors = {};
    alt = '';
    caption = '';
    source = 'upload';
    picked = null;
    open = true;
  }
  /** A library image: its default English alt text and caption fill the fields that are still empty. */
  function pick(item) {
    picked = item;
    fileError = null;
    if (!alt.trim() && item.alt?.en) alt = item.alt.en;
    if (!caption.trim() && item.caption?.en) caption = item.caption.en;
  }
  async function choose(e) {
    const file = e.currentTarget.files?.[0];
    prepared = null;
    fileError = null;
    if (!file) return;
    preparing = true;
    try { prepared = await prepareImage(file); } catch (err) { fileError = err.message; } finally { preparing = false; }
  }
  async function upload() {
    errors = {};
    const fromLibrary = source === 'library';
    if (fromLibrary ? !picked : !prepared) { fileError = fromLibrary ? 'Choose an image from the library.' : fileError ?? 'Choose an image file.'; return; }
    busy = true;
    try {
      const body = { expectedSha: sha, slot: place.slot, index: place.index, alt, ...(caption.trim() ? { caption } : {}), ...(fromLibrary ? { id: picked.id } : { data: prepared.data }) };
      const r = fromLibrary ? await api.useInsightImage(slug, body) : await api.addInsightImage(slug, body);
      open = false;
      toast('success', 'Image saved to the draft', 'Committed to the draft branch with the article. The website is not changed.');
      onchange?.(r, fromLibrary ? thumbs[picked.file] ?? thumbs[picked.thumb] ?? null : prepared.preview);
    } catch (e) {
      if (e.fields) { errors = e.fields; if (e.fields.file) fileError = e.fields.file; }
      toast('error', 'Image not saved', e.message);
    } finally {
      busy = false;
    }
  }
  async function remove(p) {
    removing = keyOf(p);
    try {
      const r = await api.removeInsightImage(slug, { expectedSha: sha, slot: p.slot, index: p.index });
      toast('success', 'Image removed from the draft', 'The file was deleted from the draft branch.');
      onchange?.(r, null);
    } catch (e) {
      toast('error', 'Image not removed', e.message);
    } finally {
      removing = null;
    }
  }
</script>

<div class="manager">
  <p class="hint lead">Add a cover and images after any section of this new article: upload them, or choose them from the media library. Each change is saved to the draft on GitHub at once; the website is not changed until the draft is merged. Images are resized to at most {MAX_SIDE} pixels and cleaned of location and camera data before upload.</p>
  {#if disabled}<p class="note" role="status"><Icon name="info" size={15} />Save or discard your text changes before changing images.</p>{/if}
  {#each places as p (keyOf(p))}
    {@const ref = refOf(p.slot, p.index)}
    <div class="row">
      <div class="pic">
        {#if ref && previews[ref.id]}<img src={previews[ref.id]} alt="" />{:else if ref}<span class="ph" aria-hidden="true"><Icon name="media" size={18} /></span>{:else}<span class="ph empty" aria-hidden="true"><Icon name="plus" size={16} /></span>{/if}
      </div>
      <div class="info">
        <strong>{p.label}</strong>
        <span class="hint">{ref ? `${ref.width} × ${ref.height}` : 'None'} · {p.hint}</span>
      </div>
      <div class="acts">
        <button class="btn btn-secondary btn-sm" type="button" {disabled} onclick={() => start(p)}>{ref ? 'Replace' : 'Add'}</button>
        {#if ref}<button class="btn btn-ghost btn-sm" type="button" disabled={disabled || removing !== null} aria-busy={removing === keyOf(p)} aria-label="Remove the image of {p.label}" onclick={() => remove(p)}>Remove</button>{/if}
      </div>
    </div>
  {/each}
</div>

<Dialog bind:open title={`${refOf(place.slot, place.index) ? 'Replace' : 'Add'} the image: ${place.label ?? ''}`} wide>
  <div class="form">
    <div class="segmented" role="radiogroup" aria-label="Image source">
      <button type="button" role="radio" aria-checked={source === 'upload'} onclick={() => { source = 'upload'; fileError = null; }}><Icon name="upload" size={14} />Upload a file</button>
      <button type="button" role="radio" aria-checked={source === 'library'} onclick={() => { source = 'library'; fileError = null; }}><Icon name="media" size={14} />Media library</button>
    </div>
    {#if source === 'library'}
      <MediaPicker selected={picked?.id ?? null} onpick={pick} />
      {#if fileError}<p class="error-text">{fileError}</p>{/if}
      {#if picked}<p class="hint">Chosen: <strong>{picked.title}</strong>{picked.width ? ` · ${picked.width} × ${picked.height}` : ''}. The article refers to the library image; nothing is uploaded again.</p>{/if}
    {:else}
    <div class="field">
      <label class="label" for="aimg-file"><span>Image</span><span class="meta">PNG, JPEG or WebP</span></label>
      <input class="input" id="aimg-file" type="file" accept="image/png,image/jpeg,image/webp" onchange={choose} aria-invalid={fileError ? 'true' : undefined} />
      {#if preparing}<p class="hint" aria-live="polite">Preparing the image…</p>{/if}
      {#if fileError}<p class="error-text">{fileError}</p>{/if}
      {#if prepared}
        <div class="chosen"><img src={prepared.preview} alt="" /><p class="hint">{prepared.width} × {prepared.height} · {(prepared.size / 1024).toFixed(0)} KB · {prepared.type === 'image/webp' ? 'WebP' : 'JPEG'}</p></div>
      {/if}
    </div>
    {/if}
    <div class="field">
      <label class="label" for="aimg-alt"><span>Alt text</span><span class="meta">{alt.trim().length}/300</span></label>
      <textarea class="textarea" id="aimg-alt" lang="en" rows="2" bind:value={alt} aria-invalid={errors.alt ? 'true' : undefined}></textarea>
      {#if errors.alt}<p class="error-text">{errors.alt}</p>{:else}<p class="hint">Describe what the image shows.</p>{/if}
    </div>
    <div class="field">
      <label class="label" for="aimg-cap"><span>Caption <span class="opt">(optional)</span></span><span class="meta">{caption.trim().length}/200</span></label>
      <input class="input" id="aimg-cap" lang="en" bind:value={caption} aria-invalid={errors.caption ? 'true' : undefined} />
      {#if errors.caption}<p class="error-text">{errors.caption}</p>{:else}<p class="hint">Shown under the image.</p>{/if}
    </div>
  </div>
  {#snippet actions()}
    <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Cancel</button>
    <button class="btn btn-primary" type="button" onclick={upload} disabled={busy || preparing} aria-busy={busy}>{busy ? 'Saving to GitHub…' : 'Save image'}</button>
  {/snippet}
</Dialog>

<style>
  .manager { display: grid; gap: 10px; }
  .lead { margin: 0 0 4px; }
  .note { display: flex; gap: 6px; align-items: center; padding: 8px 12px; border-radius: var(--radius); background: var(--warn-soft); color: var(--warn); font-size: var(--text-sm); }
  .row { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 14px; align-items: center; }
  .info { display: grid; gap: 2px; min-width: 0; }
  .info .hint { overflow-wrap: anywhere; }
  .acts { display: flex; gap: 6px; }
  .pic img, .ph { display: block; width: 88px; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .ph { display: grid; place-items: center; color: var(--slate); }
  .ph.empty { border-style: dashed; background: transparent; }
  .form { display: grid; gap: 4px; }
  .chosen { display: grid; gap: 4px; margin-top: 10px; }
  .chosen img { max-width: 100%; max-height: 220px; object-fit: contain; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .opt { color: var(--slate); font-weight: 400; }
  @media (max-width: 640px) {
    .row { grid-template-columns: 64px minmax(0, 1fr); }
    .row .acts { grid-column: 1 / -1; }
    .pic img, .ph { width: 64px; }
  }
</style>
