import React from "react";
import { CaseBanner } from "@/components/ContextBanner";

/**
 * Split out of ConnectedStory.js: WorkPreview and Work.js only ever needed
 * this data and this one-line wrapper, but importing them from ConnectedStory
 * meant Vite could not split it into its own chunk — a static import from
 * either of those pulls in the entire module, including the far heavier
 * "model" experience Home.js loads lazily on purpose. Vite bundles at the
 * file level, so a shared file has to be genuinely small on its own for a
 * lazy sibling to actually stay lazy.
 */
export const CASE_VISUALS = [
  { slug: "the-storefront-was-never-the-problem", labels: ["Discover", "Buy", "Return"], name: "A complete customer journey", result: "Retention designed into the journey.", copy: "Replenishment flows and follow-up gave customers a reason to return beyond a discount." },
  { slug: "a-rebrand-that-turned-out-to-be-a-pricing-problem", labels: ["Scope", "Price", "Propose"], name: "A repeatable sales system", result: "An offer the whole team could sell.", copy: "Named service tiers and a shared proposal system reduced dependence on the founder." },
  { slug: "commerce-untangled", labels: ["Guest", "Venue", "Team"], name: "One connected operating picture", result: "Connected information. Clearer operations.", copy: "A shared guest record and connected workflows replaced fragmented venue data." },
  { slug: "launch-systems-for-a-festival-season", labels: ["Create", "Live", "Reach"], name: "One launch story", result: "The launch read as one story.", copy: "Creators, venues, media and logistics moved to one accountable calendar." },
  { slug: "the-dashboard-nobody-opened", labels: ["Decide", "View", "Act"], name: "Decision-first reporting", result: "Three useful views replaced one ignored dashboard.", copy: "Focused decision views and weekly digests gave leadership a reason to look." },
];

export function CaseGraphic({ visual }) {
  return <CaseBanner visual={visual} />;
}
