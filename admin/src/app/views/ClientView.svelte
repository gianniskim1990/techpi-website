<script>
  /**
   * One client (Task C1): their details, their services (domains, subscriptions and one-off jobs, with expiry dates and
   * renewal), and their account: every charge and payment in date order with the running balance. Each change is saved
   * at once to the admin's own database (worker/clients.js); nothing here goes to GitHub or the website.
   */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { formatCents, PERIODS, PERIOD_MONTHS, METHODS, addMonths } from '../../../shared/clients-content.js';

  let { id } = $props();
  let data = $state(null);
  let error = $state(null);
  async function load() {
    try { data = await api.getClient(id); error = null; } catch (e) { error = e; }
  }
  $effect(() => { untrack(load); });

  const day = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
  const when = (days) => (days < 0 ? `expired ${-days} ${days === -1 ? 'day' : 'days'} ago` : days === 0 ? 'expires today' : `in ${days} ${days === 1 ? 'day' : 'days'}`);
  const euro = (cents) => (cents / 100).toFixed(2).replace('.', ',');

  /** Charges and payments together, oldest first, with the balance after each. */
  const ledger = $derived.by(() => {
    if (!data) return [];
    const rows = [
      ...data.charges.map((c) => ({ kind: 'charge', key: `c${c.id}`, ...c })),
      ...data.payments.map((p) => ({ kind: 'payment', key: `p${p.id}`, ...p })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? a.id - b.id : a.kind === 'charge' ? -1 : 1));
    let balance = 0;
    return rows.map((r) => ({ ...r, balance: (balance += r.kind === 'charge' ? r.amountCents : -r.amountCents) }));
  });
  const serviceName = (sid) => { const s = data?.services.find((x) => x.id === sid); return s ? s.domain ?? s.description : null; };

  // ----- One dialog for every form: client, service, renew, payment, charge -----
  let mode = $state(null);
  let open = $state(false);
  let form = $state({});
  let errors = $state({});
  let busy = $state(false);
  let target = $state(null); // the service being edited or renewed
  const TITLES = { client: 'Client details', service: 'Add a service', 'edit-service': 'Edit the service', renew: 'Renew', payment: 'Record a payment', charge: 'Add a charge' };
  function start(m, s = null) {
    mode = m;
    target = s;
    errors = {};
    const t = data.today;
    const c = data.client;
    if (m === 'client') form = { name: c.name, company: c.company ?? '', email: c.email ?? '', phone: c.phone ?? '', vatNumber: c.vatNumber ?? '', notes: c.notes ?? '' };
    if (m === 'service') form = { domain: '', description: 'Hosting', period: 'yearly', price: '', startDate: t, expiresOn: addMonths(t, 12), status: 'active', notes: '', chargeNow: true };
    if (m === 'edit-service') form = { domain: s.domain ?? '', description: s.description, period: s.period, price: euro(s.priceCents), startDate: s.startDate, expiresOn: s.expiresOn ?? '', status: s.status, notes: s.notes ?? '' };
    if (m === 'renew') form = { date: t, price: euro(s.priceCents) };
    if (m === 'payment') form = { date: t, amount: data.totals.balanceCents > 0 ? euro(data.totals.balanceCents) : '', method: 'bank', note: '' };
    if (m === 'charge') form = { date: t, description: '', amount: '', serviceId: '' };
    open = true;
  }
  // A new service's expiry follows its start date and period until the owner changes it by hand.
  function periodChanged() {
    if (mode !== 'service') return;
    const months = PERIOD_MONTHS[form.period];
    form.expiresOn = months && form.startDate ? addMonths(form.startDate, months) : '';
  }
  async function submit() {
    busy = true;
    errors = {};
    try {
      const sid = target?.id;
      const call = {
        client: () => api.updateClient(id, form),
        service: () => api.addService(id, form),
        'edit-service': () => api.updateService(id, sid, form),
        renew: () => api.renewService(id, sid, form),
        payment: () => api.addPayment(id, form),
        charge: () => api.addCharge(id, { ...form, serviceId: form.serviceId ? Number(form.serviceId) : null }),
      }[mode];
      data = await call();
      open = false;
      toast('success', { client: 'Client saved', service: 'Service added', 'edit-service': 'Service saved', renew: 'Renewed', payment: 'Payment recorded', charge: 'Charge added' }[mode], mode === 'renew' ? `New expiry: ${day(data.services.find((x) => x.id === sid)?.expiresOn)}` : '');
    } catch (e) {
      if (e.fields) errors = e.fields;
      toast('error', 'Not saved', e.message);
    } finally {
      busy = false;
    }
  }
  const renewTo = $derived(mode === 'renew' && target?.expiresOn ? addMonths(target.expiresOn, PERIOD_MONTHS[target.period]) : null);

  // ----- Deleting (two clicks) -----
  let confirm = $state(null);
  async function remove(kind, item) {
    const key = `${kind}-${item?.id ?? ''}`;
    if (confirm !== key) { confirm = key; setTimeout(() => { if (confirm === key) confirm = null; }, 4000); return; }
    confirm = null;
    try {
      if (kind === 'client') { await api.deleteClient(id); toast('success', 'Client deleted'); navigate('/clients'); return; }
      data = await { service: () => api.deleteService(id, item.id), charge: () => api.deleteCharge(id, item.id), payment: () => api.deletePayment(id, item.id) }[kind]();
      toast('success', `${kind[0].toUpperCase()}${kind.slice(1)} deleted`);
    } catch (e) {
      toast('error', 'Not deleted', e.message);
    }
  }
