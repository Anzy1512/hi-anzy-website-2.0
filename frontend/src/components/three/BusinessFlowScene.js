import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AdaptiveQuality } from "@/components/three/AdaptiveQuality";
import { useSceneVisibility } from "@/components/three/useSceneVisibility";

const ORANGE = "#ff9e35";
const LAYER_Y = [1.22, 0.61, 0, -0.61, -1.22];
const LAYER_COLORS = ["#e8dec4", "#c9cfbc", "#a6b4a9", "#82958b", "#657e75"];

function roundedRectangle(path, width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  return path;
}

function makePlateGeometry() {
  const shape = roundedRectangle(new THREE.Shape(), 3.48, 2.26, 0.19);
  const opening = new THREE.Path();
  opening.absarc(0, 0, 0.31, 0, Math.PI * 2, true);
  shape.holes.push(opening);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 12,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.055, 0);
  return geometry;
}

const CIRCUIT_SEGMENTS = new Float32Array([
  -0.36, 0.094, 0, -0.83, 0.094, 0,
  -0.83, 0.094, 0, -1.12, 0.094, -0.48,
  -1.12, 0.094, -0.48, -1.43, 0.094, -0.48,
  0.36, 0.094, 0, 0.83, 0.094, 0,
  0.83, 0.094, 0, 1.13, 0.094, 0.48,
  1.13, 0.094, 0.48, 1.43, 0.094, 0.48,
  0, 0.094, -0.37, 0, 0.094, -0.7,
  0, 0.094, -0.7, 0.76, 0.094, -0.7,
]);

function Layer({ index, selected, reducedMotion, geometry, outline }) {
  const group = useRef(null);
  const surface = useRef(null);
  const targetColor = useMemo(() => new THREE.Color(), []);
  const y = LAYER_Y[index] + (selected ? 0.09 : 0);

  useFrame((_state, delta) => {
    if (!group.current || !surface.current) return;
    const ease = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 8);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, y, ease);
    targetColor.set(selected ? "#f4bb64" : LAYER_COLORS[index]);
    surface.current.color.lerp(targetColor, ease);
  });

  return (
    <group ref={group} position={[0, y, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={surface}
          color={selected ? "#f4bb64" : LAYER_COLORS[index]}
          roughness={0.37}
          metalness={0.38}
          emissive={selected ? "#b85d0d" : "#18271f"}
          emissiveIntensity={selected ? 0.17 : 0.02}
        />
      </mesh>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color={selected ? "#ffce84" : "#d3e1c9"} transparent opacity={selected ? 0.82 : 0.3} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[CIRCUIT_SEGMENTS, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={selected ? "#63380e" : "#1f4437"} transparent opacity={0.65} />
      </lineSegments>
      {/* Light is carried along the front edge, so every layer stays legible. */}
      <mesh position={[0.35, 0.007, 1.169]}>
        <boxGeometry args={[selected ? 2.05 : 0.72, 0.036, 0.014]} />
        <meshBasicMaterial color={selected ? "#ffd495" : ORANGE} transparent opacity={selected ? 1 : 0.8} />
      </mesh>
      <mesh position={[-1.25, 0.11, 0.68]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.035, 0.061, 12]} />
        <meshBasicMaterial color={selected ? "#673e17" : "#254e3f"} />
      </mesh>
      <mesh position={[1.43, 0.1, 0.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.036, 12]} />
        <meshBasicMaterial color={selected ? "#63380e" : "#1f4437"} />
      </mesh>
      <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.332, 0.355, 40]} />
        <meshBasicMaterial color={selected ? "#ffdb9e" : ORANGE} />
      </mesh>
      {/* Five small registration marks make the stack read as one designed object. */}
      {Array.from({ length: 5 }, (_, mark) => (
        <mesh key={mark} position={[-1.4 + mark * 0.13, 0.011, 1.173]}>
          <boxGeometry args={[0.055, 0.033, 0.018]} />
          <meshBasicMaterial color={mark === index ? "#ffce80" : "#364c41"} />
        </mesh>
      ))}
    </group>
  );
}

