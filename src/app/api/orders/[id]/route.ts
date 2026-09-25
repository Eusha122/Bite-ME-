import { NextResponse, type NextRequest } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { isStaff } from "@/lib/staff";
import { ORDER_FLOW, type OrderStatus } from "@/lib/types";

/** Public: the tracking page polls this. Only exposes what the guest already knows. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({
    id: o.id,
    code: o.code,
    createdAt: o.createdAt,
    mode: o.mode,
    status: o.status,
    timeline: o.timeline,
    lines: o.lines,
    totals: o.totals,
    payment: o.payment,
    customer: { name: o.customer.name, table: o.customer.table },
  });
}

/** Staff: move an order along the line. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: OrderStatus };
  const allowed: string[] = [...ORDER_FLOW, "cancelled"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }
  const o = await updateOrder(id, (o) => {
    if (o.status === status) return;
    o.status = status;
    o.timeline.push({ status, at: Date.now() });
  });
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: o.status });
}
