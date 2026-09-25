"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "../Nav";

/** PIN pad in front of the kitchen display and dashboard. */
export default function StaffGate({ title, children }: { title: string; children: ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setState(d.staff ? "open" : "locked"))
      .catch(() => setState("locked"));
  }, []);

  const submit = async (value: string) => {
    const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: value }) });
    if (res.ok) setState("open");
    else {
      setError("Wrong PIN");
      setPin("");
    }
  };

  const press = (d: string) => {
    setError("");
    const next = (pin + d).slice(0, 8);
    setPin(next);
    if (next.length === 4) submit(next);
  };

  if (state === "open") return <>{children}</>;
  if (state === "checking") return <div className="grid min-h-dvh place-items-center text-cream-dim">…</div>;

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-6">
        <Logo className="text-4xl" />
        <p className="text-sm uppercase tracking-[0.3em] text-cream-dim">{title}</p>
        <div className="flex gap-3" aria-label="PIN entered">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-saffron" : "bg-white/15"}`} />
          ))}
        </div>
        <p className="h-5 text-sm text-chili">{error}</p>
        <div className="grid w-full grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                onClick={() => (k === "⌫" ? setPin((p) => p.slice(0, -1)) : press(k))}
                className="h-16 rounded-2xl border border-white/10 bg-ink-2 text-2xl transition hover:border-saffron active:scale-95"
              >
                {k}
              </button>
            ),
          )}
        </div>
        <p className="text-xs text-cream-dim/60">Demo PIN: 1234</p>
      </div>
    </div>
  );
}
