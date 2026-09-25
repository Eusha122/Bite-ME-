"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { loadSequence, type Sequence } from "./frameLoader";
import { drawFilm, sizeCanvas, approach } from "./draw";

gsap.registerPlugin(ScrollTrigger);

export type Beat = {
  /** progress window [in, out] within the scene, 0..1 */
  at: [number, number];
  kicker?: string;
  title: ReactNode;
  body?: ReactNode;
  extra?: ReactNode;
};

type Props = {
  id: string;
  /** folder under /public/film */
  film: string;
  frames: number;
  aspect: number;
  /** width / height of the cropped phone frames */
  mobileAspect?: number;
  /** phones store every n-th frame (memory) */
  mobileStride?: number;
  /** changes when frames are regenerated (cache-busting) */
  version?: number;
  bg: string;
  beats: Beat[];
  /** scroll length in viewport heights */
  length?: number;
  /** callback for the first frame being ready (hero uses it to lift the loader) */
  onReady?: () => void;
  /** which side the copy sits on (desktop) — scenes alternate to cross the page */
  side?: "left" | "right";
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function FilmScene({ id, film, frames, aspect, mobileAspect, mobileStride = 1, version = 0, bg, beats, length = 320, onReady, side = "left" }: Props) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    // phones load frames that are already cropped to the middle, so their proportions differ
    const imgAspect = narrow ? (mobileAspect ?? aspect) : aspect;
    let seq: Sequence | null = null;
    const start = () => {
      if (seq) return;
      drawnLoaded = -1;
      dirty = true;
      seq = loadSequence(`/film/${film}/${narrow ? "m" : "d"}`, frames, version, narrow ? mobileStride : 1);
      seq.onFirst.then(() => {
        dirty = true;
        onReady?.();
      });
    };
    // a scene far from the screen lets go of its decoded frames, so memory stays bounded
    const release = () => {
      seq?.dispose();
      seq = null;
    };
    // target = where the scrollbar is; shown = the eased playhead we actually render
    let progress = 0;
    let shown = 0;
    let drawnPos = -1;
    let drawnLoaded = -1;
    let dirty = true;

    const resize = () => {
      sizeCanvas(cv);
      dirty = true;
    };

    const draw = () => {
      if (!seq) return;
      const pos = shown * (frames - 1);
      // skip redundant paints: same position, nothing new loaded, no resize
      if (!dirty && Math.abs(pos - drawnPos) < 0.004 && seq.loaded === drawnLoaded) return;
      const W = cv.width;
      const H = cv.height;
      let dw: number, dh: number, dx: number, dy: number;
      if (W / H < 1) {
        // phones: the (virtual) full frame is much wider than the screen; the cropped frame we have
        // is just its middle, so it is drawn at the same scale, centred, with the dish in the upper half
        dh = (W * 1.85) / aspect;
        dw = dh * imgAspect;
        dx = (W - dw) / 2;
        dy = H * 0.36 - dh / 2;
      } else {
        // desktop: the dish takes the half opposite the copy
        dh = Math.min(H * 0.86, (W * 0.62) / aspect * 1.6);
        dw = dh * imgAspect;
        dx = W * (side === "left" ? 0.68 : 0.32) - dw / 2;
        dy = (H - dh) / 2 + H * 0.03;
      }
      if (drawFilm(ctx, seq, pos, bg, dx, dy, dw, dh)) {
        drawnPos = pos;
        drawnLoaded = seq.loaded;
        dirty = false;
      }
    };

    // per-beat word stagger
    const beatEls = Array.from(copy.current!.querySelectorAll<HTMLElement>("[data-beat]")).map((el) => ({
      el,
      at: JSON.parse(el.dataset.beat!) as [number, number],
      words: Array.from(el.querySelectorAll<HTMLElement>("[data-w]")),
      fades: Array.from(el.querySelectorAll<HTMLElement>("[data-f]")),
    }));
    const renderCopy = () => {
      for (const b of beatEls) {
        const [a, z] = b.at;
        const inT = a <= 0 ? 1 : clamp((shown - a) / 0.07);
        const outT = z >= 1 ? 0 : clamp((shown - z) / 0.07);
        const vis = inT * (1 - outT);
        b.el.style.visibility = vis > 0.001 ? "visible" : "hidden";
        b.el.style.pointerEvents = vis > 0.8 ? "auto" : "none";
        const leaving = outT > 0;
        b.words.forEach((w, k) => {
          const d = easeOut(clamp(vis * 1.5 - k * 0.08));
          w.style.transform = `translate3d(0, ${(1 - d) * (leaving ? -105 : 105)}%, 0)`;
        });
        b.fades.forEach((f, k) => {
          const d = easeOut(clamp(vis * 1.6 - 0.4 - k * 0.1));
          f.style.opacity = String(d);
          f.style.transform = `translate3d(0, ${(1 - d) * 18}px, 0)`;
        });
      }
    };

    resize();
    // the hero loads straight away; later scenes start downloading ~2 screens before they arrive
    // active from ~3 screens before the scene until ~2 screens after it
    const warm = ScrollTrigger.create({ trigger: section.current, start: "top 300%", end: "bottom -200%", onEnter: start, onEnterBack: start, onLeave: release, onLeaveBack: release });
    if (onReady) start();

    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress = self.progress;
      },
    });

    const tick = (_time: number, deltaMs: number) => {
      shown = approach(shown, progress, deltaMs);
      if (Math.abs(shown - progress) < 0.0001) shown = progress;
      draw();
      renderCopy();
    };
    gsap.ticker.add(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    return () => {
      st.kill();
      warm.kill();
      release();
      gsap.ticker.remove(tick);
      ro.disconnect();
    };
  }, [film, frames, aspect, mobileAspect, mobileStride, version, bg, onReady, side]);

  return (
    <section ref={section} id={id} className="relative" style={{ height: `${length}vh`, background: bg }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
        <div ref={copy} className={`absolute inset-x-0 bottom-0 top-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] md:inset-y-0 ${side === "left" ? "md:left-[5vw] md:right-auto" : "md:left-auto md:right-[5vw]"} md:flex md:w-[min(560px,40vw)] md:flex-col md:justify-center md:px-0 md:pb-0`}>
          {beats.map((b, i) => (
            <div key={i} data-beat={JSON.stringify(b.at)} className="absolute inset-x-5 bottom-[max(2rem,env(safe-area-inset-bottom))] md:inset-x-0 md:bottom-auto" style={{ visibility: b.at[0] <= 0 ? "visible" : "hidden" }}>
              {b.kicker && (
                <p data-f className="mb-4 font-sans text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">
                  {b.kicker}
                </p>
              )}
              <h2 className="puff text-step-7">{b.title}</h2>
              {b.body && (
                <p data-f className="mt-5 max-w-[34ch] text-step-0 font-semibold leading-relaxed text-ink-2 md:text-step-1">
                  {b.body}
                </p>
              )}
              {b.extra && (
                <div data-f className="mt-7">
                  {b.extra}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Split a headline into masked words for the staggered reveal. */
export function Words({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`block ${className}`}>
      {children.split(" ").map((w, k) => (
        <span key={k} className="-mb-[0.12em] inline-block overflow-hidden pb-[0.24em] pr-[0.24em] align-top">
          <span data-w className="inline-block will-change-transform">
            {w}
          </span>
        </span>
      ))}
    </span>
  );
}
