"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lenis } from "./SmoothScroll";

/** Cream curtain: the puffy logo pops in, then the curtain rolls up on a wavy edge once the film is ready. */
export default function Intro({ ready }: { ready: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    lenis()?.stop();
    const t = setTimeout(() => setMinDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || !minDone || !root.current) return;
    const tl = gsap.timeline({
      onComplete: () => {
        setGone(true);
        lenis()?.start();
      },
    });
    tl.to("[data-intro-logo]", { y: -40, opacity: 0, duration: 0.5, ease: "power3.in" }).to(
      root.current,
      { yPercent: -100, duration: 1.1, ease: "expo.inOut" },
      0.25,
    );
  }, [ready, minDone]);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[80] bg-paper" aria-hidden>
      <div className="absolute bottom-[12vh] left-5 md:left-[5vw]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-intro-logo src="/brand/logo.webp" alt="" className="w-[min(78vw,640px)] animate-[pop_.9s_cubic-bezier(.3,1.5,.5,1)_both]" />
      </div>
      {/* wavy bottom edge of the curtain */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 top-full h-[60px] w-full">
        <path d="M0 0 H1440 V30 C1260 80 1080 80 900 40 C720 0 540 0 360 40 C180 80 60 70 0 40 Z" fill="var(--paper)" />
      </svg>
    </div>
  );
}
