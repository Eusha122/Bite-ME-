"use client";

import { create } from "zustand";

export type Tier = "low" | "mid" | "high";

type DeviceState = {
  tier: Tier;
  reducedMotion: boolean;
  isTouch: boolean;
  isNarrow: boolean;
  ready: boolean;
  detect: () => void;
  degrade: () => void;
  upgrade: () => void;
};

/**
 * Cheap, synchronous capability guess. The canvas then refines it at runtime
 * with drei's PerformanceMonitor (degrade/upgrade) based on measured FPS.
 */
function guessTier(): Tier {
  if (typeof window === "undefined") return "mid";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const narrow = window.innerWidth < 768;
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("tier");
  if (forced === "low" || forced === "mid" || forced === "high") return forced;

  // WebGL availability + renderer string sniff for obvious low-end GPUs
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return "low";
    const dbg = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg
      ? String((gl as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : "";
    if (/Mali-4|Mali-T|Adreno \(TM\) [3-5]\d\d|PowerVR|SwiftShader|llvmpipe/i.test(renderer)) return "low";
  } catch {
    return "low";
  }

  if (cores <= 4 || mem <= 3) return "low";
  if (narrow || cores <= 6 || mem <= 4) return "mid";
  return "high";
}

export const useDevice = create<DeviceState>((set, get) => ({
  tier: "mid",
  reducedMotion: false,
  isTouch: false,
  isNarrow: false,
  ready: false,
  detect: () => {
    if (get().ready) return;
    set({
      tier: guessTier(),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      isTouch: window.matchMedia("(pointer: coarse)").matches,
      isNarrow: window.innerWidth < 768,
      ready: true,
    });
  },
  degrade: () => set((s) => ({ tier: s.tier === "high" ? "mid" : "low" })),
  upgrade: () => set((s) => ({ tier: s.tier === "low" ? "mid" : "high" })),
}));

export const tierConfig = {
  low: { dpr: [1, 1.25] as [number, number], particles: 0.35, post: false, shadows: false, backdropBlur: false },
  mid: { dpr: [1, 1.5] as [number, number], particles: 0.65, post: true, shadows: false, backdropBlur: true },
  high: { dpr: [1, 2] as [number, number], particles: 1, post: true, shadows: true, backdropBlur: true },
};