function Architecture({ activeStep, reducedMotion, onReady }) {
  const world = useRef(null);
  const signal = useRef(null);
  const time = useRef(0);
  const ready = useRef(false);
  const { viewport, invalidate } = useThree();
  const geometry = useMemo(makePlateGeometry, []);
  const outline = useMemo(() => new THREE.EdgesGeometry(geometry, 32), [geometry]);
  const fit = Math.min(viewport.width * 0.87 / 4.7, viewport.height * 0.88 / 4.75);

  useEffect(() => () => {
    geometry.dispose();
    outline.dispose();
  }, [geometry, outline]);

  useEffect(() => { invalidate(); }, [activeStep, reducedMotion, invalidate]);

  useFrame(({ pointer }, delta) => {
    if (!world.current) return;
    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
    if (reducedMotion) {
      world.current.rotation.set(0, 0, 0);
      return;
    }
    const step = Math.min(delta, 0.05);
    time.current += step;
    const ease = 1 - Math.exp(-step * 3.2);
    const targetY = pointer.x * 0.14 + Math.sin(time.current * 0.18) * 0.055 + (activeStep - 2) * 0.018;
    world.current.rotation.y = THREE.MathUtils.lerp(world.current.rotation.y, targetY, ease);
    world.current.rotation.x = THREE.MathUtils.lerp(world.current.rotation.x, pointer.y * 0.035, ease);
    if (signal.current) signal.current.position.y = -1.63 + ((time.current * 0.42) % 1) * 3.38;
  });

  return (
    <>
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#fff2d6", "#19392b", 1.6]} />
      <directionalLight position={[3, 7, 5]} intensity={3.4} color="#fff3d6" />
      <directionalLight position={[-4, 2, -3]} intensity={2.1} color="#b8d8ca" />
      <pointLight position={[1, -0.1, 2.5]} intensity={5} color={ORANGE} distance={6} decay={2} />
      <group ref={world} scale={fit} position={[0, 0.08, 0]}>
        <mesh position={[0, -1.88, 0]} scale={[2.75, 1, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color="#070e0b" transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <mesh position={[0, -1.71, 0]}>
          <boxGeometry args={[2.92, 0.13, 1.8]} />
          <meshStandardMaterial color="#273d33" roughness={0.55} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 3.52, 32]} />
          <meshStandardMaterial color="#df7517" roughness={0.25} metalness={0.7} emissive="#ee7317" emissiveIntensity={0.65} />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.11, 32]} />
          <meshStandardMaterial color="#ffe0a4" metalness={0.65} roughness={0.2} emissive="#ff9e35" emissiveIntensity={0.18} />
        </mesh>
        {[[-1.36, -0.8], [1.36, -0.8]].map(([x, z]) => (
          <mesh key={x} position={[x, -0.13, z]}>
            <cylinderGeometry args={[0.016, 0.016, 3.15, 8]} />
            <meshStandardMaterial color="#d3b578" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {LAYER_Y.map((_y, index) => (
          <Layer key={index} index={index} selected={index === activeStep} reducedMotion={reducedMotion} geometry={geometry} outline={outline} />
        ))}
        <mesh ref={signal} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.224, 0.026, 8, 32]} />
          <meshBasicMaterial color="#ffedc6" />
        </mesh>
      </group>
    </>
  );
}

export default function BusinessFlowScene({ activeStep = 0, reducedMotion = false, onReady }) {
  const { ref, active } = useSceneVisibility({ rootMargin: "120px" });
  const selected = Number.isFinite(activeStep) ? Math.max(0, Math.min(4, Math.round(activeStep))) : 0;

  return (
    <div ref={ref} className="h-full w-full" data-testid="business-flow-scene" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [5.8, 5.2, 7], zoom: 62, near: 0.1, far: 50 }}
        frameloop={active ? (reducedMotion ? "demand" : "always") : "never"}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        {!reducedMotion && <AdaptiveQuality />}
        <Architecture activeStep={selected} reducedMotion={reducedMotion} onReady={onReady} />
      </Canvas>
    </div>
  );
}
