import { NextResponse, type NextRequest } from "next/server";
import { listOrders } from "@/lib/db";

const digits = (s: string) => s.replace(/\D/g, "").replace(/^88/, "");

/**
 * Support page "track my order": the guest proves it's theirs with the order code
 * AND the phone number used, and gets back the private tracking link.
 */
export async function POST(req: NextRequest) {
  const { code, phone } = (await req.json().catch(() => ({}))) as { code?: string; phone?: string };
  const c = (code ?? "").trim().toUpperCase().replace(/^BM-?/, "BM-");
  const p = digits(phone ?? "");
  if (!/^BM-\d{3,}$/.test(c) || p.length < 10) {
    return NextResponse.json({ error: "Enter your order code (like BM-1024) and the phone number you ordered with." }, { status: 400 });
  }
  const o = (await listOrders()).find((x) => x.code === c && digits(x.customer.phone) === p);
  if (!o) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return NextResponse.json({ error: "We couldn't find an order with that code and phone number." }, { status: 404 });
  }
  return NextResponse.json({ id: o.id });
}
