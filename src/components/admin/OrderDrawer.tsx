"use client";

import { useEffect, useState } from "react";
import { formatBDT } from "@/config/menu";
import { site } from "@/config/site";
import { nextStatuses, statusLabel, type Order } from "@/lib/types";
import { useAdmin } from "./AdminData";
import { LateTag, PaymentBadge, StatusBadge, clock, dayClock, nextActionLabel, useNow, where } from "./ui";

const REASONS = ["Customer asked to cancel", "Item out of stock", "Couldn't reach the customer", "Outside delivery area", "Kitchen is closing"];

const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("88") ? digits : `88${digits}`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-6 py-5">
      <h3 className="mb-3 text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">{title}</h3>
      {children}
    </section>
  );
}

function Body({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const { patchOrder } = useAdmin();
  const now = useNow(15000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const [note, setNote] = useState(o.staffNote ?? "");
  const [noteSaved, setNoteSaved] = useState(true);

  const run = async (patch: Parameters<typeof patchOrder>[1]) => {
    setBusy(true);
    setError("");
    const err = await patchOrder(o.id, patch);
    if (err) setError(err);
    setBusy(false);
    return !err;
  };

  const next = nextStatuses(o).find((s) => s !== "cancelled");
  const label = nextActionLabel(o);
  const canCancel = nextStatuses(o).includes("cancelled");
  const unpaid = o.payment.status !== "paid" && o.status !== "cancelled";
  const mapUrl = o.customer.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.customer.address}, ${site.city}`)}` : null;

  return (
    <>
      {/* header */}
      <div className="px-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">
              {where(o)} · {dayClock(o.createdAt)}
            </p>
            <h2 className="puff puff-ink mt-1 text-step-5">{o.code}</h2>
          </div>
          <button onClick={onClose} aria-label="Close order" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line">
            ✕
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={o.status} />
          <PaymentBadge payment={o.payment} />
          <LateTag o={o} now={now} />
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-col gap-2">
          {label && next && (
            <button disabled={busy} onClick={() => run({ status: next })} className="h-12 rounded-full bg-ink text-sm font-extrabold text-page disabled:opacity-50">
              {busy ? "Saving…" : `${label} →`}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {unpaid && (
              <button disabled={busy} onClick={() => run({ markPaid: true })} className="h-11 rounded-full border border-basil text-sm font-bold text-basil disabled:opacity-50">
                Mark paid · {formatBDT(o.totals.total)}
              </button>
            )}
            <a href={`/print/${o.id}?type=kot`} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-full border border-line text-sm font-bold">
              Kitchen ticket
            </a>
            <a href={`/print/${o.id}?type=receipt`} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-full border border-line text-sm font-bold">
              Print receipt
            </a>
            {canCancel && !cancelling && (
              <button onClick={() => setCancelling(true)} className="h-11 rounded-full border border-line text-sm font-bold text-tomato">
                Cancel order
              </button>
            )}
          </div>

          {cancelling && (
            <div className="mt-2 rounded-2xl border border-tomato/40 bg-tomato/5 p-4">
              <p className="mb-3 font-extrabold">Why is {o.code} being cancelled?</p>
              <div className="flex flex-col gap-2">
                {[...REASONS, "Other"].map((r) => (
                  <label key={r} className="flex items-center gap-3 text-sm font-semibold">
                    <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-[var(--tomato)]" />
                    {r}
                  </label>
                ))}
                {reason === "Other" && <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Reason" autoFocus className="h-10 rounded-xl border border-line bg-page px-3 text-sm outline-none focus:border-ink" />}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={busy || (reason === "Other" && !other.trim())}
                  onClick={async () => {
                    if (await run({ status: "cancelled", cancelReason: reason === "Other" ? other : reason })) setCancelling(false);
                  }}
                  className="h-10 flex-1 rounded-full bg-tomato text-sm font-extrabold text-page disabled:opacity-50"
                >
                  Cancel order
                </button>
                <button onClick={() => setCancelling(false)} className="h-10 flex-1 rounded-full border border-line text-sm font-bold">
                  Keep it
                </button>
              </div>
            </div>
          )}
          {error && <p className="rounded-xl bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato">{error}</p>}
        </div>
      </div>

      {o.status === "cancelled" && o.cancelReason && (
        <Section title="Cancelled">
          <p className="font-bold">{o.cancelReason}</p>
        </Section>
      )}

      <Section title="Customer">
        <p className="text-step-1 font-extrabold">{o.customer.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${o.customer.phone}`} className="flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold">
            📞 {o.customer.phone}
          </a>
          <a href={`https://wa.me/${waNumber(o.customer.phone)}?text=${encodeURIComponent(`Hi ${o.customer.name}, this is ${site.name} about your order ${o.code}.`)}`} target="_blank" rel="noreferrer" className="flex h-10 items-center rounded-full border border-line px-4 text-sm font-bold">
            WhatsApp
          </a>
        </div>
        {o.customer.address && (
          <div className="mt-3">
            <p className="font-semibold">{o.customer.address}</p>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-bold text-tomato">
                Open in Google Maps →
              </a>
            )}
          </div>
        )}
        {o.customer.table && <p className="mt-3 font-bold">Dine-in · Table {o.customer.table}</p>}
      </Section>

      <Section title={`Items · ${o.lines.reduce((s, l) => s + l.qty, 0)}`}>
        <ul className="flex flex-col gap-2">
          {o.lines.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-4">
              <span>
                <span className="font-extrabold">{l.qty}×</span> <span className="font-semibold">{l.name}</span>
                <span className="ml-2 text-xs text-ink-2">{formatBDT(l.price)} each</span>
              </span>
              <span className="font-bold tabular-nums">{formatBDT(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        {o.note && <p className="mt-4 rounded-xl bg-mustard/20 px-4 py-3 text-sm font-bold">Customer note: “{o.note}”</p>}
        <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-2">Subtotal</dt>
            <dd className="tabular-nums">{formatBDT(o.totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">VAT</dt>
            <dd className="tabular-nums">{formatBDT(o.totals.vat)}</dd>
          </div>
          {o.mode === "delivery" && (
            <div className="flex justify-between">
              <dt className="text-ink-2">Delivery</dt>
              <dd className="tabular-nums">{o.totals.delivery ? formatBDT(o.totals.delivery) : "Free"}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between text-step-1 font-extrabold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(o.totals.total)}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Payment">
        <p className="font-bold">
          {{ bkash: "bKash", nagad: "Nagad", card: "Card", cod: "Cash on delivery / at table" }[o.payment.method]} ·{" "}
          {o.payment.status === "paid" ? <span className="text-basil">Paid{o.payment.paidAt ? ` at ${clock(o.payment.paidAt)}` : ""}</span> : <span className="text-mustard-deep">Collect {formatBDT(o.totals.total)}</span>}
        </p>
      </Section>

      <Section title="Staff note">
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteSaved(false);
          }}
          rows={3}
          placeholder="Only staff can see this — e.g. rider name, allergy double-checked…"
          className="w-full rounded-2xl border border-line bg-page px-4 py-3 text-sm outline-none focus:border-ink"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-ink-2">{noteSaved ? (o.staffNote ? "Saved" : "") : "Unsaved changes"}</span>
          <button
            disabled={noteSaved || busy}
            onClick={async () => {
              if (await run({ staffNote: note })) setNoteSaved(true);
            }}
            className="h-9 rounded-full bg-ink px-4 text-xs font-extrabold text-page disabled:opacity-40"
          >
            Save note
          </button>
        </div>
      </Section>

      <Section title="Timeline">
        <ol className="flex flex-col">
          {o.timeline.map((t, i) => {
            const prev = o.timeline[i - 1];
            const took = prev ? Math.max(1, Math.round((t.at - prev.at) / 60000)) : null;
            return (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < o.timeline.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden />}
                <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${t.status === "cancelled" ? "bg-tomato" : "bg-ink"}`} aria-hidden />
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <span className="font-bold">{statusLabel[t.status]}</span>
                  <span className="text-xs tabular-nums text-ink-2">
                    {clock(t.at)}
                    {took !== null && ` · ${took} min`}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <a href={`/order/${o.id}`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-tomato">
          See what the customer sees →
        </a>
      </Section>
    </>
  );
}

/** Right-hand drawer on desktop, full-height sheet on phones. */
export default function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  useEffect(() => {
    if (!order) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [order, onClose]);

  return (
    <div className={`fixed inset-0 z-[70] ${order ? "" : "pointer-events-none"}`} aria-hidden={!order}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${order ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label={order ? `Order ${order.code}` : "Order"}
        className={`absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto bg-paper pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[-20px_0_40px_rgba(42,26,16,.12)] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${order ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* keyed so form state (cancel reason, note draft) resets per order */}
        {order && <Body key={order.id} order={order} onClose={onClose} />}
      </aside>
    </div>
  );
}
