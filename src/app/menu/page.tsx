import type { Metadata } from "next";
import MenuBrowser from "@/components/shop/MenuBrowser";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Menu — ${site.name}`,
  description: "Deshi, Japanese, Indian, Italian, Chinese and burgers — order online for delivery or pickup in Dhaka.",
};

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const sp = await searchParams;
  const table = typeof sp.table === "string" ? sp.table.slice(0, 10) : undefined;
  return (
    <>
      <Nav transparent={false} />
      <main className="pt-24 md:pt-28">
        <MenuBrowser table={table} />
      </main>
      <Footer />
    </>
  );
}
