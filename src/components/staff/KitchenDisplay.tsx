"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cuisines } from "@/config/menu";
import { flowFor, statusLabel, type Order, type OrderStatus } from "@/lib/types";
import { Logo } from "../Nav";

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "placed", title: "New" },
  { status: "accepted", title: "Accepted" },
  { status: "cooking", title: "On the fire" },
  { status: "ready", title: "Ready / Out" },
];

const ACTION: Partial<Record<OrderStatus, string>> = {
  placed: "Accept",
  accepted: "Start cooking",
  cooking: "Mark ready",
  ready: "Hand over",
  out: "Delivered",
};

/** Two-tone chime generated with WebAudio — no sound file needed. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  } catch {}
}

function Elapsed({ from }: { from: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(s / 60);
  const tone = m >= 20 ? "bg-tomato-deep text-page" : m >= 10 ? "bg-tomato text-page" : "bg-paper-2 text-ink";
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-xs tabular-nums ${tone}`}>
      {m}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

function Ticket({ o, onMove, fresh }: { o: Order; onMove: (id: string, s: OrderStatus) => void; fresh: boolean }) {
  const flow = flowFor(o.mode);
  const next = flow[flow.indexOf(o.status) + 1];
  const where = o.mode === "dinein" ? `Table ${o.customer.table}` : o.mode === "pickup" ? "Pickup" : "Delivery";
  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-page p-4 transition ${fresh ? "animate-pulse border-tomato" : "border-line"}`}>
      <header className="flex items-center justify-between gap-2">
        <div>
          <div className="puff text-2xl leading-none">{o.code}</div>
          <div className="mt-1 text-xs text-ink-2">
            {where} · {o.customer.name}
          </div>
        </div>
        <Elapsed from={o.createdAt} />
      </header>
      <ul className="flex flex-col gap-1.5 border-y border-line py-3">
        {o.lines.map((l) => (
          <li key={l.id} className="flex items-center gap-2 text-[15px]">
            <span className="w-7 font-bold text-tomato">{l.qty}×</span>
            <span className="flex-1">{l.name}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2">{cuisines.find((c) => c.id === l.cuisine)?.name}</span>
          </li>
        ))}
      </ul>
      {o.note && <p className="rounded-xl bg-tomato/10 px-3 py-2 text-sm text-tomato">“{o.note}”</p>}
      <div className="flex gap-2">
        {next && (
          <button onClick={() => onMove(o.id, next)} className="h-12 flex-1 rounded-xl bg-tomato font-bold text-page transition active:scale-95">
            {o.status === "ready" && o.mode === "delivery" ? "Send with rider" : ACTION[o.status]}
          </button>
        )}
        {o.status === "placed" && (
          <button onClick={() => confirm(`Cancel ${o.code}?`) && onMove(o.id, "cancelled")} className="h-12 rounded-xl border border-line px-4 text-sm text-ink-2">
            Reject
          </button>
        )}
      </div>
    </article>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState(false);
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (!res.ok) return;
    const { orders: list } = (await res.json()) as { orders: Order[] };
    const ids = new Set(list.map((o) => o.id));
    if (known.current) {
      const added = list.filter((o) => !known.current!.has(o.id)).map((o) => o.id);
      if (added.length) {
        if (sound) chime();
        setFresh((f) => new Set([...f, ...added]));
        setTimeout(() => setFresh((f) => new Set([...f].filter((x) => !added.includes(x)))), 8000);
      }
    }
    known.current = ids;
    setOrders(list);
  }, [sound]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  const move = async (id: string, status: OrderStatus) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const today = new Date().toDateString();
  const doneToday = orders.filter((o) => o.status === "delivered" && new Date(o.createdAt).toDateString() === today).length;

  return (
    <div className="min-h-dvh px-4 pb-10 pt-5 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="h-10" />
          <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink-2">Kitchen display</span>
          <span className="flex items-center gap-2 text-xs text-basil">
            <span className="h-2 w-2 animate-pulse rounded-full bg-basil" /> Live
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-2">
            {active.length} open · {doneToday} completed today
          </span>
          <button
            onClick={() => {
              setSound((s) => !s);
              if (!sound) chime();
            }}
            className={`rounded-full border px-4 py-2 ${sound ? "border-tomato text-tomato" : "border-line text-ink-2"}`}
          >
            {sound ? "🔔 Chime on" : "🔕 Enable chime"}
          </button>
          <Link href="/admin" className="rounded-full border border-line px-4 py-2 text-ink-2">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = active
            .filter((o) => (col.status === "ready" ? o.status === "ready" || o.status === "out" : o.status === col.status))
            .sort((a, b) => a.createdAt - b.createdAt);
          return (
            <section key={col.status} className="flex flex-col gap-3 rounded-3xl bg-paper-2] p-3">
              <h2 className="flex items-center justify-between px-2 pt-1 text-sm font-semibold uppercase tracking-[0.2em] text-ink-2">
                {col.title}
                <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-ink">{list.length}</span>
              </h2>
              {list.map((o) => (
                <div key={o.id}>
                  {o.status === "out" && <p className="mb-1 px-2 text-xs text-ink-2">{statusLabel.out}</p>}
                  <Ticket o={o} onMove={move} fresh={fresh.has(o.id)} />
                </div>
              ))}
              {list.length === 0 && <p className="px-2 py-8 text-center text-sm text-ink-2">—</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
