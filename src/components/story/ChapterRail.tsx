"use client";

import { chapters } from "@/config/chapters";
import { cuisines } from "@/config/menu";
import { useStory } from "@/lib/story";
import { CHAPTER_COUNT } from "@/lib/scroll";

/** Jump to a chapter by scrolling the story spacer to its resting point. */
export function scrollToChapter(i: number) {
  const spacer = document.getElementById("story");
  if (!spacer) return;
  const range = spacer.offsetHeight - window.innerHeight;
  const y = spacer.offsetTop + (range * i) / (CHAPTER_COUNT - 1);
  const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, { duration: 2.2 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export default function ChapterRail() {
  const current = useStory((s) => s.chapter);
  const entered = useStory((s) => s.entered);
  const active = useStory((s) => s.canvasActive);

  return (
    <nav
      aria-label="Chapters"
      className={`fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-4 transition-opacity duration-700 md:right-8 md:flex ${entered && active ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {chapters.map((c, i) => {
        const label = c.cuisine ? cuisines.find((x) => x.id === c.cuisine)!.name : "The Table";
        const on = i === current;
        return (
          <button key={c.id} onClick={() => scrollToChapter(i)} className="group flex items-center gap-3" aria-current={on}>
            <span
              className={`text-xs tracking-wide transition-all duration-500 ${on ? "translate-x-0 text-cream opacity-100" : "translate-x-2 text-cream-dim opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}
            >
              {label}
            </span>
            <span
              className="block h-px transition-all duration-500"
              style={{ width: on ? 36 : 14, background: on ? c.palette.key : "rgba(244,234,217,.35)" }}
            />
          </button>
        );
      })}
    </nav>
  );
}

/** Mobile: a thin progress bar at the very top. */
export function ProgressBar() {
  const current = useStory((s) => s.chapter);
  const active = useStory((s) => s.canvasActive);
  return (
    <div className={`fixed inset-x-0 top-0 z-50 flex gap-1 px-2 pt-1 transition-opacity md:hidden ${active ? "opacity-100" : "opacity-0"}`}>
      {chapters.map((c, i) => (
        <span key={c.id} className="h-[2px] flex-1 rounded-full transition-colors duration-500" style={{ background: i <= current ? chapters[current].palette.key : "rgba(255,255,255,.15)" }} />
      ))}
    </div>
  );
}
