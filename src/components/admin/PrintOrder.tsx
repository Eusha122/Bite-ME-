"use client";

import { useEffect, useState } from "react";
import { formatBDT } from "@/config/menu";
import { site } from "@/config/site";
import type { Order } from "@/lib/types";

/**
 * 80 mm thermal-printer layout. "receipt" is the customer bill; "kot" is the
 * kitchen order ticket — big type, quantities and notes, no prices.
 */
export default function PrintOrder({ id, type }: { id: string; type: "receipt" | "kot" }) {
  const [o, setO] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Not found");
        return r.json();
      })
      .then((d) => {
        setO(d);
        setTimeout(() => window.print(), 350);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [id]);

  if (error) return <p className="p-8 font-bold">{error}</p>;
  if (!o) return <p className="p-8 text-ink-2">Preparing…</p>;

  const where = o.mode === "dinein" ? `TABLE ${o.customer.table}` : o.mode === "pickup" ? "PICKUP" : "DELIVERY";
  const time = new Date(o.createdAt).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-dvh bg-paper-2 py-8 print:bg-white print:py-0">
      <style>{`@page { size: 80mm auto; margin: 4mm; } @media print { body { background: #fff; } }`}</style>
      <div className="mx-auto mb-4 flex w-[80mm] gap-2 print:hidden">
        <button onClick={() => window.print()} className="h-10 flex-1 rounded-full bg-ink text-sm font-extrabold text-page">
          Print
        </button>
        <button onClick={() => window.close()} className="h-10 flex-1 rounded-full border border-line bg-page text-sm font-bold">
          Close
        </button>
      </div>

      <article className="mx-auto w-[80mm] bg-white p-4 font-mono text-[12px] leading-snug text-black shadow-[0_8px_24px_rgba(0,0,0,.08)] print:w-auto print:p-0 print:shadow-none">
        {type === "kot" ? (
          <>
            <div className="border-b-2 border-dashed border-black pb-2">
              <div className="text-[22px] font-black">{where}</div>
              <div className="text-[16px] font-bold">
                {o.code} · {time}
              </div>
              <div>{o.customer.name}</div>
            </div>
            <ul className="my-3 flex flex-col gap-2">
              {o.lines.map((l) => (
                <li key={l.id} className="text-[17px] font-bold leading-tight">
                  {l.qty} × {l.name}
                </li>
              ))}
            </ul>
            {o.note && <div className="border-2 border-black p-2 text-[14px] font-bold">NOTE: {o.note}</div>}
            {o.staffNote && <div className="mt-2 text-[12px]">Staff: {o.staffNote}</div>}
            <div className="mt-3 border-t-2 border-dashed border-black pt-2 text-center">— KITCHEN COPY —</div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-[20px] font-black tracking-tight">{site.name}</div>
              <div>{site.address}</div>
              <div>{site.phone}</div>
            </div>
            <div className="my-3 border-y border-dashed border-black py-2">
              <div className="flex justify-between">
                <span>Order</span>
                <b>{o.code}</b>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{time}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span>{where}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer</span>
                <span>{o.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone</span>
                <span>{o.customer.phone}</span>
              </div>
              {o.customer.address && <div className="mt-1">Deliver to: {o.customer.address}</div>}
            </div>
            <table className="w-full">
              <tbody>
                {o.lines.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="pr-2">{l.qty}×</td>
                    <td className="w-full pr-2">{l.name}</td>
                    <td className="whitespace-nowrap text-right">{formatBDT(l.price * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 border-t border-dashed border-black pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatBDT(o.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT</span>
                <span>{formatBDT(o.totals.vat)}</span>
              </div>
              {o.mode === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{o.totals.delivery ? formatBDT(o.totals.delivery) : "Free"}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between text-[16px] font-black">
                <span>TOTAL</span>
                <span>{formatBDT(o.totals.total)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Payment</span>
                <span>
                  {{ bkash: "bKash", nagad: "Nagad", card: "Card", cod: "Cash" }[o.payment.method]} · {o.payment.status === "paid" ? "PAID" : "DUE"}
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">Thank you for eating with us.</div>
          </>
        )}
      </article>
    </div>
  );
}
