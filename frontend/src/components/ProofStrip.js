import React, { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { prefersReducedMotion } from "@/lib/motion";
import { BRAND_REFS, ROTATING_QUOTES } from "@/data/content";

/**
 * PROOF STRIP — fills the band under the hero.
 * Left: rotating brand-voice quotes (Newsreader, human voice).
 * Right rail below: marquee of campaign / placement / collaboration credits
 * from the original deck, labelled honestly.
 */
export const ProofStrip = () => {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const t = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % ROTATING_QUOTES.length);
        setLeaving(false);
      }, 380);
    }, 4600);
    return () => clearInterval(t);
  }, []);

  const quote = ROTATING_QUOTES[idx];

  return (
    <section className="container-page pb-14 lg:pb-20" data-testid="home-proof-strip">
      {/* Rotating quote */}
      <Reveal>
        <div className="relative grid gap-6 rounded-[18px] border border-[#232A2A]/14 bg-[#F7F5EE]/60 p-7 sm:p-9 lg:grid-cols-12 lg:items-center">
          <span className="font-editorial absolute -top-5 left-7 text-[84px] leading-none accent-orange-text" aria-hidden="true">&ldquo;</span>
          <div className="lg:col-span-9">
            <p
              key={idx}
              className="font-pun min-h-[2.4em] max-w-[26ch] text-[clamp(1.45rem,2.5vw,2.4rem)] font-medium italic leading-[1.18] text-[#232A2A] transition-all duration-500"
              style={{ opacity: leaving ? 0 : 1, transform: leaving ? "translateY(10px)" : "translateY(0)" }}
              data-testid="rotating-quote"
            >
              {quote.q}
            </p>
            <p className="sys-chip mt-3 text-[#232A2A]/50">{quote.tag} · NOTES FROM THE WORK</p>
          </div>
          <div className="flex gap-2 lg:col-span-3 lg:justify-end" role="tablist" aria-label="Quotes">
            {ROTATING_QUOTES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Quote ${i + 1}`}
                onClick={() => { setIdx(i); setLeaving(false); }}
                data-testid={`quote-dot-${i}`}
                className={`tap-target h-2.5 rounded-full transition-all duration-300 ${i === idx ? "w-7 bg-[#F19020]" : "w-2.5 bg-[#232A2A]/25 hover:bg-[#232A2A]/45"}`}
              />
            ))}
          </div>
        </div>
      </Reveal>

      {/* Brand reference marquee */}
      <Reveal delay={120}>
        <div className="mt-6" data-testid="brand-ref-marquee">
          <p className="sys-chip text-[#232A2A]/45">CAMPAIGN, PLACEMENT &amp; COLLABORATION CREDITS · <span className="brand-mark">hiAnzy</span> &amp; NETWORK</p>
          <div className="relative mt-3 overflow-hidden border-y border-[#232A2A]/12 py-3.5">
            <div className="marquee-track items-center gap-x-8" aria-hidden="true" style={{ animationDuration: "44s" }}>
              {[...BRAND_REFS, ...BRAND_REFS].map((b, i) => (
                <React.Fragment key={`${b}-${i}`}>
                  <span className="font-display whitespace-nowrap text-[21px] font-semibold tracking-[0.03em] text-[#232A2A]/70 transition-colors hover:text-[#232A2A]">{b}</span>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F19020]" />
                </React.Fragment>
              ))}
            </div>
            <ul className="sr-only">
              {BRAND_REFS.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <p className="font-mono-sys mt-2 text-[12.5px] tracking-[0.05em] text-[#232A2A]/40">Credits span hiAnzy and network collaborations. We label who did what, always.</p>
        </div>
      </Reveal>
    </section>
  );
};
