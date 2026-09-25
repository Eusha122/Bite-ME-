import { NextResponse, type NextRequest } from "next/server";
import { createDish } from "@/lib/db";
import { parseDishInput, type DishInput } from "@/lib/dishInput";
import { isStaff } from "@/lib/staff";

/** Staff: add a dish to the menu. */
export async function POST(req: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const parsed = parseDishInput(await req.json().catch(() => null), false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const dish = await createDish(parsed.value as DishInput);
  return NextResponse.json({ dish });
}
