import { CharacterQuote } from "@/components/CharacterQuote";
import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { abs } from "@/lib/absoluteUrl";
import { NotesSubscribe } from "@/components/NotesSubscribe";
import { LensFocus } from "@/components/deck/LensFocus";
import { Reveal } from "@/components/Reveal";
import { CardCarousel } from "@/components/CardCarousel";
import { SignalFieldFallback, ThreeSafe } from "@/components/three/Fallbacks";
import { useRevealObserver, useReducedMotion, webglAvailable } from "@/lib/motion";
import { getInsights } from "@/lib/api";
import { INSIGHT_CATEGORIES, INSIGHT_TOPICS } from "@/data/content";
import { NextSteps } from "@/components/NextSteps";
import { isKnowledge, countByTopic, filterInsights } from "@/lib/knowledge";

const SignalField = lazy(() => import("@/components/three/SignalField"));

const chipClass = (active) =>
  `sys-chip rounded-full border px-3.5 py-1.5 transition-colors ${active ? "border-[#232A2A] bg-[#232A2A] text-[#F7F5EE]" : "border-[#232A2A]/30 text-[#232A2A]/70 hover:border-[#232A2A]"}`;

const testSlug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");

/**
 * Insights: the editorial notes and, since the knowledge encyclopedia landed,
 * the reference layer beneath them.
 *
 * One fetch for the whole published list (bodies excluded server-side), then
 * category and topic filters applied here and kept in the URL, so a search
 * result, a topic chip on an article, or a pasted link all open the same
 * filtered view. Two filters, two rows of chips: the categories are the
 * editorial series the notes are written in; the topics are the knowledge
 * taxonomy the encyclopedia is organised by. An article can sit in one series
 * and several topics.
 */
