import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MenuPage from "@/components/film/MenuPage";
import { film } from "@/lib/films";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Menu — ${site.name}`,
  description: "Ten dishes from six kitchens — order online for delivery, pickup or at your table in Banani, Dhaka.",
};

export default async function Page({ searchParams }: PageProps<"/menu">) {
  const sp = await searchParams;
  const table = typeof sp.table === "string" ? sp.table.slice(0, 10) : undefined;
  const spin = await film("table");
  if (!spin) redirect("/");
  return <MenuPage meta={spin} table={table} />;
}
