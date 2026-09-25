import Link from "next/link";
import { site } from "@/config/site";
import { legalPages } from "@/config/legal";
import { WaveEdge } from "./Wave";
import PayLogos from "./PayLogos";

const heading = "mb-3 text-step--1 font-extrabold uppercase tracking-[0.18em] text-mustard";

export default function Footer() {
  const tel = site.phone.replace(/\s/g, "");
  return (
    <footer>
      <WaveEdge color="var(--tomato)" />
      <div className="-mt-px bg-tomato px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 text-page md:px-[5vw] md:pt-16">
        <h2 className="puff puff-paper text-step-7 md:text-step-8">Hungry yet?</h2>

        <div className="mt-12 grid gap-10 text-step-0 font-bold sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={heading}>Explore</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/menu">Menu</Link>
              </li>
              <li>
                <Link href="/reserve">Reserve a table</Link>
              </li>
              <li>
                <Link href="/support">Support</Link>
              </li>
              <li>
                <Link href="/account">My account</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={heading}>Legal</p>
            <ul className="flex flex-col gap-2">
              {legalPages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/legal/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>Visit & open</p>
            <p>{site.address}</p>
            <div className="mt-3 flex flex-col gap-1 text-page/90">
              {site.hours.map((h) => (
                <p key={h.days}>
                  {h.days} · {h.time}
                </p>
              ))}
            </div>
          </div>

          <div>
            <p className={heading}>Contact</p>
            <ul className="flex flex-col gap-2">
              <li>
                <a href={`tel:${tel}`}>{site.phone}</a>
              </li>
              <li>
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li className="flex gap-4 pt-1">
                <a href={site.socials.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
                <a href={site.socials.facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t-2 border-page/25 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`${heading} !mb-3`}>We accept</p>
            <PayLogos />
          </div>
          <p className="max-w-[34ch] text-step--1 font-bold text-page/80 md:text-right">Also cash on delivery and at your table. Card and wallet payments are processed securely by our payment partner.</p>
        </div>

        <p className="mt-10 text-step--1 font-bold text-page/80">
          Developed by{" "}
          <a href="https://eusha.vercel.app" target="_blank" rel="noreferrer" className="text-page underline decoration-2 underline-offset-4">
            Eusha Ibna Akbor
          </a>{" "}
          
        </p>
      </div>
    </footer>
  );
}
