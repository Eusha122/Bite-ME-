"use client";

import { useRef } from "react";
import { cuisines, formatBDT, type MenuItem } from "@/config/menu";
import { useCart, flyToCart } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";

const TAG_LABEL: Record<string, string> = {
  spicy: "🌶 Spicy",
  veg: "Veg",
  signature: "Signature",
  new: "New",
  chef: "Chef's pick",
};

export default function MenuCard({ item, soldOut = false, onOpen }: { item: MenuItem; soldOut?: boolean; onOpen?: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const add = useCart((s) => s.add);
  const accent = cuisines.find((c) => c.id === item.cuisine)?.accent ?? "#f2a33a";

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.current.style.setProperty("--rx", `${-y * 10}deg`);
    card.current.style.setProperty("--ry", `${x * 12}deg`);
    card.current.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    card.current.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    card.current?.style.setProperty("--rx", "0deg");
    card.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="[perspective:1000px]">
      <div
        ref={card}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ ["--accent" as string]: accent, transform: "rotateX(var(--rx,0)) rotateY(var(--ry,0))" }}
        className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-ink-2 transition-transform duration-300 ease-out [transform-style:preserve-3d] ${soldOut ? "opacity-55 grayscale" : ""}`}
      >
        {/* light that follows the cursor */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,30%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)" }}
        />
        <button onClick={onOpen} className="relative block aspect-[5/4] w-full text-left" aria-label={`View ${item.name}`}>
          <div
            className="absolute inset-x-6 bottom-3 top-10 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
            style={{ background: "var(--accent)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dishImage(item.id)}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 m-auto h-[92%] w-[92%] object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-out [transform:translateZ(40px)] group-hover:[transform:translateZ(70px)_scale(1.06)_rotate(-3deg)]"
          />
          {item.tags?.length ? (
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream backdrop-blur">
                  {TAG_LABEL[t]}
                </span>
              ))}
            </div>
          ) : null}
          {soldOut && (
            <span className="absolute right-4 top-4 rounded-full bg-chili px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">Sold out today</span>
          )}
        </button>

        <div className="relative flex flex-1 flex-col gap-2 px-5 pb-5">
          <h3 className="font-display text-xl leading-tight">{item.name}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-cream-dim">{item.description}</p>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="font-display text-xl text-[var(--accent)]">{formatBDT(item.price)}</span>
            <button
              disabled={soldOut}
              onClick={(e) => {
                add(item.id);
                flyToCart(dishImage(item.id), { x: e.clientX, y: e.clientY });
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-cream px-4 text-sm font-bold text-ink transition hover:bg-[var(--accent)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
