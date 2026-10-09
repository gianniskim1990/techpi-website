# ECBF reference study

Reference: https://ecbf.vc/
Purpose: motion philosophy and editorial pacing only.
Date reviewed: 2026-10-02

## How this was reviewed

- The homepage content and structure were retrieved on 2026-10-02 (text, section order, links, metadata).
- The motion patterns listed below come from the earlier Firecrawl analysis supplied in the project brief. They have not been re-verified frame by frame in a browser in this phase. A hands-on review of the live site on desktop and mobile is recommended before the prototype phase.
- The site is built on WordPress with Elementor. The motion quality comes from art direction and restraint, not from an exotic stack.

## What the page does

Observed homepage order:

1. Hero. Full-bleed image, a very short stacked statement, one paragraph, two links.
2. A bridging statement built from a small label between two oversized words.
3. Portfolio as a field of company logos, each linking to a case page.
4. One paragraph of positioning and one link to the portfolio.
5. Latest news, three items.
6. Three short claims, each with a single link (team, impact, network).

The page is short on words. Each section makes one point and offers one way forward.

## What to learn

| Principle | Why it works |
|---|---|
| **One idea per screen** | The reader is never asked to choose between competing messages |
| **Extreme scale contrast** | A small label next to an oversized statement creates hierarchy without decoration |
| **Scroll as narration** | Scrolling advances an argument. Each movement delivers the next clause |
| **Pinned moments are few** | Pinning marks the moments that matter. It is not the default state |
| **Masked line reveals** | Text arrives line by line from behind a clip edge, so reading order and motion order are the same |
| **Calm tempo** | Slow, even movement signals confidence. Nothing bounces or overshoots |
| **Restrained chrome** | Navigation and controls stay quiet, so the content reads as the interface |
| **Handoffs between sections** | One section becomes the next. There are no hard cuts with a fade-in after each |
| **Work presented as important** | Portfolio entries are given space and treated as destinations |
| **One exit per section** | A single link per section keeps momentum |

## What not to copy

- Visual identity: the green and natural palette, photography of nature, their typefaces, their logo treatment.
- Layouts: the specific hero composition, the label-between-two-words construction, the logo field.
- Content structure specific to a fund: portfolio logos, news, LP messaging.
- Exact interactions: their specific pin lengths, transitions and timings.
- The logo wall as a way to present work. TechPi's brief calls for three or four substantial case studies. A logo wall would say "agency client list".
- Any reliance on hover for essential content.

## Relevant interaction principles

From the supplied analysis, restated as principles:

1. **Pin, then release.** A section holds while its content resolves, then lets go. The user always controls progress with native scroll.
2. **Scrub for structure, trigger for text.** Large structural changes follow the scroll position. Text reveals play once at their own tempo when they enter.
3. **Clip, do not fly.** Elements appear by being uncovered, with small translation. Nothing travels across the screen.
   *Exception (2026-10-09, approved by the owner):* the first-visit TechPi homepage intro is the single approved
   long-distance logo flight. The white symbol travels from the centre of a TechPi Blue overlay to the header name and
   resolves into the typographic "TECHPI". The rule stands everywhere else on the site; the exception covers the intro
   only (`docs/design/motion-system.md`, section 14). The reference was used for the mechanics of an opening logo moment
   handing over to a header, not for its identity, type or layout.
4. **Stagger in reading order.** Lines follow each other with a short, constant delay.
5. **Opacity and translation only.** The movement vocabulary is small and consistent.
6. **Ambient motion stays in the background.** Slow, low-contrast, never competing with text.
7. **Mobile is a simpler version.** Fewer pins, shorter sequences, no hover dependence.

## Translation into TechPi-specific interactions

| ECBF principle | TechPi interpretation |
|---|---|
| Section handoffs | **The arc handoff.** A dark or blue section enters behind a curved edge taken from the Pi symbol's circle, so the boundary between two sections is an arc and not a straight line. Used at three points on the homepage only |
| Ambient visual motion | **The slow arc.** A single very large circle, mostly off-canvas, whose visible arc moves a few degrees as the page scrolls. It is tied to scroll position, so it stops when the user stops |
| Pinned storytelling | **Two pins only.** A short hero pin with two states, and the Selected Work sequence where each case study holds the viewport |
| Masked text reveals | **Line reveals.** Statements rise from behind a straight baseline mask, line by line. Greek and English are split separately, because line breaks differ |
| Portfolio that feels important | **One case per viewport.** Each case study gets a full-height panel with a large real interface image and a short fact block |
| Label against oversized statement | **Quiet labels.** Small labels in a medium weight next to display type. Uppercase is allowed for short metadata labels only (approved), never as a tracked-capital eyebrow above every heading |
| Image treatment | **Arc-masked image reveal.** Case imagery is uncovered by a circular clip that expands from the arc's direction. One consistent reveal, used for case imagery only |

## Guardrails

- If a TechPi screen could be mistaken for an ECBF screen with the colours changed, the layout is too close and must change.
- Every motion borrowed in principle must be justified by what it tells the reader. The test: describe the motion in a sentence that starts with "this shows that".
- ECBF's audience tolerates a slow reveal. Part of TechPi's audience (procurement, technical evaluators) wants facts fast. TechPi's pins must be shorter, and navigation must always offer a direct route to Work and Contact.
