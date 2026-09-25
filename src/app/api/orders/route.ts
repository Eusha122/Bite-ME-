import { NextResponse, type NextRequest } from "next/server";
import { createOrder, getSoldOut, listOrders, newId } from "@/lib/db";
import { isStaff } from "@/lib/staff";
import { getItem } from "@/config/menu";
import { site } from "@/config/site";
import type { Order, OrderMode, PaymentMethod } from "@/lib/types";

const MODES: OrderMode[] = ["delivery", "pickup", "dinein"];
const METHODS: PaymentMethod[] = ["bkash", "nagad", "card", "cod"];
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export async function GET(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const since = Number(req.nextUrl.searchParams.get("since") ?? 0);
  const orders = await listOrders();
  return NextResponse.json({ orders: since ? orders.filter((o) => o.createdAt > since) : orders, now: Date.now() });
}

export async function POST(req: NextRequest) {
  let body: {
    mode?: string;
    payment?: string;
    customer?: { name?: string; phone?: string; address?: string; table?: string };
    note?: string;
    lines?: { id: string; qty: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const mode = body.mode as OrderMode;
  const method = body.payment as PaymentMethod;
  const name = body.customer?.name?.trim().slice(0, 80) ?? "";
  const phone = (body.customer?.phone ?? "").replace(/[\s-]/g, "");
  const address = body.customer?.address?.trim().slice(0, 300);
  const table = body.customer?.table?.trim().slice(0, 10);

  if (!MODES.includes(mode)) return NextResponse.json({ error: "Choose delivery, pickup or dine-in." }, { status: 400 });
  if (!METHODS.includes(method)) return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  if (!BD_PHONE.test(phone)) return NextResponse.json({ error: "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)." }, { status: 400 });
  if (mode === "delivery" && (!address || address.length < 6)) return NextResponse.json({ error: "We need a delivery address." }, { status: 400 });
  if (mode === "dinein" && !table) return NextResponse.json({ error: "Which table are you at?" }, { status: 400 });

  // Never trust client prices — rebuild every line from the menu
  const soldOut = await getSoldOut();
  const lines: Order["lines"] = [];
  for (const l of body.lines ?? []) {
    const item = getItem(l.id);
    const qty = Math.floor(Number(l.qty));
    if (!item || !Number.isFinite(qty) || qty < 1 || qty > 50) continue;
    if (soldOut.includes(item.id)) return NextResponse.json({ error: `${item.name} just sold out — please remove it.` }, { status: 409 });
    lines.push({ id: item.id, name: item.name, price: item.price, qty, cuisine: item.cuisine });
  }
  if (!lines.length) return NextResponse.json({ error: "Your tray is empty." }, { status: 400 });

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const vat = Math.round(subtotal * site.delivery.vatRate);
  const delivery = mode === "delivery" && subtotal < site.delivery.freeAbove ? site.delivery.fee : 0;
  const now = Date.now();

  const order = await createOrder({
    id: newId(),
    createdAt: now,
    mode,
    customer: { name, phone, address: mode === "delivery" ? address : undefined, table: mode === "dinein" ? table : undefined },
    note: body.note?.trim().slice(0, 300) || undefined,
    lines,
    totals: { subtotal, vat, delivery, total: subtotal + vat + delivery },
    // Demo mode: wallet/card payments are simulated as paid. Go-live: create an SSLCommerz session here, mark paid from its IPN callback.
    payment: { method, status: method === "cod" ? "cod" : "paid" },
    status: "placed",
    timeline: [{ status: "placed", at: now }],
  });

  return NextResponse.json({ id: order.id, code: order.code });
}
