"use client";

import { useEffect, useRef } from "react";
import { chapters } from "@/config/chapters";
import { scrollState, chapterFloat } from "@/lib/scroll";
import { dishImage } from "@/lib/dishImage";

/**
 * Fallback for devices without WebGL or visitors who prefer reduced motion:
 * the same story, told with cross-fading photography and floating dish cut-outs.
 */
export default function LiteStage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layers = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-lite]"));
    let raf = 0;
    const tick = () => {
      const f = chapterFloat(scrollState.smooth);
      layers.forEach((el, i) => {
        const d = Math.abs(f - i);
        el.style.opacity = String(Math.max(0, 1 - d / 0.6));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-0 bg-ink">
      {chapters.map((c, i) => (
        <div key={c.id} data-lite className="absolute inset-0" style={{ opacity: i === 0 ? 1 : 0, background: c.palette.bg }}>
          {c.backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${c.backdrop}-sm.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          )}
          {c.hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dishImage(c.hero)}
              alt=""
              className="absolute left-1/2 top-[28%] w-[70vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_40px_60px_rgba(0,0,0,.7)] md:left-[68%] md:top-1/2 md:w-[36vw]"
            />
          )}
        </div>
      ))}
    </div>
  );
}
