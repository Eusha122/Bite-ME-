"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cuisines } from "@/config/menu";

/** Smooth sine-ish edge built from cubic curves. flip=true draws the wave on the bottom edge. */
function wavePath(width: number, height: number, phase: number, amp: number, flip: boolean) {
  const segs = 4;
  const seg = width / segs;
  const mid = height / 2;
  const y = (i: number) => mid + Math.sin(i * Math.PI + phase) * amp;
  let d = `M0 ${y(0).toFixed(1)}`;
  for (let i = 0; i < segs; i++) {
    const x0 = i * seg;
    const x1 = x0 + seg;
    d += ` C${(x0 + seg * 0.5).toFixed(1)} ${y(i).toFixed(1)} ${(x1 - seg * 0.5).toFixed(1)} ${y(i + 1).toFixed(1)} ${x1.toFixed(1)} ${y(i + 1).toFixed(1)}`;
  }
  return flip ? `${d} L${width} 0 L0 0 Z` : `${d} L${width} ${height} L0 ${height} Z`;
}

/** A wavy edge that keeps breathing and rolls with scroll. */
export function WaveEdge({ color, flip = false, className = "" }: { color: string; flip?: boolean; className?: string }) {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const W = 1440;
    const H = 90;
    const tick = (time: number) => {
      const phase = time * 0.6 + window.scrollY * 0.004;
      const amp = 22 + Math.sin(time * 0.4) * 8;
      path.current?.setAttribute("d", wavePath(W, H, phase, amp, flip));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [flip]);
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={`block h-[56px] w-full md:h-[90px] ${className}`} aria-hidden>
      <path ref={path} fill={color} />
    </svg>
  );
}

/** Tomato band with wavy edges and the six kitchens rolling past in puffy type. */
export default function WaveBand({ bg = "var(--paper)" }: { bg?: string }) {
  const names = cuisines.filter((c) => c.id !== "drinks");
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {names.map((c) => (
        <span key={c.id} className="flex items-center gap-10">
          <span className="puff puff-paper text-step-6 md:text-step-7">{c.name}</span>
          <span className="font-bangla text-step-3 font-bold text-mustard">{c.bn}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: bg }} aria-hidden>
      <WaveEdge color="var(--tomato)" />
      <div className="-my-px overflow-hidden bg-tomato py-6 md:py-10">
        <div className="flex w-max animate-[marquee_32s_linear_infinite]">
          {row}
          {row}
        </div>
      </div>
      <WaveEdge color="var(--tomato)" flip />
    </div>
  );
}
