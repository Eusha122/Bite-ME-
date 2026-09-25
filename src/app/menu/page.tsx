import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MenuCatalog from "@/components/menu/MenuCatalog";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Menu — ${site.name}`,
  description: `Every dish at ${site.name} — Deshi, Japanese, Indian, Italian, Chinese and burgers. Search, filter and order for delivery, pickup or at your table in Banani, Dhaka.`,
};

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const sp = await searchParams;
  // the QR code on a table opens /menu?table=7
  const table = typeof sp.table === "string" ? sp.table.slice(0, 10) : undefined;
  return (
    <>
      <Nav />
      <main>
        {/* MenuCatalog reads ?tag= and ?dish= from the URL */}
        <Suspense>
          <MenuCatalog table={table} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
