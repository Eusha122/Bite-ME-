"use client";

import { useCallback, useState } from "react";
import type { FilmInfo } from "@/lib/films";
import FilmScene, { Words, type Beat } from "./FilmScene";
import MenuTable from "./MenuTable";
import SmoothScroll from "./SmoothScroll";
import Intro from "./Intro";
import Nav from "../Nav";
import WaveBand from "../Wave";
import Footer from "../Footer";

export type Films = Record<"hero" | "kacchi" | "pizza" | "ramen" | "table", FilmInfo | null>;

const title = (a: string, b: string) => (
  <>
    <Words className="puff-ink">{a}</Words>
    <Words className="puff-tomato">{b}</Words>
  </>
);

const HERO: Beat[] = [
  {
    at: [0, 0.38],
    kicker: "Banani, Dhaka · since 2009",
    title: title("Six kitchens.", "One table."),
    body: "Deshi, Japanese, Indian, Italian, Chinese and burgers — cooked under one roof, delivered hot across Dhaka.",
  },
  {
    at: [0.46, 1],
    kicker: "01 · Burgers",
    title: title("Smashed hard.", "Stacked with intent."),
    body: "Two lace-edged patties, American cheese, pickles and house sauce in a toasted potato bun.",
  },
];

const KACCHI: Beat[] = [
  {
    at: [0, 0.45],
    kicker: "02 · Deshi",
    title: title("Sealed", "in dough."),
    body: "Old Dhaka kacchi, dum-cooked for three hours in a copper handi. Nothing escapes — not even the steam.",
  },
  {
    at: [0.52, 1],
    kicker: "02 · Deshi",
    title: title("Opened", "at your table."),
    body: "Saffron rice, mutton on the bone and one golden aloo. The way Puran Dhaka has done it for a century.",
  },
];

const PIZZA: Beat[] = [
  {
    at: [0, 0.45],
    kicker: "03 · Italian",
    title: title("Ninety seconds", "at 450°."),
    body: "Forty-eight-hour dough, San Marzano tomato and fior di latte, fired in a wood dome.",
  },
  {
    at: [0.52, 1],
    kicker: "03 · Italian",
    title: title("Leopard spots.", "Endless stretch."),
    body: "Blistered crust, basil, and mozzarella that refuses to let go.",
  },
];

const RAMEN: Beat[] = [
  {
    at: [0, 0.45],
    kicker: "04 · Japanese",
    title: title("Eighteen hours", "of broth."),
    body: "Pork bones simmered overnight until the soup turns to silk.",
  },
  {
    at: [0.52, 1],
    kicker: "04 · Japanese",
    title: title("Pulled", "to order."),
    body: "Fresh noodles, chashu, a jammy soy egg and nori. Slurping encouraged.",
  },
];

export default function Home({ films }: { films: Films }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <>
      <SmoothScroll />
      <Intro ready={ready || !films.hero} />
      <Nav />
      <main>
        {films.hero && <FilmScene id="story" film="hero" beats={HERO} length={340} onReady={onReady} {...films.hero} />}
        <WaveBand bg={films.hero?.bg} />
        {films.kacchi && <FilmScene id="kacchi" film="kacchi" beats={KACCHI} {...films.kacchi} />}
        {films.pizza && <FilmScene id="pizza" film="pizza" beats={PIZZA} {...films.pizza} />}
        {films.ramen && <FilmScene id="ramen" film="ramen" beats={RAMEN} {...films.ramen} />}
        {films.table && <MenuTable meta={films.table} />}
      </main>
      <Footer />
    </>
  );
}
