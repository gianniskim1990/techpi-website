<script>
  /**
   * The media library (Task M8), like the one in WordPress: upload images (several at once, or dropped on the page),
   * browse every image the website's case studies and articles can use, edit a library image's title and the default
   * alt text and caption a page starts from, and remove one no page uses. Every change is saved to the library's one
   * draft pull request on GitHub (worker/media.js); nothing is published until it is merged, and a library image is on
   * the website only once a page uses it. The images of case studies and articles are shown read-only.
   */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import Dialog from '../components/Dialog.svelte';
  import MediaGrid from '../components/MediaGrid.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { prepareImage, MAX_SIDE } from '../lib/images.js';
  import { library, loadLibrary, thumbs, wantThumb, keepThumb, STATUS, statusOf, placeOf, linkOf } from '../lib/media.svelte.js';

  $effect(() => { untrack(loadLibrary); });

  // ----- Browsing -----
  let q = $state('');
  let show = $state('all');
  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    return library.items.filter((it) => {
      if (term && ![it.title, it.id, it.alt?.en, it.alt?.el].some((v) => v?.toLowerCase().includes(term))) return false;
      if (show === 'library') return it.library;
      if (show === 'case-studies') return it.folder === 'projects';
      if (show === 'articles') return it.folder === 'insights';
      if (show === 'unused') return it.library && !it.usedBy.length;
      return true;
    });
  });
  const changes = $derived(library.items.filter((it) => statusOf(it)).length);

  // ----- Uploading -----
  let input = $state();
  let dragging = $state(false);
  let queue = $state([]); // { key, name, state: 'waiting'|'preparing'|'uploading'|'done'|'failed', message? }
  let uploading = $state(false);
  const titleFrom = (name) => {
    const t = name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 100) || 'Image';
  };
  function addFiles(list) {
    const files = [...(list ?? [])];
    if (!files.length) return;
    queue = [...queue.filter((x) => x.state !== 'done'), ...files.map((file, i) => ({ key: `${Date.now()}-${i}-${file.name}`, name: file.name, file, state: 'waiting' }))];
    run();
  }
  async function run() {
    if (uploading) return;
    uploading = true;
    let ok = 0;
    for (const job of queue) {
      if (job.state !== 'waiting') continue;
      try {
        job.state = 'preparing';
        const p = await prepareImage(job.file, { thumb: true });
        job.state = 'uploading';
        const r = await api.uploadMedia({ data: p.data, thumb: p.thumb, title: titleFrom(job.name) });
        keepThumb(r.item.thumb, `data:image/${p.thumb.startsWith('/9j/') ? 'jpeg' : 'webp'};base64,${p.thumb}`);
        keepThumb(r.item.file, p.preview);
        job.state = 'done';
        job.message = r.item.title;
        ok++;
      } catch (e) {
        job.state = 'failed';
        job.message = e.fields?.file ?? e.message;
      }
      delete job.file;
    }
    uploading = false;
    if (ok) {
      toast('success', ok === 1 ? 'Image added to the library' : `${ok} images added to the library`, 'Saved to the library’s draft pull request on GitHub. The website is not changed.');
      await loadLibrary();
    }
  }
  function drop(e) {
    e.preventDefault();
    dragging = false;
    addFiles(e.dataTransfer?.files);
  }

  // ----- One image -----
  let open = $state(false);
  let current = $state(null);
  let form = $state({ title: '', alt: { en: '', el: '' }, caption: { en: '', el: '' } });
  let errors = $state({});
  let saving = $state(false);
  let confirming = $state(false);
  let deleting = $state(false);
  function view(it) {
    current = it;
    form = { title: it.title, alt: { en: it.alt?.en ?? '', el: it.alt?.el ?? '' }, caption: { en: it.caption?.en ?? '', el: it.caption?.el ?? '' } };
    errors = {};
    confirming = false;
    wantThumb(it.file);
    open = true;
  }
  const editable = $derived(Boolean(current?.library && current.status !== 'removing' && current.sha));
  const dirty = $derived(current ? form.title !== current.title || ['alt', 'caption'].some((k) => ['en', 'el'].some((l) => form[k][l] !== (current[k]?.[l] ?? ''))) : false);
  async function save() {
    errors = {};
    saving = true;
    try {
      const r = await api.editMedia(current.id, { expectedSha: current.sha, ...form });
      toast('success', r.changed ? 'Details saved' : 'Nothing to save', r.changed ? 'Saved to the library’s draft pull request on GitHub.' : 'The details are unchanged.');
      open = false;
      await loadLibrary();
    } catch (e) {
      if (e.fields) errors = e.fields;
      toast('error', 'Details not saved', e.message);
    } finally {
      saving = false;
    }
  }
  async function remove() {
    if (!confirming) { confirming = true; return; }
    deleting = true;
    try {
      const r = await api.deleteMedia(current.id);
      toast('success', 'Image removed', r.published ? 'Its removal waits in the library’s draft pull request: it is gone when that is merged.' : 'It was taken out of the library’s draft again.');
      open = false;
      await loadLibrary();
    } catch (e) {
      toast('error', 'Image not removed', e.message);
    } finally {
      deleting = false;
      confirming = false;
    }
  }
  const day = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
  const len = (v) => (v ?? '').trim().length;
