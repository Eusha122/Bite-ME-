"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Dish } from "@/config/menu";

export type CatalogData = { dishes: Dish[]; tags: string[] };

type Catalog = CatalogData & {
  /** look a dish up by id (undefined if it left the menu) */
  dish: (id: string) => Dish | undefined;
  /** re-fetch the menu, e.g. after the admin saved a change */
  refresh: () => Promise<void>;
};

const Ctx = createContext<Catalog | null>(null);

export function useCatalog() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog outside CatalogProvider");
  return c;
}

/**
 * The live menu for the whole site. The server hands over the current menu with every page
 * load; after that it re-checks when the tab comes back into view and every couple of
 * minutes, so a dish the admin just switched off stops being orderable quickly.
 */
export default function CatalogProvider({ initial, children }: { initial: CatalogData; children: ReactNode }) {
  const [data, setData] = useState<CatalogData>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // offline: keep showing the last menu we had
    }
  }, []);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(refresh, 120000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(t);
    };
  }, [refresh]);

  const value = useMemo<Catalog>(() => {
    const byId = new Map(data.dishes.map((d) => [d.id, d]));
    return { ...data, dish: (id) => byId.get(id), refresh };
  }, [data, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
