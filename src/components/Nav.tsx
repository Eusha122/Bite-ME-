"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, computeTotals } from "@/lib/cart";
import { dishImage } from "@/lib/dishImage";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-2xl font-light tracking-[-0.03em] ${className}`}>
      Bite<span className="italic text-saffron">ME</span>
    </span>
  );
}

/** The cart button is a little serving tray; dishes you add stack on it. */
export function CartTray() {
  const lines = useCart((s) => s.lines);
  const pulse = useCart((s) => s.pulse);
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!pulse) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [pulse]);

  const count = mounted ? computeTotals(lines).count : 0;
  const stack = mounted ? lines.slice(-3) : [];

  return (
    <button
      id="cart-tray"
      onClick={() => setOpen(true)}
      aria-label={`Open your tray, ${count} items`}
      className={`relative flex h-12 items-center gap-2 rounded-full border border-white/15 bg-black/40 pl-2 pr-4 backdrop-blur-md transition hover:border-saffron ${bump ? "scale-110" : "scale-100"}`}
      style={{ transitionDuration: bump ? "180ms" : "400ms" }}
    >
      <span className="relative flex h-9 w-12 items-end justify-center">
        {stack.map((l, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={l.id}
            src={dishImage(l.id)}
            alt=""
            className="absolute bottom-2 h-7 w-7 object-contain drop-shadow"
            style={{ left: `${6 + k * 11}px`, zIndex: k }}
          />
        ))}
        <svg viewBox="0 0 48 12" className="absolute bottom-0 h-3 w-12 text-saffron" aria-hidden>
          <path d="M2 3h44l-4 7H6z" fill="currentColor" opacity=".9" />
        </svg>
      </span>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </button>
  );
}

export default function Nav({ transparent = true }: { transparent?: boolean }) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 md:px-10 md:pt-6 ${transparent ? "" : "border-b border-line bg-ink/80 backdrop-blur-xl"}`}
    >
      <Link href="/" aria-label="BiteME home">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-cream/80 md:flex">
        <Link href="/#story" className="transition hover:text-saffron">Story</Link>
        <Link href="/menu" className="transition hover:text-saffron">Menu</Link>
        <Link href="/#reserve" className="transition hover:text-saffron">Reserve</Link>
        <Link href="/#visit" className="transition hover:text-saffron">Visit</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/menu" className="rounded-full bg-cream px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-saffron md:hidden">
          Menu
        </Link>
        <CartTray />
      </div>
    </header>
  );
}
