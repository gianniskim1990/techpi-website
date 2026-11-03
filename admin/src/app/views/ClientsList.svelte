<script>
  /**
   * Clients and billing (Task C1): every client with their domains, next renewal, what they were charged, what they paid
   * and what they still owe; above it, the overview (money owed, payments of the last 30 days, expired and soon-expiring
   * services). Private: read from the admin's own database (worker/clients.js), never from or to GitHub.
   */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { formatCents } from '../../../shared/clients-content.js';

  let data = $state(null);
  let error = $state(null);
  let loading = $state(false);
  async function load() {
    loading = true;
    try { data = await api.listClients(); error = null; } catch (e) { error = e.message; } finally { loading = false; }
  }
  $effect(() => { untrack(load); });

  let q = $state('');
  let show = $state('all');
  let sort = $state('name');
  const rows = $derived.by(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    const list = data.clients.filter((c) => {
      if (term && ![c.name, c.company, c.email, c.vatNumber, ...c.domains].some((v) => v?.toLowerCase().includes(term))) return false;
      if (show === 'owing') return c.balanceCents > 0;
      if (show === 'renewals') return c.nextExpiry && c.nextExpiry.days <= 60;
      return true;
    });
    if (sort === 'balance') list.sort((a, b) => b.balanceCents - a.balanceCents);
    if (sort === 'expiry') list.sort((a, b) => (a.nextExpiry?.date ?? '9999').localeCompare(b.nextExpiry?.date ?? '9999'));
    return list;
  });
  const renewals = $derived(data ? [...data.overview.expired, ...data.overview.expiringSoon] : []);

  // ----- New client -----
  let open = $state(false);
  let form = $state({});
  let errors = $state({});
  let saving = $state(false);
  function start() { form = { name: '', company: '', email: '', phone: '', vatNumber: '', notes: '' }; errors = {}; open = true; }
  async function create() {
    saving = true;
    errors = {};
    try {
      const r = await api.createClient(form);
      open = false;
      toast('success', 'Client added', r.client.name);
      navigate(`/clients/${r.client.id}`);
    } catch (e) {
      if (e.fields) errors = e.fields;
      toast('error', 'Client not added', e.message);
    } finally {
      saving = false;
    }
  }
  let exporting = $state(false);
  async function exportCsv() {
    exporting = true;
    try { await api.exportClients(); } catch (e) { toast('error', 'Export failed', e.message); } finally { exporting = false; }
  }

  const day = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
  const when = (days) => (days < 0 ? `${-days} ${days === -1 ? 'day' : 'days'} ago` : days === 0 ? 'today' : `in ${days} ${days === 1 ? 'day' : 'days'}`);
</script>

<header class="head">
  <div>
    <h1>Clients</h1>
    <p class="sub">Your clients, their domains and subscriptions, what they owe and what they have paid. Private: kept in the admin’s own database, never on GitHub or the website.</p>
  </div>
  <div class="acts">
    <button class="btn btn-secondary btn-sm" type="button" onclick={exportCsv} disabled={exporting || !data?.clients.length} aria-busy={exporting}><Icon name="download" size={15} />Export CSV</button>
    <button class="btn btn-primary btn-sm" type="button" onclick={start}><Icon name="plus" size={15} />New client</button>
  </div>
</header>

