import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AccountPage from "@/components/account/AccountPage";
import { site } from "@/config/site";

export const metadata: Metadata = { title: `My account — ${site.name}`, robots: { index: false } };

export default function Account() {
  return (
    <>
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-[5vw] md:pt-36">
        <AccountPage />
      </main>
      <Footer />
    </>
  );
}
