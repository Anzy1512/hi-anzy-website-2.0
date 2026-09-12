import React, { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * A motion infographic for the "Something's off" section.
 *
 * This slot used to hold the cube-head collage, which also appears two
 * sections further down as the pop figure — the same joke twice within one
 * scroll. A diagram earns the space instead: five parts of a business, wired
 * in a loop, with one link that fails as you scroll past it.
 *
 * The point it makes is the section's point. Nothing here is broken on its
 * own; the connection between two working things is what failed.
 */
const NODES = [
  { id: "brand", label: "BRAND", x: 50, y: 14 },
  { id: "product", label: "PRODUCT", x: 86, y: 40 },
  { id: "sales", label: "SALES", x: 72, y: 80 },
  { id: "ops", label: "OPS", x: 28, y: 80 },
  { id: "data", label: "DATA", x: 14, y: 40 },
];

// The loop, in order. The `sales -> ops` hop is the one that gives out.
const LINKS = [
  ["brand", "product"],
  ["product", "sales"],
  ["sales", "ops"],
  ["ops", "data"],
  ["data", "brand"],
];

const FAULT_INDEX = 2;

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

export const SystemDiagnostic = ({ className = "", testId = "system-diagnostic" }) => {
  const wrapRef = useRef(null);
  const linkRefs = useRef([]);
  const faultRef = useRef(null);
  const [state, setState] = useState(prefersReducedMotion() ? "found" : "idle");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const links = linkRefs.current.filter(Boolean);
    const fault = faultRef.current;

    if (prefersReducedMotion()) {
      links.forEach((l) => {
        l.style.strokeDashoffset = "0";
      });
      if (fault) fault.style.opacity = "1";
      return undefined;
    }

    // Each link draws in sequence across the scrub, then the faulty one
    // un-draws and the fault marker appears.
    const lengths = links.map((l) => l.getTotalLength());
    links.forEach((l, i) => {
      l.style.strokeDasharray = `${lengths[i]}`;
      l.style.strokeDashoffset = `${lengths[i]}`;
    });

    // scrub runs every frame; the SVG is written directly and only the
    // idle/found flag goes through React, when it flips.
    let shown = null;
    const apply = (p) => {
      const drawWindow = 0.72; // links finish drawing at 72% of the scrub
      links.forEach((l, i) => {
        const slotStart = (i / links.length) * drawWindow;
        const slotEnd = ((i + 1) / links.length) * drawWindow;
        const local = (p - slotStart) / (slotEnd - slotStart);
        const clamped = Math.max(0, Math.min(1, local));
        l.style.strokeDashoffset = `${lengths[i] * (1 - clamped)}`;
      });

      // Past the draw window the fault re-opens, which is the whole point.
      const faultProgress = Math.max(0, Math.min(1, (p - drawWindow) / (1 - drawWindow)));
      const faulty = links[FAULT_INDEX];
      if (faulty) {
        faulty.style.strokeDashoffset = `${lengths[FAULT_INDEX] * faultProgress * 0.85}`;
        faulty.style.stroke = faultProgress > 0.15 ? "#E54A25" : "#F19020";
      }
      if (fault) fault.style.opacity = faultProgress > 0.35 ? "1" : "0";
      const next = faultProgress > 0.35 ? "found" : "idle";
      if (next !== shown) {
        shown = next;
        setState(next);
      }
    };

    const st = gsap.to(
      {},
      {
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 85%",
          end: "bottom 45%",
          scrub: 0.6,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        },
      }
    );

    return () => {
      st.scrollTrigger && st.scrollTrigger.kill();
      st.kill();
    };
  }, []);

  const faultLink = LINKS[FAULT_INDEX];
  const faultMid = {
    x: (byId[faultLink[0]].x + byId[faultLink[1]].x) / 2,
    y: (byId[faultLink[0]].y + byId[faultLink[1]].y) / 2,
  };

  return (
    <figure ref={wrapRef} className={className} data-testid={testId} data-state={state}>
      <svg viewBox="0 0 100 100" className="w-full" role="img" aria-label="Diagram: five connected parts of a business, with the link between sales and operations broken">
        {/* halo */}
        <circle cx="50" cy="50" r="41" fill="#232A2A" opacity="0.045" />

        {LINKS.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            x1={byId[a].x}
            y1={byId[a].y}
            x2={byId[b].x}
            y2={byId[b].y}
            stroke="#F19020"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        ))}

        {/* fault marker */}
        <g ref={faultRef} style={{ opacity: 0, transition: "opacity 0.35s ease" }}>
          <circle cx={faultMid.x} cy={faultMid.y} r="4.6" fill="#E0D8C1" stroke="#E54A25" strokeWidth="0.9" />
          <line x1={faultMid.x - 1.7} y1={faultMid.y - 1.7} x2={faultMid.x + 1.7} y2={faultMid.y + 1.7} stroke="#E54A25" strokeWidth="1" strokeLinecap="round" />
          <line x1={faultMid.x + 1.7} y1={faultMid.y - 1.7} x2={faultMid.x - 1.7} y2={faultMid.y + 1.7} stroke="#E54A25" strokeWidth="1" strokeLinecap="round" />
        </g>

        {NODES.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="3.1" fill="#232A2A" />
            <circle cx={n.x} cy={n.y} r="5.4" fill="none" stroke="#232A2A" strokeWidth="0.4" opacity="0.35" />
            <text
              x={n.x}
              y={n.y < 50 ? n.y - 8 : n.y + 11}
              textAnchor="middle"
              fontSize="4.1"
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
              fontWeight="500"
              letterSpacing="0.4"
              fill="#232A2A"
              opacity="0.72"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="font-mono-sys mt-3 text-[12.5px] leading-[1.5] text-[#232A2A]/60">
        <span className="accent-signal-text font-bold">Fault: </span>
        Every part is working. The handover between two of them is not. That is
        the one that never shows up on a departmental report.
      </figcaption>
    </figure>
  );
};
