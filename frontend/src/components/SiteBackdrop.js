import React, { lazy, Suspense, useState } from "react";
import { useReducedMotion, webglAvailable } from "@/lib/motion";
import { HalftoneStatic } from "@/components/three/HalftoneStatic";
import { ThreeSafe } from "@/components/three/Fallbacks";

const HalftoneBackdrop = lazy(() => import("@/components/three/HalftoneBackdrop").then(m => ({ default: m.HalftoneBackdrop })));

/** One texture for every route, above the shell's paper and below its content. */
export const SiteBackdrop = () => {
  const reduced = useReducedMotion();
  const [canRender] = useState(webglAvailable);
  if (reduced || !canRender) return <HalftoneStatic />;
  return <ThreeSafe fallback={<HalftoneStatic />}><Suspense fallback={<HalftoneStatic />}><HalftoneBackdrop /></Suspense></ThreeSafe>;
};
