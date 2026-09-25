"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cuisineName, formatBDT, menu } from "@/config/menu";
import { useAdmin } from "./AdminData";
import { PageHeader, Segmented } from "./ui";

/* ---------- menu availability ---------- */

export function MenuAvailability() {
  const { soldOut, setDishSoldOut } = useAdmin();
  const off = menu.filter((m) => soldOut.includes(m.id)).length;
  return (
    <>
      <PageHeader title="Menu" sub={off ? `${off} dish${off > 1 ? "es" : ""} switched off — guests can't order ${off > 1 ? "them" : "it"}.` : "Everything is available."} />
      <ul className="grid gap-2 md:grid-cols-2">
        {menu.map((m) => {
          const isOff = soldOut.includes(m.id);
          return (
            <li key={m.id}>
              <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${isOff ? "border-tomato/50 bg-tomato/5" : "border-line bg-page"}`}>
                <span className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/menu/${m.id}.webp`} alt="" className={`h-12 w-12 object-contain ${isOff ? "grayscale" : ""}`} />
                  <span>
                    <span className="block font-extrabold">{m.name}</span>
                    <span className="text-xs font-semibold text-ink-2">
                      {cuisineName(m.cuisine)} · {formatBDT(m.price)}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3 text-xs font-extrabold">
                  <span className={isOff ? "text-tomato" : "text-basil"}>{isOff ? "Sold out" : "Available"}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={`${m.name} available`}
                    checked={!isOff}
                    onChange={(e) => setDishSoldOut(m.id, !e.target.checked)}
                    className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-paper-2 transition before:block before:h-6 before:w-6 before:rounded-full before:bg-ink before:transition checked:bg-basil checked:before:translate-x-5"
                  />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ---------- reservations ---------- */

export function ReservationsView() {
  const { reservations, decideReservation } = useAdmin();
  const [filter, setFilter] = useState<"requested" | "upcoming" | "all">("requested");
  const today = new Date().toISOString().slice(0, 10);
  const list = reservations
    .filter((r) => (filter === "requested" ? r.status === "requested" : filter === "upcoming" ? r.date >= today && r.status !== "declined" : true))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      <PageHeader title="Reservations" sub={`${reservations.filter((r) => r.status === "requested").length} waiting for a reply`}>
        <Segmented label="Show" value={filter} onChange={setFilter} options={[{ value: "requested", label: "Needs reply" }, { value: "upcoming", label: "Upcoming" }, { value: "all", label: "All" }]} />
      </PageHeader>
      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-16">
          <p className="text-step-2 font-extrabold">Nothing here.</p>
          <p className="mt-1 text-ink-2">Table requests from the website land here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-page px-5 py-4">
              <div>
                <div className="font-extrabold">
                  {r.name} · {r.guests} {r.guests === 1 ? "guest" : "guests"}
                </div>
                <div className="text-sm font-semibold text-ink-2">
                  {new Date(r.date + "T00:00").toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })} at {r.time} ·{" "}
                  <a href={`tel:${r.phone}`} className="underline">
                    {r.phone}
                  </a>
                  {r.note ? ` · “${r.note}”` : ""}
                </div>
              </div>
              {r.status === "requested" ? (
                <div className="flex gap-2">
                  <button onClick={() => decideReservation(r.id, "confirmed")} className="h-10 rounded-full bg-basil px-5 text-sm font-extrabold text-page">
                    Confirm
                  </button>
                  <button onClick={() => decideReservation(r.id, "declined")} className="h-10 rounded-full border border-line px-5 text-sm font-bold text-ink-2">
                    Decline
                  </button>
                </div>
              ) : (
                <span className={`text-sm font-extrabold ${r.status === "confirmed" ? "text-basil" : "text-tomato"}`}>{r.status === "confirmed" ? "✓ Confirmed" : "✕ Declined"}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------- table QR codes ---------- */

export function TablesView() {
  const [count, setCount] = useState(12);
  const [codes, setCodes] = useState<{ n: number; src: string }[]>([]);
  useEffect(() => {
    const origin = window.location.origin;
    Promise.all(
      Array.from({ length: count }, (_, i) => i + 1).map(async (n) => ({
        n,
        src: await QRCode.toDataURL(`${origin}/menu?table=${n}`, { margin: 1, width: 320, color: { dark: "#2a1a10", light: "#faf3e7" } }),
      })),
    ).then(setCodes);
  }, [count]);

  return (
    <>
      <PageHeader title="Table QR codes" sub="Print one per table. Guests scan, order and pay from their phone — the order arrives tagged with the table number.">
        <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-page px-4 text-sm font-bold">
          Tables
          <input type="number" min={1} max={60} value={count} onChange={(e) => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} className="w-14 bg-transparent text-right outline-none" />
        </label>
        <button onClick={() => window.print()} className="h-10 rounded-full bg-ink px-5 text-sm font-extrabold text-page">
          Print all
        </button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 print:grid-cols-4">
        {codes.map((c) => (
          <figure key={c.n} className="flex break-inside-avoid flex-col items-start gap-3 rounded-3xl border border-line bg-page p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={`QR code for table ${c.n}`} className="w-full" />
            <figcaption>
              <span className="puff puff-tomato block text-step-3">Table {c.n}</span>
              <span className="text-xs font-bold text-ink-2">Scan to order</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
