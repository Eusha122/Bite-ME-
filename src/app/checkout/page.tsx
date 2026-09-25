import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Checkout from "@/components/shop/Checkout";
import { site } from "@/config/site";

export const metadata: Metadata = { title: `Checkout — ${site.name}` };

export default function CheckoutPage() {
  return (
    <>
      <Nav transparent={false} />
      <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-28 md:px-10 md:pt-32">
        <Checkout />
      </main>
    </>
  );
}
