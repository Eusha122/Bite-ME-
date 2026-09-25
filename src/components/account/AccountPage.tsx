"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useMyOrderIds, initialOf } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { formatBDT } from "@/config/menu";
import { statusLabel, type Order } from "@/lib/types";
import AuthForm from "./AuthForm";

type Row = Pick<Order, "id" | "code" | "createdAt" | "mode" | "status" | "lines" | "totals">;

function Orders({ ids }: { ids: string[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(ids.map((id) => fetch(`/api/orders/${id}`, { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<Row>) : null)).catch(() => null))).then((all) => {
      if (alive) setRows(all.filter((r): r is Row => !!r));
    });
    return () => {
      alive = false;
    };
  }, [ids]);

  if (ids.length === 0)
    return (
      <div className="rounded-3xl border-2 border-dashed border-line px-6 py-14">
        <p className="puff puff-ink text-step-4">No orders yet.</p>
        <p className="mt-2 font-semibold text-ink-2">Orders you place while logged in show up here.</p>
        <Link href="/menu" className="mt-5 inline-flex h-12 items-center rounded-full bg-tomato px-6 font-extrabold text-page">
          Browse the menu
        </Link>
      </div>
    );
  if (!rows) return <p className="py-10 font-semibold text-ink-2">Loading your orders…</p>;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-3xl border-2 border-line bg-page p-5">
            <div className="min-w-0">
              <p className="font-extrabold">
                {o.code} · {new Date(o.createdAt).toLocaleDateString([], { day: "numeric", month: "short" })}
              </p>
              <p className="truncate text-sm font-semibold text-ink-2">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-paper-2 px-3 py-1 text-xs font-extrabold">{statusLabel[o.status]}</span>
              <span className="font-extrabold tabular-nums">{formatBDT(o.totals.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AccountPage() {
  const hydrated = useHydrated();
  const user = useAccount((s) => s.user);
  const orderIds = useMyOrderIds();
  const logout = useAccount((s) => s.logout);

  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (!user)
    return (
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-4 text-step--1 font-extrabold uppercase tracking-[0.18em] text-tomato">Account</p>
          <h1 className="puff text-step-7">
            <span className="puff-ink block">Log in</span>
            <span className="puff-tomato block">to order faster.</span>
          </h1>
          <p className="mt-5 max-w-[40ch] text-step-1 font-semibold leading-relaxed text-ink-2">Save your details for checkout and keep every order in one place.</p>
        </div>
        <div className="max-w-md rounded-[32px] border-2 border-line bg-page p-6 md:p-8">
          <AuthForm />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <span className="puff grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-ink bg-mustard text-step-5 text-ink">{initialOf(user.name)}</span>
          <div>
            <h1 className="puff puff-ink text-step-6">{user.name}</h1>
            <p className="mt-1 font-bold text-ink-2">{user.phone}</p>
          </div>
        </div>
        <button onClick={logout} className="h-12 rounded-full border-2 border-ink px-6 font-extrabold">
          Log out
        </button>
      </header>
      <section>
        <h2 className="mb-4 text-step-2 font-extrabold">Your orders</h2>
        <Orders ids={orderIds} />
      </section>
    </div>
  );
}
