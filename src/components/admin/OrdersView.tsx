"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatBDT } from "@/config/menu";
import { nextStatuses, type Order, type OrderMode, type OrderStatus } from "@/lib/types";
import { useAdmin } from "./AdminData";
import OrderDrawer from "./OrderDrawer";
import { ACTIVE, LateTag, PageHeader, PaymentBadge, Segmented, StatusBadge, ago, dayClock, itemsSummary, nextActionLabel, useNow, where } from "./ui";

type Tab = "active" | OrderStatus | "all";
type Range = "today" | "7d" | "30d" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "In progress" },
  { id: "placed", label: "New" },
  { id: "accepted", label: "Accepted" },
  { id: "cooking", label: "Cooking" },
  { id: "ready", label: "Ready" },
  { id: "out", label: "On the way" },
  { id: "delivered", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const PAGE = 20;

const inRange = (t: number, r: Range) => {
  if (r === "all") return true;
  if (r === "today") return new Date(t).toDateString() === new Date().toDateString();
  return Date.now() - t < (r === "7d" ? 7 : 30) * 864e5;
};

const matchTab = (o: Order, tab: Tab) => (tab === "all" ? true : tab === "active" ? ACTIVE.includes(o.status) : o.status === tab);

/** CSV of the orders currently in view (opens cleanly in Excel / Google Sheets). */
function exportCsv(list: Order[]) {
  const cols = ["Order", "Placed", "Status", "Type", "Table", "Customer", "Phone", "Address", "Items", "Subtotal", "VAT", "Delivery", "Total", "Payment", "Paid", "Customer note", "Staff note", "Cancel reason"];
  const esc = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = list.map((o) =>
    [
      o.code,
      new Date(o.createdAt).toLocaleString(),
      o.status,
      o.mode,
      o.customer.table,
      o.customer.name,
      o.customer.phone,
      o.customer.address,
      itemsSummary(o),
      o.totals.subtotal,
      o.totals.vat,
      o.totals.delivery,
      o.totals.total,
      o.payment.method,
      o.payment.status === "paid" ? "yes" : "no",
      o.note,
      o.staffNote,
      o.cancelReason,
    ]
      .map(esc)
      .join(","),
  );
  const blob = new Blob(["﻿" + [cols.map(esc).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `biteme-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OrdersView() {
  const { orders, loaded, patchOrder, sound, setSound } = useAdmin();
  const now = useNow(15000);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openId = params.get("order");

  const [tab, setTab] = useState<Tab>("active");
  const [range, setRange] = useState<Range>("today");
  const [mode, setMode] = useState<OrderMode | "any">("any");
  const [pay, setPay] = useState<"any" | "paid" | "due">("any");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(null);

  const open = (id: string | null) => router.replace(id ? `${pathname}?order=${id}` : pathname, { scroll: false });

  // everything except the status tab — so the tab counts reflect the other filters
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      // unfinished orders always show — a late order from yesterday must never hide
      if (!ACTIVE.includes(o.status) && !inRange(o.createdAt, range)) return false;
      if (mode !== "any" && o.mode !== mode) return false;
      if (pay === "paid" && o.payment.status !== "paid") return false;
      if (pay === "due" && o.payment.status === "paid") return false;
      if (!needle) return true;
      return [o.code, o.customer.name, o.customer.phone, o.customer.table, o.customer.address].some((f) => f?.toLowerCase().includes(needle));
    });
  }, [orders, q, range, mode, pay]);

  const counts = useMemo(() => {
    const c: Partial<Record<Tab, number>> = {};
    for (const t of TABS) c[t.id] = base.filter((o) => matchTab(o, t.id)).length;
    return c;
  }, [base]);

  const list = useMemo(() => {
    const l = base.filter((o) => matchTab(o, tab));
    // in-progress work is oldest-first (FIFO like a kitchen rail); history is newest-first
    return tab === "active" || ACTIVE.includes(tab as OrderStatus) ? [...l].sort((a, b) => a.createdAt - b.createdAt) : [...l].sort((a, b) => b.createdAt - a.createdAt);
  }, [base, tab]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const revenue = list.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totals.total, 0);
  const selected = orders.find((o) => o.id === openId) ?? null;

  const advance = async (o: Order) => {
    const next = nextStatuses(o).find((s) => s !== "cancelled");
    if (!next) return;
    setBusy(o.id);
    setRowError(null);
    const err = await patchOrder(o.id, { status: next });
    if (err) setRowError({ id: o.id, msg: err });
    setBusy(null);
  };

  const setTabReset = (t: Tab) => {
    setTab(t);
    setPage(0);
  };

  return (
    <>
      <PageHeader
        title="Orders"
        sub={
          <>
            {list.length} {list.length === 1 ? "order" : "orders"}
            {list.length > 0 && <> · {formatBDT(revenue)}</>}
          </>
        }
      >
        <button onClick={() => setSound(!sound)} className={`h-10 rounded-full border px-4 text-sm font-bold md:hidden ${sound ? "border-tomato text-tomato" : "border-line text-ink-2"}`}>
          {sound ? "🔔 Chime on" : "🔕 Chime off"}
        </button>
        <button onClick={() => exportCsv(list)} disabled={!list.length} className="h-10 rounded-full border border-line bg-page px-4 text-sm font-bold disabled:opacity-40">
          Export CSV
        </button>
      </PageHeader>

      {/* status tabs */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="Order status">
        {TABS.map((t) => {
          const on = tab === t.id;
          const n = counts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTabReset(t.id)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold ${on ? "bg-ink text-page" : "bg-page text-ink-2"}`}
            >
              {t.label}
              <span className={`min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums ${t.id === "placed" && n ? "bg-tomato text-page" : on ? "bg-page/20" : "bg-paper-2"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative xl:w-80">
          <span className="sr-only">Search orders</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search code, name, phone, table…"
            className="h-10 w-full rounded-full border border-line bg-page px-4 text-sm outline-none focus:border-ink"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Segmented label="Date" value={range} onChange={(v) => (setRange(v), setPage(0))} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "all", label: "All time" }]} />
          <Segmented label="Order type" value={mode} onChange={(v) => (setMode(v), setPage(0))} options={[{ value: "any", label: "All types" }, { value: "delivery", label: "Delivery" }, { value: "pickup", label: "Pickup" }, { value: "dinein", label: "Dine-in" }]} />
          <Segmented label="Payment" value={pay} onChange={(v) => (setPay(v), setPage(0))} options={[{ value: "any", label: "Any payment" }, { value: "paid", label: "Paid" }, { value: "due", label: "Due" }]} />
        </div>
      </div>

      {!loaded ? (
        <p className="py-20 text-ink-2">Loading orders…</p>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-16">
          <p className="text-step-2 font-extrabold">{tab === "active" ? "No orders in progress." : "No orders match."}</p>
          <p className="mt-1 text-ink-2">{tab === "active" ? "New orders appear here the moment they're placed." : "Try another tab, date range or search."}</p>
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-page lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-2">
                <tr>
                  <th className="px-5 py-3 font-bold">Order</th>
                  <th className="px-3 py-3 font-bold">Customer</th>
                  <th className="px-3 py-3 font-bold">Type</th>
                  <th className="px-3 py-3 font-bold">Items</th>
                  <th className="px-3 py-3 text-right font-bold">Total</th>
                  <th className="px-3 py-3 font-bold">Payment</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((o) => {
                  const label = nextActionLabel(o);
                  return (
                    <tr key={o.id} onClick={() => open(o.id)} className={`cursor-pointer ${o.id === openId ? "bg-paper-2" : ""} ${o.status === "placed" ? "shadow-[inset_4px_0_0_var(--tomato)]" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold">{o.code}</div>
                        <div className="text-xs text-ink-2">{ago(o.createdAt, now)}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold">{o.customer.name}</div>
                        <div className="text-xs text-ink-2">{o.customer.phone}</div>
                      </td>
                      <td className="px-3 py-3.5 font-bold">{where(o)}</td>
                      <td className="max-w-[260px] px-3 py-3.5">
                        <div className="truncate" title={itemsSummary(o)}>
                          {itemsSummary(o)}
                        </div>
                        {o.note && <div className="truncate text-xs font-bold text-tomato">“{o.note}”</div>}
                      </td>
                      <td className="px-3 py-3.5 text-right font-extrabold tabular-nums">{formatBDT(o.totals.total)}</td>
                      <td className="px-3 py-3.5">
                        <PaymentBadge payment={o.payment} />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={o.status} />
                          <LateTag o={o} now={now} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {label ? (
                          <button disabled={busy === o.id} onClick={() => advance(o)} className="h-9 whitespace-nowrap rounded-full bg-ink px-4 text-xs font-extrabold text-page disabled:opacity-50">
                            {busy === o.id ? "Saving…" : label}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-2">{dayClock(o.timeline[o.timeline.length - 1].at)}</span>
                        )}
                        {rowError?.id === o.id && <div className="mt-1 text-xs font-bold text-tomato">{rowError.msg}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* phone / tablet cards */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {shown.map((o) => {
              const label = nextActionLabel(o);
              return (
                <li key={o.id} className={`rounded-3xl border bg-page p-4 ${o.status === "placed" ? "border-tomato" : "border-line"}`}>
                  <button onClick={() => open(o.id)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-step-1 font-extrabold">{o.code}</div>
                        <div className="text-xs text-ink-2">
                          {ago(o.createdAt, now)} · {where(o)}
                        </div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-3 font-bold">{o.customer.name}</div>
                    <div className="line-clamp-2 text-sm text-ink-2">{itemsSummary(o)}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-step-1 font-extrabold tabular-nums">{formatBDT(o.totals.total)}</span>
                      <PaymentBadge payment={o.payment} />
                    </div>
                  </button>
                  {label && (
                    <div className="mt-3 flex items-center gap-3">
                      <button disabled={busy === o.id} onClick={() => advance(o)} className="h-11 flex-1 rounded-full bg-ink text-sm font-extrabold text-page disabled:opacity-50">
                        {busy === o.id ? "Saving…" : label}
                      </button>
                      <LateTag o={o} now={now} />
                    </div>
                  )}
                  {rowError?.id === o.id && <div className="mt-2 text-xs font-bold text-tomato">{rowError.msg}</div>}
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm font-bold">
              <span className="text-ink-2">
                {page * PAGE + 1}–{Math.min(list.length, page * PAGE + PAGE)} of {list.length}
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-10 rounded-full border border-line px-4 disabled:opacity-40">
                  ← Previous
                </button>
                <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="h-10 rounded-full border border-line px-4 disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <OrderDrawer order={selected} onClose={() => open(null)} />
    </>
  );
}
