"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart, computeTotals } from "@/lib/cart";
import { useHydrated } from "@/lib/useHydrated";
import { site } from "@/config/site";
import { useCatalog } from "./CatalogProvider";
import { lenis } from "./film/SmoothScroll";
import AccountMenu from "./account/AccountMenu";

export function Logo({ className = "h-9 md:h-11" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo.webp" alt="BiteME" className={`w-auto ${className}`} width={1200} height={334} />;
}

export function CartButton({ className = "h-12 w-12" }: { className?: string }) {
  const lines = useCart((s) => s.lines);
  const pulse = useCart((s) => s.pulse);
  const setOpen = useCart((s) => s.setOpen);
  const { dish } = useCatalog();
  const hydrated = useHydrated();
  const count = hydrated ? computeTotals(lines, dish).count : 0;
  return (
    <button
      id="cart-tray"
      key={pulse}
      onClick={() => setOpen(true)}
      aria-label={`Cart, ${count} items`}
      className={`relative grid shrink-0 place-items-center rounded-full bg-ink text-page ${className} ${pulse ? "animate-[bump_.5s_cubic-bezier(.3,1.6,.5,1)]" : ""}`}
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

const LINKS = [
  { id: "menu", label: "Menu", href: "/menu" },
  { id: "reserve", label: "Reserve", href: "/reserve" },
  { id: "support", label: "Support", href: "/support" },
] as const;

/**
 * Hides while the guest scrolls down (the film gets the whole screen) and returns the
 * moment they scroll up. Always visible near the top of the page and while the phone
 * menu is open.
 */
function useHideOnScroll(locked: boolean) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    // smooth scrolling moves only 1–2 px per frame, so travel is summed per direction
    let travel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last.current;
      last.current = y;
      setAtTop(y < 24);
      if (locked || y < 96) {
        travel = 0;
        return setHidden(false);
      }
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      if (travel < -3) setHidden(false);
      else if (travel > 12) setHidden(true);
    };
    // the intent to go up is known before the page moves: react to the gesture itself
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) setHidden(false);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0].clientY - touchY > 8) setHidden(false); // finger moving down = page going up
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "PageUp", "Home"].includes(e.key)) setHidden(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [locked]);

  return { hidden: hidden && !locked, atTop };
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    lenis()?.stop();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      lenis()?.start();
      window.removeEventListener("keydown", k);
    };
  }, [open, onClose]);

  return (
    <div
      id="site-menu"
      className={`fixed inset-0 z-30 flex flex-col bg-paper px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 transition-[opacity,translate] duration-300 md:hidden ${open ? "opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      aria-hidden={!open}
    >
      <nav aria-label="Site" className="flex flex-col gap-2">
        {LINKS.map((l, i) => {
          const on = path === l.href;
          const cls = `puff text-left text-step-7 ${on ? "puff-tomato" : "puff-ink"}`;
          const style = { transitionDelay: open ? `${80 + i * 60}ms` : "0ms" };
          return (
            <Link key={l.id} href={l.href} onClick={onClose} style={style} className={`${cls} transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-6"}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm font-bold text-ink-2">
          <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          <span>{site.address}</span>
        </div>
      </div>
    </div>
  );
}

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { hidden, atTop } = useHideOnScroll(menuOpen);
  const path = usePathname();
  const bar = useRef<HTMLElement>(null);

  // publish how much of the top of the screen the bar covers, so sticky page bars
  // (like the menu's search) can slide down with it and back up when it hides
  useEffect(() => {
    document.documentElement.style.setProperty("--nav-h", hidden ? "0px" : `${bar.current?.offsetHeight ?? 0}px`);
  }, [hidden]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--nav-h");
    },
    [],
  );

  // close the phone menu when the route changes
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMenuOpen(false);
  }

  const linkCls = (href: string) => `relative py-2 text-step-0 font-extrabold ${path === href ? "text-tomato" : "text-ink"}`;

  return (
    <>
      <header
        ref={bar}
        // Tailwind v4 moves things with the `translate` property, so that is what must be transitioned
        className={`fixed inset-x-0 top-0 z-40 transition-[translate,background-color,box-shadow] duration-[650ms] ease-[cubic-bezier(.45,0,.2,1)] ${hidden ? "-translate-y-full" : "translate-y-0"} ${
          atTop || menuOpen ? "bg-transparent" : "bg-paper shadow-[0_1px_0_var(--line)]"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] md:px-[5vw] md:pb-4 md:pt-5">
          <Link href="/" aria-label="BiteME home" className="shrink-0">
            <Logo className="h-8 md:h-11" />
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-9 md:flex">
            <Link href="/menu" className={linkCls("/menu")} aria-current={path === "/menu" ? "page" : undefined}>
              Menu
            </Link>
            <Link href="/reserve" className={linkCls("/reserve")} aria-current={path === "/reserve" ? "page" : undefined}>
              Reserve
            </Link>
            <Link href="/support" className={linkCls("/support")} aria-current={path === "/support" ? "page" : undefined}>
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <CartButton className="h-11 w-11 md:h-12 md:w-12" />
            <AccountMenu />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
