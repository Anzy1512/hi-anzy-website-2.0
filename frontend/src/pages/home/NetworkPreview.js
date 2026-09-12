import React, { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MagneticButton } from "@/components/MagneticButton";
import { Reveal } from "@/components/Reveal";
import { ConstellationFallback, ThreeSafe } from "@/components/three/Fallbacks";
import { track } from "@/lib/api";
import { NETWORK_CATEGORIES_HOME, NETWORK_SUBCATS } from "@/data/content";

const Constellation = lazy(() => import("@/components/three/Constellation"));

const categoryName = value => value === "AI" || value === "PR" ? value : value[0] + value.slice(1).toLowerCase();

/* ============================ S08 — NETWORK ============================ */
export const NetworkPreview = ({ show3d }) => {
  const [activeCat, setActiveCat] = useState(null);
  return (
    <section className="bg-[#1D2424] section-pad" data-testid="home-network-section">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading dark kicker="THE NETWORK" title={<>The team changes. The accountability doesn&rsquo;t.</>} testId="network-heading" />
            <Reveal delay={140} as="p" className="mt-6 max-w-md text-[17px] leading-[1.6] text-[#F7F5EE]/78">
              hiAnzy combines a core strategic layer with a wider network of specialists, creators,
              technologists, producers, media partners, venues and operators. The problem decides the roster.
            </Reveal>
            <div className="mt-7 flex flex-wrap gap-2" data-testid="network-category-chips">
              {NETWORK_CATEGORIES_HOME.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseEnter={() => setActiveCat(c)}
                  onFocus={() => setActiveCat(c)}
                  onMouseLeave={() => setActiveCat(null)}
                  onBlur={() => setActiveCat(null)}
                  onClick={() => { setActiveCat(c); track("network_category_selected", { category: c, from: "home" }); }}
                  aria-pressed={activeCat === c}
                  data-testid={`network-chip-${c.toLowerCase()}`}
                  className={`sys-chip rounded-full border px-3 py-1.5 transition-colors ${activeCat === c ? "border-[#F19020] bg-[#F19020] text-[#232A2A]" : "border-[#F7F5EE]/25 text-[#F7F5EE]/75 hover:border-[#F19020]/70"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-4 min-h-12 text-[14px] leading-relaxed text-[#F7F5EE]/75" aria-live="polite" data-testid="network-specialism-preview">
              {activeCat ? (NETWORK_SUBCATS[categoryName(activeCat)] || []).join(" · ") : "Select a discipline to reveal its specialist connections."}
            </p>
            <Reveal delay={200} className="mt-8">
              <MagneticButton to="/network" className="btn-orange" hoverText="Meet the minds." testId="network-cta">
                Explore the Network <ArrowRight size={15} />
              </MagneticButton>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            {/* The teaser diagram used to be inert — a button beside it did
                the only linking. The diagram is the more obvious click target,
                so it now leads to the same place: the real, full galaxy on
                /network. */}
            <Link
              to="/network"
              className="group relative block overflow-hidden rounded-[18px] border border-[#F7F5EE]/12 transition-colors hover:border-[#F19020]/60"
              style={{ aspectRatio: "16/10" }}
              aria-label="Explore the full network constellation"
              data-testid="network-teaser-link"
              onClick={() => track("network_category_selected", { category: "teaser_diagram", from: "home" })}
            >
              <div className="absolute inset-0">
                {show3d ? (
                  <ThreeSafe fallback={<ConstellationFallback categories={NETWORK_CATEGORIES_HOME.map((c) => categoryName(c))} />}>
                    <Suspense fallback={<ConstellationFallback categories={NETWORK_CATEGORIES_HOME.map((c) => categoryName(c))} />}>
                      <Constellation categories={NETWORK_CATEGORIES_HOME.map((c) => categoryName(c))} active={activeCat ? categoryName(activeCat) : null} subs={NETWORK_SUBCATS} />
                    </Suspense>
                  </ThreeSafe>
                ) : (
                  <ConstellationFallback categories={NETWORK_CATEGORIES_HOME.map((c) => categoryName(c))} />
                )}
              </div>
              <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="sys-chip inline-flex items-center gap-1.5 rounded-full border border-[#F19020]/60 bg-[#1D2424]/85 px-3 py-1.5 text-[#F7F5EE]/90 backdrop-blur-sm">
                  Open the full network <ArrowRight size={12} />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
