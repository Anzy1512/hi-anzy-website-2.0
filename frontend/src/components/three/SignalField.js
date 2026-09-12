import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";
import { Html, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";

/**
 * THE SIGNAL FIELD — /insights
 *
 * Five categories orbiting a core, the same node-and-branch grammar the
 * network constellation uses, but built to answer a different question.
 * The constellation asks "who do we bring in"; this one is about how a
 * single observation turns into a published note — so instead of static
 * branches, short pulses of light travel from the core out to a category
 * and back, a few at a time, never all at once. Reads as "still thinking",
 * which is the honest version of what a notebook actually looks like.
 */
const CATEGORIES = [
  "Business, Unpacked",
  "Brand, Decoded",
  "Tech, Without Theatre",
  "Growth, With Receipts",
  "Things We Noticed",
];

const mulberry = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const Node = ({ name, index, total }) => {
  const ref = useRef(null);
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const pos = useMemo(() => [Math.cos(angle) * 2.85, Math.sin(angle) * 1.75, 0], [angle]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.position.z = Math.sin(t * 0.6 + index) * 0.18;
  });
  return (
    <group ref={ref} position={pos}>
      <mesh>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial color="#F19020" emissive="#F19020" emissiveIntensity={0.55} roughness={0.35} metalness={0.3} />
      </mesh>
      {/* scale 0.19 * fontSize 15 rendered at roughly 3 real CSS pixels tall
          — unreadable. Bumped to a size actually verified against the live
          page's computed getBoundingClientRect, not just the prop math,
          since Html's transform mode also folds in camera distance/FOV. */}
      <Html center transform position={[0, 0.4, 0]} scale={0.4} pointerEvents="none" zIndexRange={[2, 0]}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: "0.05em", color: "#F7F5EE", whiteSpace: "nowrap" }}>
          {name.toUpperCase()}
        </div>
      </Html>
    </group>
  );
};

const Pulse = ({ target, delay }) => {
  const ref = useRef(null);
  const start = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const end = useMemo(() => new THREE.Vector3(...target), [target]);
  const mid = useMemo(() => new THREE.Vector3(target[0] * 0.5, target[1] * 0.5 + 0.35, 0.15), [target]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(start, mid, end), [start, mid, end]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const cycle = 3.6;
    const local = (clock.getElapsedTime() + delay) % (cycle * 2);
    const forward = local < cycle;
    const p = (forward ? local : local - cycle) / cycle;
    const pt = curve.getPoint(forward ? p : 1 - p);
    m.position.copy(pt);
    m.visible = true;
    const mat = m.material;
    mat.opacity = Math.sin(p * Math.PI) * 0.95;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshBasicMaterial color="#F7F5EE" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};

const Core = () => {
  const ring = useRef(null);
  const core = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.z = t * 0.25;
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
  });
  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.26, 28, 28]} />
        <meshStandardMaterial color="#F19020" emissive="#F19020" emissiveIntensity={0.75} roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh ref={ring} rotation={[0.5, 0, 0]}>
        <torusGeometry args={[0.5, 0.012, 8, 44]} />
        <meshBasicMaterial color="#F7F5EE" transparent opacity={0.32} />
      </mesh>
    </group>
  );
};

/* Faint ambient points, same recipe as the constellation's dust so the two
   scenes belong to the same visual family without sharing state. */
const Dust = () => {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const n = 46;
    const arr = new Float32Array(n * 3);
    const rnd = mulberry(7);
    for (let i = 0; i < n; i += 1) {
      arr[i * 3] = (rnd() - 0.5) * 8;
      arr[i * 3 + 1] = (rnd() - 0.5) * 5;
      arr[i * 3 + 2] = -2 - rnd() * 3;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#F7F5EE" size={0.035} sizeAttenuation transparent opacity={0.3} depthWrite={false} />
    </points>
  );
};

const SceneInner = () => {
  const targets = useMemo(
    () =>
      CATEGORIES.map((_, i) => {
        const a = (i / CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
        return [Math.cos(a) * 2.85, Math.sin(a) * 1.75, 0];
      }),
    []
  );
  return (
    <group>
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 3, 5]} intensity={22} color="#FFD9A8" />
      <pointLight position={[-5, -2, 3]} intensity={9} color="#8FB6C4" />
      <Dust />
      <Core />
      {CATEGORIES.map((c, i) => (
        <Node key={c} name={c} index={i} total={CATEGORIES.length} />
      ))}
      {targets.map((target, i) => (
        <QuadraticBezierLine
          key={`branch-${i}`}
          start={[0, 0, 0]}
          end={target}
          mid={[target[0] * 0.5, target[1] * 0.5 + 0.35, 0.15]}
          color="#F19020"
          lineWidth={1}
          transparent
          opacity={0.22}
        />
      ))}
      {targets.map((target, i) => (
        <Pulse key={`pulse-${i}`} target={target} delay={i * 1.3} />
      ))}
    </group>
  );
};

export const SignalField = () => {
  const { ref, active } = useSceneVisibility();
  return (
    <div ref={ref} className="h-full w-full" data-testid="insights-signal-field-canvas">
      <Canvas frameloop={active ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 6.4], fov: 44 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <AdaptiveQuality />
        <SceneInner />
      </Canvas>
    </div>
  );
};

export default SignalField;
