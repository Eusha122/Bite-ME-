import { NextResponse, type NextRequest } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { isStaff } from "@/lib/staff";
import { nextStatuses, type OrderStatus } from "@/lib/types";

/**
 * The tracking page polls this publicly and only sees what the guest already knows.
 * Staff (receipt / kitchen-ticket printing) get the full order.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (await isStaff()) return NextResponse.json({ ...o, full: true });
  return NextResponse.json({
    id: o.id,
    code: o.code,
    createdAt: o.createdAt,
    mode: o.mode,
    status: o.status,
    timeline: o.timeline,
    lines: o.lines,
    totals: o.totals,
    payment: { method: o.payment.method, status: o.payment.status },
    customer: { name: o.customer.name, table: o.customer.table },
  });
}

type Patch = { status?: OrderStatus; cancelReason?: string; staffNote?: string; markPaid?: boolean };

/**
 * Staff: update an order. Status changes must move forward along the order's flow
 * (or cancel it); delivered and cancelled orders are final.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Patch;

  const existing = await getOrder(id);
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.status && body.status !== existing.status && !nextStatuses(existing).includes(body.status)) {
    return NextResponse.json({ error: `Can't move a ${existing.status} order to ${body.status}.` }, { status: 409 });
  }
  if (body.status === "cancelled" && !body.cancelReason?.trim()) {
    return NextResponse.json({ error: "Give a reason for cancelling." }, { status: 400 });
  }
  if (body.markPaid && existing.payment.status === "paid") {
    return NextResponse.json({ error: "Already paid." }, { status: 409 });
  }

  const o = await updateOrder(id, (o) => {
    const now = Date.now();
    if (body.status && body.status !== o.status) {
      o.status = body.status;
      o.timeline.push({ status: body.status, at: now });
      if (body.status === "cancelled") o.cancelReason = body.cancelReason!.trim().slice(0, 200);
    }
    if (typeof body.staffNote === "string") o.staffNote = body.staffNote.trim().slice(0, 500) || undefined;
    if (body.markPaid) {
      o.payment.status = "paid";
      o.payment.paidAt = now;
    }
  });
  return NextResponse.json({ ok: true, order: o });
}
