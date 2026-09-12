import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, useReducedMotion } from "@/lib/motion";
import { track } from "@/lib/api";

/**
 * A fan of cards in 3D, one active at a time — click a side card to bring it
 * forward, drag or click the front card to open it. Adapted from a supplied
 * shadcn/Tailwind CardStack reference: same mechanical shape (spring
 * physics, drag-to-cycle, click-to-select), rebuilt on this codebase's own
 * stack (framer-motion already a dependency, react-router Link, @/lib/motion
 * for reduced-motion, @/lib/utils cn()) rather than the reference's Next.js
 * primitives.
 *
 * Geometry is tuned, not hardcoded — see useGeometry — because the same
 * interaction model has to hold a 5-card 54° desktop fan and a 3-card
 * near-flat mobile swipe deck.
 */
const SPRING = { type: "spring", stiffness: 240, damping: 26 };
const AUTOPLAY_MS = 5200;

const DESKTOP_GEOMETRY = {
  isDesktop: true,
  cardWidth: 520,
  cardHeight: 330,
  perspective: 1250,
  xStep: 224, // cardWidth * (1 - overlap), overlap ~0.57
  depthStep: 95,
  stepDeg: 13.5, // 5 visible cards across a 54deg spread
  tiltDeg: 8,
  scaleActive: 1.035,
  scaleInactive: 0.93,
  liftActive: 30,
  maxOffset: 2, // visible offsets -2..2 = 5 cards; the 6th (offset 3) hides
};

/** Circular signed distance of item i from the active index, over n items. */
const signedOffset = (i, active, n) => {
  const raw = (i - active + n) % n;
  return raw > n / 2 ? raw - n : raw;
};

const useGeometry = (stageRef) => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setStageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef]);

  if (isDesktop) return DESKTOP_GEOMETRY;

  // Mobile: not a scaled-down fan. ~3 visible cards, active card ~86% of the
  // measured stage width, minimal perspective, swipe-first.
  const cardWidth = Math.max(stageWidth * 0.86, 240);
  return {
    isDesktop: false,
    cardWidth,
    cardHeight: cardWidth * 0.635,
    perspective: 600,
    xStep: cardWidth * 0.72,
    depthStep: 40,
    stepDeg: 6,
    tiltDeg: 4,
    scaleActive: 1,
    scaleInactive: 0.9,
    liftActive: 14,
    maxOffset: 1, // -1..1 = 3 cards
  };
};

const CardFace = ({ item, isActive }) => (
  <div className="evidence-card-face-inner flex h-full flex-col rounded-[20px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 shadow-[0_18px_40px_-20px_rgba(35,42,42,0.35)] sm:p-7">
    <div className="flex items-start justify-between gap-3">
      <span className="font-display text-[14px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-[#232A2A]/55">
        {item.num} <span className="text-[#232A2A]/25">—</span> <span className="text-[#232A2A]">{item.name}</span>
      </span>
      <span className="h-9 w-9 shrink-0" aria-hidden="true">
        <item.Glyph />
      </span>
    </div>
    <p className="sys-chip mt-3 text-[#232A2A]/50">{item.descriptor}</p>
    <p className="font-editorial mt-4 flex-1 text-[18px] italic leading-[1.42] text-[#232A2A]/85">{item.copy}</p>
    {isActive && (
      <span className="link-draw mt-4 inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-[#232A2A]">
        Explore <ArrowRight size={14} />
      </span>
    )}
  </div>
);