{#if loading && !data}
  <p class="hint" aria-live="polite">Loading…</p>
{:else if error && !data}
  <div class="card msg err" role="alert">
    <p><Icon name="alert" size={16} /><span>{error}</span></p>
    <button class="btn btn-secondary btn-sm" type="button" onclick={load}>Try again</button>
  </div>
{:else if data}
  <section class="stats" aria-label="Overview">
    <div class="card stat" class:due={data.overview.outstandingCents > 0}>
      <span class="k">Owed to you</span>
      <strong>{formatCents(data.overview.outstandingCents)}</strong>
      <span class="hint">{data.overview.clientsOwing === 0 ? 'Nobody owes you' : data.overview.clientsOwing === 1 ? '1 client owes' : `${data.overview.clientsOwing} clients owe`}{data.overview.creditCents ? ` · ${formatCents(data.overview.creditCents)} paid in advance` : ''}</span>
    </div>
    <div class="card stat">
      <span class="k">Paid in the last 30 days</span>
      <strong>{formatCents(data.overview.paidLast30Cents)}</strong>
      <span class="hint">Up to {day(data.today)}</span>
    </div>
    <div class="card stat" class:bad={data.overview.expired.length > 0}>
      <span class="k">Expired</span>
      <strong>{data.overview.expired.length}</strong>
      <span class="hint">Active services past their expiry date</span>
    </div>
    <div class="card stat" class:warn={data.overview.expiringSoon.length > 0}>
      <span class="k">Renewals in 60 days</span>
      <strong>{data.overview.expiringSoon.length}</strong>
      <span class="hint">Active services expiring soon</span>
    </div>
  </section>

  {#if renewals.length}
    <section class="card renewals" aria-labelledby="ren-h">
      <div class="card-head"><h2 id="ren-h">Renewals</h2><span class="hint">Expired and expiring within 60 days</span></div>
      <ul>
        {#each renewals as s (s.id)}
          <li>
            <span class="chip" class:bad={s.days < 0} class:warn={s.days >= 0 && s.days <= 14}>{when(s.days)}</span>
            <a href="#/clients/{s.clientId}"><strong>{s.domain ?? s.description}</strong></a>
            <span class="hint">{s.clientName} · {s.description} · {day(s.expiresOn)} · {formatCents(s.priceCents)}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="card">
    <div class="toolbar">
      <label class="search">
        <Icon name="search" size={16} />
        <span class="visually-hidden">Search</span>
        <input type="search" placeholder="Search names, domains, emails, VAT numbers…" bind:value={q} />
      </label>
      <div class="filters">
        <label><span class="visually-hidden">Show</span>
          <select class="select" bind:value={show}><option value="all">All clients</option><option value="owing">Owe money</option><option value="renewals">Renewal within 60 days</option></select>
        </label>
        <label><span class="visually-hidden">Sort</span>
          <select class="select" bind:value={sort}><option value="name">By name</option><option value="balance">By balance</option><option value="expiry">By next expiry</option></select>
        </label>
      </div>
    </div>
    {#if !data.clients.length}
      <div class="empty">
        <p><strong>No clients yet.</strong> Add your first client, then their domains and subscriptions, charges and payments.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick={start}><Icon name="plus" size={15} />New client</button>
      </div>
    {:else if !rows.length}
      <p class="msg">No clients match.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th scope="col">Client</th>
            <th scope="col" class="c-dom">Domains</th>
            <th scope="col">Next expiry</th>
            <th scope="col" class="num c-money">Charged</th>
            <th scope="col" class="num c-money">Paid</th>
            <th scope="col" class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as c (c.id)}
            <tr onclick={() => navigate(`/clients/${c.id}`)}>
              <td><div class="tt"><a href="#/clients/{c.id}" onclick={(e) => e.stopPropagation()}>{c.name}</a>{#if c.company}<span class="hint">{c.company}</span>{/if}</div></td>
              <td class="c-dom">{#if c.domains.length}{c.domains.join(', ')}{:else}<span class="hint">—</span>{/if}</td>
              <td>{#if c.nextExpiry}<span class="exp">{day(c.nextExpiry.date)}</span> <span class="chip" class:bad={c.nextExpiry.days < 0} class:warn={c.nextExpiry.days >= 0 && c.nextExpiry.days <= 30}>{when(c.nextExpiry.days)}</span>{:else}<span class="hint">—</span>{/if}</td>
              <td class="num c-money">{formatCents(c.chargedCents)}</td>
              <td class="num c-money">{formatCents(c.paidCents)}</td>
              <td class="num"><span class="bal" class:owes={c.balanceCents > 0} class:credit={c.balanceCents < 0}>{formatCents(c.balanceCents)}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  <p class="hint foot">Balance = charges − payments. A negative balance is money paid in advance. Back up with Export CSV from time to time.</p>
{/if}

<Dialog bind:open title="New client">
  <div class="form">
    {#each [['name', 'Name', 'Person or business, as you know them.'], ['company', 'Company (optional)', ''], ['email', 'Email (optional)', ''], ['phone', 'Phone (optional)', ''], ['vatNumber', 'VAT number / ΑΦΜ (optional)', '']] as [key, label, hint] (key)}
      <div class="field">
        <label class="label" for="nc-{key}">{label}</label>
        <input class="input" id="nc-{key}" type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} bind:value={form[key]} aria-invalid={errors[key] ? 'true' : undefined} />
        {#if errors[key]}<p class="error-text">{errors[key]}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
      </div>
    {/each}
    <div class="field">
      <label class="label" for="nc-notes">Notes (optional)</label>
      <textarea class="textarea" id="nc-notes" rows="3" bind:value={form.notes} aria-invalid={errors.notes ? 'true' : undefined}></textarea>
      {#if errors.notes}<p class="error-text">{errors.notes}</p>{/if}
    </div>
  </div>
  {#snippet actions()}
    <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Cancel</button>
    <button class="btn btn-primary" type="button" onclick={create} disabled={saving} aria-busy={saving}>{saving ? 'Saving…' : 'Add client'}</button>
  {/snippet}
</Dialog>

<style>
  .head { margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-start; justify-content: space-between; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 64ch; }
  .acts { display: flex; gap: 8px; flex-wrap: wrap; }
  .acts .btn { display: inline-flex; align-items: center; gap: 6px; }
  .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stat { display: grid; gap: 4px; padding: 14px 16px; }
  .stat .k { font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; }
  .stat strong { font-size: var(--text-xl); font-variant-numeric: tabular-nums; }
  .stat.due strong { color: var(--danger); }
  .stat.bad strong { color: var(--danger); }
  .stat.warn strong { color: var(--warn); }
  .renewals { margin-bottom: 16px; }
  .renewals h2 { font-size: var(--text-md); }
  .renewals ul { list-style: none; margin: 0; padding: 8px 20px 14px; display: grid; gap: 8px; }
  .renewals li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
  .renewals a { color: var(--ink); }
  .chip { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; background: var(--rule-soft); color: var(--graphite); white-space: nowrap; }
  .chip.warn { background: var(--warn-soft); color: var(--warn); }
  .chip.bad { background: var(--danger-soft); color: var(--danger); }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--rule-soft); }
  .search { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; max-width: 420px; padding: 0 11px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); color: var(--slate); }
  .search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .search input { border: 0; outline: none; background: transparent; flex: 1; padding: 8px 0; font-size: var(--text-md); color: var(--ink); min-width: 0; }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; }
  .filters .select { width: auto; min-width: 150px; padding-top: 7px; padding-bottom: 7px; font-size: var(--text-base); }
  .msg { padding: 20px 16px; color: var(--slate); }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  .empty { padding: 28px 16px; display: grid; justify-items: start; gap: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; }
  tbody tr { cursor: pointer; transition: background-color 120ms var(--ease); }
  tbody tr:hover { background: var(--white); }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tt { display: grid; }
  .tt a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .tt a:hover { color: var(--blue); text-decoration: underline; }
  .c-dom { color: var(--graphite); overflow-wrap: anywhere; }
  .exp { white-space: nowrap; }
  .bal { font-weight: 600; }
  .bal.owes { color: var(--danger); }
  .bal.credit { color: var(--ok); }
  .foot { margin-top: 12px; }
  .form { display: grid; gap: 4px; }
  @media (max-width: 1100px) { .c-money { display: none; } .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) {
    thead { display: none; }
    table, tbody, tr, td { display: block; }
    tr { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); }
    td { padding: 2px 0; border: 0; text-align: left; }
    .num { text-align: left; }
    .search { max-width: none; }
    .filters, .filters label, .filters .select { width: 100%; }
    .stats { grid-template-columns: minmax(0, 1fr); }
  }
</style>
