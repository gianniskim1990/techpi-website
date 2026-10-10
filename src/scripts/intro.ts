/**
 * The homepage intro: the symbol, filled with moving light, flies to the header and settles beside the typographic
 * name, becoming the header's own symbol (docs/design/motion-system.md, section 14). It plays on every entry to the homepage (owner's decision, 2026-10-09):
 * a direct load, a reload, a link from another page or the other language, and back/forward, including a page
 * restored from the back/forward cache. Not when the tab only comes back into view.
 *
 * A homepage-only head script in BaseLayout decides eligibility before first paint and adds `html.intro`. The first
 * part of the choreography is CSS in Intro.astro and runs from first paint: the blurred backdrop, the circle, the
 * symbol, the line of type. This module adds what only a script can do, placed on the same timeline as soon as it
 * starts, so the compositor plays it on time even while the main thread is busy:
 *
 *   0.3 s  the footage plays inside the symbol, if it is running by 1.0 s (otherwise the static 3D symbol stays)
 *   1.7 s  the footage gives way to the white 3D symbol
 *   2.0 s  the symbol flies to the measured place of the header's symbol, shrinking to its size, and settles there
 *   2.5 s  the name rises out of a mask, in Sheet, beside the arriving symbol, on the dark backdrop
 *   2.6 s  the backdrop fades; in one frame of it the white symbol hands over to the header's blue symbol, and the
 *          name and the navigation turn to their normal Ink
 *   3.0 s  finishIntro(): every temporary element, class, animation, listener and video source is gone
 *
 * Any input (key, pointer, wheel, scroll, focus), a resize to another width, leaving the page, or a switch to reduced
 * motion ends it at once, through finishIntro(). Nothing is prevented or trapped: the input still does what it does.
 * Fail-safes: the head script ends the intro if this module has not started it within 2.5 s; this module ends it
 * 3.6 s after the overlay's first frame (or 4.5 s after its own start, if that frame is never found), and on any error.
 *
 * Restarting: start() can run again on the same page (a back/forward cache restore). Each run has its own state, only
 * one runs at a time, and finishIntro() returns the page to exactly its resting state, so the next run starts clean.
 */

export {};

type Timeline = { currentTime: CSSNumberish | null };

const root = document.documentElement;
const FOOTAGE_LATEST = 1000;
const SOLID_AT = 1700;
const FLIGHT_AT = 2000;
const FLIGHT_MS = 600;
/** The name rises as the symbol arrives beside it, so the symbol never passes over the letters while they are readable. */
const NAME_AT = 2500;
const NAME_MS = 240;
/** Slow to leave, as before, but it decelerates into the header: the symbol settles in its place instead of arriving at speed. */
const FLIGHT_EASE = [0.55, 0, 0.25, 1] as const;
const OUT_AT = 2600;
const OUT_MS = 400;
const END_AT = 3000;
const LIMIT = 3600;
/** Fallback limit from this module's start, for the case where the overlay's first frame cannot be found. */
const LIMIT_FROM_START = 4500;
/**
 * The handoff to Ink, inside the backdrop's 400 ms fade. Sheet text keeps 4.5:1 only while the background behind it
 * is darker than relative luminance 0.172, Ink text only once it is lighter than 0.193: no colour passes in between.
 * So at CROSS the backdrop's opacity steps across that band, from ALPHA_DARK to ALPHA_LIGHT (measured over the name:
 * relative luminance about 0.15 and 0.25, so 5.0:1 for Sheet before and 5.6:1 for Ink after)
 * in the same compositor frame as the Sheet twin of the name leaves and the real Ink name and navigation arrive.
 * Every frame stays at 4.5:1 or more, and a small step in the middle of a fade is not seen as a jump.
 */
const CROSS = 0.42;
/**
 * The language switch arrives later than the rest: its inactive language is Slate, which needs a background lighter
 * than relative luminance 0.76 for 4.5:1. The fading backdrop passes that at about 87% of its fade (measured).
 */
const LATE_CROSS = 0.87;
const ALPHA_DARK = 0.7;
const ALPHA_LIGHT = 0.55;
/** Arriving after this point, the script ends the intro instead of starting a flight that would overrun 3.2 s. */
const LATEST_START = 2600;

