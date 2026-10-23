<script>
  /**
   * Creates a case study (Task M5). The facts (address, name, client, year, live site, group, capabilities) and the
   * sections are chosen here, once, and locked from then on like every other case study's. Both languages are written
   * before creating, because the site publishes every case study in English and Greek. Checked as you type with the same
   * rules the Worker applies (shared/case-study-content.js, validateNew). Creating writes the file on its own draft
   * branch and opens one draft pull request; nothing is published until that pull request is merged on GitHub.
   */
  import Icon from '../components/Icon.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';
  import { FIELDS, LOCALES, CAPABILITY_IDS, DESCRIPTION, NAME_MAX, SLUG_MAX, FIRST_YEAR, validateNew } from '../../../shared/case-study-content.js';

  if (!caseStudies.loaded) loadCaseStudies(); // the addresses already taken

  const CAPABILITY = { 'digital-products': 'Digital products', 'web-experiences': 'Web experiences', intelligence: 'Intelligence', 'digital-visibility': 'Digital visibility' };
  const year = new Date().getFullYear();
  // Optional sections: chosen once, then fixed. "What was built" needs an introduction, a list, or both.
  const OPTIONAL = [
    { key: 'highlights', label: 'Highlights', hint: 'Short functionality labels on the Work page.', list: true, add: 'Add highlight' },
    { key: 'disciplines', label: 'Disciplines', hint: 'Short labels on the Work page, for creative or marketing work.', list: true, add: 'Add discipline' },
    { key: 'builtIntro', label: 'What was built: introduction', hint: 'A short paragraph before the list, or on its own.', list: false },
    { key: 'builtItems', label: 'What was built: list', hint: 'What was delivered, item by item.', list: true, add: 'Add item' },
    { key: 'services', label: 'Services', list: true, add: 'Add service' },
    { key: 'technology', label: 'Technology', list: true, add: 'Add technology' },
    { key: 'outcome', label: 'Outcome', hint: 'Only outcomes the client has stated, in words. No metrics.', list: true, add: 'Add outcome' },
  ];
  const blankText = () => ({ category: '', summary: '', overview: [''], need: [''], builtIntro: '' });

  let facts = $state({ slug: '', name: '', client: '', clientEl: '', year: String(year), liveUrl: '', workGroup: 'client', capabilities: [] });
  let sections = $state(['builtIntro']);
  let text = $state({ en: blankText(), el: blankText() });
  let slugTouched = $state(false);
  let lang = $state('en');
  let tried = $state(false);
  let creating = $state(false);
  let serverErrors = $state({});
  let created = false; // set once the draft exists, so leaving the page no longer warns

  // The address follows the name until it is edited by hand: lower-case Latin letters, digits and hyphens.
  const slugify = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, SLUG_MAX).replace(/-+$/, '');
  $effect(() => { if (!slugTouched) facts.slug = slugify(facts.name); });

  function toggleSection(key, on) {
    sections = on ? [...sections, key] : sections.filter((k) => k !== key);
    const o = OPTIONAL.find((x) => x.key === key);
    for (const l of LOCALES) {
      if (on && text[l][key] === undefined) text[l][key] = o.list ? [''] : '';
      if (!on) delete text[l][key];
    }
  }
  const toggleCapability = (id, on) => { facts.capabilities = on ? CAPABILITY_IDS.filter((c) => c === id || facts.capabilities.includes(c)) : facts.capabilities.filter((c) => c !== id); };

  /** What is sent: blank optional facts are left out; the text has exactly the chosen sections. */
  const payload = $derived.by(() => {
    const f = { slug: facts.slug.trim(), name: facts.name, year: facts.year.trim(), workGroup: facts.workGroup, capabilities: facts.capabilities };
    for (const k of ['client', 'clientEl', 'liveUrl']) if (facts[k].trim()) f[k] = facts[k];
    const pick = (t) => Object.fromEntries(['category', 'summary', 'overview', 'need', ...OPTIONAL.map((o) => o.key)].filter((k) => k === 'category' || k === 'summary' || k === 'overview' || k === 'need' || sections.includes(k)).map((k) => [k, t[k]]));
    return { facts: f, en: pick(text.en), el: pick(text.el) };
  });
  const taken = $derived(caseStudies.entries.map((e) => e.slug));
  const check = $derived(validateNew(payload, { order: 1, taken, year }));
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const ferr = (k) => errors[`facts.${k}`];
  const err = (k) => errors[`${lang}.${k}`];
  const listErrors = (k) => {
    const out = { _: errors[`${lang}.${k}`] };
    for (const key of Object.keys(errors)) if (key.startsWith(`${lang}.${k}.`)) out[key.slice(`${lang}.${k}.`.length)] = errors[key];
    return out;
  };
  const langHasErrors = (l) => Object.keys(errors).some((k) => k.startsWith(`${l}.`));
  const factsHaveErrors = $derived(Object.keys(errors).some((k) => k.startsWith('facts')));
  const len = (v) => (v ?? '').trim().length;
  const note = $derived(facts.workGroup === 'earlier' ? (lang === 'el' ? ' Παλαιότερο έργο της pigiota314.' : ' Earlier work by pigiota314.') : '');
  const dirty = $derived(Boolean(facts.name || text.en.summary || text.el.summary));

  async function create() {
    tried = true;
    serverErrors = {};
    if (!check.ok) {
      const firstLang = LOCALES.find((l) => Object.keys(check.errors).some((k) => k.startsWith(`${l}.`)));
      if (!Object.keys(check.errors).some((k) => k.startsWith('facts')) && firstLang && !langHasErrors(lang)) lang = firstLang;
      toast('error', 'Not created', 'Some fields need attention.');
      return;
    }
    creating = true;
    try {
      const r = await api.createCaseStudy(payload);
      toast('success', 'Case study created as a draft', `Draft pull request #${r.draft?.number} is open on GitHub. The website is not changed until it is merged.`);
      created = true;
      await loadCaseStudies();
      navigate(`/case-studies/${r.slug}`);
    } catch (e) {
      if (e.fields) serverErrors = e.fields;
      toast('error', 'Not created', e.message);
    } finally {
      creating = false;
    }
  }
  $effect(() => {
    if (!dirty || created) return;
    const warn = (e) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/case-studies"><Icon name="back" size={16} />Case studies</a>
</nav>

<header class="head">
  <h1>New case study</h1>
  <p class="sub">Published in English and Greek at <code>/work/{facts.slug || '…'}</code> once its draft pull request is merged. The facts and sections you choose here are fixed afterwards; the text stays editable.</p>
</header>

<div class="layout">
  <div class="col">
    <section class="card" aria-labelledby="facts-h">
      <div class="card-head"><h2 id="facts-h">Project</h2>{#if tried && factsHaveErrors}<span class="flag">Needs attention</span>{/if}</div>
      <div class="card-body grid2">
        <div class="field">
          <label class="label" for="n-name"><span>Project name</span><span class="meta" class:over={len(facts.name) > NAME_MAX}>{len(facts.name)}/{NAME_MAX}</span></label>
          <input class="input" id="n-name" bind:value={facts.name} aria-invalid={ferr('name') ? 'true' : undefined} />
          {#if ferr('name')}<p class="error-text">{ferr('name')}</p>{:else}<p class="hint">As the client names it. Not translated.</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="n-slug"><span>Address</span><span class="meta">/work/…</span></label>
          <input class="input mono" id="n-slug" bind:value={facts.slug} oninput={() => (slugTouched = true)} spellcheck="false" autocomplete="off" aria-invalid={ferr('slug') ? 'true' : undefined} />
          {#if ferr('slug')}<p class="error-text">{ferr('slug')}</p>{:else}<p class="hint">Lower-case Latin letters, digits and hyphens. It cannot be changed later.</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="n-client"><span>Client <span class="opt">(optional)</span></span></label>
          <input class="input" id="n-client" bind:value={facts.client} aria-invalid={ferr('client') ? 'true' : undefined} />
          {#if ferr('client')}<p class="error-text">{ferr('client')}</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="n-clientel"><span>Client, in Greek <span class="opt">(optional)</span></span></label>
          <input class="input" id="n-clientel" lang="el" bind:value={facts.clientEl} aria-invalid={ferr('clientEl') ? 'true' : undefined} />
          {#if ferr('clientEl')}<p class="error-text">{ferr('clientEl')}</p>{:else}<p class="hint">Only if the Greek name differs.</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="n-year"><span>Year</span></label>
          <input class="input" id="n-year" inputmode="numeric" maxlength="4" bind:value={facts.year} aria-invalid={ferr('year') ? 'true' : undefined} />
          {#if ferr('year')}<p class="error-text">{ferr('year')}</p>{:else}<p class="hint">From {FIRST_YEAR}.</p>{/if}
        </div>
        <div class="field">
          <label class="label" for="n-url"><span>Live website <span class="opt">(optional)</span></span></label>
          <input class="input" id="n-url" type="url" placeholder="https://" bind:value={facts.liveUrl} aria-invalid={ferr('liveUrl') ? 'true' : undefined} />
          {#if ferr('liveUrl')}<p class="error-text">{ferr('liveUrl')}</p>{/if}
        </div>
        <fieldset class="field choice">
          <legend class="label"><span>Group on the Work page</span></legend>
          <label><input type="radio" name="group" value="client" bind:group={facts.workGroup} /> Client projects</label>
          <label><input type="radio" name="group" value="earlier" bind:group={facts.workGroup} /> Earlier work by pigiota314</label>
          {#if ferr('workGroup')}<p class="error-text">{ferr('workGroup')}</p>{:else}<p class="hint">It is added at the end of its group.</p>{/if}
        </fieldset>
        <fieldset class="field choice">
          <legend class="label"><span>Capabilities shown</span></legend>
          {#each CAPABILITY_IDS as id}
            <label><input type="checkbox" checked={facts.capabilities.includes(id)} onchange={(e) => toggleCapability(id, e.currentTarget.checked)} /> {CAPABILITY[id]}</label>
          {/each}
          {#if ferr('capabilities')}<p class="error-text">{ferr('capabilities')}</p>{:else}<p class="hint">Only where the project supports it. None is fine.</p>{/if}
        </fieldset>
      </div>
    </section>

    <section class="card" aria-labelledby="sec-h">
      <div class="card-head"><h2 id="sec-h">Sections</h2></div>
      <div class="card-body">
        <p class="hint">Every case study has a category, a summary, an overview and the need. Choose the other sections it has; they apply to both languages and are fixed after creating.</p>
        <div class="checks">
          {#each OPTIONAL as o (o.key)}
            <label><input type="checkbox" checked={sections.includes(o.key)} onchange={(e) => toggleSection(o.key, e.currentTarget.checked)} /> {o.label}</label>
          {/each}
        </div>
        {#if tried && errors.entry}<p class="error-text" role="alert">{errors.entry}</p>{/if}
      </div>
    </section>

    <div class="langs" role="tablist" aria-label="Language">
      {#each LOCALES as l}
        <button role="tab" type="button" aria-selected={lang === l} class:has-errors={langHasErrors(l)} onclick={() => (lang = l)}>{l === 'en' ? 'English' : 'Greek'}</button>
      {/each}
    </div>

    {#key lang}
      <section class="card" aria-labelledby="txt-h">
        <div class="card-head"><h2 id="txt-h">{lang === 'en' ? 'English text' : 'Greek text'}</h2></div>
        <div class="card-body">
          <div class="field">
            <label class="label" for="t-category"><span>Category</span><span class="meta" class:over={len(text[lang].category) > FIELDS.category.max}>{len(text[lang].category)}/{FIELDS.category.max}</span></label>
            <input class="input" id="t-category" {lang} bind:value={text[lang].category} aria-invalid={err('category') ? 'true' : undefined} />
            {#if err('category')}<p class="error-text">{err('category')}</p>{:else}<p class="hint">Shown above the project name and in the page title.</p>{/if}
          </div>
          <div class="field">
            <label class="label" for="t-summary"><span>Summary</span><span class="meta" class:over={len(text[lang].summary) + note.length > DESCRIPTION.max || len(text[lang].summary) + note.length < DESCRIPTION.min}>{len(text[lang].summary)}/{DESCRIPTION.min - note.length}–{DESCRIPTION.max - note.length}</span></label>
            <textarea class="textarea" id="t-summary" {lang} rows="3" bind:value={text[lang].summary} aria-invalid={err('summary') ? 'true' : undefined}></textarea>
            {#if err('summary')}<p class="error-text">{err('summary')}</p>{:else}<p class="hint">Shown on the Work page and as the search description.</p>{/if}
          </div>
          {#each ['highlights', 'disciplines'].filter((k) => sections.includes(k)) as k (k)}
            {@const o = OPTIONAL.find((x) => x.key === k)}
            <div class="field"><ListEditor bind:items={text[lang][k]} label={o.label} id="t-{k}" {lang} itemMax={FIELDS[k].itemMax} min={FIELDS[k].min} max={FIELDS[k].max} errors={listErrors(k)} addLabel={o.add} hint={o.hint ?? ''} /></div>
          {/each}
          <div class="field"><ListEditor bind:items={text[lang].overview} label="Overview" id="t-overview" {lang} multiline itemMax={FIELDS.overview.itemMax} min={FIELDS.overview.min} max={FIELDS.overview.max} errors={listErrors('overview')} addLabel="Add paragraph" /></div>
          <div class="field"><ListEditor bind:items={text[lang].need} label="The need" id="t-need" {lang} multiline itemMax={FIELDS.need.itemMax} min={FIELDS.need.min} max={FIELDS.need.max} errors={listErrors('need')} addLabel="Add paragraph" /></div>
          {#if sections.includes('builtIntro')}
            <div class="field">
              <label class="label" for="t-builtIntro"><span>What was built: introduction</span><span class="meta" class:over={len(text[lang].builtIntro) > FIELDS.builtIntro.max}>{len(text[lang].builtIntro)}/{FIELDS.builtIntro.max}</span></label>
              <textarea class="textarea" id="t-builtIntro" {lang} rows="3" bind:value={text[lang].builtIntro} aria-invalid={err('builtIntro') ? 'true' : undefined}></textarea>
              {#if err('builtIntro')}<p class="error-text">{err('builtIntro')}</p>{/if}
            </div>
          {/if}
          {#each ['builtItems', 'services', 'technology', 'outcome'].filter((k) => sections.includes(k)) as k (k)}
            {@const o = OPTIONAL.find((x) => x.key === k)}
            <div class="field"><ListEditor bind:items={text[lang][k]} label={o.label} id="t-{k}" {lang} itemMax={FIELDS[k].itemMax} min={FIELDS[k].min} max={FIELDS[k].max} errors={listErrors(k)} addLabel={o.add} hint={o.hint ?? ''} /></div>
          {/each}
        </div>
      </section>
    {/key}
  </div>

  <aside class="rail" aria-label="Create">
    <section class="card">
      <div class="card-body rail-body">
        <button class="btn btn-primary" type="button" onclick={create} disabled={creating} aria-busy={creating}>{creating ? 'Creating on GitHub…' : 'Create draft'}</button>
        {#if tried && !check.ok}<p class="error-text">Fix the highlighted fields to create the case study.{' '}{#if langHasErrors(lang === 'en' ? 'el' : 'en')} The {lang === 'en' ? 'Greek' : 'English'} text needs attention too.{/if}</p>{/if}
        <p class="hint">Creating opens one draft pull request on GitHub with this case study’s file. The website does not change until you merge it.</p>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Also decided</h2></div>
      <div class="card-body">
        <ul class="decided">
          <li>Position: at the end of its group on the Work page.</li>
          <li>Images: none. The page is led by typography, like other case studies without a capture.</li>
          <li>Homepage: not featured.</li>
        </ul>
        <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: the draft and its text are visible to anyone on GitHub, even before it is published.</span></p>
      </div>
    </section>
  </aside>
</div>

<style>
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .head { margin: 8px 0 20px; }
  .sub { margin-top: 6px; color: var(--slate); max-width: 72ch; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
  .grid2 .field { margin-top: 14px; }
  .grid2 .field:nth-child(-n + 2) { margin-top: 0; }
  .choice { border: 0; padding: 0; display: grid; gap: 6px; }
  .choice label, .checks label { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); }
  .checks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 20px; margin-top: 12px; }
  .opt { color: var(--slate); font-weight: 400; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .flag { font-size: var(--text-xs); font-weight: 600; color: var(--danger); }
  .langs { display: flex; gap: 4px; border-bottom: 1px solid var(--rule); }
  .langs button { position: relative; padding: 10px 14px; border: 0; background: none; color: var(--slate); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .langs button[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--blue); }
  .langs button.has-errors::after { content: ''; position: absolute; top: 9px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
  .rail { position: sticky; top: 20px; display: grid; gap: 16px; }
  .rail-body { display: grid; gap: 10px; }
  .rail-body .btn { width: 100%; }
  .decided { margin: 0 0 12px; padding-left: 18px; display: grid; gap: 6px; font-size: var(--text-sm); }
  .warn { display: flex; gap: 6px; align-items: flex-start; padding-top: 12px; border-top: 1px solid var(--rule-soft); }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; }
  @media (max-width: 1100px) {
    .layout { grid-template-columns: minmax(0, 1fr); }
    .rail { position: static; }
  }
  @media (max-width: 640px) {
    .grid2, .checks { grid-template-columns: minmax(0, 1fr); }
    .grid2 .field:nth-child(2) { margin-top: 14px; }
  }
</style>
