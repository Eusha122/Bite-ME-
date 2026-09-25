"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { lenis } from "../film/SmoothScroll";
import AuthForm from "./AuthForm";

/**
 * Full-screen login. It is rendered into <body> with a portal: the nav bar is moved with a CSS
 * transform, and a `position: fixed` element inside a transformed parent stops covering the screen.
 */
export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis()?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      lenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-ink/55 px-4 py-8 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-[460px] animate-[sheet-in_.3s_cubic-bezier(.2,.8,.2,1)] rounded-[32px] bg-page p-6 md:p-9">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-lg font-bold">
          ✕
        </button>
        <h2 id="auth-title" className="pr-10 text-step-4 font-extrabold leading-tight">
          Log in to BiteME
        </h2>
        <p className="mb-6 mt-2 font-semibold leading-relaxed text-ink-2">Sign in or create an account to order faster — your details carry across the whole site.</p>
        <AuthForm autoFocus onDone={onClose} />
      </div>
    </div>,
    document.body,
  );
}
