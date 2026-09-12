import React, { lazy } from "react";
import { MotifFrame } from "@/components/deck/MotifFrame";

const LensField = lazy(() => import("@/components/three/LensField"));

/**
 * "The lorgnette" — /insights.
 *
 * Deck source: the engraved hand holding a pair of lenses with eyes behind
 * them, used where the deck talks about finding the right audience. On an
 * insights index the same object means the other thing it has always meant:
 * looking hard enough at something to see what is actually there.
 *
 * The poster is the pair of lenses drawn flat. The WebGL layer adds the part
 * that cannot be drawn still — a field of noise that keeps resolving into a
 * lattice and falling apart again.
 */
export const LensFocus = ({ className = "", testId = "motif-lens-focus" }) => {
  const poster = (
    <svg viewBox="0 0 320 320" className="h-full w-full" data-testid={`${testId}-svg`}>
      {/* the bridge between the two lenses */}
      <path
        d="M126,168 C 143,150 177,150 194,168"
        fill="none"
        stroke="#232A2A"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* left lens */}
      <circle cx="104" cy="176" r="52" fill="#F7F5EE" stroke="#232A2A" strokeWidth="5" />
      <circle cx="104" cy="176" r="52" fill="none" stroke="#F19020" strokeWidth="1.6" opacity="0.7" />
      {/* right lens */}
      <circle cx="216" cy="176" r="52" fill="#F7F5EE" stroke="#232A2A" strokeWidth="5" />
      <circle cx="216" cy="176" r="52" fill="none" stroke="#E54A25" strokeWidth="1.6" opacity="0.7" />

      {/* an eye behind each, the way the engraving has it */}
      <g fill="none" stroke="#232A2A" strokeWidth="3.4" strokeLinecap="round">
        <path d="M78,176 C 90,160 118,160 130,176 C 118,192 90,192 78,176 Z" />
        <path d="M190,176 C 202,160 230,160 242,176 C 230,192 202,192 190,176 Z" />
      </g>
      <circle cx="104" cy="176" r="10" fill="#232A2A" />
      <circle cx="216" cy="176" r="10" fill="#232A2A" />
      <circle cx="107" cy="172" r="3.2" fill="#F7F5EE" />
      <circle cx="219" cy="172" r="3.2" fill="#F7F5EE" />

      {/* the handle */}
      <path
        d="M216,228 L228,286"
        stroke="#232A2A"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  return (
    <MotifFrame
      poster={poster}
      scene={<LensField />}
      className={className}
      testId={testId}
      label="A pair of lenses over a field of points that keeps resolving into order"
    />
  );
};
