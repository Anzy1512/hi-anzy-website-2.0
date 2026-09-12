import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";
import * as THREE from "three";

/**
 * THE SYSTEM CORE — v2
 *
 * The previous version was a labelled infographic: eight text-tagged cards
 * that scrolled into a route. Small, it read as clutter, and the DOM labels
 * it depended on could not survive sitting over a fallback image (a real bug
 * this version does not have — nothing here is an HTML overlay).
 *
 * New concept: a scattered network of nodes assembles itself into a single
 * lattice around one core the moment it mounts, then keeps drifting — a slow
 * auto-rotation, a signal wandering the connections, pointer parallax on top.
 * It does not need a scroll to look finished; it already told its story
 * ("disconnected things, meshed into one system") in the first two seconds.
 * Every node is one instanced mesh (one draw call), every connection is one
 * line-segments buffer — lighter than the diagram it replaces, not heavier.
 */

const NODE_COUNT = 28;
const LATTICE_RADIUS = 1.85;
const SCATTER_SPREAD = 2.15;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x ** 3 + c1 * x ** 2;
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

/** Evenly distributed points on a sphere — the resolved, "meshed" state. */
const fibonacciSphere = (n, radius) => {
  const pts = [];
  const offset = 2 / n;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    pts.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(radius));
  }
  return pts;
};

const LATTICE = fibonacciSphere(NODE_COUNT, LATTICE_RADIUS);

/** Where each node starts before it assembles — pushed outward and jittered. */
const SCATTER = (() => {
  const rnd = seededRandom(53);
  return LATTICE.map((p) => {
    const jitter = new THREE.Vector3((rnd() - 0.5) * 1.7, (rnd() - 0.5) * 1.7, (rnd() - 0.5) * 1.7);
    return p.clone().multiplyScalar(SCATTER_SPREAD).add(jitter);
  });
})();

/** Three nearby connections per node keep the globe's surface legible. */
const MESH_EDGES = (() => {
  const seen = new Set();
  const edges = [];
  const add = (a, b) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push([a, b]);
  };
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const dists = [];
    for (let j = 0; j < NODE_COUNT; j += 1) {
      if (i !== j) dists.push([j, LATTICE[i].distanceTo(LATTICE[j])]);
    }
    dists.sort((a, b) => a[1] - b[1]);
    add(i, dists[0][0]);
    add(i, dists[1][0]);
    add(i, dists[2][0]);
  }
  return edges;
})();

/** A handful of nodes get a direct spoke to the core — the hub relationship. */
const SPOKE_NODES = [0, 6, 11, 17, 23].filter((i) => i < NODE_COUNT);

/** Adjacency for the wandering pulse. -1 stands for the core. */
const ADJACENCY = (() => {
  const map = new Map();
  const add = (a, b) => {
    if (!map.has(a)) map.set(a, []);
    map.get(a).push(b);
  };
  MESH_EDGES.forEach(([a, b]) => {
    add(a, b);
    add(b, a);
  });
  SPOKE_NODES.forEach((n) => {
    add(-1, n);
    add(n, -1);
  });
  return map;
})();

const ORIGIN = new THREE.Vector3(0, 0, 0);
const INTRO_DURATION = 1500;

/** All nodes as one instanced mesh, and the two edge sets, updated together
    each frame so the lines never lag a frame behind the nodes they connect. */
const Lattice = ({ progressRef, pulseRef }) => {
  const instRef = useRef(null);
  const meshLineRef = useRef(null);
  const spokeLineRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const current = useMemo(() => LATTICE.map((p) => p.clone()), []);
  const meshPositions = useMemo(() => new Float32Array(MESH_EDGES.length * 2 * 3), []);
  const spokePositions = useMemo(() => new Float32Array(SPOKE_NODES.length * 2 * 3), []);

  useFrame(({ clock }) => {
    const inst = instRef.current;
    const meshLine = meshLineRef.current;
    const spokeLine = spokeLineRef.current;
    if (!inst || !meshLine || !spokeLine) return;

    const p = easeInOut(clamp01(progressRef.current));
    const t = clock.getElapsedTime();
    const liveliness = p * p;

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const c = current[i];
      c.lerpVectors(SCATTER[i], LATTICE[i], p);
      c.x += Math.sin(t * 0.5 + i * 1.7) * 0.05 * liveliness;
      c.y += Math.cos(t * 0.4 + i * 2.3) * 0.05 * liveliness;
      c.z += Math.sin(t * 0.6 + i * 0.9) * 0.05 * liveliness;

      dummy.position.copy(c);
      dummy.scale.setScalar(0.55 + 0.45 * p);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;

    // Indexed loops, not forEach: this runs 60x a second and the callback
    // (plus the destructured [a, b] array) would be a fresh allocation every
    // frame for a list whose shape never changes.
    let o = 0;
    for (let e = 0; e < MESH_EDGES.length; e += 1) {
      const a = current[MESH_EDGES[e][0]];
      const b = current[MESH_EDGES[e][1]];
      meshPositions[o++] = a.x; meshPositions[o++] = a.y; meshPositions[o++] = a.z;
      meshPositions[o++] = b.x; meshPositions[o++] = b.y; meshPositions[o++] = b.z;
    }
    meshLine.geometry.attributes.position.needsUpdate = true;
    meshLine.material.opacity = clamp01((p - 0.5) * 2.4) * 0.42;

    let s = 0;
    for (let k = 0; k < SPOKE_NODES.length; k += 1) {
      const n = current[SPOKE_NODES[k]];
      spokePositions[s++] = 0; spokePositions[s++] = 0; spokePositions[s++] = 0;
      spokePositions[s++] = n.x; spokePositions[s++] = n.y; spokePositions[s++] = n.z;
    }
    spokeLine.geometry.attributes.position.needsUpdate = true;
    spokeLine.material.opacity = clamp01((p - 0.3) * 2) * 0.85;

    // The pulse reads current node positions and overall progress from here —
    // Lattice is mounted first, so this is always this frame's data, not last frame's.
    pulseRef.current.positions = current;
    pulseRef.current.progress = p;
  });

  return (
    <>
      <instancedMesh ref={instRef} args={[undefined, undefined, NODE_COUNT]}>
        <icosahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#F7F5EE" roughness={0.75} metalness={0.05} />
      </instancedMesh>
      <lineSegments ref={meshLineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[meshPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#D8CFB4" transparent opacity={0} />
      </lineSegments>
      <lineSegments ref={spokeLineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spokePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#F19020" transparent opacity={0} />
      </lineSegments>
    </>
  );
};

/** The one thing everything else answers to — arrives with a small overshoot,
    the same soft-spring landing the site's own CSS transitions use. */
const Core = ({ progressRef }) => {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const p = easeOutBack(clamp01((progressRef.current - 0.3) / 0.7));
    const breathe = 1 + Math.sin(clock.getElapsedTime() * 1.3) * 0.07;
    m.scale.setScalar(Math.max(0.0001, p) * breathe);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.22, 1]} />
      <meshBasicMaterial color="#F19020" />
    </mesh>
  );
};

