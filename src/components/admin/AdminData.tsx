"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Order, OrderStatus, Reservation } from "@/lib/types";
import type { Dish } from "@/config/menu";
import { chime } from "@/lib/chime";
import { useCatalog } from "../CatalogProvider";

export type OrderPatch = { status?: OrderStatus; cancelReason?: string; staffNote?: string; markPaid?: boolean };
export type Toast = { id: string; orderId: string; title: string; body: string };

/** What the dish editor sends; the server validates every field again. */
export type DishDraft = Pick<Dish, "name" | "cuisine" | "line" | "description" | "price" | "prepMinutes" | "image" | "fit" | "tags" | "spicy" | "veg" | "available" | "hidden">;
export type TagOperation =
  | { action: "create"; name: string }
  | { action: "rename"; from: string; to: string }
  | { action: "delete"; name: string }
  | { action: "move"; name: string; direction: -1 | 1 }
  | { action: "assign"; name: string; dishIds: string[] };

type Ctx = {
  orders: Order[];
  reservations: Reservation[];
  /** every dish, including hidden ones, in menu order */
  dishes: Dish[];
  /** every tag, including ones no dish uses yet, in the order guests see them */
  tags: string[];
  loaded: boolean;
  online: boolean;
  lastSync: number;
  sound: boolean;
  setSound: (v: boolean) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  refresh: () => Promise<void>;
  patchOrder: (id: string, patch: OrderPatch) => Promise<string | null>;
  /** each menu action returns an error message, or null on success */
  createDish: (draft: DishDraft) => Promise<string | null>;
  updateDish: (id: string, patch: Partial<DishDraft>) => Promise<string | null>;
  deleteDish: (id: string) => Promise<string | null>;
  tagOperation: (op: TagOperation) => Promise<string | null>;
  uploadPhoto: (file: File) => Promise<{ url: string; fit: "contain" | "cover" } | { error: string }>;
  decideReservation: (id: string, status: "confirmed" | "declined") => Promise<void>;
};

const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin outside AdminDataProvider");
  return c;
}

const ORDERS_EVERY = 5000;
const OTHER_EVERY = 20000;

