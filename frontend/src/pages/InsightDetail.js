import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { abs } from "@/lib/absoluteUrl";
import { NotesSubscribe } from "@/components/NotesSubscribe";
import { MagneticButton } from "@/components/MagneticButton";
import { NextSteps } from "@/components/NextSteps";
import { useRevealObserver, subscribeScroll } from "@/lib/motion";
import { getInsight, getInsights, track } from "@/lib/api";
import { SITE_CONTACT } from "@/data/site";
import { CATEGORY_BY_SLUG } from "@/data/content";
import { DISCIPLINE_BY_SLUG } from "@/data/disciplines";
import { renderInline, stripInline } from "@/lib/inline";
import { isKnowledge, formatLabel, topicHref, categoryHref, networkRosterMeta, bySlug } from "@/lib/knowledge";

/** Stable anchor ids for headings, so sections are directly linkable. */
const slugifyHeading = (text = "") =>
  String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * One article: an editorial note, or an entry in the knowledge encyclopedia.
 *
 * Both come from the same API and share the same body blocks. A knowledge
 * entry additionally carries a one-line definition, a topic set, a table of
 * contents once it has enough sections, and a `related` graph that the "Go
 * deeper" and "Next topics" blocks are rendered from — the article names
 * what it connects to, so this page never guesses.
 */
