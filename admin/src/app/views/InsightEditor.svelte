<script>
  /**
   * Connected editor for one of the 7 Insights articles (Task M2). English only. Loads through the admin's API, checks the
   * fields as you type with the same rules the Worker enforces on save, and saves as a draft: a commit on the article's
   * own draft branch and one draft pull request, which repeated saves update. The article's structure (its sections,
   * their parts and the note) is fixed; its address, publication date and source are locked. No publishing.
   */
  import Icon from '../components/Icon.svelte';
  import PublishPanel from '../components/PublishPanel.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import ArticleImages from '../components/ArticleImages.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { loadInsights, insights } from '../lib/insights.svelte.js';
  import { RULES, internalPaths, validateEditable, withReferencesOf } from '../../../shared/insight-content.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';

  let { slug } = $props();
  const PART = {
    paragraphs: { label: 'Paragraphs', add: 'Add paragraph', multiline: true, rule: RULES.paragraphs, itemMax: RULES.paragraph.max },
    list: { label: 'List', add: 'Add list item', multiline: false, rule: RULES.list, itemMax: RULES.item.max },
    after: { label: 'Paragraphs after the list', add: 'Add paragraph', multiline: true, rule: RULES.after, itemMax: RULES.paragraph.max },
  };

  let load = $state({ loading: true, error: null });
  let doc = $state(null); // the stored document: facts are shown, never edited
  let form = $state(null); // the editable English article
  let baseline = $state('');
  let sha = $state(null);
  let source = $state('published');
  let draft = $state(null);
  let elsewhere = $state(null);
  let isNew = $state(false); // created in the admin, not on the content branch yet (Task M5) // an open draft PR for this item that targets another branch
  let tried = $state(false);
  let saving = $state(false);
  let saveError = $state(null);
  let conflictOpen = $state(false);
  let serverErrors = $state({});

  const copy = (v) => JSON.parse(JSON.stringify(v));
  // Where the article sits on the Insights page: the list is newest first (by date, then position), like the site.
  const rank = $derived(insights.entries.findIndex((e) => e.slug === slug) + 1);
  // Images (Task M7): previews are fetched from the draft (they have no bundled thumbnail).
  let previews = $state({});
  const refsOf = (d) => [d?.images?.cover, ...Object.values(d?.images?.sections ?? {})].filter(Boolean);
  $effect(() => {
    for (const ref of refsOf(doc)) {
      if (previews[ref.id] !== undefined) continue;
      previews[ref.id] = null; // loading
      api.getInsightImage(slug, ref.id).then((url) => { previews[ref.id] = url; }).catch(() => {});
    }
  });
  /** After an image was added, replaced or removed (ArticleImages): the saved article is the new starting point. */
  function imagesChanged(r, preview) {
    const before = new Set(refsOf(doc).map((x) => x.id));
    doc = r.content;
    sha = r.sha;
    draft = r.draft ?? draft;
    source = 'draft';
    form = copy(r.content.en);
    baseline = JSON.stringify(form);
    if (preview) for (const ref of refsOf(doc)) if (!before.has(ref.id)) previews[ref.id] = preview;
    loadInsights();
  }
  async function fetchEntry() {
    load = { loading: true, error: null };
    try {
      const r = await api.getInsight(slug);
      doc = r.content;
      form = copy(r.content.en);
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
  if (!insights.loaded) loadInsights(); // titles for the related-articles picker
  if (!caseStudies.loaded) loadCaseStudies(); // pages a note may link to

  // What is on the content branch (new, unmerged entries are not): a newly added related article or note link must point
  // there. References the article already has may stay, exactly as the Worker checks a save.
  const known = $derived(
    insights.loaded && caseStudies.loaded
      ? { insights: insights.entries.filter((e) => !e.isNew).map((e) => e.slug), caseStudies: caseStudies.entries.filter((e) => !e.isNew).map((e) => e.slug) }
      : null,
  );
  const allowedRefs = $derived(known && doc ? withReferencesOf(known, doc) : null);

  const dirty = $derived(form ? JSON.stringify(form) !== baseline : false);
  // Until the lists have loaded, the Worker remains the check for related articles and links.
  const check = $derived(form && doc && allowedRefs ? validateEditable({ en: form }, doc, allowedRefs) : { ok: true, errors: {} });
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const err = (k) => errors[`en.${k}`];
  const partErrors = (i, part) => {
    const base = `en.sections.${i}.${part}`;
    const out = { _: errors[base] };
    for (const k of Object.keys(errors)) if (k.startsWith(`${base}.`)) out[k.slice(base.length + 1)] = errors[k];
    return out;
  };
  const len = (v) => (v ?? '').trim().length;

  // Related articles: titles from the list; any of the other six, each once, at most four.
  const titleOf = (s) => insights.entries.find((e) => e.slug === s)?.title ?? s;
  const others = $derived((allowedRefs?.insights ?? []).filter((s) => s !== slug));
  const moveRelated = (i, d) => { const j = i + d; if (j < 0 || j >= form.related.length) return; [form.related[i], form.related[j]] = [form.related[j], form.related[i]]; };
  const addRelated = () => { const next = others.find((s) => !form.related.includes(s)); if (next && form.related.length < RULES.related.max) form.related.push(next); };

  // The note as the page shows it: text with [label](/page) links.
  const noteParts = $derived.by(() => {
    const t = form?.note ?? '';
    const parts = [];
    let last = 0;
    for (const m of t.matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) {
      if (m.index > last) parts.push({ text: t.slice(last, m.index) });
      parts.push({ text: m[1], href: m[2], ok: internalPaths(allowedRefs ?? undefined).includes(m[2]) });
      last = m.index + m[0].length;
    }
    if (last < t.length) parts.push({ text: t.slice(last) });
    return parts;
  });
  const pageUrl = $derived(`https://techpi.eu/insights/${slug}`);

  async function save() {
    tried = true;
    serverErrors = {};
    saveError = null;
    if (!check.ok) { toast('error', 'Not saved', 'Some fields need attention.'); return; }
    saving = true;
    try {
      const r = await api.saveInsightDraft(slug, { en: form }, sha);
      sha = r.sha;
      baseline = JSON.stringify(form);
      if (r.changed) {
        draft = r.draft;
        source = 'draft';
        toast('success', 'Draft saved to GitHub', `Committed to the draft branch. Draft pull request #${r.draft?.number} is up to date. The website is not changed.`);
        loadInsights();
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

{#snippet imageText(ref, target, altKey, captionKey, at)}
  <div class="imgtext">
    <div class="shot">{#if previews[ref.id]}<img src={previews[ref.id]} alt="" />{/if}<p class="hint">{ref.width} × {ref.height}</p></div>
    <div>
      <div class="field">
        <label class="label" for="f-{at}-alt"><span>Alt text</span><span class="meta" class:over={len(target[altKey]) > 300}>{len(target[altKey])}/300</span></label>
        <textarea class="textarea" id="f-{at}-alt" lang="en" rows="2" bind:value={target[altKey]} aria-invalid={errors[`en.${at}${altKey}`] ? 'true' : undefined}></textarea>
        {#if errors[`en.${at}${altKey}`]}<p class="error-text">{errors[`en.${at}${altKey}`]}</p>{/if}
      </div>
      <div class="field">
        <label class="label" for="f-{at}-cap"><span>Caption <span class="dim">(optional)</span></span><span class="meta" class:over={len(target[captionKey]) > 200}>{len(target[captionKey])}/200</span></label>
        <input class="input" id="f-{at}-cap" lang="en" bind:value={target[captionKey]} aria-invalid={errors[`en.${at}${captionKey}`] ? 'true' : undefined} />
        {#if errors[`en.${at}${captionKey}`]}<p class="error-text">{errors[`en.${at}${captionKey}`]}</p>{:else}<p class="hint">Empty: no caption.</p>{/if}
      </div>
    </div>
  </div>
{/snippet}

{#snippet textField(key, label, hint, rule, rows = 0)}
  <div class="field">
    <label class="label" for="f-{key}"><span>{label}</span><span class="meta" class:over={len(form[key]) > rule.max}>{len(form[key])}/{rule.max}</span></label>
    {#if rows}
      <textarea class="textarea" id="f-{key}" lang="en" {rows} bind:value={form[key]} aria-invalid={err(key) ? 'true' : undefined}></textarea>
    {:else}
      <input class="input" id="f-{key}" lang="en" bind:value={form[key]} aria-invalid={err(key) ? 'true' : undefined} />
    {/if}
    {#if err(key)}<p class="error-text">{err(key)}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
  </div>
{/snippet}

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/articles"><Icon name="back" size={16} />Articles</a>
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
    <h1>{form.title || 'Untitled'}</h1>
    <div class="sub">
      <StatusBadge status={draft ? 'changes' : 'published'} />
      <span class="connected"><Icon name="branch" size={13} />Connected to GitHub</span>
      <span class="lang"><Icon name="globe" size={13} />English only</span>
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
      <p class="english" role="note"><Icon name="info" size={16} /><span>Insights articles are published in English only. There is no Greek version, and none can be added here; the Greek site points readers to its EU Projects page instead.</span></p>
      {#if tried && errors.entry}<p class="error-text" role="alert">{errors.entry}</p>{/if}

      <section class="card" aria-labelledby="head-h">
        <div class="card-head"><h2 id="head-h">Article</h2></div>
        <div class="card-body">
          {@render textField('category', 'Category', 'The topic label above the title and on the Insights page.', RULES.category)}
          {@render textField('title', 'Title', 'The page heading, and the headline in the article’s structured data.', RULES.title)}
          {@render textField('lead', 'Lead', 'Shown under the title and as the excerpt on the Insights page.', RULES.lead, 3)}
          {#if doc.images?.cover}<p class="label sub-h">Cover image</p>{@render imageText(doc.images.cover, form, 'coverAlt', 'coverCaption', '')}{/if}
        </div>
      </section>

      {#if isNew}
        <section class="card" aria-labelledby="img-h">
          <div class="card-head"><h2 id="img-h">Images</h2></div>
          <div class="card-body"><ArticleImages {slug} {doc} {sha} {previews} disabled={dirty || saving} onchange={imagesChanged} /></div>
        </section>
      {/if}

      {#each form.sections as s, i (i)}
        <section class="card" aria-labelledby="sec-{i}-h">
          <div class="card-head"><h2 id="sec-{i}-h">Section {i + 1}</h2></div>
          <div class="card-body">
            <div class="field">
              <label class="label" for="f-h-{i}"><span>Heading</span><span class="meta" class:over={len(s.heading) > RULES.heading.max}>{len(s.heading)}/{RULES.heading.max}</span></label>
              <input class="input" id="f-h-{i}" lang="en" bind:value={form.sections[i].heading} aria-invalid={errors[`en.sections.${i}.heading`] ? 'true' : undefined} />
              {#if errors[`en.sections.${i}.heading`]}<p class="error-text">{errors[`en.sections.${i}.heading`]}</p>{/if}
            </div>
            {#each ['paragraphs', 'list', 'after'].filter((p) => s[p] !== undefined) as part (part)}
              <div class="field">
                <ListEditor bind:items={form.sections[i][part]} label={PART[part].label} id="f-{i}-{part}" lang="en" multiline={PART[part].multiline} itemMax={PART[part].itemMax} min={PART[part].rule.min} max={PART[part].rule.max} errors={partErrors(i, part)} addLabel={PART[part].add} />
              </div>
            {/each}
            {#if doc.images?.sections?.[String(i)]}<p class="label sub-h">Image after this section</p>{@render imageText(doc.images.sections[String(i)], form.sections[i], 'imageAlt', 'imageCaption', `sections.${i}.`)}{/if}
          </div>
        </section>
      {/each}
      <p class="hint sections"><Icon name="lock" size={13} />This article’s structure is fixed: headings and text can change, and so can the number of paragraphs or list items, but sections and their parts cannot be added or removed here. Each section needs its own heading and some text.</p>

      {#if form.note !== undefined}
        <section class="card" aria-labelledby="note-h">
          <div class="card-head"><h2 id="note-h">Note</h2></div>
          <div class="card-body">
            {@render textField('note', 'Note text', 'Links are written as [label](/page) and may only point to pages of this website.', RULES.note, 3)}
            <div class="notepreview" aria-label="Note preview">
              <span class="meta-label">Preview</span>
              <p>{#each noteParts as p}{#if p.href}<span class="lnk" class:bad={!p.ok} title={p.ok ? p.href : `Not a page of this website: ${p.href}`}>{p.text}</span>{:else}{p.text}{/if}{/each}</p>
            </div>
          </div>
        </section>
      {/if}

      <section class="card" aria-labelledby="rel-h">
        <div class="card-head"><h2 id="rel-h">Related reading</h2><span class="meta">{form.related.length}/{RULES.related.max}</span></div>
        <div class="card-body">
          {#if err('related')}<p class="error-text">{err('related')}</p>{/if}
          {#if !form.related.length}<p class="hint">No related articles: the section is not shown on the page.</p>{/if}
          <ol class="related">
            {#each form.related as r, i (i)}
              <li>
                <span class="n">{i + 1}</span>
                <select class="select" aria-label="Related article {i + 1}" bind:value={form.related[i]} aria-invalid={errors[`en.related.${i}`] ? 'true' : undefined}>
                  {#each others as o}<option value={o}>{titleOf(o)}</option>{/each}
                </select>
                <div class="tools">
                  <button class="btn btn-ghost btn-sm up" type="button" aria-label="Move related article {i + 1} up" disabled={i === 0} onclick={() => moveRelated(i, -1)}><Icon name="chevron" size={14} /></button>
                  <button class="btn btn-ghost btn-sm down" type="button" aria-label="Move related article {i + 1} down" disabled={i === form.related.length - 1} onclick={() => moveRelated(i, 1)}><Icon name="chevron" size={14} /></button>
                  <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove related article {i + 1}" onclick={() => form.related.splice(i, 1)}><Icon name="x" size={14} /></button>
                </div>
                {#if errors[`en.related.${i}`]}<p class="error-text full">{errors[`en.related.${i}`]}</p>{/if}
              </li>
            {/each}
          </ol>
          <button class="btn btn-secondary btn-sm" type="button" onclick={addRelated} disabled={form.related.length >= RULES.related.max}><Icon name="plus" size={14} />Add related article</button>
        </div>
      </section>

      <section class="card" aria-labelledby="seo-h">
        <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
        <div class="card-body seo">
          <div>
            <div class="field">
              <label class="label" for="f-mt"><span>Search title</span><span class="meta" class:over={len(form.meta.title) > RULES.metaTitle.max}>{len(form.meta.title)}/{RULES.metaTitle.max}</span></label>
              <input class="input" id="f-mt" lang="en" bind:value={form.meta.title} aria-invalid={errors['en.meta.title'] ? 'true' : undefined} />
              {#if errors['en.meta.title']}<p class="error-text">{errors['en.meta.title']}</p>{:else}<p class="hint">The page’s &lt;title&gt; and Open Graph title. At most 70 characters.</p>{/if}
            </div>
            <div class="field">
              <label class="label" for="f-md"><span>Meta description</span><span class="meta" class:over={len(form.meta.description) > RULES.metaDescription.max || len(form.meta.description) < RULES.metaDescription.min}>{len(form.meta.description)}/{RULES.metaDescription.min}–{RULES.metaDescription.max}</span></label>
              <textarea class="textarea" id="f-md" lang="en" rows="3" bind:value={form.meta.description} aria-invalid={errors['en.meta.description'] ? 'true' : undefined}></textarea>
              {#if errors['en.meta.description']}<p class="error-text">{errors['en.meta.description']}</p>{:else}<p class="hint">70 to 200 characters, as the site’s SEO check requires.</p>{/if}
            </div>
          </div>
          <div class="seo-side">
            <SeoSnippet title={form.meta.title} description={form.meta.description} url={pageUrl} />
            <dl class="seo-facts">
              <div><dt>Canonical URL</dt><dd>{pageUrl}</dd></div>
              <div><dt>Other language</dt><dd>None: English only (no hreflang)</dd></div>
              <div><dt>Structured data</dt><dd>Article, headline from the title, published {doc.facts.published}</dd></div>
            </dl>
            <p class="hint">The preview approximates how search engines may shorten the title and description.</p>
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
            <p class="hint">No open draft. The first save creates this article’s draft branch and one draft pull request; later saves update it.</p>
          {/if}
          <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: saved drafts, their text and their history are visible to anyone on GitHub, even though the website is unchanged.</span></p>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Locked details</h2></div>
        <div class="card-body">
          <dl class="facts">
            <div><dt>URL</dt><dd><Icon name="lock" size={13} /> /insights/{slug}</dd></div>
            <div><dt>Published</dt><dd><time datetime={doc.facts.published}>{doc.facts.publishedText}</time></dd></div>
            {#if insights.loaded && rank}<div><dt>Position</dt><dd>{rank} of {insights.entries.length} on the Insights page (newest first)</dd></div>{/if}
            <div><dt>Language</dt><dd>English only</dd></div>
            {#if doc.facts.source}<div><dt>Source</dt><dd><span class="dim">{doc.facts.source.replace('https://', '')}</span><br /><span class="dim">Legacy address, kept for the redirect; not shown on the site.</span></dd></div>{/if}
          </dl>
          <p class="hint">The address, date and source are not editable. No author, modified date or reading time is recorded for these articles.</p>
          {#if !isNew}<a class="live" href="https://techpi.eu/insights/{slug}" target="_blank" rel="noopener"><Icon name="external" size={15} />View the live page</a>{/if}
        </div>
      </section>
    </aside>
  </div>

  <div class="mobilebar" role="region" aria-label="Save">
    <span class="mb-status">{#if saving}Saving…{:else if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{:else}All changes saved{/if}</span>
    <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving}>Save draft</button>
  </div>

  <Dialog bind:open={conflictOpen} title="This article changed on GitHub">
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
  .connected, .lang { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; }
  .newtag { display: inline-flex; padding: 2px 9px; border-radius: 999px; background: var(--cyan); color: var(--ink); font-size: var(--text-xs); font-weight: 600; }
  .sub-h { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--rule-soft); }
  .imgtext { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; align-items: start; margin-top: 8px; }
  .imgtext .shot img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--rule-soft); background: var(--rule-soft); }
  .imgtext .field:first-child { margin-top: 0; }
  .dim { color: var(--slate); font-weight: 400; }
  @media (max-width: 640px) { .imgtext { grid-template-columns: minmax(0, 1fr); } }
  .connected { background: var(--ok-soft); color: var(--ok); }
  .lang { background: var(--blue-soft); color: var(--blue); }
  .unsaved { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--warn); font-weight: 500; }
  .unsaved .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .english { display: flex; gap: 8px; align-items: flex-start; padding: 10px 14px; border-radius: var(--radius); font-size: var(--text-sm); }
  .english { background: var(--blue-soft); color: var(--graphite); }
  .sections { display: flex; gap: 6px; align-items: flex-start; }
  .notepreview { margin-top: 14px; padding: 12px 14px; border-left: 3px solid var(--rule); background: var(--white); border-radius: 0 var(--radius) var(--radius) 0; display: grid; gap: 4px; }
  .meta-label { font-size: var(--text-xs); color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .lnk { color: var(--blue); text-decoration: underline; text-underline-offset: 2px; }
  .lnk.bad { color: var(--danger); text-decoration-style: wavy; }
  .related { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 8px; }
  .related li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: center; }
  .related .full { grid-column: 2 / -1; }
  .n { color: var(--slate); font-size: var(--text-sm); text-align: right; font-variant-numeric: tabular-nums; }
  .tools { display: flex; gap: 2px; }
  .tools :global(.btn) { padding: 0 6px; }
  .up :global(svg) { transform: rotate(-90deg); }
  .down :global(svg) { transform: rotate(90deg); }
  .card-head .meta { color: var(--slate); font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .seo-side { display: grid; gap: 10px; }
  .seo-facts, .facts { margin: 0; display: grid; gap: 10px; font-size: var(--text-sm); }
  .seo-facts dt, .facts dt { color: var(--slate); }
  .seo-facts dd, .facts dd { margin: 0; overflow-wrap: anywhere; }
  .facts { margin-bottom: 12px; }
  .facts div { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 8px; }
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
  @media (max-width: 640px) { .related li { grid-template-columns: minmax(0, 1fr) auto; } .n { display: none; } }
</style>