const now = () => Number((document.timeline as Timeline).currentTime ?? performance.now());

/** A decorative copy of the header name, in Sheet, exactly over the real one: it carries the name on the dark backdrop. */
function makeTwin(name: HTMLElement, word: HTMLElement, header: HTMLElement) {
  const twin = document.createElement('span');
  for (const attr of Array.from(name.attributes)) if (attr.name.startsWith('data-astro-cid')) twin.setAttribute(attr.name, '');
  twin.className = 'site-name intro-name';
  twin.setAttribute('aria-hidden', 'true');
  // The twin has no padding, so its clip is the line of text: it sits exactly over the word, which stands beside the symbol.
  const at = word.getBoundingClientRect();
  const box = header.getBoundingClientRect();
  twin.style.left = `${at.left - box.left}px`;
  twin.style.top = `${at.top - box.top}px`;
  const inner = document.createElement('span');
  inner.textContent = word.textContent;
  twin.append(inner);
  name.after(twin);
  return { twin, inner };
}

/** The running intro's finishIntro(), or null when none is running. */
let running: (() => void) | null = null;

/** The same conditions as the head script, checked again for a page restored from the back/forward cache. */
function eligible() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return (
    root.classList.contains('mo') &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !connection?.saveData &&
    !location.hash &&
    window.scrollY <= 2
  );
}

