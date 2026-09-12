import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Seo } from "@/components/Seo";
import { ClientMarquee } from "@/components/ClientMarquee";
import { Reveal } from "@/components/Reveal";
import { CardCarousel } from "@/components/CardCarousel";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { CaseAnatomy } from "@/components/CaseAnatomy";
import { OrbitSection } from "@/components/OrbitSection";
import { onCollapse } from "@/components/CollapseOnScroll";
import { useRevealObserver } from "@/lib/motion";
import { getCaseStudies, getCaseStudy, track, API } from "@/lib/api";
import { PunPop } from "@/components/PunPop";
import { abs } from "@/lib/absoluteUrl";
import { CircularCarousel } from "@/components/ui/circular-carousel";
import { glyphForGroup } from "@/components/deck/InfographicGlyphs";
import { PortfolioWallInfographic } from "@/components/PortfolioWallInfographic";
import { CaseGraphic, CASE_VISUALS } from "@/pages/home/ConnectedStory";
import axios from "axios";

/**
 * One line per portfolio category, for the sticker in the deck's side gutter.
 * Each is about the specific discipline the category's infographic already
 * diagrams — not a generic "great work!" filler — so the sticker earns its
 * place rather than just occupying space.
 */
const DECK_STICKER_LINE = {
  "brand-decks": "Convincing, then true — in that order.",
  packaging: "The pitch that has to survive shipping.",
  "web-development": "A funnel is just a promise, timed.",
  "e-commerce": "The sale that has to happen again.",
  "motion-graphics": "Twelve frames a second, on purpose.",
  "audio-production": "The parts nobody notices until they're wrong.",
  "social-media": "Reach is rented. Attention is earned.",
  "tvc-video-production": "Thirty seconds. No second take.",
};

const CASE_SECTIONS = [
  { key: "situation", label: "SITUATION" },
  { key: "gap", label: "GAP" },
  { key: "insight", label: "INSIGHT" },
  { key: "decision", label: "DECISION" },
  { key: "build", label: "BUILD" },
  { key: "result", label: "RESULT" },
  { key: "next", label: "WHAT HAPPENED NEXT" },
];

