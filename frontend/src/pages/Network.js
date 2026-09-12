import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, ArrowRight, ChevronDown } from "lucide-react";
import { DISCIPLINES } from "@/data/disciplines";
import { PopIllustration } from "@/components/PopIllustration";
import { Seo } from "@/components/Seo";
import { PunPop } from "@/components/PunPop";
import { Reveal } from "@/components/Reveal";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { ConstellationFallback, ThreeSafe } from "@/components/three/Fallbacks";
import { useRevealObserver, useReducedMotion, webglAvailable, resyncScroll } from "@/lib/motion";
import { getNetwork, getNetworkCategories, getEcosystem, track } from "@/lib/api";
import { NETWORK_SUBCATS, ORBIT_CATEGORIES } from "@/data/content";
import { ORBIT_GLYPHS } from "@/components/deck/OrbitGlyphs";
import { CircularCarousel } from "@/components/ui/circular-carousel";

import { NextSteps } from "@/components/NextSteps";
import { CardCarousel } from "@/components/CardCarousel";
import { abs } from "@/lib/absoluteUrl";

const Constellation = lazy(() => import("@/components/three/Constellation"));

/** Same set the API returns, and the keys the sub-fans are looked up by. */
const NETWORK_CATEGORY_FALLBACK = Object.keys(NETWORK_SUBCATS);

/**
 * The four Orbit categories that describe *the network*, shaped for the deck.
 * Built Here and Built Together are omitted on purpose: they are client work
 * and belong to /work, where they already live.
 */
const NETWORK_ROSTER_KEYS = ["collaborator", "creator", "venue", "partner"];
/* Short tags rather than each category's full `descriptor`. "Media, production
   & strategic partners" truncates to "MEDIA, PRO…" in a card chip, which reads
   as a rendering fault; the full descriptor still appears on the category's own
   page. One word each is enough to separate four rosters. */
const ROSTER_TAG = {
  collaborator: "SPECIALISTS",
  creator: "CREATORS",
  venue: "VENUES",
  partner: "PARTNERS",
};
/**
 * `counts`: real per-category totals from /api/ecosystem, or null before
 * they've loaded — never a placeholder number. `null` count on a given key
 * just omits the stat rather than showing a fake "0" or "—" while the real
 * figure is still in flight.
 */
const buildNetworkRosters = (counts) =>
  ORBIT_CATEGORIES.filter((c) => NETWORK_ROSTER_KEYS.includes(c.key)).map((c) => {
    const n = counts?.[c.key];
    return {
      id: c.key,
      title: c.name,
      // Both sentences the category page itself carries: the short on-brand
      // tagline, then the fuller line written for its own <meta description>
      // — genuinely more to read here than the tagline alone, not invented.
      description: [c.copy, c.seoDescription].filter(Boolean).join(" "),
      tag: n ? `${n} ${ROSTER_TAG[c.key]}` : ROSTER_TAG[c.key],
      href: c.route,
      Glyph: ORBIT_GLYPHS[c.key],
    };
  });

const LEGEND = [
  { tag: "HI ANZY DIRECT", text: "Owned and delivered by the hiAnzy core layer." },
  { tag: "HI ANZY + COLLABORATOR", text: "hiAnzy led, specialists executed alongside." },
  { tag: "COLLABORATOR CREDENTIAL", text: "Independent track record of a network member." },
  { tag: "NETWORK ACCESS", text: "Relationships we can activate. Not client work." },
];

/* The directory is deliberately read as a set of focused sections. These
   short descriptions give each section a job before a visitor opens it. */
