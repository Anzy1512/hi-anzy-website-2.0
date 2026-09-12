import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Circular carousel — orbital deck.
 *
 * The motion is ported from the supplied reference; the surface is entirely
 * hiAnzy. What was kept, deliberately, is only the geometry and timing:
 * cards positioned on an ellipse by their offset from the active index, with
 * scale/opacity/z falling off by distance, and a 0.65s move. That easing —
 * cubic-bezier(0.22, 1, 0.36, 1) — is already this site's signature curve
 * (App.css's `.reveal`, OrbitSection's transition), so the two systems agree
 * without adjustment.
 *
 * What was replaced: the zinc/white-on-black palette, the generic shadows and
 * blur, the `text-white/40` type ramp. Cards are paper or ink in the brand
 * palette, headings are Rajdhani, tags use the site's `sys-chip`, and the
 * accent is the orange used everywhere else.
 *
 * Behaviour notes:
 *
 * - Clicking an inactive card selects it; clicking the *active* card opens it.
 *   That is the same two-step the existing EvidenceDeck uses, so a reader who
 *   has met one deck already knows how this one works.
 * - Autoplay pauses on hover, on focus, and when the tab is hidden — the last
 *   of which matches TouchpointTicker's existing pattern.
 * - Under reduced motion the orbit is abandoned entirely for a plain list.
 *   Every card is still a real link, so nothing is lost.
 *
 * Kept from the reference but corrected: an unused `useMemo` import; an
 * unguarded `items[activeIndex].id` that throws on an empty list; and the
 * centre counter, which was `absolute inset-0` over the whole component and
 * would have painted on top of the cards. It sits behind them now, as a
 * ghosted index numeral.
 */

const VISIBLE_COUNT = 5;

/**
 * Radii and card size scale with the container — 220px of horizontal throw
 * does not fit a phone.
 *
 * `track` is tuned to the arc's real extent, not guessed. The active card sits
 * at -ry and the outermost at about -0.31·ry, so the cards occupy roughly
 * (0.69·ry + cardH) and the raw ellipse leaves a band of dead space below
 * them. The render offsets y by +ry/2 to recentre the arc inside the track,
 * which is why these heights are as tight as they are.
 */
const geometryFor = (width) => {
  // 180 + rx 94 keeps the outermost card inside a 375px viewport (2×184=368)
  // while giving a count-prefixed tag ("10 SPECIALISTS", the longest one in
  // practice) room not to truncate — 156 was originally sized for the tag
  // alone, before per-roster item counts were added to it.
  if (width < 480) return { rx: 94, ry: 56, cardW: 180, cardH: 100, track: 172 };
  if (width < 768) return { rx: 152, ry: 76, cardW: 168, cardH: 112, track: 196 };
  return { rx: 220, ry: 98, cardW: 192, cardH: 126, track: 218 };
};

function getItemPosition(index, activeIndex, total) {
  const offset = index - activeIndex;
  const half = Math.floor(VISIBLE_COUNT / 2);
  let adjustedOffset = offset;

  if (offset > half) adjustedOffset = offset - total;
  if (offset < -half) adjustedOffset = offset + total;

  if (Math.abs(adjustedOffset) > half * 2) return null;

  const angle = (adjustedOffset / VISIBLE_COUNT) * Math.PI;
  const distance = Math.abs(adjustedOffset);
  const maxDistance = half + 1;

  return {
    angle,
    distance,
    scale: Math.max(0, 1 - (distance / maxDistance) * 0.3),
    opacity: Math.max(0.3, 1 - (distance / maxDistance) * 0.7),
    zIndex: VISIBLE_COUNT - distance,
  };
}

