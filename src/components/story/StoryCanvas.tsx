"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor, Preload } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";
import { chapters } from "@/config/chapters";
import { useDevice, tierConfig } from "@/lib/device";
import { useStory } from "@/lib/story";
import { scrollState } from "@/lib/scroll";
import CameraRig from "./CameraRig";
import World from "./World";
import TableWorld from "./TableWorld";
import Portals from "./Portals";
import { stationPos } from "./path";
import SafeBoundary from "../SafeBoundary";

function Effects({ strong }: { strong: boolean }) {
  const ca = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new THREE.Vector2(0, 0), []);
  // lens fringing that swells with scroll speed — reads as "warp" between chapters
  useFrame(() => {
    const v = Math.min(Math.abs(scrollState.velocity) * 0.00009, 0.004);
    offset.set(v, v * 0.6);
    if (ca.current) ca.current.offset = offset;
  });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={strong ? 1.1 : 0.8} luminanceThreshold={0.78} luminanceSmoothing={0.2} radius={0.75} />
      <ChromaticAberration ref={ca} offset={offset} radialModulation={false} modulationOffset={0} blendFunction={BlendFunction.NORMAL} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}

export default function StoryCanvas() {
  const tier = useDevice((s) => s.tier);
  const degrade = useDevice((s) => s.degrade);
  const upgrade = useDevice((s) => s.upgrade);
  const active = useStory((s) => s.canvasActive);
  const cfg = tierConfig[tier];
  const stations = useMemo(() => chapters.map((_, i) => stationPos(i)), []);

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={cfg.dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: tier !== "low", powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 38, near: 0.1, far: 120, position: [0, 2, 8] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <PerformanceMonitor onDecline={degrade} onIncline={upgrade} flipflops={3} />
      <AdaptiveDpr pixelated={false} />
      <CameraRig />

      {/* studio reflections for the GLB dishes — generated locally, no HDRI download */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.2} color="#ffd6a0" position={[-4, 5, 3]} scale={[6, 3, 1]} form="rect" />
        <Lightformer intensity={1.2} color="#9ab4ff" position={[5, 2, -3]} scale={[4, 4, 1]} form="circle" />
        <Lightformer intensity={0.8} color="#ffffff" position={[0, 6, -6]} scale={[10, 1, 1]} form="rect" />
      </Environment>

      {chapters.map((c, i) =>
        c.world === "table" ? (
          <SafeBoundary key={c.id}>
            <TableWorld chapter={c} index={i} position={stations[i]} />
          </SafeBoundary>
        ) : (
          <SafeBoundary key={c.id}>
            <World chapter={c} index={i} position={stations[i]} />
          </SafeBoundary>
        ),
      )}
      <Portals />

      {cfg.post && <Effects strong={tier === "high"} />}
      <Suspense fallback={null}>
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