/** One polling loop for the whole panel: orders every 5 s, the rest every 20 s. */
export default function AdminDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const { refresh: refreshGuestMenu } = useCatalog();
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState(0);
  const [sound, setSoundState] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const known = useRef<Set<string> | null>(null);
  const soundRef = useRef(false);

  const setSound = useCallback((v: boolean) => {
    soundRef.current = v;
    setSoundState(v);
    try {
      localStorage.setItem("biteme-admin-sound", v ? "1" : "0");
    } catch {}
    if (v) chime();
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const { orders: list } = (await res.json()) as { orders: Order[] };
      if (known.current) {
        const fresh = list.filter((o) => !known.current!.has(o.id));
        if (fresh.length) {
          if (soundRef.current) chime();
          setToasts((t) => [
            ...fresh.map((o) => ({
              id: `${o.id}-${Date.now()}`,
              orderId: o.id,
              title: `New order ${o.code}`,
              body: `${o.customer.name} · ${o.mode === "dinein" ? `Table ${o.customer.table}` : o.mode} · Tk ${o.totals.total.toLocaleString("en-IN")}`,
            })),
            ...t,
          ].slice(0, 4));
        }
      }
      known.current = new Set(list.map((o) => o.id));
      setOrders(list);
      setOnline(true);
      setLastSync(Date.now());
      setLoaded(true);
    } catch {
      setOnline(false);
    }
  }, []);

  const loadOther = useCallback(async () => {
    try {
      const [r, m] = await Promise.all([fetch("/api/reservations", { cache: "no-store" }).then((x) => x.json()), fetch("/api/menu?all=1", { cache: "no-store" }).then((x) => x.json())]);
      setReservations(r.reservations ?? []);
      setDishes(m.dishes ?? []);
      setTags(m.tags ?? []);
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadOrders(), loadOther()]);
  }, [loadOrders, loadOther]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("biteme-admin-sound") === "1";
      soundRef.current = saved;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a per-device preference after mount
      setSoundState(saved);
    } catch {}
    refresh();
    const a = setInterval(loadOrders, ORDERS_EVERY);
    const b = setInterval(loadOther, OTHER_EVERY);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [refresh, loadOrders, loadOther]);

  // browser tab shows how many new orders are waiting
  useEffect(() => {
    const n = orders.filter((o) => o.status === "placed").length;
    document.title = n ? `(${n}) New order${n > 1 ? "s" : ""} — BiteME Admin` : "BiteME Admin";
  }, [orders]);

  // toasts dismiss themselves
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((all) => all.slice(0, -1)), 9000);
    return () => clearTimeout(t);
  }, [toasts]);

  const patchOrder = useCallback(async (id: string, patch: OrderPatch) => {
    const before = orders;
    // optimistic: reflect the change immediately, reconcile with the server's copy
    setOrders((os) =>
      os.map((o) => {
        if (o.id !== id) return o;
        const next: Order = { ...o, payment: { ...o.payment }, timeline: [...o.timeline] };
        if (patch.status && patch.status !== o.status) {
          next.status = patch.status;
          next.timeline.push({ status: patch.status, at: Date.now() });
          if (patch.status === "cancelled") next.cancelReason = patch.cancelReason;
        }
        if (typeof patch.staffNote === "string") next.staffNote = patch.staffNote;
        if (patch.markPaid) next.payment.status = "paid";
        return next;
      }),
    );
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOrders(before);
      return (json.error as string) ?? "Could not update the order.";
    }
    if (json.order) setOrders((os) => os.map((o) => (o.id === id ? (json.order as Order) : o)));
    return null;
  }, [orders]);

  /** Send a menu change; on success the guest menu is refreshed too. Returns an error message or null. */
  const menuRequest = useCallback(
    async (url: string, method: string, body?: unknown): Promise<{ error: string } | { json: unknown }> => {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: (json.error as string) ?? "Something went wrong." };
      await loadOther();
      void refreshGuestMenu();
      return { json };
    },
    [loadOther, refreshGuestMenu],
  );

  const createDish = useCallback(
    async (draft: DishDraft) => {
      const r = await menuRequest("/api/menu/dishes", "POST", draft);
      return "error" in r ? r.error : null;
    },
    [menuRequest],
  );

  const updateDish = useCallback(
    async (id: string, patch: Partial<DishDraft>) => {
      // toggles feel instant; the server's answer replaces this if it disagrees
      setDishes((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      const r = await menuRequest(`/api/menu/dishes/${id}`, "PATCH", patch);
      if ("error" in r) {
        await loadOther();
        return r.error;
      }
      return null;
    },
    [menuRequest, loadOther],
  );

  const deleteDish = useCallback(async (id: string) => {
    const r = await menuRequest(`/api/menu/dishes/${id}`, "DELETE");
    return "error" in r ? r.error : null;
  }, [menuRequest]);

  const tagOperation = useCallback(async (op: TagOperation) => {
    const r = await menuRequest("/api/menu/tags", "POST", op);
    return "error" in r ? r.error : null;
  }, [menuRequest]);

  const uploadPhoto = useCallback(async (file: File) => {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    return res.ok ? (json as { url: string; fit: "contain" | "cover" }) : { error: (json.error as string) ?? "Upload failed." };
  }, []);

  const decideReservation = useCallback(async (id: string, status: "confirmed" | "declined") => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch("/api/reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ orders, reservations, dishes, tags, loaded, online, lastSync, sound, setSound, toasts, dismissToast, refresh, patchOrder, createDish, updateDish, deleteDish, tagOperation, uploadPhoto, decideReservation }),
    [orders, reservations, dishes, tags, loaded, online, lastSync, sound, setSound, toasts, dismissToast, refresh, patchOrder, createDish, updateDish, deleteDish, tagOperation, uploadPhoto, decideReservation],
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}
