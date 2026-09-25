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
    <div className="relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center overflow-hidden">
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dishImage(hero)}
          alt=""
          className={`relative z-10 w-[78%] drop-shadow-[0_24px_24px_rgba(42,26,16,.25)] ${status === "cooking" ? "animate-[float_1.6s_ease-in-out_infinite]" : "animate-[float_5s_ease-in-out_infinite]"}`}
          style={{ filter: status === "placed" ? "grayscale(.5)" : undefined }}
        />
      )}
      {status === "out" && (
        <div className="absolute bottom-2 left-0 right-0 h-10 overflow-hidden">
          <span className="absolute text-4xl" style={{ animation: "marquee 3s linear infinite reverse" }}>
            🛵
          </span>
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
        <h1 className="puff text-4xl">We can&apos;t find that order.</h1>
        <Link href="/menu" className="text-tomato">
          Back to the menu →
        </Link>
      </div>
    );
  if (!order) return <div className="flex min-h-[50vh] items-center justify-center text-ink-2">Finding your order…</div>;

  const flow = flowFor(order.mode);
  const idx = order.status === "cancelled" ? -1 : flow.indexOf(order.status);
  const at = (s: OrderStatus) => order.timeline.find((t) => t.status === s)?.at;
  const eta = order.mode === "delivery" ? "30–45 min" : order.mode === "pickup" ? "≈ 20 min" : "≈ 15 min";

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-tomato">
          Order {order.code} · {order.mode === "dinein" ? `Table ${order.customer.table}` : order.mode}
        </p>
        <h1 className="puff text-[clamp(2.6rem,6vw,4.6rem)] font-light leading-[0.95]">
          {statusLabel[order.status]}
          <span className="text-tomato">.</span>
        </h1>
        <p className="mt-4 max-w-md text-ink-2">{STAGE_COPY[order.status]}</p>
        {order.status !== "delivered" && order.status !== "cancelled" && <p className="mt-2 text-sm text-ink-2">Estimated: {eta} · this page updates live</p>}

        <ol className="mt-10 flex flex-col">
          {flow.map((s, k) => {
            const done = k <= idx;
            const current = k === idx;
            const time = at(s);
            return (
              <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                {k < flow.length - 1 && <span className={`absolute left-[11px] top-7 h-[calc(100%-20px)] w-px ${k < idx ? "bg-tomato" : "bg-paper-2"}`} />}
                <span
                  className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] transition ${done ? "border-tomato bg-tomato text-page" : "border-line text-transparent"}`}
                >
                  ✓{current && <span className="absolute inset-0 animate-ping rounded-full bg-tomato/60" />}
                </span>
                <div className="flex flex-1 items-baseline justify-between gap-4">
                  <span className={done ? "text-ink" : "text-ink-2"}>{statusLabel[s]}</span>
                  {time && <span className="text-xs tabular-nums text-ink-2">{new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-6">
        <StageArt status={order.status} lines={order.lines} />
        <div className="rounded-[28px] border border-line bg-page p-6">
          <ul className="flex flex-col gap-2 text-sm">
            {order.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4">
                <span>
                  <span className="text-ink-2">{l.qty}×</span> {l.name}
                </span>
                <span className="tabular-nums">{formatBDT(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-ink-2">Total · {order.payment.status === "paid" ? `Paid by ${order.payment.method}` : "Cash on delivery"}</span>
            <span className="puff text-2xl text-tomato">{formatBDT(order.totals.total)}</span>
          </div>
        </div>
        <p className="text-center text-sm text-ink-2">
          Questions? Call{" "}
          <a className="text-ink underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>
            {site.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
