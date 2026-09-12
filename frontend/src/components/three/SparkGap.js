import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";
import * as THREE from "three";

/**
 * The gap between two hands — /collaborate.
 *
 * Deck source: two hands reaching toward each other with a burst firing in the
 * space between the fingertips. The deck plays the Creation of Adam straight;
 * here the hands are abstracted to two tapered arms, because the interesting
 * part was never the anatomy — it is the gap, and the fact that something
 * ignites in it.
 *
 * The arms approach, the burst fires when they are closest, then they withdraw.
 * Motes drift toward the contact point throughout, so the space between reads
 * as charged rather than empty.
 */
const RAYS = 12;
const MOTES = 26;

const Scene = () => {
  const armA = useRef(null);
  const armB = useRef(null);
  const burst = useRef(null);
  const motes = useRef(null);

  const moteSeeds = useMemo(
    () =>
      Array.from({ length: MOTES }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.9 + Math.random() * 2.2,
        speed: 0.12 + Math.random() * 0.3,
        size: 0.03 + Math.random() * 0.05,
        phase: Math.random(),
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // one full approach-ignite-withdraw cycle every ~7s
    const cycle = (Math.sin(t * 0.9) + 1) / 2;
    const close = cycle * cycle * (3 - 2 * cycle);

    const reach = THREE.MathUtils.lerp(2.0, 0.62, close);
    if (armA.current) {
      armA.current.position.x = -reach;
      armA.current.position.y = -0.5 + close * 0.12;
    }
    if (armB.current) {
      armB.current.position.x = reach;
      armB.current.position.y = 0.5 - close * 0.12;
    }

    // the burst only exists in the last of the approach
    const fire = Math.max(0, (close - 0.72) / 0.28);
    if (burst.current) {
      burst.current.scale.setScalar(0.4 + fire * 1.25);
      burst.current.rotation.z = t * 0.55;
      burst.current.children.forEach((ray, i) => {
        ray.material.opacity = fire * (0.55 + 0.45 * Math.sin(t * 7 + i));
      });
    }

    if (motes.current) {
      motes.current.children.forEach((m, i) => {
        const s = moteSeeds[i];
        // spiral inward, then wrap back out
        const p = (s.phase + t * s.speed * 0.16) % 1;
        const r = s.radius * (1 - p);
        const a = s.angle + p * 2.4;
        m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.72, 0);
        m.material.opacity = Math.min(1, p * 3) * (1 - p) * 0.85;
      });
    }
  });

  return (
    <group>
      {/* the two reaching arms, tapered toward the gap */}
      <mesh ref={armA} position={[-2, -0.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.26, 1.7, 4]} />
        <meshBasicMaterial color="#232A2A" transparent opacity={0.86} />
      </mesh>
      <mesh ref={armB} position={[2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.26, 1.7, 4]} />
        <meshBasicMaterial color="#232A2A" transparent opacity={0.86} />
      </mesh>

      {/* the burst in the gap */}
      <group ref={burst}>
        {Array.from({ length: RAYS }, (_, i) => {
          const a = (i / RAYS) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0]} rotation={[0, 0, a]}>
              <planeGeometry args={[0.42, 0.045]} />
              <meshBasicMaterial
                color={i % 3 === 0 ? "#E54A25" : "#F19020"}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      <group ref={motes}>
        {moteSeeds.map((s, i) => (
          <mesh key={i}>
            <circleGeometry args={[s.size, 10]} />
            <meshBasicMaterial color="#F19020" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const SparkGap = () => {
  // Ref on the Canvas, not a wrapper — see the note in LensField.js.
  const { ref, active } = useSceneVisibility();
  return (
    <Canvas
      ref={ref}
      frameloop={active ? "always" : "never"}
      orthographic
      camera={{ position: [0, 0, 6], zoom: 62 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      style={{ pointerEvents: "none" }}
    >
      <AdaptiveQuality />
      <Scene />
    </Canvas>
  );
};

export default SparkGap;
