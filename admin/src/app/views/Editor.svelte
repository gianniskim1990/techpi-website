<script>
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import RichText from '../components/RichText.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { store, findEntry, entriesOf, saveDraft, toast } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { validate, LIMITS, SEO_RECOMMENDED } from '../lib/validate.js';

  let { type, slug } = $props();
  const entry = findEntry(type, slug);
  const isCase = type === 'case-studies';
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const media = (file) => (file ? new URL(`../demo/media/${file}`, import.meta.url).href : null);
  const blank = () => ({ title: '', category: '', summary: '', body: '', imageAlt: '', seoTitle: '', seoDescription: '' });

  let form = $state(entry ? { slug: entry.slug, image: entry.image, featured: entry.featured, group: entry.group, content: clone(entry.saved) } : null);
  let baseline = $state(form ? JSON.stringify(form) : '');
  let lang = $state('en');
  let errors = $state({});
  let pickerOpen = $state(false);
  let unpublishOpen = $state(false);
  let redirectTo = $state(isCase ? '/work' : '/insights');

  const dirty = $derived(form ? JSON.stringify(form) !== baseline : false);
  const c = $derived(form?.content[lang]);
  const section = isCase ? 'work' : 'insights';
  const urlFor = (l) => `https://techpi.eu${l === 'el' ? '/el' : ''}/${section}/${form.slug}`;
  const err = (k) => errors[`${lang}.${k}`];
  const len = (k) => (c?.[k] ?? '').length;
  const hasErrors = $derived(Object.keys(errors).length > 0);

  // Re-validate live once the user has tried to save, so errors clear as they are fixed.
  let tried = $state(false);
  $effect(() => { if (tried && form) errors = validate(form, { slugTaken }); });
  function slugTaken(s) { return entriesOf(type).some((e) => e !== entry && e.slug === s); }

  function save() {
    tried = true;
    errors = validate(form, { slugTaken });
    if (Object.keys(errors).length) {
      const firstLang = Object.keys(errors).find((k) => k.startsWith('el.')) && !Object.keys(errors).some((k) => k.startsWith('en.')) ? 'el' : 'en';
      if (!Object.keys(errors).some((k) => k.startsWith(`${lang}.`)) && !errors.slug) lang = firstLang;
      toast('error', 'Not saved', `${Object.keys(errors).length} ${Object.keys(errors).length === 1 ? 'field needs' : 'fields need'} attention.`);
      return;
    }
    const wasNew = entry.isNew;
    const newSlug = saveDraft(entry, form);
    baseline = JSON.stringify(form);
    toast('success', 'Draft saved', 'Kept in this tab only (snapshot section). Nothing was sent to GitHub.');
    if (wasNew) { entry.isNew = false; navigate(`/${type}/${newSlug}`); }
  }
  function discard() {
    form = { slug: entry.slug, image: entry.image, featured: entry.featured, group: entry.group, content: clone(entry.saved) };
    baseline = JSON.stringify(form);
    errors = {};
    tried = false;
  }
  function addGreek() { form.content.el = blank(); lang = 'el'; }
  function removeGreek() { form.content.el = null; lang = 'en'; }
  const slugFromTitle = () => {
    form.slug = (form.content.en.title || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || form.slug;
  };

  const checks = $derived(form ? [
    { ok: Boolean(form.content.en.title.trim() && form.content.en.summary.trim()), text: 'English title and summary' },
    { ok: isCase ? Boolean(form.content.el?.title) : true, text: isCase ? 'Greek version' : 'Greek version (optional for articles)', optional: !isCase },
    { ok: !form.image || ['en', 'el'].every((l) => !form.content[l] || form.content[l].imageAlt?.trim()), text: 'Image alt text in every language' },
    { ok: ['en', 'el'].every((l) => !form.content[l] || form.content[l].seoTitle.length <= SEO_RECOMMENDED.seoTitle), text: 'SEO titles within 60 characters' },
  ] : []);
  const redirectTargets = $derived(isCase
    ? ['/work', ...entriesOf(type).filter((e) => e !== entry && e.status === 'published').map((e) => `/work/${e.slug}`)]
    : ['/insights', ...entriesOf(type).filter((e) => e !== entry && e.status === 'published').map((e) => `/insights/${e.slug}`)]);
</script>

{#if !entry}
  <div class="card notfound">
    <h1>Not found</h1>
    <p>There is no {isCase ? 'case study' : 'article'} at “{slug}”.</p>
    <a class="btn btn-secondary" href="#/{type}">Back to the list</a>
  </div>
{:else}
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="#/{type}"><Icon name="back" size={16} />{isCase ? 'Case studies' : 'Articles'}</a>
  </nav>

  <header class="head">
    <div class="titleblock">
      <h1>{form.content.en.title || (isCase ? 'New case study' : 'New article')}</h1>
      <div class="sub">
        <StatusBadge status={entry.status} />
        {#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{/if}
      </div>
    </div>
  </header>

  <div class="layout">
    <div class="col">
      <div class="langs" role="tablist" aria-label="Language">
        {#each ['en', 'el'] as l}
          <button role="tab" type="button" aria-selected={lang === l} class:has-errors={Object.keys(errors).some((k) => k.startsWith(`${l}.`))} onclick={() => (lang = l)}>
            {l === 'en' ? 'English' : 'Greek'}
            {#if l === 'el' && !form.content.el}<span class="opt">not added</span>{/if}
          </button>
        {/each}
      </div>

      {#if !c}
        <section class="card add-greek">
          <div class="card-body">
            <h2>No Greek version yet</h2>
            <p>{isCase ? 'Case studies are shown in both languages. Until a Greek version exists, /el/work/' + form.slug + ' will not be published.' : 'Articles can stay English only. A Greek version adds /el/insights/' + form.slug + ' and links the two languages for search engines.'}</p>
            <p class="hint">The Greek text is written by you. Nothing is translated automatically.</p>
            <button class="btn btn-primary" type="button" onclick={addGreek}><Icon name="plus" size={16} />Add Greek version</button>
          </div>
        </section>
      {:else}
        <section class="card" aria-labelledby="content-h">
          <div class="card-head"><h2 id="content-h">Content</h2>{#if lang === 'el' && (entry.isNew || !entry.hasGreek)}<button class="btn btn-ghost btn-sm" type="button" onclick={removeGreek}>Remove Greek version</button>{/if}</div>
          <div class="card-body">
            <div class="field">
              <label class="label" for="f-title"><span>{isCase ? 'Project name' : 'Title'}</span><span class="meta" class:over={len('title') > LIMITS.title[1]}>{len('title')}/{LIMITS.title[1]}</span></label>
              <input class="input" id="f-title" lang={lang} bind:value={form.content[lang].title} aria-invalid={err('title') ? 'true' : undefined} aria-describedby={err('title') ? 'e-title' : undefined} />
              {#if err('title')}<p class="error-text" id="e-title">{err('title')}</p>{/if}
            </div>
            <div class="field">
              <label class="label" for="f-cat">Category</label>
              <input class="input" id="f-cat" lang={lang} bind:value={form.content[lang].category} placeholder={isCase ? 'e.g. Delivery operations platform' : 'e.g. EU project websites'} />
            </div>
            <div class="field">
              <label class="label" for="f-sum"><span>{isCase ? 'Summary' : 'Lead'}</span><span class="meta" class:over={len('summary') > LIMITS.summary[1]}>{len('summary')}/{LIMITS.summary[1]}</span></label>
              <textarea class="textarea" id="f-sum" lang={lang} rows="3" bind:value={form.content[lang].summary} aria-invalid={err('summary') ? 'true' : undefined} aria-describedby="h-sum"></textarea>
              {#if err('summary')}<p class="error-text">{err('summary')}</p>{:else}<p class="hint" id="h-sum">{isCase ? 'Shown on the Work page and under the project name.' : 'Shown under the title and on the Insights page.'}</p>{/if}
            </div>
            <div class="field">
              <span class="label" id="l-body">{isCase ? 'Overview' : 'Article text'}</span>
              {#key lang}<RichText bind:value={form.content[lang].body} label={isCase ? 'Overview' : 'Article text'} id="f-body" {lang} invalid={Boolean(err('body'))} />{/key}
              {#if err('body')}<p class="error-text">{err('body')}</p>{/if}
            </div>
          </div>
        </section>

        <section class="card" aria-labelledby="img-h">
          <div class="card-head"><h2 id="img-h">Image</h2></div>
          <div class="card-body image">
            <div class="preview">
              {#if form.image}<img src={media(form.image)} alt="" />{:else}<span class="noimg">No image. The page is led by typography.</span>{/if}
            </div>
            <div class="image-side">
              <div class="row">
                <button class="btn btn-secondary btn-sm" type="button" onclick={() => (pickerOpen = true)}><Icon name="media" size={16} />{form.image ? 'Change image' : 'Choose image'}</button>
                {#if form.image}<button class="btn btn-ghost btn-sm" type="button" onclick={() => (form.image = null)}>Remove</button>{/if}
              </div>
              {#if form.image}
                <div class="field">
                  <label class="label" for="f-alt"><span>Alt text ({lang === 'en' ? 'English' : 'Greek'})</span><span class="meta">{len('imageAlt')}/{LIMITS.imageAlt[1]}</span></label>
                  <textarea class="textarea" id="f-alt" lang={lang} rows="2" bind:value={form.content[lang].imageAlt} aria-invalid={err('imageAlt') ? 'true' : undefined}></textarea>
                  {#if err('imageAlt')}<p class="error-text">{err('imageAlt')}</p>{:else}<p class="hint">Describe what the image shows, for people who cannot see it.</p>{/if}
                </div>
              {/if}
              <p class="hint">Uploading new images arrives with the media library. Images are resized and converted to WebP when the site is built.</p>
            </div>
          </div>
        </section>

        <section class="card" aria-labelledby="seo-h">
          <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
          <div class="card-body seo">
            <div>
              <div class="field">
                <label class="label" for="f-st"><span>SEO title</span><span class="meta" class:over={len('seoTitle') > SEO_RECOMMENDED.seoTitle}>{len('seoTitle')}/{SEO_RECOMMENDED.seoTitle}</span></label>
                <input class="input" id="f-st" lang={lang} bind:value={form.content[lang].seoTitle} placeholder="{form.content[lang].title || 'Title'} | TechPi" aria-invalid={err('seoTitle') ? 'true' : undefined} />
                {#if err('seoTitle')}<p class="error-text">{err('seoTitle')}</p>{:else}<p class="hint">Empty: the title followed by “| TechPi”.</p>{/if}
              </div>
              <div class="field">
                <label class="label" for="f-sd"><span>Meta description</span><span class="meta" class:over={len('seoDescription') > SEO_RECOMMENDED.seoDescription}>{len('seoDescription')}/{SEO_RECOMMENDED.seoDescription}</span></label>
                <textarea class="textarea" id="f-sd" lang={lang} rows="3" bind:value={form.content[lang].seoDescription} placeholder={form.content[lang].summary}></textarea>
                <p class="hint">Empty: the summary is used.</p>
              </div>
            </div>
            <div class="seo-side">
              <SeoSnippet title={c.seoTitle || `${c.title} | TechPi`} description={c.seoDescription || c.summary} url={urlFor(lang)} />
              <dl class="seo-facts">
                <div><dt>Canonical URL</dt><dd>{urlFor(lang)}</dd></div>
                <div><dt>Other language</dt><dd>{form.content.el ? `Linked automatically (${lang === 'en' ? 'Greek' : 'English'} version)` : 'None: English only'}</dd></div>
                <div><dt>Sitemap</dt><dd>Included automatically when published</dd></div>
              </dl>
            </div>
          </div>
        </section>
      {/if}
    </div>

    <aside class="rail" aria-label="Publishing">
      <section class="card">
        <div class="card-body rail-body">
          <div class="actions">
            <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty && !entry.isNew}>Save draft</button>
            {#if dirty && !entry.isNew}<button class="btn btn-ghost" type="button" onclick={discard}>Discard changes</button>{/if}
          </div>
          <div class="locked">
            <button class="btn btn-secondary" type="button" disabled aria-describedby="not-connected"><Icon name="eye" size={16} />Preview</button>
            <button class="btn btn-secondary" type="button" disabled aria-describedby="not-connected"><Icon name="upload" size={16} />Publish</button>
          </div>
          <p class="hint" id="not-connected">This section is a snapshot and is not connected: saving keeps changes in this tab only. Preview and Publish are not built yet. Previews will be unlisted (not indexed) but not private, because the repository is public.</p>
          {#if hasErrors}<p class="error-text">Fix the highlighted fields to save.</p>{/if}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Details</h2></div>
        <div class="card-body">
          <div class="field">
            <label class="label" for="f-slug">URL</label>
            {#if entry.isNew}
              <div class="slugrow"><span class="prefix">/{section}/</span><input class="input" id="f-slug" bind:value={form.slug} aria-invalid={errors.slug ? 'true' : undefined} /></div>
              {#if errors.slug}<p class="error-text">{errors.slug}</p>{:else}<button class="linkbtn" type="button" onclick={slugFromTitle}>Generate from the English title</button>{/if}
            {:else}
              <div class="slugrow locked-slug"><Icon name="lock" size={15} /><span>/{section}/{form.slug}</span></div>
              <p class="hint">This page is live and may be indexed. Its address can only change together with a redirect, so existing links keep working.</p>
            {/if}
          </div>
          {#if isCase}
            <div class="field">
              <label class="label" for="f-group">Group</label>
              <select class="select" id="f-group" bind:value={form.group}><option value="client">Client project</option><option value="earlier">Earlier work by pigiota314</option></select>
            </div>
            <label class="toggle">
              <input type="checkbox" bind:checked={form.featured} />
              <span><strong>Featured</strong><span class="hint">Shown in Selected work on the homepage</span></span>
            </label>
          {/if}
          {#if entry.publishedUrl}
            <a class="live" href={entry.publishedUrl.en} target="_blank" rel="noopener"><Icon name="external" size={15} />View the live page</a>
          {/if}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Checklist</h2></div>
        <ul class="checks">
          {#each checks as k}
            <li class:ok={k.ok} class:optional={!k.ok && k.optional}><Icon name={k.ok ? 'check' : k.optional ? 'info' : 'alert'} size={16} /><span>{k.text}</span></li>
          {/each}
        </ul>
      </section>

      {#if !entry.isNew}
        <button class="btn btn-danger unpub" type="button" onclick={() => (unpublishOpen = true)}>Unpublish…</button>
      {/if}
    </aside>
  </div>

  <div class="mobilebar" role="region" aria-label="Save">
    <span class="mb-status">{#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{:else}All changes saved{/if}</span>
    <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty && !entry.isNew}>Save draft</button>
  </div>

  <Dialog bind:open={pickerOpen} title="Choose an image" wide>
    <p class="hint">Images already in the website. Uploading new images arrives with the media library.</p>
    <ul class="picker">
      {#each store.media as m}
        <li>
          <button type="button" class:selected={form.image === m.file} aria-pressed={form.image === m.file} onclick={() => { form.image = m.file; pickerOpen = false; }}>
            <img src={media(m.file)} alt="" loading="lazy" />
            <span>{m.file.replace(/\.webp$/, '')}</span>
            <span class="dim">{m.width}×{m.height}</span>
          </button>
        </li>
      {/each}
    </ul>
  </Dialog>

  <Dialog bind:open={unpublishOpen} title="Unpublish this {isCase ? 'case study' : 'article'}?">
    <p>Removing a live page breaks links and search results that point to it. The old address must send visitors somewhere useful.</p>
    <div class="field">
      <label class="label" for="f-redirect">Send visitors to</label>
      <select class="select" id="f-redirect" bind:value={redirectTo}>{#each redirectTargets as t}<option value={t}>{t}</option>{/each}</select>
      <p class="hint">A permanent (301) redirect from /{section}/{form.slug} to {redirectTo} is created with the change, in both languages.</p>
    </div>
    {#snippet actions()}
      <button class="btn btn-secondary" type="button" onclick={() => (unpublishOpen = false)}>Cancel</button>
      <button class="btn btn-danger" type="button" disabled title="Needs the connected workflow">Unpublish with redirect</button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .head { margin: 8px 0 20px; }
  .sub { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
  .unsaved { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--warn); font-weight: 500; }
  .unsaved .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .langs { display: flex; gap: 4px; border-bottom: 1px solid var(--rule); }
  .langs button { position: relative; padding: 10px 14px; border: 0; background: none; color: var(--slate); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .langs button[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--blue); }
  .langs button.has-errors::after { content: ''; position: absolute; top: 9px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
  .opt { font-weight: 400; font-size: var(--text-xs); color: var(--fog); margin-left: 4px; }
  .add-greek .card-body { display: grid; gap: 10px; justify-items: start; max-width: 60ch; }
  .image { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 20px; }
  .preview { aspect-ratio: 16 / 10; border-radius: var(--radius); overflow: hidden; background: repeating-linear-gradient(135deg, var(--rule-soft) 0 8px, var(--sheet) 8px 16px); display: grid; place-items: center; border: 1px solid var(--rule-soft); }
  .preview img { width: 100%; height: 100%; object-fit: cover; }
  .noimg { padding: 12px; color: var(--slate); font-size: var(--text-sm); text-align: center; }
  .image-side { display: grid; gap: 12px; align-content: start; }
  .row { display: flex; gap: 8px; }
  .image-side .field + .field, .image-side .field { margin-top: 0; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; }
  .seo-side { display: grid; gap: 14px; align-content: start; }
  .seo-facts { margin: 0; display: grid; gap: 8px; font-size: var(--text-sm); }
  .seo-facts dt { color: var(--slate); }
  .seo-facts dd { margin: 0; overflow-wrap: anywhere; }
  .rail { position: sticky; top: 20px; display: grid; gap: 16px; }
  .rail-body { display: grid; gap: 10px; }
  .actions { display: grid; gap: 8px; }
  .actions .btn { width: 100%; }
  .locked { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .slugrow { display: flex; align-items: center; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); overflow: hidden; }
  .slugrow .prefix { padding: 0 2px 0 10px; color: var(--slate); font-size: var(--text-md); }
  .slugrow .input { border: 0; box-shadow: none; padding-left: 0; }
  .locked-slug { gap: 8px; padding: 8px 11px; background: var(--sheet); color: var(--graphite); font-size: var(--text-md); overflow-wrap: anywhere; }
  .linkbtn { justify-self: start; background: none; border: 0; padding: 0; color: var(--blue); font-size: var(--text-sm); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
  .toggle { display: flex; gap: 10px; align-items: flex-start; margin-top: 18px; cursor: pointer; }
  .toggle input { margin-top: 3px; accent-color: var(--blue); width: 16px; height: 16px; }
  .toggle span { display: grid; }
  .toggle strong { font-size: var(--text-sm); font-weight: 600; }
  .live { display: inline-flex; align-items: center; gap: 6px; margin-top: 18px; font-size: var(--text-sm); font-weight: 500; text-decoration: none; }
  .checks { list-style: none; margin: 0; padding: 12px 20px 16px; display: grid; gap: 8px; font-size: var(--text-sm); }
  .checks li { display: flex; gap: 8px; align-items: flex-start; color: var(--warn); }
  .checks li.ok { color: var(--ok); }
  .checks li.optional { color: var(--slate); }
  .checks li span { color: var(--ink); }
  .unpub { width: 100%; }
  .picker { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .picker button { width: 100%; display: grid; gap: 4px; padding: 8px; border: 1px solid var(--rule-soft); border-radius: var(--radius); background: var(--white); cursor: pointer; text-align: left; font-size: var(--text-sm); }
  .picker button:hover { border-color: var(--slate); }
  .picker button.selected { border-color: var(--blue); box-shadow: 0 0 0 2px rgb(8 65 200 / 0.25); }
  .picker img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 4px; background: var(--rule-soft); }
  .dim { color: var(--slate); font-size: var(--text-xs); }
  .notfound { padding: 24px; display: grid; gap: 12px; justify-items: start; }
  .mobilebar { display: none; }
  @media (max-width: 1100px) {
    .layout { grid-template-columns: minmax(0, 1fr); padding-bottom: 72px; }
    .rail { position: static; }
    .seo { grid-template-columns: minmax(0, 1fr); }
    /* On narrow screens the side panel comes after the form, so saving stays within reach in a bar at the bottom. */
    .mobilebar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--sheet); border-top: 1px solid var(--rule); box-shadow: 0 -4px 16px rgb(8 14 30 / 0.06); }
    .mb-status { font-size: var(--text-sm); color: var(--slate); }
  }
  @media (max-width: 640px) { .image { grid-template-columns: minmax(0, 1fr); } }
</style>
