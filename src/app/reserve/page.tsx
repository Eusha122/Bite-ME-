import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ReserveForm from "@/components/pages/ReserveForm";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Reserve a table — ${site.name}`,
  description: `Book a table at ${site.name}, ${site.address}. Birthdays, date nights and groups welcome.`,
};

export default function ReservePage() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-[5vw] md:pt-36">
        <ReserveForm />
      </main>
      <Footer />
    </>
  );
}
