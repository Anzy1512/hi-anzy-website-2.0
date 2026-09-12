import React, { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A small drifting constellation for the mobile menu.
 *
 * Deliberately 2D canvas, not three.js. The rest of the site drops WebGL below
 * the large breakpoint on purpose — a phone opening a nav panel should not be
 * paying for a renderer, a scene graph and a shader compile to decorate a list
 * of six links. This draws the same idea (nodes finding each other, the motif
 * the network page is built on) for a few hundred bytes of maths.
 *
 * It only runs while the panel is open: the caller mounts it with the sheet, and
 * it stops on unmount, on tab hide, and entirely under reduced motion.
 */
const NODE_COUNT = 14;
const LINK_DISTANCE = 78;

export const MenuConstellation = ({ className = "", testId = "menu-constellation" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 1.4 + Math.random() * 1.6,
    }));

    // Reduced motion still gets the diagram, just held still.
    const still = prefersReducedMotion();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DISTANCE) continue;
          // fade the link out as the pair drifts apart
          ctx.strokeStyle = `rgba(35, 42, 42, ${(1 - dist / LINK_DISTANCE) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      nodes.forEach((n, i) => {
        ctx.fillStyle = i % 5 === 0 ? "rgba(241, 144, 32, 0.9)" : "rgba(35, 42, 42, 0.45)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    let raf = 0;
    const step = () => {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      draw();
      raf = requestAnimationFrame(step);
    };

    if (still) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!still && !raf) {
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-testid={testId}
      aria-hidden="true"
    />
  );
};