</script>

{#snippet field(key, label, opts = {})}
  <div class="field">
    <label class="label" for="cf-{key}">{label}{#if opts.optional} <span class="opt">(optional)</span>{/if}</label>
    {#if opts.select}
      <select class="select" id="cf-{key}" bind:value={form[key]} onchange={opts.onchange} aria-invalid={errors[key] ? 'true' : undefined}>
        {#each opts.select as [v, t] (v)}<option value={v}>{t}</option>{/each}
      </select>
    {:else if opts.rows}
      <textarea class="textarea" id="cf-{key}" rows={opts.rows} bind:value={form[key]} aria-invalid={errors[key] ? 'true' : undefined}></textarea>
    {:else}
      <input class="input" id="cf-{key}" type={opts.type ?? 'text'} inputmode={opts.money ? 'decimal' : undefined} bind:value={form[key]} onchange={opts.onchange} aria-invalid={errors[key] ? 'true' : undefined} />
    {/if}
    {#if errors[key]}<p class="error-text">{errors[key]}</p>{:else if opts.hint}<p class="hint">{opts.hint}</p>{/if}
  </div>
{/snippet}

<a class="back" href="#/clients"><Icon name="back" size={15} />Clients</a>

{#if error && !data}
  <div class="card msg err" role="alert">
    <p><Icon name="alert" size={16} /><span>{error.status === 404 ? 'There is no such client.' : error.message}</span></p>
    {#if error.status !== 404}<button class="btn btn-secondary btn-sm" type="button" onclick={load}>Try again</button>{/if}
  </div>
{:else if !data}
  <p class="hint" aria-live="polite">Loading…</p>
{:else}
  {@const c = data.client}
  <header class="head">
    <div>
      <h1>{c.name}</h1>
      {#if c.company}<p class="sub">{c.company}</p>{/if}
    </div>
    <div class="acts">
      <button class="btn btn-secondary btn-sm" type="button" onclick={() => start('charge')}><Icon name="plus" size={15} />Charge</button>
      <button class="btn btn-primary btn-sm" type="button" onclick={() => start('payment')}><Icon name="check" size={15} />Record payment</button>
    </div>
  </header>

  <section class="stats" aria-label="Account">
    <div class="card stat"><span class="k">Charged</span><strong>{formatCents(data.totals.chargedCents)}</strong></div>
    <div class="card stat"><span class="k">Paid</span><strong>{formatCents(data.totals.paidCents)}</strong></div>
    <div class="card stat" class:owes={data.totals.balanceCents > 0} class:credit={data.totals.balanceCents < 0}>
      <span class="k">{data.totals.balanceCents < 0 ? 'Paid in advance' : 'Balance owed'}</span>
      <strong>{formatCents(Math.abs(data.totals.balanceCents))}</strong>
    </div>
  </section>

  <div class="cols">
    <section class="card" aria-labelledby="svc-h">
      <div class="card-head"><h2 id="svc-h">Services and domains</h2><button class="btn btn-secondary btn-sm" type="button" onclick={() => start('service')}><Icon name="plus" size={14} />Add service</button></div>
      {#if data.services.length}
        <ul class="services">
          {#each data.services as s (s.id)}
            <li class:off={s.status === 'cancelled'}>
              <div class="sinfo">
                <strong>{s.domain ?? s.description}</strong>
                <span class="hint">{s.domain ? `${s.description} · ` : ''}{PERIODS[s.period]} · {formatCents(s.priceCents)}{s.status === 'cancelled' ? ' · cancelled' : ''}</span>
                {#if s.expiresOn}
                  <span class="exp">Expires {day(s.expiresOn)} {#if s.status === 'active'}<span class="chip" class:bad={s.days < 0} class:warn={s.days >= 0 && s.days <= 30}>{when(s.days)}</span>{/if}</span>
                {:else}<span class="hint">Since {day(s.startDate)}</span>{/if}
              </div>
              <div class="sacts">
                {#if s.status === 'active' && s.period !== 'one-off'}<button class="btn btn-secondary btn-sm" type="button" onclick={() => start('renew', s)}><Icon name="renew" size={14} />Renew</button>{/if}
                <button class="btn btn-ghost btn-sm" type="button" onclick={() => start('edit-service', s)}>Edit</button>
                <button class="btn btn-ghost btn-sm" type="button" onclick={() => remove('service', s)} aria-label="Delete {s.domain ?? s.description}">{confirm === `service-${s.id}` ? 'Confirm delete' : 'Delete'}</button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="pad hint">No services yet. Add a domain, hosting or maintenance subscription, or a one-off job.</p>
      {/if}
    </section>

    <section class="card details" aria-labelledby="det-h">
      <div class="card-head"><h2 id="det-h">Details</h2><button class="btn btn-ghost btn-sm" type="button" onclick={() => start('client')}>Edit</button></div>
      <dl>
        <div><dt>Email</dt><dd>{#if c.email}<a href="mailto:{c.email}">{c.email}</a>{:else}—{/if}</dd></div>
        <div><dt>Phone</dt><dd>{#if c.phone}<a href="tel:{c.phone.replace(/\s+/g, '')}">{c.phone}</a>{:else}—{/if}</dd></div>
        <div><dt>VAT number</dt><dd>{c.vatNumber ?? '—'}</dd></div>
        {#if c.notes}<div><dt>Notes</dt><dd class="notes">{c.notes}</dd></div>{/if}
        <div><dt>Client since</dt><dd>{day(c.createdAt.slice(0, 10))}</dd></div>
      </dl>
      <button class="btn btn-ghost btn-sm del" type="button" onclick={() => remove('client')}>{confirm === 'client-' ? 'Confirm: delete this client' : 'Delete client'}</button>
    </section>
  </div>

  <section class="card" aria-labelledby="acc-h">
    <div class="card-head"><h2 id="acc-h">Account</h2><span class="hint">Charges and payments, oldest first</span></div>
    {#if ledger.length}
      <table>
        <thead><tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col" class="num">Charge</th><th scope="col" class="num">Payment</th><th scope="col" class="num">Balance</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {#each ledger as r (r.key)}
            <tr class={r.kind}>
              <td class="nowrap">{day(r.date)}</td>
              <td>{#if r.kind === 'charge'}{r.description}{:else}Payment · {METHODS[r.method] ?? r.method}{r.note ? ` · ${r.note}` : ''}{/if}</td>
              <td class="num">{r.kind === 'charge' ? formatCents(r.amountCents) : ''}</td>
              <td class="num pay">{r.kind === 'payment' ? formatCents(r.amountCents) : ''}</td>
              <td class="num"><span class:owes={r.balance > 0} class:credit={r.balance < 0}>{formatCents(r.balance)}</span></td>
              <td class="num"><button class="btn btn-ghost btn-sm" type="button" onclick={() => remove(r.kind, r)} aria-label="Delete this {r.kind}">{confirm === `${r.kind}-${r.id}` ? 'Confirm' : 'Delete'}</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="pad hint">Nothing charged or paid yet. Adding a service charges its first period; you can also add a charge or record a payment.</p>
    {/if}
  </section>
{/if}

<Dialog bind:open title={mode === 'renew' && target ? `Renew ${target.domain ?? target.description}` : TITLES[mode] ?? ''}>
  <div class="form">
    {#if mode === 'client'}
      {@render field('name', 'Name')}
      {@render field('company', 'Company', { optional: true })}
      <div class="two">{@render field('email', 'Email', { optional: true, type: 'email' })}{@render field('phone', 'Phone', { optional: true, type: 'tel' })}</div>
      {@render field('vatNumber', 'VAT number / ΑΦΜ', { optional: true })}
      {@render field('notes', 'Notes', { optional: true, rows: 3 })}
    {:else if mode === 'service' || mode === 'edit-service'}
      {@render field('domain', 'Domain', { optional: true, hint: 'For example example.gr. Leave empty for work without a domain.' })}
      {@render field('description', 'What it is', { hint: 'Hosting, domain registration, maintenance, a website build…' })}
      <div class="two">
        {@render field('period', 'Billed', { select: Object.entries(PERIODS), onchange: periodChanged })}
        {@render field('price', 'Price (€)', { money: true, hint: form.period === 'one-off' ? 'The whole job.' : 'For each period.' })}
      </div>
      <div class="two">
        {@render field('startDate', 'Start date', { type: 'date', onchange: periodChanged })}
        {@render field('expiresOn', 'Expiry date', { type: 'date', optional: form.period === 'one-off', hint: form.period === 'one-off' ? '' : 'When it must be renewed.' })}
      </div>
      {#if mode === 'edit-service'}{@render field('status', 'Status', { select: [['active', 'Active'], ['cancelled', 'Cancelled (no longer renewed)']] })}{/if}
      {@render field('notes', 'Notes', { optional: true, rows: 2 })}
      {#if mode === 'service'}
        <label class="check"><input type="checkbox" bind:checked={form.chargeNow} /> Charge the {form.period === 'one-off' ? 'price' : 'first period'} now, dated the start date</label>
      {/if}
    {:else if mode === 'renew' && target}
      <p class="hint">The expiry moves from {day(target.expiresOn)} to <strong>{day(renewTo)}</strong>, and the price is charged to the account.</p>
      <div class="two">{@render field('price', 'Price (€)', { money: true })}{@render field('date', 'Charge date', { type: 'date' })}</div>
    {:else if mode === 'payment'}
      <div class="two">{@render field('amount', 'Amount (€)', { money: true, hint: data && data.totals.balanceCents > 0 ? `Owed: ${formatCents(data.totals.balanceCents)}` : '' })}{@render field('date', 'Date', { type: 'date' })}</div>
      {@render field('method', 'Paid by', { select: Object.entries(METHODS) })}
      {@render field('note', 'Note', { optional: true, hint: 'For example the invoice or receipt number.' })}
    {:else if mode === 'charge'}
      {@render field('description', 'Description', { hint: 'What the client owes for.' })}
      <div class="two">{@render field('amount', 'Amount (€)', { money: true })}{@render field('date', 'Date', { type: 'date' })}</div>
      {#if data?.services.length}{@render field('serviceId', 'For service', { optional: true, select: [['', '—'], ...data.services.map((s) => [String(s.id), s.domain ? `${s.domain} · ${s.description}` : s.description])] })}{/if}
    {/if}
  </div>
  {#snippet actions()}
    <button class="btn btn-secondary" type="button" onclick={() => (open = false)}>Cancel</button>
    <button class="btn btn-primary" type="button" onclick={submit} disabled={busy} aria-busy={busy}>{busy ? 'Saving…' : mode === 'renew' ? 'Renew' : mode === 'payment' ? 'Record payment' : 'Save'}</button>
  {/snippet}
</Dialog>

<style>
  .back { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 12px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); }
  .back:hover { color: var(--blue); }
  .head { margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-start; justify-content: space-between; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); }
  .acts { display: flex; gap: 8px; flex-wrap: wrap; }
  .acts .btn, .card-head .btn, .sacts .btn { display: inline-flex; align-items: center; gap: 6px; }
  .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stat { display: grid; gap: 4px; padding: 14px 16px; }
  .stat .k { font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; }
  .stat strong { font-size: var(--text-xl); font-variant-numeric: tabular-nums; }
  .stat.owes strong, .owes { color: var(--danger); }
  .stat.credit strong, .credit { color: var(--ok); }
  .cols { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; align-items: start; }
  .card-head h2 { font-size: var(--text-md); }
  .services { list-style: none; margin: 0; padding: 0; }
  .services li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; padding: 12px 20px; border-bottom: 1px solid var(--rule-soft); }
  .services li:last-child { border-bottom: 0; }
  .services li.off { opacity: 0.6; }
  .sinfo { display: grid; gap: 2px; min-width: 0; }
  .sinfo strong { overflow-wrap: anywhere; }
  .exp { font-size: var(--text-sm); }
  .sacts { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .chip { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; background: var(--rule-soft); color: var(--graphite); white-space: nowrap; }
  .chip.warn { background: var(--warn-soft); color: var(--warn); }
  .chip.bad { background: var(--danger-soft); color: var(--danger); }
  .pad { padding: 16px 20px; }
  .details dl { margin: 0; padding: 12px 20px; display: grid; gap: 10px; font-size: var(--text-sm); }
  dt { color: var(--slate); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .notes { white-space: pre-line; }
  .del { margin: 0 20px 14px; color: var(--danger); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; font-size: var(--text-sm); }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.num { text-align: right; }
  .nowrap { white-space: nowrap; }
  .pay { color: var(--ok); }
  .msg { padding: 20px 16px; }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  .form { display: grid; gap: 4px; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; align-items: start; }
  .two > :global(.field + .field) { margin-top: 0; }
  .opt { color: var(--slate); font-weight: 400; }
  .check { display: flex; gap: 8px; align-items: center; margin-top: 14px; font-size: var(--text-sm); }
  @media (max-width: 900px) { .cols { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 640px) {
    .stats, .two { grid-template-columns: minmax(0, 1fr); }
    thead { display: none; }
    table, tbody, tr, td { display: block; }
    tr { padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; }
    td { padding: 0; border: 0; text-align: left; }
    td:empty { display: none; }
  }
</style>
