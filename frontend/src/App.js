import React, { Suspense, lazy } from "react";
import "@/App.css";
// Order matters: the generated utility remap first, then the
// hand-written component rules that are allowed to beat it.
import "@/dark.generated.css";
import "@/dark.css";
// story.css moved to ConnectedStory.js's own import -- see the comment there.
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LenisProvider, ScrollToTop } from "@/lib/motion";
import { AuthProvider, AuthCallback } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CollapseOnScroll } from "@/components/CollapseOnScroll";
import { SectionIndex } from "@/components/SectionIndex";
import { StickyCta } from "@/components/StickyCta";
import { CommandPalette } from "@/components/CommandPalette";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { LegacyRedirect } from "@/components/LegacyRedirect";
import { LEGACY_ROUTES } from "@/data/content";
import { Toaster } from "@/components/ui/sonner";
import { SiteBackdrop } from "@/components/SiteBackdrop";
// Phase 2 optional motion layers. Both render null, own no layout, and are
// individually switchable in lib/motionFeatures.js — removing either line
// returns the site to its pre-Phase-2 behaviour exactly.
import { ScrollVelocity } from "@/components/motion/ScrollVelocity";
import { ContextualCursor } from "@/components/motion/ContextualCursor";

import Home from "@/pages/Home";
const WhatWeDo = lazy(() => import("@/pages/WhatWeDo"));
const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));
const HowWeWork = lazy(() => import("@/pages/HowWeWork"));
const Work = lazy(() => import("@/pages/Work"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const Network = lazy(() => import("@/pages/Network"));
const Discipline = lazy(() => import("@/pages/Discipline"));
const WhyHiAnzy = lazy(() => import("@/pages/WhyHiAnzy"));
const Insights = lazy(() => import("@/pages/Insights"));
const InsightDetail = lazy(() => import("@/pages/InsightDetail"));
const Contact = lazy(() => import("@/pages/Contact"));
const Resources = lazy(() => import("@/pages/Resources"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center pt-[84px]">
    <p className="sys-chip text-[#232A2A]/50">Loading. Worth it.</p>
  </div>
);

const Shell = () => {
  const location = useLocation();
  // Auth callback must intercept the one-time session_id BEFORE normal routing.
  // Read from useLocation().hash (reactive), not window.location.hash.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <div className="site-shell relative isolate min-h-screen bg-[#E0D8C1] text-[#232A2A]">
      <SiteBackdrop />
      <ScrollProgress />
      <ScrollVelocity />
      <ContextualCursor />
      <Nav />
      <SectionIndex />
      <CommandPalette />
      <main id="main" tabIndex={-1} key={location.pathname} className="page-enter">
        <RouteErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/what-we-do" element={<WhatWeDo />} />
              <Route path="/what-we-do/:slug" element={<ServiceDetail />} />
              <Route path="/how-we-work" element={<HowWeWork />} />
              <Route path="/work" element={<Work />} />
              {/* The nine standalone pages absorbed into their hubs
                  (docs/IA_CONSOLIDATION_AUDIT.md) keep their URLs: the edge
                  answers 301, and these routes cover in-app navigation and any
                  host that serves the shell first. Literal segments outrank
                  :slug in react-router v6's own ranking regardless of
                  declaration order, so none is shadowed by /work/:slug or
                  /network/:slug below. */}
              {LEGACY_ROUTES.map((r) => (
                <Route key={r.from} path={r.from} element={<LegacyRedirect to={r.to} />} />
              ))}
              <Route path="/work/:slug" element={<WorkDetail />} />
              <Route path="/network" element={<Network />} />
              <Route path="/network/:slug" element={<Discipline />} />
              <Route path="/why-hi-anzy" element={<WhyHiAnzy />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/insights/:slug" element={<InsightDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <StickyCta />
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    // Opt in to the v7 behaviours now: both are already how this app expects
    // routing to work, and without the flags React Router logs a future
    // warning on every load, which buries anything real in the console.
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <LenisProvider>
          <ScrollToTop />
          <CollapseOnScroll />
          <Shell />
        </LenisProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
