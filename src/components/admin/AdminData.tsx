"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Order, OrderStatus, Reservation } from "@/lib/types";
import { chime } from "@/lib/chime";

export type OrderPatch = { status?: OrderStatus; cancelReason?: string; staffNote?: string; markPaid?: boolean };
export type Toast = { id: string; orderId: string; title: string; body: string };

type Ctx = {
  orders: Order[];
  reservations: Reservation[];
  soldOut: string[];
  loaded: boolean;
  online: boolean;
  lastSync: number;
  sound: boolean;
  setSound: (v: boolean) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  refresh: () => Promise<void>;
  patchOrder: (id: string, patch: OrderPatch) => Promise<string | null>;
  setDishSoldOut: (id: string, soldOut: boolean) => Promise<void>;
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
  const [soldOut, setSoldOut] = useState<string[]>([]);
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
      const [r, s] = await Promise.all([fetch("/api/reservations", { cache: "no-store" }).then((x) => x.json()), fetch("/api/soldout", { cache: "no-store" }).then((x) => x.json())]);
      setReservations(r.reservations ?? []);
      setSoldOut(s.soldOut ?? []);
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

  const setDishSoldOut = useCallback(async (id: string, value: boolean) => {
    setSoldOut((s) => (value ? [...s, id] : s.filter((x) => x !== id)));
    await fetch("/api/soldout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, soldOut: value }) });
  }, []);

  const decideReservation = useCallback(async (id: string, status: "confirmed" | "declined") => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch("/api/reservations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ orders, reservations, soldOut, loaded, online, lastSync, sound, setSound, toasts, dismissToast, refresh, patchOrder, setDishSoldOut, decideReservation }),
    [orders, reservations, soldOut, loaded, online, lastSync, sound, setSound, toasts, dismissToast, refresh, patchOrder, setDishSoldOut, decideReservation],
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}