function start() {
  if (running) return;
  const overlay = document.querySelector<HTMLElement>('div[data-intro]');
  const mark = overlay?.querySelector<HTMLElement>('[data-intro-mark]');
  const glyph = overlay?.querySelector<HTMLElement>('[data-intro-glyph]');
  const solid = overlay?.querySelector<HTMLElement>('[data-intro-solid]');
  const video = overlay?.querySelector<HTMLVideoElement>('[data-intro-footage]');
  const header = document.querySelector<HTMLElement>('.site-header');
  // Only the header's own name. The menu dialog has a second .site-name, which is never the destination.
  const name = header?.querySelector<HTMLElement>(':scope > .site-name');
  const word = name?.querySelector<HTMLElement>('.site-word');
  // The header's own symbol: the destination of the flight, measured, never assumed.
  const target = name?.querySelector<HTMLElement>('.site-mark');
  const chrome = header ? Array.from(header.querySelectorAll<HTMLElement>(':scope > .site-nav, :scope > .util')) : [];

  const anims: Animation[] = [];
  const timers: number[] = [];
  const listening = new AbortController();
  let done = false;
  let twin: HTMLElement | undefined;

  /** Stops the footage and lets the browser drop the file and the decoder. */
  const releaseVideo = () => {
    if (!video) return;
    try {
      video.pause();
      video.replaceChildren();
      video.load();
    } catch {
      /* nothing to release */
    }
  };

  // The one way out. Safe to call at any moment and any number of times.
  const finishIntro = () => {
    if (done) return;
    done = true;
    running = null;
    listening.abort();
    timers.forEach((t) => clearTimeout(t));
    root.classList.remove('intro', 'intro-live');
    for (const a of anims) {
      try {
        a.cancel();
      } catch {
        /* already gone */
      }
    }
    twin?.remove();
    glyph?.classList.remove('has-footage');
    glyph?.removeAttribute('data-footage');
    releaseVideo();
    // The overlay stays in the document, hidden: a pointer press that skipped it keeps a target, so the release
    // cannot turn into a click on the page underneath.
  };
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, Math.max(0, ms)));

  if (!overlay || !mark || !glyph || !solid || !header || !name || !word || !target) return finishIntro();
  running = finishIntro;
  root.classList.add('intro-live');
  later(finishIntro, LIMIT_FROM_START);

  // ---- Skip on any input. Passive and never prevented: the key, press or scroll still does its normal job.
  const opts = { capture: true, passive: true, signal: listening.signal } as const;
  for (const type of ['keydown', 'pointerdown', 'wheel', 'touchstart', 'focusin'] as const) {
    window.addEventListener(type, finishIntro, opts);
  }
  window.addEventListener('scroll', () => window.scrollY > 2 && finishIntro(), opts);
  window.addEventListener('pagehide', finishIntro, opts);
  document.addEventListener('visibilitychange', () => document.hidden && finishIntro(), opts);
  // A width change moves the destination. A height change alone (a mobile address bar) does not.
  const width = window.innerWidth;
  window.addEventListener('resize', () => window.innerWidth !== width && finishIntro(), opts);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduce.addEventListener('change', (e) => e.matches && finishIntro(), { signal: listening.signal });
  if (reduce.matches || window.scrollY > 2) return finishIntro();

  // ---- Find the moment the overlay first rendered: the start of the ring's CSS animation.
  const ring = overlay.querySelector('.ring circle');
  const drawn = ring?.getAnimations().find((a) => (a as CSSAnimation).animationName === 'intro-draw');
  const ready = drawn ? drawn.ready.then(() => Number(drawn.startTime ?? now())) : Promise.resolve(now());
  let origin: number | undefined;
  let base: number | undefined;
  let footage = false;

  const play = (el: Element, frames: Keyframe[], delay: number, duration: number, easing = 'linear') => {
    const a = el.animate(frames, { delay, duration, easing, fill: 'both' });
    a.startTime = base!;
    anims.push(a);
    a.finished.catch(() => undefined);
    return a;
  };
  const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';

  /** At 1.7 s the white 3D symbol comes back over the footage, so the symbol that flies is the approved one. */
  const returnToSolid = (b: number) => {
    if (done) return;
    play(solid, [{ opacity: 0 }, { opacity: 1 }], SOLID_AT, 250, ease);
    later(releaseVideo, b + SOLID_AT + 300 - now());
  };

  // ---- The footage: attached only when the intro plays, and only once the symbol itself has loaded (or failed),
  // so on a slow connection the symbol, the visible fallback and the largest image, is never slowed by it. It is shown
  // only if it is playing by 1.0 s; otherwise, or if autoplay is refused or the file fails, the static 3D
  // symbol simply stays. Nothing waits for it.
  const startFootage = () => {
    if (!video || done || glyph.hasAttribute('data-footage')) return;
    glyph.setAttribute('data-footage', '');
    const { webm, mp4 } = video.dataset;
    for (const [src, type] of [
      [webm, 'video/webm'],
      [mp4, 'video/mp4'],
    ] as const) {
      if (!src) continue;
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.append(source);
    }
    video.muted = true;
    video.playsInline = true;
    video.disableRemotePlayback = true;
    video.preload = 'auto';
    video.addEventListener(
      'playing',
      () => {
        const t0 = origin ?? Number(drawn?.startTime ?? NaN);
        if (done || footage || (Number.isFinite(t0) && now() - t0 > FOOTAGE_LATEST)) return;
        footage = true;
        glyph.classList.add('has-footage');
        if (base !== undefined) returnToSolid(base);
      },
      { signal: listening.signal },
    );
    try {
      video.load();
      video.play()?.catch(() => undefined);
    } catch {
      /* autoplay refused: the static symbol stays */
    }
  };
  const symbolImage = solid.querySelector('img');
  if (!symbolImage || symbolImage.complete) startFootage();
  else {
    symbolImage.addEventListener('load', startFootage, { once: true, signal: listening.signal });
    symbolImage.addEventListener('error', startFootage, { once: true, signal: listening.signal });
  }

  ready
    .then((t) => {
      origin = t;
      if (done) return;
      if (now() - t > LATEST_START) return finishIntro();
      schedule(t);
    })
    .catch(finishIntro);

  /** Where the symbol must go: from its resting place in the circle onto the header's symbol, same centre, same size. */
  function flightTo() {
    const to = target!.getBoundingClientRect();
    const from = mark!.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width / from.width;
    return { frames: [{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }] };
  }

  // Every animation is placed on the document timeline now, at its time from the overlay's first frame. Transform and
  // opacity then run on the compositor, so a main thread still busy with the page's first layout (a slow phone)
  // cannot delay the flight or stretch the intro. Just before the flight, the destination is measured again and the
  // flight updated, in case the font or the layout moved the name since.
  function schedule(t: number) {
    try {
      // A late start: shift the timeline so the flight still starts whole, 100 ms from now.
      const b = Math.max(t, now() - FLIGHT_AT + 100);
      base = b;
      if (footage) returnToSolid(b);
      const path = flightTo();
      const flight = play(mark!, path.frames, FLIGHT_AT, FLIGHT_MS, `cubic-bezier(${FLIGHT_EASE.join(', ')})`);

      // The name: its Sheet twin rises out of a mask at full colour, then hands over to the real name in one frame.
      const made = makeTwin(name!, word!, header!);
      twin = made.twin;
      play(made.inner, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], NAME_AT, NAME_MS, 'cubic-bezier(0.16, 1, 0.3, 1)');
      const step = (from: number, to: number, at = CROSS): Keyframe[] => [
        { opacity: from, offset: 0 },
        { opacity: from, offset: at },
        { opacity: to, offset: at + 0.001 },
        { opacity: to, offset: 1 },
      ];
      play(made.twin, step(1, 0), OUT_AT, OUT_MS);
      // In the same frame the real name arrives, symbol included (the symbol is inside the name's link), and the white
      // symbol that settled exactly over it steps out: one symbol before, one after, never two and never none.
      play(mark!, step(1, 0), OUT_AT, OUT_MS);
      play(name!, step(0, 1), OUT_AT, OUT_MS);
      for (const el of chrome) {
        // The navigation is uncovered from the left, at full colour, from the moment it can be read.
        const at = el.classList.contains('util') ? LATE_CROSS : CROSS;
        play(el, step(0, 1, at), OUT_AT, OUT_MS);
        play(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], OUT_AT + at * OUT_MS, (1 - at) * OUT_MS, 'cubic-bezier(0.16, 1, 0.3, 1)');
      }
      const fade = play(
        overlay!,
        [
          { opacity: 1, offset: 0, easing: 'cubic-bezier(0.45, 0, 1, 1)' },
          { opacity: ALPHA_DARK, offset: CROSS },
          { opacity: ALPHA_LIGHT, offset: CROSS + 0.001, easing: 'cubic-bezier(0, 0, 0.55, 1)' },
          { opacity: 0, offset: 1 },
        ],
        OUT_AT,
        OUT_MS,
      );

      const at = (ms: number) => b + ms - now();
      later(() => {
        if (done || now() - b > FLIGHT_AT) return;
        // Bounded: the name's font if it is still on its way, never more than 60 ms.
        Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 60))])
          .catch(() => undefined)
          .then(() => {
            if (done || now() - b >= FLIGHT_AT) return;
            const again = flightTo();
            (flight.effect as KeyframeEffect).setKeyframes(again.frames);
          });
      }, at(FLIGHT_AT - 120));
      later(finishIntro, at(END_AT));
      later(finishIntro, at(LIMIT));
      fade.finished.then(finishIntro, () => undefined);
    } catch {
      finishIntro();
    }
  }
}

