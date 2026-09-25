"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getItem } from "@/config/menu";
import { site } from "@/config/site";

export type CartLine = { id: string; qty: number; note?: string };

type CartState = {
  lines: CartLine[];
  open: boolean;
  /** Increments whenever something is added — the tray icon listens to bounce. */
  pulse: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      pulse: 0,
      add: (id, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === id);
          const lines = existing
            ? s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
            : [...s.lines, { id, qty }];
          return { lines, pulse: s.pulse + 1 };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.id !== id)
              : s.lines.map((l) => (l.id === id ? { ...l, qty } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "biteme-cart", partialize: (s) => ({ lines: s.lines }) },
  ),
);

export type Totals = {
  subtotal: number;
  vat: number;
  delivery: number;
  total: number;
  count: number;
};

export function computeTotals(lines: CartLine[], mode: "delivery" | "pickup" | "dinein" = "delivery"): Totals {
  let subtotal = 0;
  let count = 0;
  for (const l of lines) {
    const item = getItem(l.id);
    if (!item) continue;
    subtotal += item.price * l.qty;
    count += l.qty;
  }
  const vat = Math.round(subtotal * site.delivery.vatRate);
  const delivery =
    mode !== "delivery" || subtotal === 0 || subtotal >= site.delivery.freeAbove ? 0 : site.delivery.fee;
  return { subtotal, vat, delivery, total: subtotal + vat + delivery, count };
}

/** Fly a dish thumbnail from a DOM point to the cart tray. */
export function flyToCart(imgSrc: string, from: { x: number; y: number }) {
  if (typeof document === "undefined") return;
  const target = document.getElementById("cart-tray");
  if (!target) return;
  const t = target.getBoundingClientRect();
  const el = document.createElement("img");
  el.src = imgSrc;
  el.alt = "";
  Object.assign(el.style, {
    position: "fixed",
    left: `${from.x - 48}px`,
    top: `${from.y - 48}px`,
    width: "96px",
    height: "96px",
    objectFit: "contain",
    zIndex: "100",
    pointerEvents: "none",
    filter: "drop-shadow(0 12px 24px rgba(0,0,0,.5))",
    transition: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  const dx = t.left + t.width / 2 - from.x;
  const dy = t.top + t.height / 2 - from.y;
  const anim = el.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 120}px) scale(0.9) rotate(-20deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(-40deg)`, opacity: 0.6 },
    ],
    { duration: 850, easing: "cubic-bezier(.45,.05,.3,1)" },
  );
  anim.onfinish = () => el.remove();
}
