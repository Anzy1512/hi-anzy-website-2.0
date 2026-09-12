# Latest restoration: original landing page

The September 10 restoration supersedes the expanded section order described below. See `Frontend-restoration.md` for the final layout and verification.

# Original motion + current design

The original homepage section order is restored in the working copy at `work/hi-anzy-audit`, with the current design integrated into it. Local preview: http://127.0.0.1:3100/.

Restored: animated headline and network core, halftone backdrop, rotating proof strip, credit marquees, pun stickers, symptom illustration, WHY/HOW/NOW section, original capability tiles, animated connectors, pinned method sequence, diagnostic artwork, horizontal work cards, network constellation, trust interactions, audience marquees, touchpoint ticker, closing illustration, footer interaction, illustrated quote sections on secondary pages, and scroll-driven process detail cards.

Retained and merged: revised service and method copy, the five-layer architectural 3D model, problem-to-solution diagrams, dimensional capability objects, case-study system sketches, compact method overview, team responsibility diagram and the new closing conversation steps. The capability and work sections each appear once. The homepage retains one H1.

The restored pinned sequence uses the current stage descriptions. Desktop stage buttons move to the corresponding scroll position. Mobile, short desktop windows and reduced-motion views receive the visible stage list. The secondary process animation has explicit detail selectors and an optional full-detail view; mobile shows all cards. Existing mobile menu fixes and regenerated dark-theme color mappings remain in place.

The complete frontend source immediately before this merge is preserved at `work/design-before-animation-merge/src`. The original project backup remains at `work/hi anzy website`.

Validation: production build, opacity and SEO checks, and ESLint pass; all five existing frontend tests pass. Desktop review confirmed the restored sections, one H1, no horizontal overflow, five canvas surfaces, and successful pinned-stage navigation. Mobile review confirmed no horizontal overflow, no pinning, all five method stages, and working new 3D layer controls. The secondary process detail selectors were exercised in the browser.

The restored long-form page intentionally includes more sections and animation than the previous compact version. The earlier 67% height reduction is no longer the description of this merged page. The touchpoint ticker is labelled as an illustration rather than measured business data.
