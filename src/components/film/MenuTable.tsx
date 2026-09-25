"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { seedDishes, TABLE_DISH_IDS, formatBDT, cuisineName } from "@/config/menu";
import { useCart } from "@/lib/cart";
import { useCatalog } from "../CatalogProvider";
import { loadSequence, type Sequence } from "./frameLoader";
import { drawFilm, sizeCanvas } from "./draw";
import { lenis } from "./SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

export type FilmMeta = { frames: number; perClip: number; clips: number; aspect: number; bg: string };

/*
 * The rotating table, in STEP mode.
 * Clip k is a quarter-turn that carries dish k away and brings dish k+1 to the front.
 * Instead of scrubbing with the scrollbar, one scroll gesture plays a whole turn on a
 * clock (steady frame rate, eased), then the table rests until the next gesture.
 * The section is still one viewport of scroll per dish, so the scrollbar, links and
 * the back button all map to a dish.
 */
const TURN_SECONDS = 1.35;
const QUIET_MS = 160; // gap in wheel events that marks the end of a gesture

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** n clips connect n+1 dishes. */
const dishCount = (meta: FilmMeta) => Math.min(TABLE_DISH_IDS.length, meta.clips + 1);
/** frame where dish k rests facing the camera */
const restFrame = (k: number, per: number) => (k === 0 ? 0 : k * per - 1);

/** Copy state from the playhead: swap dishes half-way through a turn, fading through it. */
function copyAt(pos: number, per: number, n: number) {
  const k = Math.min(n - 2, Math.max(0, Math.floor((pos + 1) / per)));
  const a = restFrame(k, per);
  const b = restFrame(k + 1, per);
  if (pos <= a + 0.01) return { dish: k, show: 1 };
  if (pos >= b - 0.01) return { dish: k + 1, show: 1 };
  const u = (pos - a) / (b - a);
  return { dish: u < 0.5 ? k : k + 1, show: smooth(Math.abs(u - 0.5) * 2 * 1.4) };
}

function DishCopy({ index }: { index: number }) {
  const { dish } = useCatalog();
  const id = TABLE_DISH_IDS[index];
  // the live menu wins (price, name, availability); the film's own dish is the fallback
  const live = dish(id);
  const item = live ?? seedDishes.find((d) => d.id === id);
  const orderable = !!live && live.available;
  const add = useCart((s) => s.add);
  const router = useRouter();
  if (!item) return null;
  return (
    <div>
      <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">
        {String(index + 1).padStart(2, "0")} / {String(TABLE_DISH_IDS.length).padStart(2, "0")} · {cuisineName(item.cuisine)}
      </p>
      <h3 className="puff puff-tomato text-step-6 md:text-step-7">{item.name}</h3>
      <p className="mt-4 text-step-1 font-extrabold text-ink md:text-step-2">{item.line}</p>
      <p className="mt-3 max-w-[38ch] text-step-0 font-semibold leading-relaxed text-ink-2">{item.description}</p>
      <div className="mt-7 flex flex-wrap items-center gap-5">
        <span className="puff puff-ink text-step-5">{formatBDT(item.price)}</span>
        <button
          disabled={!orderable}
          // "Order now" = this dish goes in the cart and the guest lands on checkout
          onClick={() => {
            add(item.id);
            router.push("/checkout");
          }}
          className="h-14 rounded-full bg-tomato px-8 text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)] disabled:bg-paper-2 disabled:text-ink-2 disabled:shadow-none"
        >
          {orderable ? "Order now" : "Sold out today"}
        </button>
      </div>
      <Link href="/menu" className="mt-5 inline-block text-step-0 font-extrabold text-ink underline decoration-2 underline-offset-4">
        Browse the full menu →
      </Link>
    </div>
  );
}