export default function Insights() {
  const ref = useRevealObserver();
  const reduced = useReducedMotion();
  const [show3d, setShow3d] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || null;
  const activeTopic = searchParams.get("topic") || null;
  const [posts, setPosts] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  const setFilter = (next) => {
    const params = {};
    if (next.category) params.category = next.category;
    if (next.topic) params.topic = next.topic;
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    setShow3d(!reduced && webglAvailable());
  }, [reduced]);

  useEffect(() => {
    let current = true;
    setPosts(null);
    setLoadError(false);
    getInsights().then(data => { if (current) setPosts(Array.isArray(data) ? data : []); }).catch(() => { if (current) setLoadError(true); });
    return () => { current = false; };
  }, [retry]);

  const visible = useMemo(() => filterInsights(posts || [], { category: activeCategory, topic: activeTopic }), [posts, activeCategory, activeTopic]);
  const knowledge = useMemo(() => visible.filter(isKnowledge), [visible]);
  const notes = useMemo(() => visible.filter((p) => !isKnowledge(p)), [visible]);
  const topicCounts = useMemo(() => countByTopic(posts || []), [posts]);
  const filtered = Boolean(activeCategory || activeTopic);

  const jsonLd = useMemo(() => {
    const entries = (posts || []).filter(isKnowledge);
    if (!entries.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "The hiAnzy Knowledge Encyclopedia",
      description: "Definitions, frameworks and decision criteria across strategy, brand, marketing, digital, technology, creative, operations and experience.",
      hasPart: entries.map((p) => ({ "@type": "Article", headline: p.title, url: abs(`/insights/${p.slug}`), about: (p.topics || []).map((t) => ({ "@type": "Thing", name: t })) })),
    };
  }, [posts]);

  return (
    <div ref={ref} className="pt-[84px]" data-testid="insights-page">
      <Seo title="Notes From the Work | hiAnzy Insights" description="Practical notes and an evergreen knowledge encyclopedia on business systems, brand clarity, marketing, technology and growth. Find a useful question to bring into your next decision." jsonLd={jsonLd} />
      <section className="container-page section-pad relative">
       <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> INSIGHTS
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-5 leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="insights-h1">
            Notes From the Work
          </h1>
        </Reveal>
        <Reveal delay={160} as="p" className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-[#232A2A]/85">Ideas and observations across business, brand, technology and growth, with a knowledge encyclopedia underneath them for the concepts the work depends on. Start with a subject below and take a useful question back to your team.</Reveal>
        </div>
        <div className="hidden lg:col-span-5 lg:block">
          <LensFocus />
        </div>
       </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter insights by category" data-testid="insights-category-filter">
          <button type="button" aria-pressed={!activeCategory} onClick={() => setFilter({ topic: activeTopic })} className={chipClass(!activeCategory)} data-testid="insights-filter-all">ALL</button>
          {INSIGHT_CATEGORIES.map((c) => (
            <button key={c.name} type="button" aria-pressed={activeCategory === c.name} onClick={() => setFilter({ category: c.name, topic: activeTopic })} title={c.blurb} className={chipClass(activeCategory === c.name)} data-testid={`insights-filter-${testSlug(c.name)}`}>
              {c.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* The knowledge taxonomy. A second axis, not a second copy of the
            first: a category is the series a piece was written in; a topic is
            the subject it belongs to. Counts come from the real list. */}
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter insights by topic" data-testid="insights-topic-filter">
          <span className="sys-chip mr-1 text-[#232A2A]/45">BY TOPIC</span>
          {INSIGHT_TOPICS.map((t) => (
            <button
              key={t.name}
              type="button"
              aria-pressed={activeTopic === t.name}
              onClick={() => setFilter({ category: activeCategory, topic: activeTopic === t.name ? null : t.name })}
              title={t.blurb}
              className={chipClass(activeTopic === t.name)}
              data-testid={`insights-topic-${testSlug(t.name)}`}
            >
              {t.name.toUpperCase()}{topicCounts[t.name] ? <span className="ml-1.5 opacity-60">{topicCounts[t.name]}</span> : null}
            </button>
          ))}
        </div>
      </section>

      {/* A note becomes public the same way it got written: one observation
          tested against a category until it holds. The field shows that —
          quietly, a couple of pulses at a time, never the whole notebook
          lighting up at once. */}
      <section className="container-page" data-testid="insights-signal-section">
        <div className="panel-dark relative overflow-hidden rounded-[18px]" data-testid="insights-signal-frame">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 p-7 sm:p-9 lg:flex-row lg:items-center lg:p-12">
            <div className="max-w-[38ch]">
              <p className="sys-chip flex items-center gap-3 text-[#F7F5EE]/55">
                <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> CONNECT THE IDEAS
              </p>
              <p className="font-editorial mt-4 text-[clamp(1.25rem,1.9vw,1.7rem)] font-medium leading-[1.3] text-[#F7F5EE]">
                A business question rarely belongs to just one discipline.
              </p>
              <p className="font-mono-sys mt-4 text-[12.5px] leading-relaxed text-[#F7F5EE]/50">
                Read across the categories to connect the customer experience, the systems behind it and the results you want to improve.
              </p>
            </div>
            <div className="h-[220px] w-full shrink-0 sm:h-[260px] lg:h-[300px] lg:w-[46%]" data-testid="insights-signal-canvas">
              {show3d ? (
                <ThreeSafe fallback={<SignalFieldFallback />}>
                  <Suspense fallback={<SignalFieldFallback />}>
                    <SignalField />
                  </Suspense>
                </ThreeSafe>
              ) : (
                <SignalFieldFallback />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page section-pad-b">
        {!posts && !loadError && <div className="grid gap-5 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel-paper h-[200px] animate-pulse" />)}</div>}
        {loadError && <div role="alert" className="panel-paper p-6"><p>We could not load this content.</p><button type="button" className="btn-ink mt-4" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
        {posts && visible.length === 0 && (
          <p className="panel-paper p-6 text-[15px] text-[#232A2A]/80" data-testid="insights-empty">
            {filtered ? "There are no published pieces matching that filter yet. Clear it, or choose another category or topic to continue reading." : "There are no published notes yet."}
            {filtered && (
              <button type="button" className="link-draw ml-2 font-semibold text-[#232A2A]" onClick={() => setFilter({})} data-testid="insights-clear-filter">Clear filters</button>
            )}
          </p>
        )}

        {knowledge.length > 0 && (
          <div data-testid="insights-encyclopedia">
            <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
              <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> THE ENCYCLOPEDIA · {knowledge.length} {knowledge.length === 1 ? "ENTRY" : "ENTRIES"}
            </Reveal>
            <Reveal delay={60} as="p" className="mt-3 max-w-[60ch] text-[16.5px] leading-[1.58] text-[#232A2A]/78">
              Definitions, frameworks and decision criteria for the concepts the work depends on. Each entry says what a thing is, when to use it, when not to, and where it connects to a service, a discipline or a case study.
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="insights-encyclopedia-grid">
              {knowledge.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 3) * 70}>
                  <Link
                    to={`/insights/${p.slug}`}
                    className="case-card group flex h-full flex-col rounded-[18px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6"
                    data-testid={`insight-card-${p.slug}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="sys-chip rounded-full bg-[#232A2A] px-2.5 py-1 text-[#F7F5EE]">{p.category.toUpperCase()}</span>
                      <span className="sys-chip text-[#232A2A]/45">{p.readingTime}</span>
                    </div>
                    <h2 className="font-display mt-4 text-[clamp(1.35rem,1.8vw,1.7rem)] leading-[1.06] text-[#232A2A]">{p.title}</h2>
                    <p className="mt-3 text-[15.5px] leading-[1.55] text-[#232A2A]/78">{p.definition || p.excerpt}</p>
                    {p.topics?.length > 0 && (
                      <p className="sys-chip mt-3 text-[#232A2A]/45">{p.topics.join(" · ").toUpperCase()}</p>
                    )}
                    <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-[#232A2A]">
                      Read the entry <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className={knowledge.length > 0 ? "mt-14" : ""} data-testid="insights-grid">
            {knowledge.length > 0 && (
              <Reveal as="p" className="sys-chip mb-6 flex items-center gap-3 text-[#232A2A]/60">
                <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> NOTES FROM THE WORK
              </Reveal>
            )}
            <CardCarousel label={`${notes.length} NOTE${notes.length === 1 ? "" : "S"} · DRAG TO EXPLORE`} testId="insights-carousel" autoPlay>
              {notes.map((p) => (
                <Link
                  key={p.slug}
                  to={`/insights/${p.slug}`}
                  className="case-card group flex h-full w-[86vw] shrink-0 snap-start flex-col rounded-[18px] border border-[#232A2A]/15 bg-[#F7F5EE] p-7 sm:w-[420px] lg:w-[440px]"
                  data-testid={`insight-card-${p.slug}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="sys-chip rounded-full border border-[#F19020]/70 px-3 py-1 text-[#232A2A]/70">{p.category.toUpperCase()}</span>
                    <span className="sys-chip text-[#232A2A]/45">{p.readingTime}</span>
                  </div>
                  <h2 className="font-display mt-4 text-[clamp(1.6rem,2.2vw,2.1rem)] leading-[1.04] text-[#232A2A]">{p.title}</h2>
                  <p className="mt-3 text-[16.5px] leading-[1.58] text-[#232A2A]/78">{p.excerpt}</p>
                  <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-[#232A2A]">
                    Read it <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </CardCarousel>
          </div>
        )}
      </section>
      <div className="container-page pb-4">
        <NotesSubscribe source="insights-index" className="max-w-3xl" />
      </div>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/insights" />
    </div>
  );
}
