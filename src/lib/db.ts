import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { Order, Reservation } from "./types";
import { seedDishes, seedTags, slugify, type Dish } from "@/config/menu";
import { cleanTag, MAX_TAGS_PER_DISH, type DishInput } from "./dishInput";

/**
 * Tiny JSON-file store — perfect for demos and single-location restaurants on a VPS.
 * Swap this module for Supabase/Postgres in production; the API routes only use
 * the functions exported below.
 */
type DB = {
  orders: Order[];
  reservations: Reservation[];
  seq: number;
  /** the live menu; copied from the seed catalogue on first run, then owned by the admin panel */
  dishes: Dish[];
  /** every tag name, in the order guests see the filter buttons */
  tags: string[];
  /** legacy sold-out list, folded into dish.available on load */
  soldOut?: string[];
};

/*
 * Serverless hosts (Vercel, Netlify, AWS Lambda) have a read-only project folder: only the
 * temp directory is writable. Writing to ./.data there fails, which made every order fail.
 * Set DATA_DIR to a persistent volume on a VPS; otherwise we use ./.data locally and the
 * temp directory on serverless. (Temp storage is per-instance and wiped on cold starts —
 * fine for a demo, but use a real database for a live restaurant.)
 */
const SERVERLESS = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const DATA_DIR = process.env.DATA_DIR || (SERVERLESS ? path.join(os.tmpdir(), "biteme-data") : path.join(process.cwd(), ".data"));
const FILE = path.join(DATA_DIR, "db.json");

/*
 * Next bundles every route separately, so module-level variables are NOT shared
 * between e.g. POST /api/orders and GET /api/orders/[id]. The cache and write queue
 * live on globalThis (one per server process), and the file's mtime is checked on
 * every read so a stale copy can never be served.
 */
type Store = { cache: DB | null; mtime: number; queue: Promise<unknown> };
const g = globalThis as typeof globalThis & { __bitemeStore?: Store };
const store: Store = (g.__bitemeStore ??= { cache: null, mtime: 0, queue: Promise.resolve() });

/** Fill in anything an older database file doesn't have yet. */
function upgrade(raw: Partial<DB>): DB {
  const db: DB = {
    orders: raw.orders ?? [],
    reservations: raw.reservations ?? [],
    seq: raw.seq ?? 1000,
    dishes: raw.dishes ?? structuredClone(seedDishes),
    tags: raw.tags ?? [],
  };
  if (!raw.dishes) {
    db.tags = [...seedTags];
    for (const id of raw.soldOut ?? []) {
      const d = db.dishes.find((x) => x.id === id);
      if (d) d.available = false;
    }
  }
  // every tag used by a dish is in the registry
  for (const d of db.dishes) for (const t of d.tags) if (!db.tags.some((x) => x.toLowerCase() === t.toLowerCase())) db.tags.push(t);
  return db;
}

async function load(): Promise<DB> {
  let mtime = 0;
  try {
    mtime = (await fs.stat(FILE)).mtimeMs;
  } catch {
    // no file yet
  }
  // (a cache without dishes is from before the menu moved into the database — rebuild it)
  if (store.cache && store.cache.dishes && mtime === store.mtime) return store.cache;
  try {
    store.cache = upgrade(JSON.parse(await fs.readFile(FILE, "utf8")));
  } catch {
    store.cache = upgrade({});
  }
  store.mtime = mtime;
  return store.cache;
}

async function persist(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
  store.mtime = (await fs.stat(FILE)).mtimeMs;
}

/** Serialise all writes so concurrent requests can't clobber each other. */
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = store.queue.then(async () => {
    const db = await load();
    const out = await fn(db);
    await persist(db);
    return out;
  });
  store.queue = run.catch(() => undefined);
  return run;
}

export const newId = () => crypto.randomUUID();

/* ---------------- orders ---------------- */

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

/* ---------------- reservations ---------------- */

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

/* ---------------- menu ---------------- */

const byOrder = (a: Dish, b: Dish) => a.order - b.order;
const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * The menu. Guests get visible dishes only, and only the tags that still have a visible
 * dish under them (an empty tag would be a dead filter button).
 */
export async function getCatalog(includeHidden = false) {
  const db = await load();
  const dishes = (includeHidden ? [...db.dishes] : db.dishes.filter((d) => !d.hidden)).sort(byOrder);
  const used = new Set(dishes.flatMap((d) => d.tags.map((t) => t.toLowerCase())));
  const tags = includeHidden ? [...db.tags] : db.tags.filter((t) => used.has(t.toLowerCase()));
  return { dishes, tags };
}

