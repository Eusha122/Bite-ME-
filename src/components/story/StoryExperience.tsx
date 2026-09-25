"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, CHAPTER_COUNT } from "@/lib/scroll";
import { useDevice } from "@/lib/device";
import { useStory } from "@/lib/story";
import Overlay from "./Overlay";
import Loader from "./Loader";
import ChapterRail, { ProgressBar } from "./ChapterRail";
import LiteStage from "./LiteStage";
import Nav from "../Nav";

const StoryCanvas = dynamic(() => import("./StoryCanvas"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function StoryExperience({ children }: { children?: React.ReactNode }) {
  const spacer = useRef<HTMLDivElement>(null);
  const detect = useDevice((s) => s.detect);
  const ready = useDevice((s) => s.ready);
  const reducedMotion = useDevice((s) => s.reducedMotion);
  const isNarrow = useDevice((s) => s.isNarrow);
  const entered = useStory((s) => s.entered);
  const setCanvasActive = useStory((s) => s.setCanvasActive);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    detect();
    setWebgl(hasWebGL());
  }, [detect]);

  // Smooth scroll + one shared ticker for everything scroll-driven
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    (window as unknown as { __lenis: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    lenis.stop();
    window.scrollTo(0, 0);

    let lastY = window.scrollY;
    let lastActive = true;
    const onTick = (time: number, deltaMs: number) => {
      lenis.raf(time * 1000);
      const el = spacer.current;
      if (!el) return;
      const dt = Math.max(deltaMs / 1000, 1 / 240);
      const y = window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      scrollState.progress = Math.min(1, Math.max(0, (y - el.offsetTop) / range));
      scrollState.smooth += (scrollState.progress - scrollState.smooth) * (1 - Math.exp(-dt * 5.5));
      scrollState.velocity = (y - lastY) / dt;
      lastY = y;

      // stop rendering WebGL once the page content fully covers it
      const active = y < el.offsetTop + el.offsetHeight + window.innerHeight * 0.1;
      if (active !== lastActive) {
        lastActive = active;
        setCanvasActive(active);
      }
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer);

    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("pointermove", onPointer);
      lenis.destroy();
    };
  }, [setCanvasActive]);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (entered) lenis?.start();
  }, [entered]);

  const lite = ready && (!webgl || reducedMotion);
  const step = isNarrow ? 115 : 150; // vh of scroll per chapter

  return (
    <>
      <Nav />
      <ProgressBar />
      <Loader webgl={webgl && !lite} />

      {ready && (lite ? <LiteStage /> : <StoryCanvas />)}
      <Overlay />
      <ChapterRail />

      {/* the scroll track that drives the whole story */}
      <div id="story" ref={spacer} style={{ height: `${(CHAPTER_COUNT - 1) * step + 100}vh` }} className="pointer-events-none relative" />

      {/* conventional page content scrolls up over the canvas */}
      <div className="relative z-20 bg-ink">{children}</div>
    </>
  );
}
