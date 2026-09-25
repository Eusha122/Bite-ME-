"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = { name: string; phone: string };

type AccountState = {
  /** the logged-in guest */
  user: User | null;
  /** every account created on this device (a real system would keep these on a server) */
  accounts: User[];
  /** order ids by phone number, newest first */
  orders: Record<string, string[]>;
  register: (user: User) => "ok" | "exists";
  /** log in with just a phone number; false if no account has that number yet */
  loginWithPhone: (phone: string) => boolean;
  logout: () => void;
  addOrder: (id: string) => void;
};

/**
 * DEMO accounts: there is no server and no password. Accounts, the login and order history
 * all live in this browser (localStorage). A real system would use a phone-number OTP and
 * a server session; the rest of the site would not need to change.
 */
export const useAccount = create<AccountState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      orders: {},
      register: (user) => {
        if (get().accounts.some((a) => a.phone === user.phone)) return "exists";
        set((s) => ({ accounts: [...s.accounts, user], user }));
        return "ok";
      },
      loginWithPhone: (phone) => {
        const found = get().accounts.find((a) => a.phone === phone);
        if (!found) return false;
        set({ user: found });
        return true;
      },
      logout: () => set({ user: null }),
      addOrder: (id) =>
        set((s) => {
          if (!s.user) return s;
          const mine = s.orders[s.user.phone] ?? [];
          return { orders: { ...s.orders, [s.user.phone]: [id, ...mine.filter((x) => x !== id)].slice(0, 30) } };
        }),
    }),
    { name: "biteme-account-v2" },
  ),
);

const NO_ORDERS: string[] = [];
/** Stable empty array so selectors don't re-render forever. */
export const useMyOrderIds = () => useAccount((s) => (s.user ? (s.orders[s.user.phone] ?? NO_ORDERS) : NO_ORDERS));

/** Bangladeshi mobile: 01XXXXXXXXX, optionally with +88 / 88 in front. */
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Same number, one spelling (so 01712345678 and +8801712345678 are the same account). */
export const normalizePhone = (p: string) => p.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");

export const initialOf = (name: string) => (name.trim()[0] ?? "?").toUpperCase();
