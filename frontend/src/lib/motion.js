import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(prefersReducedMotion());
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
};

export const webglAvailable = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
};

/** Smooth scrolling via Lenis, synced with ScrollTrigger. Disabled for reduced motion. */
export const LenisProvider = ({ children }) => {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return children;
};

/**
 * Single source of truth for scroll position.
 *
 * Lenis interpolates its own scroll value and only then writes it to the
 * window, so anything reading `window.scrollY` from its own rAF loop lands a
 * frame behind and drifts out of sync with everything else. Subscribing here
 * means the progress bar, the hero 3D route and any future scroll-driven work
 * all read the *same* value on the *same* tick.
 *
 * Returns an unsubscribe function.
 */
export const subscribeScroll = (cb) => {
  const nativeLimit = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  let lenisOff = null;
  let raf = 0;

  const emitNative = () => {
    raf = 0;
    cb(window.scrollY, nativeLimit());
  };
  const onNative = () => {
    if (!raf) raf = requestAnimationFrame(emitNative);
  };

  // Lenis is created by a parent effect, which runs *after* child effects on
  // mount — so poll briefly for it instead of assuming it already exists.
  let tries = 0;
  let attachTimer;
  let disposed = false;
  const attach = () => {
    if (disposed) return;
    const lenis = window.__lenis;
    if (lenis) {
      const handler = ({ scroll, limit }) => cb(scroll, limit || nativeLimit());
      lenis.on("scroll", handler);
      lenisOff = () => lenis.off("scroll", handler);
      cb(lenis.scroll ?? window.scrollY, lenis.limit || nativeLimit());
      return;
    }
    tries += 1;
    if (tries < 40) attachTimer = setTimeout(attach, 50);
  };
  attach();

  window.addEventListener("scroll", onNative, { passive: true });
  window.addEventListener("resize", onNative);
  emitNative();

  return () => {
    disposed = true;
    clearTimeout(attachTimer);
    if (lenisOff) lenisOff();
    window.removeEventListener("scroll", onNative);
    window.removeEventListener("resize", onNative);
    if (raf) cancelAnimationFrame(raf);
  };
};

/**
 * Is the strip directly beneath the fixed header a dark surface?
 *
 * Sampling what is actually painted is more reliable than tagging every dark
 * section by hand — new sections get correct header contrast for free, and it
 * cannot drift out of step with the markup.
 */
export const isDarkUnderNav = (navHeight = 84) => {
  if (typeof document === "undefined" || !document.elementsFromPoint) return false;
  const y = navHeight + 6;
  const xs = [window.innerWidth * 0.25, window.innerWidth * 0.5, window.innerWidth * 0.75];
  let dark = 0;
  let seen = 0;

  xs.forEach((x) => {
    const stack = document.elementsFromPoint(x, y) || [];
    for (const el of stack) {
      if (el.closest("header") || el.tagName === "HTML") continue;
      const bg = getComputedStyle(el).backgroundColor;
      const parts = bg.match(/[\d.]+/g);
      if (!parts || parts.length < 3) continue;
      const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
      if (alpha < 0.5) continue; // see-through: keep looking underneath
      const [r, g, b] = parts.map(Number);
      // Rec. 709 luma — matches how the eye weights the channels.
      const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      seen += 1;
      if (luma < 0.5) dark += 1;
      break;
    }
  });

  return seen > 0 && dark * 2 > seen;
};

/** Re-measure after layout changes (route swap, full-screen exit, font load). */
export const resyncScroll = () => {
  if (window.__lenis) window.__lenis.resize();
  ScrollTrigger.refresh();
};

/** Scroll restoration + ScrollTrigger refresh on route change. A #hash lands
 *  on that element instead of the top, once it exists — lazy routes mount
 *  their content after this effect's first tick, so a hash target may not
 *  be in the DOM yet and is worth a brief retry rather than one lookup. */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    let tries = 0;
    let retry = null;

    const toTop = () => {
      // Drive whichever scroller is actually in charge — calling both makes
      // Lenis and the browser fight over the same frame.
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    };

    const toHash = () => {
      const el = document.getElementById(hash.slice(1));
      if (!el) {
        tries += 1;
        if (tries < 20) retry = setTimeout(toHash, 50);
        else toTop();
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
      else window.scrollTo(0, top);
    };

    if (hash) toHash();
    else toTop();

    // Lazy routes mount their content after this tick, so the document height
    // is still stale here — re-measure once it has settled.
    const t = setTimeout(resyncScroll, 250);
    return () => {
      clearTimeout(t);
      if (retry) clearTimeout(retry);
    };
  }, [pathname, hash]);
  return null;
};

/** Intersection reveal hook — adds .is-visible when in view. */
export const useRevealObserver = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      const showAll = () => el.querySelectorAll(".reveal:not(.is-visible)").forEach((n) => n.classList.add("is-visible"));
      showAll();
      // Async-rendered content (fetched cases, portfolio, etc.) must also be shown.
      const mo = new MutationObserver(showAll);
      mo.observe(el, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const observeAll = () => el.querySelectorAll(".reveal:not(.is-visible)").forEach((n) => io.observe(n));
    observeAll();
    // Watch for async-rendered .reveal nodes (fetched case studies, portfolio wall, …)
    // — without this they are never observed and stay hidden at opacity 0.
    const mo = new MutationObserver(observeAll);
    mo.observe(el, { childList: true, subtree: true });
    // Safety net: content must never stay hidden if the observer misbehaves.
    const failsafe = setTimeout(() => {
      el.querySelectorAll(".reveal:not(.is-visible)").forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) n.classList.add("is-visible");
      });
    }, 1600);
    return () => {
      clearTimeout(failsafe);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return ref;
};
