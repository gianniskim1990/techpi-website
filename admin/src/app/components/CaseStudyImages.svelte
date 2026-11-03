<script>
  /**
   * The image places of a NEW case study (Task M6): the row image (Work page), the cover (top of the case study page) and
   * a gallery of up to eight images. Each upload, replacement or removal is saved to the draft on GitHub at once, as one
   * commit with the image file and the updated case study (worker/images.js). Alt text is required in English and Greek.
   * Disabled while the text has unsaved changes, so an image change never conflicts with them.
   */
  import Icon from './Icon.svelte';
  import Dialog from './Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { prepareImage, MAX_SIDE } from '../lib/images.js';

  let { slug, doc, sha, previews = {}, disabled = false, onchange } = $props();

  const GALLERY_MAX = 8;
  const PLACE = {
    image: { label: 'Row image', hint: 'Shown on the Work page.' },
    cover: { label: 'Cover', hint: 'Leads the case study page, edge to edge.' },
    gallery: { label: 'Gallery image', hint: 'Shown after the case study text.' },
  };

  let open = $state(false);
  let slot = $state('image');
  let prepared = $state(null);
  let preparing = $state(false);
  let fileError = $state(null);
  let alt = $state({ en: '', el: '' });
  let caption = $state({ en: '', el: '' });
  let errors = $state({});
  let busy = $state(false);
  let removing = $state(null);

  function start(s) {
    slot = s;
    prepared = null;
    fileError = null;
    errors = {};
    alt = { en: '', el: '' };
    caption = { en: '', el: '' };
    open = true;
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
    if (!prepared) { fileError = fileError ?? 'Choose an image file.'; return; }
    busy = true;
    try {
      const body = { expectedSha: sha, slot, data: prepared.data, alt };
      if (slot === 'cover' && (caption.en.trim() || caption.el.trim())) body.caption = caption;
      const r = await api.addCaseStudyImage(slug, body);
      open = false;
      toast('success', 'Image saved to the draft', 'Committed to the draft branch with the case study. The website is not changed.');
      onchange?.(r, prepared.preview);
    } catch (e) {
      if (e.fields) { errors = e.fields; if (e.fields.file) fileError = e.fields.file; }
      toast('error', 'Image not saved', e.message);
    } finally {
      busy = false;
    }
  }
  async function remove(s, index) {
    removing = `${s}-${index ?? ''}`;
    try {
      const r = await api.removeCaseStudyImage(slug, { expectedSha: sha, slot: s, index });
      toast('success', 'Image removed from the draft', 'The file was deleted from the draft branch.');
      onchange?.(r, null);
    } catch (e) {
      toast('error', 'Image not removed', e.message);
    } finally {
      removing = null;
    }
  }
  const gallery = $derived(doc.images.gallery ?? []);
</script>

