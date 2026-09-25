"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/config/site";
import { formatBDT } from "@/config/menu";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Where do you deliver, and how much does it cost?",
    a: `We deliver to ${site.deliveryAreas.join(", ")} in 30–45 minutes. Delivery is ${formatBDT(site.delivery.fee)}, and free on orders over ${formatBDT(site.delivery.freeAbove)}.`,
  },
  {
    q: "How can I pay?",
    a: "bKash, Nagad, any Visa, Mastercard or Amex card, or cash on delivery. At the restaurant you can also pay at your table from your phone.",
  },
  {
    q: "Can I change or cancel my order?",
    a: `Call us on ${site.phone} as soon as possible. We can change or cancel an order until the kitchen starts cooking it — after that, the food is already on the fire.`,
  },
  {
    q: "Do you handle allergies?",
    a: "Tell us in the kitchen note at checkout or when you book. Our kitchens use nuts, dairy, gluten, egg, fish and shellfish, so we can't promise zero cross-contact — but every allergy note is read out on the line.",
  },
  {
    q: "Something was wrong with my order. What now?",
    a: "We're sorry. Send us a photo on WhatsApp with your order code and we'll put it right — a replacement or a refund to the way you paid, usually the same day.",
  },
  {
    q: "How does ordering at the table work?",
    a: "Scan the QR code on your table, pick your dishes and pay from your phone. Your order goes straight to the kitchen with your table number — no waiting to flag someone down.",
  },
  {
    q: "Do you cater events or large groups?",
    a: `Yes — groups of 12 or more get a set menu from all six kitchens, and we cater offices and parties. Email ${site.email} with your date and headcount.`,
  },
];

function TrackOrder() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: fd.get("code"), phone: fd.get("phone") }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong.");
    router.push(`/order/${json.id}`);
  };

  const field = "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-step-0 font-semibold outline-none focus:border-ink";
  return (
    <form onSubmit={submit} className="rounded-[32px] border border-line bg-page p-6 md:p-8">
      <h2 className="puff puff-ink text-step-5">Track an order</h2>
      <p className="mt-2 font-semibold text-ink-2">Your order code is in your confirmation — it looks like BM-1024.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
          Order code
          <input name="code" required placeholder="BM-1024" autoCapitalize="characters" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-2">
          Phone number
          <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={field} />
        </label>
        <button disabled={busy} className="h-12 self-end rounded-full bg-ink px-6 font-extrabold text-page disabled:opacity-60">
          {busy ? "Finding…" : "Track"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-bold text-tomato">{error}</p>}
    </form>
  );
}

export default function Support() {
  const tel = site.phone.replace(/\s/g, "");
  const contacts = [
    { title: "Call us", value: site.phone, href: `tel:${tel}`, note: "Fastest for changes to a live order" },
    { title: "WhatsApp", value: "Message us", href: `https://wa.me/${site.whatsapp}`, note: "Photos, feedback, refunds" },
    { title: "Email", value: site.email, href: `mailto:${site.email}`, note: "Catering, events, partnerships" },
    { title: "Visit", value: "Banani, Dhaka", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`, note: site.address },
  ];

  return (
    <div className="flex flex-col gap-14 md:gap-20">
      <header>
        <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">Support</p>
        <h1 className="puff text-step-8">
          <span className="puff-ink block">How can</span>
          <span className="puff-tomato block">we help?</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-step-1 font-semibold leading-relaxed text-ink-2">
          Real people answer every message, {site.hours[0].days.toLowerCase()} {site.hours[0].time.toLowerCase()}.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {contacts.map((c) => (
          <li key={c.title}>
            <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex h-full flex-col rounded-[28px] border border-line bg-page p-6 active:bg-paper-2">
              <span className="text-step--1 font-extrabold uppercase tracking-[0.16em] text-ink-2">{c.title}</span>
              <span className="mt-3 break-words text-step-2 font-extrabold text-ink">{c.value}</span>
              <span className="mt-auto pt-4 text-sm font-semibold text-ink-2">{c.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <TrackOrder />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16">
        <h2 className="puff puff-ink text-step-6">Good to know</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-step-1 font-extrabold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink text-lg leading-none transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[62ch] font-semibold leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
