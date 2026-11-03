/**
 * Analytics consent (src/components/Consent.astro). Google Analytics 4 runs only after the visitor accepts it:
 *
 * - No choice yet: the banner shows, and nothing from Google is loaded and no cookie is set.
 * - Accept: the choice is kept in localStorage for 12 months, then gtag.js loads with analytics storage granted and
 *   every advertising signal denied (no Google signals, no ad personalisation).
 * - Reject: the choice is kept the same way; nothing loads.
 * - "Cookie settings" in the footer shows the banner again. Rejecting after accepting turns measurement off at once
 *   and deletes the _ga cookies Google set on this site.
 *
 * Storage that fails (private mode, blocked site data) counts as no choice: the banner shows again on the next page.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    [key: `ga-disable-${string}`]: boolean;
  }
}

type Choice = 'granted' | 'denied';
const KEY = 'techpi-analytics-consent';
const KEEP_MS = 365 * 24 * 60 * 60 * 1000;

const banner = document.querySelector<HTMLElement>('[data-consent]');
const id = banner?.dataset.measurementId;

function read(): Choice | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null') as { choice?: string; at?: number } | null;
    if (!saved || typeof saved.at !== 'number' || Date.now() - saved.at > KEEP_MS) return null;
    return saved.choice === 'granted' || saved.choice === 'denied' ? saved.choice : null;
  } catch {
    return null;
  }
}

function save(choice: Choice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    // Not kept: the banner asks again on the next page.
  }
}

let loaded = false;
function load() {
  if (!id) return;
  window[`ga-disable-${id}`] = false;
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads Arguments objects from the dataLayer, so this must push `arguments`, not an array.
  // eslint-disable-next-line prefer-rest-params
  const gtag: (...args: unknown[]) => void = function () { window.dataLayer!.push(arguments); };
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

/** Stops measurement on this page and removes Google Analytics cookies (_ga, _ga_<id>) from this site. */
function stop() {
  if (id) window[`ga-disable-${id}`] = true;
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!/^_ga(_|$)/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ''}`;
  }
}

function show() {
  if (!banner) return;
  banner.hidden = false;
}

function choose(choice: Choice) {
  save(choice);
  if (banner) banner.hidden = true;
  if (choice === 'granted') load();
  else stop();
}

if (banner && id) {
  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => choose('granted'));
  banner.querySelector('[data-consent-reject]')?.addEventListener('click', () => choose('denied'));
  for (const b of document.querySelectorAll('[data-consent-open]')) b.addEventListener('click', show);
  const choice = read();
  if (choice === 'granted') load();
  else if (choice === null) show();
}

export {};
