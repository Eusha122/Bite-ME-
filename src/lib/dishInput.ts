import "server-only";
import { cuisines, type CuisineId, type Dish } from "@/config/menu";

/** Fields an admin may set on a dish. */
export type DishInput = Pick<Dish, "name" | "cuisine" | "line" | "description" | "price" | "prepMinutes" | "image" | "fit" | "tags" | "spicy" | "veg" | "available" | "hidden">;

const IMAGE_OK = [/^\/menu\/[a-z0-9-]{1,60}\.webp$/, /^\/api\/uploads\/[a-f0-9-]{36}\.webp$/];

export const MAX_TAG_LENGTH = 24;
export const MAX_TAGS_PER_DISH = 12;

/** Trim, collapse spaces, cap length. Returns "" when nothing usable is left. */
export const cleanTag = (t: unknown) =>
  String(t ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TAG_LENGTH);

const str = (v: unknown, min: number, max: number, label: string): string | { error: string } => {
  const s = String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length < min) return { error: min === 1 ? `${label} is required.` : `${label} must be at least ${min} characters.` };
  if (s.length > max) return { error: `${label} must be ${max} characters or fewer.` };
  return s;
};

const int = (v: unknown, min: number, max: number, label: string): number | { error: string } => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return { error: `${label} must be a whole number between ${min} and ${max}.` };
  return n;
};

const isErr = (x: unknown): x is { error: string } => typeof x === "object" && x !== null && "error" in x;

/**
 * Validate an admin request body. With `partial` (edits) only the fields present are
 * checked; without it (new dish) name, kitchen, price and photo are required.
 */
export function parseDishInput(body: unknown, partial: boolean): { value: Partial<DishInput> } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: Partial<DishInput> = {};
  const has = (k: string) => b[k] !== undefined;

  if (!partial || has("name")) {
    const v = str(b.name, 2, 60, "Name");
    if (isErr(v)) return v;
    out.name = v;
  }
  if (!partial || has("cuisine")) {
    if (!cuisines.some((c) => c.id === b.cuisine)) return { error: "Choose a kitchen." };
    out.cuisine = b.cuisine as CuisineId;
  }
  if (!partial || has("line")) {
    const v = str(b.line ?? "", 0, 90, "The short line");
    if (isErr(v)) return v;
    out.line = v;
  }
  if (!partial || has("description")) {
    const v = str(b.description ?? "", 0, 600, "Description");
    if (isErr(v)) return v;
    out.description = v;
  }
  if (!partial || has("price")) {
    const v = int(b.price, 1, 100000, "Price");
    if (isErr(v)) return v;
    out.price = v;
  }
  if (!partial || has("prepMinutes")) {
    const v = int(b.prepMinutes ?? 15, 1, 180, "Prep time");
    if (isErr(v)) return v;
    out.prepMinutes = v;
  }
  if (!partial || has("image")) {
    const img = String(b.image ?? "");
    if (!IMAGE_OK.some((re) => re.test(img))) return { error: "Upload a photo for this dish." };
    out.image = img;
  }
  if (has("fit")) {
    if (b.fit !== "contain" && b.fit !== "cover") return { error: "Photo fit must be contain or cover." };
    out.fit = b.fit;
  } else if (!partial) out.fit = "cover";
  if (has("tags")) {
    if (!Array.isArray(b.tags)) return { error: "Tags must be a list." };
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const raw of b.tags) {
      const t = cleanTag(raw);
      if (!t || seen.has(t.toLowerCase())) continue;
      seen.add(t.toLowerCase());
      tags.push(t);
    }
    if (tags.length > MAX_TAGS_PER_DISH) return { error: `A dish can have at most ${MAX_TAGS_PER_DISH} tags.` };
    out.tags = tags;
  } else if (!partial) out.tags = [];
  for (const k of ["spicy", "veg", "available", "hidden"] as const) {
    if (has(k)) out[k] = Boolean(b[k]);
  }
  if (!partial) {
    out.available ??= true;
    out.hidden ??= false;
  }
  return { value: out };
}
