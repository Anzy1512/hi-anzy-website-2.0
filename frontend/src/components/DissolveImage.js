import React, { useEffect, useId, useRef } from "react";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

/**
 * Noise / displacement dissolve.
 *
 * An SVG feTurbulence feeds feDisplacementMap; scrolling scrubs the displacement
 * scale from high to zero while the image fades up, so the picture resolves out
 * of grain rather than simply appearing. Done with an SVG filter rather than a
 * WebGL pass because it composites on the GPU without a third canvas context.
 *
 * Reduced motion renders the final frame immediately — the filter is decorative,
 * never the only way the content is delivered.
 */
export const DissolveImage = ({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  maxScale = 90,
  start = "top 85%",
  end = "top 35%",
  testId = "dissolve-image",
}) => {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const dispRef = useRef(null);
  const turbRef = useRef(null);
  const rawId = useId();
  const filterId = `dissolve-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    const disp = dispRef.current;
    if (!wrap || !img || !disp) return undefined;

    if (prefersReducedMotion()) {
      img.style.opacity = "1";
      img.style.filter = "none";
      return undefined;
    }

    img.style.opacity = "0";
    disp.setAttribute("scale", String(maxScale));

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start,
      end,
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        // grain collapses as the image resolves
        disp.setAttribute("scale", String(Math.round(maxScale * (1 - p))));
        if (turbRef.current) {
          turbRef.current.setAttribute("baseFrequency", (0.02 + 0.05 * (1 - p)).toFixed(4));
        }
        img.style.opacity = String(Math.min(1, p * 1.35));
      },
    });

    return () => trigger.kill();
  }, [src, maxScale, start, end]);

  return (
    <div ref={wrapRef} className={`dissolve-wrap ${className}`} data-testid={testId}>
      <svg className="dissolve-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.07"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale={maxScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={imgClassName}
        style={{ filter: `url(#${filterId})`, willChange: "opacity, filter" }}
      />
    </div>
  );
};
