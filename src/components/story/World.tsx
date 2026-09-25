"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter } from "@/config/chapters";
import { scrollState, localProgress } from "@/lib/scroll";
import { useDevice, tierConfig } from "@/lib/device";
import Particles from "./Particles";
import Hero from "./Hero";

/* ---------- shared helpers ---------- */

let _radial: THREE.Texture | null = null;
/** Soft radial gradient used for fake contact shadows, floor fades and glows. */
export function radialTexture() {
  if (_radial) return _radial;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _radial = new THREE.CanvasTexture(c);
  return _radial;
}

function Backdrop({ src, narrow }: { src: string; narrow: boolean }) {
  const tex = useTexture(`${src}${narrow ? "-sm" : ""}.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[-1.5, 4.2, -20]}>
      <planeGeometry args={[52, 29.25]} />
      <meshBasicMaterial map={tex} color="#9a948c" toneMapped={false} fog={false} />
    </mesh>
  );
}

function Stage({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const radial = useMemo(() => radialTexture(), []);
  useFrame((s) => {
    if (ring.current) (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(s.clock.elapsedTime * 2) * 0.15;
  });
  return (
    <group>
      {/* floor pool, fades into fog */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <circleGeometry args={[11, 48]} />
        <meshStandardMaterial color="#120d0a" roughness={0.28} metalness={0.4} alphaMap={radial} transparent depthWrite={false} />
      </mesh>
      {/* plinth */}
      <mesh position-y={0.04}>
        <cylinderGeometry args={[1.85, 1.95, 0.08, 64]} />
        <meshStandardMaterial color="#1b1511" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* glowing rim */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.085}>
        <ringGeometry args={[1.86, 1.93, 96]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent />
      </mesh>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.09}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={radial} color="#000" transparent opacity={0.65} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------- per-city set dressing (cheap, emissive, bloom-friendly) ---------- */

function Glow({ color, position, scale = 1 }: { color: string; position: [number, number, number]; scale?: number }) {
  const radial = useMemo(() => radialTexture(), []);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={radial} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0.55} />
    </sprite>
  );
}

function Lantern({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.8 + phase) * 0.06;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position-y={0.9}>
        <cylinderGeometry args={[0.006, 0.006, 1.8]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.32, 24, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <Glow color={color} position={[0, 0, 0]} scale={2.2} />
    </group>
  );
}

function Diya({ position }: { position: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame((s) => {
    if (flame.current) {
      const t = s.clock.elapsedTime * 9 + phase;
      flame.current.scale.set(1, 1 + Math.sin(t) * 0.15 + Math.sin(t * 2.3) * 0.08, 1);
    }
  });
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#8a4a22" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={flame} position-y={0.1}>
        <coneGeometry args={[0.035, 0.14, 12]} />
        <meshBasicMaterial color="#ffc46b" toneMapped={false} />
      </mesh>
      <Glow color="#ff9a3c" position={[0, 0.12, 0]} scale={0.7} />
    </group>
  );
}

function NeonTube({ position, rotation, color, length = 3 }: { position: [number, number, number]; rotation?: [number, number, number]; color: string; length?: number }) {
  return (
    <mesh position={position} rotation={rotation}>
      <capsuleGeometry args={[0.035, length, 4, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function Oven() {
  return (
    <group position={[2.8, 0, -4.5]}>
      <mesh>
        <sphereGeometry args={[2.1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#5a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 2.02]}>
        <circleGeometry args={[0.7, 32, 0, Math.PI]} />
        <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
      </mesh>
      <Glow color="#ff6a1a" position={[0, 0.7, 2.3]} scale={4} />
    </group>
  );
}

function Steamers() {
  return (
    <group position={[-2.9, 0, -2.5]}>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position-y={0.22 + k * 0.4}>
          <cylinderGeometry args={[0.75, 0.75, 0.38, 32, 1, true]} />
          <meshStandardMaterial color="#b8894a" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position-y={1.43}>
        <cylinderGeometry args={[0.02, 0.78, 0.22, 32]} />
        <meshStandardMaterial color="#a67a40" roughness={0.9} />
      </mesh>
    </group>
  );
}

function StringLights({ from, to, color, n = 14 }: { from: THREE.Vector3; to: THREE.Vector3; color: string; n?: number }) {
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const p = from.clone().lerp(to, t);
      p.y -= Math.sin(t * Math.PI) * 0.9;
      out.push([p.x, p.y, p.z]);
    }
    return out;
  }, [from, to, n]);
  return (
    <group>
      {pts.map((p, k) => (
        <mesh key={k} position={p}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function SetDressing({ world, palette, pScale }: { world: Chapter["world"]; palette: Chapter["palette"]; pScale: number }) {
  const n = (x: number) => Math.max(8, Math.round(x * pScale));
  switch (world) {
    case "dhaka":
      return (
        <>
          <Particles mode="rain" count={n(1400)} color={palette.particle} size={6} area={[22, 12, 14]} speed={1.4} opacity={0.35} position={[0, 0, -2]} />
          <Particles mode="steam" count={n(60)} color="#ffffff" size={9} area={[0.6, 2.6, 0.6]} speed={0.8} opacity={0.5} additive={false} position={[0, 1.5, 0]} />
          <StringLights from={new THREE.Vector3(-6, 4.6, -3)} to={new THREE.Vector3(5, 4.2, -5)} color="#ffcf8a" />
          <Glow color="#ffb45e" position={[-4.5, 3.6, -3]} scale={3} />
        </>
      );
    case "tokyo":
      return (
        <>
          <Particles mode="fall" count={n(160)} color={palette.particle} size={3.2} area={[14, 8, 10]} speed={1} opacity={0.8} additive={false} />
          <Particles mode="steam" count={n(70)} color="#ffffff" size={10} area={[0.7, 2.8, 0.7]} speed={0.7} opacity={0.55} additive={false} position={[0, 1.4, 0]} />
          <Lantern position={[-3.4, 3.4, -2]} color="#ff3b3b" />
          <Lantern position={[-2.1, 3.9, -3.5]} color="#ff5a3b" scale={0.8} />
          <Lantern position={[3.2, 3.6, -3]} color="#ff3b3b" scale={0.9} />
          <NeonTube position={[4.2, 1.8, -4]} color={palette.key} length={3.2} />
          <NeonTube position={[4.6, 1.5, -4.3]} color={palette.rim} length={2.4} />
        </>
      );
    case "delhi":
      return (
        <>
          <Particles mode="rise" count={n(260)} color={palette.particle} size={2.4} area={[10, 6, 8]} speed={1.1} opacity={0.9} />
          <Particles mode="float" count={n(220)} color="#ffcf7a" size={1.4} area={[12, 5, 8]} speed={1} opacity={0.5} />
          {Array.from({ length: 8 }).map((_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return <Diya key={k} position={[Math.cos(a) * 2.35, 0.02, Math.sin(a) * 2.35]} />;
          })}
        </>
      );
    case "naples":
      return (
        <>
          <Oven />
          <Particles mode="rise" count={n(220)} color="#ff9a4a" size={2.2} area={[4, 5, 3]} speed={1.3} opacity={0.9} position={[2.8, 0.6, -2.4]} />
          <Particles mode="fall" count={n(260)} color={palette.particle} size={1.1} area={[10, 6, 8]} speed={0.6} opacity={0.45} additive={false} />
        </>
      );
    case "canton":
      return (
        <>
          <Steamers />
          <Particles mode="steam" count={n(90)} color="#ffffff" size={12} area={[1.2, 3.5, 1.2]} speed={0.8} opacity={0.5} additive={false} position={[-2.9, 1.5, -2.5]} />
          <Particles mode="rise" count={n(320)} color={palette.particle} size={2.6} area={[6, 5, 4]} speed={1.6} opacity={0.9} position={[3.2, 0, -3]} />
          <Lantern position={[-1.2, 4, -4]} color="#ff2d2d" />
          <Lantern position={[2.4, 3.6, -3]} color="#ffb020" scale={0.85} />
        </>
      );
    case "brooklyn":
      return (
        <>
          <Particles mode="float" count={n(260)} color={palette.particle} size={1.6} area={[12, 6, 8]} speed={1} opacity={0.6} />
          <Particles mode="rise" count={n(120)} color="#ffd27a" size={2} area={[3, 3, 2]} speed={2} opacity={0.9} position={[0, 0.2, 0]} />
          <NeonTube position={[-4, 2.2, -3]} rotation={[0, 0, Math.PI / 2]} color={palette.rim} length={2.6} />
          <NeonTube position={[-4, 1.8, -3]} rotation={[0, 0, Math.PI / 2]} color={palette.key} length={2} />
          <mesh position={[3.6, 2.4, -4]}>
            <torusGeometry args={[0.9, 0.04, 12, 64]} />
            <meshBasicMaterial color={palette.rim} toneMapped={false} />
          </mesh>
        </>
      );
    default:
      return null;
  }
}

/* ---------- the chapter world ---------- */

export default function World({ chapter, index, position }: { chapter: Chapter; index: number; position: THREE.Vector3 }) {
  const group = useRef<THREE.Group>(null);
  const tier = useDevice((s) => s.tier);
  const narrow = useDevice((s) => s.isNarrow);
  const pScale = tierConfig[tier].particles;

  useFrame(() => {
    if (!group.current) return;
    const lp = localProgress(scrollState.smooth, index);
    group.current.visible = Math.abs(lp) < 1.15;
  });

  return (
    <group ref={group} position={position}>
      {chapter.backdrop && (
        <Suspense fallback={null}>
          <Backdrop src={chapter.backdrop} narrow={narrow} />
        </Suspense>
      )}
      <Stage color={chapter.palette.key} />
      <SetDressing world={chapter.world} palette={chapter.palette} pScale={pScale} />
      {chapter.hero && (
        <Suspense fallback={null}>
          <Hero item={chapter.hero} model={chapter.heroModel} />
        </Suspense>
      )}
    </group>
  );
}