export async function getDish(id: string) {
  return (await load()).dishes.find((d) => d.id === id) ?? null;
}

/** Register a tag name (case-insensitively) and return its canonical spelling. */
function registerTag(db: DB, name: string) {
  const found = db.tags.find((t) => sameTag(t, name));
  if (found) return found;
  db.tags.push(name);
  return name;
}

const canonicalTags = (db: DB, tags: string[]) => tags.map((t) => registerTag(db, t));

export function createDish(input: DishInput) {
  return mutate((db) => {
    const base = slugify(input.name) || "dish";
    let id = base;
    for (let n = 2; db.dishes.some((d) => d.id === id); n++) id = `${base}-${n}`;
    const dish: Dish = {
      ...input,
      id,
      tags: canonicalTags(db, input.tags),
      order: db.dishes.reduce((m, d) => Math.max(m, d.order), -1) + 1,
    };
    db.dishes.push(dish);
    return dish;
  });
}

export function updateDish(id: string, patch: Partial<DishInput>) {
  return mutate((db) => {
    const d = db.dishes.find((x) => x.id === id);
    if (!d) return null;
    Object.assign(d, patch);
    if (patch.tags) d.tags = canonicalTags(db, patch.tags);
    return d;
  });
}

export function deleteDish(id: string): Promise<"ok" | "missing" | "locked"> {
  return mutate((db) => {
    const d = db.dishes.find((x) => x.id === id);
    if (!d) return "missing" as const;
    if (d.locked) return "locked" as const;
    db.dishes = db.dishes.filter((x) => x.id !== id);
    return "ok" as const;
  });
}

export type TagOp =
  | { action: "create"; name: string }
  | { action: "rename"; from: string; to: string }
  | { action: "delete"; name: string }
  | { action: "move"; name: string; direction: -1 | 1 }
  /** make exactly these dishes carry the tag */
  | { action: "assign"; name: string; dishIds: string[] };

export function tagOperation(op: TagOp): Promise<{ error: string } | { tags: string[]; dishes: Dish[] }> {
  return mutate((db) => {
    const done = () => ({ tags: [...db.tags], dishes: [...db.dishes].sort(byOrder) });
    const find = (n: string) => db.tags.find((t) => sameTag(t, n));

    switch (op.action) {
      case "create": {
        const name = cleanTag(op.name);
        if (!name) return { error: "Type a tag name." };
        if (find(name)) return { error: `“${find(name)}” already exists.` };
        db.tags.push(name);
        return done();
      }
      case "rename": {
        const from = find(op.from);
        const to = cleanTag(op.to);
        if (!from) return { error: "That tag no longer exists." };
        if (!to) return { error: "Type a tag name." };
        const clash = find(to);
        if (clash && !sameTag(clash, from)) return { error: `“${clash}” already exists — delete or merge it first.` };
        db.tags = db.tags.map((t) => (t === from ? to : t));
        for (const d of db.dishes) d.tags = d.tags.map((t) => (t === from ? to : t));
        return done();
      }
      case "delete": {
        const name = find(op.name);
        if (!name) return { error: "That tag no longer exists." };
        db.tags = db.tags.filter((t) => t !== name);
        for (const d of db.dishes) d.tags = d.tags.filter((t) => t !== name);
        return done();
      }
      case "move": {
        const i = db.tags.findIndex((t) => sameTag(t, op.name));
        const j = i + op.direction;
        if (i < 0 || j < 0 || j >= db.tags.length) return done();
        [db.tags[i], db.tags[j]] = [db.tags[j], db.tags[i]];
        return done();
      }
      case "assign": {
        const name = find(op.name);
        if (!name) return { error: "That tag no longer exists." };
        const want = new Set(op.dishIds);
        for (const d of db.dishes) {
          const has = d.tags.includes(name);
          if (want.has(d.id) && !has) {
            if (d.tags.length >= MAX_TAGS_PER_DISH) return { error: `${d.name} already has ${MAX_TAGS_PER_DISH} tags.` };
            d.tags.push(name);
          } else if (!want.has(d.id) && has) d.tags = d.tags.filter((t) => t !== name);
        }
        return done();
      }
    }
  });
}
