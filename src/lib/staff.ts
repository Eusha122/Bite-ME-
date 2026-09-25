import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal staff gate for the kitchen display and admin dashboard.
 * Set STAFF_PIN and STAFF_SECRET in the environment for production.
 */
const PIN = process.env.STAFF_PIN ?? "1234";
const SECRET = process.env.STAFF_SECRET ?? "biteme-dev-secret-change-me";
export const STAFF_COOKIE = "bm_staff";

const sign = (v: string) => crypto.createHmac("sha256", SECRET).update(v).digest("hex");

export function checkPin(pin: string) {
  const a = Buffer.from(pin);
  const b = Buffer.from(PIN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function staffToken() {
  const issued = Date.now().toString();
  return `${issued}.${sign(issued)}`;
}

export async function isStaff() {
  const jar = await cookies();
  const tok = jar.get(STAFF_COOKIE)?.value;
  if (!tok) return false;
  const [issued, mac] = tok.split(".");
  if (!issued || !mac || sign(issued) !== mac) return false;
  return Date.now() - Number(issued) < 1000 * 60 * 60 * 16; // one long shift
}
