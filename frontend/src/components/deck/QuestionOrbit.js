import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { MotifFrame } from "@/components/deck/MotifFrame";

/**
 * "The open question" — /careers.
 *
 * Deck source: the page where question marks float around a figure who is
 * clearly working something out. The figure himself is already on this site as
 * art-thinker on the home page, so only the part that is *not* already here
 * comes over: the questions, orbiting a space with nobody in it yet.
 *
 * That empty centre is the page's actual argument. "There is no open-roles wall
 * here right now. There is a standing rule instead." The chair is empty and the
 * questions are already circling it; the first value listed underneath is
 * "Curiosity over credentials".
 *
 * SVG and GSAP: five glyphs on independent elliptical paths, each with its own
 * period, so the orbit never visibly loops. A canvas would need a font atlas to
 * draw five question marks, which is a lot of machinery for five question marks.
 */
const MARKS = [
  { rx: 104, ry: 46, size: 56, dur: 15, phase: 0.0, tone: "#232A2A", op: 0.9 },
  { rx: 118, ry: 60, size: 40, dur: 21, phase: 0.42, tone: "#F19020", op: 1 },
  { rx: 80, ry: 68, size: 31, dur: 12, phase: 0.7, tone: "#232A2A", op: 0.45 },
  { rx: 128, ry: 38, size: 46, dur: 26, phase: 0.18, tone: "#E54A25", op: 0.95 },
  { rx: 66, ry: 50, size: 25, dur: 18, phase: 0.85, tone: "#232A2A", op: 0.32 },
];

const CX = 160;
const CY = 158;

export const QuestionOrbit = ({ className = "", testId = "motif-question-orbit" }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const marks = root.querySelectorAll("[data-mark]");
    const seat = root.querySelector("[data-seat]");

    // Park every glyph at its phase so the still is a composed picture, not a
    // pile of question marks sitting on top of each other at 0 radians.
    const park = () => {
      marks.forEach((m, i) => {
        const s = MARKS[i];
        const a = s.phase * Math.PI * 2;
        gsap.set(m, { x: Math.cos(a) * s.rx, y: Math.sin(a) * s.ry, opacity: s.op });
      });
    };
    park();

    if (prefersReducedMotion()) return undefined;

    gsap.fromTo(
      seat,
      { opacity: 0, scaleX: 0.4 },
      { opacity: 1, scaleX: 1, duration: 0.7, ease: "power3.out", transformOrigin: "center" }
    );

    // One tween per glyph, driving a plain angle object. Independent periods,
    // so the arrangement keeps changing instead of resolving into a pattern.
    const spins = MARKS.map((s, i) => {
      const mark = marks[i];
      const state = { a: s.phase * Math.PI * 2 };
      return gsap.to(state, {
        a: state.a + Math.PI * 2,
        duration: s.dur,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          const x = Math.cos(state.a) * s.rx;
          const y = Math.sin(state.a) * s.ry;
          gsap.set(mark, {
            x,
            y,
            // lean into the direction of travel, and sink slightly at the back
            rotate: Math.sin(state.a) * 9,
            opacity: s.op * (0.55 + 0.45 * ((Math.sin(state.a) + 1) / 2)),
          });
        },
      });
    });

    // A slow breath on the whole cluster, so it drifts rather than spins flat.
    const drift = gsap.to(root.querySelector("[data-cluster]"), {
      rotate: 6,
      duration: 11,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: `${CX}px ${CY}px`,
    });

    return () => {
      spins.forEach((t) => t.kill());
      drift.kill();
    };
  }, []);

  const poster = (
    <svg ref={rootRef} viewBox="0 0 320 320" className="h-full w-full" data-testid={`${testId}-svg`}>
      {/* the empty seat the questions are circling */}
      <g data-seat>
        <ellipse cx={CX} cy={CY + 84} rx="60" ry="13" fill="#232A2A" opacity="0.12" />
        {/* seat */}
        <rect x={CX - 42} y={CY + 30} width="84" height="12" rx="4" fill="#232A2A" opacity="0.82" />
        {/* front and back legs */}
        <rect x={CX - 36} y={CY + 42} width="10" height="40" rx="4" fill="#232A2A" opacity="0.6" />
        <rect x={CX + 26} y={CY + 42} width="10" height="40" rx="4" fill="#232A2A" opacity="0.6" />
        {/* back post and rail */}
        <rect x={CX + 26} y={CY - 22} width="11" height="54" rx="4" fill="#232A2A" opacity="0.6" />
        <rect x={CX - 4} y={CY - 20} width="42" height="9" rx="4" fill="#232A2A" opacity="0.45" />
      </g>

      {/* The paths themselves. Without these the glyphs read as five marks
          scattered at random rather than as questions circling something, and
          the composition measured almost entirely empty. */}
      <g fill="none" stroke="#232A2A" opacity="0.16" strokeDasharray="3 7">
        {MARKS.slice(0, 4).map((s, i) => (
          <ellipse key={i} cx={CX} cy={CY} rx={s.rx} ry={s.ry} strokeWidth="1.2" />
        ))}
      </g>

      <g data-cluster>
        {MARKS.map((s, i) => (
          <text
            key={i}
            data-mark
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={s.size}
            fontFamily="'Amaranth', 'Figtree', serif"
            fontWeight="700"
            fill={s.tone}
            opacity={s.op}
          >
            ?
          </text>
        ))}
      </g>
    </svg>
  );

  return (
    <MotifFrame
      poster={poster}
      className={className}
      testId={testId}
      label="Question marks orbiting an empty chair"
    />
  );
};
