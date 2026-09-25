"use client";

import { useEffect } from "react";
import MenuTable, { type FilmMeta } from "./MenuTable";
import SmoothScroll from "./SmoothScroll";
import Nav from "../Nav";
import Footer from "../Footer";

/** Standalone rotating table — this is where the table QR codes land. */
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
        <MenuTable meta={meta} />
      </main>
      <Footer />
    </>
  );
}