/** "03 / 06 ──●── MINDS IN THE MIX" — a moving node on a track, real buttons underneath. */
const DeckProgress = ({ items, active, onSelect, testId }) => (
  <div className="mx-auto mt-8 flex max-w-[560px] items-center gap-4" data-testid={`${testId}-progress`}>
    <span className="font-mono-sys shrink-0 tabular-nums text-[13px] text-[#232A2A]/55">
      {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
    </span>
    <div className="relative flex flex-1 items-center justify-between" role="group" aria-label="Jump to category">
      <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#232A2A]/15" aria-hidden="true" />
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Go to ${item.name}`}
          aria-current={i === active ? "true" : undefined}
          data-testid={`${testId}-progress-${item.id}`}
          className="relative z-10 flex h-6 w-6 items-center justify-center"
        >
          {i === active && (
            <motion.span layoutId={`${testId}-progress-node`} className="absolute h-2.5 w-2.5 rounded-full bg-[#F19020]" transition={SPRING} />
          )}
          <span className={cn("h-1.5 w-1.5 rounded-full", i === active ? "bg-transparent" : "bg-[#232A2A]/25")} />
        </button>
      ))}
    </div>
    <span className="sys-chip min-w-0 shrink-0 truncate text-[#232A2A]/70" aria-live="polite" data-testid={`${testId}-progress-label`}>
      {items[active]?.name}
    </span>
  </div>
);

/**
 * The orange route, redrawing itself toward the (fixed) active-card slot on
 * every change. Not a positional tracker: the active slot never actually
 * moves on screen — only which item occupies it does — so there is nothing
 * to measure via getBoundingClientRect, and doing so would only race
 * framer-motion's own in-flight spring. A percentage-space path replayed via
 * strokeDasharray/strokeDashoffset (RouteLine.js's own technique) reads as
 * "the route reasserts itself toward the active card" without that race.
 */
const RouteOverlay = ({ active, testId }) => {
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return undefined;
    const len = path.getTotalLength();
    const tween = gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" });
    return () => tween.kill();
  }, [active]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-12 left-0 h-[calc(100%+3rem)] w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
      data-testid={`${testId}-route`}
    >
      <path ref={pathRef} d="M50,100 C 50,72 50,46 50,16" fill="none" stroke="#F19020" strokeWidth={1.4} strokeLinecap="round" opacity="0.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const EvidenceDeckStaticList = ({ items, testId }) => (
  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid={`${testId}-static-list`}>
    {items.map((item) => (
      <li key={item.id}>
        <Link
          to={item.route}
          onClick={() => track("orbit_category_opened", { category: item.key, via: "reduced_motion_list" })}
          className="cap-tile group flex h-full flex-col rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 transition-colors hover:border-[#F19020]"
          data-testid={`${testId}-static-${item.key}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-[#232A2A]/55">{item.num} — {item.name}</span>
            <span className="h-8 w-8 shrink-0" aria-hidden="true"><item.Glyph /></span>
          </div>
          <p className="sys-chip mt-2 text-[#232A2A]/50">{item.descriptor}</p>
          <p className="font-editorial mt-3 flex-1 text-[16px] italic leading-[1.4] text-[#232A2A]/85">{item.copy}</p>
          <span className="link-draw mt-4 inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#232A2A]">
            Explore <ArrowRight size={13} />
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

/**
 * items: [{ id, key, num, name, descriptor, copy, route, Glyph }]
 * Content-agnostic beyond that shape — OrbitSection supplies ORBIT_CATEGORIES
 * plus each category's glyph component.
 */
export const EvidenceDeck = ({ items, testId = "evidence-deck", className = "" }) => {
  const n = items.length;
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const focusRefs = useRef([]);
  const focusAfterChange = useRef(false);
  const hasInteracted = useRef(false);
  const geometry = useGeometry(stageRef);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(typeof document !== "undefined" && document.hidden);

  const goTo = useCallback(
    (next, source) => {
      setActive((prev) => {
        const idx = ((next % n) + n) % n;
        if (source !== "autoplay") {
          hasInteracted.current = true;
          if (idx !== prev) track("orbit_category_changed", { to: items[idx].key, via: source });
        }
        return idx;
      });
    },
    [n, items]
  );

  // One-time "seen" ping, independent of the reduced-motion branch below —
  // rootRef exists in both, stageRef only in the animated one.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("orbit_viewed", {});
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause signals: offscreen, tab hidden, hovered, focused.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduced]);

  // Autoplay. Re-armed on every `active` change (including its own ticks) so
  // that a hasInteracted flip — set synchronously by goTo, one ref, not
  // state — is checked again immediately rather than waiting for whatever
  // stale closure the previous interval captured.
  useEffect(() => {
    if (reduced || hasInteracted.current || hovered || focused || !onScreen || tabHidden) return undefined;
    const id = window.setInterval(() => goTo(active + 1, "autoplay"), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduced, hovered, focused, onScreen, tabHidden, active, goTo]);

  useEffect(() => {
    if (focusAfterChange.current) {
      focusAfterChange.current = false;
      focusRefs.current[active]?.focus();
    }
  }, [active]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAfterChange.current = true;
      goTo(active + 1, "keyboard");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAfterChange.current = true;
      goTo(active - 1, "keyboard");
    }
  };

  const handleDragEnd = (e, info) => {
    const distThreshold = geometry.cardWidth * 0.18;
    const velThreshold = 350;
    if (info.offset.x < -distThreshold || info.velocity.x < -velThreshold) {
      goTo(active + 1, "drag");
      track("orbit_card_dragged", { direction: "next" });
    } else if (info.offset.x > distThreshold || info.velocity.x > velThreshold) {
      goTo(active - 1, "drag");
      track("orbit_card_dragged", { direction: "prev" });
    }
  };

  if (reduced) {
    return (
      <div ref={rootRef} className={className} data-testid={testId}>
        <EvidenceDeckStaticList items={items} testId={testId} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className} data-testid={testId}>
      <div
        ref={stageRef}
        className="evidence-deck-stage relative mx-auto"
        style={{ perspective: geometry.perspective, height: geometry.cardHeight + geometry.liftActive + 24, maxWidth: geometry.isDesktop ? geometry.cardWidth + geometry.xStep * (geometry.maxOffset + 0.6) : "100%" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        role="group"
        aria-roledescription="carousel"
        aria-label="The Hi Anzy Orbit — six ecosystem categories"
        data-testid={`${testId}-stage`}
      >
        <RouteOverlay active={active} testId={testId} />
        {items.map((item, i) => {
          const offset = signedOffset(i, active, n);
          const abs = Math.abs(offset);
          const hidden = abs > geometry.maxOffset;
          const isActive = i === active;
          const x = offset * geometry.xStep;
          const z = -abs * geometry.depthStep;
          const rotateY = offset * -geometry.stepDeg;
          const scale = isActive ? geometry.scaleActive : geometry.scaleInactive;
          const y = isActive ? -geometry.liftActive : 0;
          const zIndex = 100 - abs * 10 + (isActive ? 5 : 0);

          return (
            <motion.div
              key={item.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="evidence-card absolute left-1/2 top-0"
              style={{ width: geometry.cardWidth, height: geometry.cardHeight, marginLeft: -geometry.cardWidth / 2, zIndex }}
              animate={{ x, y, z, rotateY, scale, opacity: hidden ? 0 : 1 }}
              transition={SPRING}
              aria-hidden={hidden}
              aria-roledescription="slide"
              drag={isActive ? "x" : false}
              dragElastic={0.12}
              dragMomentum={false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={isActive ? handleDragEnd : undefined}
              data-testid={`${testId}-card-${item.key}`}
            >
              {isActive ? (
                <Link
                  ref={(el) => { focusRefs.current[i] = el; }}
                  to={item.route}
                  tabIndex={hidden ? -1 : 0}
                  className="evidence-card-face block h-full w-full"
                  onClick={() => track("orbit_category_opened", { category: item.key })}
                >
                  <CardFace item={item} isActive />
                </Link>
              ) : (
                <button
                  ref={(el) => { focusRefs.current[i] = el; }}
                  type="button"
                  tabIndex={hidden ? -1 : 0}
                  className="evidence-card-face block h-full w-full text-left"
                  onClick={() => goTo(i, "click")}
                >
                  <CardFace item={item} isActive={false} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      <DeckProgress items={items} active={active} onSelect={(i) => goTo(i, "progress")} testId={testId} />
    </div>
  );
};
