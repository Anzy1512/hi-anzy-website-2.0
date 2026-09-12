import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { abs } from "@/lib/absoluteUrl";
import { Reveal } from "@/components/Reveal";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { MagneticButton } from "@/components/MagneticButton";
import { useRevealObserver } from "@/lib/motion";
import { getCaseStudy, getCaseStudies, track } from "@/lib/api";
import { CATEGORY_BY_SLUG } from "@/data/content";
import { CaseBanner } from "@/components/ContextBanner";

const SECTIONS = [
  { key: "situation", label: "SITUATION" },
  { key: "gap", label: "GAP" },
  { key: "insight", label: "INSIGHT" },
  { key: "decision", label: "DECISION" },
  { key: "build", label: "BUILD" },
  { key: "result", label: "RESULT" },
  { key: "next", label: "WHAT HAPPENED NEXT" },
];

export default function WorkDetail() {
  const { slug } = useParams();
  const ref = useRevealObserver();
  const [cs, setCs] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [next, setNext] = useState(null);

  useEffect(() => {
    let current = true;
    setCs(null);
    setNext(null);
    setNotFound(false);
    setLoadError(false);

    getCaseStudy(slug).then(data => { if (current) setCs(data); }).catch(error => {
      if (!current) return;
      if (error?.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    });
    getCaseStudies().then(all => { if (!current) return; const idx = all.findIndex(c => c.slug === slug); if (idx >= 0 && all.length > 1) setNext(all[(idx + 1) % all.length]); }).catch(() => {});
    return () => { current = false; };
  }, [slug, retry]);

  if (loadError) return <div role="alert" className="container-page py-32"><h1 className="font-display text-4xl">We could not load this page.</h1><button type="button" className="btn-ink mt-6" onClick={() => setRetry(value => value + 1)}>Try again</button></div>;

  if (notFound) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 pt-[84px]" data-testid="work-detail-not-found">
        <p className="font-display text-5xl text-[#232A2A]">That case file went missing.</p>
        <MagneticButton to="/work" className="btn-ink">Back to the Work</MagneticButton>
      </div>
    );
  }

  if (!cs) {
    return (
      <div className="mx-auto max-w-[900px] space-y-6 px-[var(--page-x)] pb-24 pt-[84px]">
        <div className="panel-paper h-24 animate-pulse" />
        <div className="panel-paper h-[420px] animate-pulse" />
      </div>
    );
  }

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Article", headline: cs.title, about: cs.industry, author: { "@type": "Organization", name: "hiAnzy" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Work", item: abs("/work") },
      { "@type": "ListItem", position: 2, name: cs.title, item: abs(`/work/${cs.slug}`) },
    ] },
  ];

  return (
    <div ref={ref} className="pt-[84px]" data-testid="work-detail-page">
      <Seo title={`${cs.title} | hiAnzy Work`} description={cs.summary} jsonLd={jsonLd} />
      <article className="mx-auto max-w-[980px] px-[var(--page-x)] py-14 lg:py-20">
        <Link to="/work" className="link-draw sys-chip inline-flex items-center gap-2 text-[#232A2A]/60" data-testid="work-detail-back">
          <ArrowLeft size={13} /> ALL WORK
        </Link>
        <Reveal>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProvenanceTag value={cs.provenance} testId="work-detail-provenance" />
            <span className="sys-chip text-[#232A2A]/50">{cs.client} · {cs.industry} · {cs.year}</span>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-4 leading-[0.9] text-[#232A2A] text-[clamp(2.6rem,5vw,4.6rem)]" data-testid="work-detail-title">{cs.title}</h1>
        </Reveal>
        <Reveal delay={140} as="p" className="font-editorial mt-5 max-w-[46ch] text-[clamp(1.2rem,1.6vw,1.5rem)] leading-[1.42] text-[#232A2A]/85">{cs.summary}</Reveal>
        <Reveal delay={200}>
          <CaseBanner visual={cs} className="mt-10" />
        </Reveal>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.key}>
              <section className={`grid gap-4 rounded-[16px] p-6 sm:grid-cols-12 sm:p-8 ${s.key === "result" ? "panel-dark" : "panel-paper"}`} data-testid={`work-detail-${s.key}`}>
                <div className="sm:col-span-3">
                  <p className={`sys-chip flex items-center gap-2 ${s.key === "result" ? "accent-orange-text" : "text-[#232A2A]/55"}`}>
                    {s.key === "gap" && <span className="red-bar" />}
                    {String(i + 1).padStart(2, "0")} {s.label}
                  </p>
                </div>
                <p className={`text-[17px] leading-[1.6] sm:col-span-9 ${s.key === "result" ? "text-[#F7F5EE]/88" : "text-[#232A2A]/85"}`}>{cs[s.key]}</p>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10" data-testid="work-detail-services">
            <div className="flex flex-wrap gap-2">
              {(cs.services || []).map((s) => (
                <span key={s} className="sys-chip rounded-full border border-[#F19020]/70 px-3 py-1 text-[#232A2A]/75">{s}</span>
              ))}
            </div>

            {/* The chips above name what was done; these link to the pages that
                sell it. Case studies were the least internally linked pages on
                the site — three links each, on the strongest sales asset there
                is — so the reader most convinced by this story had nowhere to
                go with it, and the money pages got no authority from it. */}
            {Array.isArray(cs.relatedServices) && cs.relatedServices.length > 0 && (
              <div className="mt-5 border-t border-[#232A2A]/12 pt-4" data-testid="work-detail-related-services">
                <p className="font-mono-sys text-[12.5px] text-[#232A2A]/55">Read how we run this work:</p>
                <ul className="mt-2.5 flex flex-wrap gap-2.5">
                  {cs.relatedServices
                    .map((slug) => CATEGORY_BY_SLUG[slug])
                    .filter(Boolean)
                    .map((c) => (
                      <li key={c.slug}>
                        <Link
                          to={`/what-we-do/${c.slug}`}
                          className="link-draw inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#232A2A]"
                          onClick={() => track("case_to_service", { from: cs.slug, to: c.slug })}
                          data-testid={`work-detail-service-${c.slug}`}
                        >
                          {c.title}
                          <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </Reveal>
        {cs.metricEvidence && (
          <p className="font-mono-sys mt-6 text-[12.5px] leading-relaxed text-[#232A2A]/55" data-testid="work-detail-metric-evidence">{cs.metricEvidence}</p>
        )}

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#D8CFB4]/60 p-7">
          <div>
            <p className="sys-chip text-[#232A2A]/55">SOUND FAMILIAR?</p>
            <p className="font-display mt-1 text-2xl text-[#232A2A]">Your situation deserves its own diagnosis.</p>
          </div>
          <MagneticButton to="/contact" className="btn-ink" hoverText="Good start." testId="work-detail-cta" onClick={() => track("cta_primary_click", { cta: "work_detail", slug: cs.slug })}>
            Start a Conversation <ArrowRight size={15} />
          </MagneticButton>
        </div>

        {next && next.slug !== cs.slug && (
          <Link to={`/work/${next.slug}`} className="group mt-8 flex items-center justify-between rounded-[16px] border border-[#232A2A]/15 p-6" data-testid="work-detail-next" onClick={() => track("case_opened", { slug: next.slug, from: "next_case" })}>
            <div>
              <p className="sys-chip text-[#232A2A]/50">NEXT CASE</p>
              <p className="font-display mt-1 text-2xl text-[#232A2A]">{next.title}</p>
            </div>
            <ArrowRight className="accent-orange-text transition-transform group-hover:translate-x-1.5" />
          </Link>
        )}
      </article>
    </div>
  );
}
