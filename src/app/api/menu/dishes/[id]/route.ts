import { NextResponse, type NextRequest } from "next/server";
import { deleteDish, updateDish } from "@/lib/db";
import { parseDishInput } from "@/lib/dishInput";
import { isStaff } from "@/lib/staff";

/** Staff: edit any field of a dish (including its tags, availability and visibility). */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/menu/dishes/[id]">) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = parseDishInput(await req.json().catch(() => null), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const dish = await updateDish(id, parsed.value);
  if (!dish) return NextResponse.json({ error: "That dish no longer exists." }, { status: 404 });
  return NextResponse.json({ dish });
}

/** Staff: remove a dish. Past orders keep their own copy of what was ordered. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/menu/dishes/[id]">) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { id } = await ctx.params;
  const result = await deleteDish(id);
  if (result === "missing") return NextResponse.json({ error: "That dish no longer exists." }, { status: 404 });
  if (result === "locked") return NextResponse.json({ error: "This dish is part of the homepage table film, so it can't be deleted. Hide it instead." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
