"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "../Nav";
import { useAdmin } from "./AdminData";
import { useNow } from "./ui";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV = [
  { href: "/admin/orders", label: "Orders", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin", label: "Overview", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
  { href: "/admin/menu", label: "Menu", icon: "M6 3v18M6 8h4a4 4 0 0 0 0-8M18 3v18m-3-18v7a3 3 0 0 0 6 0V3" },
  { href: "/admin/reservations", label: "Reservations", icon: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" },
  { href: "/admin/tables", label: "Table QR codes", icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z" },
];

function Toasts() {
  const { toasts, dismissToast } = useAdmin();
  const router = useRouter();
  return (
    <div className="fixed bottom-4 right-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-page shadow-[0_12px_30px_rgba(42,26,16,.25)]">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-tomato" aria-hidden />
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              dismissToast(t.id);
              router.push(`/admin/orders?order=${t.orderId}`, { scroll: false });
            }}
          >
            <span className="block font-extrabold">{t.title}</span>
            <span className="block truncate text-sm text-page/75">{t.body}</span>
            <span className="mt-1 block text-xs font-bold text-mustard">Open order →</span>
          </button>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-page/60">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { orders, reservations, online, lastSync, sound, setSound } = useAdmin();
  const now = useNow(5000);
  const newCount = orders.filter((o) => o.status === "placed").length;
  const pendingRes = reservations.filter((r) => r.status === "requested").length;
  const badge: Record<string, number> = { "/admin/orders": newCount, "/admin/reservations": pendingRes };
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const stale = !online || (lastSync && now - lastSync > 20000);

  const lock = async () => {
    await fetch("/api/staff", { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      {/* sidebar (desktop) / top bar (phones) */}
      <aside className="sticky top-0 z-40 flex flex-col border-b border-line bg-page md:h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pb-6 md:pt-7">
          <Link href="/admin/orders" aria-label="Admin home">
            <Logo className="h-8 md:h-9" />
          </Link>
          <span className={`flex items-center gap-1.5 text-xs font-bold ${stale ? "text-tomato" : "text-basil"}`}>
            <span className={`h-2 w-2 rounded-full ${stale ? "bg-tomato" : "animate-pulse bg-basil"}`} aria-hidden />
            {stale ? "Offline" : "Live"}
          </span>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-0" aria-label="Admin">
          {NAV.map((n) => {
            const on = isOn(n.href);
            const count = badge[n.href] ?? 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold md:py-3 ${on ? "bg-ink text-page" : "text-ink-2"}`}
              >
                <Icon d={n.icon} />
                <span className="whitespace-nowrap">{n.label}</span>
                {count > 0 && <span className={`ml-auto grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-extrabold ${on ? "bg-tomato text-page" : "bg-tomato text-page"}`}>{count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden flex-col gap-2 p-4 md:flex">
          <Link href="/kitchen" className="flex h-11 items-center justify-center rounded-full bg-tomato text-sm font-extrabold text-page">
            Open kitchen display
          </Link>
          <button onClick={() => setSound(!sound)} className={`h-11 rounded-full border text-sm font-bold ${sound ? "border-tomato text-tomato" : "border-line text-ink-2"}`}>
            {sound ? "🔔 New-order chime on" : "🔕 Turn chime on"}
          </button>
          <div className="flex gap-2">
            <Link href="/" className="flex h-10 flex-1 items-center justify-center rounded-full border border-line text-xs font-bold text-ink-2">
              View site
            </Link>
            <button onClick={lock} className="h-10 flex-1 rounded-full border border-line text-xs font-bold text-ink-2">
              Lock
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 pb-24 pt-6 md:px-10 md:pt-10">{children}</main>
      <Toasts />
    </div>
  );
}
