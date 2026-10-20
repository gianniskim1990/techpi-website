<script>
  /**
   * Connected editor for one M0 test entry. Loads through the admin's API, checks the fields as you type (the same
   * rules the Worker enforces on save), and saves as a draft: a commit on the entry's draft branch and one draft pull
   * request, which repeated saves update. Publishing is not part of Task A1.
   */
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { FIELDS, LOCALES, validateEntry } from '../../../shared/m0-content.js';

  let { slug } = $props();
  const empty = () => Object.fromEntries(Object.keys(FIELDS).map((k) => [k, '']));
  const toForm = (content) => Object.fromEntries(LOCALES.map((l) => [l, content[l] ? { ...empty(), ...content[l] } : null]));
  const toContent = (form) => Object.fromEntries(LOCALES.filter((l) => form[l]).map((l) => [l, form[l]]));

  let load = $state({ loading: true, error: null });
  let form = $state(null);
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

  async function fetchEntry() {
    load = { loading: true, error: null };
    try {
      const r = await api.getDemo(slug);
      form = toForm(r.content);
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
  const check = $derived(form ? validateEntry(toContent(form)) : { ok: true, errors: {} });
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const c = $derived(form?.[lang]);
  const err = (k) => errors[`${lang}.${k}`];
  const len = (k) => (c?.[k] ?? '').trim().length;

  async function save() {
    tried = true;
    serverErrors = {};
    saveError = null;
    if (!check.ok) { toast('error', 'Not saved', 'Some fields need attention.'); return; }
    saving = true;
    try {
      const r = await api.saveDemoDraft(slug, toContent(form), sha);
      sha = r.sha;
      baseline = JSON.stringify(form);
      if (r.changed) {
        draft = r.draft;
        source = 'draft';
        toast('success', 'Draft saved to GitHub', `Committed to the draft branch. Draft pull request #${r.draft?.number} is up to date.`);
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
  function addGreek() { form.el = { ...empty(), cover: form.en.cover }; lang = 'el'; }
  function removeGreek() { form.el = null; lang = 'en'; }

  $effect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/test-content"><Icon name="back" size={16} />Test content</a>
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
    <h1>{form.en.title || 'Untitled'}</h1>
    <div class="sub">
      <StatusBadge status={draft ? 'changes' : 'published'} />
      <span class="hint">{source === 'draft' ? 'Showing the saved draft' : 'Showing the version on the base branch'}</span>
      {#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{/if}
    </div>
  </header>

  <div class="layout">
    <div class="col">
      <div class="langs" role="tablist" aria-label="Language">
        {#each LOCALES as l}
          <button role="tab" type="button" aria-selected={lang === l} class:has-errors={Object.keys(errors).some((k) => k.startsWith(`${l}.`))} onclick={() => (lang = l)}>
            {l === 'en' ? 'English' : 'Greek'}
            {#if l === 'el' && !form.el}<span class="opt">not added</span>{/if}
          </button>
        {/each}
      </div>

      {#if !c}
        <section class="card">
          <div class="card-body add-greek">
            <h2>No Greek version yet</h2>
            <p>This test entry can stay English only. The Greek text is written by you; nothing is translated automatically.</p>
            <button class="btn btn-primary" type="button" onclick={addGreek}><Icon name="plus" size={16} />Add Greek version</button>
          </div>
        </section>
      {:else}
        <section class="card" aria-labelledby="content-h">
          <div class="card-head"><h2 id="content-h">Content</h2>{#if lang === 'el'}<button class="btn btn-ghost btn-sm" type="button" onclick={removeGreek}>Remove Greek version</button>{/if}</div>
          <div class="card-body">
            <div class="field">
              <label class="label" for="f-title"><span>Title</span><span class="meta" class:over={len('title') > FIELDS.title.max}>{len('title')}/{FIELDS.title.max}</span></label>
              <input class="input" id="f-title" lang={lang} bind:value={form[lang].title} aria-invalid={err('title') ? 'true' : undefined} aria-describedby={err('title') ? 'e-title' : undefined} />
              {#if err('title')}<p class="error-text" id="e-title">{err('title')}</p>{/if}
            </div>
            <div class="field">
              <label class="label" for="f-sum"><span>Summary</span><span class="meta" class:over={len('summary') > FIELDS.summary.max}>{len('summary')}/{FIELDS.summary.max}</span></label>
              <textarea class="textarea" id="f-sum" lang={lang} rows="3" bind:value={form[lang].summary} aria-invalid={err('summary') ? 'true' : undefined}></textarea>
              {#if err('summary')}<p class="error-text">{err('summary')}</p>{/if}
            </div>
            <div class="field">
              <label class="label" for="f-body"><span>Text</span><span class="meta">Markdown</span></label>
              <textarea class="textarea mono" id="f-body" lang={lang} rows="10" bind:value={form[lang].body} aria-invalid={err('body') ? 'true' : undefined} aria-describedby="h-body"></textarea>
              {#if err('body')}<p class="error-text">{err('body')}</p>{:else}<p class="hint" id="h-body">Stored as Markdown, as in the file on GitHub. The rich-text editor of the case studies comes with the content migration.</p>{/if}
            </div>
            {#if form[lang].cover}
              <div class="field">
                <label class="label" for="f-alt"><span>Cover image alt text</span><span class="meta">{len('coverAlt')}/{FIELDS.coverAlt.max}</span></label>
                <textarea class="textarea" id="f-alt" lang={lang} rows="2" bind:value={form[lang].coverAlt} aria-invalid={err('coverAlt') ? 'true' : undefined}></textarea>
                {#if err('coverAlt')}<p class="error-text">{err('coverAlt')}</p>{:else}<p class="hint">Image: <code>{form[lang].cover}</code>. Changing images arrives with the media library.</p>{/if}
              </div>
            {/if}
          </div>
        </section>

        <section class="card" aria-labelledby="seo-h">
          <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
          <div class="card-body seo">
            <div>
              <div class="field">
                <label class="label" for="f-st"><span>SEO title</span><span class="meta" class:over={len('seoTitle') > FIELDS.seoTitle.max}>{len('seoTitle')}/{FIELDS.seoTitle.max}</span></label>
                <input class="input" id="f-st" lang={lang} bind:value={form[lang].seoTitle} placeholder="{form[lang].title || 'Title'} | TechPi" aria-invalid={err('seoTitle') ? 'true' : undefined} />
                {#if err('seoTitle')}<p class="error-text">{err('seoTitle')}</p>{:else}<p class="hint">Empty: the title followed by “| TechPi”.</p>{/if}
              </div>
              <div class="field">
                <label class="label" for="f-sd"><span>Meta description</span><span class="meta" class:over={len('seoDescription') > FIELDS.seoDescription.max}>{len('seoDescription')}/{FIELDS.seoDescription.max}</span></label>
                <textarea class="textarea" id="f-sd" lang={lang} rows="3" bind:value={form[lang].seoDescription} placeholder={form[lang].summary} aria-invalid={err('seoDescription') ? 'true' : undefined}></textarea>
                {#if err('seoDescription')}<p class="error-text">{err('seoDescription')}</p>{:else}<p class="hint">Empty: the summary is used.</p>{/if}
              </div>
            </div>
            <div class="seo-side">
              <SeoSnippet title={c.seoTitle || `${c.title} | TechPi`} description={c.seoDescription || c.summary} url="/m0-demo/{slug}" />
              <p class="hint">Preview of the search result only: test content has no page on techpi.eu.</p>
            </div>
          </div>
        </section>
      {/if}
    </div>

    <aside class="rail" aria-label="Saving">
      <section class="card">
        <div class="card-body rail-body">
          <div class="actions">
            <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving} aria-busy={saving}>{saving ? 'Saving to GitHub…' : 'Save draft'}</button>
            {#if dirty && !saving}<button class="btn btn-ghost" type="button" onclick={discard}>Discard changes</button>{/if}
          </div>
          <button class="btn btn-secondary" type="button" disabled aria-describedby="no-publish"><Icon name="upload" size={16} />Publish</button>
          <p class="hint" id="no-publish">Publishing is not available yet. A saved draft is reviewed and merged on GitHub as a separate, deliberate step.</p>
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
          <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: saved drafts, their text and their history are visible to anyone on GitHub.</span></p>
        </div>
      </section>
    </aside>
  </div>

  <div class="mobilebar" role="region" aria-label="Save">
    <span class="mb-status">{#if saving}Saving…{:else if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{:else}All changes saved{/if}</span>
    <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving}>Save draft</button>
  </div>

  <Dialog bind:open={conflictOpen} title="This entry changed on GitHub">
    <p>Someone (or another tab) saved a newer version after you opened this entry. Your change was not saved, so nothing was overwritten.</p>
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
  .unsaved { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--warn); font-weight: 500; }
  .unsaved .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .langs { display: flex; gap: 4px; border-bottom: 1px solid var(--rule); }
  .langs button { position: relative; padding: 10px 14px; border: 0; background: none; color: var(--slate); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .langs button[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--blue); }
  .langs button.has-errors::after { content: ''; position: absolute; top: 9px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
  .opt { font-weight: 400; font-size: var(--text-xs); color: var(--fog); margin-left: 4px; }
  .add-greek { display: grid; gap: 10px; justify-items: start; max-width: 60ch; }
  .mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: var(--text-sm); line-height: 1.55; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .seo-side { display: grid; gap: 10px; }
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
</style>
