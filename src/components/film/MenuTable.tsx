"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { menu, formatBDT, cuisineName } from "@/config/menu";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";
import { loadSequence } from "./frameLoader";
import { drawFilm, sizeCanvas, approach } from "./draw";

gsap.registerPlugin(ScrollTrigger);

export type FilmMeta = { frames: number; perClip: number; clips: number; aspect: number; bg: string };

/*
 * The rotating table. Clip k turns the lazy susan a quarter turn, carrying dish k
 * away and bringing dish k+1 round to the front. Scroll choreography per dish:
 *   HOLD (dish faces you, order panel up) → TURN (scrub the quarter-turn clip)
 */
const HOLD = 1.2;
// generous scroll per quarter-turn keeps the rotation slow and silky
const TURN = 1.6;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** n clips connect n+1 dishes. */
const dishCount = (meta: FilmMeta) => Math.min(menu.length, meta.clips + 1);

function stateAt(p: number, meta: FilmMeta) {
  const n = dishCount(meta);
  const per = meta.perClip;
  const total = n * HOLD + (n - 1) * TURN;
  const t = p * total;
  const k = Math.min(n - 1, Math.floor(t / (HOLD + TURN)));
  const local = t - k * (HOLD + TURN);
  const rest = (i: number) => (i === 0 ? 0 : i * per - 1);
  if (local < HOLD || k === n - 1) return { frame: rest(k), dish: k, show: 1 };
  // mid-turn the copy hands over: the leaving dish fades out, the arriving one fades in
  const u = (local - HOLD) / TURN;
  const arriving = u >= 0.5;
  return { frame: k * per + u * (per - 1), dish: arriving ? k + 1 : k, show: smooth(Math.abs(u - 0.5) * 2 * 1.4) };
}

function DishCopy({ index }: { index: number }) {
  const item = menu[index];
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  if (!item) return null;
  return (
    <div>
      <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">
        {String(index + 1).padStart(2, "0")} / {String(menu.length).padStart(2, "0")} · {cuisineName(item.cuisine)}
      </p>
      <h3 className="puff puff-tomato text-step-6 md:text-step-7">{item.name}</h3>
      <p className="mt-4 text-step-1 font-extrabold text-ink md:text-step-2">{item.line}</p>
      <p className="mt-3 max-w-[38ch] text-step-0 font-semibold leading-relaxed text-ink-2">{item.description}</p>
      <div className="mt-7 flex flex-wrap items-center gap-5">
        <span className="puff puff-ink text-step-5">{formatBDT(item.price)}</span>
        <button
          onClick={(e) => {
            add(item.id);
            flyToCart(dishImage(item.id), { x: e.clientX, y: e.clientY });
            setAdded(true);
          }}
          className="h-14 rounded-full bg-tomato px-8 text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)]"
        >
          {added ? "Added ✓" : "Order now"}
        </button>
      </div>
    </div>
  );
}

export default function MenuTable({ meta }: { meta: FilmMeta }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [dish, setDish] = useState(0);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    let seq: ReturnType<typeof loadSequence> | null = null;
    // target = scrollbar position; shown = eased playhead that is actually rendered
    let progress = 0;
    let shown = 0;
    let drawnPos = -1;
    let drawnLoaded = -1;
    let dirty = true;
    let lastDish = -1;

    const narrow = () => cv.clientWidth / cv.clientHeight < 1;
    const resize = () => {
      sizeCanvas(cv);
      dirty = true;
    };

    const draw = (_time: number, deltaMs: number) => {
      if (!seq) return;
      shown = approach(shown, progress, deltaMs);
      if (Math.abs(shown - progress) < 0.00005) shown = progress;
      const s = stateAt(shown, meta);
      const pos = clamp(s.frame, 0, meta.frames - 1);
      // repaint only when the playhead moved, a frame arrived, or the canvas resized
      if (dirty || Math.abs(pos - drawnPos) > 0.004 || seq.loaded !== drawnLoaded) {
        const W = cv.width;
        const H = cv.height;
        let dw: number, dh: number, cx: number, cy: number;
        if (narrow()) {
          dw = W * 1.7;
          dh = dw / meta.aspect;
          cx = W * 0.5;
          cy = H * 0.3;
        } else {
          dh = H * 1.02;
          dw = dh * meta.aspect;
          cx = W * 0.64;
          cy = H * 0.52;
        }
        if (drawFilm(ctx, seq, pos, meta.bg, cx - dw / 2, cy - dh / 2, dw, dh)) {
          drawnPos = pos;
          drawnLoaded = seq.loaded;
          dirty = false;
        }
      }
      if (s.dish !== lastDish) {
        lastDish = s.dish;
        setDish(s.dish);
      }
      if (copy.current) {
        copy.current.style.opacity = String(s.show);
        copy.current.style.transform = `translate3d(0, ${(1 - s.show) * 28}px, 0)`;
        copy.current.style.pointerEvents = s.show > 0.8 ? "auto" : "none";
      }
    };

    resize();
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => (progress = self.progress),
    });
    // start downloading a few screens before the table arrives
    const warm = ScrollTrigger.create({
      trigger: section.current,
      start: "top 600%",
      once: true,
      onEnter: () => {
        seq = loadSequence(`/film/table/${narrow() ? "m" : "d"}`, meta.frames);
        seq.onFirst.then(() => (dirty = true));
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

  const n = dishCount(meta);
  const length = Math.round((n * HOLD + (n - 1) * TURN) * 75);

  return (
    <section ref={section} id="menu" className="relative" style={{ height: `${length}vh`, background: meta.bg }} aria-label="The menu">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* cream panel with a wavy edge: holds the copy and tucks the table's far edge away */}
        <div className="absolute inset-x-0 bottom-0 h-[52%] md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[42vw]" aria-hidden>
          <div className="absolute inset-0" style={{ background: meta.bg }} />
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="absolute inset-y-0 left-full hidden h-full w-[80px] md:block">
            <path d="M0 0 H30 C80 120 80 260 40 380 C0 500 10 640 55 760 C85 850 70 940 30 1000 H0 Z" fill={meta.bg} />
          </svg>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-full block h-[46px] w-full md:hidden">
            <path d="M0 100 V60 C150 0 300 0 450 45 C600 90 780 90 1000 30 V100 Z" fill={meta.bg} />
          </svg>
        </div>

        <div className="absolute left-5 right-5 top-5 pt-[max(4.5rem,env(safe-area-inset-top))] md:left-[5vw] md:right-auto md:top-[14vh] md:pt-0">
          <p className="text-step--1 font-extrabold uppercase tracking-[0.18em] text-ink-2 md:text-step-0">The menu · spin the table</p>
        </div>

        <div ref={copy} className="absolute inset-x-5 bottom-[max(2rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:left-[5vw] md:top-1/2 md:w-[min(520px,36vw)] md:-translate-y-1/2">
          <DishCopy key={dish} index={dish} />
        </div>
      </div>
    </section>
  );
}
