"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cuisineName, formatBDT, type Dish } from "@/config/menu";
import { useCatalog } from "../CatalogProvider";
import DishImage from "../DishImage";
import DishSheet from "./DishSheet";

/** Lower-cased text a search can match: everything a guest could plausibly type. */
const haystack = (d: Dish) => [d.name, d.id.replace(/-/g, " "), d.line, d.description, cuisineName(d.cuisine), d.veg ? "vegetarian veg" : "", d.spicy ? "spicy hot" : "", ...d.tags].join(" ").toLowerCase();

function DishCard({ dish, href, onOpen }: { dish: Dish; href: string; onOpen: () => void }) {
  const soldOut = !dish.available;
  return (
    <li>
      <Link href={href} scroll={false} onClick={onOpen} className="flex h-full flex-col rounded-[28px] border border-line bg-page p-3 active:bg-paper-2" aria-label={`${dish.name}, ${formatBDT(dish.price)}${soldOut ? ", sold out today" : ""}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-paper-2">
          <DishImage dish={dish} className={`absolute inset-0 h-full w-full ${dish.fit === "contain" ? "p-3" : "!rounded-none"} ${soldOut ? "opacity-60 grayscale" : ""}`} />
          {soldOut && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-extrabold text-page">Sold out today</span>}
        </div>
        <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-step-1 font-extrabold leading-tight">{dish.name}</h3>
            <span className="puff puff-ink shrink-0 whitespace-nowrap text-step-1">{formatBDT(dish.price)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-ink-2">{dish.description}</p>
        </div>
      </Link>
    </li>
  );
}

export default function MenuCatalog({ table }: { table?: string }) {
  const { dishes, tags, dish: find } = useCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tag = params.get("tag");
  const dishId = params.get("dish");
  const [q, setQ] = useState("");
  const openedHere = useRef(false);

  // remember the dine-in table from a QR scan so checkout can pre-fill it
  useEffect(() => {
    if (table) sessionStorage.setItem("biteme-table", table);
  }, [table]);

  // once no dish is open (closed, or the browser's Back button), forget that we pushed one
  useEffect(() => {
    if (!dishId) openedHere.current = false;
  }, [dishId]);

  /** URL for a given filter/dish state, keeping the table number if there is one. */
  const href = useCallback(
    (next: { tag?: string | null; dish?: string | null }) => {
      const p = new URLSearchParams();
      const t = next.tag === undefined ? tag : next.tag;
      const d = next.dish === undefined ? dishId : next.dish;
      if (t) p.set("tag", t);
      if (d) p.set("dish", d);
      if (table) p.set("table", table);
      const s = p.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [tag, dishId, table, pathname],
  );

  const list = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const inTag = tag ? dishes.filter((d) => d.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) : dishes;
    if (!tokens.length) return inTag;
    // name matches first, then everything else that matches
    return inTag
      .map((d) => ({ d, hay: haystack(d) }))
      .filter(({ hay }) => tokens.every((t) => hay.includes(t)))
      .sort((a, b) => Number(!tokens.every((t) => a.d.name.toLowerCase().includes(t))) - Number(!tokens.every((t) => b.d.name.toLowerCase().includes(t))))
      .map(({ d }) => d);
  }, [dishes, tag, q]);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const d of dishes) for (const t of d.tags) c.set(t.toLowerCase(), (c.get(t.toLowerCase()) ?? 0) + 1);
    return c;
  }, [dishes]);

  const open = find(dishId ?? "") ?? null;
  const related = useMemo(() => {
    if (!open) return [];
    return dishes
      .filter((d) => d.id !== open.id && d.available)
      .map((d) => ({ d, shared: d.tags.filter((t) => open.tags.some((o) => o.toLowerCase() === t.toLowerCase())).length }))
      .filter((x) => x.shared > 0)
      .sort((a, b) => b.shared - a.shared || a.d.order - b.d.order)
      .slice(0, 4)
      .map((x) => x.d);
  }, [dishes, open]);

  const close = useCallback(() => {
    // if we pushed the dish onto the history, going back closes it like the back button would
    if (openedHere.current) {
      openedHere.current = false;
      router.back();
    } else router.replace(href({ dish: null }), { scroll: false });
  }, [router, href]);

  const setTag = (t: string | null) => router.replace(href({ tag: t, dish: null }), { scroll: false });

  const chip = (on: boolean) => `h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-extrabold ${on ? "bg-ink text-page" : "border-2 border-line bg-page text-ink"}`;

  return (
    <div className="px-5 pb-24 md:px-[5vw]">
      <header className="pb-8 pt-28 md:pb-10 md:pt-36">
        <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">{table ? `Table ${table} · Dine-in ordering` : "Order online · Delivery, pickup & dine-in"}</p>
        <h1 className="puff text-step-8">
          <span className="puff-ink block">The whole</span>
          <span className="puff-tomato block">menu.</span>
        </h1>
        <p className="mt-5 max-w-[46ch] text-step-1 font-semibold leading-relaxed text-ink-2">
          {dishes.length} dishes from six kitchens, cooked fresh to order. Tap any dish to see more and order.
        </p>
      </header>

      {/* search + tags stay on screen while you scroll, sliding down with the nav bar when it returns */}
      <div className="sticky top-[var(--nav-h,0px)] z-30 -mx-5 border-y border-line bg-paper px-5 py-3 transition-[top] duration-[650ms] ease-[cubic-bezier(.45,0,.2,1)] md:-mx-[5vw] md:px-[5vw]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <label className="relative block lg:w-[380px] lg:shrink-0">
            <span className="sr-only">Search the menu</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Search dishes, kitchens, cravings…"
              className="h-12 w-full rounded-full border-2 border-line bg-page pl-12 pr-12 text-step-0 font-bold outline-none placeholder:text-ink-2/70 focus:border-ink [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-paper-2 text-sm font-bold">
                ✕
              </button>
            )}
          </label>

          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Filter by tag">
            <button onClick={() => setTag(null)} aria-pressed={!tag} className={chip(!tag)}>
              All
            </button>
            {tags.map((t) => (
              <button key={t} onClick={() => setTag(tag?.toLowerCase() === t.toLowerCase() ? null : t)} aria-pressed={tag?.toLowerCase() === t.toLowerCase()} className={chip(tag?.toLowerCase() === t.toLowerCase())}>
                {t}
                <span className="ml-1.5 text-xs opacity-60">{counts.get(t.toLowerCase())}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-5 mt-6 text-sm font-extrabold text-ink-2" aria-live="polite">
        {list.length} {list.length === 1 ? "dish" : "dishes"}
        {tag && <> · {tag}</>}
        {q.trim() && <> · “{q.trim()}”</>}
      </p>

      {list.length === 0 ? (
        <div className="rounded-[32px] border-2 border-dashed border-line px-6 py-16 md:px-10">
          <p className="puff puff-ink text-step-5">Nothing matches.</p>
          <p className="mt-3 max-w-[44ch] font-semibold text-ink-2">Try a different word — “rice”, “spicy”, “pizza” — or clear the filters to see everything.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {q && (
              <button onClick={() => setQ("")} className="h-12 rounded-full bg-ink px-6 font-extrabold text-page">
                Clear search
              </button>
            )}
            {tag && (
              <button onClick={() => setTag(null)} className="h-12 rounded-full border-2 border-ink px-6 font-extrabold">
                Show all dishes
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((d) => (
            <DishCard
              key={d.id}
              dish={d}
              href={href({ dish: d.id })}
              onOpen={() => {
                openedHere.current = true;
              }}
            />
          ))}
        </ul>
      )}

      <DishSheet dish={open} related={related} onClose={close} onSelect={(id) => router.replace(href({ dish: id }), { scroll: false })} />
    </div>
  );
}
