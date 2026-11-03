<script>
  /**
   * Connected editor for any of the 18 case studies (Tasks M1A and M1B). Loads through the admin's API, checks the fields
   * as you type with the same rules the Worker enforces on save, and saves as a draft: a commit on the case study's own
   * draft branch and one draft pull request, which repeated saves update. Case studies have different sections; the
   * editor shows the ones this case study has. Facts, images and the set of sections are locked. No publishing.
   */
  import Icon from '../components/Icon.svelte';
  import PublishPanel from '../components/PublishPanel.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';
  import { FIELDS, LOCALES, validateEditable } from '../../../shared/case-study-content.js';

  let { slug } = $props();
  // Thumbnails of the project captures (480 px WebP copies of src/assets/projects, made for the admin).
  const thumbs = import.meta.glob('../thumbs/*.webp', { eager: true, query: '?url', import: 'default' });
  const media = (id) => thumbs[`../thumbs/${id}.webp`] ?? null;
  const CAPABILITY = { 'digital-products': 'Digital products', 'web-experiences': 'Web experiences', intelligence: 'Intelligence', 'digital-visibility': 'Digital visibility' };

  let load = $state({ loading: true, error: null });
  let doc = $state(null); // the full stored document: facts and images are shown, never edited
  let form = $state(null); // { en, el }: the editable text
  let baseline = $state('');
  let sha = $state(null);
  let source = $state('published');
  let draft = $state(null);
  let elsewhere = $state(null); // an open draft PR for this item that targets another branch
  let isNew = $state(false); // created in the admin, not on the content branch yet (Task M5)
  let lang = $state('en');
  let tried = $state(false);
  let saving = $state(false);
  let saveError = $state(null);
  let conflictOpen = $state(false);
  let serverErrors = $state({});

  const copy = (v) => JSON.parse(JSON.stringify(v));
  async function fetchEntry() {
    load = { loading: true, error: null };
    try {
      const r = await api.getCaseStudy(slug);
      doc = r.content;
      form = Object.fromEntries(LOCALES.map((l) => [l, copy(r.content[l])]));
      baseline = JSON.stringify(form);
      sha = r.sha;
      source = r.source;
      draft = r.draft;
      elsewhere = r.elsewhere ?? null;
      isNew = Boolean(r.isNew);
      tried = false;
      serverErrors = {};
      saveError = null;
      load = { loading: false, error: null };
    } catch (e) {
      load = { loading: false, error: e.message };
    }
  }
  fetchEntry();
  if (!caseStudies.loaded) loadCaseStudies(); // how many case studies there are, for the position

  const dirty = $derived(form ? JSON.stringify(form) !== baseline : false);
  const check = $derived(form && doc ? validateEditable(form, doc) : { ok: true, errors: {} });
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const c = $derived(form?.[lang]);
  /** Whether this case study has a section (its structure is the English file's; Greek has the same). */
  const has = (k) => doc?.en?.[k] !== undefined;
  const err = (k) => errors[`${lang}.${k}`];
  const listErrors = (k) => {
    const out = { _: errors[`${lang}.${k}`] };
    for (const key of Object.keys(errors)) if (key.startsWith(`${lang}.${k}.`)) out[key.slice(`${lang}.${k}.`.length)] = errors[key];
    return out;
  };
  const len = (k) => (c?.[k] ?? '').trim().length;
  const langHasErrors = (l) => Object.keys(errors).some((k) => k.startsWith(`${l}.`));
  const LISTS = [
    { key: 'highlights', label: 'Highlights', hint: 'Short labels shown on the Work page.', add: 'Add highlight' },
    { key: 'disciplines', label: 'Disciplines', hint: 'Short labels shown on the Work page.', add: 'Add discipline' },
  ];
  const STUDY_LISTS = [
    { key: 'builtItems', label: 'What was built', add: 'Add item' },
    { key: 'services', label: 'Services', add: 'Add service' },
    { key: 'technology', label: 'Technology', add: 'Add technology' },
    { key: 'outcome', label: 'Outcome', add: 'Add outcome', hint: 'Only outcomes the client has stated, in words.' },
  ];
  const LABEL = { highlights: 'Highlights', disciplines: 'Disciplines', overview: 'Overview', need: 'The need', builtItems: 'What was built', services: 'Services', technology: 'Technology', outcome: 'Outcome' };
  // The two languages describe the same page: warn at once when a list has a different number of items.
  const mismatches = $derived(form ? Object.entries(FIELDS).filter(([k, r]) => r.kind === 'list' && Array.isArray(form.en[k]) && Array.isArray(form.el[k]) && form.en[k].length !== form.el[k].length).map(([k]) => k) : []);

  const prefix = $derived(lang === 'el' ? '/el' : '');
  const pageUrl = $derived(`https://techpi.eu${prefix}/work/${slug}`);
  // The same rules the site uses (src/content/seo.ts, caseStudyMeta): there are no separate SEO fields for case studies.
  const seoTitle = $derived.by(() => {
    if (!c || !doc) return '';
    const full = `${doc.facts.name} — ${c.category} | TechPi`;
    return full.length <= 70 ? full : `${doc.facts.name} | ${lang === 'el' ? 'Έργα' : 'Work'} | TechPi`;
  });
  const seoDescription = $derived(c && doc ? c.summary + (doc.facts.workGroup === 'earlier' ? (lang === 'el' ? ' Παλαιότερο έργο της pigiota314.' : ' Earlier work by pigiota314.') : '') : '');
  const hasImages = $derived(Boolean(doc && (doc.images.image || doc.images.cover || doc.images.gallery)));
  const sameImage = $derived(Boolean(doc?.images.image && doc?.images.cover && doc.images.image.id === doc.images.cover.id));

  async function save() {
    tried = true;
    serverErrors = {};
    saveError = null;
    if (!check.ok) {
      const firstLang = LOCALES.find((l) => Object.keys(check.errors).some((k) => k.startsWith(`${l}.`)));
      if (firstLang && !Object.keys(check.errors).some((k) => k.startsWith(`${lang}.`))) lang = firstLang;
      toast('error', 'Not saved', 'Some fields need attention.');
      return;
    }
    saving = true;
    try {
      const r = await api.saveCaseStudyDraft(slug, form, sha);
      sha = r.sha;
      baseline = JSON.stringify(form);
      if (r.changed) {
        draft = r.draft;
        source = 'draft';
        toast('success', 'Draft saved to GitHub', `Committed to the draft branch. Draft pull request #${r.draft?.number} is up to date. The website is not changed.`);
        loadCaseStudies();
      } else {
        toast('info', 'Nothing to save', 'This version is the same as the one on GitHub.');
      }
    } catch (e) {
      if (e.conflict) conflictOpen = true;
      else if (e.fields) { serverErrors = e.fields; toast('error', 'Not saved', e.message); }
      else { saveError = e.message; toast('error', 'Not saved', e.message); }
    } finally {
      saving = false;
    }
  }
  function discard() { form = JSON.parse(baseline); tried = false; serverErrors = {}; }

  $effect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });
