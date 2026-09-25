"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/config/site";

const OCCASIONS = ["Birthday", "Anniversary", "Date night", "Business", "Family"];
const MAX_GUESTS = 20;

const label = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

type Done = { name: string; date: string; time: string; guests: number };

export default function ReserveForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("20:00");
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const extra = String(fd.get("note") ?? "").trim();
    const note = [occasion, extra].filter(Boolean).join(" — ");
    const body = { name: fd.get("name"), phone: fd.get("phone"), date, time, guests, note };
    const res = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong — please call us.");
    setDone({ name: String(body.name), date, time, guests });
  };

  const field = "h-12 w-full rounded-2xl border border-line bg-page px-4 text-step-0 font-semibold outline-none focus:border-ink";
  const chip = (on: boolean) => `h-11 rounded-full px-4 text-sm font-extrabold ${on ? "bg-ink text-page" : "border border-line bg-page text-ink"}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16">
      <div>
        <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">Reservations</p>
        <h1 className="puff text-step-8">
          <span className="puff-ink block">Save your seat</span>
          <span className="puff-tomato block">at the table.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] text-step-1 font-semibold leading-relaxed text-ink-2">
          Birthdays, first dates, family nights, the whole office. Tell us when — we&apos;ll confirm by SMS within the hour.
        </p>

        <dl className="mt-10 grid max-w-xl gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">Open</dt>
            {site.hours.map((h) => (
              <dd key={h.days} className="mt-1 font-bold">
                {h.days} · {h.time}
              </dd>
            ))}
          </div>
          <div>
            <dt className="text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">Groups of 12+</dt>
            <dd className="mt-1 font-bold">A set menu from all six kitchens. Call {site.phone}.</dd>
          </div>
        </dl>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/table.webp"
          alt="The BiteME lazy-susan table set with kacchi biryani, shorshe ilish and mango lassi"
          className="mt-10 hidden w-full max-w-2xl lg:block"
        />
      </div>

      <div className="rounded-[32px] border border-line bg-page p-6 md:p-8">
        {done ? (
          <div className="flex min-h-[420px] flex-col justify-center">
            <p className="text-step--1 font-extrabold uppercase tracking-[0.18em] text-basil">Request sent</p>
            <h2 className="puff puff-ink mt-3 text-step-6">See you soon, {done.name.split(" ")[0]}.</h2>
            <p className="mt-4 text-step-1 font-bold">
              {new Date(done.date + "T00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })} at {label(done.time)} · {done.guests} {done.guests === 1 ? "guest" : "guests"}
            </p>
            <p className="mt-3 font-semibold text-ink-2">We&apos;ll confirm by SMS shortly. Need to change something? Call {site.phone}.</p>
            <Link href="/" className="mt-8 self-start text-step-0 font-extrabold text-tomato">
              Back to BiteME →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
                Name
                <input name="name" required minLength={2} autoComplete="name" className={field} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
                Mobile
                <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" pattern="^(\+?88)?01[3-9][0-9]{8}$" className={field} />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
              Date
              <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink-2">Time</legend>
              <div className="flex flex-wrap gap-2">
                {site.reservationSlots.map((t) => (
                  <button type="button" key={t} onClick={() => setTime(t)} aria-pressed={time === t} className={chip(time === t)}>
                    {label(t)}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink-2">Guests</legend>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-line bg-page">
                  <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid h-12 w-12 place-items-center text-xl font-bold">
                    −
                  </button>
                  <span className="w-10 text-center text-step-1 font-extrabold tabular-nums" aria-live="polite">
                    {guests}
                  </span>
                  <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} className="grid h-12 w-12 place-items-center text-xl font-bold">
                    +
                  </button>
                </div>
                <span className="font-bold text-ink-2">{guests === 1 ? "Just me" : `${guests} people`}</span>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink-2">Occasion (optional)</legend>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button type="button" key={o} onClick={() => setOccasion((c) => (c === o ? null : o))} aria-pressed={occasion === o} className={chip(occasion === o)}>
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
              Anything we should know? (optional)
              <input name="note" maxLength={200} placeholder="High chair, allergies, a window table…" className={field} />
            </label>

            {error && <p className="rounded-2xl bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato">{error}</p>}

            <button disabled={busy} className="h-14 rounded-full bg-tomato text-step-1 font-extrabold text-page shadow-[0_5px_0_var(--tomato-deep)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--tomato-deep)] disabled:opacity-60">
              {busy ? "Sending…" : `Request a table for ${guests}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
