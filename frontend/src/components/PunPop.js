import React from "react";

/**
 * Pop-up marketing pun sticker — a hand-placed note in the brand's pun voice
 * (Amaranth). Pops in with a springy scale via the shared reveal observer,
 * then bobs gently. Desktop-only by default so mobile stays uncluttered.
 */
const VARIANTS = {
  paper: "border-[#232A2A]/20 bg-[#F7F5EE] text-[#232A2A]",
  dark: "border-[#F19020]/50 bg-[#232A2A] text-[#F7F5EE]",
  orange: "border-[#232A2A]/25 bg-[#F19020] text-[#232A2A]",
};

/** `icon`: an optional small node shown above the line — a category glyph,
 *  for a sticker that is illustrating something specific rather than purely
 *  decorative. Every existing call site omits it and renders exactly as
 *  before. */
export const PunPop = ({ text, icon, rot = -2, variant = "paper", delay = 0, className = "", testId = "pun-pop" }) => (
  <div
    className={`reveal pun-sticker pointer-events-none hidden lg:block ${className}`}
    style={{ "--rot": `${rot}deg`, ...(delay ? { transitionDelay: `${delay}ms` } : {}) }}
    data-testid={testId}
    aria-hidden="true"
  >
    <div className={`pun-sticker-inner rounded-[14px] border-2 px-5 py-3 shadow-[0_10px_26px_rgba(0,0,0,0.14)] ${VARIANTS[variant] || VARIANTS.paper}`}>
      {icon && <span className="mb-1.5 block h-6 w-6">{icon}</span>}
      <p className="font-pun max-w-[24ch] text-[clamp(1rem,1.25vw,1.25rem)] leading-[1.3]">{text}</p>
    </div>
  </div>
);

/**
 * A full-width row of pun stickers joined by animated dotted route connectors.
 * Stickers pop in with a stagger; the dots march along the route between them.
 */
export const PunRow = ({ puns = [], testId = "pun-row" }) => (
  <div className="hidden w-full items-center gap-5 lg:flex" data-testid={testId} aria-hidden="true">
    {puns.map((p, i) => (
      <React.Fragment key={p.text}>
        {i > 0 && <span className="pun-connector min-w-[40px] flex-1" />}
        <PunPop {...p} delay={i * 150} testId={`${testId}-${i}`} />
      </React.Fragment>
    ))}
  </div>
);