{#snippet thumb(ref)}
  {#if previews[ref.id]}<img src={previews[ref.id]} alt="" />{:else}<span class="ph" aria-hidden="true"><Icon name="media" size={18} /></span>{/if}
{/snippet}

<div class="manager">
  <p class="hint lead">Upload images for this new case study. Each change is saved to the draft on GitHub at once; the website is not changed until the draft is merged. Images are resized to at most {MAX_SIDE} pixels and cleaned of location and camera data before upload.</p>
  {#if disabled}<p class="note" role="status"><Icon name="info" size={15} />Save or discard your text changes before changing images.</p>{/if}

  {#each ['image', 'cover'] as s (s)}
    {@const ref = doc.images[s]}
    <div class="row">
      <div class="pic">{#if ref}{@render thumb(ref)}{:else}<span class="ph empty" aria-hidden="true"><Icon name="plus" size={16} /></span>{/if}</div>
      <div class="info">
        <strong>{PLACE[s].label}</strong>
        <span class="hint">{ref ? `${ref.width} × ${ref.height}` : 'None'} · {PLACE[s].hint}</span>
      </div>
      <div class="acts">
        <button class="btn btn-secondary btn-sm" type="button" {disabled} onclick={() => start(s)}>{ref ? 'Replace' : 'Upload'}</button>
        {#if ref}<button class="btn btn-ghost btn-sm" type="button" disabled={disabled || removing !== null} aria-busy={removing === `${s}-`} onclick={() => remove(s)}>Remove</button>{/if}
      </div>
    </div>
  {/each}

  <div class="row gal">
    <div class="info">
      <strong>Gallery</strong>
      <span class="hint">{gallery.length}/{GALLERY_MAX} · {PLACE.gallery.hint}</span>
    </div>
    <div class="acts"><button class="btn btn-secondary btn-sm" type="button" disabled={disabled || gallery.length >= GALLERY_MAX} onclick={() => start('gallery')}><Icon name="plus" size={14} />Add image</button></div>
  </div>
  {#if gallery.length}
    <ol class="grid">
      {#each gallery as g, i (g.id)}
        <li>
          <div class="pic">{@render thumb(g)}</div>
          <span class="hint">{i + 1}. {g.width} × {g.height}</span>
          <button class="btn btn-ghost btn-sm" type="button" disabled={disabled || removing !== null} aria-busy={removing === `gallery-${i}`} aria-label="Remove gallery image {i + 1}" onclick={() => remove('gallery', i)}>Remove</button>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<Dialog bind:open title={slot === 'gallery' ? 'Add a gallery image' : `${doc.images[slot] ? 'Replace' : 'Upload'} the ${PLACE[slot].label.toLowerCase()}`} wide>
  <div class="form">
    <div class="field">
      <label class="label" for="img-file"><span>Image</span><span class="meta">PNG, JPEG or WebP</span></label>
      <input class="input" id="img-file" type="file" accept="image/png,image/jpeg,image/webp" onchange={choose} aria-invalid={fileError ? 'true' : undefined} />
      {#if preparing}<p class="hint" aria-live="polite">Preparing the image…</p>{/if}
      {#if fileError}<p class="error-text">{fileError}</p>{/if}
      {#if prepared}
        <div class="chosen"><img src={prepared.preview} alt="" /><p class="hint">{prepared.width} × {prepared.height} · {(prepared.size / 1024).toFixed(0)} KB · {prepared.type === 'image/webp' ? 'WebP' : 'JPEG'}</p></div>
      {/if}
    </div>
    <div class="two">
      <div class="field">
        <label class="label" for="img-alt-en"><span>Alt text, English</span><span class="meta">{alt.en.trim().length}/300</span></label>
        <textarea class="textarea" id="img-alt-en" lang="en" rows="2" bind:value={alt.en} aria-invalid={errors['alt.en'] ? 'true' : undefined}></textarea>
        {#if errors['alt.en']}<p class="error-text">{errors['alt.en']}</p>{:else}<p class="hint">Describe what the image shows.</p>{/if}
      </div>
      <div class="field">
        <label class="label" for="img-alt-el"><span>Alt text, Greek</span><span class="meta">{alt.el.trim().length}/300</span></label>
        <textarea class="textarea" id="img-alt-el" lang="el" rows="2" bind:value={alt.el} aria-invalid={errors['alt.el'] ? 'true' : undefined}></textarea>
        {#if errors['alt.el']}<p class="error-text">{errors['alt.el']}</p>{/if}
      </div>
    </div>
    {#if slot === 'cover'}
      <div class="two">
        <div class="field">
          <label class="label" for="img-cap-en"><span>Caption, English <span class="opt">(optional)</span></span></label>
          <input class="input" id="img-cap-en" lang="en" bind:value={caption.en} aria-invalid={errors['caption.en'] ? 'true' : undefined} />
          {#if errors['caption.en']}<p class="error-text">{errors['caption.en']}</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="img-cap-el"><span>Caption, Greek <span class="opt">(optional)</span></span></label>
          <input class="input" id="img-cap-el" lang="el" bind:value={caption.el} aria-invalid={errors['caption.el'] ? 'true' : undefined} />
          {#if errors['caption.el']}<p class="error-text">{errors['caption.el']}</p>{/if}
        </div>
      </div>
      <p class="hint">A caption is shown under the cover. Give it in both languages, or leave both empty.</p>
    {/if}
  </div>
  {#snippet actions()}
    <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Cancel</button>
    <button class="btn btn-primary" type="button" onclick={upload} disabled={busy || preparing} aria-busy={busy}>{busy ? 'Saving to GitHub…' : 'Save image'}</button>
  {/snippet}
</Dialog>

<style>
  .manager { display: grid; gap: 10px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--rule-soft); }
  .lead { margin: 0 0 4px; }
  .note { display: flex; gap: 6px; align-items: center; padding: 8px 12px; border-radius: var(--radius); background: var(--warn-soft); color: var(--warn); font-size: var(--text-sm); }
  .row { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 14px; align-items: center; }
  .row.gal { grid-template-columns: minmax(0, 1fr) auto; }
  .info { display: grid; gap: 2px; min-width: 0; }
  .acts { display: flex; gap: 6px; }
  .pic img, .ph { display: block; width: 88px; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .ph { display: grid; place-items: center; color: var(--slate); }
  .ph.empty { border-style: dashed; background: transparent; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .grid li { display: grid; gap: 4px; justify-items: start; }
  .grid .pic img, .grid .ph { width: 100%; }
  .form { display: grid; gap: 4px; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
  .chosen { display: grid; gap: 4px; margin-top: 10px; }
  .chosen img { max-width: 100%; max-height: 220px; object-fit: contain; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .opt { color: var(--slate); font-weight: 400; }
  @media (max-width: 640px) {
    .row { grid-template-columns: 64px minmax(0, 1fr); }
    .row .acts { grid-column: 1 / -1; }
    .pic img, .ph { width: 64px; }
    .two { grid-template-columns: minmax(0, 1fr); }
  }
</style>
