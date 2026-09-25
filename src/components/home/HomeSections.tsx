"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cuisines, menu, type MenuItem } from "@/config/menu";
import { site } from "@/config/site";
import MenuCard from "../shop/MenuCard";
import DishSheet from "../shop/DishSheet";
import { useSoldOut } from "../shop/useSoldOut";
import Footer from "../Footer";

gsap.registerPlugin(ScrollTrigger);

const SIGNATURES = ["kacchi-biryani", "tonkotsu-ramen", "butter-chicken", "margherita", "xiao-long-bao", "kacchi-burger", "dragon-roll", "ilish-bhapa"];

function Marquee() {
  const words = cuisines.filter((c) => c.id !== "drinks");
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {words.map((c) => (
        <span key={c.id} className="flex items-center gap-10">
          <span className="font-display text-[clamp(3rem,8vw,7rem)] font-light italic" style={{ color: c.accent }}>
            {c.name}
          </span>
          <span className="font-bangla text-2xl text-cream-dim md:text-3xl">{c.bn}</span>
          <span className="text-3xl text-cream-dim">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-line py-6" aria-hidden>
      <div className="flex w-max animate-[marquee_38s_linear_infinite]">
        {row}
        {row}
      </div>
    </div>
  );
}

const MODES = [
  {
    title: "Delivery",
    bn: "হোম ডেলিভারি",
    body: "Banani, Gulshan, Baridhara & Niketan in 30–45 minutes. Sealed, insulated, tracked live from our wok to your door.",
    cta: "Order delivery",
    href: "/menu",
    icon: "🛵",
  },
  {
    title: "Pickup",
    bn: "নিজে নিয়ে যান",
    body: "Order ahead and skip the wait. We'll text you the second it leaves the pass — usually in about 20 minutes.",
    cta: "Order for pickup",
    href: "/menu",
    icon: "🥡",
  },
  {
    title: "Dine-in by QR",
    bn: "টেবিলে বসেই অর্ডার",
    body: "Scan the code on your table, order from your phone, pay by bKash, Nagad or card. The kitchen sees it instantly.",
    cta: "See how it works",
    href: "/menu?table=7",
    icon: "📱",
  },
];

function Reserve() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setState("error");
      return;
    }
    setState("done");
  };

  const field = "h-12 w-full rounded-2xl border border-white/12 bg-ink px-4 text-sm outline-none transition focus:border-saffron";

  return (
    <section id="reserve" className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
      <div data-reveal>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-saffron">Reservations</p>
        <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.92] tracking-[-0.02em]">
          Save your seat
          <br />
          <span className="italic text-saffron">at the table.</span>
        </h2>
        <p className="mt-6 max-w-md text-cream/75">
          Birthdays, first dates, family nights, the whole office. Tell us when — we&apos;ll confirm by SMS within the hour. Groups of 12+ get a set menu from all six kitchens.
        </p>
      </div>
      <div data-reveal className="rounded-[32px] border border-line bg-ink-2 p-6 md:p-8">
        {state === "done" ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl">🕯️</span>
            <p className="font-display text-3xl italic">Your table is requested.</p>
            <p className="text-cream-dim">We&apos;ll confirm by SMS shortly. See you soon.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5 text-xs text-cream-dim">
              Name
              <input name="name" required autoComplete="name" className={field} />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5 text-xs text-cream-dim">
              Mobile
              <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={field} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-cream-dim">
              Date
              <input name="date" type="date" required min={today} defaultValue={today} className={field} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-cream-dim">
              Time
              <select name="time" required defaultValue="20:00" className={field}>
                {["12:30", "13:30", "14:30", "18:00", "19:00", "20:00", "21:00", "22:00"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-1.5 text-xs text-cream-dim">
              Guests
              <select name="guests" defaultValue="2" className={field}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-1.5 text-xs text-cream-dim">
              Occasion or note (optional)
              <input name="note" className={field} placeholder="Anniversary, high chair, allergies…" />
            </label>
            {state === "error" && <p className="col-span-2 text-sm text-chili">{error}</p>}
            <button disabled={state === "sending"} className="col-span-2 mt-2 h-14 rounded-full bg-saffron font-bold text-ink transition hover:brightness-110 disabled:opacity-60">
              {state === "sending" ? "Sending…" : "Request a table"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function HomeSections() {
  const root = useRef<HTMLDivElement>(null);
  const soldOut = useSoldOut();
  const [open, setOpen] = useState<MenuItem | null>(null);
  const signatures = SIGNATURES.map((id) => menu.find((m) => m.id === id)!).filter(Boolean);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <Marquee />

      <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div data-reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.92] tracking-[-0.02em]">
            Order <span className="italic text-saffron">your way.</span>
          </h2>
          <p className="max-w-md text-cream/70">Pay with bKash, Nagad, any card, or cash. Every order is tracked live — you&apos;ll see it hit the fire.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              data-reveal
              className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[28px] border border-line bg-ink-2 p-7 transition hover:border-saffron/50"
            >
              <span className="text-4xl">{m.icon}</span>
              <h3 className="mt-6 font-display text-3xl">{m.title}</h3>
              <span className="font-bangla text-sm text-cream-dim">{m.bn}</span>
              <p className="mt-4 text-sm leading-relaxed text-cream/70">{m.body}</p>
              <span className="mt-auto pt-6 text-sm font-semibold text-saffron">
                {m.cta} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10 md:pb-32">
        <div data-reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.92] tracking-[-0.02em]">
            The ones people
            <br />
            <span className="italic text-saffron">cross the city for.</span>
          </h2>
          <Link href="/menu" className="self-start rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-saffron hover:text-saffron md:self-auto">
            Full menu · {menu.length} dishes →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {signatures.map((m) => (
            <div key={m.id} data-reveal>
              <MenuCard item={m} soldOut={soldOut.includes(m.id)} onOpen={() => setOpen(m)} />
            </div>
          ))}
        </div>
      </section>

      <Reserve />

      <section id="visit" className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-24 md:grid-cols-5 md:px-10 md:pb-32">
        <div data-reveal className="md:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-saffron">Visit</p>
          <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-light leading-[0.95]">
            Find us in <span className="italic text-saffron">Banani.</span>
          </h2>
          <p className="mt-6 text-cream/75">{site.address}</p>
          <div className="mt-6 flex flex-col gap-1 text-sm">
            {site.hours.map((h) => (
              <span key={h.days}>
                <span className="inline-block w-24 text-cream-dim">{h.days}</span> {h.time}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="rounded-full bg-cream px-6 py-3 text-sm font-bold text-ink hover:bg-saffron">Call us</a>
            <a href={`https://wa.me/${site.whatsapp}`} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:border-saffron hover:text-saffron">WhatsApp</a>
          </div>
        </div>
        <div data-reveal className="overflow-hidden rounded-[28px] border border-line md:col-span-3">
          <iframe
            title="Map to BiteME"
            src={`https://www.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`}
            className="h-[380px] w-full grayscale invert-[.92] hue-rotate-180 md:h-full md:min-h-[420px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <Footer />
      <DishSheet item={open} soldOut={!!open && soldOut.includes(open.id)} onClose={() => setOpen(null)} />
    </div>
  );
}
