<script>
  /**
   * Connected editor for an admin-managed case study (Task M1A: Rocketeer). Loads through the admin's API, checks the
   * fields as you type with the same rules the Worker enforces on save, and saves as a draft: a commit on the case
   * study's draft branch and one draft pull request, which repeated saves update. The facts and images are locked.
   * Publishing is not part of M1A.
   */
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { FIELDS, LOCALES, validateEditable } from '../../../shared/case-study-content.js';

  let { slug } = $props();
  const media = (id) => new URL(`../demo/media/${id}.webp`, import.meta.url).href;

  let load = $state({ loading: true, error: null });
  let doc = $state(null); // the full stored document: facts and images are shown, never edited
  let form = $state(null); // { en, el }: the editable text
  let baseline = $state('');
  let sha = $state(null);
  let source = $state('published');
  let draft = $state(null);
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
      tried = false;
      serverErrors = {};
      saveError = null;
      load = { loading: false, error: null };
    } catch (e) {
      load = { loading: false, error: e.message };
    }
  }
  fetchEntry();

  const dirty = $derived(form ? JSON.stringify(form) !== baseline : false);
  const check = $derived(form && doc ? validateEditable(form, doc.images) : { ok: true, errors: {} });
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const c = $derived(form?.[lang]);
  const other = $derived(form?.[lang === 'en' ? 'el' : 'en']);
  const err = (k) => errors[`${lang}.${k}`];
  const listErrors = (k) => {
    const out = { _: errors[`${lang}.${k}`] };
    for (const key of Object.keys(errors)) if (key.startsWith(`${lang}.${k}.`)) out[key.slice(`${lang}.${k}.`.length)] = errors[key];
    return out;
  };
  const len = (k) => (c?.[k] ?? '').trim().length;
  const langHasErrors = (l) => Object.keys(errors).some((k) => k.startsWith(`${l}.`));
  // The two languages describe the same page: warn at once when a list has a different number of items.
  const mismatches = $derived(form ? Object.entries(FIELDS).filter(([k, r]) => r.kind === 'list' && form.en[k].length !== form.el[k].length).map(([k]) => k) : []);
  const LABEL = { overview: 'Overview', need: 'The need', builtItems: 'What was built', technology: 'Technology', outcome: 'Outcome' };

  const prefix = $derived(lang === 'el' ? '/el' : '');
  const pageUrl = $derived(`https://techpi.eu${prefix}/work/${slug}`);
  // The same rule the site uses for the page title (src/content/seo.ts): there are no separate SEO fields for case studies.
  const seoTitle = $derived.by(() => {
    if (!c || !doc) return '';
    const full = `${doc.facts.name} — ${c.category} | TechPi`;
    return full.length <= 70 ? full : `${doc.facts.name} | ${lang === 'el' ? 'Έργα' : 'Work'} | TechPi`;
  });

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
      <span class="hint">{source === 'draft' ? 'Showing the saved draft' : 'Showing the version on the development branch'}</span>
      {#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{/if}
    </div>
  </header>

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

      <section class="card" aria-labelledby="content-h">
        <div class="card-head"><h2 id="content-h">Content</h2></div>
        <div class="card-body">
          <div class="field">
            <label class="label" for="f-cat"><span>Category</span><span class="meta" class:over={len('category') > FIELDS.category.max}>{len('category')}/{FIELDS.category.max}</span></label>
            <input class="input" id="f-cat" {lang} bind:value={form[lang].category} aria-invalid={err('category') ? 'true' : undefined} />
            {#if err('category')}<p class="error-text">{err('category')}</p>{:else}<p class="hint">Shown above the project name and in the page title.</p>{/if}
          </div>
          <div class="field">
            <label class="label" for="f-sum"><span>Summary</span><span class="meta" class:over={len('summary') > FIELDS.summary.max}>{len('summary')}/{FIELDS.summary.max}</span></label>
            <textarea class="textarea" id="f-sum" {lang} rows="3" bind:value={form[lang].summary} aria-invalid={err('summary') ? 'true' : undefined}></textarea>
            {#if err('summary')}<p class="error-text">{err('summary')}</p>{:else}<p class="hint">Shown on the Work page and as the page description in search results.</p>{/if}
          </div>
          <div class="field">
            {#key lang}<ListEditor bind:items={form[lang].overview} label="Overview" id="f-overview" {lang} multiline itemMax={FIELDS.overview.itemMax} min={FIELDS.overview.min} max={FIELDS.overview.max} errors={listErrors('overview')} addLabel="Add paragraph" />{/key}
          </div>
          <div class="field">
            {#key lang}<ListEditor bind:items={form[lang].need} label="The need" id="f-need" {lang} multiline itemMax={FIELDS.need.itemMax} min={FIELDS.need.min} max={FIELDS.need.max} errors={listErrors('need')} addLabel="Add paragraph" />{/key}
          </div>
          <div class="field">
            <label class="label" for="f-intro"><span>What was built: introduction (optional)</span><span class="meta">{len('builtIntro')}/{FIELDS.builtIntro.max}</span></label>
            <input class="input" id="f-intro" {lang} bind:value={form[lang].builtIntro} aria-invalid={err('builtIntro') ? 'true' : undefined} />
            {#if err('builtIntro')}<p class="error-text">{err('builtIntro')}</p>{:else}<p class="hint">Leave empty in both languages for none. It is shown before the list.</p>{/if}
          </div>
          <div class="field">
            {#key lang}<ListEditor bind:items={form[lang].builtItems} label="What was built" id="f-built" {lang} itemMax={FIELDS.builtItems.itemMax} min={FIELDS.builtItems.min} max={FIELDS.builtItems.max} errors={listErrors('builtItems')} addLabel="Add item" />{/key}
          </div>
          <div class="field">
            {#key lang}<ListEditor bind:items={form[lang].technology} label="Technology" id="f-tech" {lang} itemMax={FIELDS.technology.itemMax} min={FIELDS.technology.min} max={FIELDS.technology.max} errors={listErrors('technology')} addLabel="Add technology" />{/key}
          </div>
          <div class="field">
            {#key lang}<ListEditor bind:items={form[lang].outcome} label="Outcome" id="f-outcome" {lang} itemMax={FIELDS.outcome.itemMax} min={FIELDS.outcome.min} max={FIELDS.outcome.max} errors={listErrors('outcome')} addLabel="Add outcome" hint="Only outcomes the client has stated, in words." />{/key}
          </div>
        </div>
      </section>

      <section class="card" aria-labelledby="img-h">
        <div class="card-head"><h2 id="img-h">Images</h2><span class="lock"><Icon name="lock" size={14} />Files are locked; alt text is editable</span></div>
        <div class="card-body images">
          <div class="shot">
            <img src={media(doc.images.cover.id)} alt="" loading="lazy" />
            <p class="hint">Row image and cover: <code>{doc.images.image.id}</code></p>
          </div>
          <div class="alts">
            <div class="field">
              <label class="label" for="f-ialt"><span>Row image alt text</span><span class="meta">{len('imageAlt')}/{FIELDS.imageAlt.max}</span></label>
              <textarea class="textarea" id="f-ialt" {lang} rows="3" bind:value={form[lang].imageAlt} aria-invalid={err('imageAlt') ? 'true' : undefined}></textarea>
              {#if err('imageAlt')}<p class="error-text">{err('imageAlt')}</p>{:else}<p class="hint">Used on the homepage and the Work page.</p>{/if}
            </div>
            <div class="field">
              <label class="label" for="f-calt"><span>Cover alt text</span><span class="meta">{len('coverAlt')}/{FIELDS.coverAlt.max}</span></label>
              <textarea class="textarea" id="f-calt" {lang} rows="3" bind:value={form[lang].coverAlt} aria-invalid={err('coverAlt') ? 'true' : undefined}></textarea>
              {#if err('coverAlt')}<p class="error-text">{err('coverAlt')}</p>{/if}
            </div>
          </div>
          {#each doc.images.gallery as g, i}
            <div class="shot">
              <img src={media(g.id)} alt="" loading="lazy" />
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
      </section>

      <section class="card" aria-labelledby="seo-h">
        <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
        <div class="card-body seo">
          <dl class="seo-facts">
            <div><dt>Page title</dt><dd>{seoTitle}</dd></div>
            <div><dt>Description</dt><dd>{c.summary}</dd></div>
            <div><dt>Canonical URL</dt><dd>{pageUrl}</dd></div>
            <div><dt>Other language</dt><dd>Linked automatically ({lang === 'en' ? 'Greek' : 'English'} version)</dd></div>
            <div><dt>Sitemap</dt><dd>Included automatically</dd></div>
          </dl>
          <div class="seo-side">
            <SeoSnippet title={seoTitle} description={c.summary} url={pageUrl} />
            <p class="hint">The title and description are generated from the project name, category and summary. Case studies have no separate SEO fields, so editing the category or summary above changes them.</p>
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
          <button class="btn btn-secondary" type="button" disabled aria-describedby="no-publish"><Icon name="upload" size={16} />Publish</button>
          <p class="hint" id="no-publish">Publishing is not available yet. A saved draft does not change techpi.eu: it is reviewed and merged on GitHub as a separate, deliberate step.</p>
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
            <p class="hint">No open draft. The first save creates the draft branch and one draft pull request; later saves update it.</p>
          {/if}
          <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: saved drafts, their text and their history are visible to anyone on GitHub, even though the website is unchanged.</span></p>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Locked details</h2></div>
        <div class="card-body">
          <dl class="facts">
            <div><dt>URL</dt><dd><Icon name="lock" size={13} /> /work/{slug}</dd></div>
            <div><dt>Client</dt><dd>{doc.facts.client}</dd></div>
            <div><dt>Year</dt><dd>{doc.facts.year}</dd></div>
            <div><dt>Group</dt><dd>{doc.facts.workGroup === 'client' ? 'Client project' : 'Earlier work'}</dd></div>
            <div><dt>Featured</dt><dd>{doc.facts.featured ? 'Yes, on the homepage' : 'No'}</dd></div>
            <div><dt>Position</dt><dd>{doc.facts.order} on the Work page</dd></div>
            <div><dt>Live site</dt><dd><a href={doc.facts.liveUrl} target="_blank" rel="noopener">{doc.facts.liveUrl.replace('https://', '')}</a></dd></div>
          </dl>
          <p class="hint">These are not editable here. Changing an address needs a redirect, which arrives with publishing.</p>
          <a class="live" href="https://techpi.eu/work/{slug}" target="_blank" rel="noopener"><Icon name="external" size={15} />View the live page</a>
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
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .loading { margin-top: 16px; }
  .msg { padding: 20px; display: grid; gap: 12px; justify-items: start; margin-top: 16px; }
  .head { margin: 8px 0 20px; }
  .sub { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 8px; }
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
  .lock { display: inline-flex; align-items: center; gap: 5px; color: var(--slate); font-size: var(--text-sm); }
  .images { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px 20px; align-items: start; }
  .shot img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .shot .hint { margin-top: 6px; overflow-wrap: anywhere; }
  .alts { display: grid; gap: 14px; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .seo-side { display: grid; gap: 10px; }
  .seo-facts, .facts { margin: 0; display: grid; gap: 10px; font-size: var(--text-sm); }
  .seo-facts dt, .facts dt { color: var(--slate); }
  .seo-facts dd, .facts dd { margin: 0; overflow-wrap: anywhere; }
  .facts { margin-bottom: 12px; }
  .facts div { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 8px; }
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
