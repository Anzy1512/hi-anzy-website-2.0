import React from "react";

/**
 * Six small card-face glyphs for The Hi Anzy Orbit — one per ecosystem
 * category. Same hand-drawn line-art language as InboxUnfold/LensFocus/
 * QuestionOrbit (charcoal linework, orange/signal-red accents on cream), just
 * at card-icon scale rather than full motif-poster scale, so these are plain
 * static inline SVGs with no MotifFrame/GSAP machinery of their own — the
 * deck itself already supplies all the motion.
 */
const stroke = "#232A2A";
const orange = "#F19020";
const red = "#E54A25";

export const BuiltHereGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <rect x="14" y="40" width="36" height="10" rx="2" fill="none" stroke={stroke} strokeWidth="2" opacity="0.55" />
    <rect x="18" y="27" width="28" height="10" rx="2" fill="none" stroke={stroke} strokeWidth="2" opacity="0.8" />
    <rect x="22" y="14" width="20" height="10" rx="2" fill={orange} stroke={orange} strokeWidth="2" />
  </svg>
);

export const BuiltTogetherGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <circle cx="26" cy="32" r="16" fill="none" stroke={stroke} strokeWidth="2" opacity="0.8" />
    <circle cx="40" cy="32" r="16" fill="none" stroke={orange} strokeWidth="2" />
    <path d="M32,20 A16,16 0 0 1 32,44 A16,16 0 0 1 32,20 Z" fill={orange} opacity="0.14" />
  </svg>
);

export const CollaboratorsGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <g stroke={stroke} strokeWidth="1.4" opacity="0.5">
      <line x1="32" y1="16" x2="16" y2="46" />
      <line x1="32" y1="16" x2="48" y2="46" />
      <line x1="16" y1="46" x2="48" y2="46" />
    </g>
    <circle cx="32" cy="16" r="6" fill={orange} />
    <circle cx="16" cy="46" r="5.5" fill="none" stroke={stroke} strokeWidth="2" />
    <circle cx="48" cy="46" r="5.5" fill="none" stroke={stroke} strokeWidth="2" />
  </svg>
);

export const FacesVoicesGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <path d="M14,18 h30 a6,6 0 0 1 6,6 v14 a6,6 0 0 1 -6,6 h-16 l-9,8 v-8 h-5 a6,6 0 0 1 -6,-6 v-14 a6,6 0 0 1 6,-6 Z" fill="none" stroke={stroke} strokeWidth="2" opacity="0.8" />
    <g stroke={orange} strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="31" x2="22" y2="25" />
      <line x1="29" y1="31" x2="29" y2="21" />
      <line x1="36" y1="31" x2="36" y2="26" />
      <line x1="43" y1="31" x2="43" y2="23" />
    </g>
  </svg>
);

export const VenuePartnersGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <path d="M16,50 V24 a16,16 0 0 1 32,0 v26" fill="none" stroke={stroke} strokeWidth="2" opacity="0.8" />
    <line x1="12" y1="50" x2="52" y2="50" stroke={stroke} strokeWidth="2" opacity="0.8" />
    <path d="M32,10 L20,26 h24 Z" fill={orange} opacity="0.9" />
  </svg>
);

export const PartnersProgressGlyph = () => (
  <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
    <g fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M10,44 C 20,44 22,32 30,32" stroke={stroke} opacity="0.6" />
      <path d="M10,20 C 20,20 22,32 30,32" stroke={stroke} opacity="0.6" />
      <path d="M30,32 L52,32" stroke={orange} />
    </g>
    <path d="M46,25 L54,32 L46,39" fill="none" stroke={orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="32" r="2.4" fill={red} />
  </svg>
);

export const ORBIT_GLYPHS = {
  built_here: BuiltHereGlyph,
  built_together: BuiltTogetherGlyph,
  collaborator: CollaboratorsGlyph,
  creator: FacesVoicesGlyph,
  venue: VenuePartnersGlyph,
  partner: PartnersProgressGlyph,
};
