import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Support from "@/components/pages/Support";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Support — ${site.name}`,
  description: `Track an order, contact ${site.name}, and answers about delivery, payment and allergies.`,
};

export default function SupportPage() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-[5vw] md:pt-36">
        <Support />
      </main>
      <Footer />
    </>
  );
}