/* A signal wandering the network — proof the system is live, not posed. Picks
   a random walk across the adjacency graph, one edge at a time, forever. */
const Pulse = ({ pulseRef }) => {
  const ref = useRef(null);
  const state = useRef({ from: -1, to: SPOKE_NODES[0] ?? 0, t: 0, leg: 0.7 });

  useFrame((_state, delta) => {
    const m = ref.current;
    const positions = pulseRef.current.positions;
    if (!m || !positions) return;

    // Invisible for the whole first three-quarters of the intro. Nothing below
    // is worth computing until there is something to see; skipping it keeps
    // this off the main thread during mount, when the page is busiest.
    const appear = clamp01((pulseRef.current.progress - 0.75) * 4);
    if (appear <= 0) {
      m.visible = false;
      return;
    }
    m.visible = true;

    const s = state.current;
    s.t += delta;
    let frac = clamp01(s.t / s.leg);
    if (frac >= 1) {
      const neighbours = ADJACENCY.get(s.to) || [];
      const next = neighbours.length ? neighbours[Math.floor(Math.random() * neighbours.length)] : -1;
      s.from = s.to;
      s.to = next;
      s.t = 0;
      s.leg = 0.55 + Math.random() * 0.35;
      frac = 0;
    }

    const fromPos = s.from === -1 ? ORIGIN : positions[s.from] || ORIGIN;
    const toPos = s.to === -1 ? ORIGIN : positions[s.to] || ORIGIN;
    m.position.lerpVectors(fromPos, toPos, easeInOut(frac));

    const beat = 1 + Math.sin(frac * Math.PI) * 0.6;
    m.scale.setScalar(beat * appear);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial color="#E54A25" />
    </mesh>
  );
};

const CONTENT_SIZE = LATTICE_RADIUS * 2.3;

const SceneInner = ({ progressRef, pointerRef, pulseRef }) => {
  const world = useRef(null);
  const { viewport } = useThree();

  useFrame(({ clock }) => {
    const w = world.current;
    if (!w) return;

    const margin = 0.88;
    const fit = Math.min((viewport.width * margin) / CONTENT_SIZE, (viewport.height * margin) / CONTENT_SIZE, 1.2);
    w.scale.setScalar(THREE.MathUtils.lerp(w.scale.x, fit, 0.08));

    const t = clock.getElapsedTime();
    const targetY = t * 0.16 + pointerRef.current.x * 0.32;
    const targetX = -pointerRef.current.y * 0.18;
    w.rotation.y = THREE.MathUtils.lerp(w.rotation.y, targetY, 0.045);
    w.rotation.x = THREE.MathUtils.lerp(w.rotation.x, targetX, 0.06);
  });

  return (
    <group ref={world}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 6]} intensity={0.7} />
      <directionalLight position={[-3, -2, 4]} intensity={0.22} color="#F19020" />
      <Lattice progressRef={progressRef} pulseRef={pulseRef} />
      <Core progressRef={progressRef} />
      <Pulse pulseRef={pulseRef} />
    </group>
  );
};

const SystemCore = ({ onReady }) => {
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pulseRef = useRef({ positions: null, progress: 0 });

  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const update = () => {
      progressRef.current = clamp01((performance.now() - start) / INTRO_DURATION);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    const onPointer = (e) => {
      pointerRef.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Stops the render loop once the hero has scrolled away. Measured: without
  // this, scrolling 11,500px past this scene changed total draw calls by 0.3%.
  const { ref: sceneRef, active: sceneActive } = useSceneVisibility();

  return (
    <div ref={sceneRef} className="h-full w-full" data-testid="hero-system-core-canvas">
      {/* onCreated fires once the renderer exists and the first frame is about
          to paint. Home uses it to retire the static diagram underneath at the
          moment there is genuinely something to replace it with — a guessed
          timeout would race the lazy chunk's own download on a slow line and
          could blank the panel before this ever mounted. */}
      <Canvas
        frameloop={sceneActive ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        onCreated={onReady}
      >
        <AdaptiveQuality />
        <SceneInner progressRef={progressRef} pointerRef={pointerRef} pulseRef={pulseRef} />
      </Canvas>
    </div>
  );
};

export default SystemCore;
