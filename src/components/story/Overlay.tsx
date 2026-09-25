"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { chapters, tableDishes } from "@/config/chapters";
import { getItem, formatBDT } from "@/config/menu";
import { scrollState, chapterFloat } from "@/lib/scroll";
import { useStory, tableControl } from "@/lib/story";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Words({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, k) => (
        <span key={k} className="inline-block overflow-hidden pb-[0.12em] align-top">
          <span data-word className="inline-block will-change-transform">
            {w}&nbsp;
          </span>
        </span>
      ))}
    </span>
  );
}

function QuickAdd({ id }: { id: string }) {
  const item = getItem(id);
  const add = useCart((s) => s.add);
  if (!item) return null;
  return (
    <button
      onClick={(e) => {
        add(id);
        flyToCart(dishImage(id), { x: e.clientX, y: e.clientY });
      }}
      className="group flex items-center gap-3 rounded-full border border-white/12 bg-black/35 py-1.5 pl-1.5 pr-4 text-left backdrop-blur-md transition hover:border-[var(--accent)] hover:bg-black/55"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dishImage(id)} alt="" className="h-11 w-11 rounded-full bg-white/5 object-contain" />
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-cream">{item.name}</span>
        <span className="text-xs text-cream-dim">{formatBDT(item.price)}</span>
      </span>
      <span className="ml-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-ink transition group-hover:scale-110">+</span>
    </button>
  );
}

function TablePanel() {
  const idx = useStory((s) => s.tableIndex);
  const add = useCart((s) => s.add);
  const d = tableDishes[idx];
  const item = getItem(d.item)!;
  const step = (Math.PI * 2) / tableDishes.length;
  const spin = (dir: number) => {
    tableControl.target = Math.round(tableControl.target / step) * step + dir * step;
  };
  return (
    <div className="mt-7 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button aria-label="Previous dish" onClick={() => spin(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-lg transition hover:border-saffron hover:text-saffron">‹</button>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dishImage(d.item)} alt="" className="h-14 w-14 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg italic">{item.name}</div>
              <div className="text-sm text-cream-dim">{formatBDT(item.price)}</div>
            </div>
            <button
              onClick={(e) => {
                add(d.item);
                flyToCart(dishImage(d.item), { x: e.clientX, y: e.clientY });
              }}
              className="rounded-full bg-saffron px-4 py-2 text-sm font-bold text-ink transition hover:scale-105"
            >
              Add
            </button>
          </div>
        </div>
        <button aria-label="Next dish" onClick={() => spin(1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-lg transition hover:border-saffron hover:text-saffron">›</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/menu" className="rounded-full bg-cream px-6 py-3 text-sm font-bold text-ink transition hover:bg-saffron">
          Explore the full menu →
        </Link>
        <a href="#reserve" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-saffron hover:text-saffron">
          Book a table
        </a>
      </div>
    </div>
  );
}

export default function Overlay() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blocks = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-chapter]"));
    const cache = blocks.map((b) => ({
      el: b,
      i: Number(b.dataset.chapter),
      words: Array.from(b.querySelectorAll<HTMLElement>("[data-word]")),
      fades: Array.from(b.querySelectorAll<HTMLElement>("[data-fade]")),
    }));
    let raf = 0;
    const tick = () => {
      const f = chapterFloat(scrollState.smooth);
      for (const c of cache) {
        const lp = f - c.i;
        const last = c.i === chapters.length - 1;
        // the final chapter never fades out going forward
        const vis = clamp(1 - Math.abs(last && lp > 0 ? 0 : lp) / 0.36);
        c.el.style.visibility = vis > 0.001 ? "visible" : "hidden";
        c.el.style.pointerEvents = vis > 0.7 ? "auto" : "none";
        const dir = lp < 0 ? 1 : -1;
        c.words.forEach((w, k) => {
          const d = easeOut(clamp(vis * 1.6 - k * 0.07));
          w.style.transform = `translate3d(0, ${(1 - d) * 115 * dir}%, 0) rotate(${(1 - d) * 4 * dir}deg)`;
        });
        c.fades.forEach((el, k) => {
          const d = easeOut(clamp(vis * 1.8 - 0.5 - k * 0.12));
          el.style.opacity = String(d);
          el.style.transform = `translate3d(0, ${(1 - d) * 24 * dir}px, 0)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-10">
      {/* mobile legibility gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/45 to-transparent md:hidden" />
      <div className="absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-black/60 via-black/25 to-transparent md:block" />

      {chapters.map((c, i) => (
        <section
          key={c.id}
          data-chapter={i}
          aria-label={c.title.join(" ")}
          style={{ visibility: i === 0 ? "visible" : "hidden", ["--accent" as string]: c.palette.key }}
          className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:inset-y-0 md:left-[6vw] md:right-auto md:flex md:max-w-[min(620px,44vw)] md:flex-col md:justify-center md:px-0 md:pb-0"
        >
          <div data-fade className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)] md:text-xs">
            <span className="h-px w-8 bg-[var(--accent)]" />
            {c.kicker}
          </div>
          <div data-fade className="mb-2 font-bangla text-sm text-cream-dim md:text-base">
            {c.bn}
          </div>
          <h2 className="font-display text-[clamp(2.6rem,11vw,6.4rem)] font-light leading-[0.92] tracking-[-0.02em]">
            <Words text={c.title[0]} className="block" />
            <Words text={c.title[1]} className="block italic text-[var(--accent)]" />
          </h2>
          <p data-fade className="mt-4 max-w-md text-[15px] leading-relaxed text-cream/80 md:mt-6 md:text-base">
            {c.body}
          </p>
          {c.featured.length > 0 && (
            <div data-fade className="no-scrollbar mt-5 flex gap-2 overflow-x-auto md:mt-7 md:flex-wrap md:gap-3">
              {c.featured.map((id) => (
                <QuickAdd key={id} id={id} />
              ))}
            </div>
          )}
          {c.world === "table" && (
            <div data-fade>
              <TablePanel />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
