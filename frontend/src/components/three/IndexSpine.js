import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import * as THREE from "three";

/**
 * The living spine behind the section index.
 *
 * A narrow WebGL strip: a dim rail the height of the index, a travelling node
 * that sits at the reader's position through the page, and a slow drift of
 * motes around it. It exists to make the rail feel like an instrument rather
 * than a list — the position is already conveyed by the dots, so nothing here
 * carries information the DOM does not.
 *
 * Two rules it follows, because it renders on every page at all times:
 *  - Progress arrives as a ref, not a prop. Scroll updates would otherwise
 *    re-render the React tree on every frame for a decorative canvas.
 *  - The frame loop is `demand`-free but cheap: three meshes, no lights, no
 *    shadows, no post-processing. It idles at a few hundred triangles.
 */
const RAIL_TOP = 2.35;
const RAIL_BOTTOM = -2.35;

const Motes = ({ progressRef }) => {
  const group = useRef(null);
  const count = 14;

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 0.55,
        y: RAIL_BOTTOM + Math.random() * (RAIL_TOP - RAIL_BOTTOM),
        speed: 0.05 + Math.random() * 0.12,
        size: 0.012 + Math.random() * 0.022,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const head = THREE.MathUtils.lerp(RAIL_TOP, RAIL_BOTTOM, progressRef.current);
    g.children.forEach((mesh, i) => {
      const s = seeds[i];
      // drift upward, wrap at the top
      let y = s.y + ((t * s.speed) % (RAIL_TOP - RAIL_BOTTOM));
      if (y > RAIL_TOP) y -= RAIL_TOP - RAIL_BOTTOM;
      mesh.position.set(s.x + Math.sin(t * 0.6 + s.phase) * 0.06, y, 0);
      // brighten near the reader's position
      const near = 1 - Math.min(1, Math.abs(y - head) / 0.9);
      mesh.material.opacity = 0.12 + near * 0.55;
      const k = 1 + near * 0.8;
      mesh.scale.setScalar(k);
    });
  });

  return (
    <group ref={group}>
      {seeds.map((s, i) => (
        <mesh key={i}>
          <circleGeometry args={[s.size, 10]} />
          <meshBasicMaterial color="#F19020" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const Head = ({ progressRef }) => {
  const core = useRef(null);
  const halo = useRef(null);

  useFrame((state) => {
    const y = THREE.MathUtils.lerp(RAIL_TOP, RAIL_BOTTOM, progressRef.current);
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.position.y = THREE.MathUtils.lerp(core.current.position.y, y, 0.12);
      core.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
    }
    if (halo.current) {
      halo.current.position.y = core.current ? core.current.position.y : y;
      const pulse = 1 + Math.sin(t * 1.6) * 0.18;
      halo.current.scale.setScalar(pulse);
      halo.current.material.opacity = 0.22 + Math.sin(t * 1.6) * 0.07;
    }
  });

  return (
    <group>
      <mesh ref={halo} position={[0, RAIL_TOP, 0]}>
        <circleGeometry args={[0.14, 24]} />
        <meshBasicMaterial color="#F19020" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh ref={core} position={[0, RAIL_TOP, 0]}>
        <circleGeometry args={[0.055, 20]} />
        <meshBasicMaterial color="#F7F5EE" />
      </mesh>
    </group>
  );
};

const Rail = ({ progressRef }) => {
  const fill = useRef(null);

  useFrame(() => {
    const f = fill.current;
    if (!f) return;
    const p = Math.max(0.001, progressRef.current);
    const full = RAIL_TOP - RAIL_BOTTOM;
    f.scale.y = p;
    // scaleY grows from the centre, so shift it back up to start at the top
    f.position.y = RAIL_TOP - (full * p) / 2;
  });

  return (
    <group>
      <mesh>
        <planeGeometry args={[0.018, RAIL_TOP - RAIL_BOTTOM]} />
        <meshBasicMaterial color="#F7F5EE" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh ref={fill}>
        <planeGeometry args={[0.018, RAIL_TOP - RAIL_BOTTOM]} />
        <meshBasicMaterial color="#F19020" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
};

export default function IndexSpine({ progressRef }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      orthographic
      camera={{ position: [0, 0, 5], zoom: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <AdaptiveQuality />
      <Rail progressRef={progressRef} />
      <Motes progressRef={progressRef} />
      <Head progressRef={progressRef} />
    </Canvas>
  );
}
