"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/useHydrated";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, computeTotals } from "@/lib/cart";
import { formatBDT } from "@/config/menu";
import { site } from "@/config/site";
import { useCatalog } from "../CatalogProvider";
import DishImage from "../DishImage";
import type { OrderMode, PaymentMethod } from "@/lib/types";
import { QtyStepper } from "./CartDrawer";

const MODES: { id: OrderMode; label: string; sub: string }[] = [
  { id: "delivery", label: "Delivery", sub: "30–45 min" },
  { id: "pickup", label: "Pickup", sub: "≈ 20 min" },
  { id: "dinein", label: "Dine-in", sub: "At your table" },
];

const PAYMENTS: { id: PaymentMethod; label: string; sub: string; color: string }[] = [
  { id: "bkash", label: "bKash", sub: "Mobile wallet", color: "#e2136e" },
  { id: "nagad", label: "Nagad", sub: "Mobile wallet", color: "#f7941d" },
  { id: "card", label: "Card", sub: "Visa · Mastercard · Amex", color: "#7c8cff" },
  { id: "cod", label: "Cash", sub: "Pay on delivery / at table", color: "#6fd3b8" },
];

export default function Checkout() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const { dish } = useCatalog();
  const mounted = useHydrated();
  // a QR scan at a table stores its number for the session
  const [table, setTable] = useState(() => (typeof window === "undefined" ? "" : (sessionStorage.getItem("biteme-table") ?? "")));
  const [mode, setMode] = useState<OrderMode>(() => (table ? "dinein" : "delivery"));
  const [payment, setPayment] = useState<PaymentMethod>("bkash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!mounted) return null;

  const t = computeTotals(lines, dish, mode);

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="puff text-5xl font-light">
          Your tray is <span className="text-tomato">empty.</span>
        </h1>
        <Link href="/menu" className="rounded-full bg-tomato px-6 py-3 font-bold text-page">
          Browse the menu
        </Link>
      </div>
    );
  }

  const place = async (form: HTMLFormElement) => {
    setBusy(true);
    setError("");
    const fd = new FormData(form);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        payment,
        note: fd.get("note"),
        customer: { name: fd.get("name"), phone: fd.get("phone"), address: fd.get("address"), table: fd.get("table") },
        lines: lines.map((l) => ({ id: l.id, qty: l.qty })),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Could not place the order.");
      setBusy(false);
      setPaying(false);
      return;
    }
    clear();
    router.push(`/order/${json.id}?new=1`);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (payment === "cod") return place(form);
    // Demo gateway hand-off. In production this step redirects to the SSLCommerz payment page.
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1800));
    await place(form);
  };

  const input = "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-sm outline-none transition focus:border-tomato";

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-10">
        <h1 className="puff text-[clamp(2.8rem,7vw,5rem)] font-light leading-[0.9]">
          Almost <span className="text-tomato">at the table.</span>
        </h1>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ink-2">1 · How would you like it?</legend>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {MODES.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-2xl border p-4 text-left transition ${mode === m.id ? "border-tomato bg-tomato/10" : "border-line"}`}
              >
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-ink-2">{m.sub}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-3 md:grid-cols-2">
          <legend className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ink-2">2 · Your details</legend>
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Name
            <input name="name" required minLength={2} autoComplete="name" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Mobile number
            <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" pattern="^(\+?88)?01[3-9][0-9]{8}$" className={input} />
          </label>
          {mode === "delivery" && (
            <label className="flex flex-col gap-1.5 text-xs text-ink-2 md:col-span-2">
              Delivery address
              <textarea
                name="address"
                required
                minLength={6}
                rows={2}
                autoComplete="street-address"
                placeholder="House, road, area — e.g. House 12, Road 5, Gulshan 1"
                className={`${input} h-auto py-3`}
              />
            </label>
          )}
          {mode === "dinein" && (
            <label className="flex flex-col gap-1.5 text-xs text-ink-2">
              Table number
              <input name="table" required value={table} onChange={(e) => setTable(e.target.value)} className={input} />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-xs text-ink-2 md:col-span-2">
            Note for the kitchen (optional)
            <input name="note" placeholder="Less spicy, no onions, extra raita…" className={input} />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ink-2">3 · Payment</legend>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {PAYMENTS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPayment(p.id)}
                style={{ ["--pc" as string]: p.color }}
                className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${payment === p.id ? "border-[var(--pc)] bg-[color-mix(in_srgb,var(--pc)_12%,transparent)]" : "border-line"}`}
              >
                <span className="mb-3 block h-2 w-8 rounded-full" style={{ background: p.color }} />
                <div className="font-semibold">{p.label}</div>
                <div className="text-[11px] text-ink-2">{p.sub}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-2">Demo mode — no money moves. Live payments connect through SSLCommerz, which supports bKash, Nagad and all cards.</p>
        </fieldset>
      </div>

      <aside className="h-fit rounded-[28px] border border-line bg-page p-6 lg:sticky lg:top-28">
        <h2 className="mb-4 puff text-2xl">Your tray</h2>
        <ul className="mb-4 flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1" data-lenis-prevent>
          {lines.map((l) => {
            const item = dish(l.id);
            if (!item) return null;
            return (
              <li key={l.id} className="flex items-center gap-3">
                <DishImage dish={item} className="h-12 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-ink-2">{formatBDT(item.price * l.qty)}</div>
                </div>
                <QtyStepper id={l.id} qty={l.qty} />
              </li>
            );
          })}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-2">Subtotal</dt>
            <dd>{formatBDT(t.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">VAT ({Math.round(site.delivery.vatRate * 100)}%)</dt>
            <dd>{formatBDT(t.vat)}</dd>
          </div>
          {mode === "delivery" && (
            <div className="flex justify-between">
              <dt className="text-ink-2">Delivery</dt>
              <dd>{t.delivery ? formatBDT(t.delivery) : <span className="text-basil">Free</span>}</dd>
            </div>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="puff text-3xl text-tomato">{formatBDT(t.total)}</dd>
          </div>
        </dl>
        {error && <p className="mt-4 rounded-xl bg-tomato-deep/15 px-4 py-3 text-sm text-tomato-deep">{error}</p>}
        <button disabled={busy} className="mt-6 h-14 w-full rounded-full bg-tomato font-bold text-page transition disabled:opacity-60">
          {busy ? "Placing order…" : payment === "cod" ? `Place order · ${formatBDT(t.total)}` : `Pay ${formatBDT(t.total)}`}
        </button>
      </aside>

      {paying && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/60">
          <div className="flex w-[min(360px,90vw)] flex-col items-center gap-5 rounded-[28px] border border-line bg-page p-8 text-center">
            <span className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-tomato" />
            <p className="puff text-2xl">Confirming with {PAYMENTS.find((p) => p.id === payment)?.label}…</p>
            <p className="text-sm text-ink-2">Demo payment — this step would open the secure gateway.</p>
          </div>
        </div>
      )}
    </form>
  );
}
