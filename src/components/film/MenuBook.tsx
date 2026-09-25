"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { menu, formatBDT, cuisineName } from "@/config/menu";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";
import { loadSequence } from "./frameLoader";
import { drawFrame } from "./draw";

gsap.registerPlugin(ScrollTrigger);

export type FilmMeta = { frames: number; perClip: number; clips: number; aspect: number; bg: string };

/*
 * Scroll choreography (in "units"):
 *   INTRO  closed book, title copy
 *   per dish: TURN (scrub the page-turn clip) → HOLD (zoom into the printed dish, order panel)
 */
const INTRO = 0.6;
const TURN = 1;
const HOLD = 1.6;
const PER_DISH = TURN + HOLD;

// where the printed dish sits inside a film frame (normalised), measured from the spread keyframe
const DISH = { x: 0.28, y: 0.46 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

type State = { frame: number; zoom: number; dish: number; cover: number };

/** One clip opens the book, then one page-turn per dish — so the film covers `clips` dishes. */
const dishCount = (meta: FilmMeta) => Math.min(menu.length, meta.clips);

function stateAt(p: number, meta: FilmMeta): State {
  const n = dishCount(meta);
  const total = INTRO + n * PER_DISH;
  let t = p * total;
  if (t < INTRO) return { frame: 0, zoom: 0, dish: -1, cover: 1 - smooth((t - INTRO * 0.6) / (INTRO * 0.4)) };
  t -= INTRO;
  const k = Math.min(n - 1, Math.floor(t / PER_DISH));
  const local = t - k * PER_DISH;
  const per = meta.perClip;
  if (local < TURN) {
    return { frame: k * per + (local / TURN) * (per - 1), zoom: 0, dish: k, cover: 0 };
  }
  const h = (local - TURN) / HOLD;
  const zoom = smooth(h / 0.28) * (1 - smooth((h - 0.78) / 0.22));
  // the last dish stays zoomed so the section ends on an order prompt
  return { frame: (k + 1) * per - 1, zoom: k === n - 1 ? smooth(h / 0.28) : zoom, dish: k, cover: 0 };
}

function DishPanel({ index, visible }: { index: number; visible: boolean }) {
  const item = menu[index];
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState<string | null>(null);
  if (!item) return null;
  return (
    <div
      className="transition-[opacity,transform] duration-500"
      style={{ opacity: visible ? 1 : 0, transform: `translate3d(0, ${visible ? 0 : 24}px, 0)`, pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
    >
      <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">
        {String(index + 1).padStart(2, "0")} / {String(menu.length).padStart(2, "0")} · {cuisineName(item.cuisine)}
      </p>
      <h3 className="puff puff-tomato text-step-6 md:text-step-7">{item.name}</h3>
      <p className="mt-4 text-step-1 font-extrabold text-ink md:text-step-2">{item.line}</p>
      <p className="mt-3 max-w-[38ch] text-step-0 font-semibold leading-relaxed text-ink-2">{item.description}</p>
      <div className="mt-7 flex items-center gap-5">
        <span className="puff puff-ink text-step-5">{formatBDT(item.price)}</span>
        <button
          onClick={(e) => {
            add(item.id);
            flyToCart(dishImage(item.id), { x: e.clientX, y: e.clientY });
            setAdded(item.id);
          }}
          className="h-14 rounded-full bg-tomato px-8 text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)]"
        >
          {added === item.id ? "Added ✓" : "Order now"}
        </button>
      </div>
      <p className="mt-4 text-step--1 font-bold text-ink-2">About {item.prepMinutes} min in the kitchen</p>
    </div>
  );
}

export default function MenuBook({ meta }: { meta: FilmMeta }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const coverCopy = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<{ dish: number; show: boolean }>({ dish: 0, show: false });

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    let seq: ReturnType<typeof loadSequence> | null = null;
    let progress = 0;
    let lastKey = "";
    let lastPanel = "";

    const narrow = () => cv.clientWidth / cv.clientHeight < 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      lastKey = "";
    };

    const draw = () => {
      if (!seq) return;
      const s = stateAt(progress, meta);
      const idx = Math.round(clamp(s.frame, 0, meta.frames - 1));
      const img = seq.nearest(idx);
      const key = `${idx}|${s.zoom.toFixed(4)}|${cv.width}x${cv.height}|${img ? 1 : 0}`;
      if (key !== lastKey && img) {
        lastKey = key;
        const W = cv.width;
        const H = cv.height;
        const z = s.zoom;
        // camera: interpolate frame size + where the focus point lands on screen
        let dh0: number, fx0: number, fy0: number, sx0: number, sy0: number, dh1: number, sx1: number, sy1: number;
        if (narrow()) {
          dh0 = (W * 1.12) / meta.aspect;
          fx0 = 0.5; fy0 = 0.5; sx0 = 0.5; sy0 = 0.34;
          dh1 = (W * 2.6) / meta.aspect;
          sx1 = 0.5; sy1 = 0.3;
        } else {
          dh0 = Math.min(H * 0.98, (W * 1.02) / meta.aspect);
          fx0 = 0.5; fy0 = 0.5; sx0 = 0.5; sy0 = 0.5;
          dh1 = H * 1.45;
          sx1 = 0.7; sy1 = 0.52;
        }
        const dh = dh0 + (dh1 - dh0) * z;
        const dw = dh * meta.aspect;
        const fx = fx0 + (DISH.x - fx0) * z;
        const fy = fy0 + (DISH.y - fy0) * z;
        const sx = sx0 + (sx1 - sx0) * z;
        const sy = sy0 + (sy1 - sy0) * z;
        drawFrame(ctx, img, meta.bg, sx * W - fx * dw, sy * H - fy * dh, dw, dh);
      }
      // order panel follows the zoom
      const show = s.dish >= 0 && s.zoom > 0.65;
      const pk = `${s.dish}|${show}`;
      if (pk !== lastPanel) {
        lastPanel = pk;
        setPanel({ dish: Math.max(0, s.dish), show });
      }
      // wavy cream panel slides in with the zoom and hides the book's edge behind the copy
      if (curtain.current) {
        const z = smooth(s.zoom);
        curtain.current.style.transform = narrow() ? `translate3d(0, ${(1 - z) * 105}%, 0)` : `translate3d(${(z - 1) * 105}%, 0, 0)`;
      }
      if (coverCopy.current) {
        coverCopy.current.style.opacity = String(s.cover);
        coverCopy.current.style.transform = `translate3d(0, ${(1 - s.cover) * -30}px, 0)`;
        coverCopy.current.style.visibility = s.cover > 0.01 ? "visible" : "hidden";
      }
    };

    resize();
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => (progress = self.progress),
    });
    // start downloading the book a couple of screens before it arrives
    const warm = ScrollTrigger.create({
      trigger: section.current,
      start: "top 250%",
      once: true,
      onEnter: () => {
        seq = loadSequence(`/film/book/${narrow() ? "m" : "d"}`, meta.frames);
      },
    });
    gsap.ticker.add(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    return () => {
      st.kill();
      warm.kill();
      gsap.ticker.remove(draw);
      ro.disconnect();
    };
  }, [meta]);

  const length = Math.round((INTRO + dishCount(meta) * PER_DISH) * 70);

  return (
    <section ref={section} id="menu" className="relative" style={{ height: `${length}vh`, background: meta.bg }} aria-label="The menu">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* the curtain: solid cream with a wavy leading edge (right edge on desktop, top edge on phones) */}
        <div ref={curtain} className="absolute inset-x-0 bottom-0 h-[60%] will-change-transform md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[46vw]" style={{ transform: "translate3d(-105%,0,0)" }} aria-hidden>
          <div className="absolute inset-0 bg-paper" style={{ background: meta.bg }} />
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="absolute inset-y-0 left-full hidden h-full w-[70px] md:block">
            <path d="M0 0 H30 C80 120 80 260 40 380 C0 500 10 640 55 760 C85 850 70 940 30 1000 H0 Z" fill={meta.bg} />
          </svg>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-full block h-[46px] w-full md:hidden">
            <path d="M0 100 V60 C150 0 300 0 450 45 C600 90 780 90 1000 30 V100 Z" fill={meta.bg} />
          </svg>
        </div>

        <div ref={coverCopy} className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-5 max-w-[30ch] md:bottom-auto md:left-[5vw] md:top-1/2 md:-translate-y-1/2">
          <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">The menu</p>
          <h2 className="puff puff-ink text-step-7 md:text-step-8">
            Ten dishes.
            <br />
            <span className="puff-tomato">Six kitchens.</span>
          </h2>
          <p className="mt-5 text-step-1 font-bold text-ink-2">Keep scrolling — we&apos;ll open the book for you.</p>
        </div>

        <div className="absolute inset-x-5 bottom-[max(2rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:left-[5vw] md:top-1/2 md:w-[min(520px,38vw)] md:-translate-y-1/2">
          <DishPanel key={panel.dish} index={panel.dish} visible={panel.show} />
        </div>
      </div>
    </section>
  );
}
