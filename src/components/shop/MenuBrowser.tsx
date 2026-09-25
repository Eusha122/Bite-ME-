"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cuisines, menu, type CuisineId, type MenuItem } from "@/config/menu";
import MenuCard from "./MenuCard";
import DishSheet from "./DishSheet";
import { useSoldOut } from "./useSoldOut";

type Filter = "all" | "veg" | "spicy" | "signature";

export default function MenuBrowser({ table }: { table?: string }) {
  const soldOut = useSoldOut();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<CuisineId>("deshi");
  const [open, setOpen] = useState<MenuItem | null>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const tabs = useRef<HTMLDivElement>(null);

  // remember the dine-in table from a QR scan so checkout can pre-fill it
  useEffect(() => {
    if (table) sessionStorage.setItem("biteme-table", table);
  }, [table]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((m) => {
      if (filter !== "all" && !m.tags?.includes(filter)) return false;
      if (!q) return true;
      return (m.name + " " + m.description + " " + m.cuisine).toLowerCase().includes(q);
    });
  }, [query, filter]);

  // scroll-spy for the cuisine tabs
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.getAttribute("data-cuisine") as CuisineId);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    Object.values(sections.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [filtered]);

  useEffect(() => {
    const btn = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const jump = (id: CuisineId) => {
    const el = sections.current[id];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-10">
      <header className="mb-8 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-saffron">{table ? `Table ${table} · Dine-in` : "Order online · Delivery & pickup"}</p>
          <h1 className="font-display text-[clamp(3rem,9vw,7rem)] font-light leading-[0.9] tracking-[-0.03em]">
            Six kitchens.
            <br />
            <span className="italic text-saffron">One tray.</span>
          </h1>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-[380px]">
          <label className="relative">
            <span className="sr-only">Search the menu</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search biryani, ramen, pizza…"
              className="h-12 w-full rounded-full border border-white/12 bg-ink-2 px-5 text-sm outline-none transition placeholder:text-cream-dim/60 focus:border-saffron"
            />
          </label>
          <div className="flex gap-2">
            {(["all", "signature", "spicy", "veg"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${filter === f ? "border-saffron bg-saffron text-ink" : "border-white/12 text-cream-dim hover:text-cream"}`}
              >
                {f === "all" ? "Everything" : f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-[68px] z-30 -mx-4 mb-8 border-y border-line bg-ink/85 px-4 backdrop-blur-xl md:top-[84px] md:-mx-10 md:px-10">
        <div ref={tabs} className="no-scrollbar flex gap-2 overflow-x-auto py-3">
          {cuisines.map((c) => (
            <button
              key={c.id}
              data-tab={c.id}
              onClick={() => jump(c.id)}
              style={{ ["--accent" as string]: c.accent }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active === c.id ? "bg-[var(--accent)] text-ink" : "text-cream-dim hover:text-cream"}`}
            >
              {c.name}
              <span className="font-bangla text-xs font-normal opacity-70">{c.bn}</span>
            </button>
          ))}
        </div>
      </div>

      {cuisines.map((c) => {
        const items = filtered.filter((m) => m.cuisine === c.id);
        if (!items.length) return null;
        return (
          <section
            key={c.id}
            data-cuisine={c.id}
            ref={(el) => {
              sections.current[c.id] = el;
            }}
            className="mb-16 md:mb-24"
          >
            <div className="mb-6 flex items-baseline gap-4" style={{ ["--accent" as string]: c.accent }}>
              <h2 className="font-display text-4xl font-light md:text-5xl">{c.name}</h2>
              <span className="font-display italic text-[var(--accent)]">{c.tagline}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((m) => (
                <MenuCard key={m.id} item={m} soldOut={soldOut.includes(m.id)} onOpen={() => setOpen(m)} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p className="py-24 text-center font-display text-2xl italic text-cream-dim">Nothing matches “{query}”. Try “biryani” or “spicy”.</p>
      )}

      <DishSheet item={open} soldOut={!!open && soldOut.includes(open.id)} onClose={() => setOpen(null)} />
    </div>
  );
}
