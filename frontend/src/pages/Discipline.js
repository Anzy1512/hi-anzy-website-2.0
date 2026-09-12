import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Seo } from "@/components/Seo";
import { abs } from "@/lib/absoluteUrl";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { NextSteps } from "@/components/NextSteps";
import { PopIllustration } from "@/components/PopIllustration";
import { useRevealObserver } from "@/lib/motion";
import { getNetwork, track } from "@/lib/api";
import { DISCIPLINE_BY_SLUG, DISCIPLINES } from "@/data/disciplines";
import { NETWORK_SUBCATS } from "@/data/content";
import { SITE_CONTACT } from "@/data/site";

/**
 * One discipline, explained.
 *
 * The network page answers "who is in the room". This answers the question
 * people actually arrive with: "is this the thing I need, and how would I
 * know?" — hence signals-before-services, and a specialist list pulled live
 * from the same API the network page uses rather than duplicated by hand.
 */
export default function Discipline() {
  const { slug } = useParams();
  const ref = useRevealObserver();
  const d = DISCIPLINE_BY_SLUG[slug];
  const [members, setMembers] = useState(null);

  useEffect(() => {
    if (!d) return;
    // getNetwork takes the category as a bare string — passing an object
    // nests it into ?category[category]= and the filter silently no-ops.
    getNetwork(d.category)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [d]);

  if (!d) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center pt-[84px]" data-testid="discipline-not-found">
        <p className="font-display text-5xl text-[#232A2A]">We do a lot. Not that, though.</p>
        <p className="max-w-md text-[17px] text-[#232A2A]/75">
          That discipline is not one of ours, which is either a typo or a very interesting brief.
        </p>
        <MagneticButton to="/network" className="btn-ink">Back to the network</MagneticButton>
      </div>
    );
  }

  const subs = NETWORK_SUBCATS[d.category] || [];
  const related = (d.pairs || []).map((p) => DISCIPLINE_BY_SLUG[p]).filter(Boolean);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${d.name} | hiAnzy`,
      serviceType: d.name,
      description: d.lede,
      provider: { "@type": "Organization", name: "hiAnzy" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `${d.name} capabilities`,
        itemListElement: subs.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Network", item: abs("/network") },
        { "@type": "ListItem", position: 2, name: d.name, item: abs(`/network/${d.slug}`) },
      ],
    },
  ];

  return (
    <div ref={ref} className="pt-[84px]" data-testid={`discipline-page-${d.slug}`}>
      <Seo
        title={`${d.name} | hiAnzy Network`}
        description={d.lede}
        jsonLd={jsonLd}
      />

      {/* ── Opening ─────────────────────────────────────────────────────── */}
      <section className="bg-[#1D2424] pb-16 pt-14 lg:pt-20">
        <div className="container-page">
          <Link to="/network" className="link-draw sys-chip inline-flex items-center gap-2 text-[#F7F5EE]/70" data-testid="discipline-back">
            <ArrowLeft size={13} /> THE NETWORK
          </Link>
          <Reveal delay={60}>
            <h1 className="font-display mt-6 leading-[0.92] text-[#F7F5EE] text-[clamp(2.8rem,6.4vw,5.4rem)]" data-testid="discipline-h1">
              {d.name}
            </h1>
          </Reveal>
          <Reveal delay={120} as="p" className="font-accent mt-4 text-[clamp(1.3rem,2.2vw,2rem)] leading-[1.25] accent-orange-on-dark">
            {d.hook}
          </Reveal>
          <Reveal delay={180} as="p" className="mt-6 max-w-[54ch] font-editorial text-[clamp(1.1rem,1.45vw,1.4rem)] leading-[1.45] text-[#F7F5EE]/88">
            {d.lede}
          </Reveal>
        </div>
      </section>

      {/* ── Explanation ─────────────────────────────────────────────────── */}
      <section className="container-page section-pad">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {d.body.map((p, i) => (
              <Reveal key={i} as="p" delay={i * 90} className={`text-[18px] leading-[1.7] text-[#232A2A]/85 ${i ? "mt-5" : ""}`}>
                {p}
              </Reveal>
            ))}

            <Reveal delay={220}>
              <div className="mt-8 rounded-[16px] border-l-[3px] border-[#F19020] bg-[#F7F5EE] p-6 shadow-[0_10px_26px_rgba(35,42,42,0.06)]">
                <p className="sys-chip text-[#232A2A]/60">WHAT YOU LEAVE WITH</p>
                <p className="mt-2.5 text-[18px] font-medium leading-[1.55] text-[#232A2A]">{d.outcome}</p>
              </div>
            </Reveal>

            {/* This column ran ~300px shorter than the signals panel beside it,
                so the section ended on a band of empty paper. Same at-a-glance
                shape the service pages use, for consistency between the two
                detail page types. Every figure is already on the page — counted
                rather than restated, which is what a glance wants anyway. */}
            <Reveal delay={280}>
              <div className="mt-6 rounded-[16px] border border-[#232A2A]/12 bg-[#F7F5EE]/55 p-6" data-testid="discipline-at-a-glance">
                <p className="sys-chip text-[#232A2A]/50">AT A GLANCE</p>
                <dl className="mt-4 space-y-3.5">
                  <div className="flex items-baseline justify-between gap-4 border-b border-[#232A2A]/10 pb-3">
                    <dt className="font-mono-sys text-[12.5px] text-[#232A2A]/55">Discipline</dt>
                    <dd className="text-right text-[15px] font-semibold text-[#232A2A]/85">{d.name}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-[#232A2A]/10 pb-3">
                    <dt className="font-mono-sys text-[12.5px] text-[#232A2A]/55">Specialisms covered</dt>
                    <dd className="font-display text-[20px] leading-none accent-orange-text tabular-nums">{subs.length || "–"}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-[#232A2A]/10 pb-3">
                    <dt className="font-mono-sys text-[12.5px] text-[#232A2A]/55">Specialists listed</dt>
                    <dd className="font-display text-[20px] leading-none accent-orange-text tabular-nums">
                      {members === null ? "…" : members.length}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono-sys text-[12.5px] text-[#232A2A]/55">Usually paired with</dt>
                    <dd className="text-right text-[15px] font-semibold text-[#232A2A]/85">
                      {related.length ? related.map((r) => r.name).join(", ") : "–"}
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>

          {/* Signals — symptoms, not services */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="panel-paper p-6 sm:p-7" data-testid="discipline-signals">
                <p className="sys-chip text-[#232A2A]/60">YOU WILL RECOGNISE THIS IF</p>
                <ul className="mt-4 space-y-3.5">
                  {d.signals.map((s) => (
                    <li key={s} className="flex gap-3 text-[16.5px] leading-[1.55] text-[#232A2A]/85">
                      <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#E54A25]" aria-hidden="true" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-mono-sys mt-5 border-t border-[#232A2A]/12 pt-4 text-[12.5px] leading-relaxed text-[#232A2A]/70">
                  Recognise two or more? That is usually a conversation, not a brief.
                </p>
              </div>
            </Reveal>
            <div className="mt-6 flex justify-end">
              <PopIllustration
                src="/brand/pop-bulb-armchair.png"
                width={170}
                rotate={-2}
                drift={18}
                testId="pop-discipline"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── What sits inside it ─────────────────────────────────────────── */}
      {subs.length > 0 && (
        <section className="container-page section-pad-b">
          <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
            <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> WHAT SITS INSIDE {d.name.toUpperCase()}
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="discipline-subcats">
            {subs.map((s, i) => (
              <Reveal key={s} delay={(i % 3) * 70}>
                <div className="cap-tile flex items-start gap-3 rounded-[14px] border border-[#232A2A]/15 bg-[#F7F5EE] p-4">
                  <Check size={16} className="mt-[3px] shrink-0 accent-orange-text" aria-hidden="true" />
                  <span className="text-[16px] leading-[1.45] text-[#232A2A]/85">{s}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Who actually does it ────────────────────────────────────────── */}
      <section className="container-page section-pad-b" id="discipline-specialists">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> WHO DOES IT
        </Reveal>

        {!members && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="panel-paper h-[170px] animate-pulse" />)}
          </div>
        )}

        {members && members.length === 0 && (
          <p className="panel-paper mt-6 p-6 text-[15px] leading-relaxed text-[#232A2A]/75" data-testid="discipline-empty">
            Nothing public listed under {d.name} yet. The relationships exist. The write-ups are still being
            verified, and we would rather be slow than inventive.
          </p>
        )}

        {members && members.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="discipline-members">
            {members.map((m, i) => (
              <Reveal key={m.slug} delay={(i % 3) * 70}>
                <article className="cap-tile h-full rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6">
                  <h2 className="font-display text-[24px] leading-none text-[#232A2A]">{m.name}</h2>
                  <div className="mt-3"><ProvenanceTag value={m.relationshipType} /></div>
                  <p className="sys-chip mt-3 text-[#232A2A]/55">{m.geography}</p>
                  {m.note && <p className="mt-3 text-[15px] leading-[1.55] text-[#232A2A]/80">{m.note}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── Where it goes next ──────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="container-page section-pad-b">
          <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
            <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> RARELY TRAVELS ALONE
          </Reveal>
          <p className="mt-3 max-w-[60ch] text-[16.5px] leading-[1.6] text-[#232A2A]/80">
            {d.name} usually arrives holding hands with these. Not upselling, just what the problem tends to
            drag in behind it.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {related.map((r, i) => (
              <Reveal key={r.slug} delay={(i % 3) * 80}>
                <Link
                  to={`/network/${r.slug}`}
                  onClick={() => track("discipline_cross_link", { from: d.slug, to: r.slug })}
                  data-testid={`discipline-related-${r.slug}`}
                  className="cap-tile group flex h-full flex-col rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 transition-colors hover:border-[#F19020]"
                >
                  <span className="font-display text-[22px] leading-none text-[#232A2A]">{r.name}</span>
                  <span className="mt-2.5 text-[15px] leading-[1.5] text-[#232A2A]/78">{r.hook}</span>
                  <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-semibold text-[#232A2A]">
                    Read it <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <section className="container-page section-pad-b">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#D8CFB4]/60 p-7 sm:p-8">
            <div>
              <p className="sys-chip text-[#232A2A]/60">STILL READING?</p>
              <p className="font-display mt-1 max-w-xl text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight text-[#232A2A]">
                Then something here landed. Tell us which bit.
              </p>
            </div>
            <MagneticButton
              href={`mailto:${SITE_CONTACT.email}`}
              className="btn-ink"
              hoverText="Good start."
              testId={`discipline-cta-${d.slug}`}
              onClick={() => track("cta_primary_click", { cta: "discipline", discipline: d.slug })}
            >
              Say Hi <ArrowRight size={15} />
            </MagneticButton>
          </div>
        </Reveal>
      </section>

      <NextSteps from="/network" title="Keep going" />
    </div>
  );
}

export { DISCIPLINES };
