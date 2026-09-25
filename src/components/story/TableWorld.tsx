"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { tableDishes, type Chapter } from "@/config/chapters";
import { getItem, formatBDT } from "@/config/menu";
import { scrollState, localProgress } from "@/lib/scroll";
import { useStory, tableControl } from "@/lib/story";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";
import { useDevice, tierConfig } from "@/lib/device";
import Hero from "./Hero";
import Particles from "./Particles";
import { radialTexture } from "./World";
import SafeBoundary from "../SafeBoundary";

const RADIUS = 2.35;
const STEP = (Math.PI * 2) / tableDishes.length;

function Backdrop({ src, narrow }: { src: string; narrow: boolean }) {
  const tex = useTexture(`${src}${narrow ? "-sm" : ""}.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[0, 4.6, -20]}>
      <planeGeometry args={[52, 29.25]} />
      <meshBasicMaterial map={tex} color="#8a837a" toneMapped={false} fog={false} />
    </mesh>
  );
}

function Candle({ position, h = 0.5 }: { position: [number, number, number]; h?: number }) {
  const flame = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  const radial = useMemo(() => radialTexture(), []);
  useFrame((s) => {
    if (!flame.current) return;
    const t = s.clock.elapsedTime * 10 + phase;
    flame.current.scale.set(1, 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.7) * 0.06, 1);
    flame.current.position.x = Math.sin(t * 0.7) * 0.006;
  });
  return (
    <group position={position}>
      <mesh position-y={h / 2}>
        <cylinderGeometry args={[0.07, 0.07, h, 20]} />
        <meshStandardMaterial color="#f3e6cf" roughness={0.6} />
      </mesh>
      <mesh ref={flame} position-y={h + 0.07}>
        <coneGeometry args={[0.03, 0.12, 12]} />
        <meshBasicMaterial color="#ffd38a" toneMapped={false} />
      </mesh>
      <sprite position-y={h + 0.08} scale={[0.9, 0.9, 1]}>
        <spriteMaterial map={radial} color="#ffae4a" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0.6} />
      </sprite>
    </group>
  );
}

function Dish({ index, item, model }: { index: number; item: string; model?: string }) {
  const [hover, setHover] = useState(false);
  const add = useCart((s) => s.add);
  const active = useStory((s) => s.tableIndex === index);
  const data = getItem(item)!;
  const a = index * STEP;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (Math.abs(tableControl.drag) > 6) return; // was a drag, not a tap
    add(item);
    flyToCart(dishImage(item), { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
  };

  return (
    <group position={[Math.sin(a) * RADIUS, 0.18, Math.cos(a) * RADIUS]}>
      <mesh
        position-y={0.7}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <cylinderGeometry args={[0.95, 0.95, 1.6, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group scale={hover || active ? 1.08 : 1}>
        <Suspense fallback={null}>
          <SafeBoundary>
            <Hero item={item} model={model} size={1.55} spin={0.12} float={false} />
          </SafeBoundary>
        </Suspense>
      </group>
      {hover && (
        <Html position={[0, 2.05, 0]} center distanceFactor={7} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-4 py-2 text-sm text-cream backdrop-blur-md">
            <span className="font-display italic">{data.name}</span>
            <span className="ml-3 text-saffron">{formatBDT(data.price)}</span>
            <span className="ml-3 text-cream-dim">tap to add</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function TableWorld({ chapter, index, position }: { chapter: Chapter; index: number; position: THREE.Vector3 }) {
  const group = useRef<THREE.Group>(null);
  const susan = useRef<THREE.Group>(null);
  const narrow = useDevice((s) => s.isNarrow);
  const tier = useDevice((s) => s.tier);
  const setTableIndex = useStory((s) => s.setTableIndex);
  const lastIdx = useRef(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const radial = useMemo(() => radialTexture(), []);

  useFrame((_, dt) => {
    if (!group.current || !susan.current) return;
    const lp = localProgress(scrollState.smooth, index);
    group.current.visible = Math.abs(lp) < 1.15;
    if (!group.current.visible) return;

    // idle drift unless the guest is interacting
    if (!drag.current) tableControl.target += dt * 0.08;
    const r = susan.current.rotation;
    r.y = THREE.MathUtils.damp(r.y, -tableControl.target, 6, dt);

    // whichever dish faces the camera is "active"
    const n = tableDishes.length;
    const idx = ((Math.round(-r.y / STEP) % n) + n) % n;
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      setTableIndex(idx);
    }
  });

  return (
    <group ref={group} position={position}>
      {chapter.backdrop && (
        <Suspense fallback={null}>
          <SafeBoundary>
            <Backdrop src={chapter.backdrop} narrow={narrow} />
          </SafeBoundary>
        </Suspense>
      )}

      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.9}>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#0f0a07" roughness={0.4} metalness={0.3} alphaMap={radial} transparent depthWrite={false} />
      </mesh>

      {/* table */}
      <mesh position-y={-0.05} receiveShadow>
        <cylinderGeometry args={[3.4, 3.4, 0.14, 96]} />
        <meshStandardMaterial color="#3a2416" roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh position-y={-0.5}>
        <cylinderGeometry args={[0.35, 0.8, 0.8, 32]} />
        <meshStandardMaterial color="#24170f" roughness={0.6} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.025}>
        <ringGeometry args={[3.36, 3.41, 128]} />
        <meshBasicMaterial color={chapter.palette.rim} toneMapped={false} transparent opacity={0.7} />
      </mesh>

      {/* the lazy susan */}
      <group
        ref={susan}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: tableControl.target };
          tableControl.drag = 0;
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          tableControl.drag = dx;
          tableControl.target = drag.current.start - dx * 0.006;
        }}
        onPointerUp={() => {
          drag.current = null;
          // snap to the nearest dish
          tableControl.target = Math.round(tableControl.target / STEP) * STEP;
        }}
        onPointerLeave={() => {
          if (drag.current) {
            drag.current = null;
            tableControl.target = Math.round(tableControl.target / STEP) * STEP;
          }
        }}
      >
        <mesh position-y={0.06}>
          <cylinderGeometry args={[2.95, 2.95, 0.06, 96]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.3} metalness={0.15} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
          <ringGeometry args={[2.9, 2.95, 128]} />
          <meshBasicMaterial color="#e9c27a" toneMapped={false} />
        </mesh>
        {tableDishes.map((d, k) => (
          <Dish key={d.item} index={k} item={d.item} model={d.model} />
        ))}
      </group>

      {/* candles in the centre */}
      <Candle position={[0, 0.02, 0]} h={0.62} />
      <Candle position={[0.28, 0.02, 0.16]} h={0.42} />
      <Candle position={[-0.24, 0.02, 0.2]} h={0.34} />

      <Particles mode="float" count={Math.round(180 * tierConfig[tier].particles)} color={chapter.palette.particle} size={1.3} area={[12, 5, 10]} opacity={0.5} />
    </group>
  );
}
