import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { abs } from "@/lib/absoluteUrl";
import { NotesSubscribe } from "@/components/NotesSubscribe";
import { MagneticButton } from "@/components/MagneticButton";
import { NextSteps } from "@/components/NextSteps";
import { useRevealObserver } from "@/lib/motion";
import { getInsight, getInsights, track } from "@/lib/api";
import { SITE_CONTACT } from "@/data/site";

/** Stable anchor ids for headings, so sections are directly linkable. */
const slugifyHeading = (text = "") =>
  String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function InsightDetail() {
  const { slug } = useParams();
  const ref = useRevealObserver();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [related, setRelated] = useState([]);
  const depthTracked = useRef(false);

  useEffect(() => {
    let current = true;
    setPost(null);
    setRelated([]);
    setNotFound(false);
    setLoadError(false);
    depthTracked.current = false;
    getInsight(slug).then(data => { if (current) setPost(data); }).catch(error => {
      if (!current) return;
      if (error?.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    });
    getInsights().then(all => { if (!current) return; setRelated(all.filter(x => x.slug !== slug).slice(0, 2)); }).catch(() => {});
    return () => { current = false; };
  }, [slug, retry]);

  // article read-depth analytics
  useEffect(() => {
    if (!post) return undefined;
    const onScroll = () => {
      const p = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (p > 0.75 && !depthTracked.current) {
        depthTracked.current = true;
        track("article_read_depth", { slug, depth: "75" });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [post, slug]);

  if (loadError) return <div role="alert" className="container-page py-32"><h1 className="font-display text-4xl">We could not load this page.</h1><button type="button" className="btn-ink mt-6" onClick={() => setRetry(value => value + 1)}>Try again</button></div>;

  if (notFound) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 pt-[84px]" data-testid="insight-not-found">
        <p className="font-display text-5xl text-[#232A2A]">That note wandered off.</p>
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

  // Structured data. Answer-engines and rich results read these directly, so
  // every FAQ block on the page is also published as a machine-readable Q&A.
  const faqPairs = (post.body || [])
    .filter((b) => b.type === "faq")
    .flatMap((b) => b.items || []);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      articleSection: post.category,
      keywords: (post.tags || []).join(", ") || undefined,
      wordCount: (post.body || []).reduce((n, b) => n + (b.text ? b.text.split(/\s+/).length : 0), 0),
      author: { "@type": "Organization", name: "hiAnzy" },
      publisher: { "@type": "Organization", name: "hiAnzy" },
      mainEntityOfPage: { "@type": "WebPage", "@id": abs(`/insights/${post.slug}`) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Insights", item: abs("/insights") },
        { "@type": "ListItem", position: 2, name: post.title, item: abs(`/insights/${post.slug}`) },
      ],
    },
    ...(faqPairs.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqPairs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]
      : []),
  ];

  return (
    <div ref={ref} className="pt-[84px]" data-testid="insight-detail-page">
      <Seo title={post.seo?.title || `${post.title} | hiAnzy`} description={post.seo?.description || post.excerpt} jsonLd={jsonLd} />
      <article className="mx-auto max-w-[780px] px-[var(--page-x)] py-14 lg:py-20">
        <Link to="/insights" className="link-draw sys-chip inline-flex items-center gap-2 text-[#232A2A]/60" data-testid="insight-back">
          <ArrowLeft size={13} /> ALL NOTES
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="sys-chip rounded-full border border-[#F19020]/70 px-3 py-1 text-[#232A2A]/70">{post.category.toUpperCase()}</span>
          <span className="sys-chip text-[#232A2A]/45">{post.readingTime} READ</span>
        </div>
        <h1 className="font-display mt-4 leading-[0.92] text-[#232A2A] text-[clamp(2.4rem,4.5vw,4rem)]" data-testid="insight-title">{post.title}</h1>
        <p className="font-editorial mt-5 max-w-[46ch] text-[clamp(1.2rem,1.6vw,1.5rem)] leading-[1.42] text-[#232A2A]/80">{post.excerpt}</p>
        <div className="mt-4 h-[3px] w-16 rounded-full bg-[#F19020]" />

        <div className="mt-10 space-y-6" data-testid="insight-body">
          {(post.body || []).map((b, i) => {
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
                  <p className="mt-2.5 text-[18.5px] font-medium leading-[1.55] text-[#232A2A]">{b.text}</p>
                </div>
              );

            if (b.type === "list")
              return (
                <ul key={i} className="space-y-3" data-testid="insight-list">
                  {(b.items || []).map((item, k) => (
                    <li key={k} className="flex gap-3 text-[18.5px] leading-[1.65] text-[#232A2A]/85">
                      <span className="mt-[11px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#F19020]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
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
                      <p className="mt-3 text-[17px] leading-[1.65] text-[#232A2A]/80">{f.a}</p>
                    </details>
                  ))}
                </section>
              );

            return <p key={i} className="text-[18.5px] leading-[1.65] text-[#232A2A]/85">{b.text}</p>;
          })}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#D8CFB4]/60 p-7">
          <p className="font-display max-w-md text-2xl leading-tight text-[#232A2A]">Reading is free. The diagnosis is a conversation.</p>
          <MagneticButton href={`mailto:${SITE_CONTACT.email}`} className="btn-ink" hoverText="Good start." testId="insight-cta" onClick={() => track("cta_primary_click", { cta: "insight_detail", slug })}>
            Say Hi <ArrowRight size={15} />
          </MagneticButton>
        </div>

        <NotesSubscribe source={`insight:${slug}`} className="mt-10" />

        {related.length > 0 && (
          <div className="mt-10">
            <p className="sys-chip text-[#232A2A]/50">KEEP READING</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} to={`/insights/${r.slug}`} className="case-card block rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5" data-testid={`insight-related-${r.slug}`}>
                  <span className="sys-chip text-[#232A2A]/50">{r.category.toUpperCase()}</span>
                  <p className="font-display mt-2 text-xl leading-tight text-[#232A2A]">{r.title}</p>
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