const SPECIALIST_SECTION_COPY = {
  Strategy: "Diagnosis, positioning and the decisions that set the work in motion.",
  Brand: "Identity and messaging that make the useful thing unmistakable.",
  Design: "Interfaces, packaging and systems that make the decision easy to act on.",
  Technology: "Web, commerce and integrations that turn the plan into a working system.",
  Automation: "Workflow and operations systems that remove repeat friction.",
  AI: "Practical AI systems shaped around a real business outcome.",
  Performance: "Paid, organic and conversion specialists who measure what moves.",
  Media: "Press and distribution relationships that help a good idea travel.",
  Creators: "Voices and makers who bring credibility, reach and cultural context.",
  Production: "Film, sound and production craft for work that has to ship beautifully.",
  Events: "Festival and campus relationships for moments that need a live audience.",
  Venues: "Hotels, clubs and large-format spaces where the experience can happen.",
  Experiences: "On-ground crews that turn a brief into a memorable physical moment.",
  PR: "Reputation, media placement and communications for the moments that matter.",
  Security: "Privacy and infrastructure readiness that protects the system as it grows.",
  Operations: "Fulfilment, logistics and the practical layer that keeps promises moving.",
};

const resourceSectionId = (category) => `network-resource-section-${String(category).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export default function Network() {
  const ref = useRevealObserver();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [show3d, setShow3d] = useState(false);
  const [apiCategories, setApiCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [resources, setResources] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [rosterCounts, setRosterCounts] = useState(null);
  const [openResourceCategory, setOpenResourceCategory] = useState(null);
  const lastTouchCategory = useRef(null);

  useEffect(() => {
    setShow3d(!reduced && webglAvailable());
  }, [reduced]);

  useEffect(() => {
    getEcosystem()
      .then((items) => {
        const counts = {};
        items.forEach((it) => { counts[it.category] = (counts[it.category] || 0) + 1; });
        setRosterCounts(counts);
      })
      .catch(() => {});
  }, []);

  const networkRosters = useMemo(() => buildNetworkRosters(rosterCounts), [rosterCounts]);

  useEffect(() => {
    getNetworkCategories().then(setApiCategories).catch(() => setApiCategories([]));
  }, []);

  /**
   * The constellation is the centre of this page, and it was wired to render
   * only when the categories request had returned something. A slow or failed
   * request therefore did not degrade it — it deleted it, leaving an empty
   * frame where the diagram should be. The local map holds the same category
   * set the API returns (its keys are what the sub-fans are looked up by), so
   * it stands in until the real list arrives.
   */
  const categories = apiCategories.length ? apiCategories : NETWORK_CATEGORY_FALLBACK;

  useEffect(() => {
    let current = true;
    setResources(null);
    setLoadError(false);
    getNetwork(active).then(data => { if (current) setResources(data); }).catch(() => { if (current) setLoadError(true); });
    return () => { current = false; };
  }, [active, retry]);

  const resourceSections = useMemo(() => {
    if (!resources) return [];
    const grouped = resources.reduce((acc, resource) => {
      const category = resource.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(resource);
      return acc;
    }, {});
    const order = [...categories, ...Object.keys(grouped)];
    return order.filter((category, index) => Object.prototype.hasOwnProperty.call(grouped, category) && order.indexOf(category) === index)
      .map((category) => [category, grouped[category]]);
  }, [resources, categories]);

  useEffect(() => {
    if (!resourceSections.length) {
      setOpenResourceCategory(null);
      return;
    }
    setOpenResourceCategory((current) => {
      if (current && resourceSections.some(([category]) => category === current)) return current;
      if (active && resourceSections.some(([category]) => category === active)) return active;
      return resourceSections[0][0];
    });
  }, [active, resourceSections]);

  const selectCategory = (c) => {
    lastTouchCategory.current = null;
    setActive(c);
    if (c) track("network_category_selected", { category: c, from: "network_page" });
  };

  const scrollToSpecialists = () => {
    const el = document.getElementById("network-specialists");
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -96, duration: 1.1 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Desktop click: select a category and bring its specialists into view. */
  const deepDive = (c) => {
    const next = active === c ? null : c;
    setActive(next);
    if (next) {
      track("network_deep_dive", { category: next, from: "constellation" });
      setTimeout(scrollToSpecialists, 350);
    }
  };

  /**
   * Touch is deliberately two-step: the first tap opens the cluster and its
   * sub-specialisms; tapping the same cluster again continues to the detailed
   * directory. This keeps a single tap exploratory instead of turning an
   * accidental touch into a page jump.
   */
  const touchDeepDive = (c) => {
    if (lastTouchCategory.current === c && active === c) {
      lastTouchCategory.current = null;
      track("network_deep_dive", { category: c, from: "constellation_second_tap" });
      setTimeout(scrollToSpecialists, 220);
      return;
    }
    lastTouchCategory.current = c;
    setActive(c);
    track("network_category_selected", { category: c, from: "constellation_first_tap" });
  };

  /* Full screen is an exploration chamber. Selecting a node there should
     reveal its branch fan in place; the specialist directory remains a
     separate, deliberate destination outside the chamber. */
  const fullscreenSelect = (c) => {
    lastTouchCategory.current = null;
    if (active !== c) setActive(c);
    track("network_category_selected", { category: c, from: "constellation_fullscreen" });
  };

  const fullscreenTouch = (c) => {
    if (lastTouchCategory.current === c && active === c) {
      track("network_deep_dive", { category: c, from: "constellation_fullscreen_second_tap" });
      return;
    }
    lastTouchCategory.current = c;
    if (active !== c) setActive(c);
    track("network_category_selected", { category: c, from: "constellation_fullscreen_first_tap" });
  };

  const subTotal = Object.values(NETWORK_SUBCATS).reduce((a, v) => a + v.length, 0);
  const allServices = Object.values(NETWORK_SUBCATS).flat();

  /** Fullscreen constellation — same frame aesthetics, expanded to the viewport. */
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return undefined;
    // Lock both elements — body alone still lets some browsers scroll the root.
    const prevBody = document.body.style.overflow;
    const prevRoot = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (window.__lenis) window.__lenis.stop();
    const onKey = (e) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevRoot;
      if (window.__lenis) window.__lenis.start();
      window.removeEventListener("keydown", onKey);
      // Document height changed while locked — re-measure or the progress bar
      // and any ScrollTriggers stay calibrated to the locked layout.
      resyncScroll();
    };
  }, [fullscreen]);

  // Built from a static import, so it never needs rebuilding — without the
  // memo, selecting a category or toggling fullscreen would rewrite the whole
  // document head via Seo's effect.
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "The hiAnzy Network",
      hasPart: DISCIPLINES.map((d) => ({
        "@type": "Service",
        name: d.name,
        serviceType: d.name,
        url: abs(`/network/${d.slug}`),
      })),
    }),
    []
  );

  return (
    <div ref={ref} className="pt-[84px]" data-testid="network-page">
      <Seo
        title="The hiAnzy Network | Strategists, Creators, Technologists, Operators"
        description="Explore the specialists, creators, venues and partners in the hiAnzy network. See each discipline and the relationship behind every profile."
        jsonLd={jsonLd}
      />
      <section className="bg-[#1D2424] pb-14 pt-16 lg:pt-24">
        <div className="container-page">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#F7F5EE]/55">
                <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> THE NETWORK
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-5 leading-[0.92] text-[#F7F5EE] text-[clamp(3rem,6.8vw,6rem)]" data-testid="network-h1">
                  The hiAnzy Network
                </h1>
              </Reveal>
              <Reveal delay={160} as="p" className="mt-6 max-w-[48ch] font-editorial text-[clamp(1.15rem,1.5vw,1.45rem)] leading-[1.45] text-[#F7F5EE]/85">
                The right team begins with the problem. Explore the expertise we bring together across strategy, design, technology and experiences, with each relationship explained.
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={220}>
                <div className="rounded-[18px] border border-[#F7F5EE]/14 bg-[#F7F5EE]/[0.04] p-6 sm:p-7" data-testid="network-hero-stats">
                  <p className="sys-chip accent-orange-text">NETWORK AT A GLANCE</p>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <div data-testid="network-stat-disciplines">
                      <p className="font-display text-[clamp(2.1rem,3.2vw,3rem)] leading-none text-[#F7F5EE]">{categories.length || 12}</p>
                      <p className="sys-chip mt-2 text-[#F7F5EE]/50">DISCIPLINES</p>
                    </div>
                    <div data-testid="network-stat-specialisms">
                      <p className="font-display text-[clamp(2.1rem,3.2vw,3rem)] leading-none text-[#F7F5EE]">{subTotal}</p>
                      <p className="sys-chip mt-2 text-[#F7F5EE]/50">SPECIALIST SKILLS</p>
                    </div>
                    <div data-testid="network-stat-tiers">
                      <p className="font-display text-[clamp(2.1rem,3.2vw,3rem)] leading-none text-[#F7F5EE]">{LEGEND.length}</p>
                      <p className="sys-chip mt-2 text-[#F7F5EE]/50">RELATIONSHIP TYPES</p>
                    </div>
                  </div>
                  <p className="font-mono-sys mt-5 border-t border-[#F7F5EE]/10 pt-4 text-[12px] leading-relaxed text-[#F7F5EE]/45">Assembled per problem. Never a fixed bench. Every relationship labelled honestly below.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <div
            className="network-constellation-stage relative mt-10 h-[380px] overflow-hidden rounded-[18px] border border-[#F7F5EE]/12 sm:h-[460px] lg:aspect-[16/9.5] lg:h-auto"
            data-testid="network-constellation-frame"
          >
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="sys-chip absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#F7F5EE]/30 bg-[#1D2424]/80 px-3.5 py-2 text-[#F7F5EE]/80 backdrop-blur-sm transition-colors hover:border-[#F19020] hover:text-[#F19020]"
              data-testid="network-fullscreen-toggle"
              aria-label="Expand constellation to full screen"
            >
              <Maximize2 size={13} /> FULL SCREEN
            </button>
            <div className="absolute inset-0">
              {show3d && categories.length > 0 ? (
                <ThreeSafe fallback={<ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={deepDive} onTouchTap={touchDeepDive} />}>
                  <Suspense fallback={<ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={deepDive} onTouchTap={touchDeepDive} />}>
                    <Constellation categories={categories} active={active} subs={NETWORK_SUBCATS} onSelect={deepDive} onTouchTap={touchDeepDive} />
                  </Suspense>
                </ThreeSafe>
              ) : (
                <ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={deepDive} onTouchTap={touchDeepDive} />
              )}
            </div>
            <div className={`network-touch-hint ${active ? "is-active" : ""}`} data-testid="network-touch-hint" aria-live="polite">
              <span className="font-mono-sys">TOUCH FLOW</span>
              <span>{active ? `Tap ${active} again to continue` : "Tap a node to inspect · tap again to continue"}</span>
            </div>
          </div>

          {/* Fullscreen constellation — portal above everything, same aesthetics */}
          {fullscreen && createPortal(
            <div className="network-constellation-stage fixed inset-0 z-[200] overflow-hidden bg-[#1D2424]" data-testid="network-constellation-fullscreen" role="dialog" aria-label="Network constellation, full screen">
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="sys-chip absolute right-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#F7F5EE]/30 bg-[#1D2424]/80 px-4 py-2.5 text-[#F7F5EE]/85 backdrop-blur-sm transition-colors hover:border-[#F19020] hover:text-[#F19020]"
                data-testid="network-fullscreen-exit"
                aria-label="Exit full screen"
              >
                <Minimize2 size={13} /> EXIT
              </button>
              <span className="sys-chip absolute left-5 top-5 z-20 text-[#F7F5EE]/50">THE <span className="brand-mark">hiAnzy</span> NETWORK · CONSTELLATION</span>
              <div className="absolute inset-0">
                {show3d && categories.length > 0 ? (
                  <ThreeSafe fallback={<ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={fullscreenSelect} onTouchTap={fullscreenTouch} />}>
                    <Suspense fallback={<ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={fullscreenSelect} onTouchTap={fullscreenTouch} />}>
                      <Constellation categories={categories} active={active} subs={NETWORK_SUBCATS} immersive onSelect={fullscreenSelect} onTouchTap={fullscreenTouch} />
                    </Suspense>
                  </ThreeSafe>
                ) : (
                  <ConstellationFallback categories={categories} subs={NETWORK_SUBCATS} active={active} onSelect={fullscreenSelect} onTouchTap={fullscreenTouch} />
                )}
              </div>
              <div className={`network-touch-hint ${active ? "is-active" : ""}`} data-testid="network-touch-hint-fullscreen" aria-live="polite">
                <span className="font-mono-sys">EXPLORE</span>
                <span>{active ? `${active} branches open · tap another discipline to explore` : "Tap a discipline to explore its branches"}</span>
              </div>
            </div>,
            document.body
          )}

          {/* The service map — every specialism in the room */}
          <div className="mt-6" data-testid="network-service-marquee">
            <p className="sys-chip text-[#F7F5EE]/75">THE SERVICE MAP · {subTotal} SPECIALISMS ACROSS {categories.length} DISCIPLINES</p>
            <div className="relative mt-3 overflow-hidden border-y border-[#F7F5EE]/12 py-3">
              <div className="marquee-track items-center gap-x-6" aria-hidden="true" style={{ animationDuration: "115s" }}>
                {[...allServices, ...allServices].map((s, i) => (
                  <React.Fragment key={`${s}-${i}`}>
                    <span className="font-display whitespace-nowrap text-[16px] font-semibold tracking-[0.04em] text-[#F7F5EE]/65 transition-colors hover:text-[#F19020]">{s}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[#F19020]/70" />
                  </React.Fragment>
                ))}
              </div>
              <ul className="sr-only">{allServices.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter network by category" data-testid="network-category-filter">
            <button type="button" onClick={() => selectCategory(null)} data-testid="network-filter-all" className={`sys-chip rounded-full border px-3.5 py-1.5 transition-colors ${!active ? "border-[#F19020] bg-[#F19020] text-[#232A2A]" : "border-[#F7F5EE]/25 text-[#F7F5EE]/75 hover:border-[#F19020]/70"}`}>
              ALL
            </button>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => selectCategory(c)} data-testid={`network-filter-${c.toLowerCase()}`} className={`sys-chip rounded-full border px-3.5 py-1.5 transition-colors ${active === c ? "border-[#F19020] bg-[#F19020] text-[#232A2A]" : "border-[#F7F5EE]/25 text-[#F7F5EE]/75 hover:border-[#F19020]/70"}`}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── The sixteen disciplines, each explained on its own page ─────── */}
      <section className="container-page section-pad" data-testid="network-disciplines">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> THE DISCIPLINES, EXPLAINED
        </Reveal>
        <Reveal delay={70}>
          <h2 className="font-display mt-4 max-w-3xl leading-[1.0] text-[#232A2A] text-[clamp(2rem,3.6vw,3.2rem)]">
            Find the expertise your project needs.
          </h2>
        </Reveal>
        <div className="flex items-end justify-between gap-10">
          <Reveal delay={130} as="p" className="mt-4 max-w-[62ch] text-[17px] leading-[1.6] text-[#232A2A]/80">
            Start with the challenge that sounds familiar. Each discipline explains the work, the situations it helps with and the capabilities available through the network.
          </Reveal>
          <PopIllustration
            src="/brand/pop-camera-duo.png"
            width={165}
            rotate={2}
            drift={20}
            className="-mb-8 shrink-0"
            testId="pop-network"
          />
        </div>

        <div className="mt-9" data-testid="discipline-grid">
          <CardCarousel label={`${DISCIPLINES.length} DISCIPLINES · DRAG TO EXPLORE`} testId="discipline-carousel" autoPlay>
            {DISCIPLINES.map((d, i) => (
              <Link
                key={d.slug}
                to={`/network/${d.slug}`}
                onClick={() => track("discipline_opened", { discipline: d.slug, from: "network" })}
                data-testid={`discipline-card-${d.slug}`}
                className="cap-tile group flex min-h-[250px] w-[78vw] shrink-0 snap-start flex-col rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 transition-colors hover:border-[#F19020] sm:w-[320px] lg:w-[336px]"
              >
                <span className="sys-chip inline-flex w-fit items-center rounded-full border border-[#F19020]/50 px-2.5 py-1 text-[#232A2A]/55">
                  {String(i + 1).padStart(2, "0")} · {d.category.toUpperCase()}
                </span>
                <span className="font-display mt-4 text-[26px] leading-none text-[#232A2A]">{d.name}</span>
                <span className="mt-3 text-[15.5px] leading-[1.55] text-[#232A2A]/80">{d.hook}</span>
                <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-semibold text-[#232A2A]">
                  Explore this discipline
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </CardCarousel>
        </div>
      </section>

      {/* ── The network's four rosters, as an orbital deck ──────────────────
          These four Orbit categories are network content — collaborators,
          creators, venues, partners — but until now they were only reachable
          from the Work page's Orbit section. The two work categories (Built
          Here / Built Together) deliberately stay there; this is the "right
          category in the right section" split. */}
      <section className="container-page section-pad" data-index-label="THE ROSTERS" data-testid="network-orbit-deck-section">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> THE ROSTERS
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-display mt-4 max-w-3xl leading-[1.0] text-[#232A2A] text-[clamp(2rem,3.6vw,3.2rem)]">
            Four ways the network shows up.
          </h2>
        </Reveal>
        <Reveal delay={140} as="p" className="mt-4 max-w-[52ch] text-[16.5px] leading-[1.58] text-[#232A2A]/78">
          Browse specialists, creators, venues and partners. Each directory explains the relationship and the role it can play in a project.
        </Reveal>
        <Reveal delay={200} className="mt-10">
          {/* Capped width, centred: at the section's full ~1200px content
              width, four cards fanned on an ellipse left roughly 300px of
              bare ground on each side — the deck read as lost in the page
              rather than composed on it. */}
          <CircularCarousel
            items={networkRosters}
            label="Network rosters"
            tone="paper"
            className="mx-auto w-full max-w-2xl"
            testId="network-orbit-deck"
            onActivate={(item) => {
              track("orbit_category_opened", { category: item.id, from: "network_rosters" });
              navigate(item.href);
            }}
          />
        </Reveal>
      </section>

      <section id="network-specialists" className="container-page section-pad" data-index-label="THE SPECIALISTS">
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="network-legend">
          {LEGEND.map((l) => (
            <div key={l.tag} className="rounded-[14px] border border-[#232A2A]/14 bg-[#F7F5EE]/60 p-4">
              <ProvenanceTag value={l.tag} />
              <p className="mt-2.5 text-[15px] leading-[1.5] text-[#232A2A]/70">{l.text}</p>
            </div>
          ))}
        </div>

        {!resources && !loadError && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="panel-paper h-[190px] animate-pulse" />)}</div>}
        {loadError && <div role="alert" className="panel-paper p-6"><p>We could not load this content.</p><button type="button" className="btn-ink mt-4" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
        {resources && resources.length === 0 && <p className="panel-paper p-6 text-[15px] text-[#232A2A]/80" data-testid="network-empty">There are no public profiles in this category yet. Explore another discipline or contact us about the expertise you need.</p>}
        {resources && resources.length > 0 && (
          <div className="network-resource-directory" data-testid="network-resource-directory">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <p className="font-mono-sys max-w-[58ch] text-[12.5px] leading-relaxed text-[#232A2A]/60">
                Choose a discipline to inspect its people and capabilities. Opening a new section closes the previous one, so the directory stays easy to read.
              </p>
              <span className="sys-chip text-[#232A2A]/45">{resourceSections.length} SECTIONS · {resources.length} PROFILES</span>
            </div>

            <div className="grid gap-2.5" data-testid="network-resource-sections">
              {resourceSections.map(([category, sectionResources], sectionIndex) => {
                const isOpen = openResourceCategory === category;
                const panelId = resourceSectionId(category);
                const sectionCopy = SPECIALIST_SECTION_COPY[category] || "Specialists and partners assembled around the problem at hand.";
                return (
                  <section key={category} className={`network-resource-section ${isOpen ? "is-open" : ""}`} data-testid={`network-resource-section-${category.toLowerCase()}`}>
                    <button
                      type="button"
                      className="network-resource-section__trigger"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenResourceCategory((current) => current === category ? null : category)}
                    >
                      <span className="network-resource-section__index font-mono-sys">{String(sectionIndex + 1).padStart(2, "0")}</span>
                      <span className="network-resource-section__heading">
                        <span className="network-resource-section__title font-display">{category}</span>
                        <span className="network-resource-section__summary">{sectionCopy}</span>
                      </span>
                      <span className="network-resource-section__count sys-chip">{sectionResources.length} {sectionResources.length === 1 ? "PROFILE" : "PROFILES"}</span>
                      <ChevronDown aria-hidden="true" className="network-resource-section__icon" size={19} strokeWidth={1.7} />
                    </button>

                    {isOpen && (
                      <div id={panelId} className="network-resource-section__body">
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="network-resource-grid">
                          {sectionResources.map((r, i) => (
                            <Reveal key={r.slug} delay={(i % 3) * 70}>
                              <article tabIndex={0} onClick={() => track("network_profile_opened", { slug: r.slug })} data-testid={`network-card-${r.slug}`} className="cap-tile h-full cursor-default rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6">
                                <div className="flex items-start justify-between gap-3">
                                  <h2 className="font-display text-2xl leading-none text-[#232A2A]">{r.name}</h2>
                                  <span className="sys-chip shrink-0 text-[#232A2A]/45">{r.category.toUpperCase()}</span>
                                </div>
                                <div className="mt-3">
                                  <ProvenanceTag value={r.relationshipType} />
                                </div>
                                <p className="sys-chip mt-3 text-[#232A2A]/50">{r.geography}</p>
                                <ul className="mt-3 flex flex-wrap gap-1.5">
                                  {(r.capabilities || []).slice(0, 6).map((cap) => (
                                    <li key={cap} className="sys-chip rounded-full border border-[#232A2A]/20 px-2.5 py-0.5 text-[#232A2A]/78">{cap}</li>
                                  ))}
                                </ul>
                                {r.note && <p className="font-mono-sys mt-3 text-[12px] leading-relaxed text-[#232A2A]/55">{r.note}</p>}
                                <p className="sys-chip mt-3 text-[#232A2A]/35">VERIFIED {r.lastVerified}</p>
                              </article>
                            </Reveal>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
        <p className="font-mono-sys mt-8 max-w-2xl text-[12.5px] leading-relaxed text-[#232A2A]/55">
          A network relationship is not the same thing as hiAnzy-delivered client work, which is why every card says which one it is.
        </p>
      </section>
      <div className="container-page mb-8">
        <div className="mt-8 flex justify-end pr-[8%]">
          <PunPop text="It's not who you know. It's who you can activate." rot={-1.5} variant="orange" testId="pun-network" />
        </div>
      </div>
      <NextSteps from="/network" />
    </div>
  );
}
