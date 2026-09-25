"use client";

import { useEffect } from "react";
import MenuBook, { type FilmMeta } from "./MenuBook";
import SmoothScroll from "./SmoothScroll";
import Nav from "../Nav";
import Footer from "../Footer";

/** Standalone book — this is where the table QR codes land. */
export default function MenuPage({ meta, table }: { meta: FilmMeta; table?: string }) {
  useEffect(() => {
    // remember the dine-in table so checkout can pre-fill it
    if (table) sessionStorage.setItem("biteme-table", table);
  }, [table]);
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main>
        <MenuBook meta={meta} />
      </main>
      <Footer />
    </>
  );
}
