import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Order, Reservation } from "./types";

/**
 * Tiny JSON-file store — perfect for demos and single-location restaurants on a VPS.
 * Swap this module for Supabase/Postgres in production; the API routes only use
 * the functions exported below.
 */
type DB = { orders: Order[]; reservations: Reservation[]; soldOut: string[]; seq: number };

const FILE = path.join(process.cwd(), ".data", "db.json");
const EMPTY: DB = { orders: [], reservations: [], soldOut: [], seq: 1000 };

let cache: DB | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, "utf8")) } as DB;
  } catch {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

async function persist(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

/** Serialise all writes so concurrent requests can't clobber each other. */
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const out = await fn(db);
    await persist(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => crypto.randomUUID();

export async function listOrders() {
  const db = await load();
  return [...db.orders].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getOrder(id: string) {
  const db = await load();
  return db.orders.find((o) => o.id === id) ?? null;
}

export function createOrder(order: Omit<Order, "code">) {
  return mutate((db) => {
    db.seq += 1;
    const full: Order = { ...order, code: `BM-${db.seq}` };
    db.orders.push(full);
    return full;
  });
}

export function updateOrder(id: string, fn: (o: Order) => void) {
  return mutate((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return null;
    fn(o);
    return o;
  });
}

export async function listReservations() {
  const db = await load();
  return [...db.reservations].sort((a, b) => b.createdAt - a.createdAt);
}

export function createReservation(r: Reservation) {
  return mutate((db) => {
    db.reservations.push(r);
    return r;
  });
}

export function updateReservation(id: string, status: Reservation["status"]) {
  return mutate((db) => {
    const r = db.reservations.find((x) => x.id === id);
    if (r) r.status = status;
    return r ?? null;
  });
}

export async function getSoldOut() {
  return (await load()).soldOut;
}

export function setSoldOut(id: string, soldOut: boolean) {
  return mutate((db) => {
    db.soldOut = soldOut ? Array.from(new Set([...db.soldOut, id])) : db.soldOut.filter((x) => x !== id);
    return db.soldOut;
  });
}
