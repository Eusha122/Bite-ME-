"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccount, initialOf } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import AuthModal from "./AuthModal";

/** The person icon in the nav bar. Logged out: opens the full-screen login. Logged in: their initial and a small menu. */
export default function AccountMenu() {
  const user = useAccount((s) => s.user);
  const logout = useAccount((s) => s.logout);
  const hydrated = useHydrated();
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const who = hydrated ? user : null;

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => (who ? setMenu((o) => !o) : setLogin(true))}
        aria-expanded={who ? menu : undefined}
        aria-haspopup="dialog"
        aria-label={who ? `Account: ${who.name}` : "Log in"}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink md:h-12 md:w-12 ${who ? "bg-mustard text-ink" : "bg-paper text-ink"}`}
      >
        {who ? (
          <span className="puff text-step-1">{initialOf(who.name)}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
          </svg>
        )}
      </button>

      {who && menu && (
        <div role="dialog" aria-label="Your account" className="fixed inset-x-3 top-[76px] z-50 animate-[sheet-in_.25s_cubic-bezier(.2,.8,.2,1)] rounded-[28px] border-2 border-line bg-page p-6 shadow-[0_18px_40px_rgba(42,26,16,.18)] md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+12px)] md:w-[360px]">
          <div className="flex items-center gap-4">
            <span className="puff grid h-14 w-14 shrink-0 place-items-center rounded-full bg-mustard text-step-3 text-ink">{initialOf(who.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-step-1 font-extrabold">{who.name}</p>
              <p className="text-sm font-bold text-ink-2">{who.phone}</p>
            </div>
          </div>
          <nav className="mt-5 flex flex-col gap-2 font-extrabold">
            <Link href="/account" onClick={() => setMenu(false)} className="rounded-2xl bg-paper px-4 py-3">
              My orders
            </Link>
            <Link href="/support" onClick={() => setMenu(false)} className="rounded-2xl bg-paper px-4 py-3">
              Support
            </Link>
            <button
              onClick={() => {
                logout();
                setMenu(false);
              }}
              className="rounded-2xl border-2 border-line px-4 py-3 text-left"
            >
              Log out
            </button>
          </nav>
        </div>
      )}

      <AuthModal open={login && !who} onClose={() => setLogin(false)} />
    </div>
  );
}
