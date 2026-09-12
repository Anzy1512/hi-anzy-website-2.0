import React from "react";

/**
 * Static CSS fallback for the halftone backdrop — same texture language, no
 * motion and no renderer.
 *
 * It lives in its own module so it can stay in the main bundle while the WebGL
 * version is loaded lazily. Both used to sit in one file, and because Home
 * imports the fallback eagerly, that single import pulled three.js and
 * @react-three/fiber into the entry chunk for every visitor — including the
 * ones whose device had just been judged unable to run it.
 */
export const HalftoneStatic = () => (
  <div
    className="halftone-static pointer-events-none fixed inset-0 -z-10"
    aria-hidden="true"
    data-testid="home-texture-backdrop"
  />
);
