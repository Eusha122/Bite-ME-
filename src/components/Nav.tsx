"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart, computeTotals } from "@/lib/cart";
import { useHydrated } from "@/lib/useHydrated";
import { scrollToId } from "./film/SmoothScroll";

export function Logo({ className = "h-9 md:h-11" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo.webp" alt="BiteME" className={`w-auto ${className}`} width={1200} height={334} />;
}

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const pulse = useCart((s) => s.pulse);
  const setOpen = useCart((s) => s.setOpen);
  const hydrated = useHydrated();
  const count = hydrated ? computeTotals(lines).count : 0;
  return (
    <button
      id="cart-tray"
      key={pulse}
      onClick={() => setOpen(true)}
      aria-label={`Cart, ${count} items`}
      className={`relative grid h-12 w-12 place-items-center rounded-full bg-ink text-page ${pulse ? "animate-[bump_.5s_cubic-bezier(.3,1.6,.5,1)]" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 8h14l-1.3 11.1a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-mustard px-1.5 text-xs font-extrabold text-ink tabular-nums">{count}</span>
      )}
    </button>
  );
}

export function OrderNow({ className = "" }: { className?: string }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <button
      onClick={() => (path === "/" ? scrollToId("menu") : router.push("/#menu"))}
      className={`h-12 rounded-full bg-tomato px-6 font-extrabold text-page shadow-[0_4px_0_var(--tomato-deep)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--tomato-deep)] ${className}`}
    >
      Order now
    </button>
  );
}

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-[5vw] md:pt-6">
      <Link href="/" aria-label="BiteME home">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <OrderNow />
        <CartButton />
      </div>
    </header>
  );
}
