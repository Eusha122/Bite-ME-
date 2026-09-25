import Link from "next/link";
import { site } from "@/config/site";
import { WaveEdge } from "./Wave";

export default function Footer() {
  return (
    <footer>
      <WaveEdge color="var(--tomato)" />
      <div className="-mt-px bg-tomato px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 text-page md:px-[5vw] md:pt-16">
        <h2 className="puff puff-paper text-step-7 md:text-step-8">
          Hungry yet?
        </h2>
        <nav aria-label="Footer" className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-step-2 font-extrabold">
          <Link href="/menu">Menu</Link>
          <Link href="/reserve">Reserve a table</Link>
          <Link href="/support">Support</Link>
        </nav>
        <div className="mt-12 grid gap-10 text-step-0 font-bold md:grid-cols-3">
          <div>
            <p className="mb-2 text-step--1 font-extrabold uppercase tracking-[0.18em] text-mustard">Find us</p>
            <p>{site.address}</p>
          </div>
          <div>
            <p className="mb-2 text-step--1 font-extrabold uppercase tracking-[0.18em] text-mustard">Open</p>
            {site.hours.map((h) => (
              <p key={h.days}>
                {h.days} · {h.time}
              </p>
            ))}
          </div>
          <div>
            <p className="mb-2 text-step--1 font-extrabold uppercase tracking-[0.18em] text-mustard">Call</p>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-step--1 font-bold text-page/70">
          <p>
            © {new Date().getFullYear()} {site.name}. Prices include fresh ingredients · VAT added at checkout.
          </p>
          {/* the way into the admin panel: /admin asks for the staff PIN */}
          <Link href="/admin" className="text-page underline decoration-2 underline-offset-4">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
