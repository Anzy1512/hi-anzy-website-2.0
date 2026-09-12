import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, webglAvailable } from "@/lib/motion";
import { ThreeSafe } from "@/components/three/Fallbacks";

// Degrees of tilt at the frame's edge. A cursor-tracking rotateX/rotateY, in
// the same family as the hover-tilt cards on sites like 21st.dev and the
// card-tilt patterns three.js's own examples use — built from this frame's
// existing poster+canvas layers rather than any one registry component.
const TILT_MAX = 10;

/**
 * The shell every deck motif sits in.
 *
 * The four motifs on the secondary pages are drawn from the brand deck — the
 * hand through the aperture, the lorgnette, the two hands and the spark, the
 * clasped hands forming a letterform. They are not the deck's photographs.
 * Reproducing scanned pop-art collage at hero scale would look like a
 * screenshot of a PDF; what carries over is the *motif*, redrawn in the brand
 * palette as line and light.
 *
 * This frame exists so all four behave identically where it matters:
 *
 *  - The poster is the real content. Every motif ships an SVG that is complete
 *    on its own, labelled for assistive tech, and painted immediately. The
 *    canvas, when there is one, layers over it. That ordering is deliberate:
 *    current practice is to lazy-load WebGL behind a static poster so a weak
 *    connection still gets a fast first paint, and it means reduced-motion and
 *    no-WebGL readers are not served a hole in the layout.
 *  - Nothing is load-bearing. Each motif is decorative in the strict sense —
 *    every fact it gestures at is already written in the column beside it — so
 *    the whole frame is aria-hidden unless a label is passed.
 *  - It only mounts the scene once it is near the viewport. A hero motif on
 *    /careers should not cost anything to a reader who never scrolls there.
 *  - It tilts toward the cursor. Poster and canvas move together as one
 *    rigid card, so the motion reads the same whether WebGL is active or a
 *    reader is looking at the plain poster.
 */
export const MotifFrame = ({
  poster,
  scene = null,
  label,
  className = "",
  ratio = "1 / 1",
  testId,
  /**
   * Whether the canvas replaces the poster or layers over it.
   *
   * "over" is the default: the poster is the picture and the scene adds motion
   * the still cannot carry (the lorgnette's lenses stay, the point field moves).
   * "replace" is for motifs whose scene redraws the same subject — leaving the
   * poster up there would double the artwork.
   */
  sceneMode = "over",
}) => {
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);
  const rectRef = useRef(null);
  const [near, setNear] = useState(false);
  const [use3d, setUse3d] = useState(false);

  // Mount the scene only once the frame is close to being seen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !scene) return;
    if (prefersReducedMotion()) return;
    setUse3d(webglAvailable());
  }, [near, scene]);

  // Direct style writes, not state — the same choice MagneticButton makes for
  // its pull, and for the same reason: a re-render per mousemove is wasted
  // work when the DOM node it would produce is identical every time.
  //
  // The rect is measured once on enter rather than per move. getBoundingClientRect
  // forces a synchronous layout, and mousemove fires at the pointer's poll rate,
  // so reading it every event is the one genuinely expensive thing this handler
  // could do. The frame cannot move under the cursor between enter and leave
  // without the pointer also leaving it.
  const onTiltEnter = useCallback(() => {
    const wrap = wrapRef.current;
    const tilt = tiltRef.current;
    if (!wrap || !tilt || prefersReducedMotion()) return;
    rectRef.current = wrap.getBoundingClientRect();
    tilt.classList.remove("is-releasing");
  }, []);

  const onTiltMove = useCallback((e) => {
    const tilt = tiltRef.current;
    const r = rectRef.current;
    if (!tilt || !r || prefersReducedMotion()) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rotY = (px - 0.5) * 2 * TILT_MAX;
    const rotX = (0.5 - py) * 2 * TILT_MAX;
    tilt.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.035, 1.035, 1)`;
  }, []);

  // Easing belongs only to the settle back to flat; see .motif-tilt in App.css.
  const onTiltLeave = useCallback(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    rectRef.current = null;
    tilt.classList.add("is-releasing");
    tilt.style.transform = "";
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`motif-frame ${className}`}
      style={{ aspectRatio: ratio }}
      onMouseEnter={onTiltEnter}
      onMouseMove={onTiltMove}
      onMouseLeave={onTiltLeave}
      data-testid={testId}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <div ref={tiltRef} className="motif-tilt">
        <div
          className="motif-poster"
          style={use3d && sceneMode === "replace" ? { opacity: 0 } : undefined}
        >
          {poster}
        </div>
        {use3d && scene ? (
          <ThreeSafe fallback={null}>
            <Suspense fallback={null}>
              <div className="motif-canvas">{scene}</div>
            </Suspense>
          </ThreeSafe>
        ) : null}
      </div>
    </div>
  );
};