export function CircularCarousel({
  items = [],
  label,
  activeIndex: controlledIndex,
  onActiveChange,
  onActivate,
  autoPlay = true,
  autoPlayInterval = 4600,
  tone = "paper",
  className,
  testId,
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const [geo, setGeo] = useState(() => geometryFor(1024));
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const reduced = prefersReducedMotion();

  const total = items.length;
  const activeIndex = Math.min(controlledIndex ?? internalIndex, Math.max(total - 1, 0));
  const dark = tone === "ink";

  const goTo = useCallback(
    (index) => {
      if (!total) return;
      const newIndex = ((index % total) + total) % total;
      if (controlledIndex === undefined) setInternalIndex(newIndex);
      if (onActiveChange) onActiveChange(newIndex);
    },
    [total, controlledIndex, onActiveChange]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  /* Geometry follows the container, not the window: this deck is rendered
     inside different column widths on different pages. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setGeo(geometryFor(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* Autoplay only while the deck is actually on screen. Several of these are
     stacked vertically on /work — without this, eight decks would all be
     cycling at once, which is both visually noisy and pointless work for the
     seven nobody is looking at. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => entry && setInView(entry.isIntersecting),
      { rootMargin: "0px", threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay || reduced || isHovered || isFocused || !tabVisible || !inView || total < 2) return undefined;
    const id = setInterval(next, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, reduced, autoPlayInterval, isHovered, isFocused, tabVisible, inView, total, next]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  };

  if (!total) return null;

  const activeItem = items[activeIndex];

  /* ── Reduced motion: no orbit, no autoplay, no transforms. A plain list of
        the same links, which is all the orbit was ever decorating. ── */
  if (reduced) {
    return (
      <div className={cn("w-full", className)} data-testid={testId}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <CardShell item={item} dark={dark} isActive={false} onActivate={onActivate} static />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={label || "Deck"}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn("relative flex w-full flex-col items-center gap-7 outline-none", className)}
      data-testid={testId}
    >
      <div ref={trackRef} className="relative w-full" style={{ height: geo.track }}>
        {/* Ghosted index, behind the cards. */}
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className={cn("font-display text-[clamp(3.5rem,9vw,6rem)] leading-none", dark ? "text-[#F7F5EE]/[0.07]" : "text-[#232A2A]/[0.07]")}>
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = getItemPosition(i, activeIndex, total);
            if (!pos) return null;
            const isActive = i === activeIndex;

            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: Math.sin(pos.angle) * geo.rx,
                  // +ry/2 recentres the arc: without it every card sits in the
                  // upper half of the track and the lower half is dead space.
                  y: -Math.cos(pos.angle) * geo.ry + geo.ry / 2,
                  scale: pos.scale,
                  opacity: pos.opacity,
                  zIndex: pos.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => (isActive ? onActivate && onActivate(item) : goTo(i))}
                aria-label={isActive && item.href ? `Open ${item.title}` : `Show ${item.title}`}
                aria-current={isActive ? "true" : undefined}
                style={{ width: geo.cardW, height: geo.cardH, transformOrigin: "center center", marginLeft: -geo.cardW / 2, marginTop: -geo.cardH / 2 }}
                className={cn(
                  "absolute left-1/2 top-1/2 z-10 flex cursor-pointer flex-col items-start justify-between rounded-[16px] border p-4 text-left transition-colors",
                  dark
                    ? "bg-[#232A2A] text-[#F7F5EE]"
                    : "bg-[#F7F5EE] text-[#232A2A]",
                  isActive
                    ? "border-[#F19020] shadow-[0_18px_44px_-18px_rgba(35,42,42,0.45)]"
                    : dark
                      ? "border-[#F7F5EE]/15"
                      : "border-[#232A2A]/15"
                )}
              >
                <CardBody item={item} dark={dark} isActive={isActive} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Active item's full copy, below the orbit where it is actually
          readable. The reserved height only applies when there is prose to
          reserve it for — portfolio decks carry a title and a link and
          nothing else, and an empty 72px band under them reads as a gap. */}
      <div className={cn("w-full max-w-[46ch] px-2 text-center", items.some((i) => i.description) && "min-h-[72px]")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeItem.description && (
              <p className={cn("font-editorial text-[16px] italic leading-[1.5]", dark ? "text-[#F7F5EE]/78" : "text-[#232A2A]/78")}>
                {activeItem.description}
              </p>
            )}
            {activeItem.href && (
              <button
                type="button"
                onClick={() => onActivate && onActivate(activeItem)}
                className={cn(
                  "link-draw inline-flex items-center gap-1.5 text-[13.5px] font-semibold",
                  activeItem.description && "mt-3",
                  dark ? "text-[#F7F5EE]" : "text-[#232A2A]"
                )}
                data-testid={testId ? `${testId}-open` : undefined}
              >
                {activeItem.external ? <>Visit <ArrowUpRight size={14} /></> : <>Explore <ArrowRight size={14} /></>}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <DeckButton onClick={prev} dark={dark} label="Previous" testId={testId ? `${testId}-prev` : undefined}>
          <ChevronLeft size={17} />
        </DeckButton>

        {/* One dot per item reads fine for a handful of categories, but this
            component is also fed real, variable-length API data — the
            portfolio decks range from 4 items to 25 (Social Media). 25
            non-wrapping dots doesn't just look wrong, it overflows the
            viewport at every width up to roughly 1400px; found live during
            the Phase 4 audit, not by inspection. Above the threshold, fall
            back to the same compact "NN / NN" numeric readout EvidenceDeck's
            own DeckProgress uses — prev/next and clicking a visible orbit
            card still jump to any item; only the dot-per-item overview goes
            away, and only once it would have stopped being an overview. */}
        {total <= 10 ? (
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${item.title}`}
                aria-current={i === activeIndex ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "w-6 bg-[#F19020]"
                    : dark
                      ? "w-1.5 bg-[#F7F5EE]/25 hover:bg-[#F7F5EE]/50"
                      : "w-1.5 bg-[#232A2A]/25 hover:bg-[#232A2A]/50"
                )}
              />
            ))}
          </div>
        ) : (
          <span className={cn("font-mono-sys tabular-nums text-[13px]", dark ? "text-[#F7F5EE]/55" : "text-[#232A2A]/55")} aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        )}

        <DeckButton onClick={next} dark={dark} label="Next" testId={testId ? `${testId}-next` : undefined}>
          <ChevronRight size={17} />
        </DeckButton>
      </div>
    </div>
  );
}

const DeckButton = ({ onClick, dark, label, children, testId }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-testid={testId}
    className={cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
      dark
        ? "border-[#F7F5EE]/25 text-[#F7F5EE]/80 hover:border-[#F19020] hover:text-[#F19020]"
        : "border-[#232A2A]/20 text-[#232A2A]/80 hover:border-[#F19020] hover:text-[#F19020]"
    )}
  >
    {children}
  </button>
);

/** Card face. Shared by the orbit and the reduced-motion list. */
const CardBody = ({ item, dark, isActive }) => {
  const Glyph = item.Glyph;
  return (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        {item.tag && (
          <span className={cn("sys-chip truncate text-[10px]", dark ? "text-[#F7F5EE]/55" : "text-[#232A2A]/55")}>{item.tag}</span>
        )}
        {/* Fixed box so both glyph conventions in this codebase work here: the
            existing OrbitGlyphs size themselves with h-full/w-full and ignore
            props, while InfographicGlyphs take an explicit size. */}
        {Glyph && (
          <span className={cn("block h-6 w-6 shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-45")} aria-hidden="true">
            <Glyph size={22} accent={isActive} dark={dark} />
          </span>
        )}
      </div>
      <h3
        className={cn(
          "font-display w-full leading-[1.06] transition-colors",
          isActive ? "text-[17px]" : "text-[15px]",
          dark ? "text-[#F7F5EE]" : "text-[#232A2A]"
        )}
      >
        {item.title}
      </h3>
    </>
  );
};

/** Static variant used only under reduced motion. */
const CardShell = ({ item, dark, onActivate }) => (
  <button
    type="button"
    onClick={() => onActivate && onActivate(item)}
    className={cn(
      "flex h-full w-full flex-col items-start justify-between gap-3 rounded-[16px] border p-4 text-left",
      dark ? "border-[#F7F5EE]/15 bg-[#232A2A]" : "border-[#232A2A]/15 bg-[#F7F5EE]"
    )}
  >
    <CardBody item={item} dark={dark} isActive />
    {item.description && (
      <p className={cn("text-[13.5px] leading-[1.5]", dark ? "text-[#F7F5EE]/70" : "text-[#232A2A]/70")}>{item.description}</p>
    )}
  </button>
);

export default CircularCarousel;