export default function MenuTable({ meta }: { meta: FilmMeta }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const [dish, setDish] = useState(0);

  useEffect(() => {
    const cv = canvas.current!;
    const sec = section.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const n = dishCount(meta);
    const per = meta.perClip;

    let seq: Sequence | null = null;
    const play = { pos: 0 }; // playhead in frames, driven by tweens (time), never by scroll
    let current = 0; // dish the table is resting on / heading to
    let tween: gsap.core.Tween | null = null;
    let lastWheel = 0;
    let gestureUsed = false;
    let settleUntil = 0;
    let drawnPos = -1;
    let drawnLoaded = -1;
    let dirty = true;
    let lastDish = -1;

    const narrow = () => cv.clientWidth / cv.clientHeight < 1;
    const vh = () => window.innerHeight;
    const dishY = (k: number) => sec.offsetTop + k * vh();
    /** true while the table is pinned and we own the scroll gestures */
    const pinned = () => {
      const y = window.scrollY;
      return y >= sec.offsetTop - 2 && y <= sec.offsetTop + sec.offsetHeight - vh() + 2;
    };

    const resize = () => {
      sizeCanvas(cv);
      dirty = true;
    };

    const draw = () => {
      if (seq && (dirty || Math.abs(play.pos - drawnPos) > 0.002 || seq.loaded !== drawnLoaded)) {
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
        if (drawFilm(ctx, seq, play.pos, meta.bg, cx - dw / 2, cy - dh / 2, dw, dh)) {
          drawnPos = play.pos;
          drawnLoaded = seq.loaded;
          dirty = false;
        }
      }
      const c = copyAt(play.pos, per, n);
      if (c.dish !== lastDish) {
        lastDish = c.dish;
        setDish(c.dish);
      }
      if (copy.current) {
        copy.current.style.opacity = String(c.show);
        copy.current.style.transform = `translate3d(0, ${(1 - c.show) * 28}px, 0)`;
        copy.current.style.pointerEvents = c.show > 0.8 ? "auto" : "none";
      }
      if (hint.current) hint.current.style.opacity = current < n - 1 ? "1" : "0";
    };

    /** Play the table to dish k; optionally move the page to that dish's scroll position too. */
    const goTo = (k: number, moveScroll: boolean) => {
      k = Math.max(0, Math.min(n - 1, k));
      if (k === current && !tween) return;
      const steps = Math.max(1, Math.abs(k - current));
      current = k;
      tween?.kill();
      const duration = Math.min(TURN_SECONDS * steps, TURN_SECONDS + 0.45 * (steps - 1));
      tween = gsap.to(play, {
        pos: restFrame(k, per),
        duration,
        ease: steps === 1 ? "power2.inOut" : "power1.inOut",
        onComplete: () => {
          tween = null;
        },
      });
      if (moveScroll) lenis()?.scrollTo(dishY(k), { duration, lock: true, force: true });
    };

    /**
     * A scroll gesture while pinned: one dish per gesture, or leave the section at the ends.
     * A gesture is a run of wheel events without a QUIET_MS gap — so a long trackpad
     * flick (with its inertia tail) turns the table exactly once.
     */
    const step = (dir: 1 | -1) => {
      const now = performance.now();
      if (now - lastWheel > QUIET_MS) gestureUsed = false; // a pause starts a new gesture
      lastWheel = now;
      if (now < settleUntil) return true; // tail of the gesture that carried us in
      const next = current + dir;
      if (!tween && !gestureUsed && (next < 0 || next > n - 1)) return false; // let the page scroll out
      if (tween || gestureUsed) return true; // swallow: already turning, or this gesture already turned
      gestureUsed = true;
      goTo(next, true);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (!pinned() || Math.abs(e.deltaY) < 2) return;
      if (step(e.deltaY > 0 ? 1 : -1)) {
        e.preventDefault();
        e.stopPropagation(); // keep Lenis from also scrolling
      }
    };

    let touchY: number | null = null;
    let touchUsed = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchUsed = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null || !pinned()) return;
      const dy = touchY - e.touches[0].clientY;
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      const next = current + dir;
      const leaving = !tween && (next < 0 || next > n - 1);
      if (leaving) return; // native scroll carries the page out of the menu
      e.preventDefault();
      if (!touchUsed && Math.abs(dy) > 36) {
        touchUsed = true; // one swipe = one dish
        step(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!pinned() || (e.target as HTMLElement)?.closest("input, textarea, select")) return;
      const down = ["ArrowDown", "PageDown", " "].includes(e.key);
      const up = ["ArrowUp", "PageUp"].includes(e.key);
      if (!down && !up) return;
      lastWheel = 0; // keys are always a fresh gesture
      if (step(down ? 1 : -1)) e.preventDefault();
    };

    /**
     * Arriving with momentum (smooth wheel or a phone fling) would sail past the first
     * dish, so we catch the page and settle it on the edge dish instead. Scrollbar drags
     * ('native' on desktop) are left alone.
     */
    const settle = (k: number) => {
      if (tween) return; // our own turn is moving the page — not an arrival
      const l = lenis();
      const touch = window.matchMedia("(pointer: coarse)").matches;
      if (!l || (l.isScrolling !== "smooth" && !touch)) return;
      settleUntil = performance.now() + 450; // swallow the tail of the arriving gesture
      gestureUsed = true;
      current = k;
      // a short "settle" tween doubles as the guard that keeps onUpdate from re-targeting mid-catch
      tween = gsap.to(play, { pos: restFrame(k, per), duration: 0.55, ease: "power2.out", onComplete: () => (tween = null) });
      l.scrollTo(dishY(k), { duration: 0.55, lock: true, force: true });
    };

    // scrollbar drags, anchor links, back/forward: follow the scroll position to a dish
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onEnter: () => settle(0),
      onEnterBack: () => settle(n - 1),
      onUpdate: (self) => {
        if (tween) return;
        const k = Math.round(self.progress * (n - 1));
        if (k !== current) goTo(k, false);
      },
    });

    const warm = ScrollTrigger.create({
      trigger: sec,
      start: "top 600%",
      once: true,
      onEnter: () => {
        seq = loadSequence(`/film/table/${narrow() ? "m" : "d"}`, meta.frames);
        seq.onFirst.then(() => (dirty = true));
      },
    });

    resize();
    gsap.ticker.add(draw);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    return () => {
      st.kill();
      warm.kill();
      tween?.kill();
      gsap.ticker.remove(draw);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      ro.disconnect();
    };
  }, [meta]);

  const n = dishCount(meta);

  return (
    <section ref={section} id="menu" className="relative" style={{ height: `${n * 100}vh`, background: meta.bg }} aria-label="The menu">
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

        <p ref={hint} className="absolute bottom-6 left-[5vw] hidden text-step--1 font-extrabold uppercase tracking-[0.18em] text-ink-2 transition-opacity duration-500 md:block">
          Scroll to turn the table ↓
        </p>
      </div>
    </section>
  );
}
