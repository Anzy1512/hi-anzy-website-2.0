import React from "react";
import { Reveal } from "@/components/Reveal";
import { TOP_CLIENT_MARKS } from "@/data/content";

/**
 * "Worked with" band — a crawling strip of the biggest names in the client
 * roster, for the top of /work.
 *
 * Reuses the exact marquee pattern ProofStrip already established on the home
 * page (.marquee-track, doubled content for a seamless loop, an aria-hidden
 * visible track paired with a plain <ul> for assistive tech) rather than
 * inventing a second one — the same mechanism, a different, curated list.
 *
 * Deliberately typographic, not a strip of raster logo files. Real logo
 * assets in their own brand colours and aspect ratios would fight this site's
 * tightly controlled monochrome-ink-and-one-accent system on every single
 * name; a name set in the site's own display face reads as one system the
 * way the rest of the page does, and it is what ProofStrip already proved
 * works here.
 *
 * The Work page hero used to open with "No endless logo wall" as its first
 * promise, which this band would have flatly contradicted the moment a
 * reader's eye reached it. That line was softened rather than this band
 * dropped — the page's actual point survives it: no *unexplained numbers*, no
 * *footnotes doing heavy lifting*. A name is not a number or a footnote.
 */
export const ClientMarquee = ({ testId = "work-client-marquee" }) => (
  <Reveal delay={100}>
    <div data-testid={testId}>
      <p className="sys-chip text-[#232A2A]/45">SOME OF THE NAMES ON THAT ROSTER</p>
      <div className="relative mt-3 overflow-hidden border-y border-[#232A2A]/12 py-3.5">
        <div className="marquee-track items-center gap-x-8" aria-hidden="true" style={{ animationDuration: "34s" }}>
          {[...TOP_CLIENT_MARKS, ...TOP_CLIENT_MARKS].map((name, i) => (
            <React.Fragment key={`${name}-${i}`}>
              <span className="font-display whitespace-nowrap text-[21px] font-semibold tracking-[0.03em] text-[#232A2A]/70 transition-colors hover:text-[#232A2A]">
                {name}
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F19020]" aria-hidden="true" />
            </React.Fragment>
          ))}
        </div>
        <ul className="sr-only">
          {TOP_CLIENT_MARKS.map((name) => <li key={name}>{name}</li>)}
        </ul>
      </div>
      <p className="font-mono-sys mt-2 text-[12.5px] tracking-[0.05em] text-[#232A2A]/40">
        The rest of the roster, credited and categorised, is below.
      </p>
    </div>
  </Reveal>
);
