import type { Metadata } from "next";
import Nav from "@/components/Nav";
import OrderTracker from "@/components/shop/OrderTracker";
import { site } from "@/config/site";

export const metadata: Metadata = { title: `Your order — ${site.name}`, robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  return (
    <>
      <Nav transparent={false} />
      <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 md:px-10 md:pt-32">
        <OrderTracker id={id} />
      </main>
    </>
  );
}
