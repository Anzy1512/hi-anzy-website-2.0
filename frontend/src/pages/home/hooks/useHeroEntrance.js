import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/** Staggers the hero headline's `.hero-line > span` children up and in on
 * mount. Split out from Hero.js since it is a self-contained entrance effect
 * with no dependency on the rest of the section. */
export const useHeroEntrance = (headRef) => {
  useEffect(() => {
    if (prefersReducedMotion() || !headRef.current) return undefined;
    const spans = headRef.current.querySelectorAll(".hero-line > span");
    const tween = gsap.fromTo(
      spans,
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.15 }
    );
    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