export default function InsightDetail() {
  const { slug } = useParams();
  const ref = useRevealObserver();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [allInsights, setAllInsights] = useState([]);
  const depthTracked = useRef(false);

  useEffect(() => {
    let current = true;
    setPost(null);
    setAllInsights([]);
    setNotFound(false);
    setLoadError(false);
    depthTracked.current = false;
    getInsight(slug).then(data => { if (current) setPost(data); }).catch(error => {
      if (!current) return;
      if (error?.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    });
    getInsights().then(all => { if (current) setAllInsights(all); }).catch(() => {});
    return () => { current = false; };
  }, [slug, retry]);

  const index = useMemo(() => bySlug(allInsights), [allInsights]);

  // Explicit "next topics" from the article's own graph first. Then the
  // same-category fallback that keeps every note reachable from another note
  // (a fixed slice(0, 2) used to leave most of the archive with no inbound
  // link at all); rotated by this article's position so different articles
  // land on different pairs.
  const nextTopics = useMemo(() => {
    if (!post || allInsights.length === 0) return [];
    const explicit = (post.related?.insights || []).map((s) => index[s]).filter(Boolean);
    if (explicit.length >= 2) return explicit.slice(0, 4);
    const others = allInsights.filter((x) => x.slug !== slug && !explicit.some((e) => e.slug === x.slug));
    const sameCategory = others.filter((x) => x.category === post.category);
    const rest = others.filter((x) => x.category !== post.category);
    const startIdx = allInsights.findIndex((x) => x.slug === slug);
    const offset = rest.length ? ((startIdx % rest.length) + rest.length) % rest.length : 0;
    const rotatedRest = rest.length ? [...rest.slice(offset), ...rest.slice(0, offset)] : [];
    return [...explicit, ...sameCategory, ...rotatedRest].slice(0, Math.max(2, explicit.length));
  }, [post, allInsights, slug, index]);

  // Article read-depth analytics. Reads the scroll position from the one
  // source Lenis feeds, with `limit` already computed, rather than forcing a
  // scrollHeight layout read on every native scroll event.
  useEffect(() => {
    if (!post) return undefined;
    return subscribeScroll((y, limit) => {
      const vh = window.innerHeight;
      const p = (y + vh) / (limit + vh);
      if (p > 0.75 && !depthTracked.current) {
        depthTracked.current = true;
        track("article_read_depth", { slug, depth: "75" });
      }
    });
  }, [post, slug]);

  if (loadError) return <div role="alert" className="container-page py-32 pt-[84px]"><h1 className="font-display text-4xl">We could not load this page.</h1><button type="button" className="btn-ink mt-6" onClick={() => setRetry(value => value + 1)}>Try again</button></div>;

  if (notFound) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center pt-[84px]" data-testid="insight-not-found">
        <h1 className="font-display text-5xl text-[#232A2A]">That note wandered off.</h1>
        <MagneticButton to="/insights" className="btn-ink">Back to Insights</MagneticButton>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-[760px] space-y-6 px-[var(--page-x)] pb-24 pt-[84px]">
        <div className="panel-paper h-24 animate-pulse" />
        <div className="panel-paper h-[420px] animate-pulse" />
      </div>
    );
  }

  const knowledge = isKnowledge(post);
  const body = post.body || [];
  const headings = body.filter((b) => b.type === "h2").map((b) => ({ id: slugifyHeading(b.text), text: b.text }));
  const showToc = headings.length >= 3;

  const relatedServices = (post.related?.services || []).map((s) => CATEGORY_BY_SLUG[s]).filter(Boolean);
  const relatedDisciplines = (post.related?.disciplines || []).map((s) => DISCIPLINE_BY_SLUG[s]).filter(Boolean);
  const relatedNetwork = (post.related?.network || []).map((k) => networkRosterMeta(k)).filter(Boolean);
  const relatedWorkSlugs = post.related?.work || [];
  const hasGoDeeper = relatedServices.length + relatedDisciplines.length + relatedNetwork.length + relatedWorkSlugs.length > 0;

  // Structured data. Answer-engines and rich results read these directly, so
  // every FAQ block on the page is also published as a machine-readable Q&A.
  const faqPairs = body.filter((b) => b.type === "faq").flatMap((b) => b.items || []);
  const wordCount = body.reduce((n, b) => {
    if (b.text) return n + stripInline(b.text).split(/\s+/).length;
    if (Array.isArray(b.items)) return n + b.items.reduce((m, it) => m + String(typeof it === "string" ? it : `${it.q || it.title || ""} ${it.a || it.text || ""}`).split(/\s+/).length, 0);
    return n;
  }, 0);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: stripInline(post.definition || post.excerpt),
      articleSection: post.category,
      about: (post.topics || []).map((t) => ({ "@type": "Thing", name: t })),
      keywords: [...(post.tags || []), ...(post.topics || [])].join(", ") || undefined,
      wordCount,
      author: { "@type": "Organization", name: "hiAnzy" },
      publisher: { "@type": "Organization", name: "hiAnzy" },
      mainEntityOfPage: { "@type": "WebPage", "@id": abs(`/insights/${post.slug}`) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Insights", item: abs("/insights") },
        { "@type": "ListItem", position: 2, name: post.category, item: abs(categoryHref(post.category)) },
        { "@type": "ListItem", position: 3, name: post.title, item: abs(`/insights/${post.slug}`) },
      ],
    },
    ...(faqPairs.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqPairs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: stripInline(f.a) },
          })),
        }]
      : []),
  ];

  return (
    <div ref={ref} className="pt-[84px]" data-testid="insight-detail-page">
      <Seo title={post.seo?.title || `${post.title} | hiAnzy`} description={post.seo?.description || post.excerpt} jsonLd={jsonLd} />
      <article className="mx-auto max-w-[780px] px-[var(--page-x)] py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 sys-chip text-[#232A2A]/60">
          <Link to="/insights" className="link-draw inline-flex items-center gap-2 text-[#232A2A]/70" data-testid="insight-back">
            <ArrowLeft size={13} /> INSIGHTS
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={categoryHref(post.category)} className="link-draw text-[#232A2A]/70" data-testid="insight-category-link">
            {post.category.toUpperCase()}
          </Link>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className={`sys-chip rounded-full px-3 py-1 ${knowledge ? "bg-[#232A2A] text-[#F7F5EE]" : "border border-[#F19020]/70 text-[#232A2A]/70"}`} data-testid="insight-format">
            {formatLabel(post)}
          </span>
          <span className="sys-chip text-[#232A2A]/45">{post.readingTime} READ</span>
        </div>
        <h1 className="font-display mt-4 leading-[0.92] text-[#232A2A] text-[clamp(2.4rem,4.5vw,4rem)]" data-testid="insight-title">{post.title}</h1>
        <p className="font-editorial mt-5 max-w-[52ch] text-[clamp(1.2rem,1.6vw,1.5rem)] leading-[1.42] text-[#232A2A]/80" data-testid="insight-lede">
          {knowledge ? post.definition : post.excerpt}
        </p>
        <div className="mt-4 h-[3px] w-16 rounded-full bg-[#F19020]" />

        {post.topics?.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2" data-testid="insight-topics">
            <span className="sys-chip text-[#232A2A]/45">PART OF</span>
            {post.topics.map((t) => (
              <Link key={t} to={topicHref(t)} className="sys-chip rounded-full border border-[#232A2A]/25 px-3 py-1 text-[#232A2A]/75 transition-colors hover:border-[#F19020] hover:text-[#232A2A]" data-testid={`insight-topic-${t.toLowerCase()}`}>
                {t.toUpperCase()}
              </Link>
            ))}
          </div>
        )}

        {showToc && (
          <nav aria-label="On this page" className="panel-paper mt-8 p-5 sm:p-6" data-testid="insight-toc">
            <p className="sys-chip text-[#232A2A]/50">ON THIS PAGE</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {headings.map((h, i) => (
                <li key={h.id} className="flex gap-2.5 text-[15px] leading-[1.45]">
                  <span className="font-mono-sys mt-[2px] shrink-0 text-[12px] text-[#232A2A]/45">{String(i + 1).padStart(2, "0")}</span>
                  <Link to={`#${h.id}`} className="link-draw text-[#232A2A]/85">{h.text}</Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-10 space-y-6" data-testid="insight-body">
          {body.map((b, i) => {
            if (b.type === "h2")
              return (
                <h2 key={i} id={slugifyHeading(b.text)} className="font-display scroll-mt-[110px] pt-4 text-3xl text-[#232A2A]">
                  {b.text}
                </h2>
              );

            if (b.type === "quote")
              return (
                <blockquote key={i} className="panel-dark relative p-6 sm:p-7">
                  <span className="red-bar absolute left-6 top-0 -translate-y-1/2" style={{ width: 28 }} />
                  <p className="font-editorial italic text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.28] accent-orange-text">{b.text}</p>
                </blockquote>
              );

            // Short, quotable answer — the block an answer-engine lifts first.
            if (b.type === "takeaway")
              return (
                <div key={i} className="rounded-[16px] border-l-[3px] border-[#F19020] bg-[#F7F5EE] p-6 shadow-[0_10px_26px_rgba(35,42,42,0.06)]" data-testid="insight-takeaway">
                  <p className="sys-chip text-[#232A2A]/50">THE SHORT ANSWER</p>
                  <p className="mt-2.5 text-[18.5px] font-medium leading-[1.55] text-[#232A2A]">{renderInline(b.text, `t${i}`)}</p>
                </div>
              );

            if (b.type === "list")
              return (
                <ul key={i} className="space-y-3" data-testid="insight-list">
                  {(b.items || []).map((item, k) => (
                    <li key={k} className="flex gap-3 text-[18.5px] leading-[1.65] text-[#232A2A]/85">
                      <span className="mt-[11px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#F19020]" aria-hidden="true" />
                      <span>{renderInline(item, `l${i}-${k}`)}</span>
                    </li>
                  ))}
                </ul>
              );

            // An ordered framework: numbered, titled, each step self-contained.
            if (b.type === "steps")
              return (
                <ol key={i} className="space-y-4" data-testid="insight-steps">
                  {(b.items || []).map((step, k) => (
                    <li key={k} className="grid gap-2 rounded-[14px] border border-[#232A2A]/12 bg-[#F7F5EE]/60 p-5 sm:grid-cols-12 sm:gap-4">
                      <div className="flex items-baseline gap-3 sm:col-span-4">
                        <span className="font-display text-[22px] leading-none accent-orange-text tabular-nums">{String(k + 1).padStart(2, "0")}</span>
                        <span className="font-display text-[19px] leading-tight text-[#232A2A]">{step.title}</span>
                      </div>
                      <p className="text-[17px] leading-[1.6] text-[#232A2A]/85 sm:col-span-8">{renderInline(step.text, `s${i}-${k}`)}</p>
                    </li>
                  ))}
                </ol>
              );

            if (b.type === "faq")
              return (
                <section key={i} className="space-y-3" data-testid="insight-faq" aria-label="Frequently asked questions">
                  {(b.items || []).map((f, k) => (
                    <details key={k} className="faq-item group rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5 sm:p-6">
                      <summary className="flex cursor-pointer items-start justify-between gap-4 text-[17.5px] font-semibold leading-[1.4] text-[#232A2A] marker:content-['']">
                        {f.q}
                        <span className="faq-plus mt-1 shrink-0 accent-orange-text" aria-hidden="true">+</span>
                      </summary>
                      <p className="mt-3 text-[17px] leading-[1.65] text-[#232A2A]/80">{renderInline(f.a, `f${i}-${k}`)}</p>
                    </details>
                  ))}
                </section>
              );

            return <p key={i} className="text-[18.5px] leading-[1.65] text-[#232A2A]/85">{renderInline(b.text, `p${i}`)}</p>;
          })}
        </div>

        {hasGoDeeper && (
          <div className="mt-14 border-t border-[#232A2A]/12 pt-8" data-testid="insight-go-deeper">
            <p className="sys-chip text-[#232A2A]/50">GO DEEPER</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {relatedServices.map((c) => (
                <Link key={c.slug} to={`/what-we-do/${c.slug}`} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-service-${c.slug}`}>
                  <span className="sys-chip text-[#232A2A]/50">THE SERVICE · {c.label}</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{c.title}</p>
                  <p className="mt-2 text-[14.5px] leading-[1.5] text-[#232A2A]/72">{c.copy}</p>
                </Link>
              ))}
              {relatedDisciplines.map((d) => (
                <Link key={d.slug} to={`/network/${d.slug}`} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-discipline-${d.slug}`}>
                  <span className="sys-chip text-[#232A2A]/50">THE DISCIPLINE</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{d.name}</p>
                  <p className="mt-2 text-[14.5px] leading-[1.5] text-[#232A2A]/72">{d.hook}</p>
                </Link>
              ))}
              {relatedWorkSlugs.map((s) => (
                <Link key={s} to={`/work/${s}`} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-work-${s}`}>
                  <span className="sys-chip text-[#232A2A]/50">THE PROOF · CASE STUDY</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{s.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</p>
                  <p className="mt-2 text-[14.5px] leading-[1.5] text-[#232A2A]/72">Situation, gap, decision, build, result, and what happened next.</p>
                </Link>
              ))}
              {relatedNetwork.map((n) => (
                <Link key={n.key} to={n.route} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-network-${n.key}`}>
                  <span className="sys-chip text-[#232A2A]/50">THE NETWORK · {n.descriptor.toUpperCase()}</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{n.name}</p>
                  <p className="mt-2 text-[14.5px] leading-[1.5] text-[#232A2A]/72">{n.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#D8CFB4]/60 p-7">
          <p className="font-display max-w-md text-2xl leading-tight text-[#232A2A]">Reading is free. The diagnosis is a conversation.</p>
          <MagneticButton href={`mailto:${SITE_CONTACT.email}`} className="btn-ink" hoverText="Good start." testId="insight-cta" onClick={() => track("cta_primary_click", { cta: "insight_detail", slug })}>
            Say Hi <ArrowRight size={15} />
          </MagneticButton>
        </div>

        <NotesSubscribe source={`insight:${slug}`} className="mt-10" />

        {nextTopics.length > 0 && (
          <div className="mt-10" data-testid="insight-next-topics">
            <p className="sys-chip text-[#232A2A]/50">{knowledge ? "NEXT TOPICS TO LEARN" : "KEEP READING"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {nextTopics.map((r) => (
                <Link key={r.slug} to={`/insights/${r.slug}`} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-${r.slug}`}>
                  <span className="sys-chip text-[#232A2A]/50">{formatLabel(r)} · {r.category.toUpperCase()}</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{r.title}</p>
                  {r.definition && <p className="mt-2 text-[14.5px] leading-[1.5] text-[#232A2A]/72">{r.definition}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
      {/* Outside the <article>, because an onward journey is not part of the
          piece. Without it this page linked only to other insights and
          /contact: a reader arriving on an article could reach more articles,
          but never a capability or a case study. */}
      <NextSteps from="/insights" />
    </div>
  );
}
