"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBDT } from "@/config/menu";
import { site } from "@/config/site";
import { dishImage } from "@/lib/dishImage";
import { flowFor, statusLabel, type Order, type OrderStatus } from "@/lib/types";

type PublicOrder = Pick<Order, "id" | "code" | "createdAt" | "mode" | "status" | "timeline" | "lines" | "totals" | "payment"> & {
  customer: { name: string; table?: string };
};

const STAGE_COPY: Partial<Record<OrderStatus, string>> = {
  placed: "We've got it. The ticket just printed in the kitchen.",
  accepted: "Chef has your ticket. Ingredients are coming out of the walk-in.",
  cooking: "Your food is on the fire right now.",
  ready: "Plated, checked, and ready at the pass.",
  out: "Our rider is on the way — keep your phone close.",
  delivered: "Enjoy every bite. Thank you for eating with us.",
  cancelled: "This order was cancelled. Call us if that's unexpected.",
};

/** A little animated scene for each stage — no WebGL needed. */
function StageArt({ status, lines }: { status: OrderStatus; lines: PublicOrder["lines"] }) {
  const hero = lines[0]?.id;
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center">
      <div className="absolute inset-[12%] rounded-full bg-saffron/20 blur-3xl" />
      {status === "cooking" &&
        Array.from({ length: 9 }).map((_, k) => (
          <span
            key={k}
            className="absolute bottom-[18%] h-16 w-6 origin-bottom rounded-full bg-gradient-to-t from-chili via-saffron to-transparent opacity-80 blur-[2px]"
            style={{ left: `${22 + k * 7}%`, animation: `flame ${0.5 + (k % 3) * 0.17}s ease-in-out ${k * 0.07}s infinite` }}
          />
        ))}
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dishImage(hero)}
          alt=""
          className="relative z-10 w-[78%] animate-[float_5s_ease-in-out_infinite] drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]"
          style={{ filter: status === "placed" ? "grayscale(.6) brightness(.8)" : undefined }}
        />
      )}
      {status === "out" && (
        <div className="absolute bottom-2 left-0 right-0 h-10 overflow-hidden">
          <span className="absolute text-4xl" style={{ animation: "marquee 3s linear infinite reverse" }}>🛵</span>
        </div>
      )}
    </div>
  );
}

export default function OrderTracker({ id }: { id: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!alive) return;
      if (res.status === 404) return setMissing(true);
      if (res.ok) setOrder(await res.json());
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  if (missing)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-4xl">We can&apos;t find that order.</h1>
        <Link href="/menu" className="text-saffron">Back to the menu →</Link>
      </div>
    );
  if (!order) return <div className="flex min-h-[50vh] items-center justify-center text-cream-dim">Finding your order…</div>;

  const flow = flowFor(order.mode);
  const idx = order.status === "cancelled" ? -1 : flow.indexOf(order.status);
  const at = (s: OrderStatus) => order.timeline.find((t) => t.status === s)?.at;
  const eta = order.mode === "delivery" ? "30–45 min" : order.mode === "pickup" ? "≈ 20 min" : "≈ 15 min";

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-saffron">
          Order {order.code} · {order.mode === "dinein" ? `Table ${order.customer.table}` : order.mode}
        </p>
        <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] font-light leading-[0.95]">
          {statusLabel[order.status]}
          <span className="text-saffron">.</span>
        </h1>
        <p className="mt-4 max-w-md text-cream/75">{STAGE_COPY[order.status]}</p>
        {order.status !== "delivered" && order.status !== "cancelled" && (
          <p className="mt-2 text-sm text-cream-dim">Estimated: {eta} · this page updates live</p>
        )}

        <ol className="mt-10 flex flex-col">
          {flow.map((s, k) => {
            const done = k <= idx;
            const current = k === idx;
            const time = at(s);
            return (
              <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                {k < flow.length - 1 && <span className={`absolute left-[11px] top-7 h-[calc(100%-20px)] w-px ${k < idx ? "bg-saffron" : "bg-white/12"}`} />}
                <span
                  className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] transition ${done ? "border-saffron bg-saffron text-ink" : "border-white/20 text-transparent"}`}
                >
                  ✓{current && <span className="absolute inset-0 animate-ping rounded-full bg-saffron/60" />}
                </span>
                <div className="flex flex-1 items-baseline justify-between gap-4">
                  <span className={done ? "text-cream" : "text-cream-dim"}>{statusLabel[s]}</span>
                  {time && <span className="text-xs tabular-nums text-cream-dim">{new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-6">
        <StageArt status={order.status} lines={order.lines} />
        <div className="rounded-[28px] border border-line bg-ink-2 p-6">
          <ul className="flex flex-col gap-2 text-sm">
            {order.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4">
                <span>
                  <span className="text-cream-dim">{l.qty}×</span> {l.name}
                </span>
                <span className="tabular-nums">{formatBDT(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-cream-dim">
              Total · {order.payment.status === "paid" ? `Paid by ${order.payment.method}` : "Cash on delivery"}
            </span>
            <span className="font-display text-2xl text-saffron">{formatBDT(order.totals.total)}</span>
          </div>
        </div>
        <p className="text-center text-sm text-cream-dim">
          Questions? Call <a className="text-cream underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
        </p>
      </div>
    </div>
  );
}
