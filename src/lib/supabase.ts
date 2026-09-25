import "server-only";

/**
 * Minimal Supabase client over plain fetch (PostgREST + Storage), so the template needs no extra
 * dependency. It only ever runs on the server with the service key — never ship that key to the browser.
 */
const URL_ = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

export const supabaseEnabled = !!(URL_ && KEY);

const headers = (extra?: Record<string, string>) => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, ...extra });

export const SETUP_SQL = `create table if not exists biteme_store (
  id text primary key,
  version int not null default 0,
  data jsonb not null
);
alter table biteme_store enable row level security;`;

/* ---------------- database (one JSON document, optimistic-locked) ---------------- */

export type Row = { version: number; data: unknown };

export async function readRow(): Promise<Row | null> {
  const res = await fetch(`${URL_}/rest/v1/biteme_store?id=eq.main&select=version,data`, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    if (/PGRST205|does not exist|schema cache/i.test(text)) throw new Error(`Supabase table "biteme_store" is missing. Run this once in the Supabase SQL Editor:\n\n${SETUP_SQL}`);
    throw new Error(`Supabase read failed (${res.status}): ${text}`);
  }
  const rows = (await res.json()) as Row[];
  return rows[0] ?? null;
}

/** Write `data` if the stored version is still `expected` (null = first write). False if someone else wrote first. */
export async function writeRow(expected: number | null, data: unknown): Promise<boolean> {
  if (expected === null) {
    const res = await fetch(`${URL_}/rest/v1/biteme_store`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({ id: "main", version: 1, data }),
    });
    if (res.status === 409) return false; // somebody created it first
    if (!res.ok) throw new Error(`Supabase insert failed (${res.status}): ${await res.text()}`);
    return true;
  }
  const res = await fetch(`${URL_}/rest/v1/biteme_store?id=eq.main&version=eq.${expected}`, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify({ version: expected + 1, data }),
  });
  if (!res.ok) throw new Error(`Supabase update failed (${res.status}): ${await res.text()}`);
  return ((await res.json()) as unknown[]).length === 1;
}

/* ---------------- storage (dish photos) ---------------- */

const BUCKET = "dish-images";
let bucketReady: Promise<void> | null = null;

function ensureBucket() {
  return (bucketReady ??= (async () => {
    const res = await fetch(`${URL_}/storage/v1/bucket`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
    // 400/409 = already exists
    if (!res.ok && res.status !== 400 && res.status !== 409) {
      bucketReady = null;
      throw new Error(`Supabase bucket setup failed (${res.status}): ${await res.text()}`);
    }
  })());
}

export async function putImage(name: string, body: Buffer) {
  await ensureBucket();
  const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${name}`, {
    method: "POST",
    headers: headers({ "Content-Type": "image/webp", "x-upsert": "true" }),
    body: new Uint8Array(body),
  });
  if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
}

export async function getImage(name: string): Promise<Buffer | null> {
  const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${name}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}
