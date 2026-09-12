---
name: hiAnzy
version: alpha
description: >
  Business Systems & Transformation Consultancy. Editorial print language —
  warm paper, ink, one amber accent — carried into motion and 3D. The brand
  argues for "technology without theatre", and the interface has to agree
  with it.

colors:
  paper: "#E0D8C1"
  ink: "#232A2A"
  orange: "#F19020"
  signal: "#E54A25"
  digital-white: "#F7F5EE"
  panel: "#1F2525"
  panel-dark: "#1D2424"
  # Accent variants, per ground. The raw orange fails contrast as text on
  # paper, so it is never used for type — these are.
  orange-on-paper: "#844B0A"
  signal-on-paper: "#A8351A"
  orange-on-dark: "#FFA94D"
  signal-on-dark: "#FF7A52"

typography:
  display:
    family: "Rajdhani, 'Arial Narrow', system-ui, sans-serif"
    usage: Headings, numerals, UI labels. Condensed, structural.
  editorial:
    family: "Figtree, 'Helvetica Neue', Arial, sans-serif"
    usage: Body copy and ledes. The reading voice.
  mono-sys:
    family: "'IBM Plex Mono', ui-monospace, monospace"
    usage: Chips, captions, metadata, small print.
  pun:
    family: "Amaranth, Figtree, sans-serif"
    usage: Pull quotes and the pun stickers only. Never body.

spacing:
  page-x: "clamp(16px, 4vw, 64px)"
  section-y: "clamp(64px, 8.5vw, 128px)"
  section-y-lg: "clamp(96px, 11vw, 152px)"
  max-page: "1280px"
  rail-w: "0px | 88px when the section index is mounted"

rounded:
  chip: "999px"
  card: "14px"
  panel: "18px"
  button: "12px"

components:
  button:
    variants: "btn-ink | btn-paper | btn-orange"
    height: "~50px"
    motion: "magnetic pull ≤8px, sheen sweep, arrow nudge 4px, GSAP click ring"
  sys-chip:
    font: mono-sys
    tracking: "0.12em"
    case: uppercase
  panel-dark:
    background: panel-dark
    foreground: digital-white
  motif-frame:
    ratio: "1 / 1"
    max-width: "420px"
    note: "SVG poster always paints; WebGL layers over it only when near-viewport"

omitted:
  - name: Elevation & Depth
    reason: >
      The system has no elevation ladder. Depth is carried by ground colour
      (paper vs panel-dark) and by a single soft shadow on buttons and open
      accordions. Inventing a 5-step elevation scale would describe a system
      that does not exist.
---

## Overview

hiAnzy is a consultancy that sells clarity, and the interface is the first
proof of it. The visual language is editorial print, not software UI: warm
paper stock, near-black ink, one amber accent, and a halftone dot texture
lifted from the brand deck's collage pages.

The single most important constraint is a sentence from the site's own copy —
**"Technology without theatre."** Also "Less ceremony. More consequence." and
"AI is not the strategy. The business outcome is." Any interface decision that
contradicts those sentences is wrong here regardless of how well it is
executed. That rules out, permanently: glowing cursors, ambient audio,
volumetric fog, neon gradients, generative blobs, splash screens, scroll
hijacking, and animation that exists to be noticed.

Motion and 3D are allowed, and there is a lot of both — but every piece of it
either carries information or is invisible. The hero's 3D scene advances a
five-stage method as you scroll. The command palette is an instrument. The
halftone shader is the brand's own print texture. Nothing is there to impress.

## Colors

Two grounds, one accent, one alarm.

- **paper `#E0D8C1`** — the default ground. Warm, slightly green-biased.
- **digital-white `#F7F5EE`** — cards and panels sitting on paper.
- **ink `#232A2A`** — all body text on light grounds. Near-black, not black.
- **panel-dark `#1D2424`** — inverted sections; `digital-white` text on it.
- **orange `#F19020`** — the accent. Rules, dots, active states, one CTA style.
- **signal `#E54A25`** — reserved for punctuation that must land: a full stop
  in a headline, a critical marker. Never a general-purpose second accent.

**The accent is not a text colour.** `#F19020` on paper measures around 1.7:1
and fails badly. Amber type uses `--orange-on-paper: #844B0A`; on dark grounds
it uses `--orange-on-dark: #FFA94D`. The `.accent-orange-text` class resolves
to the right one per ground automatically — use it rather than hardcoding.

Contrast is verified by compositing text colour over its full resolved
ancestor stack, not by reading declared values. This design layers alpha
heavily (`text-ink/72`, `border-ink/15`), and naive contrast checking produces
roughly 50% false positives against it.

