import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MagneticButton } from "@/components/MagneticButton";
import { Reveal } from "@/components/Reveal";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { getCaseStudies, track } from "@/lib/api";
import { subscribeScroll, useReducedMotion } from "@/lib/motion";
import { CASE_VISUALS, CaseGraphic } from "@/pages/home/ConnectedStory";

const firstSentence = (text = "") => text.match(/^.*?[.!?](?:\s|$)/)?.[0] || text;

/* ============================= S07 — WORK ============================= */
export const WorkPreview = () => {
  const [cases, setCases] = useState(null);
  const sectionRef = useRef(null);
  const rowRef = useRef(null);
  const draggingRef = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    let current = true;
    getCaseStudies(true).then((items) => { if (current) setCases(items); }).catch(() => { if (current) setCases([]); });
    return () => { current = false; };
  }, []);

  // The proof row is a horizontal story inside the vertical page. Tie its
  // scroll position to the same Lenis/native scroll stream used by the rest
  // of the site so each wheel tick advances the next case in sequence. A
  // reader can still drag the row directly; the sync pauses for that gesture
  // and resumes from the current page position afterwards.
  useEffect(() => {
    const section = sectionRef.current;
    const row = rowRef.current;
    if (!section || !row || reduced) return undefined;
    let frame = 0;

    const sync = (scrollY) => {
      if (draggingRef.current || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = Math.max(row.scrollWidth - row.clientWidth, 0);
        if (!maxScroll) return;
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + scrollY;
        const start = sectionTop - window.innerHeight * 0.72;
        const travel = Math.max(rect.height - window.innerHeight * 0.28, window.innerHeight * 0.55);
        const progress = Math.min(1, Math.max(0, (scrollY - start) / travel));
        row.scrollLeft = maxScroll * progress;
      });
    };

    const unsubscribe = subscribeScroll(sync);
    const onPointerDown = () => { draggingRef.current = true; };
    const onPointerUp = () => { draggingRef.current = false; };
    row.addEventListener("pointerdown", onPointerDown, { passive: true });
    row.addEventListener("pointerup", onPointerUp, { passive: true });
    row.addEventListener("pointercancel", onPointerUp, { passive: true });
    row.addEventListener("pointerleave", onPointerUp, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => sync(window.scrollY));
    resizeObserver?.observe(row);

    return () => {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("pointerleave", onPointerUp);
      resizeObserver?.disconnect();
    };
  }, [cases, reduced]);

  return (
    <section ref={sectionRef} className="container-page section-pad" data-testid="home-work-section">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading kicker="PROOF" title="Less portfolio. More proof." testId="work-heading" />
        <Reveal delay={150}>
          <MagneticButton to="/work" className="btn-paper" hoverText="Receipts this way." testId="work-cta">
            See the Work <ArrowRight size={15} />
          </MagneticButton>
        </Reveal>
      </div>
      <Reveal delay={100} as="p" className="mt-5 max-w-xl text-[17px] leading-[1.6] text-[#232A2A]/78">
        Outcomes over aesthetics. Every case reads the same way: situation, gap, move, build, result, next.
      </Reveal>
      <div ref={rowRef} className="h-scroll scroll-synced-carousel mt-10 flex gap-5 overflow-x-auto pb-4" data-testid="work-cards-row">
        {cases?.length === 0 && <p role="status" className="text-[16px] text-[#232A2A]/85">Selected work is unavailable right now. <Link to="/work" className="underline">Visit the work archive.</Link></p>}
        {(cases || Array.from({ length: 3 }).map((_, i) => ({ _skeleton: true, slug: `s${i}` }))).map((cs) =>
          cs._skeleton ? (
            <div key={cs.slug} className="panel-paper h-[300px] w-[340px] shrink-0 animate-pulse" />
          ) : (
            <Link
              key={cs.slug}
              to={`/work/${cs.slug}`}
              onClick={() => track("case_opened", { slug: cs.slug, from: "home" })}
              data-testid={`work-card-${cs.slug}`}
              className="case-card group block w-[340px] shrink-0 rounded-[18px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 sm:w-[400px]"
            >
              {CASE_VISUALS.some((visual) => visual.slug === cs.slug) && <div className="legacy-case-graphic"><CaseGraphic visual={CASE_VISUALS.find((visual) => visual.slug === cs.slug)} index={CASE_VISUALS.findIndex((visual) => visual.slug === cs.slug)} /></div>}
              <div className="flex items-center justify-between gap-3">
                <ProvenanceTag value={cs.provenance} />
                <span className="sys-chip text-[#232A2A]/45">{cs.year}</span>
              </div>
              <h3 className="font-display mt-4 text-3xl leading-[0.95] text-[#232A2A]">{cs.title}</h3>
              <p className="sys-chip mt-2 text-[#232A2A]/50">{cs.client} · {cs.industry}</p>
              <div className="mt-4 space-y-2.5 border-t border-[#232A2A]/10 pt-4">
                <p className="text-[15.5px] leading-[1.55] text-[#232A2A]/75"><span className="font-mono-sys text-[12.5px] accent-signal-text">GAP: </span>{firstSentence(cs.gap)}</p>
                <p className="text-[15.5px] leading-[1.55] text-[#232A2A]/75"><span className="accent-orange-text font-mono-sys text-[12.5px] font-bold">RESULT: </span>{CASE_VISUALS.find((visual) => visual.slug === cs.slug)?.result || firstSentence(cs.result)}</p>
              </div>
              <span className="link-draw mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#232A2A]">
                Read the thinking <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )
        )}
      </div>
      <p className="font-mono-sys mt-3 text-[12.5px] text-[#232A2A]/50">The final screen is nice. The thinking that made it useful is nicer.</p>
    </section>
  );
};
