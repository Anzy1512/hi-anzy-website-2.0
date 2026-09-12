import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";
import { Html, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";

/* Cluster geometry constants — shared by the scene and the auto-fit solver so
   the two can never drift apart. */
const RING_X = 3.4;
const RING_Y = 2.1;
const ACTIVE_SCALE = 1.45;
/* Rough world-space half-width of an Html label, derived from its font metrics
   (Rajdhani ~0.115 world units per character at the label's authored scale). */
const labelHalfWidth = (text, perChar, pad) => (String(text).length * perChar + pad) / 2;

/**
 * THE NETWORK CONSTELLATION
 * hiAnzy central; discipline clusters orbit. Selecting a category expands
 * its cluster and routes it to the centre. Controlled entirely from the
 * accessible DOM category list — the scene is never the only source of info.
 */

const mulberry = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* The same branch fan powers both a committed selection and a hover preview.
   Hover stays light and close to the node; selection raises the labels and
   lines so the relationship can be read before the visitor chooses to move
   on to the detailed directory. */
const SubBranchFan = ({ subs = [], active = false, hovered = false }) => {
  if ((!active && !hovered) || !subs.length) return null;
  const visible = subs.slice(0, 6);
  const total = Math.min(subs.length, 6);
  return (
    <>
      {visible.map((s, j) => {
        const angle = ((j / Math.max(total - 1, 1)) - 0.5) * Math.PI * 0.85 + Math.PI / 2;
        const sx = Math.cos(angle) * 1.35;
        const sy = -Math.sin(angle) * 0.95 - 0.35;
        const emphasis = active ? 1 : 0.64;
        return (
          <group key={s}>
            <QuadraticBezierLine
              start={[0, 0, 0]}
              end={[sx, sy, 0.15]}
              mid={[sx * 0.5, sy * 0.5 - 0.1, 0.1]}
              color="#F19020"
              lineWidth={active ? 1 : 0.8}
              transparent
              opacity={active ? 0.55 : 0.28}
            />
            <mesh position={[sx, sy, 0.15]}>
              <sphereGeometry args={[active ? 0.045 : 0.035, 16, 16]} />
              <meshStandardMaterial color="#F19020" emissive="#F19020" emissiveIntensity={active ? 0.6 : 0.35} roughness={0.4} metalness={0.2} transparent opacity={emphasis} />
            </mesh>
            <Html center transform position={[sx, sy - 0.22, 0.15]} scale={active ? 0.24 : 0.2} pointerEvents="none" zIndexRange={[3, 0]}>
              <div data-scene-label style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.08em", color: "#F7F5EE", background: active ? "rgba(29,36,36,0.88)" : "rgba(29,36,36,0.58)", border: "1px solid rgba(241,144,32,0.45)", borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap", pointerEvents: "none", opacity: emphasis, animation: "subFadeIn 0.5s ease both", animationDelay: `${j * 70}ms` }}>
                {s}
              </div>
              <style>{`@keyframes subFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </Html>
          </group>
        );
      })}
    </>
  );
};

const Cluster = ({ name, index, total, active, anyActive, subs = [], onSelect, onTouchTap }) => {
  const group = useRef(null);
  const labelRef = useRef(null);
  // Hover lives in a ref, not state — a re-render per pointer move would stall
  // the whole scene, and the frame loop reads it anyway.
  const hovered = useRef(false);
  // A second, state-backed flag just for the hover branch line below: it only
  // needs to mount/unmount on pointer enter/leave (not on every frame), so a
  // couple of re-renders per hover is cheap — nothing like the per-move cost
  // the ref above is avoiding.
  const [hoverBranch, setHoverBranch] = useState(false);
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const base = useMemo(() => new THREE.Vector3(Math.cos(angle) * RING_X, Math.sin(angle) * RING_Y, 0), [angle]);
  const dots = useMemo(() => {
    const rnd = mulberry(index * 97 + 13);
    return Array.from({ length: 5 }, () => [ (rnd() - 0.5) * 1.15, (rnd() - 0.5) * 0.85, (rnd() - 0.5) * 0.6 ]);
  }, [index]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const isHover = hovered.current && !active;
    // Hover leans the cluster forward and brightens it, so the scene answers the
    // pointer before you commit to a click.
    const targetScale = active ? 1.45 : isHover ? 1.2 : anyActive ? 0.72 : 1;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, targetScale, 0.08));
    const tz = active ? 1.1 : isHover ? 0.45 : 0;
    g.position.set(base.x, base.y + Math.sin(t * 0.5 + index) * 0.07, THREE.MathUtils.lerp(g.position.z, tz, 0.08));
    if (labelRef.current) {
      labelRef.current.style.opacity = active || isHover ? "1" : anyActive ? "0.3" : "0.85";
      labelRef.current.style.letterSpacing = isHover || active ? "0.22em" : "0.16em";
    }
    const targetOpacity = active ? 1 : isHover ? 1 : anyActive ? 0.22 : 0.8;
    g.children.forEach((c) => {
      if (c.userData && c.userData.hit) return; // never surface the invisible click target
      if (!c.material) return;
      c.material.opacity = THREE.MathUtils.lerp(c.material.opacity, targetOpacity, 0.08);
      if (c.material.emissiveIntensity !== undefined) {
        const glow = active ? 0.85 : isHover ? 0.7 : c.material.color && c.material.color.getHex() === 0xf19020 ? 0.5 : 0.12;
        c.material.emissiveIntensity = THREE.MathUtils.lerp(c.material.emissiveIntensity, glow, 0.1);
      }
    });
  });

  return (
    <group ref={group} position={base.toArray()}>
      {/* Invisible hit target — lets visitors click a cluster to deep-dive its specialists */}
      {onSelect && (
        <mesh
          userData={{ hit: true }}
          onClick={(e) => {
            e.stopPropagation();
            // A touch is a navigation gesture on the page. Keep the canvas
            // from swallowing it to select a node; desktop pointer clicks
            // remain the deliberate "explore this discipline" action.
            const pointerType = e.nativeEvent?.pointerType || e.pointerType;
            if (pointerType === "touch") {
              if (onTouchTap) onTouchTap(name);
              return;
            }
            onSelect(name);
          }}
          onPointerOver={(e) => { e.stopPropagation(); hovered.current = true; setHoverBranch(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { hovered.current = false; setHoverBranch(false); document.body.style.cursor = ""; }}
        >
          <sphereGeometry args={[0.75, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {/* Answers the pointer before a click: the same branch a selection draws
          (in SceneInner, in world space) previewed here on hover, in this
          cluster's own local space so it does not need the parent's layout
          math. Skipped once active — the real branch is already on screen. */}
      {hoverBranch && !active && (
        <QuadraticBezierLine
          start={[0, 0, 0]}
          end={[-base.x, -base.y, 0.6]}
          mid={[-base.x * 0.4, -base.y * 0.4 + 0.5, 0.3]}
          color="#F19020"
          lineWidth={1.6}
          transparent
          opacity={0.5}
        />
      )}
      {dots.map((d, i) => (
        <mesh key={i} position={d}>
          <sphereGeometry args={[i === 0 ? 0.11 : 0.065, 24, 24]} />
          <meshStandardMaterial
            color={i === 0 ? "#F19020" : "#F7F5EE"}
            emissive={i === 0 ? "#F19020" : "#F7F5EE"}
            emissiveIntensity={i === 0 ? 0.5 : 0.12}
            roughness={0.35}
            metalness={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      <Html center transform position={[0, 0.62, 0]} scale={0.3} pointerEvents="none" zIndexRange={[2, 0]}>
        <div data-scene-label ref={labelRef} style={{ transition: "opacity 0.4s ease", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: "0.16em", color: "#F7F5EE", whiteSpace: "nowrap", pointerEvents: "none" }}>{name.toUpperCase()}</div>
      </Html>
      <SubBranchFan subs={subs} active={active} hovered={hoverBranch && !active} />
    </group>
  );
};

const CenterNode = () => {
  const ring = useRef(null);
  const ring2 = useRef(null);
  const core = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.z = t * 0.3;
    if (ring2.current) {
      ring2.current.rotation.z = -t * 0.18;
      ring2.current.rotation.x = 0.9 + Math.sin(t * 0.4) * 0.15;
    }
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.06);
  });
  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial color="#F19020" emissive="#F19020" emissiveIntensity={0.85} roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh ref={ring} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.62, 0.015, 8, 48]} />
        <meshBasicMaterial color="#F19020" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring2} rotation={[0.9, 0, 0]}>
        <torusGeometry args={[0.86, 0.01, 8, 48]} />
        <meshBasicMaterial color="#F7F5EE" transparent opacity={0.28} />
      </mesh>
      <Html center transform position={[0, -0.85, 0]} scale={0.34} pointerEvents="none" zIndexRange={[2, 0]}>
        <div data-scene-label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "0.2em", color: "#F19020", whiteSpace: "nowrap", pointerEvents: "none" }}>hiAnzy</div>
      </Html>
    </group>
  );
};

/* A small "hi" mark, orbiting close to the core — the one un-labelled thing
   in the chamber, so it reads as a signature rather than another node. */
const HiOrbit = () => {
  const group = useRef(null);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime() * 0.42;
    const r = 1.08;
    g.position.set(Math.cos(t) * r, Math.sin(t) * r * 0.52 + 0.08, Math.sin(t * 1.7) * 0.3);
  });
  return (
    <group ref={group}>
      <Html center transform scale={0.2} pointerEvents="none" zIndexRange={[1, 0]}>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 21,
            color: "#F19020",
            textShadow: "0 0 9px rgba(241,144,32,0.55)",
            whiteSpace: "nowrap",
          }}
        >
          hi
        </div>
      </Html>
    </group>
  );
};

/* Ambient dust for the dark constellation chamber */
const Dust = () => {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const n = 70;
    const arr = new Float32Array(n * 3);
    let s = 21;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i += 1) {
      arr[i * 3] = (rnd() - 0.5) * 11;
      arr[i * 3 + 1] = (rnd() - 0.5) * 6.5;
      arr[i * 3 + 2] = -2 - rnd() * 4;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.012;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#F7F5EE" size={0.04} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
    </points>
  );
};

/* A quiet instrument panel behind the nodes: field lines, depth rings and a
   second dust layer make the constellation feel like a living system instead
   of a loose collection of dots. It stays behind the interaction layer and
   rotates slowly enough to read as atmosphere, not a competing animation. */
const BackgroundDetails = () => {
  const gridRef = useRef(null);
  const grid = useMemo(() => {
    const values = [];
    for (let x = -6; x <= 6; x += 1) values.push(x, -4, -3.4, x, 4, -3.4);
    for (let y = -4; y <= 4; y += 1) values.push(-6, y, -3.4, 6, y, -3.4);
    return new Float32Array(values);
  }, []);

  useFrame(({ clock }) => {
    if (!gridRef.current) return;
    gridRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.08) * 0.012;
    gridRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.16) * 0.025;
  });

  return (
    <group ref={gridRef} position={[0, 0, -3.4]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[grid, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#F7F5EE" transparent opacity={0.055} depthWrite={false} />
      </lineSegments>
      {[1.65, 2.5, 3.45, 4.4].map((radius, i) => (
        <mesh key={radius} scale={[1.45, 0.72, 1]} rotation={[0, 0, i % 2 ? 0.12 : -0.08]}>
          <ringGeometry args={[radius, radius + 0.012, 96]} />
          <meshBasicMaterial color={i === 1 ? "#F19020" : "#F7F5EE"} transparent opacity={i === 1 ? 0.12 : 0.045} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const SceneInner = ({ categories, active, subs, onSelect, onTouchTap }) => {
  const world = useRef(null);
  const activeIndex = categories.indexOf(active);
  const { viewport } = useThree();

  /**
   * Auto-fit: measure the real world-space bounds of everything on screen
   * (clusters, their labels, and the fan of an expanded cluster), then scale
   * and centre the whole group so it always sits inside the canvas with a
   * margin. This is what keeps labels from being clipped on narrow frames,
   * on mobile, and in full screen — at any aspect ratio.
   */
  const bounds = useMemo(() => {
    const n = categories.length || 1;
    // Seed with the centre node and its "hiAnzy" caption.
    let minX = -0.9;
    let maxX = 0.9;
    let minY = -1.15;
    let maxY = 0.9;

    categories.forEach((c, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * RING_X;
      const y = Math.sin(a) * RING_Y;
      const isActive = active === c;
      const s = isActive ? ACTIVE_SCALE : 1;

      const lw = labelHalfWidth(c, 0.115, 0.3) * s;
      minX = Math.min(minX, x - lw);
      maxX = Math.max(maxX, x + lw);
      minY = Math.min(minY, y - 0.55 * s);
      maxY = Math.max(maxY, y + 0.9 * s);

      if (!isActive) return;
      const list = (subs && subs[c]) || [];
      const m = Math.min(list.length, 6);
      list.slice(0, 6).forEach((sname, j) => {
        const sa = (j / Math.max(m - 1, 1) - 0.5) * Math.PI * 0.85 + Math.PI / 2;
        const sx = x + Math.cos(sa) * 1.35 * s;
        const sy = y + (-Math.sin(sa) * 0.95 - 0.35 - 0.22) * s;
        const sw = labelHalfWidth(sname, 0.092, 0.55) * s;
        minX = Math.min(minX, sx - sw);
        maxX = Math.max(maxX, sx + sw);
        minY = Math.min(minY, sy - 0.28 * s);
        maxY = Math.max(maxY, sy + 0.28 * s);
      });
    });

    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      w: Math.max(maxX - minX, 0.001),
      h: Math.max(maxY - minY, 0.001),
    };
  }, [categories, active, subs]);

  useFrame(({ clock }) => {
    const w = world.current;
    if (!w) return;

    const margin = 0.9; // keep ~10% breathing room inside the frame
    const fit = Math.min(
      (viewport.width * margin) / bounds.w,
      (viewport.height * margin) / bounds.h,
      1.25 // allow a little zoom-in when there is room (full screen readability)
    );
    const s = THREE.MathUtils.lerp(w.scale.x, fit, 0.08);
    w.scale.setScalar(s);
    w.position.x = THREE.MathUtils.lerp(w.position.x, -bounds.cx * fit, 0.08);
    w.position.y = THREE.MathUtils.lerp(w.position.y, -bounds.cy * fit, 0.08);

    const target = active ? 0 : Math.sin(clock.getElapsedTime() * 0.1) * 0.12;
    w.rotation.y = THREE.MathUtils.lerp(w.rotation.y, target, 0.04);
  });
  const activePos = useMemo(() => {
    if (activeIndex < 0) return null;
    const angle = (activeIndex / categories.length) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * 3.4, Math.sin(angle) * 2.1, 1.1];
  }, [activeIndex, categories.length]);
  return (
    <group ref={world}>
      {/* Aesthetic lighting — gives the node spheres real 3D shading */}
      <ambientLight intensity={0.55} />
      <pointLight position={[5, 4, 6]} intensity={26} color="#FFD9A8" />
      <pointLight position={[-6, -3, 4]} intensity={10} color="#8FB6C4" />
      <BackgroundDetails />
      <Dust />
      <CenterNode />
      <HiOrbit />
      {categories.map((c, i) => (
        <Cluster key={c} name={c} index={i} total={categories.length} active={active === c} anyActive={!!active} subs={(subs && subs[c]) || []} onSelect={onSelect} onTouchTap={onTouchTap} />
      ))}
      {activePos && (
        <QuadraticBezierLine key={active} start={[0, 0, 0]} end={activePos} mid={[activePos[0] * 0.4, activePos[1] * 0.4 + 0.7, 0.6]} color="#F19020" lineWidth={2.4} dashed={false} />
      )}
    </group>
  );
};

const Constellation = ({ categories = [], active = null, subs = null, onSelect = null, onTouchTap = null, immersive = false }) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const lastPointerType = useRef(null);
  // Renders on /network and again inside the home page's NetworkPreview, where
  // it sits far below the fold — without this it drew every frame regardless.
  const { ref: sceneRef, active: sceneActive } = useSceneVisibility();
  return (
    <div
      ref={sceneRef}
      className="h-full w-full"
      tabIndex={0}
      aria-label={immersive ? "Fullscreen network constellation. Hover a discipline to preview its sub-branches; select a discipline to reveal them in place." : "Network constellation. Hover or focus to animate; tap once to inspect a node; tap the same node again to continue to specialists."}
      // pan-y (not the R3F canvas default of none) so a finger landing on the
      // diagram can still scroll the page. Taps are handled as an explicit
      // two-step gesture by Network: first inspect, then continue.
      style={{ touchAction: "pan-y" }}
      onPointerDown={(event) => { lastPointerType.current = event.pointerType; }}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType !== "touch") setHovered(false); }}
      onFocus={() => { if (lastPointerType.current !== "touch") setFocused(true); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); lastPointerType.current = null; } }}
      data-testid="network-constellation-canvas"
    >
      <Canvas frameloop={sceneActive ? (hovered || focused || !!active ? "always" : "demand") : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 7.6], fov: 46 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent", touchAction: "pan-y" }}>
        <AdaptiveQuality boost={hovered || focused || !!active} />
        <SceneInner categories={categories} active={active} subs={subs} onSelect={onSelect} onTouchTap={onTouchTap} />
      </Canvas>
    </div>
  );
};

export default Constellation;
