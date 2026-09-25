"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type LenisWindow = Window & { __lenis?: Lenis };

export function lenis() {
  return typeof window === "undefined" ? undefined : (window as LenisWindow).__lenis;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const l = lenis();
  if (l) l.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** One Lenis instance driven by GSAP's ticker so every scroll animation shares a clock. */
export default function SmoothScroll() {
  useEffect(() => {
    const l = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    (window as LenisWindow).__lenis = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      delete (window as LenisWindow).__lenis;
    };
  }, []);
  return null;
}