export default function Work() {
  const ref = useRevealObserver();
  const [cases, setCases] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({});
  useEffect(() => {
    getCaseStudies().then(setCases).catch(() => setError(true));
    axios.get(`${API}/portfolio`).then((r) => setPortfolio(r.data)).catch(() => setPortfolio([]));
  }, []);

  // An expanded case is the tallest thing on this page; leaving it open while
  // the reader scrolls away changes the page length under them.
  useEffect(() => onCollapse(() => setExpanded(null)), []);

  /** Expand a case in place — the card unfolds into the full story without leaving the page. */
  const toggleCase = (cs) => {
    if (expanded === cs.slug) {
      setExpanded(null);
      return;
    }
    setExpanded(cs.slug);
    track("case_expanded", { slug: cs.slug, from: "work_index" });
    if (!details[cs.slug]) {
      getCaseStudy(cs.slug).then((d) => setDetails((prev) => ({ ...prev, [cs.slug]: d }))).catch(() => {});
    }
    setTimeout(() => {
      const el = document.getElementById("work-expand-panel");
      if (!el) return;
      if (window.__lenis) window.__lenis.scrollTo(el, { offset: -104, duration: 0.9 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
      // No announce step needed: CollapseOnScroll now watches this panel by
      // id and only closes it once fully cleared from the viewport, so the
      // scroll-into-view above can never be mistaken for scrolling away.
    }, 150);
  };

  const expandedCase = cases && cases.find((cs) => cs.slug === expanded);

  // Keyed to `cases` alone, not rebuilt on every render: expanding a case or
  // loading the portfolio would otherwise hand Seo a fresh object and make it
  // rewrite the entire document head for content that has not changed.
  const jsonLd = useMemo(
    () =>
      cases && cases.length
        ? {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: cases.map((cs, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: cs.title,
              url: abs(`/work/${cs.slug}`),
            })),
          }
        : undefined,
    [cases]
  );

  return (
    <div ref={ref} className="pt-[84px]" data-testid="work-page">
      <Seo
        title="Work | Proof, With Context | hiAnzy"
        description="Case studies with business context: situation, gap, insight, decision, build, result, and what happened next."
        jsonLd={jsonLd}
      />
      <section className="container-page section-pad">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> WORK
        </Reveal>
        {/* The copy names the seven-part shape in a sentence; the diagram beside
            it shows the same seven, which is easier to hold than a list read
            aloud — and it takes a hero column that was empty. */}
        <div className="mt-5 grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <h1 className="font-display leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="work-h1">
                Proof has context<span className="accent-signal-text">.</span>
              </h1>
            </Reveal>
            {/* Used to open "No endless logo wall." — which a crawling client
                strip a few lines below would have flatly contradicted. The
                actual promise survives without that clause: not vanity
                numbers, not footnotes doing the work a real answer should. */}
            <Reveal delay={160} as="p" className="mt-7 max-w-[48ch] font-editorial text-[clamp(1.15rem,1.5vw,1.45rem)] leading-[1.45] text-[#232A2A]/85">
              Follow each project from the business situation to the decisions, the build and the reported results. The same structure makes it easier to understand what changed and how the work contributed.
            </Reveal>
            <Reveal delay={220} as="p" className="font-mono-sys mt-4 text-[13px] text-[#232A2A]/55">
              Each entry identifies whether hiAnzy delivered it directly, worked with collaborators or is sharing a network member&rsquo;s credential.
            </Reveal>
          </div>
          <Reveal delay={240} className="hidden lg:col-span-5 lg:block">
            <CaseAnatomy steps={CASE_SECTIONS} className="panel-paper p-6 sm:p-7" testId="work-case-anatomy" />
          </Reveal>
        </div>
        <div className="mt-12">
          <ClientMarquee />
        </div>
      </section>

      <section className="container-page section-pad-b" data-index-label="CASE STUDIES">
        {error && <p role="alert" className="panel-paper p-6 text-[15px] text-[#232A2A]/80" data-testid="work-error">The case studies could not be loaded. Refresh the page to try again, or <Link to="/contact" className="link-draw font-semibold">contact us</Link> about relevant work.</p>}
        {!cases && !error && (
          <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel-paper h-[260px] animate-pulse" />)}</div>
        )}
        {cases && (
          <div data-testid="work-case-grid">
            <CardCarousel label={`DRAG OR SCROLL · ${cases.length} CASE STUDIES`} testId="work-carousel">
              {cases.map((cs) => (
                <Link
                  key={cs.slug}
                  to={`/work/${cs.slug}`}
                  id={`case-${cs.slug}`}
                  onClick={(e) => { e.preventDefault(); toggleCase(cs); }}
                  aria-expanded={expanded === cs.slug}
                  data-testid={`work-index-card-${cs.slug}`}
                  className={`case-card group flex h-full w-[86vw] shrink-0 snap-start flex-col rounded-[18px] border bg-[#F7F5EE] p-7 sm:w-[420px] sm:p-8 lg:w-[440px] ${expanded === cs.slug ? "border-[#F19020]" : "border-[#232A2A]/15"}`}
                >
                  {CASE_VISUALS.some((visual) => visual.slug === cs.slug) && (
                    <div className="-mx-7 -mt-7 mb-6 overflow-hidden rounded-t-[18px] sm:-mx-8 sm:-mt-8">
                      <CaseGraphic visual={CASE_VISUALS.find((visual) => visual.slug === cs.slug)} index={CASE_VISUALS.findIndex((visual) => visual.slug === cs.slug)} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ProvenanceTag value={cs.provenance} />
                    <span className="sys-chip text-[#232A2A]/45">{cs.industry} · {cs.year}</span>
                  </div>
                  <h2 className="font-display mt-5 text-[clamp(1.8rem,2.4vw,2.25rem)] leading-[1.02] text-[#232A2A]">{cs.title}</h2>
                  <p className="sys-chip mt-3 text-[#232A2A]/55">{cs.client}</p>
                  <p className="mt-4 text-[17px] leading-[1.6] text-[#232A2A]/80">{cs.summary}</p>
                  <div className="mt-5 grid gap-2 border-t border-[#232A2A]/10 pt-5">
                    <p className="text-[15.5px] leading-[1.55] text-[#232A2A]/72"><span className="font-mono-sys text-[12.5px] accent-signal-text">GAP: </span>{cs.gap.slice(0, 100)}…</p>
                    <p className="text-[15.5px] leading-[1.55] text-[#232A2A]/72"><span className="accent-orange-text font-mono-sys text-[12.5px] font-bold">RESULT: </span>{cs.result.slice(0, 100)}…</p>
                  </div>
                  <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-semibold text-[#232A2A]">
                    {expanded === cs.slug ? "Close case" : "Read the full case"}
                    <ArrowRight size={14} className={`transition-transform ${expanded === cs.slug ? "rotate-90" : "group-hover:translate-x-1"}`} />
                  </span>
                </Link>
              ))}
            </CardCarousel>

            {/* In-place case story — unfolds beneath the carousel, no page
                change. Pulled out of the per-card loop (it used to be a
                sibling of each card, spanning the grid via lg:col-span-2 —
                a trick that only makes sense in a grid) so there is exactly
                one of these regardless of which card opened it. */}
            <AnimatePresence initial={false}>
              {expandedCase && (
                <motion.div
                  key={`${expandedCase.slug}-panel`}
                  id="work-expand-panel"
                  className="mt-6"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                  data-testid={`work-expand-panel-${expandedCase.slug}`}
                >
                  <article className="rounded-[18px] border border-[#F19020]/50 bg-[#EFEAD8] p-7 sm:p-9">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <ProvenanceTag value={expandedCase.provenance} />
                        <span className="sys-chip text-[#232A2A]/50">{expandedCase.client} · {expandedCase.industry} · {expandedCase.year}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded(null)}
                        className="sys-chip inline-flex items-center gap-1.5 rounded-full border border-[#232A2A]/25 px-3 py-1.5 text-[#232A2A]/70 transition-colors hover:border-[#E54A25] hover:text-[#E54A25]"
                        data-testid={`work-expand-close-${expandedCase.slug}`}
                      >
                        CLOSE <X size={13} />
                      </button>
                    </div>
                    <h3 className="font-display mt-4 leading-[0.95] text-[#232A2A] text-[clamp(2rem,3.4vw,3.1rem)]">{expandedCase.title}</h3>

                    {!details[expandedCase.slug] && (
                      <div className="mt-8 space-y-4">{Array.from({ length: 3 }).map((_, k) => <div key={k} className="panel-paper h-20 animate-pulse rounded-[14px]" />)}</div>
                    )}
                    {details[expandedCase.slug] && (
                      <>
                        <div className="mt-8 space-y-4">
                          {CASE_SECTIONS.map((s, k) => (
                            <section key={s.key} className={`grid gap-3 rounded-[14px] p-5 sm:grid-cols-12 sm:p-6 ${s.key === "result" ? "panel-dark" : "bg-[#F7F5EE]"}`} data-testid={`work-expand-${expandedCase.slug}-${s.key}`}>
                              <div className="sm:col-span-3">
                                <p className={`sys-chip flex items-center gap-2 ${s.key === "result" ? "accent-orange-text" : "text-[#232A2A]/55"}`}>
                                  {s.key === "gap" && <span className="red-bar" />}
                                  {String(k + 1).padStart(2, "0")} {s.label}
                                </p>
                              </div>
                              <p className={`text-[16.5px] leading-[1.6] sm:col-span-9 ${s.key === "result" ? "text-[#F7F5EE]/88" : "text-[#232A2A]/85"}`}>{details[expandedCase.slug][s.key]}</p>
                            </section>
                          ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {(details[expandedCase.slug].services || []).map((s) => (
                            <span key={s} className="sys-chip rounded-full border border-[#F19020]/70 px-3 py-1 text-[#232A2A]/75">{s}</span>
                          ))}
                        </div>
                        {details[expandedCase.slug].metricEvidence && (
                          <p className="font-mono-sys mt-5 text-[12.5px] leading-relaxed text-[#232A2A]/55">{details[expandedCase.slug].metricEvidence}</p>
                        )}
                      </>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#232A2A]/12 pt-6">
                      <Link to="/contact" className="btn-ink" data-testid={`work-expand-cta-${expandedCase.slug}`} onClick={() => track("cta_primary_click", { cta: "work_expand", slug: expandedCase.slug })}>
                        Start a Conversation <ArrowRight size={15} />
                      </Link>
                      <Link to={`/work/${expandedCase.slug}`} className="link-draw text-[13.5px] font-semibold text-[#232A2A]/70" data-testid={`work-expand-full-link-${expandedCase.slug}`} onClick={() => track("case_opened", { slug: expandedCase.slug, from: "expand_panel" })}>
                        Open dedicated case page
                      </Link>
                    </div>
                  </article>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <p className="font-mono-sys mt-8 text-[12.5px] text-[#232A2A]/50">Metrics are only published when the evidence supports them. Everything else we will happily show you in a conversation.</p>
        <div className="mt-8 flex justify-end pr-[6%]">
          <PunPop text="Proof beats promise. Every time." rot={2} variant="dark" testId="pun-work" />
        </div>
      </section>

      <OrbitSection />

      <section id="portfolio-wall" className="container-page section-pad-b" data-index-label="PORTFOLIO ARCHIVE">
        {/* ============ THE PORTFOLIO WALL — migrated from the deck ============ */}
        <div data-testid="work-portfolio-wall">
          <div className="portfolio-wall-intro flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
                <span className="inline-block h-[3px] w-8 rounded-full bg-[#F19020]" /> THE PORTFOLIO WALL
              </Reveal>
              <Reveal delay={80}>
                <h2 className="font-display mt-4 leading-[0.95] text-[clamp(2.2rem,4.5vw,4.2rem)] text-[#232A2A]">Shipped. Across the whole system.</h2>
              </Reveal>
            </div>
            <Reveal delay={140} as="p" className="font-editorial max-w-[38ch] text-[17px] italic leading-[1.5] text-[#232A2A]/70">
              Brand decks, packaging, web builds, commerce, motion, audio, social and film, delivered by hiAnzy and collaborator studios in the network. Credited honestly, as always.
            </Reveal>
          </div>

          {portfolio && portfolio.length > 0 && (
            <div className="portfolio-wall-overview mt-10" data-testid="portfolio-wall-overview">
              <div className="portfolio-wall-overview__copy">
                <p className="sys-chip accent-orange-text">ONE ARCHIVE · MANY SPECIALISMS</p>
                <p className="font-editorial mt-3 max-w-[48ch] text-[17px] leading-[1.45] text-[#F7F5EE]/82">
                  Each discipline is a different way to move the brief forward. The small context tags tell you what each one is there to prove, when it is useful and which signal to look for in the work.
                </p>
                <div className="portfolio-wall-overview__stats" aria-label="Portfolio totals">
                  <span><strong>{portfolio.length}</strong> disciplines</span>
                  <span><strong>{portfolio.reduce((total, group) => total + group.items.length, 0)}</strong> projects</span>
                  <span><strong>{portfolio.reduce((total, group) => total + group.items.filter((item) => typeof item !== "string" && item.url).length, 0)}</strong> live links</span>
                </div>
              </div>
              <PortfolioWallInfographic
                slug="overview"
                category="Portfolio"
                count={portfolio.reduce((total, group) => total + group.items.length, 0)}
                overview
              />
            </div>
          )}

          {!portfolio && <div className="mt-10 grid gap-5 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel-paper h-[150px] animate-pulse" />)}</div>}

          {/* One orbital deck per category, stacked vertically. Replaces the
              chip-wall: the same projects and the same links, but each
              category now reads as its own body of work rather than as a
              cloud of tags. Every deck carries the infographic for what that
              discipline actually measures. Autoplay is gated on visibility,
              so only the deck on screen is moving. */}
          {portfolio && portfolio.length > 0 && (
            <div className="mt-12" data-testid="portfolio-decks">
              {portfolio.map((g, gi) => {
                const Glyph = glyphForGroup(g.slug);
                const items = g.items.map((raw) => {
                  const it = typeof raw === "string" ? { name: raw } : raw;
                  return {
                    id: `${g.slug}-${it.name}`,
                    title: it.name,
                    // No tag: the section heading directly above already names
                    // the category, and repeating it on all five visible cards
                    // was pure noise.
                    href: it.url || undefined,
                    external: true,
                    Glyph,
                  };
                });

                return (
                  <Reveal key={g.slug} delay={(gi % 2) * 80} className={gi === 0 ? "" : "mt-16"}>
                    <div className="portfolio-wall-group-shell" data-testid={`portfolio-group-${g.slug}`}>
                      <div className="portfolio-wall-group-main">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="block h-7 w-7 shrink-0 text-[#232A2A]" aria-hidden="true"><Glyph size={26} accent /></span>
                            <h3 className="font-display text-[clamp(1.5rem,2.4vw,2.2rem)] leading-none text-[#232A2A]">{g.category}</h3>
                          </div>
                          <span className="sys-chip shrink-0 rounded-full border border-[#232A2A]/25 px-3 py-1 text-[#232A2A]/74">{g.items.length} PROJECTS</span>
                        </div>
                        <div className="portfolio-wall-carousel-wrap mt-6">
                          <div className="portfolio-wall-carousel-meta" aria-hidden="true">
                            <span className="font-mono-sys">SELECT A PROJECT</span>
                            <span className="font-mono-sys">ORBIT / {String(g.items.length).padStart(2, "0")}</span>
                          </div>
                          <CircularCarousel
                            items={items}
                            label={`${g.category} projects`}
                            tone="paper"
                            className="mx-auto w-full max-w-2xl"
                            testId={`portfolio-deck-${g.slug}`}
                            onActivate={(item) => {
                              if (!item.href) return;
                              track("portfolio_item_opened", { group: g.slug, item: item.title });
                              window.open(item.href, "_blank", "noopener,noreferrer");
                            }}
                          />
                        </div>
                      </div>
                      <div className="portfolio-wall-group-aside">
                        <PortfolioWallInfographic slug={g.slug} category={g.category} count={g.items.length} />
                        {DECK_STICKER_LINE[g.slug] && (
                          <PunPop
                            text={DECK_STICKER_LINE[g.slug]}
                            icon={<Glyph size={22} accent />}
                            rot={gi % 2 === 0 ? -3 : 3}
                            variant={gi % 3 === 0 ? "orange" : "paper"}
                            className="portfolio-wall-sticker"
                            testId={`portfolio-sticker-${g.slug}`}
                          />
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
          <p className="font-mono-sys mt-10 text-[12.5px] text-[#232A2A]/50">Live links and walk-throughs shared in conversation. Some builds live behind client walls.</p>
        </div>
      </section>
    </div>
  );
}
