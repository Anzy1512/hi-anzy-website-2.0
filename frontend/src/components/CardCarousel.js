import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/lib/motion";

/**
 * A horizontal, snap-scrolling deck of cards.
 *
 * Built for the discipline grid on /network and the insight list on
 * /insights, both of which used to lay every card out flat — sixteen tiles
 * or a full column, all visible and all competing for attention at once.
 * This shows a handful at a time and lets the reader deal themselves the
 * next: drag, scroll, or the arrows.
 *
 * The "deck" read comes from a scroll-driven scale/opacity pass on each
 * child — centred cards sit full-size and full-opacity, cards nearer the
 * edge recede — rather than from any layout trick, so the caller can pass
 * plain cards and this stays in charge of nothing but motion.
 *
 * `autoPlay` is opt-in (default off, so Work.js's case-study carousel is
 * unaffected): a card-by-card auto-advance, looping back to the start at the
 * end, using the same pause-on-hover/focus/tab-hidden/offscreen and
 * permanent-stop-on-real-interaction contract EvidenceDeck already
 * establishes elsewhere on this site. "Real interaction" is detected via
 * wheel/touchstart/pointerdown on the track itself and the prev/next
 * buttons — not via the scroll events auto-play's own `scrollBy` also fires,
 * which would otherwise look identical to a manual drag.
 */
export const CardCarousel = ({ children, label = "", testId = "card-carousel", autoPlay = false, autoPlayMs = 3800 }) => {
  const trackRef = useRef(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const hasInteracted = useRef(false);
  const intervalRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(typeof document !== "undefined" && document.hidden);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    Array.from(el.children).forEach((child) => {
      const r = child.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - cx) / (rect.width / 2 || 1);
      const t = Math.min(dist, 1);
      child.style.opacity = String(1 - t * 0.4);
      child.style.transform = `scale(${(1 - t * 0.06).toFixed(3)})`;
    });
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    sync();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sync, children]);

  const scrollByCard = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[0];
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.82;
    el.scrollBy({ left: dir * step, behavior: reduced ? "instant" : "smooth" });
  }, [reduced]);

  // Interaction stops the *running* interval directly, not just the next
  // effect re-run: nothing here mutates React state (the track's own
  // scrollLeft is driven imperatively), so — unlike EvidenceDeck's
  // state-driven autoplay — no re-render would otherwise happen to tear the
  // interval down and re-check hasInteracted.current.
  const markInteracted = useCallback(() => {
    hasInteracted.current = true;
    setPaused(true);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Real user input only — never fired by this component's own scrollBy
  // calls — so a genuine drag/wheel/click stops auto-play for good.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !autoPlay) return undefined;
    el.addEventListener("wheel", markInteracted, { passive: true });
    el.addEventListener("touchstart", markInteracted, { passive: true });
    el.addEventListener("pointerdown", markInteracted);
    return () => {
      el.removeEventListener("wheel", markInteracted);
      el.removeEventListener("touchstart", markInteracted);
      el.removeEventListener("pointerdown", markInteracted);
    };
  }, [autoPlay, markInteracted]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay || reduced || paused || hasInteracted.current || hovered || focused || !onScreen || tabHidden) return undefined;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, autoPlayMs);
    intervalRef.current = id;
    return () => {
      window.clearInterval(id);
      intervalRef.current = null;
    };

  }, [autoPlay, autoPlayMs, hovered, focused, onScreen, tabHidden, reduced, paused, scrollByCard]);

  return (
    <div
      className="relative"
      data-testid={testId}
      onMouseEnter={autoPlay ? () => setHovered(true) : undefined}
      onMouseLeave={autoPlay ? () => setHovered(false) : undefined}
      onFocus={autoPlay ? () => setFocused(true) : undefined}
      onBlur={autoPlay ? () => setFocused(false) : undefined}
    >
      <div ref={trackRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2" data-testid={`${testId}-track`}>
        {children}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="sys-chip text-[#232A2A]/45">{label}</p>
        <div className="flex shrink-0 gap-2">
          {autoPlay && !reduced && (
            <button type="button" aria-label={paused ? "Resume carousel motion" : "Pause carousel motion"} aria-pressed={paused} onClick={() => { hasInteracted.current = false; setPaused(value => !value); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#232A2A]/20 text-[#232A2A]" data-testid={`${testId}-pause`}>
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => { markInteracted(); scrollByCard(-1); }}
            disabled={!canPrev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#232A2A]/20 text-[#232A2A] transition-colors hover:border-[#F19020] disabled:opacity-30"
            aria-label="Scroll back"
            data-testid={`${testId}-prev`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => { markInteracted(); scrollByCard(1); }}
            disabled={!canNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#232A2A]/20 text-[#232A2A] transition-colors hover:border-[#F19020] disabled:opacity-30"
            aria-label="Scroll forward"
            data-testid={`${testId}-next`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
