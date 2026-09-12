# hiAnzy — content, layout and 3D review

This records the compact design pass. The subsequent user-requested restoration of original animations and sections is documented in `Animation-merge.md`; the homepage height and animation-removal notes below describe the earlier version.

Completed 9 September 2026 in the working copy at `work/hi-anzy-audit`.

Local preview: http://127.0.0.1:3100/

The original project and the first backup remain separate from this edited copy. Use `outputs/Start-hiAnzy.ps1` to restart the existing local development services.

## What changed

- Rebuilt the homepage into seven connected chapters: introduction, the business gap, capabilities, delivery method, selected work, the team and the next step.
- Replaced repeated puns, decorative interludes and a long pinned scroll sequence with useful information visible in normal document flow.
- Added an interactive architectural 3D model with five selectable business layers, matching explanatory copy, a motion pause control, reduced-motion handling and an immediate static fallback while the scene loads.
- Added problem-to-solution flow diagrams, dimensional capability illustrations, case-study system sketches, a delivery sequence and a team responsibility diagram. Case illustrations are explicitly labelled as concept diagrams; no new numerical results or client claims were invented.
- Reworked service narratives, method inputs and outputs, team-fit copy, collaboration and careers messaging, contact guidance, resources and development-status copy. Resources now contain usable exercises rather than promises of unavailable downloads.
- Replaced the generic portrait in the About story with existing hiAnzy brand artwork.
- Tightened shared spacing and headings. Removed delayed text fades, enlarged small infographic captions and corrected a mobile sentence-spacing issue.
- Simplified the footer and removed its repeated introduction on the homepage and contact page.
- Fixed the mobile menu close-button stacking, internal scrolling and transition to desktop navigation.
- Regenerated the dark-theme utility mapping after the visual audit found low-contrast process checklist text. The final checklist text is light against the dark panel.
- Reserved the homepage section-index gutter before its scan completes, avoiding the late horizontal text shift. Kept the static model visible until the WebGL scene renders its first frame.

## Verification

- Production build passes, including configured opacity checks, SEO test and 56-route sitemap generation.
- ESLint passes. Existing frontend form and SEO suite: 5 tests pass.
- All 56 sitemap routes rendered at 320px width with a page heading and no horizontal page overflow.
- Homepage also checked at 390, 768, 1024, 1280 and 1440px widths.
- Visually reviewed desktop hero, problem diagram, capabilities, method and case cards; mobile hero and navigation; dark-mode hero and detailed method cards.
- Every 3D layer button was exercised in the final build; selected state and explanatory copy matched. Motion pause/resume and the problem selector were exercised.
- Mobile menu closed correctly by its button and automatically when resized to desktop.
- Final homepage browser check reported no console errors. The rendered 3D scene replaced its loading fallback.
- At 1440×900, full homepage height fell from approximately 16,970px to 5,625px, including the footer: about 67% shorter.

## Scope and practical limits

This review verifies local rendering, content presentation and the exercised interactions. Existing case-study claims were retained from project content; this is not independent verification of commercial outcomes. Backend integrations were not changed by this design pass. Vite still reports its existing large-chunk advisory for the shared application and Three.js runtime; the build succeeds and the new scene itself is loaded lazily. Reduced-motion and WebGL fallback behavior is implemented; the visual browser checks used WebGL and the manual motion control.

For future changes that introduce palette utilities, regenerate `frontend/src/dark.generated.css` with `python scripts/gen-dark.py` from the frontend directory before building. Check both themes after adding new text colors.
