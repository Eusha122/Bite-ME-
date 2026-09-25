"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useCart, computeTotals } from "@/lib/cart";
import { formatBDT } from "@/config/menu";
import { site } from "@/config/site";
import { useCatalog } from "../CatalogProvider";
import DishImage from "../DishImage";

export function QtyStepper({ id, qty }: { id: string; qty: number }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <div className="flex items-center rounded-full border border-line">
      <button aria-label="Decrease" onClick={() => setQty(id, qty - 1)} className="grid h-8 w-8 place-items-center text-lg text-ink-2">
        −
      </button>
      <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
      <button aria-label="Increase" onClick={() => setQty(id, qty + 1)} className="grid h-8 w-8 place-items-center text-lg text-ink-2">
        +
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const { dish } = useCatalog();
  const mounted = useHydrated();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!mounted) return null;
  const t = computeTotals(lines, dish);
  const toFree = site.delivery.freeAbove - t.subtotal;

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/60 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label="Your tray"
        data-lenis-prevent
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-page transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <h2 className="puff text-3xl font-light">
            Your <span className="text-tomato">tray</span>
          </h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-line">
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="puff text-2xl text-ink-2">Your tray is empty.</p>
            <p className="text-sm text-ink-2">Six kitchens are waiting. Start anywhere.</p>
            <Link href="/menu" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-tomato px-6 py-3 text-sm font-bold text-page">
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((l) => {
                const item = dish(l.id);
                if (!item) return null;
                return (
                  <li key={l.id} className="flex items-center gap-4 py-4">
                    <DishImage dish={item} className="h-16 w-16 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="text-sm text-ink-2">{formatBDT(item.price * l.qty)}</div>
                    </div>
                    <QtyStepper id={l.id} qty={l.qty} />
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              {toFree > 0 ? (
                <p className="mb-4 text-xs text-ink-2">
                  Add <span className="text-tomato">{formatBDT(toFree)}</span> more for free delivery.
                </p>
              ) : (
                <p className="mb-4 text-xs text-basil">You&apos;ve unlocked free delivery.</p>
              )}
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-ink-2">Subtotal</span>
                <span className="puff text-2xl">{formatBDT(t.subtotal)}</span>
              </div>
              <Link href="/checkout" onClick={() => setOpen(false)} className="block rounded-full bg-tomato py-4 text-center font-bold text-page transition">
                Checkout · {t.count} {t.count === 1 ? "item" : "items"}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