</script>

<svelte:window ondragover={(e) => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); dragging = true; } }} />

<header class="head">
  <div>
    <h1>Media</h1>
    <p class="sub">Upload images once and use them on any new case study or article. Library changes are saved as one draft pull request on GitHub; an image is on the website only once a page uses it.</p>
  </div>
  <div class="up">
    <input bind:this={input} class="visually-hidden" type="file" multiple accept="image/png,image/jpeg,image/webp" onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ''; }} tabindex="-1" aria-hidden="true" />
    <button class="btn btn-primary btn-sm" type="button" onclick={() => input.click()}><Icon name="upload" size={15} />Upload images</button>
  </div>
</header>

{#if library.pending}
  <div class="pending" role="status">
    <Icon name="branch" size={16} />
    <span>{changes ? `${changes} library ${changes === 1 ? 'change waits' : 'changes wait'}` : 'Library changes wait'} in draft pull request <a href={library.pending.url} target="_blank" rel="noopener">#{library.pending.number}</a>. Review and merge it on GitHub to keep them.</span>
  </div>
{/if}

{#if queue.length}
  <div class="card queue" aria-live="polite">
    <div class="qhead"><strong>Uploads</strong>{#if !uploading}<button class="btn btn-ghost btn-sm" type="button" onclick={() => (queue = [])}>Clear</button>{/if}</div>
    <ul>
      {#each queue as job (job.key)}
        <li class={job.state}>
          <span class="qname">{job.name}</span>
          <span class="qstate">
            {#if job.state === 'waiting'}Waiting{:else if job.state === 'preparing'}Preparing…{:else if job.state === 'uploading'}Saving to GitHub…{:else if job.state === 'done'}<Icon name="check" size={14} />Added as “{job.message}”{:else}<Icon name="alert" size={14} />{job.message}{/if}
          </span>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<div class="card" class:dragging role="region" aria-label="Media library" ondragleave={(e) => { if (e.currentTarget === e.target) dragging = false; }} ondrop={drop}>
  <div class="toolbar">
    <label class="search">
      <Icon name="search" size={16} />
      <span class="visually-hidden">Search</span>
      <input type="search" placeholder="Search titles and alt text…" bind:value={q} />
    </label>
    <label><span class="visually-hidden">Show</span>
      <select class="select" bind:value={show}>
        <option value="all">All images</option>
        <option value="library">Library uploads</option>
        <option value="unused">Library: not used</option>
        <option value="case-studies">Case study images</option>
        <option value="articles">Article images</option>
      </select>
    </label>
  </div>
  {#if dragging}<div class="drop" aria-hidden="true"><Icon name="upload" size={22} /><span>Drop images to add them to the library</span></div>{/if}

  {#if library.loading && !library.loaded}
    <p class="msg" aria-live="polite">Loading from GitHub…</p>
  {:else if library.error && !library.loaded}
    <div class="msg err" role="alert">
      <p><Icon name="alert" size={16} /><span>{library.error}</span></p>
      <button class="btn btn-secondary btn-sm" type="button" onclick={loadLibrary}>Try again</button>
    </div>
  {:else}
    {#if library.error}<p class="msg err" role="alert">The library could not be refreshed: {library.error}</p>{/if}
    <p class="resultcount" aria-live="polite">{rows.length === library.items.length ? `${library.items.length} images` : `${rows.length} of ${library.items.length}`}</p>
    <div class="body">
      {#if rows.length}
        <MediaGrid items={rows} onselect={view} />
      {:else if !library.items.length || show === 'library'}
        <button class="empty-drop" type="button" onclick={() => input.click()}>
          <Icon name="upload" size={22} />
          <strong>No library images yet</strong>
          <span>Choose images, or drop them here. They are resized to at most {MAX_SIDE} pixels and cleaned of location and camera data before upload.</span>
        </button>
      {:else}
        <p class="msg">No images match.</p>
      {/if}
    </div>
  {/if}
</div>
<p class="hint foot">Images are resized to at most {MAX_SIDE} pixels and cleaned of location and camera data in your browser before upload. The repository is public: so are its images.</p>

<Dialog bind:open title={current?.title ?? 'Image'} wide>
  {#if current}
    {@const st = statusOf(current)}
    <div class="detail">
      <div class="big">
        {#if thumbs[current.file] || thumbs[current.thumb]}<img src={thumbs[current.file] || thumbs[current.thumb]} alt="" />{:else}<span class="ph" aria-hidden="true"><Icon name="media" size={28} /></span>{/if}
        <dl>
          <div><dt>Size</dt><dd>{current.width && current.height ? `${current.width} × ${current.height}` : '—'} · {current.ext.toUpperCase()}</dd></div>
          {#if current.library}<div><dt>Uploaded</dt><dd>{day(current.uploaded)}</dd></div>{/if}
          <div><dt>Name</dt><dd><code>{current.id}</code></dd></div>
          {#if st}<div><dt>Status</dt><dd>{STATUS[st].label}: {STATUS[st].hint}</dd></div>{/if}
          <div><dt>Used by</dt><dd>
            {#if current.usedBy.length}
              <ul class="used">{#each current.usedBy as u (u.collection + u.slug)}<li><a href={linkOf(u)} onclick={() => (open = false)}>{placeOf(u)}</a></li>{/each}</ul>
            {:else}Not used on any page.{/if}
          </dd></div>
        </dl>
      </div>

      {#if editable}
        <div class="form">
          <div class="field">
            <label class="label" for="m-title"><span>Title</span><span class="meta">{len(form.title)}/100</span></label>
            <input class="input" id="m-title" bind:value={form.title} aria-invalid={errors.title ? 'true' : undefined} />
            {#if errors.title}<p class="error-text">{errors.title}</p>{:else}<p class="hint">Only in the admin, to find the image.</p>{/if}
          </div>
          <div class="two">
            {#each [['en', 'English'], ['el', 'Greek']] as [l, name] (l)}
              <div class="field">
                <label class="label" for="m-alt-{l}"><span>Alt text, {name} <span class="opt">(optional)</span></span><span class="meta">{len(form.alt[l])}/300</span></label>
                <textarea class="textarea" id="m-alt-{l}" lang={l} rows="2" bind:value={form.alt[l]} aria-invalid={errors[`alt.${l}`] ? 'true' : undefined}></textarea>
                {#if errors[`alt.${l}`]}<p class="error-text">{errors[`alt.${l}`]}</p>{/if}
              </div>
            {/each}
          </div>
          <div class="two">
            {#each [['en', 'English'], ['el', 'Greek']] as [l, name] (l)}
              <div class="field">
                <label class="label" for="m-cap-{l}"><span>Caption, {name} <span class="opt">(optional)</span></span><span class="meta">{len(form.caption[l])}/200</span></label>
                <input class="input" id="m-cap-{l}" lang={l} bind:value={form.caption[l]} aria-invalid={errors[`caption.${l}`] ? 'true' : undefined} />
                {#if errors[`caption.${l}`]}<p class="error-text">{errors[`caption.${l}`]}</p>{/if}
              </div>
            {/each}
          </div>
          <p class="hint">Alt text and caption are where a page starts when it uses this image; each page keeps its own, and changing them here does not change pages that already use it.</p>
        </div>
      {:else if current.library}
        <p class="note"><Icon name="info" size={15} />This image is being removed in the library’s draft.</p>
      {:else}
        <p class="note"><Icon name="lock" size={15} />This image belongs to {current.usedBy.length ? placeOf(current.usedBy[0]) : 'a case study or an article'}. It can be used on new pages from here; it is changed only through its own page.</p>
      {/if}
    </div>
  {/if}
  {#snippet actions()}
    {#if editable}
      <button class="btn btn-danger del" type="button" onclick={remove} disabled={deleting || current.usedBy.length > 0} aria-busy={deleting} title={current.usedBy.length ? 'Used by a page: remove it there first.' : undefined}>{confirming ? 'Confirm: remove from the library' : 'Remove from the library'}</button>
      <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Cancel</button>
      <button class="btn btn-primary" type="button" onclick={save} disabled={saving || !dirty} aria-busy={saving}>{saving ? 'Saving to GitHub…' : 'Save details'}</button>
    {:else}
      <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Close</button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .head { margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-start; justify-content: space-between; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 64ch; }
  .up .btn { display: inline-flex; align-items: center; gap: 6px; }
  .pending { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; padding: 10px 14px; border-radius: var(--radius); background: var(--blue-soft); color: var(--blue); font-size: var(--text-sm); }
  .queue { margin-bottom: 14px; padding: 10px 16px; }
  .qhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .queue ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: var(--text-sm); }
  .queue li { display: flex; justify-content: space-between; gap: 12px; }
  .qname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .qstate { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-align: right; }
  .done .qstate { color: var(--ok); }
  .failed .qstate { color: var(--danger); }
  .card { position: relative; }
  .card.dragging { outline: 2px dashed var(--blue); outline-offset: 2px; }
  .drop { position: absolute; inset: 0; z-index: 2; display: grid; place-content: center; justify-items: center; gap: 8px; border-radius: var(--radius-lg); background: rgb(231 237 250 / 0.92); color: var(--blue); font-weight: 600; pointer-events: none; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--rule-soft); }
  .search { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; max-width: 420px; padding: 0 11px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); color: var(--slate); }
  .search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .search input { border: 0; outline: none; background: transparent; flex: 1; padding: 8px 0; font-size: var(--text-md); color: var(--ink); min-width: 0; }
  .toolbar .select { width: auto; min-width: 170px; padding-top: 7px; padding-bottom: 7px; font-size: var(--text-base); }
  .msg { padding: 20px 16px; color: var(--slate); }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  .resultcount { padding: 10px 16px 0; color: var(--slate); font-size: var(--text-sm); }
  .body { padding: 10px 10px 16px; }
  .empty-drop { display: grid; justify-items: center; gap: 6px; width: 100%; padding: 36px 16px; border: 1px dashed var(--rule); border-radius: var(--radius-lg); background: none; color: var(--slate); font: inherit; text-align: center; cursor: pointer; }
  .empty-drop strong { color: var(--ink); }
  .empty-drop:hover { border-color: var(--blue); color: var(--blue); }
  .foot { margin-top: 12px; }
  .detail { display: grid; gap: 16px; }
  .big { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  .big img, .big .ph { display: block; width: 100%; max-height: 300px; object-fit: contain; border-radius: var(--radius); background: var(--rule-soft); border: 1px solid var(--rule-soft); }
  .big .ph { display: grid; place-items: center; aspect-ratio: 4 / 3; color: var(--slate); }
  dl { margin: 0; display: grid; gap: 8px; font-size: var(--text-sm); }
  dt { color: var(--slate); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .used { margin: 0; padding-left: 16px; }
  .form { display: grid; gap: 4px; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; margin-top: 14px; align-items: start; }
  .two > .field + .field { margin-top: 0; }
  .opt { color: var(--slate); font-weight: 400; }
  .note { display: flex; gap: 6px; align-items: flex-start; padding: 8px 12px; border-radius: var(--radius); background: var(--rule-soft); color: var(--graphite); font-size: var(--text-sm); }
  .del { margin-right: auto; }
  @media (max-width: 640px) {
    .big, .two { grid-template-columns: minmax(0, 1fr); }
    .search { max-width: none; }
    .toolbar label:last-child, .toolbar .select { width: 100%; }
  }
</style>
