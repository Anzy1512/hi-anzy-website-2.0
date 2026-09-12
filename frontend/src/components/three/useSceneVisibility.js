import { useEffect, useRef, useState } from "react";

/**
 * Gates a WebGL scene's render loop on whether it can actually be seen.
 *
 * Measured before this existed: on the home page, scrolling 11,500px away from
 * the hero scene changed total GPU draw calls by 0.3% — from ~20,230 per two
 * seconds to ~20,160. Every scene rendered at full rate whether or not it was
 * on screen, because the browser only throttles rAF for a hidden *tab*, never
 * for an element that has scrolled out of view. Two of the three scenes on that
 * page were doing roughly 10,000 draw calls a second into nothing.
 *
 * Usage is deliberately two lines at each call site:
 *
 *   const { ref, active } = useSceneVisibility();
 *   <div ref={ref}><Canvas frameloop={active ? "always" : "never"}>
 *
 * Design notes that matter:
 *
 * - `active` starts true. A scene below the fold therefore renders a frame or
 *   two before the observer corrects it, which is the right trade: a couple of
 *   wasted frames costs nothing, whereas starting false risks a blank canvas
 *   if the observer is slow to report, and `frameloop="never"` renders nothing
 *   at all until something advances it.
 *
 * - The margin is generous on purpose. THREE's clock keeps advancing while the
 *   loop is stopped, so a paused scene resumes at a different phase of its own
 *   animation than where it left off. Resuming well before the scene is
 *   visible means that discontinuity happens off screen, and by the time the
 *   reader can see it the motion is already continuous. A tight margin would
 *   make the jump visible at the moment of entry, which is worse than the
 *   waste this is fixing.
 *
 * - Tab visibility is included even though browsers already throttle rAF in
 *   background tabs. The throttle is a heuristic that varies by browser and by
 *   power state; stopping the loop outright is explicit and free.
 */
export const useSceneVisibility = ({ rootMargin = "400px" } = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // No IntersectionObserver (very old browser): leave the scene running
    // rather than risk never starting it.
    if (typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        if (e.isIntersecting) {
          setInView(true);
          return;
        }
        /**
         * Only trust a negative once the element actually has a size.
         *
         * This guard is not defensive padding — without it the feature is
         * broken. The observer's first callback fires with the element's state
         * at observe time, and a freshly mounted canvas has not been laid out
         * yet, so it reports 0×0 and "not intersecting". Acting on that pauses
         * a scene that is genuinely on screen, and because the element then
         * gains its size *while already inside* the root bounds, no further
         * threshold is ever crossed and no second callback arrives. The scene
         * stays frozen for the rest of the visit.
         *
         * Observed exactly that on /insights: the field sat visible at the top
         * of the page rendering nothing, and only came alive after scrolling
         * away and back forced a real crossing.
         */
        const r = e.boundingClientRect;
        if (r.width > 0 && r.height > 0) setInView(false);
      },
      { rootMargin }
    );
    io.observe(el);

    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [rootMargin]);

  return { ref, active: inView && tabVisible };
};

export default useSceneVisibility;
