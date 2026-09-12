import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";
import * as THREE from "three";

/**
 * The field behind the lorgnette — /insights.
 *
 * A scatter of points that resolves into a grid as the two lenses cross. The
 * whole conceit of the page is that a note is worth writing when something
 * stops being noise, so the scene animates exactly that transition and nothing
 * else. It loops slowly: scatter, resolve, hold, release.
 *
 * Cheap on purpose — one Points object and two rings, no lights, no shadows.
 */
const COUNT = 150;
const COLS = 15;

const Field = () => {
  const points = useRef(null);
  const ringA = useRef(null);
  const ringB = useRef(null);

  const { geometry, scattered, resolved } = useMemo(() => {
    const scattered = new Float32Array(COUNT * 3);
    const resolved = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      // where it starts: noise
      scattered[i * 3] = (Math.random() - 0.5) * 4.6;
      scattered[i * 3 + 1] = (Math.random() - 0.5) * 4.6;
      scattered[i * 3 + 2] = 0;
      // where it lands: an ordered lattice
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      resolved[i * 3] = (col / (COLS - 1) - 0.5) * 3.9;
      resolved[i * 3 + 1] = (row / (COUNT / COLS - 1) - 0.5) * 3.9;
      resolved[i * 3 + 2] = 0;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(scattered.slice(), 3));
    return { geometry, scattered, resolved };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 0 → scattered, 1 → resolved, on a slow breathing loop
    const cycle = (Math.sin(t * 0.42) + 1) / 2;
    const focus = cycle * cycle * (3 - 2 * cycle); // smoothstep

    const pos = points.current && points.current.geometry.attributes.position;
    if (pos) {
      const arr = pos.array;
      for (let i = 0; i < COUNT; i += 1) {
        const j = i * 3;
        // a little per-point jitter that dies away as focus arrives
        const jitter = (1 - focus) * Math.sin(t * 1.6 + i) * 0.05;
        arr[j] = THREE.MathUtils.lerp(scattered[j], resolved[j], focus) + jitter;
        arr[j + 1] = THREE.MathUtils.lerp(scattered[j + 1], resolved[j + 1], focus) + jitter;
      }
      pos.needsUpdate = true;
      points.current.material.opacity = 0.25 + focus * 0.5;
      points.current.material.size = 0.075 - focus * 0.028;
    }

    // the two lenses close as the field resolves
    const gap = THREE.MathUtils.lerp(1.35, 0.44, focus);
    if (ringA.current) {
      ringA.current.position.x = -gap;
      ringA.current.material.opacity = 0.4 + focus * 0.42;
    }
    if (ringB.current) {
      ringB.current.position.x = gap;
      ringB.current.material.opacity = 0.4 + focus * 0.42;
    }
  });

  return (
    <group>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.075}
          sizeAttenuation={false}
          color="#232A2A"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </points>

      <mesh ref={ringA} position={[-1.35, 0, 0.1]}>
        <ringGeometry args={[0.95, 1.03, 64]} />
        <meshBasicMaterial color="#F19020" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringB} position={[1.35, 0, 0.1]}>
        <ringGeometry args={[0.95, 1.03, 64]} />
        <meshBasicMaterial color="#E54A25" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const LensField = () => {
  // The ref goes on the Canvas itself rather than a wrapper: this component's
  // root *is* the canvas, and introducing a wrapping div to hang an observer
  // off would change the DOM its parent lays out.
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
      <Field />
    </Canvas>
  );
};

export default LensField;
