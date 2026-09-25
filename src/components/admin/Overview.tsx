"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cuisines, formatBDT } from "@/config/menu";
import { useAdmin } from "./AdminData";
import { PageHeader, Panel, Segmented, isActive, lateness, useNow } from "./ui";

type Range = "today" | "7d" | "30d";

const inRange = (t: number, r: Range) => (r === "today" ? new Date(t).toDateString() === new Date().toDateString() : Date.now() - t < (r === "7d" ? 7 : 30) * 864e5);

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "alert" }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone === "alert" ? "border-tomato bg-tomato/5" : "border-line bg-page"}`}>
      <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-2">{label}</div>
      <div className={`puff mt-3 whitespace-nowrap text-step-4 tabular-nums ${tone === "alert" ? "puff-tomato" : "puff-ink"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs font-semibold text-ink-2">{sub}</div>}
    </div>
  );
}

/** Horizontal bars — one series, one hue; values in text ink. */
function BarList({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[92px_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${format(r.value)}`}>
          <span className="truncate font-semibold text-ink-2">{r.label}</span>
          <span className="relative h-3 rounded-r-[4px] bg-paper-2">
            <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-tomato transition-all duration-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-20 text-right font-bold tabular-nums">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Orders by hour, 11:00–23:00, with a tooltip on each bar. */
function HourChart({ counts }: { counts: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const hours = counts.slice(11, 24);
  const max = Math.max(1, ...hours);
  return (
    <div>
      <div className="flex h-40 items-end gap-[2px] border-b border-line">
        {hours.map((c, k) => (
          <div key={k} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} className="relative flex h-full flex-1 items-end" role="img" aria-label={`${k + 11}:00 — ${c} orders`}>
            <div className="w-full rounded-t-[4px] bg-tomato" style={{ height: `${(c / max) * 100}%`, opacity: hover === null || hover === k ? 1 : 0.4, minHeight: c ? 3 : 0 }} />
            {hover === k && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs">
                {k + 11}:00 · <b>{c}</b> orders
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-2">
        <span>11am</span>
        <span>3pm</span>
        <span>7pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { orders, reservations } = useAdmin();
  const now = useNow(30000);
  const [range, setRange] = useState<Range>("today");

  const live = useMemo(() => {
    const active = orders.filter(isActive);
    const readyTimes = orders
      .filter((o) => inRange(o.createdAt, "today"))
      .map((o) => o.timeline.find((t) => t.status === "ready")?.at && (o.timeline.find((t) => t.status === "ready")!.at - o.createdAt) / 60000)
      .filter((x): x is number => typeof x === "number");
    return {
      active: active.length,
      fresh: active.filter((o) => o.status === "placed").length,
      late: active.filter((o) => lateness(o, now) === "late").length,
      due: orders.filter((o) => o.status !== "cancelled" && o.payment.status !== "paid").reduce((s, o) => s + o.totals.total, 0),
      prep: readyTimes.length ? Math.round(readyTimes.reduce((a, b) => a + b, 0) / readyTimes.length) : null,
    };
  }, [orders, now]);

  const stats = useMemo(() => {
    const inPeriod = orders.filter((o) => inRange(o.createdAt, range));
    const list = inPeriod.filter((o) => o.status !== "cancelled");
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
      cancelled: inPeriod.length - list.length,
      revenue,
      aov: list.length ? Math.round(revenue / list.length) : 0,
      modes,
      hours,
      cuisine: cuisines.map((c) => ({ label: c.name, value: byCuisine.get(c.id) ?? 0 })).sort((a, b) => b.value - a.value),
      top: [...byDish.values()].sort((a, b) => b.qty - a.qty).slice(0, 6),
    };
  }, [orders, range]);

  const pendingRes = reservations.filter((r) => r.status === "requested").length;

  return (
    <>
      <PageHeader title="Overview" sub="How the restaurant is doing right now, and over time." />

      <h2 className="mb-3 text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">Right now</h2>
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Link href="/admin/orders" className="contents">
          <Tile label="In progress" value={String(live.active)} sub={live.fresh ? `${live.fresh} waiting to be accepted` : "All accepted"} tone={live.fresh ? "alert" : undefined} />
        </Link>
        <Tile label="Running late" value={String(live.late)} sub="Open 35+ minutes" tone={live.late ? "alert" : undefined} />
        <Tile label="Cash to collect" value={formatBDT(live.due)} sub="Unpaid, not cancelled" />
        <Tile label="Avg. time to ready" value={live.prep === null ? "—" : `${live.prep} min`} sub="Today, order → ready" />
        <Link href="/admin/reservations" className="contents">
          <Tile label="Table requests" value={String(pendingRes)} sub="Waiting for a reply" tone={pendingRes ? "alert" : undefined} />
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">Sales</h2>
        <Segmented label="Period" value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Revenue" value={formatBDT(stats.revenue)} sub="incl. VAT & delivery" />
        <Tile label="Orders" value={String(stats.count)} sub={`${stats.modes.delivery} delivery · ${stats.modes.pickup} pickup · ${stats.modes.dinein} dine-in`} />
        <Tile label="Avg. order" value={formatBDT(stats.aov)} />
        <Tile label="Cancelled" value={String(stats.cancelled)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue by kitchen">
          <BarList rows={stats.cuisine} format={formatBDT} />
        </Panel>
        <Panel title="Orders by hour">
          <HourChart counts={stats.hours} />
        </Panel>
        <Panel title="Best sellers" className="lg:col-span-2">
          {stats.top.length === 0 ? (
            <p className="text-sm text-ink-2">No orders in this period yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-2">
                <tr>
                  <th className="pb-2 font-bold">Dish</th>
                  <th className="pb-2 text-right font-bold">Sold</th>
                  <th className="pb-2 text-right font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.top.map((d) => (
                  <tr key={d.name}>
                    <td className="py-2.5 font-semibold">{d.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{d.qty}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{formatBDT(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}
