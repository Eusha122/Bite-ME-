import type { CuisineId } from "./menu";

export type ChapterWorld =
  | "dhaka"
  | "tokyo"
  | "delhi"
  | "naples"
  | "canton"
  | "brooklyn"
  | "table";

export type Chapter = {
  id: string;
  world: ChapterWorld;
  cuisine?: CuisineId;
  kicker: string;
  bn: string;
  title: [string, string]; // two-line headline: plain + italic
  body: string;
  /** Items that get a quick-add button inside the chapter. */
  featured: string[];
  palette: {
    bg: string; // scene clear/fog colour
    key: string; // key light colour
    rim: string; // rim / accent light colour
    particle: string;
  };
  /** Backdrop photo (optional) rendered far behind the 3D stage. */
  backdrop?: string;
};

export const chapters: Chapter[] = [
  {
    id: "origin",
    world: "dhaka",
    cuisine: "deshi",
    kicker: "Chapter 00 — Dhaka, 2009",
    bn: "শুরুটা এক কাপ চায়ে",
    title: ["It started with", "a cup of cha."],
    body: "A monsoon night in Old Dhaka. A clay cup, a tin roof, rain like applause. Our founder swore that one day, every kitchen he loved would sit at a single table.",
    featured: ["kacchi-biryani", "masala-cha"],
    palette: { bg: "#070a12", key: "#ffb45e", rim: "#4f6bff", particle: "#9fb4ff" },
    backdrop: "/backdrops/dhaka.jpg",
  },
  {
    id: "tokyo",
    world: "tokyo",
    cuisine: "japanese",
    kicker: "Chapter 01 — Tokyo",
    bn: "নীরবতার নিখুঁততা",
    title: ["Precision,", "in silence."],
    body: "Rice pressed by hand, never by machine. Salmon cut against the grain in one motion. Broth that simmers for eighteen hours before it earns a bowl.",
    featured: ["salmon-nigiri", "tonkotsu-ramen"],
    palette: { bg: "#0d0610", key: "#ff5c8a", rim: "#35e0ff", particle: "#ffc2d6" },
    backdrop: "/backdrops/tokyo.jpg",
  },
  {
    id: "delhi",
    world: "delhi",
    cuisine: "indian",
    kicker: "Chapter 02 — Old Delhi",
    bn: "ধীর আগুন, জোরালো মশলা",
    title: ["Slow fire,", "loud spice."],
    body: "A clay tandoor at 480°. Kashmiri chilli, black cardamom, fenugreek — toasted, ground, and folded into butter the way Chandni Chowk taught us.",
    featured: ["butter-chicken", "garlic-naan"],
    palette: { bg: "#120703", key: "#ff8a1f", rim: "#ffd166", particle: "#ffb347" },
    backdrop: "/backdrops/delhi.jpg",
  },
  {
    id: "naples",
    world: "naples",
    cuisine: "italian",
    kicker: "Chapter 03 — Napoli",
    bn: "৪৫০ ডিগ্রিতে নব্বই সেকেন্ড",
    title: ["Ninety seconds", "at 450°."],
    body: "Dough fermented 48 hours. San Marzano tomatoes, fior di latte, a basil leaf. A wood-fired dome does the rest — leopard spots and all.",
    featured: ["margherita", "carbonara"],
    palette: { bg: "#100605", key: "#ff6a2b", rim: "#ffe0a3", particle: "#fff2d8" },
    backdrop: "/backdrops/naples.jpg",
  },
  {
    id: "canton",
    world: "canton",
    cuisine: "chinese",
    kicker: "Chapter 04 — Canton",
    bn: "ওকের নিঃশ্বাস",
    title: ["The breath", "of the wok."],
    body: "Wok hei — the smoky kiss of a steel pan at full flame. Eighteen pleats on every xiao long bao. Steam that carries the whole room.",
    featured: ["xiao-long-bao", "chilli-beef"],
    palette: { bg: "#0f0405", key: "#ff3b3b", rim: "#ffcc4d", particle: "#ff8f5a" },
    backdrop: "/backdrops/canton.jpg",
  },
  {
    id: "brooklyn",
    world: "brooklyn",
    cuisine: "burgers",
    kicker: "Chapter 05 — Brooklyn",
    bn: "উদ্দেশ্য নিয়ে সাজানো",
    title: ["Stacked", "with intent."],
    body: "Smashed hard on a screaming-hot flat-top for lace-crisp edges. Cheese that drapes, not sits. And one burger that only Dhaka could invent.",
    featured: ["signature-smash", "kacchi-burger"],
    palette: { bg: "#050a0d", key: "#ffc53d", rim: "#2ee6ff", particle: "#ffe7a3" },
    backdrop: "/backdrops/brooklyn.jpg",
  },
  {
    id: "table",
    world: "table",
    kicker: "Chapter 06 — Banani, tonight",
    bn: "এক টেবিল, ছয় রান্নাঘর",
    title: ["One table.", "Six kitchens."],
    body: "Every journey ends at the same place — your seat. Spin the table, pick your cravings, and we'll start the fire.",
    featured: [],
    palette: { bg: "#0b0806", key: "#ffc27a", rim: "#f2a33a", particle: "#ffd9a0" },
    backdrop: "/backdrops/table.jpg",
  },
];