const safeStart = () => {
  try {
    start();
  } catch {
    running = null;
    root.classList.remove('intro', 'intro-live');
  }
};

if (root.classList.contains('intro')) safeStart();

// Remember this history entry's scroll position in its own history state, once scrolling settles and again as the page
// is left. When the entry is loaded again (reload, back/forward), the head script reads it before first paint and does
// not play over a page the browser is about to restore to a scrolled position. (A state written only during pagehide
// is not kept across a reload, so it is written as the reader scrolls, at most every 150 ms.) Session history only:
// nothing is written to storage or cookies.
const rememberScroll = () => {
  try {
    const y = Math.round(window.scrollY);
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    if (state.techpiScrollY !== y) history.replaceState({ ...state, techpiScrollY: y }, '');
  } catch {
    /* history not writable: the run-time scroll check still applies */
  }
};
let settle = 0;
window.addEventListener(
  'scroll',
  () => {
    clearTimeout(settle);
    settle = window.setTimeout(rememberScroll, 150);
  },
  { passive: true },
);
window.addEventListener('pagehide', rememberScroll);

// Back or forward to the homepage restored from the back/forward cache: a new entry, so the intro plays again, from the
// start. The page it restores is at rest, because the previous run ended on pagehide.
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  root.classList.remove('intro', 'intro-live');
  if (!eligible()) return;
  root.classList.add('intro');
  safeStart();
});
