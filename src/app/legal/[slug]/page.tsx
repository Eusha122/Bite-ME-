import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { legalBySlug, legalPages } from "@/config/legal";
import { site } from "@/config/site";

export function generateStaticParams() {
  return legalPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = legalBySlug(slug);
  return page ? { title: `${page.title} — ${site.name}`, description: page.summary } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = legalBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-[5vw] md:pt-36">
        <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">Legal</p>
            <nav aria-label="Legal pages" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {legalPages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/legal/${p.slug}`}
                  aria-current={p.slug === slug ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 font-extrabold lg:rounded-2xl ${p.slug === slug ? "bg-ink text-page" : "border-2 border-line text-ink lg:border-0"}`}
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="max-w-[72ch]">
            <h1 className="puff puff-ink text-step-7">{page.title}</h1>
            <p className="mt-4 text-step-1 font-semibold text-ink-2">{page.summary}</p>
            <p className="mt-2 text-sm font-bold text-ink-2">Last updated {site.legal.updated}</p>

            <div className="mt-10 flex flex-col gap-9">
              {page.sections.map((s, i) => (
                <section key={s.heading}>
                  <h2 className="text-step-2 font-extrabold">
                    <span className="mr-2 text-tomato">{i + 1}.</span>
                    {s.heading}
                  </h2>
                  {s.body.map((para, k) => (
                    <p key={k} className="mt-3 font-semibold leading-relaxed text-ink-2">
                      {para}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <p className="mt-12 rounded-2xl border-2 border-line px-5 py-4 text-sm font-bold text-ink-2">
              Questions about this page? Email{" "}
              <a href={`mailto:${site.legal.grievanceEmail}`} className="text-ink underline">
                {site.legal.grievanceEmail}
              </a>{" "}
              or call {site.phone}.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
