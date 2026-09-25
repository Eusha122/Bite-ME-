"use client";

import { useState } from "react";
import { BD_PHONE, normalizePhone, useAccount } from "@/lib/account";

type Tab = "login" | "create";

/** Login / Create account. Shared by the full-screen modal and the /account page. */
export default function AuthForm({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const register = useAccount((s) => s.register);
  const loginWithPhone = useAccount((s) => s.loginWithPhone);
  const [tab, setTab] = useState<Tab>("login");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const num = normalizePhone(phone);
    if (!BD_PHONE.test(num)) return setError("Enter a valid mobile number, like 01712345678.");

    if (tab === "login") {
      if (!loginWithPhone(num)) return setError("No account with this number yet. Create one — it takes a few seconds.");
      return onDone?.();
    }
    const name = String(new FormData(e.currentTarget).get("name") ?? "").replace(/\s+/g, " ").trim();
    if (name.length < 2) return setError("Please enter your name.");
    if (register({ name: name.slice(0, 60), phone: num }) === "exists") return setError("This number already has an account. Log in instead.");
    onDone?.();
  };

  const field = "h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-step-0 font-bold outline-none placeholder:font-semibold placeholder:text-ink-2/60 focus:border-ink";

  return (
    <div>
      <div role="tablist" aria-label="Login or create account" className="grid grid-cols-2 rounded-full bg-paper-2 p-1">
        {(["login", "create"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => switchTab(t)} className={`h-11 rounded-full text-sm font-extrabold ${tab === t ? "bg-page text-ink shadow-[0_1px_0_var(--line)]" : "text-ink-2"}`}>
            {t === "login" ? "Login" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
        {tab === "create" && (
          <label className="flex flex-col gap-1.5 text-sm font-extrabold">
            Your name
            <input name="name" autoComplete="name" autoFocus={autoFocus} placeholder="e.g. Eusha Ibna Akbor" className={field} />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
          Mobile number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            autoFocus={autoFocus && tab === "login"}
            placeholder="01XXXXXXXXX"
            className={field}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato">
            {error}
          </p>
        )}
        <button className="h-14 rounded-full bg-tomato text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)]">
          {tab === "login" ? "Continue" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-xs font-semibold leading-relaxed text-ink-2">Demo login — no password or code needed. Accounts stay in this browser and pre-fill checkout.</p>
    </div>
  );
}