## Typography

Four families, each with one job, and they do not trade places.

- **Rajdhani (display)** — headings and numerals. Condensed and slightly
  technical; it is what makes the page look engineered rather than soft.
- **Figtree (editorial)** — body and ledes. Everything long-form.
- **IBM Plex Mono (mono-sys)** — chips, captions, metadata. Always uppercase
  with `0.12em` tracking when used as a label.
- **Amaranth (pun)** — pull quotes and stickers only.

Headline sizes are fluid: `clamp(3rem, 6.8vw, 6rem)` for an h1, `clamp(1.8rem,
3.1vw, 3.4rem)` for a section h2. Do not add fixed heading sizes.

**Nothing renders below 12px.** The floor is 12.5px and it is enforced by
measurement, not convention. Form inputs are 16px so iOS does not zoom on
focus.

## Layout & Spacing

`.container-page` is the only page container. It caps at `1360px + var(--rail-w)`
and pads with `--page-x`. It also carries a subtlety worth knowing before
editing it: `padding-left` must be declared *after* `padding-inline`, because
the shorthand resets it, and the left padding is what reserves the section
index rail's column.

Vertical rhythm is `--section-y` between sections, `--section-y-lg` where a
section needs air. Consecutive `.section-pad` siblings on the same ground
collapse their shared gap — that rule exists so two stacked plain sections do
not double-space.

The section-index rail reserves an 88px column via `--rail-w` rather than
floating over the text. It appears only at ≥1180px viewport width and only
when a page has two or more discoverable sections.

## Shapes

Radii are functional, not decorative: `999px` for chips, `12px` for buttons,
`14px` for cards, `18px` for large panels. There is no radius scale beyond
these four — do not introduce `rounded-lg` everywhere.

## Components

Buttons come in three grounds (`btn-ink`, `btn-paper`, `btn-orange`) and share
one motion vocabulary: an ≤8px magnetic pull, a sheen that crosses on hover, a
4px arrow nudge toward the destination, and a GSAP ring from the exact point
pressed. `MagneticButton` owns the `transform` property outright — a CSS
`:active { transform }` rule will silently never fire on it.

Accordions are native `<details>`. A global rule closes anything expanded once
the reader scrolls 260px past it, so page length never changes underneath them.

Motion tokens, by intent rather than by number:

- **instant** ~120ms — colour and border changes.
- **fast** 250–350ms — hover states, button feedback.
- **standard** 400–550ms — reveals, marker travel, panel opens.
- **cinematic** 800–1200ms — hero entrances, scroll-scrubbed sequences.
- **ambient** 11–26s — orbits, marquees, halftone drift.

Easing is `cubic-bezier(0.22, 1, 0.36, 1)` almost everywhere; GSAP uses
`power3.out` for travel and `back.out` only where something should snap.

## Do's and Don'ts

**Do**

- Read the site's own copy before adding an effect, and check the effect does
  not contradict a sentence next to it. This has caught two real bugs: a logo
  carousel placed under "No endless logo wall", and a robots.txt blocking the
  AI crawlers two published articles were courting.
- Use `.accent-orange-text` rather than a hardcoded amber, so the ground
  resolves the correct variant.
- Gate every WebGL scene on `prefersReducedMotion()` and `webglAvailable()`,
  lazy-load it, and ship a complete SVG or static fallback that stands alone.
- Give scroll-driven 3D its progress through a **ref**, not a prop. A prop
  re-renders the React tree every frame for a decorative canvas.
- Measure before claiming. Every layout, contrast and target-size claim in
  this project is verified across nine viewport widths from 320 to 2560.

**Don't**

- Don't use `#F19020` as a text colour on paper. It fails contrast.
- Don't add a second smooth-scroll library, animation library, or 3D
  framework. Lenis, GSAP and react-three-fiber are already here and each
  solves its problem once.
- Don't pass a position utility (`relative`, `absolute`) into a shadcn
  primitive's `className`. `cn()` is tailwind-merge and will treat it as
  conflicting with the variant's own `fixed`, silently dropping it — this
  rendered the entire mobile menu off-screen for a while.
- Don't use a bare `flex-1` inside a container that becomes a column at small
  widths. On the column's main axis it resolves the *height* from free space a
  content-sized parent does not have, and collapses the element.
- Don't reach for glow, bloom, particles-for-their-own-sake, custom cursors or
  audio. The brand sells the opposite of that.
- Don't trust a measurement taken while the page is mid-navigation or while
  the preview pane is not compositing. Both produce convincing wrong numbers.
