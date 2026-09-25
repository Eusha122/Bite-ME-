"use client";

import { useEffect, useState } from "react";
import { cuisines, formatBDT, type MenuItem } from "@/config/menu";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";

/** Full-screen dish detail — a big floating plate, story and a quantity picker. */
export default function DishSheet({ item, soldOut, onClose }: { item: MenuItem | null; soldOut: boolean; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  useEffect(() => setQty(1), [item?.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const open = !!item;
  const cuisine = item ? cuisines.find((c) => c.id === item.cuisine) : null;

  return (
    <div className={`fixed inset-0 z-[65] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      {item && (
        <div
          role="dialog"
          aria-label={item.name}
          data-lenis-prevent
          style={{ ["--accent" as string]: cuisine?.accent }}
          className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[32px] border-t border-line bg-ink-2 md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(960px,92vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:border"
        >
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 backdrop-blur hover:border-saffron">✕</button>
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto md:min-h-[520px]">
              <div className="absolute inset-[18%] rounded-full opacity-50 blur-3xl" style={{ background: "var(--accent)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dishImage(item.id)} alt={item.name} className="absolute inset-0 m-auto h-[86%] w-[86%] animate-[float_6s_ease-in-out_infinite] object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,.6)]" />
            </div>
            <div className="flex flex-col gap-4 p-6 md:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                {cuisine?.name} <span className="font-bangla normal-case tracking-normal text-cream-dim">· {cuisine?.bn}</span>
              </div>
              <h2 className="font-display text-4xl font-light leading-none md:text-5xl">{item.name}</h2>
              <p className="leading-relaxed text-cream/80">{item.description}</p>
              <div className="flex gap-6 text-sm text-cream-dim">
                <span>≈ {item.prepMinutes} min in the kitchen</span>
                {item.tags?.includes("spicy") && <span>🌶 Spicy</span>}
                {item.tags?.includes("veg") && <span>Vegetarian</span>}
              </div>
              <div className="mt-auto flex items-center gap-4 pt-6">
                <div className="flex items-center rounded-full border border-white/15">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center text-xl">−</button>
                  <span className="w-8 text-center tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-12 w-12 place-items-center text-xl">+</button>
                </div>
                <button
                  disabled={soldOut}
                  onClick={(e) => {
                    add(item.id, qty);
                    flyToCart(dishImage(item.id), { x: e.clientX, y: e.clientY });
                    onClose();
                  }}
                  className="flex h-12 flex-1 items-center justify-between rounded-full bg-[var(--accent)] px-6 font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
                >
                  <span>{soldOut ? "Sold out today" : "Add to tray"}</span>
                  <span>{formatBDT(item.price * qty)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
