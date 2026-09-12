import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { RouteLine } from "@/components/RouteLine";
import { SystemCoreFallback, ThreeSafe } from "@/components/three/Fallbacks";
import { track } from "@/lib/api";
import { useHeroEntrance } from "./hooks/useHeroEntrance";

const SystemCore = lazy(() => import("@/components/three/SystemCore"));

/* ============================== S01 — HERO ============================== */
export const Hero = ({ show3d }) => {
  const headRef = useRef(null);
  useHeroEntrance(headRef);

  // The diagram underneath is only a placeholder once the canvas is actually
  // painting over it — the canvas itself has a transparent background (by
  // design, so it can sit on this panel in either theme), which means the
  // diagram would otherwise stay visible forever *through* it, doubled up
  // with whatever the scene draws.
  //
  // Driven by the canvas's own onCreated, not a timer. SystemCore is a lazy
  // chunk, so any guessed delay races its download: too short on a slow line
  // and the diagram fades out before there is anything behind it, leaving an
  // empty panel.
  const [coreReady, setCoreReady] = useState(false);
  useEffect(() => {
    if (!show3d) setCoreReady(false);
  }, [show3d]);
  const handleCoreReady = useCallback(() => setCoreReady(true), []);
  // A scene can fail well after its first frame — a GPU context lost when a
  // laptop sleeps, a driver crash. Bringing the diagram back is what keeps
  // that from leaving a blank panel for the rest of the session.
  const handleCoreFailed = useCallback(() => setCoreReady(false), []);

  return (
    <section className="relative container-page pb-10 pt-[100px] lg:pb-14 lg:pt-[112px]" data-testid="home-hero-section">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal as="p" className="font-display text-[clamp(0.82rem,1vw,1.06rem)] font-semibold uppercase leading-[1.1] tracking-[0.08em]" testId="hero-kicker">
            <span className="sticker-orange">From ABC to ROI</span>
          </Reveal>
          <h1 ref={headRef} className="font-display mt-6 leading-[0.93] tracking-[-0.025em] text-[#232A2A] text-[clamp(2.55rem,11.5vw,3.6rem)] lg:leading-[0.9] lg:text-[clamp(3.75rem,5.7vw,5.3rem)]" data-testid="hero-headline">
            <span className="hero-line"><span>We Build Brand</span></span>
            <span className="hero-line">
              <span className="relative inline-block">
                Operating <span className="hl-marker">Systems</span><span className="accent-signal-text">.</span>
                <RouteLine d="M2,10 C 30,2 70,16 118,6" viewBox="0 0 120 14" strokeWidth={5} className="absolute -bottom-2 left-0 h-[14px] w-[70%]" start="top 95%" end="top 60%" />
              </span>
            </span>
          </h1>
          <Reveal delay={160}>
            <p className="font-editorial mt-7 max-w-[46ch] text-[clamp(1.25rem,1.7vw,1.65rem)] leading-[1.5] text-[#232A2A]/85" data-testid="hero-body">
              Your brand is a promise. Your business has to deliver it. We connect strategy, brand,
              technology and growth so the message, the experience and the way you work move in the same direction.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton to="/contact" className="btn-ink" hoverText="Good start." testId="hero-primary-cta" onClick={() => track("cta_primary_click", { cta: "start_a_conversation" })}>
              Start a Conversation <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton to="/how-we-work" className="btn-paper" testId="hero-secondary-cta" onClick={() => track("method_explored", { from: "hero" })}>
              See How It Works
            </MagneticButton>
          </Reveal>
          <Reveal delay={320} as="p" className="font-accent mt-6 text-[18px] text-[#232A2A]/70" testId="hero-microcopy">
            Bring the brief. Or bring the problem. <span className="accent-orange-text font-semibold">We can start with either.</span>
          </Reveal>
        </div>

        <div className="lg:col-span-6">
          <Reveal delay={200}>
            {/* Widened from col-span-5 and given a shorter aspect ratio (was
                4/4.6) so SystemCore's own auto-fit — which scales the scene to
                88% of this panel's rendered size, see SceneInner in
                SystemCore.js — has visibly more room to fill. A real <Link>,
                not a click handler on a div: the diagram has no text of its
                own, so the accessible name has to come from the link itself. */}
            <Link
              to="/network"
              onClick={() => track("cta_primary_click", { cta: "hero_network_visual" })}
              aria-label="Explore the hiAnzy Network"
              className="group panel-dark relative block overflow-hidden"
              style={{ aspectRatio: "4/4" }}
              data-testid="hero-core-frame"
            >
              {/* The diagram paints first — same layering .motif-frame uses for its
                  deck scenes — and the canvas fades in on top once it is truly
                  ready, instead of popping in over what had been an empty frame.
                  Once that fade has had time to land, the diagram is hidden
                  outright: the canvas is transparent by design, so leaving the
                  diagram mounted underneath forever would let it show through
                  every gap in the scene, doubled up with whatever draws there. */}
              <div className="absolute inset-0">
                {/* absolute inset-0, not a bare div: SystemCoreFallback sizes
                    itself with h-full, which resolves against its parent — a
                    plain wrapper would collapse it to its own square aspect
                    ratio instead of filling the panel. aria-hidden once the
                    canvas is up so the retired diagram's label does not linger
                    in the accessibility tree behind the live scene. */}
                <div
                  className={`absolute inset-0 ${coreReady ? "hero-core-fallback-out" : ""}`}
                  aria-hidden={coreReady ? "true" : undefined}
                >
                  <SystemCoreFallback />
                </div>
                {show3d && (
                  <ThreeSafe fallback={null} onError={handleCoreFailed}>
                    <Suspense fallback={null}>
                      <div className="absolute inset-0 hero-core-fade-in">
                        <SystemCore onReady={handleCoreReady} />
                      </div>
                    </Suspense>
                  </ThreeSafe>
                )}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4" aria-hidden="true">
                <span className="sys-chip text-[#F7F5EE]/75">THE CONNECTED SYSTEM</span>
                <span className="sys-chip accent-orange-text">ABC → ROI</span>
              </div>
              <span
                className="sys-chip pointer-events-none absolute bottom-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#F7F5EE]/30 bg-[#1D2424]/70 px-3 py-1.5 text-[#F7F5EE]/85 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden="true"
              >
                Explore the Network <ArrowRight size={12} />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
