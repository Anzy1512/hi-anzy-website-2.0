import React from "react";
import { Seo } from "@/components/Seo";
import { MagneticButton } from "@/components/MagneticButton";
import { RouteLine } from "@/components/RouteLine";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[86vh] flex-col items-center justify-center px-4 pt-[84px] text-center" data-testid="not-found-page">
      <Seo title="404: Not in the Roadmap | hiAnzy" description="This page does not exist. The rest of the system does." noIndex />
      <RouteLine d="M0,50 C 25,10 50,90 75,30 C 88,5 95,60 100,40" viewBox="0 0 100 100" strokeWidth={1.4} className="pointer-events-none absolute inset-x-0 top-1/3 h-40 w-full opacity-40" start="top 100%" end="top 40%" />
      {/* Signal red on paper is 2.8:1 — deepened so the label still reads red
          but clears AA at this size. */}
      <p className="sys-chip font-bold text-[#A8351A]">ERROR 404 / UNPLANNED</p>
      <h1 className="font-display mt-4 max-w-3xl leading-[0.9] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="not-found-headline">
        Well. This clearly wasn&rsquo;t in the roadmap.
      </h1>
      <p className="font-mono-sys mt-5 max-w-md text-[13px] leading-relaxed text-[#232A2A]/80">
        The page you wanted either moved, never existed, or is being quietly retired without a funeral.
      </p>
      <MagneticButton to="/" className="btn-ink mt-9" testId="not-found-home-button">
        Take me somewhere useful
      </MagneticButton>
    </div>
  );
}
