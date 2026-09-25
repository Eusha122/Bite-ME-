"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { cuisines, formatBDT, menu } from "@/config/menu";
import type { Order, Reservation } from "@/lib/types";
import { Logo } from "../Nav";

type Range = "today" | "7d" | "30d";
const RANGE_MS: Record<Range, number> = { today: 0, "7d": 7 * 864e5, "30d": 30 * 864e5 };

function inRange(t: number, r: Range) {
  if (r === "today") return new Date(t).toDateString() === new Date().toDateString();
  return Date.now() - t < RANGE_MS[r];
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-ink-2 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-cream-dim">{label}</div>
      <div className="mt-3 font-display text-4xl font-light tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream-dim">{sub}</div>}
    </div>
  );
}

/** Horizontal bars — one series, one hue; value labels in text ink. */
function BarList({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group grid grid-cols-[92px_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${format(r.value)}`}>
          <span className="truncate text-cream-dim">{r.label}</span>
          <span className="relative h-3 rounded-r-[4px] bg-white/[0.04]">
            <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-saffron transition-all duration-700 group-hover:brightness-125" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-20 text-right tabular-nums">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical bars for orders by hour, with a hover tooltip per bar. */
function HourChart({ counts }: { counts: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...counts);
  const hours = counts.slice(11, 24); // service hours 11:00–23:00
  return (
    <div className="relative">
      <div className="flex h-40 items-end gap-[2px] border-b border-white/10">
        {hours.map((c, k) => (
          <div
            key={k}
            onMouseEnter={() => setHover(k)}
            onMouseLeave={() => setHover(null)}
            className="relative flex h-full flex-1 items-end"
            role="img"
            aria-label={`${k + 11}:00 — ${c} orders`}
          >
            <div className="w-full rounded-t-[4px] bg-saffron transition-opacity" style={{ height: `${(c / max) * 100}%`, opacity: hover === null || hover === k ? 1 : 0.4, minHeight: c ? 3 : 0 }} />
            {hover === k && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs">
                {k + 11}:00 · <b>{c}</b> orders
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-cream-dim">
        <span>11am</span>
        <span>3pm</span>
        <span>7pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}

function TableQRs() {
  const [codes, setCodes] = useState<{ n: number; src: string }[]>([]);
  useEffect(() => {
    const origin = window.location.origin;
    Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async (n) => ({
        n,
        src: await QRCode.toDataURL(`${origin}/menu?table=${n}`, { margin: 1, width: 256, color: { dark: "#0b0806", light: "#f4ead9" } }),
      })),
    ).then(setCodes);
  }, []);
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {codes.map((c) => (
        <figure key={c.n} className="flex flex-col items-center gap-2 rounded-2xl bg-cream p-3 text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.src} alt={`QR code for table ${c.n}`} className="w-full" />
          <figcaption className="text-xs font-bold">Table {c.n}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [soldOut, setSoldOut] = useState<string[]>([]);
  const [range, setRange] = useState<Range>("today");
  const [tab, setTab] = useState<"overview" | "menu" | "reservations" | "qr">("overview");

  const load = async () => {
    const [o, r, s] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/reservations", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/soldout", { cache: "no-store" }).then((x) => x.json()),
    ]);
    setOrders(o.orders ?? []);
    setReservations(r.reservations ?? []);
    setSoldOut(s.soldOut ?? []);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after the await
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const list = orders.filter((o) => o.status !== "cancelled" && inRange(o.createdAt, range));
    const revenue = list.reduce((s, o) => s + o.totals.total, 0);
    const byCuisine = new Map<string, number>();
    const byDish = new Map<string, { name: string; qty: number; revenue: number }>();
    const hours = Array(24).fill(0) as number[];
    for (const o of list) {
      hours[new Date(o.createdAt).getHours()]++;
      for (const l of o.lines) {
        byCuisine.set(l.cuisine, (byCuisine.get(l.cuisine) ?? 0) + l.price * l.qty);
        const d = byDish.get(l.id) ?? { name: l.name, qty: 0, revenue: 0 };
        d.qty += l.qty;
        d.revenue += l.price * l.qty;
        byDish.set(l.id, d);
      }
    }
    const modes = { delivery: 0, pickup: 0, dinein: 0 };
    list.forEach((o) => modes[o.mode]++);
    return {
      count: list.length,
      revenue,
      aov: list.length ? Math.round(revenue / list.length) : 0,
      modes,
      hours,
      cuisine: cuisines.filter((c) => c.id !== "drinks" || byCuisine.has("drinks")).map((c) => ({ label: c.name, value: byCuisine.get(c.id) ?? 0 })).sort((a, b) => b.value - a.value),
      top: [...byDish.values()].sort((a, b) => b.qty - a.qty).slice(0, 6),
    };
  }, [orders, range]);

  const toggle = async (id: string, value: boolean) => {
    setSoldOut((s) => (value ? [...s, id] : s.filter((x) => x !== id)));
    await fetch("/api/soldout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, soldOut: value }) });
  };

  const decide = async (id: string, status: "confirmed" | "declined") => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch("/api/reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  const pending = reservations.filter((r) => r.status === "requested").length;

  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] px-4 pb-16 pt-5 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="text-3xl" />
          <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.25em] text-cream-dim">Owner dashboard</span>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/kitchen" className="rounded-full bg-saffron px-4 py-2 font-bold text-ink">Open kitchen display</Link>
          <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-cream-dim hover:text-cream">View site</Link>
        </div>
      </header>

      <nav className="no-scrollbar mb-6 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {([
          ["overview", "Overview"],
          ["menu", "Menu availability"],
          ["reservations", `Reservations${pending ? ` (${pending})` : ""}`],
          ["qr", "Table QR codes"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === id ? "bg-cream font-bold text-ink" : "text-cream-dim hover:text-cream"}`}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["today", "7d", "30d"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-full border px-4 py-1.5 text-xs ${range === r ? "border-saffron text-saffron" : "border-white/12 text-cream-dim"}`}>
                {r === "today" ? "Today" : r === "7d" ? "Last 7 days" : "Last 30 days"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Revenue" value={formatBDT(stats.revenue)} sub="incl. VAT & delivery" />
            <Tile label="Orders" value={String(stats.count)} sub={`${stats.modes.delivery} delivery · ${stats.modes.pickup} pickup · ${stats.modes.dinein} dine-in`} />
            <Tile label="Avg. order" value={formatBDT(stats.aov)} />
            <Tile label="Open reservations" value={String(pending)} sub={`${reservations.length} total`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-ink-2 p-6">
              <h3 className="mb-5 font-display text-xl">Revenue by kitchen</h3>
              <BarList rows={stats.cuisine} format={formatBDT} />
            </div>
            <div className="rounded-3xl border border-line bg-ink-2 p-6">
              <h3 className="mb-5 font-display text-xl">Orders by hour</h3>
              <HourChart counts={stats.hours} />
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-ink-2 p-6">
            <h3 className="mb-4 font-display text-xl">Best sellers</h3>
            {stats.top.length === 0 ? (
              <p className="text-sm text-cream-dim">No orders in this period yet — place one from the site to see it here.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-cream-dim">
                  <tr><th className="pb-2 font-normal">Dish</th><th className="pb-2 text-right font-normal">Sold</th><th className="pb-2 text-right font-normal">Revenue</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.top.map((d) => (
                    <tr key={d.name}><td className="py-2.5">{d.name}</td><td className="py-2.5 text-right tabular-nums">{d.qty}</td><td className="py-2.5 text-right tabular-nums">{formatBDT(d.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "menu" && (
        <div className="grid gap-2 md:grid-cols-2">
          {menu.map((m) => {
            const off = soldOut.includes(m.id);
            return (
              <label key={m.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-ink-2 px-4 py-3">
                <span>
                  <span className="block">{m.name}</span>
                  <span className="text-xs text-cream-dim">{cuisines.find((c) => c.id === m.cuisine)?.name} · {formatBDT(m.price)}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className={off ? "text-chili" : "text-emerald-300"}>{off ? "Sold out" : "Available"}</span>
                  <input type="checkbox" checked={!off} onChange={(e) => toggle(m.id, !e.target.checked)} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-white/15 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-cream before:transition checked:bg-emerald-500 checked:before:translate-x-4" />
                </span>
              </label>
            );
          })}
        </div>
      )}

      {tab === "reservations" && (
        <div className="flex flex-col gap-2">
          {reservations.length === 0 && <p className="text-cream-dim">No reservations yet.</p>}
          {reservations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-ink-2 px-5 py-4">
              <div>
                <div className="font-semibold">{r.name} · {r.guests} {r.guests === 1 ? "guest" : "guests"}</div>
                <div className="text-sm text-cream-dim">
                  {r.date} at {r.time} · <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>
                  {r.note ? ` · “${r.note}”` : ""}
                </div>
              </div>
              {r.status === "requested" ? (
                <div className="flex gap-2">
                  <button onClick={() => decide(r.id, "confirmed")} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-ink">Confirm</button>
                  <button onClick={() => decide(r.id, "declined")} className="rounded-full border border-white/15 px-4 py-2 text-sm text-cream-dim">Decline</button>
                </div>
              ) : (
                <span className={`text-sm ${r.status === "confirmed" ? "text-emerald-300" : "text-chili"}`}>{r.status === "confirmed" ? "✓ Confirmed" : "✕ Declined"}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "qr" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="max-w-xl text-sm text-cream-dim">Print these and place one on each table. Guests scan, order and pay from their phone — orders land on the kitchen display tagged with the table number.</p>
            <button onClick={() => window.print()} className="rounded-full border border-white/15 px-4 py-2 text-sm">Print</button>
          </div>
          <TableQRs />
        </div>
      )}
    </div>
  );
}
