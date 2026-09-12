import React from "react";

/**
 * Marketing infographics for the portfolio deck cards.
 *
 * These sit where the reference component had a photograph. Photography was
 * the wrong answer twice over: there is no shot of "packaging as a discipline"
 * that is not stock, and this site is deliberately illustration-led — the four
 * raster images it owns are hand-made collages, not photos. Inventing imagery
 * for real client categories would also imply work that may not look like that.
 *
 * So each category gets a small diagram of the *thing the category measures*,
 * drawn in the same idiom as components/deck/OrbitGlyphs.js: single-weight
 * stroke, `currentColor`, no fills except the accent, readable at 22px.
 *
 * Each one is an actual marketing chart, not decoration:
 *   decks      — a rising pitch narrative arc
 *   packaging  — shelf facings, one faced out
 *   web        — a conversion funnel
 *   commerce   — a repeat-purchase cycle
 *   motion     — a keyframe timing curve
 *   audio      — a waveform envelope
 *   social     — reach vs engagement, diverging
 *   film       — a three-act shot ladder
 */

const wrap = (children, size) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ACCENT = "#F19020";

/** Rising narrative arc — the shape a good pitch deck makes. */
const DecksGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M3 19 L8 14 L12 16 L21 5" />
    <path d="M16 5 L21 5 L21 10" />
    <circle cx="8" cy="14" r="1.3" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
  </>, size
);

/** Shelf facings, one turned to face the shopper. */
const PackagingGlyph = ({ size = 22, accent }) => wrap(
  <>
    <rect x="3" y="8" width="4.5" height="12" />
    <rect x="9.75" y="5" width="4.5" height="15" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
    <rect x="16.5" y="8" width="4.5" height="12" />
    <path d="M9.75 9.5 L14.25 9.5" stroke={accent ? "#232A2A" : "currentColor"} />
  </>, size
);

/** Conversion funnel — traffic in, customers out. */
const WebGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M3 4 L21 4 L14.5 12 L14.5 20 L9.5 17.5 L9.5 12 Z" />
    <path d="M6.5 8 L17.5 8" stroke={accent ? ACCENT : "currentColor"} />
  </>, size
);

/** Repeat-purchase loop — the only e-commerce metric that compounds. */
const CommerceGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4 L20 8 L16 8" />
    <circle cx="12" cy="12" r="2.4" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
  </>, size
);

/** Easing curve between two keyframes. */
const MotionGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M3 19 C 9 19, 11 5, 21 5" />
    <rect x="1.6" y="17.6" width="2.8" height="2.8" rx="0.5" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
    <rect x="19.6" y="3.6" width="2.8" height="2.8" rx="0.5" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
  </>, size
);

/** Waveform envelope — attack, sustain, decay. */
const AudioGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M3 12 L3 12" />
    <path d="M5 9.5 L5 14.5" />
    <path d="M8 6 L8 18" stroke={accent ? ACCENT : "currentColor"} />
    <path d="M11 8 L11 16" />
    <path d="M14 4.5 L14 19.5" stroke={accent ? ACCENT : "currentColor"} />
    <path d="M17 9 L17 15" />
    <path d="M20 11 L20 13" />
  </>, size
);

/** Reach and engagement diverging — the chart that starts most briefs. */
const SocialGlyph = ({ size = 22, accent }) => wrap(
  <>
    <path d="M3 20 L21 20" />
    <path d="M3 20 L3 4" />
    <path d="M5 16 C 10 15, 14 8, 20 6" />
    <path d="M5 17.5 C 10 17, 14 15.5, 20 15" stroke={accent ? ACCENT : "currentColor"} strokeDasharray="2.5 2" />
  </>, size
);

/** Three-act shot ladder. */
const FilmGlyph = ({ size = 22, accent }) => wrap(
  <>
    <rect x="3" y="6" width="13" height="12" rx="1.2" />
    <path d="M16 10 L21 7.5 L21 16.5 L16 14" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
    <path d="M6.5 6 L6.5 18" />
    <path d="M12.5 6 L12.5 18" />
  </>, size
);

/** Fallback so an unknown category never renders an empty box. */
const SystemGlyph = ({ size = 22, accent }) => wrap(
  <>
    <circle cx="12" cy="12" r="2.2" fill={accent ? ACCENT : "none"} stroke={accent ? ACCENT : "currentColor"} />
    <circle cx="5" cy="6" r="1.6" />
    <circle cx="19" cy="6" r="1.6" />
    <circle cx="5" cy="18" r="1.6" />
    <circle cx="19" cy="18" r="1.6" />
    <path d="M6.3 7.1 L10.3 10.6 M17.7 7.1 L13.7 10.6 M6.3 16.9 L10.3 13.4 M17.7 16.9 L13.7 13.4" />
  </>, size
);

/** Keyed by the portfolio group slug the API returns. Not exported itself —
 *  `glyphForGroup` below is the module's only real public surface. */
const INFOGRAPHIC_GLYPHS = {
  "brand-decks": DecksGlyph,
  packaging: PackagingGlyph,
  "web-development": WebGlyph,
  "e-commerce": CommerceGlyph,
  "motion-graphics": MotionGlyph,
  "audio-production": AudioGlyph,
  "social-media": SocialGlyph,
  "tvc-video-production": FilmGlyph,
};

export const glyphForGroup = (slug) => INFOGRAPHIC_GLYPHS[slug] || SystemGlyph;
