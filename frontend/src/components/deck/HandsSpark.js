import React, { lazy } from "react";
import { MotifFrame } from "@/components/deck/MotifFrame";

const SparkGap = lazy(() => import("@/components/three/SparkGap"));

/**
 * "The gap" — /collaborate.
 *
 * Deck source: two hands reaching toward each other with a burst between the
 * fingertips. It is the deck's picture for connection, and it is the right one
 * for this page — the network is assembled per problem, which means the value
 * is in the join, not in either party on its own.
 *
 * The poster draws the two hands as pointing gestures with the burst held at
 * its brightest. The WebGL layer makes the approach cyclical, so the burst
 * fires and fades rather than sitting there.
 */
export const HandsSpark = ({ className = "", testId = "motif-hands-spark" }) => {
  const poster = (
    <svg viewBox="0 0 320 320" className="h-full w-full" data-testid={`${testId}-svg`}>
      {/* lower-left hand, pointing up and right */}
      <g fill="#232A2A">
        <path d="M18,244 L96,206 C 104,202 112,206 112,214 C 112,221 106,225 99,227 L58,244 Z" />
        <rect x="8" y="238" width="34" height="26" rx="6" transform="rotate(-24 25 251)" />
      </g>
      {/* upper-right hand, pointing down and left */}
      <g fill="#232A2A">
        <path d="M302,76 L224,114 C 216,118 208,114 208,106 C 208,99 214,95 221,93 L262,76 Z" />
        <rect x="278" y="56" width="34" height="26" rx="6" transform="rotate(-24 295 69)" />
      </g>

      {/* the burst in the gap between the fingertips */}
      <g stroke="#F19020" strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const cx = 160;
          const cy = 160;
          const r0 = 15;
          const r1 = 30;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r0}
              y1={cy + Math.sin(a) * r0}
              x2={cx + Math.cos(a) * r1}
              y2={cy + Math.sin(a) * r1}
              stroke={i % 3 === 0 ? "#E54A25" : "#F19020"}
            />
          );
        })}
      </g>
      <circle cx="160" cy="160" r="7" fill="#E54A25" />
    </svg>
  );

  return (
    <MotifFrame
      poster={poster}
      scene={<SparkGap />}
      sceneMode="replace"
      className={className}
      testId={testId}
      label="Two hands reaching toward each other with a spark igniting in the gap between them"
    />
  );
};
