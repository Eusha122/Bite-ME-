"use client";

import { useEffect, useState, type ReactNode } from "react";
import { statusShort, type Order, type OrderStatus } from "@/lib/types";

/* ---------- time ---------- */

export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const dayClock = (t: number) => {
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  return today ? `Today, ${clock(t)}` : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${clock(t)}`;
};

export function ago(t: number, now: number) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min ago`;
  return dayClock(t);
}

/** Re-render every `ms` so relative times and timers stay fresh. */
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/* ---------- order helpers ---------- */

export const ACTIVE: OrderStatus[] = ["placed", "accepted", "cooking", "ready", "out"];
export const isActive = (o: Order) => ACTIVE.includes(o.status);
export const where = (o: Order) => (o.mode === "dinein" ? `Table ${o.customer.table}` : o.mode === "pickup" ? "Pickup" : "Delivery");
export const itemsSummary = (o: Order) => o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ");
export const itemCount = (o: Order) => o.lines.reduce((s, l) => s + l.qty, 0);
export const minutesOpen = (o: Order, now: number) => Math.floor((now - o.createdAt) / 60000);

/** Service-time health for an active order: fine < 20 min, slow < 35, late beyond. */
export function lateness(o: Order, now: number): "ok" | "slow" | "late" {
  if (!isActive(o)) return "ok";
  const m = minutesOpen(o, now);
  return m >= 35 ? "late" : m >= 20 ? "slow" : "ok";
}

/** Button label for moving an order one step on. */
export function nextActionLabel(o: Order): string | null {
  switch (o.status) {
    case "placed":
      return "Accept order";
    case "accepted":
      return "Start cooking";
    case "cooking":
      return "Mark ready";
    case "ready":
      return o.mode === "delivery" ? "Send with rider" : o.mode === "pickup" ? "Picked up" : "Served";
    case "out":
      return "Mark delivered";
    default:
      return null;
  }
}

/* ---------- badges (always text + colour, never colour alone) ---------- */

const STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "bg-tomato text-page",
  accepted: "bg-mustard text-ink",
  cooking: "bg-ink text-mustard",
  ready: "bg-basil text-page",
  out: "border border-basil text-basil",
  delivered: "bg-paper-2 text-ink-2",
  cancelled: "border border-line text-ink-2 line-through decoration-1",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-xs font-extrabold ${STATUS_STYLE[status]}`}>
      {status === "placed" && <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-page" aria-hidden />}
      {statusShort[status]}
    </span>
  );
}

export function PaymentBadge({ payment }: { payment: Order["payment"] }) {
  const method = { bkash: "bKash", nagad: "Nagad", card: "Card", cod: "Cash" }[payment.method];
  const paid = payment.status === "paid";
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-bold ${paid ? "bg-basil/12 text-basil" : "bg-mustard/25 text-ink"}`}>
      {paid ? "✓ Paid" : "Due"} · {method}
    </span>
  );
}

export function LateTag({ o, now }: { o: Order; now: number }) {
  const l = lateness(o, now);
  const m = minutesOpen(o, now);
  if (!isActive(o)) return null;
  return (
    <span className={`text-xs font-bold tabular-nums ${l === "late" ? "text-tomato" : l === "slow" ? "text-mustard-deep" : "text-ink-2"}`}>
      {m} min{l === "late" ? " · late" : ""}
    </span>
  );
}

/* ---------- layout bits ---------- */

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-page p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-step-1 font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-page p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 rounded-full px-3.5 text-xs font-bold ${value === o.value ? "bg-ink text-page" : "text-ink-2"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="puff puff-ink text-step-6">{title}</h1>
        {sub && <div className="mt-2 text-step-0 font-semibold text-ink-2">{sub}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
