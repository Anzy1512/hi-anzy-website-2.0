import { useEffect } from "react";
import { subscribeScroll, resyncScroll } from "@/lib/motion";

/**
 * Anything expanded closes itself once the reader has genuinely left it.
 *
 * An open <details> pushes everything below it down. Open three or four while
 * reading and the page becomes a different length than the one you were
 * navigating, so scroll position stops meaning what it meant — you lose your
 * place. Closing once the reader has moved on keeps the page the length they
 * last saw it.
 *
 * v2 — the "moved on" test changed, because the original one was wrong.
 *
 * It used to measure distance from the scroll position at the moment a panel
 * opened: more than 260px away in either direction, close it. That works for
 * something short, but a full case-study write-up or a packed FAQ answer is
 * routinely taller than 260px — so a reader scrolling *down into the content
 * they just opened, to keep reading it*, was indistinguishable from a reader
 * scrolling away from it. The panel closed itself mid-read. Work.js's own
 * toggleCase() carried a comment fighting exactly this symptom (delaying when
 * the rule started watching so the opening scroll didn't trip it), which
 * treated the effect, not the cause: nothing made the rule aware of how tall
 * the opened content actually was.
 *
 * Now: a panel is only eligible to close once it has actually been seen —
 * scrolled into the viewport at least once since it opened — and it closes
 * only once it has scrolled fully back out, in either direction, with a
 * small margin. Reading through a 2000px panel no longer matters; the panel
 * stays open for exactly as long as any part of it is still on screen.
 *
 * React-controlled panels (the case-study detail on /work is not a <details>
 * — React owns its open/closed state) are watched by id, listed below.
 */
const COLLAPSE_EVENT = "hianzy:collapse";
const CLEAR_MARGIN_PX = 48;
const WATCHED_PANEL_IDS = ["work-expand-panel"];

let resyncTimer = 0;
const scheduleResync = () => {
  window.clearTimeout(resyncTimer);
  resyncTimer = window.setTimeout(() => {
    resyncTimer = 0;
    resyncScroll();
  }, 260);
};

/** Any part of the element still on screen, plus a small margin either side. */
const isInOrNearViewport = (rect) => rect.bottom > -CLEAR_MARGIN_PX && rect.top < window.innerHeight + CLEAR_MARGIN_PX;

export const CollapseOnScroll = () => {
  useEffect(() => {
    // Elements confirmed on screen at least once since they opened. Only
    // these are allowed to close — an element that has never been seen
    // (a details panel that defaults open far below the fold, before the
    // reader has scrolled anywhere near it) must not be closed on the very
    // first scroll tick just because it currently sits outside the viewport.
    const seen = new WeakSet();

    const sweep = () => {
      let anyClosed = false;

      document.querySelectorAll("details[open]").forEach((d) => {
        const rect = d.getBoundingClientRect();
        const inView = isInOrNearViewport(rect);
        if (inView) {
          seen.add(d);
        } else if (seen.has(d)) {
          d.open = false;
          seen.delete(d);
          anyClosed = true;
        }
      });

      WATCHED_PANEL_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (isInOrNearViewport(rect)) {
          seen.add(el);
        } else if (seen.has(el)) {
          seen.delete(el);
          anyClosed = true;
        }
      });

      if (anyClosed) {
        document.dispatchEvent(new CustomEvent(COLLAPSE_EVENT));
        scheduleResync();
      }
    };

    // `toggle` does not bubble, so it has to be captured. Marks a
    // freshly-opened element seen immediately, rather than waiting for the
    // next scroll tick — a reader who opens something and never scrolls
    // again should never see it close.
    const onToggle = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || el.tagName !== "DETAILS") return;
      if (el.open && isInOrNearViewport(el.getBoundingClientRect())) seen.add(el);
      scheduleResync();
    };
    document.addEventListener("toggle", onToggle, true);

    const off = subscribeScroll(sweep);

    // Images without intrinsic dimensions land after the first measure and
    // change a panel's height under it, which can be exactly what carries it
    // out of (or into) view without a scroll event firing.
    const onMediaLoad = (e) => {
      const t = e.target;
      if (t instanceof HTMLImageElement || t instanceof HTMLVideoElement) {
        scheduleResync();
        sweep();
      }
    };
    document.addEventListener("load", onMediaLoad, true);

    return () => {
      document.removeEventListener("toggle", onToggle, true);
      document.removeEventListener("load", onMediaLoad, true);
      window.clearTimeout(resyncTimer);
      off && off();
    };
  }, []);

  return null;
};

/** …subscribe to the collapse this rule triggers. */
export const onCollapse = (handler) => {
  document.addEventListener(COLLAPSE_EVENT, handler);
  return () => document.removeEventListener(COLLAPSE_EVENT, handler);
};
