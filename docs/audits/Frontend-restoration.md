# Frontend restoration — September 10

Working copy: `work/hi-anzy-audit`. Local preview: http://127.0.0.1:3100/.

## Original source traced
Compared the original source at `D:/claude project/hi anzy website/frontend/src` with the full backup, then reviewed the repository history. The original and backup source match. No original source component is missing from the working copy. The code contains Three.js/R3F scenes and custom 21st.dev-style tilt/deck effects, rather than a separate 21st.dev dependency.

## Final landing page
The original Home section order and original hero composition are restored. The original assembling globe, proof/credit marquees, pop stickers, diagnostic diagram, WHY/HOW/NOW cards, capability tiles, drawn connectors, pinned sequence, parallax diagnostic artwork, case carousel, network constellation, trust accordions, fit quadrant, touchpoint ticker, closing artwork and interactive footer remain active.

The newer business-layer model opens under “Explore the connected business in 3D.” This preserves it without repeating five full explanatory sections in the main story. The newer capability objects, case graphics, improved copy, readable method details and form fixes remain. Section padding stays compact (40–72px; larger spacing 56–88px). Animated connectors have 160px of drawing space instead of their former 200px or compressed 64px.

## Recovered and repaired
- Moved the halftone background to a single isolated shell layer: it now paints above the page background and beneath the content on every route. It retains the original drifting/breathing shader, responds to light/dark mode, pauses with a hidden tab and has static/error fallbacks.
- Restored the contact illustration, Network/Why stickers, Insights/Network carousel autoplay, and homepage floating CTA. Autoplay pauses on interaction, hover, focus, invisibility or reduced motion, and now has explicit pause/resume controls.
- Made the globe’s previously near-invisible outer connections readable on its dark panel; increased its lattice from 16 to 28 nodes with three nearby connections each.
- Network selection also displays specialist details in readable text, supports tap selection and preserves AI/PR acronym keys.
- Kept the existing Three.js constellation, signal/lens/spark scenes, animated index spine, tilt motifs, GSAP/Lenis scrolling, route drawing, Framer transitions, circular portfolio decks, command palette and menu animations.
- The method pin is refreshed when its preceding 3D disclosure opens/closes, and keeps readable list fallbacks on smaller/reduced-motion screens.

## Preserved copies
Original full backup: `work/hi anzy website`. Compact design: `work/design-before-animation-merge/src`. Source snapshot before the landing-page restoration: `work/landing-before-full-restoration`.

## Verification
Production build, opacity validation, SEO check and ESLint pass. Five existing frontend tests pass. The live backend and persistent local MongoDB were restarted; sitemap generation returns all 56 known routes. Desktop review verified model expansion/selection, pin alignment after disclosure changes, visible texture and illustrations, and carousel controls. Final responsive and interaction checks are recorded below.

Final live checks: 1440×900 desktop and 390×844 phone. One H1 and no horizontal overflow on Home, Work, Network, Insights, Contact, Why hiAnzy and How We Work. The Work orbital deck expands on mobile; the mobile method exposes all five stages. AI selection reveals its specialist connections. The desktop pin remains 816px tall at an 84px header offset after model disclosure changes. The background renders in both themes. No browser errors were recorded in the final route review.

The sequence interaction now activates at 640px × 620px and above, so medium browser windows receive the original pinned, scroll-shifting story. Narrow phones and reduced-motion preferences continue to receive the complete visible stage list.