</script>

{#snippet textField(key, label, hint, rows = 0)}
  <div class="field">
    <label class="label" for="f-{key}"><span>{label}</span><span class="meta" class:over={len(key) > FIELDS[key].max}>{len(key)}/{FIELDS[key].max}</span></label>
    {#if rows}
      <textarea class="textarea" id="f-{key}" {lang} {rows} bind:value={form[lang][key]} aria-invalid={err(key) ? 'true' : undefined}></textarea>
    {:else}
      <input class="input" id="f-{key}" {lang} bind:value={form[lang][key]} aria-invalid={err(key) ? 'true' : undefined} />
    {/if}
    {#if err(key)}<p class="error-text">{err(key)}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
  </div>
{/snippet}

{#snippet listField(l, multiline = false)}
  <div class="field">
    {#key lang}<ListEditor bind:items={form[lang][l.key]} label={l.label} id="f-{l.key}" {lang} {multiline} itemMax={FIELDS[l.key].itemMax} min={FIELDS[l.key].min} max={FIELDS[l.key].max} errors={listErrors(l.key)} addLabel={l.add} hint={l.hint ?? ''} />{/key}
  </div>
{/snippet}

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/case-studies"><Icon name="back" size={16} />Case studies</a>
</nav>

{#if load.loading}
  <p class="hint loading" aria-live="polite">Loading from GitHub…</p>
{:else if load.error}
  <div class="card msg" role="alert">
    <p class="error-text">{load.error}</p>
    <button class="btn btn-secondary btn-sm" type="button" onclick={fetchEntry}>Try again</button>
  </div>
{:else}
  <header class="head">
    <h1>{doc.facts.name}</h1>
    <div class="sub">
      <StatusBadge status={draft ? 'changes' : 'published'} />
      <span class="connected"><Icon name="branch" size={13} />Connected to GitHub</span>
      {#if isNew}<span class="newtag" title="Published when its draft pull request is merged">New, not on the website yet</span>{/if}
      <span class="hint">{source === 'draft' ? 'Showing the saved draft' : 'Showing the version on the development branch'}</span>
      {#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{/if}
    </div>
  </header>

  {#if elsewhere}
    <p class="blocked" role="alert"><Icon name="alert" size={16} /><span>This item already has an open draft pull request (<a href={elsewhere.url} target="_blank" rel="noopener">#{elsewhere.number}</a>) for another branch ({elsewhere.base}). Saving is blocked until it is closed or merged on GitHub, so nothing is overwritten.</span></p>
  {/if}

  <div class="layout">
    <div class="col">
      <div class="langs" role="tablist" aria-label="Language">
        {#each LOCALES as l}
          <button role="tab" type="button" aria-selected={lang === l} class:has-errors={langHasErrors(l)} onclick={() => (lang = l)}>{l === 'en' ? 'English' : 'Greek'}</button>
        {/each}
      </div>

      {#if mismatches.length}
        <p class="parity" role="status"><Icon name="alert" size={16} /><span>English and Greek differ in the number of items in: {mismatches.map((k) => LABEL[k]).join(', ')}. Keep them the same to save.</span></p>
      {/if}
      {#if tried && errors.entry}<p class="error-text" role="alert">{errors.entry}</p>{/if}

      <section class="card" aria-labelledby="listing-h">
        <div class="card-head"><h2 id="listing-h">Work page and summary</h2></div>
        <div class="card-body">
          {@render textField('category', 'Category', 'Shown above the project name and in the page title.')}
          {@render textField('summary', 'Summary', 'Shown on the Work page and as the page description in search results.', 3)}
          {#each LISTS.filter((l) => has(l.key)) as l (l.key)}{@render listField(l)}{/each}
        </div>
      </section>

      <section class="card" aria-labelledby="content-h">
        <div class="card-head"><h2 id="content-h">Case study</h2></div>
        <div class="card-body">
          {@render listField({ key: 'overview', label: 'Overview', add: 'Add paragraph' }, true)}
          {@render listField({ key: 'need', label: 'The need', add: 'Add paragraph' }, true)}
          {#if has('builtIntro')}{@render textField('builtIntro', 'What was built: introduction', 'Shown before the list, or on its own when there is no list.', 3)}{/if}
          {#each STUDY_LISTS.filter((l) => has(l.key)) as l (l.key)}{@render listField(l)}{/each}
          <p class="hint sections"><Icon name="lock" size={13} />This case study’s sections are fixed: text and the number of items can change, but sections cannot be added or removed here.</p>
        </div>
      </section>

      <section class="card" aria-labelledby="img-h">
        <div class="card-head"><h2 id="img-h">Images</h2>{#if hasImages}<span class="lock"><Icon name="lock" size={14} />Files are locked; alt text is editable</span>{/if}</div>
        {#if !hasImages}
          <div class="card-body"><p class="hint">This case study has no images: its page is led by typography. Adding images arrives with the media library.</p></div>
        {:else}
          <div class="card-body images">
            {#if doc.images.image || doc.images.cover}
              {@const shown = doc.images.cover ?? doc.images.image}
              <div class="shot">
                {#if media(shown.id)}<img src={media(shown.id)} alt="" loading="lazy" />{/if}
                <p class="hint">{sameImage ? 'Row image and cover' : doc.images.cover ? 'Cover' : 'Row image'}: <code>{shown.id}</code></p>
                {#if doc.images.image && doc.images.cover && !sameImage}<p class="hint">Row image: <code>{doc.images.image.id}</code></p>{/if}
              </div>
              <div class="alts">
                {#if doc.images.image}{@render textField('imageAlt', 'Row image alt text', 'Used on the homepage and the Work page.', 3)}{/if}
                {#if doc.images.cover}{@render textField('coverAlt', 'Cover alt text', '', 3)}{/if}
                {#if has('coverCaption')}{@render textField('coverCaption', 'Cover caption', 'Shown under the cover image.', 2)}{/if}
              </div>
            {/if}
            {#each doc.images.gallery ?? [] as g, i}
              <div class="shot">
                {#if media(g.id)}<img src={media(g.id)} alt="" loading="lazy" />{/if}
                <p class="hint">Gallery image {i + 1}: <code>{g.id}</code></p>
              </div>
              <div class="alts">
                <div class="field">
                  <label class="label" for="f-galt-{i}"><span>Gallery image {i + 1} alt text</span><span class="meta">{(c.galleryAlts[i] ?? '').trim().length}/{FIELDS.galleryAlts.itemMax}</span></label>
                  <textarea class="textarea" id="f-galt-{i}" {lang} rows="3" bind:value={form[lang].galleryAlts[i]} aria-invalid={errors[`${lang}.galleryAlts.${i}`] || err('galleryAlts') ? 'true' : undefined}></textarea>
                  {#if errors[`${lang}.galleryAlts.${i}`] || err('galleryAlts')}<p class="error-text">{errors[`${lang}.galleryAlts.${i}`] ?? err('galleryAlts')}</p>{/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card" aria-labelledby="seo-h">
        <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
        <div class="card-body seo">
          <dl class="seo-facts">
            <div><dt>Page title</dt><dd>{seoTitle}</dd></div>
            <div><dt>Description</dt><dd>{seoDescription}</dd></div>
            <div><dt>Canonical URL</dt><dd>{pageUrl}</dd></div>
            <div><dt>Other language</dt><dd>Linked automatically ({lang === 'en' ? 'Greek' : 'English'} version)</dd></div>
            <div><dt>Sitemap</dt><dd>Included automatically</dd></div>
          </dl>
          <div class="seo-side">
            <SeoSnippet title={seoTitle} description={seoDescription} url={pageUrl} />
            <p class="hint">The title and description are generated from the project name, category and summary. Case studies have no separate SEO fields, so editing the category or summary changes them.</p>
          </div>
        </div>
      </section>
    </div>

    <aside class="rail" aria-label="Saving">
      <section class="card">
        <div class="card-body rail-body">
          <div class="actions">
            <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving} aria-busy={saving}>{saving ? 'Saving to GitHub…' : 'Save draft'}</button>
            {#if dirty && !saving}<button class="btn btn-ghost" type="button" onclick={discard}>Discard changes</button>{/if}
          </div>
          <PublishPanel {draft} />
          {#if saveError}<p class="error-text" role="alert">{saveError}</p>{/if}
          {#if tried && !check.ok}<p class="error-text">Fix the highlighted fields to save.</p>{/if}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Draft</h2></div>
        <div class="card-body draftinfo">
          {#if draft}
            <p><Icon name="branch" size={15} /><code>{draft.branch}</code></p>
            <a class="btn btn-secondary btn-sm" href={draft.url} target="_blank" rel="noopener">Draft pull request #{draft.number}<Icon name="external" size={14} /></a>
          {:else}
            <p class="hint">No open draft. The first save creates this case study’s draft branch and one draft pull request; later saves update it.</p>
          {/if}
          <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: saved drafts, their text and their history are visible to anyone on GitHub, even though the website is unchanged.</span></p>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Locked details</h2></div>
        <div class="card-body">
          <dl class="facts">
            <div><dt>URL</dt><dd><Icon name="lock" size={13} /> /work/{slug}</dd></div>
            {#if doc.facts.client}<div><dt>Client</dt><dd>{doc.facts.client}{#if doc.facts.clientEl}<br /><span class="dim" lang="el">{doc.facts.clientEl}</span>{/if}</dd></div>{/if}
            <div><dt>Year</dt><dd>{doc.facts.year}</dd></div>
            <div><dt>Group</dt><dd>{doc.facts.workGroup === 'client' ? 'Client project' : 'Earlier work by pigiota314'}</dd></div>
            <div><dt>Featured</dt><dd>{doc.facts.featured ? 'Yes, on the homepage' : 'No'}</dd></div>
            <div><dt>Position</dt><dd>{doc.facts.order}{#if caseStudies.loaded} of {caseStudies.entries.length}{/if} in Work-page order</dd></div>
            <div><dt>Capabilities</dt><dd>{doc.facts.capabilities.length ? doc.facts.capabilities.map((x) => CAPABILITY[x] ?? x).join(', ') : 'None'}</dd></div>
            {#if doc.facts.liveUrl}<div><dt>Live site</dt><dd><a href={doc.facts.liveUrl} target="_blank" rel="noopener">{doc.facts.liveUrl.replace('https://', '')}</a></dd></div>{/if}
          </dl>
          <p class="hint">These are not editable here. Changing an address needs a redirect, which arrives with publishing.</p>
          {#if !isNew}<a class="live" href="https://techpi.eu/work/{slug}" target="_blank" rel="noopener"><Icon name="external" size={15} />View the live page</a>{/if}
        </div>
      </section>
    </aside>
  </div>

  <div class="mobilebar" role="region" aria-label="Save">
    <span class="mb-status">{#if saving}Saving…{:else if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{:else}All changes saved{/if}</span>
    <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving}>Save draft</button>
  </div>

  <Dialog bind:open={conflictOpen} title="This case study changed on GitHub">
    <p>A newer version was saved after you opened this page. Your change was not saved, so nothing was overwritten.</p>
    <p class="hint">Copy any text you want to keep, then reload to see the latest version.</p>
    {#snippet actions()}
      <button class="btn btn-secondary" type="button" onclick={() => (conflictOpen = false)}>Keep editing</button>
      <button class="btn btn-primary" type="button" onclick={() => { conflictOpen = false; fetchEntry(); }}>Reload latest version</button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .blocked { display: flex; gap: 8px; align-items: flex-start; margin: 0 0 16px; padding: 10px 14px; border-radius: var(--radius); background: var(--danger-soft, #fbe9e7); color: var(--danger); font-size: var(--text-sm); }
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .loading { margin-top: 16px; }
  .msg { padding: 20px; display: grid; gap: 12px; justify-items: start; margin-top: 16px; }
  .head { margin: 8px 0 20px; }
  .sub { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 8px; }
  .newtag { display: inline-flex; padding: 2px 9px; border-radius: 999px; background: var(--cyan); color: var(--ink); font-size: var(--text-xs); font-weight: 600; }
  .connected { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; background: var(--ok-soft); color: var(--ok); font-size: var(--text-xs); font-weight: 600; }
  .unsaved { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--warn); font-weight: 500; }
  .unsaved .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .langs { display: flex; gap: 4px; border-bottom: 1px solid var(--rule); }
  .langs button { position: relative; padding: 10px 14px; border: 0; background: none; color: var(--slate); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .langs button[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--blue); }
  .langs button.has-errors::after { content: ''; position: absolute; top: 9px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
  .parity { display: flex; gap: 8px; align-items: flex-start; padding: 10px 14px; border-radius: var(--radius); background: var(--warn-soft); color: var(--warn); font-size: var(--text-sm); }
  .sections { display: flex; gap: 6px; align-items: flex-start; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--rule-soft); }
  .lock { display: inline-flex; align-items: center; gap: 5px; color: var(--slate); font-size: var(--text-sm); }
  .images { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px 20px; align-items: start; }
  .shot img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .shot .hint { margin-top: 6px; overflow-wrap: anywhere; }
  .alts { display: grid; gap: 14px; }
  .alts .field + .field { margin-top: 0; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .seo-side { display: grid; gap: 10px; }
  .seo-facts, .facts { margin: 0; display: grid; gap: 10px; font-size: var(--text-sm); }
  .seo-facts dt, .facts dt { color: var(--slate); }
  .seo-facts dd, .facts dd { margin: 0; overflow-wrap: anywhere; }
  .facts { margin-bottom: 12px; }
  .facts div { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 8px; }
  .dim { color: var(--slate); }
  .live { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: var(--text-sm); font-weight: 500; text-decoration: none; }
  .rail { position: sticky; top: 20px; display: grid; gap: 16px; }
  .rail-body { display: grid; gap: 10px; }
  .actions { display: grid; gap: 8px; }
  .actions .btn, .rail-body > .btn { width: 100%; }
  .draftinfo { display: grid; gap: 12px; justify-items: start; }
  .draftinfo p { display: flex; gap: 6px; align-items: flex-start; }
  .warn { padding-top: 12px; border-top: 1px solid var(--rule-soft); }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; overflow-wrap: anywhere; }
  .mobilebar { display: none; }
  @media (max-width: 1100px) {
    .layout { grid-template-columns: minmax(0, 1fr); padding-bottom: 72px; }
    .rail { position: static; }
    .seo { grid-template-columns: minmax(0, 1fr); }
    .mobilebar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--sheet); border-top: 1px solid var(--rule); box-shadow: 0 -4px 16px rgb(8 14 30 / 0.06); }
    .mb-status { font-size: var(--text-sm); color: var(--slate); }
  }
  @media (max-width: 640px) { .images { grid-template-columns: minmax(0, 1fr); } }
</style>
