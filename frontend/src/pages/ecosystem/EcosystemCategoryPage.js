import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { useRevealObserver } from "@/lib/motion";
import { getEcosystem, track } from "@/lib/api";
import { ORBIT_CATEGORIES } from "@/data/content";
import { ORBIT_GLYPHS } from "@/components/deck/OrbitGlyphs";
import { abs } from "@/lib/absoluteUrl";

/**
 * One shared index page for all 6 Orbit category routes — the category
 * differs, the shape of "here is who/what is in this bucket" does not.
 *
 * built_here/built_together items are derived from real case studies, which
 * already have a full write-up at /work/:slug (WorkDetail) — so those two
 * categories link straight through to it instead of dead-ending on a card.
 * The other four categories have no detail route yet (Phase M frames that as
 * future work), so their cards stay informational, same as Network.js's own
 * resource cards.
 */
export const EcosystemCategoryPage = ({ category }) => {
  const ref = useRevealObserver();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const meta = ORBIT_CATEGORIES.find((c) => c.key === category);
  const Glyph = meta && ORBIT_GLYPHS[meta.key];
  const isCaseStudy = category === "built_here" || category === "built_together";

  useEffect(() => {
    setItems(null);
    setError(false);
    getEcosystem(category)
      .then(setItems)
      .catch(() => setError(true));
    track("ecosystem_index_viewed", { category });
  }, [category]);

  // Hooks must run before the early return below, and the memo keeps Seo from
  // rewriting the document head on renders where nothing indexable changed.
  const jsonLd = useMemo(() => {
    if (!meta) return undefined;
    return [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "The Hi Anzy Orbit", item: abs("/work") },
          { "@type": "ListItem", position: 2, name: meta.name, item: abs(meta.route) },
        ],
      },
      ...(items && items.length
        ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              url: isCaseStudy ? abs(`/work/${item.slug}`) : item.links?.[0] || undefined,
            })),
          }]
        : []),
    ];
  }, [meta, items, isCaseStudy]);

  if (!meta) return null;

  return (
    <div ref={ref} className="pt-[84px]" data-testid={`ecosystem-page-${category}`}>
      <Seo title={`${meta.name} | The Hi Anzy Orbit | hiAnzy`} description={meta.seoDescription || meta.copy} jsonLd={jsonLd} />
      <section className="container-page section-pad">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> THE HI ANZY ORBIT · {meta.num}
        </Reveal>
        <div className="mt-5 grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal delay={80}>
              <h1 className="font-display leading-[0.95] text-[#232A2A] text-[clamp(2.6rem,5.6vw,4.6rem)]" data-testid="ecosystem-h1">
                {meta.name}
              </h1>
            </Reveal>
            <Reveal delay={140} as="p" className="sys-chip mt-4 text-[#232A2A]/55">{meta.descriptor}</Reveal>
            <Reveal delay={180} as="p" className="font-editorial mt-4 max-w-[48ch] text-[clamp(1.05rem,1.3vw,1.3rem)] italic leading-[1.5] text-[#232A2A]/80">
              {meta.copy}
            </Reveal>
          </div>
          <Reveal delay={220} className="hidden lg:col-span-4 lg:block">
            <div className="ml-auto h-24 w-24 text-[#232A2A]" aria-hidden="true"><Glyph /></div>
          </Reveal>
        </div>
        <Reveal delay={260} className="mt-8">
          {/* Plain /work, not a #hash — ScrollToTop (lib/motion.js) resets scroll
              on every pathname change and has no hash-anchor handling today,
              so a hash here would silently do nothing. */}
          <Link to="/work" className="link-draw inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#232A2A]/70">
            <ArrowLeft size={14} /> Back to the Orbit
          </Link>
        </Reveal>
      </section>

      <section className="container-page section-pad-b" data-index-label={meta.name}>
        {error && (
          <p className="panel-paper p-6 text-[14px] text-[#232A2A]/75" data-testid="ecosystem-error">
            This index is being stubborn. Refresh, or say hi and we will walk you through it.
          </p>
        )}
        {!items && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="panel-paper h-[220px] animate-pulse" />)}</div>
        )}
        {items && items.length === 0 && (
          <p className="panel-paper p-6 text-[14px] text-[#232A2A]/70" data-testid="ecosystem-empty">
            Nothing public in this category yet. The relationships exist. The write-ups are being verified.
          </p>
        )}
        {items && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="ecosystem-grid">
            {items.map((item, i) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl leading-none text-[#232A2A]">{item.name}</h2>
                  </div>
                  <div className="mt-3">
                    <ProvenanceTag value={item.provenance.replace(/_/g, " ")} />
                  </div>
                  {item.geography?.length > 0 && <p className="sys-chip mt-3 text-[#232A2A]/50">{item.geography.join(" · ")}</p>}
                  {item.capabilities?.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {item.capabilities.slice(0, 6).map((cap) => (
                        <li key={cap} className="sys-chip rounded-full border border-[#232A2A]/20 px-2.5 py-0.5 text-[#232A2A]/78">{cap}</li>
                      ))}
                    </ul>
                  )}
                  {item.shortDescription && <p className="mt-3 text-[14.5px] leading-[1.55] text-[#232A2A]/75">{item.shortDescription}</p>}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="sys-chip text-[#232A2A]/35">VERIFIED {item.lastVerified}</p>
                    {!isCaseStudy && item.links?.[0] && (
                      <a
                        href={item.links[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#232A2A]/70 hover:text-[#F19020]"
                      >
                        VISIT <ArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                  {isCaseStudy && (
                    <span className="link-draw mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#232A2A]">
                      Read the full case <ArrowRight size={13} />
                    </span>
                  )}
                </>
              );

              return (
                <Reveal key={item.slug} delay={(i % 3) * 70}>
                  {isCaseStudy ? (
                    <Link
                      to={`/work/${item.slug}`}
                      onClick={() => track("ecosystem_profile_opened", { slug: item.slug, category })}
                      data-testid={`ecosystem-card-${item.slug}`}
                      className="cap-tile group flex h-full flex-col rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 transition-colors hover:border-[#F19020]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <article
                      tabIndex={0}
                      onClick={() => track("ecosystem_profile_opened", { slug: item.slug, category })}
                      data-testid={`ecosystem-card-${item.slug}`}
                      className="cap-tile h-full cursor-default rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6"
                    >
                      {body}
                    </article>
                  )}
                </Reveal>
              );
            })}
          </div>
        )}
        <p className="font-mono-sys mt-8 max-w-2xl text-[12.5px] leading-relaxed text-[#232A2A]/55">
          A network relationship is not the same thing as hiAnzy-delivered client work, which is why every card is labelled honestly.
        </p>
      </section>
    </div>
  );
};

export default EcosystemCategoryPage;
