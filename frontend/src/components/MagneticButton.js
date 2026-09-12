import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Soft magnetic button (max ~8px pull) with optional hover micro-copy swap.
 * Renders a <Link> when `to` is provided, otherwise a <button>.
 *
 * The component owns `transform` outright, and that matters. The stylesheet
 * carries `.btn-*:active { transform: scale(0.97) }` for press feedback, but an
 * inline transform beats a stylesheet rule, so the moment the pointer moved the
 * press response silently stopped happening on every pointer device. The scale
 * is composed into the same inline string now, so pull and press coexist.
 *
 * The click pulse is GSAP rather than a CSS animation because it starts from
 * wherever the button was actually pressed, and it has to be retriggerable
 * mid-flight — replaying a CSS animation means removing it and forcing a
 * reflow, which is a lot of ceremony for a ring.
 *
 * The hoverText layer reveals character-by-character rather than as one
 * block. `children` stays a single unit deliberately — it is often text plus
 * an icon (`Explore the Network <ArrowRight/>`), and a per-character split
 * only makes sense on hoverText, which this codebase only ever passes as a
 * plain string. currentColor throughout, no new colour introduced; the only
 * thing this changes is *how* the copy arrives, not what it looks like once
 * it has.
 */
const splitChars = (text) =>
  String(text)
    .split("")
    .map((ch, i) => (
      <span key={i} className="btn-char" style={{ "--i": i }}>
        {ch === " " ? " " : ch}
      </span>
    ));

export const MagneticButton = ({
  children,
  hoverText,
  to,
  href,
  onClick,
  className = "btn-ink",
  testId,
  type = "button",
  ariaLabel,
  disabled = false,
}) => {
  const ref = useRef(null);
  const pulseRef = useRef(null);
  const pull = useRef({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const reduced = prefersReducedMotion();

  const hoverChars = useMemo(
    () => (hoverText && !reduced ? splitChars(hoverText) : null),
    [hoverText, reduced]
  );

  const paint = useCallback((pressed) => {
    const el = ref.current;
    if (!el) return;
    const { x, y } = pull.current;
    el.style.transform = `translate(${x}px, ${y}px)${pressed ? " scale(0.97)" : ""}`;
  }, []);

  const onMove = (e) => {
    if (prefersReducedMotion() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const max = 8;
    pull.current = {
      x: Math.max(-max, Math.min(max, dx * 0.15)),
      y: Math.max(-max, Math.min(max, dy * 0.15)),
    };
    paint(false);
  };

  const onLeave = () => {
    setHover(false);
    pull.current = { x: 0, y: 0 };
    paint(false);
  };

  const ripple = (e) => {
    const el = ref.current;
    const ring = pulseRef.current;
    if (!el || !ring || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    // Keyboard activation reports no coordinates; start from the centre then.
    const cx = e && e.clientX ? e.clientX - r.left : r.width / 2;
    const cy = e && e.clientY ? e.clientY - r.top : r.height / 2;
    const reach = Math.max(r.width, r.height) * 2.1;
    gsap.set(ring, { left: cx, top: cy, scale: 0.2, opacity: 0.55 });
    gsap.to(ring, {
      scale: reach / 14,
      opacity: 0,
      duration: 0.62,
      ease: "power2.out",
      overwrite: true,
    });
  };

  const handleClick = (e) => {
    ripple(e);
    if (onClick) onClick(e);
  };

  const inner = (
    <>
      <span className="btn-pulse" ref={pulseRef} aria-hidden="true" />
      <span className="grid overflow-hidden">
        <span
          className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300"
          style={hoverText ? { opacity: hover ? 0 : 1, transform: hover ? "translateY(-110%)" : "none" } : undefined}
        >
          {children}
        </span>
        {hoverText && (
          <span
            className={`col-start-1 row-start-1 inline-flex items-center justify-center whitespace-nowrap ${
              hoverChars ? "btn-char-row" : "transition-all duration-300 gap-2"
            }`}
            aria-hidden="true"
            data-hover={hover ? "true" : "false"}
            style={
              hoverChars
                ? undefined
                : { opacity: hover ? 1 : 0, transform: hover ? "none" : "translateY(110%)" }
            }
          >
            {hoverChars || hoverText}
          </span>
        )}
      </span>
    </>
  );

  const common = {
    ref,
    className: `${className} will-change-transform`,
    style: { transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)" },
    onMouseMove: onMove,
    onMouseEnter: () => setHover(true),
    onMouseLeave: onLeave,
    onPointerDown: () => paint(true),
    onPointerUp: () => paint(false),
    onClick: handleClick,
    "data-testid": testId,
    "aria-label": ariaLabel,
  };

  if (to) return <Link to={to} {...common}>{inner}</Link>;
  if (href) return <a href={href} {...common}>{inner}</a>;
  return <button type={type} disabled={disabled} {...common}>{inner}</button>;
};
