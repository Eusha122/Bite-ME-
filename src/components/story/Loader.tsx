"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useStory } from "@/lib/story";
import { site } from "@/config/site";

const MIN_MS = 2200;

export default function Loader({ webgl }: { webgl: boolean }) {
  const { progress, active } = useProgress();
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const enter = useStory((s) => s.enter);
  const root = useRef<HTMLDivElement>(null);
  const start = useRef(0);

  // count up smoothly toward the real progress
  useEffect(() => {
    if (!start.current) start.current = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start.current;
      const timeCap = Math.min(100, (elapsed / MIN_MS) * 100);
      const real = webgl ? (active ? progress : Math.max(progress, 100)) : 100;
      setShown((s) => {
        const next = s + (Math.min(real, timeCap) - s) * 0.08;
        return next > 99.5 ? 100 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, active, webgl]);

  useEffect(() => {
    if (shown >= 100 && !ready) setReady(true);
  }, [shown, ready]);

  useEffect(() => {
    gsap.fromTo(
      "[data-loader-letter]",
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.15 },
    );
  }, []);

  const go = () => {
    if (!root.current) return;
    enter();
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to("[data-loader-ui]", { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" })
      .to("[data-loader-letter]", { yPercent: -110, duration: 0.7, ease: "expo.in", stagger: 0.03 }, 0)
      .to(root.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, 0.45);
  };

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="flex overflow-hidden font-display text-[clamp(4rem,19vw,15rem)] font-light leading-none tracking-[-0.04em]">
        {"Bite".split("").map((l, i) => (
          <span key={i} data-loader-letter className="inline-block">
            {l}
          </span>
        ))}
        {"ME".split("").map((l, i) => (
          <span key={i} data-loader-letter className="inline-block italic text-saffron">
            {l}
          </span>
        ))}
      </div>

      <div data-loader-ui className="mt-6 flex flex-col items-center gap-6">
        <p className="text-xs uppercase tracking-[0.4em] text-cream-dim">{site.tagline}</p>
        <div className="relative h-px w-56 overflow-hidden bg-white/10">
          <div className="absolute inset-y-0 left-0 bg-saffron" style={{ width: `${shown}%` }} />
        </div>
        <button
          onClick={go}
          disabled={!ready}
          className="group relative overflow-hidden rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold tracking-wide transition enabled:hover:border-saffron disabled:opacity-40"
        >
          <span className="relative z-10 transition group-enabled:group-hover:text-ink">
            {ready ? "Enter the kitchen" : `Lighting the stoves… ${Math.round(shown)}%`}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-saffron transition-transform duration-500 group-enabled:group-hover:translate-x-0" />
        </button>
        <p className="text-[11px] text-cream-dim/70">Best with sound on · Scroll to travel</p>
      </div>
    </div>
  );
}
