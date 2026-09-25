import Link from "next/link";
import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line pt-16">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-10 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="max-w-sm text-cream-dim">{site.description}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 text-xs uppercase tracking-[0.25em] text-cream-dim">Visit</span>
          <span>{site.address}</span>
          <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-saffron">{site.phone}</a>
          {site.hours.map((h) => (
            <span key={h.days} className="text-cream-dim">
              {h.days} · {h.time}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 text-xs uppercase tracking-[0.25em] text-cream-dim">Explore</span>
          <Link href="/menu" className="hover:text-saffron">Order online</Link>
          <Link href="/#reserve" className="hover:text-saffron">Reserve a table</Link>
          <a href={`https://wa.me/${site.whatsapp}`} className="hover:text-saffron">WhatsApp us</a>
          <a href={site.socials.instagram} className="hover:text-saffron">Instagram</a>
          <a href={site.socials.facebook} className="hover:text-saffron">Facebook</a>
        </div>
      </div>
      <div aria-hidden className="select-none px-2 text-center font-display text-[27vw] font-light leading-[0.75] tracking-[-0.06em] text-cream/[0.06]">
        Bite<span className="italic">ME</span>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 border-t border-line px-5 py-5 text-xs text-cream-dim md:flex-row md:px-10">
        <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
        <span>Prices include ingredients sourced fresh daily · VAT {Math.round(site.delivery.vatRate * 100)}% applied at checkout</span>
      </div>
    </footer>
  );
}
